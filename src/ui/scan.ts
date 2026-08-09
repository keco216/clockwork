/**
 * QR-Import: Kamera, Bilddatei, Drag & Drop und Einfügen aus der Zwischenablage.
 *
 * Vier Wege, weil keiner davon überall funktioniert:
 *
 *   • Bilddatei  — funktioniert IMMER, auch bei `file://`. Deshalb ist es der
 *                  erste Knopf und nicht die Kamera.
 *   • Kamera     — braucht einen sicheren Kontext und eine Erlaubnis. Bei einer
 *                  per Doppelklick geöffneten HTML-Datei blockieren viele
 *                  Browser sie; darauf weist die App hin, statt einen leeren
 *                  Sucher zu zeigen.
 *   • Ziehen     — Screenshot direkt ins Fenster ziehen.
 *   • Einfügen   — Screenshot mit Strg+V, ohne ihn vorher zu speichern.
 *
 * Alle vier enden im selben Aufruf: `onResult(text)` mit dem Inhalt des Codes.
 * Was daraus wird, entscheidet der Aufrufer.
 */

import { t } from '../i18n/runtime';
import { decodeQr, decodeQrFromBlob } from './qr-decode';
import { requireElement, setPending } from './dom';

/** Wie oft das Kamerabild geprüft wird. 8/s reicht — mehr kostet nur Akku. */
const SCAN_INTERVAL_MS = 125;

export interface ScanHandlers {
  /** Ein Code wurde gelesen. */
  onResult(text: string): void;
  /** Etwas ging schief oder es war nichts zu finden. */
  onProblem(message: string): void;
}

export interface Scanner {
  stop(): void;
}

