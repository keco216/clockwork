import { defineConfig, type Plugin } from 'vitest/config';

/**
 * Content-Security-Policy für die gebauten Dateien.
 *
 * `default-src 'none'` ist der eigentliche Sicherheitsgewinn: Die Seite darf
 * *nichts* nachladen — kein Skript, kein Bild, keine Schrift, kein `fetch`,
 * kein WebSocket. Selbst wenn sich irgendwann versehentlich ein Fremd-Import
 * einschleicht, blockiert der Browser ihn. Damit ist "das Secret verlässt den
 * Rechner nie" nicht nur eine Behauptung, sondern vom Browser erzwungen.
 *
 * WARUM `'unsafe-inline'`? Der Single-File-Build packt JS und CSS als Inline-Tags
 * in die HTML-Datei — ohne diese Erlaubnis würde die Datei gar nicht starten.
 * Das ist hier unkritisch: Es gibt keine serverseitige Datenquelle, kein `eval`
 * (`'unsafe-eval'` ist bewusst NICHT gesetzt) und sämtliche Nutzereingaben landen
 * ausschließlich über `textContent` im DOM, nie als HTML.
 *
 * Nicht enthalten: `frame-ancestors`. Diese Direktive wirkt nur als HTTP-Header;
 * in einem <meta>-Tag würde sie der Browser ignorieren und eine Warnung loggen.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

/**
 * Hängt die CSP nur in den *Build* ein. Im Dev-Server bliebe sonst der
 * HMR-WebSocket an `connect-src 'none'` hängen.
 */
function injectContentSecurityPolicy(): Plugin {
  return {
    name: '2fa-live:csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

export default defineConfig({
  // Relative Pfade, damit `dist/index.html` auch direkt per file:// funktioniert.
  base: './',
  plugins: [injectContentSecurityPolicy()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    // Fail fast statt still auf einen anderen Port ausweichen.
    strictPort: false,
    open: false,
  },
  test: {
    // Alle Tests sind reine Logik-Tests. `crypto.subtle` gibt es in Node ab v16
    // global, deshalb brauchen wir kein jsdom.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
