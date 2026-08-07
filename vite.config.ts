import { defineConfig, type Plugin } from 'vitest/config';

/**
 * Der Single-File-Build wird von scripts/build.mjs über diese Umgebungsvariable
 * angekündigt. Vite lädt die Konfigurationsdatei für jeden `build()`-Aufruf neu,
 * deshalb wirkt die Umschaltung auch beim zweiten Lauf im selben Prozess.
 */
const SINGLE_FILE = process.env['BUILD_SINGLEFILE'] === '1';

/**
 * Content-Security-Policy.
 *
 * `default-src 'none'` ist der eigentliche Gewinn: Die Seite darf von sich aus
 * nichts laden und nichts senden. Alles Erlaubte steht danach einzeln da — wer
 * die Policy liest, sieht die vollständige Liste dessen, was diese App tun kann.
 *
 * Zwei Varianten, weil die beiden Builds unterschiedlich funktionieren:
 *
 *   Normal (PWA)  Skript, Stil, Schriften und Icons liegen als eigene Dateien
 *                 auf demselben Origin. `worker-src` und `manifest-src` sind
 *                 nötig, sonst blockiert `default-src 'none'` den Service Worker
 *                 und das Manifest. `connect-src 'self'` erlaubt dem
 *                 Update-Mechanismus, den Worker nachzuladen — same-origin, mehr
 *                 nicht.
 *
 *   Single-File   Alles steckt inline bzw. als data:-URI in der einen Datei.
 *                 Kein Service Worker, kein Manifest — und deshalb
 *                 `connect-src 'none'`: Diese Datei kann nachweislich keine
 *                 einzige Netzwerkverbindung aufbauen.
 *
 * `'unsafe-inline'` bei Skript und Stil ist für den Single-File-Build
 * unvermeidbar (dort ist alles inline) und hier unkritisch: Es gibt kein `eval`
 * (`'unsafe-eval'` ist bewusst nicht gesetzt), keine fremde Datenquelle, und
 * sämtliche Nutzereingaben landen ausschließlich über `textContent` im DOM.
 *
 * Nicht enthalten: `frame-ancestors`. Die Direktive wirkt nur als HTTP-Header;
 * in einem <meta>-Tag ignoriert der Browser sie und loggt eine Warnung.
 */
function contentSecurityPolicy(singleFile: boolean): string {
  return [
    "default-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    // Im Single-File-Build stecken die woff2-Dateien als data:-URI im CSS.
    singleFile ? "font-src 'self' data:" : "font-src 'self'",
    singleFile ? "connect-src 'none'" : "connect-src 'self'",
    ...(singleFile ? [] : ["worker-src 'self'", "manifest-src 'self'"]),
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

/**
 * Hängt die CSP nur in den *Build* ein. Im Dev-Server bliebe sonst der
 * HMR-WebSocket an `connect-src` hängen.
 */
function injectContentSecurityPolicy(singleFile: boolean): Plugin {
  return {
    name: '2fa-live:csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: contentSecurityPolicy(singleFile),
          },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

export default defineConfig({
  // Relative Pfade, damit `dist/index.html` auch direkt per file:// funktioniert.
  base: './',
  plugins: [injectContentSecurityPolicy(SINGLE_FILE)],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    // Vite legt sonst ein Polyfill für `<link rel="modulepreload">` ins Bundle,
    // das intern `fetch()` aufruft. Es würde nie feuern, aber in einer App, deren
    // Versprechen „keine fremde Netzwerkanfrage" ist, soll der Aufruf gar nicht
    // erst im Code stehen.
    modulePreload: { polyfill: false },
  },
  server: {
    strictPort: false,
    open: false,
  },
  test: {
    // Alle Tests sind reine Logik-Tests. `crypto.subtle` gibt es in Node global,
    // deshalb brauchen wir kein jsdom.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