export function startScanner(handlers: ScanHandlers): Scanner {
  const fileInput = requireElement<HTMLInputElement>(document, '#file-input');
  const viewfinder = requireElement(document, '#viewfinder');
  const video = requireElement<HTMLVideoElement>(document, '#viewfinder-video');
  const hint = requireElement(document, '#viewfinder-hint');
  // Oben geholt und nicht erst beim Anmelden des Klicks: stopCamera() gibt den
  // Fokus an diesen Knopf zurück und steht weiter unten.
  const cameraKey = requireElement<HTMLButtonElement>(document, '#key-camera');
  // „QR aus Bild" trägt den Wartezeiger, die Eingabezone das `aria-busy` —
  // auch beim Ziehen und Einfügen: Es ist dieselbe Arbeit, und diese Taste ist
  // ihr sichtbarer Vertreter.
  const fileKey = requireElement<HTMLButtonElement>(document, '#key-file');
  const inputZone = requireElement(document, '#zone-input');

  let stream: MediaStream | null = null;
  let scanTimer = 0;

  /* ── Bilddatei ──────────────────────────────────────────────────────────── */

  /* ── Warum das Dekodieren einen Wartezeiger bekommt ───────────────────────
     Weil es messbar dauert. Gemessen über den echten Weg (Datei ins Feld, Zeit
     bis die Rückmeldung steht, jsQR-Pfad ohne eingebauten `BarcodeDetector`):

       Handy-Screenshot 1080 × 2400     87 · 98 · 94 ms
       Schreibtisch-Screenshot 1440    234 · 157 · 154 ms
       Schreibtisch-Screenshot 2560    522 · 544 · 640 ms

     Die 150-ms-Schwelle, ab der eine Rückmeldung nötig ist, wird also im
     häufigsten Fall überschritten — jemand macht ein Bildschirmfoto der
     Einrichtungsseite, und das ist so breit wie sein Bildschirm. Mit dem
     eingebauten Detektor (Chrome, Android-WebView) liegt es darunter; ohne ihn
     (Firefox, Safari, `file://`) nicht, und genau dort läuft jsQR.

     Kein `disabled` an der Taste: Eine Taste, die den Fokus hält und gesperrt
     wird, gibt ihn nicht weiter. Gegen ein zweites Bild in derselben Sekunde
     hilft die Sperre unten, und die kostet keinen Fokus. */
  let decoding = false;

  /**
   * Die Meldung unterscheidet nicht mehr, WOHER das Bild kam („dem gezogenen
   * Bild", „dem eingefügten Bild"). In V2 war das eine deutsche Genitiv-Fügung;
   * über 37 Sprachen hinweg wäre daraus entweder eine Grammatikfalle geworden
   * (der Kasus hängt an der Präposition) oder sechs statt zwei Sätze. Wer
   * gerade ein Bild eingefügt hat, weiß ohnehin, welches gemeint ist.
   */
  async function readImage(blob: Blob): Promise<void> {
    if (decoding) {
      return;
    }
    decoding = true;
    setPending(fileKey, inputZone, true);
    try {
      const text = await decodeQrFromBlob(blob);
      if (text === null) {
        handlers.onProblem(t('scan.noQr'));
        return;
      }
      handlers.onResult(text);
    } catch {
      handlers.onProblem(t('scan.unreadable'));
    } finally {
      decoding = false;
      setPending(fileKey, inputZone, false);
    }
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) {
      void readImage(file);
    }
    // Zurücksetzen, damit dieselbe Datei ein zweites Mal ausgewählt werden kann.
    fileInput.value = '';
  });

  fileKey.addEventListener('click', () => {
    fileInput.click();
  });

  /* ── Kamera ─────────────────────────────────────────────────────────────── */

  async function startCamera(): Promise<void> {
    if (stream) {
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      handlers.onProblem(t('scan.camera.unavailable'));
      return;
    }

    try {
      // `facingMode: environment` wählt auf dem Handy die Rückkamera. Kein
      // `exact`, damit ein Laptop ohne Rückkamera trotzdem die vorhandene nimmt.
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (error) {
      handlers.onProblem(describeCameraError(error));
      return;
    }

    video.srcObject = stream;
    viewfinder.hidden = false;
    hint.textContent = t('viewfinder.hint');
    await video.play();

    scanTimer = window.setInterval(() => {
      void scanFrame();
    }, SCAN_INTERVAL_MS);
  }

  async function scanFrame(): Promise<void> {
    if (!stream || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }
    let text: string | null;
    try {
      text = await decodeQr(video);
    } catch {
      return; // einzelne verunglückte Frames sind normal
    }
    if (text !== null) {
      stopCamera();
      handlers.onResult(text);
    }
  }

  function stopCamera(): void {
    window.clearInterval(scanTimer);
    scanTimer = 0;
    // Jede Spur einzeln stoppen — sonst bleibt die Kameraleuchte an.
    for (const track of stream?.getTracks() ?? []) {
      track.stop();
    }
    stream = null;
    video.srcObject = null;

    /* Wer den Sucher mit „Kamera aus" schließt, steht mit dem Fokus AUF diesem
       Knopf — und der verschwindet gleich mit. Ein Element, das den Fokus hält
       und `hidden` wird, gibt ihn nicht weiter: Der Browser setzt ihn auf
       <body> zurück, und wer mit der Tastatur bedient, steht wieder ganz oben
       im Dokument und tabbt sich durch den halben Kopf zurück.

       Deshalb erst fragen, ob der Fokus überhaupt im Sucher liegt, und nur
       dann zurückgeben. Sonst würde ein Treffer der Kamera (stopCamera läuft
       auch dort) den Fokus aus dem Feld reißen, in das gerade jemand tippt. */
    const returnFocus = viewfinder.contains(document.activeElement);
    viewfinder.hidden = true;
    if (returnFocus) {
      cameraKey.focus();
    }
  }

  cameraKey.addEventListener('click', () => {
    void startCamera();
  });
  requireElement<HTMLButtonElement>(document, '#key-camera-stop').addEventListener(
    'click',
    stopCamera,
  );

  // Kamera aus, sobald der Tab in den Hintergrund geht: Ein laufender Sucher,
  // den niemand sieht, ist verschwendeter Akku und ein unnötiges Datenrisiko.
  const onVisibility = (): void => {
    if (document.visibilityState !== 'visible') {
      stopCamera();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  /* ── Ziehen und Einfügen ────────────────────────────────────────────────── */

  const onDragOver = (event: DragEvent): void => {
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      document.body.classList.add('is-dropping');
    }
  };

  const onDragLeave = (event: DragEvent): void => {
    if (event.relatedTarget === null) {
      document.body.classList.remove('is-dropping');
    }
  };

  const onDrop = (event: DragEvent): void => {
    const file = [...(event.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'));
    if (!file) {
      return;
    }
    event.preventDefault();
    document.body.classList.remove('is-dropping');
    void readImage(file);
  };

  const onPaste = (event: ClipboardEvent): void => {
    const item = [...(event.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
    const file = item?.getAsFile();
    if (!file) {
      return; // Text einfügen macht das Textfeld selbst
    }
    event.preventDefault();
    void readImage(file);
  };

  document.addEventListener('dragover', onDragOver);
  document.addEventListener('dragleave', onDragLeave);
  document.addEventListener('drop', onDrop);
  document.addEventListener('paste', onPaste);

  return {
    stop(): void {
      stopCamera();
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('drop', onDrop);
      document.removeEventListener('paste', onPaste);
    },
  };
}

/** Die Fehler von `getUserMedia` in Sätze übersetzen, die weiterhelfen. */
function describeCameraError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
      return t('scan.camera.denied');
    case 'NotFoundError':
      return t('scan.camera.notFound');
    case 'NotReadableError':
      return t('scan.camera.busy');
    default:
      return t('scan.camera.failed');
  }
}
