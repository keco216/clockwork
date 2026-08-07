/**
 * Zwei Build-Ziele in einem Befehl:
 *
 *   1. `dist/`               — installierbare PWA: HTML, JS, CSS, Schriften,
 *                              Icons, Manifest und Service Worker. Komplett
 *                              offline nutzbar, aber als echte Web-App.
 *   2. `dist/clockwork.html`  — EINE Datei, in der alles inline steckt. Auf einen
 *                              USB-Stick legen, doppelklicken, fertig. Bewusst
 *                              OHNE Service Worker: Eine einzelne Datei braucht
 *                              keinen Cache, und ohne Worker gilt dort die
 *                              schärfere CSP mit `connect-src 'none'`.
 *
 * Warum ein eigenes Skript und nicht zwei `vite build`-Aufrufe? Beide Builds
 * würden dieselbe `dist/index.html` schreiben. Der Single-File-Lauf baut deshalb
 * nach `dist-single/`, und das Ergebnis wird danach umbenannt eingesammelt.
 */
import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { VitePWA } from 'vite-plugin-pwa';
import { copyFile, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configFile = path.join(root, 'vite.config.ts');
const dist = path.join(root, 'dist');
const distSingle = path.join(root, 'dist-single');
const singleFileName = 'clockwork.html';

// --- 0. Icons -----------------------------------------------------------------
console.log('\n▸ Icons erzeugen');
execFileSync(process.execPath, [path.join(root, 'scripts', 'icons.mjs')], { stdio: 'inherit' });

// --- 1. PWA-Build -------------------------------------------------------------
console.log('\n▸ Build 1/2: installierbare PWA → dist/');
delete process.env.BUILD_SINGLEFILE;
await build({
  root,
  mode: 'production',
  configFile,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // Keine Registrierung im Dev-Server: Ein Service Worker, der beim
      // Entwickeln alte Dateien ausliefert, kostet nur Nerven.
      devOptions: { enabled: false },
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Clockwork — TOTP Authenticator',
        short_name: 'Clockwork',
        description:
          'Erzeugt Zwei-Faktor-Codes vollständig im Browser. Keine Netzwerkanfragen, ' +
          'standardmäßig keine Speicherung.',
        lang: 'de',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#131210',
        theme_color: '#131210',
        categories: ['utilities', 'security'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Alles wird vorab in den Cache gelegt. Die App ist klein genug, dass ein
        // Nachladen bei Bedarf keinen Sinn ergäbe — und „offline nutzbar" heißt
        // vollständig, nicht teilweise.
        globPatterns: ['**/*.{html,js,css,woff2,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // Bewusst KEINE runtimeCaching-Regeln: Es gibt keine fremden Origins,
        // die zu cachen wären. Eine leere Liste ist hier die Aussage.
        runtimeCaching: [],
      },
    }),
  ],
});

// --- 2. Single-File-Build -----------------------------------------------------
console.log(`\n▸ Build 2/2: Single-File → dist/${singleFileName}`);
process.env.BUILD_SINGLEFILE = '1';
await build({
  root,
  mode: 'production',
  configFile,
  plugins: [viteSingleFile()],
  build: {
    outDir: distSingle,
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    // Schriften und Icons müssen als data:-URI ins CSS bzw. HTML wandern,
    // sonst wäre die „eine Datei" auf Nachbardateien angewiesen.
    assetsInlineLimit: 10 * 1024 * 1024,
  },
});

// --- 3. Einsammeln ------------------------------------------------------------
const target = path.join(dist, singleFileName);
await copyFile(path.join(distSingle, 'index.html'), target);
await rm(distSingle, { recursive: true, force: true });

const { size } = await stat(target);
console.log('\n✓ Fertig.');
console.log('  dist/                  — installierbare PWA (Service Worker + Manifest)');
console.log(
  `  dist/${singleFileName}   — eine Datei, komplett offline, ${(size / 1024).toFixed(0)} kB`,
);
