/**
 * Legt den Web-Inhalt für den Android-Wrap nach `dist-android/`.
 *
 * Capacitor erwartet ein Verzeichnis mit einer index.html (`webDir` in
 * capacitor.config.json). Clockwork nimmt dafür bewusst die Einzeldatei
 * `dist/clockwork.html` und nicht den PWA-Bau:
 *
 *   - Kein Service Worker. Die Dateien liegen ohnehin im APK — ein Cache über
 *     lokalen Dateien wäre eine zweite Update-Maschinerie ohne Nutzen. Ein
 *     Update kommt als neues APK, so wie es auf Android gedacht ist.
 *   - `connect-src 'none'`. Die schärfere CSP der Einzeldatei gilt damit
 *     wörtlich auch in der App: Sie KANN keine Netzwerkverbindung aufbauen.
 *
 * Dieses Skript BAUT NICHT, es kopiert nur (dieselbe Arbeitsteilung wie bei
 * check-bundle.mjs — und dieselbe Falle: wer es allein aufruft, verpackt den
 * vorigen Bau). `npm run android` verkettet deshalb Bau und Kopie; wer das
 * Skript einzeln benutzt, muss vorher `npm run build` laufen lassen.
 */
import { mkdir, rm, copyFile, stat, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'dist', 'clockwork.html');

// Das Zielverzeichnis steht in der Capacitor-Konfiguration und wird von dort
// gelesen, nicht hier wiederholt: android-sync.mjs kopiert genau dieses
// Verzeichnis weiter, und zwei Stellen mit demselben Namen laufen früher oder
// später auseinander.
const { webDir } = JSON.parse(await readFile(path.join(root, 'capacitor.config.json'), 'utf8'));
const outDir = path.join(root, webDir);

let size;
try {
  ({ size } = await stat(source));
} catch {
  throw new Error(
    'dist/clockwork.html fehlt — erst `npm run build`, dann dieses Skript ' +
      '(oder gleich `npm run android`, das verkettet beides).',
  );
}

// Das Verzeichnis wird jedes Mal frisch aufgebaut: Läge hier noch eine Datei
// aus einem früheren Stand, nähme `cap sync` sie stillschweigend mit ins APK.
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await copyFile(source, path.join(outDir, 'index.html'));

console.log(
  `✓ ${webDir}/index.html — die Einzeldatei als App-Inhalt, ` +
    `${(size / 1000).toFixed(0)} kB (dezimal) = ${(size / 1024).toFixed(0)} KiB`,
);
