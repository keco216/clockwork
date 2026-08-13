import { defineConfig, type Plugin } from 'vitest/config';

// Mit Dateiendung, anders als überall sonst im Projekt: Vite lädt seine
// Konfiguration künftig über Nodes eigenen TypeScript-Modus, und der verlangt
// den vollständigen Pfad. Ohne die Endung warnt Vite schon heute.
import { contentSecurityPolicy } from './scripts/csp.ts';
import {
  ENV_KEY,
  requestedLocales,
  stripNativeKeysPlugin,
  subsetLocalePlugin,
} from './scripts/locale-subset.ts';
import { SITE_URL } from './scripts/site.ts';

/**
 * Der Single-File-Build wird von scripts/build.mjs über diese Umgebungsvariable
 * angekündigt. Vite lädt die Konfigurationsdatei für jeden `build()`-Aufruf neu,
 * deshalb wirkt die Umschaltung auch beim zweiten Lauf im selben Prozess.
 */
const SINGLE_FILE = process.env['BUILD_SINGLEFILE'] === '1';

/**
 * Die Sprachauswahl zur Bauzeit (`CLOCKWORK_LANGS=de,en,fr npm run build`).
 * `null` heißt: alle 37. Gelesen wird beim Laden der Konfiguration — und weil
 * Vite sie je `build()`-Aufruf neu lädt, gilt dieselbe Auswahl für beide
 * Build-Ziele.
 */
const LOCALE_SELECTION = requestedLocales(process.env[ENV_KEY]);

/**
 * Setzt die Adresse der Seite in die Platzhalter von `index.html` ein.
 *
 * In der Quelldatei steht `%SITE_URL%`, im Ergebnis die Adresse aus
 * `scripts/site.ts`. Das betrifft vier Angaben: `canonical`, `og:url` und die
 * beiden Vorschaubilder.
 *
 * ── Warum das nicht einfach hartcodiert bleibt ─────────────────────────────
 * Weil es das schon war, und weil genau das schiefging: V4 sollte die Adresse
 * zentral halten, tat es nicht, und als der Wunschname beim Import vergeben war,
 * mussten sechs Stellen von Hand nachgezogen werden. Vier davon stehen hier.
 *
 * `enforce: 'pre'` ist hier NICHT nötig — anders als beim Sprach-Subset wird
 * kein Quelltext gelesen, sondern nur das fertige HTML ersetzt. Und bewusst
 * ohne `apply: 'build'`: Im Dev-Server soll dieselbe Adresse dastehen, sonst
 * sähe man den Platzhalter im Seitenquelltext und fragte sich, ob er im
 * Ergebnis auch dort steht.
 */
function injectSiteUrl(): Plugin {
  return {
    name: 'clockwork:site-url',
    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', SITE_URL);
    },
  };
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

/**
 * Lädt die beiden lateinischen Schriftschnitte im PWA-Build vor.
 *
 * ── Warum das in V3 dazukam ────────────────────────────────────────────────
 * In V2 stand hier ausdrücklich KEIN Preload, und der Grund galt: Im
 * Single-File-Build stecken die Schriften als data:-URI im CSS; ein
 * Preload-Link würde dieselben Bytes ein zweites Mal in die Datei schreiben.
 *
 * Mit den 37 Sprachkatalogen wiegt das Bündel aber rund 480 kB statt 160 kB.
 * Damit verschiebt sich die Reihenfolge: Der Browser malt einmal in der
 * Ersatzschrift, und wenn Instrument Sans nachrückt, springt der Umbruch —
 * Lighthouse maß dafür einen Layout-Shift von 0,13. Der Preload holt die
 * Schrift wieder vor den ersten Anstrich.
 *
 * Deshalb hängt er am selben Schalter wie die CSP: PWA ja, Single-File nein.
 * Dort ist er auch gar nicht nötig — die Schrift steht in derselben Datei und
 * ist da, sobald das CSS gelesen ist.
 *
 * Vorgeladen werden nur die beiden `latin`-Schnitte, die JEDE Sprache braucht.
 * `latin-ext` bleibt außen vor: Den fordert der Browser über `unicode-range`
 * nur an, wenn wirklich ein polnisches ł oder ein tschechisches ř vorkommt.
 */
function preloadLatinFonts(singleFile: boolean): Plugin {
  return {
    name: 'clockwork:font-preload',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(_html, context) {
      if (singleFile || context.bundle === undefined) {
        return [];
      }
      return Object.keys(context.bundle)
        .filter((file) => /-latin-wght-normal-[^/]*\.woff2$/.test(file))
        .map((file) => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            href: `./${file}`,
            // Schriften werden immer anonym per CORS geholt — ohne dieses
            // Attribut lädt der Browser die Datei ein zweites Mal.
            crossorigin: '',
          },
          injectTo: 'head-prepend' as const,
        }));
    },
  };
}

export default defineConfig({
  // Relative Pfade, damit `dist/index.html` auch direkt per file:// funktioniert.
  base: './',
  plugins: [
    injectSiteUrl(),
    injectContentSecurityPolicy(SINGLE_FILE),
    preloadLatinFonts(SINGLE_FILE),
    subsetLocalePlugin(LOCALE_SELECTION),
    // Nimmt die `native.`-Schlüssel aus den Sprachdateien. Sie stehen im
    // gemeinsamen Katalog, damit der Compiler sie in allen 37 Sprachen prüft —
    // ins Web-Bündel gehören sie nicht (Begründung in src/i18n/strings.ts).
    stripNativeKeysPlugin(),
  ],
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
    // Auch `scripts/`: Die Sprachauswahl zur Bauzeit ist Werkzeug, kein
    // App-Code, hat aber genauso Fehler wie alles andere.
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
