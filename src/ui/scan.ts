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

import { decodeQr, decodeQrFromBlob } from './qr-decode';
import { requireElement } from './dom';

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

  let stream: MediaStream | null = null;
  let scanTimer = 0;

  /* ── Bilddatei ──────────────────────────────────────────────────────────── */

  async function readImage(blob: Blob, origin: string): Promise<void> {
    try {
      const text = await decodeQrFromBlob(blob);
      if (text === null) {
        handlers.onProblem(`In ${origin} war kein QR-Code zu erkennen.`);
        return;
      }
      handlers.onResult(text);
    } catch {
      handlers.onProblem(`${origin} konnte nicht gelesen werden — ist es wirklich ein Bild?`);
    }
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) {
      void readImage(file, 'dem Bild');
    }
    // Zurücksetzen, damit dieselbe Datei ein zweites Mal ausgewählt werden kann.
    fileInput.value = '';
  });

  requireElement<HTMLButtonElement>(document, '#key-file').addEventListener('click', () => {
    fileInput.click();
  });

  /* ── Kamera ─────────────────────────────────────────────────────────────── */

  async function startCamera(): Promise<void> {
    if (stream) {
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      handlers.onProblem(
        'Diese Umgebung gibt keine Kamera frei. Beim Öffnen als Datei (file://) sperren die ' +
          'meisten Browser sie — „QR aus Bild" funktioniert dort immer.',
      );
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
    hint.textContent = 'QR-Code in den Rahmen halten';
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
    viewfinder.hidden = true;
  }

  requireElement<HTMLButtonElement>(document, '#key-camera').addEventListener('click', () => {
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
    void readImage(file, 'dem gezogenen Bild');
  };

  const onPaste = (event: ClipboardEvent): void => {
    const item = [...(event.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
    const file = item?.getAsFile();
    if (!file) {
      return; // Text einfügen macht das Textfeld selbst
    }
    event.preventDefault();
    void readImage(file, 'dem eingefügten Bild');
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
      return 'Die Kamera wurde abgelehnt. Erlaubnis im Browser zurücksetzen — oder „QR aus Bild" nehmen.';
    case 'NotFoundError':
      return 'Es ist keine Kamera angeschlossen. „QR aus Bild" funktioniert trotzdem.';
    case 'NotReadableError':
      return 'Die Kamera wird gerade von einem anderen Programm benutzt.';
    default:
      return 'Die Kamera ließ sich nicht starten. „QR aus Bild" funktioniert immer.';
  }
}
