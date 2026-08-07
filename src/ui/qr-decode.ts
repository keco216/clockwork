/**
 * QR-Codes lesen.
 *
 * Zwei Wege, in dieser Reihenfolge:
 *
 *   1. `BarcodeDetector` — im Browser eingebaut, nutzt die Systembibliothek,
 *      läuft außerhalb des Hauptthreads und ist deutlich schneller. Verfügbar in
 *      Chrome/Edge/Android; Firefox und Safari (Desktop) haben es nicht.
 *   2. jsQR — reine JavaScript-Bibliothek, wird mitgebündelt.
 *
 * Warum eine fremde Bibliothek erlaubt ist: Ein QR-Decoder ist Bildverarbeitung
 * (Reed-Solomon-Fehlerkorrektur, perspektivische Entzerrung), keine Kryptografie.
 * Er sieht nur Pixel und liefert Text; die OTP-Berechnung bleibt vollständig
 * unsere eigene. jsQR macht außerdem keine einzige Netzwerkanfrage.
 */

import jsQR from 'jsqr';

/**
 * Der `BarcodeDetector` steht nicht in den TypeScript-DOM-Typen. Statt `any`
 * hier die minimale Beschreibung dessen, was wir wirklich benutzen — so bleibt
 * der Aufruf typgeprüft.
 */
interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource): Promise<{ rawValue: string }[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

let nativeDetector: BarcodeDetectorLike | null | undefined;

/** Legt den eingebauten Detektor an — einmal, oder merkt sich, dass es keinen gibt. */
function getNativeDetector(): BarcodeDetectorLike | null {
  if (nativeDetector !== undefined) {
    return nativeDetector;
  }
  const constructor = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;
  try {
    nativeDetector = constructor ? new constructor({ formats: ['qr_code'] }) : null;
  } catch {
    nativeDetector = null;
  }
  return nativeDetector;
}

/**
 * Liest einen QR-Code aus Bilddaten.
 * Gibt den enthaltenen Text zurück oder `null`, wenn kein Code zu finden war.
 */
export async function decodeQr(source: ImageBitmap | HTMLVideoElement): Promise<string | null> {
  const detector = getNativeDetector();
  if (detector) {
    try {
      const [first] = await detector.detect(source);
      if (first) {
        return first.rawValue;
      }
      // Kein Treffer heißt hier wirklich „kein Code im Bild" — dann lohnt der
      // teurere zweite Weg nicht.
      return null;
    } catch {
      // Manche Systeme melden Unterstützung und scheitern trotzdem. Dann eben
      // jsQR — und beim nächsten Mal gar nicht erst wieder versuchen.
      nativeDetector = null;
    }
  }

  return decodeWithJsQr(source);
}

/**
 * Liest einen QR-Code aus einer Bilddatei (Datei-Auswahl, Drag & Drop,
 * Zwischenablage).
 */
export async function decodeQrFromBlob(blob: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(blob);
  try {
    return await decodeQr(bitmap);
  } finally {
    // Ein ImageBitmap belegt Speicher außerhalb des GC. Bei einem Foto aus der
    // Handykamera sind das schnell 30 MB, die sonst bis zur nächsten
    // Speicherbereinigung liegen bleiben.
    bitmap.close();
  }
}

/**
 * Der Rückfallweg: Bild auf eine Leinwand zeichnen, Pixel auslesen, jsQR fragen.
 *
 * `willReadFrequently: true` ist wichtig — ohne den Hinweis legt der Browser die
 * Leinwand auf der GPU ab, und jedes `getImageData` muss sie zurückholen. Beim
 * Kamerabetrieb (mehrmals pro Sekunde) ist das der Unterschied zwischen flüssig
 * und ruckelnd.
 */
function decodeWithJsQr(source: ImageBitmap | HTMLVideoElement): string | null {
  const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  if (width === 0 || height === 0) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return null;
  }

  context.drawImage(source, 0, 0, width, height);
  const image = context.getImageData(0, 0, width, height);

  // `attemptBoth` liest auch invertierte Codes (heller Code auf dunklem Grund) —
  // genau die kommen bei Screenshots im Dunkelmodus vor.
  const found = jsQR(image.data, image.width, image.height, {
    inversionAttempts: 'attemptBoth',
  });

  return found?.data ?? null;
}
