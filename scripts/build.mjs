/**
 * Zwei Builds in einem Befehl:
 *
 *   1. `dist/`               — normaler Build (HTML + separate JS/CSS-Assets).
 *   2. `dist/2fa-live.html`  — EINE Datei, in der HTML, CSS und JS inline stecken.
 *                              Genau die Datei kann man auf einen USB-Stick legen,
 *                              per Doppelklick öffnen und offline benutzen.
 *
 * Warum ein eigenes Skript statt zweier `vite build`-Aufrufe in package.json?
 * Beide Builds würden dieselbe `dist/index.html` schreiben. Deshalb baut der
 * Single-File-Lauf nach `dist-single/` und wir benennen das Ergebnis danach um.
 */
import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { copyFile, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const distSingle = path.join(root, 'dist-single');
const singleFileName = '2fa-live.html';

// --- 1. Normaler Build ------------------------------------------------------
console.log('\n▸ Build 1/2: normaler Build → dist/');
await build({ root, mode: 'production', configFile: path.join(root, 'vite.config.ts') });

// --- 2. Single-File-Build ---------------------------------------------------
// Eigener Ordner, weil beide Builds sonst dieselbe `index.html` schreiben
// würden. Er wird gleich nach dem Umkopieren wieder gelöscht.
console.log(`\n▸ Build 2/2: Single-File → dist/${singleFileName}`);
await build({
  root,
  mode: 'production',
  configFile: path.join(root, 'vite.config.ts'),
  plugins: [viteSingleFile()],
  build: {
    outDir: distSingle,
    emptyOutDir: true,
    // Sourcemaps ließen sich nicht inlinen, ohne die Datei zu verdoppeln.
    sourcemap: false,
    cssCodeSplit: false,
  },
});

// --- 3. Einsammeln ----------------------------------------------------------
const target = path.join(dist, singleFileName);
await copyFile(path.join(distSingle, 'index.html'), target);
await rm(distSingle, { recursive: true, force: true });

const { size } = await stat(target);
console.log(`\n✓ Fertig.`);
console.log(`  dist/index.html        — normaler Build (für Dev-Server / Preview)`);
console.log(`  dist/${singleFileName}  — komplett offline, ${(size / 1024).toFixed(1)} kB`);
