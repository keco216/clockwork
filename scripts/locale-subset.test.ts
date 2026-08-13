/**
 * Die Sprachauswahl zur Bauzeit.
 *
 * Der Kern ist Textarbeit an `catalogue.ts` — die lässt sich unmittelbar
 * prüfen. Die eigentliche Behauptung aber lautet: „Die abgewählten Sprachen
 * sind aus dem Bündel verschwunden." Das kann kein Textvergleich zeigen,
 * sondern nur ein echter Build. Deshalb baut der Test unten wirklich — das
 * kostet rund eine Zehntelsekunde — und sieht in der entstandenen Datei nach.
 *
 * Der zweite Teil des Auftrags — die Vollständigkeitsprüfungen dürfen von der
 * Auswahl nichts mitbekommen — steht ganz unten und ist eine Aussage über die
 * Bauart, nicht über einen Einzelfall.
 */

import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';
import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import { CATALOGUE } from '../src/i18n/catalogue';
import de from '../src/i18n/locales/de';
import en from '../src/i18n/locales/en';
import fr from '../src/i18n/locales/fr';
import ja from '../src/i18n/locales/ja';
import nl from '../src/i18n/locales/nl';
import ru from '../src/i18n/locales/ru';
import {
  ENV_KEY,
  NATIVE_PLUGIN_NAME,
  PLUGIN_NAME,
  readCatalogue,
  requestedLocales,
  stripNativeKeys,
  stripNativeKeysPlugin,
  subsetCatalogue,
  subsetLocalePlugin,
} from './locale-subset';

const root = fileURLToPath(new URL('..', import.meta.url));
const cataloguePath = path.join(root, 'src', 'i18n', 'catalogue.ts');
const outDir = path.join(root, 'dist-test');

const SOURCE = await readFile(cataloguePath, 'utf8');

/* ── Der Leser ─────────────────────────────────────────────────────────── */

describe('readCatalogue()', () => {
  it('findet jede Sprache, die wirklich im Katalog steht', () => {
    const codes = readCatalogue(SOURCE).map((entry) => entry.code);
    expect(codes).toEqual(Object.keys(CATALOGUE));
  });

  it('erkennt beide Schreibweisen eines Eintrags', () => {
    const entries = readCatalogue(SOURCE);
    // Kurzform `de,` …
    expect(entries.find((entry) => entry.code === 'de')?.binding).toBe('de');
    // … und die Langform `'pt-PT': ptPT,`, die ein Bindestrich erzwingt.
    expect(entries.find((entry) => entry.code === 'pt-PT')?.binding).toBe('ptPT');
  });

  it('meldet sich, wenn Schlüssel und Dateiname auseinandergehen', () => {
    // Der Fehler, der sonst niemandem auffiele: Die App zeigt »fr« an und
    // spricht Italienisch.
    const broken = SOURCE.replace(
      "import fr from './locales/fr';",
      "import fr from './locales/it';",
    );
    expect(() => readCatalogue(broken)).toThrow(/Schlüssel und Dateiname/);
  });

  it('meldet sich, wenn der Katalog seine Form verliert', () => {
    expect(() => readCatalogue('export const NICHTS = 1;\n')).toThrow(/CATALOGUE/);
  });
});

/* ── Die Auswahl ───────────────────────────────────────────────────────── */

describe('requestedLocales()', () => {
  it('gibt ohne Variable »alle« zurück', () => {
    expect(requestedLocales(undefined)).toBeNull();
  });

  it('wertet eine leere Angabe als »nicht gewählt«', () => {
    expect(requestedLocales('')).toBeNull();
    expect(requestedLocales('  ,  , ')).toBeNull();
  });

  it('zerlegt die Liste und räumt Leerzeichen weg', () => {
    expect(requestedLocales('de, en ,fr')).toEqual(['de', 'en', 'fr']);
    expect(requestedLocales('zh-Hant')).toEqual(['zh-Hant']);
  });
});

describe('subsetCatalogue()', () => {
  it('behält genau die gewünschten Sprachen', () => {
    const result = subsetCatalogue(SOURCE, ['de', 'fr']);
    expect(result.kept).toEqual(['de', 'en', 'fr']);
    expect(readCatalogue(result.code).map((entry) => entry.code)).toEqual(['de', 'en', 'fr']);
    expect(result.dropped).toHaveLength(34);
    expect(result.dropped).toContain('ja');
  });

  it('nimmt Englisch auch ungefragt mit', () => {
    // Ohne Basissprache gäbe es keinen Rückfall, wenn in einer Übersetzung ein
    // Schlüssel fehlt.
    const result = subsetCatalogue(SOURCE, ['ja']);
    expect(result.kept).toEqual(['en', 'ja']);
  });

  it('entfernt auch die Import-Zeile, nicht nur den Eintrag', () => {
    // Bliebe der Import stehen, wäre die Sprachdatei weiterhin im Modulgraphen
    // und das Bündel keinen Deut kleiner — der Test darauf ist der Kern des
    // Ganzen.
    const result = subsetCatalogue(SOURCE, ['de']);
    expect(result.code).not.toContain("from './locales/ja'");
    expect(result.code).toContain("from './locales/de'");
    expect(result.code).toContain("from './locales/en'");
  });

  it('lässt die Zeilennummern stehen', () => {
    // Geleert, nicht gelöscht: Sonst zeigt jede spätere Meldung über
    // catalogue.ts auf die falsche Zeile.
    const result = subsetCatalogue(SOURCE, ['de']);
    expect(result.code.split('\n')).toHaveLength(SOURCE.split('\n').length);
  });

  it('ist unempfindlich gegen Groß- und Kleinschreibung', () => {
    expect(subsetCatalogue(SOURCE, ['DE', 'zh-hant']).kept).toEqual(['de', 'en', 'zh-Hant']);
  });

  it('bricht bei einer unbekannten Sprache ab und sagt, was es gibt', () => {
    // Ein Tippfehler in einer Umgebungsvariablen darf nicht in einem Bündel
    // enden, das stillschweigend eine Sprache weniger hat.
    expect(() => subsetCatalogue(SOURCE, ['de', 'pt-XX'])).toThrow(/pt-XX/);
    expect(() => subsetCatalogue(SOURCE, ['klingon'])).toThrow(/Zur Wahl stehen/);
  });

  it('kann auf eine einzige Sprache herunter', () => {
    const result = subsetCatalogue(SOURCE, ['en']);
    expect(result.kept).toEqual(['en']);
    expect(result.dropped).toHaveLength(36);
  });
});

/* ── Die native-only-Schlüssel ─────────────────────────────────────────── */

describe('stripNativeKeys()', () => {
  it('nimmt einen einzeiligen Eintrag heraus', () => {
    const source = [
      'export default {',
      "  'zone.input': 'Input',",
      "  'native.a': 'X',",
      '} satisfies Strings;',
    ].join('\n');
    const result = stripNativeKeys(source);

    expect(result.removed).toEqual(['native.a']);
    expect(result.code).toContain("'zone.input': 'Input',");
    expect(result.code).not.toContain('native.a');
  });

  it('nimmt auch einen umgebrochenen Eintrag ganz heraus', () => {
    // Prettier bricht lange Sätze um — gemessen bei 23 der 37 Sprachdateien.
    // Bliebe die zweite Zeile stehen, wäre die Datei kein gültiges JavaScript
    // mehr, und der Bau bräche an einer Stelle ab, die nichts damit zu tun hat.
    const source = [
      'export default {',
      "  'native.a':",
      "    'ein sehr langer Satz, den Prettier umgebrochen hat',",
      "  'zone.input': 'Input',",
      '} satisfies Strings;',
    ].join('\n');
    const result = stripNativeKeys(source);

    expect(result.removed).toEqual(['native.a']);
    expect(result.code).not.toContain('Prettier');
    expect(result.code).toContain("'zone.input': 'Input',");
  });

  it('nimmt einen Mehrzahl-Eintrag samt seiner Klammern heraus', () => {
    const source = [
      'export default {',
      "  'native.count': {",
      "    one: 'ein Konto',",
      "    other: '{n} Konten',",
      '  },',
      "  'zone.input': 'Input',",
      '} satisfies Strings;',
    ].join('\n');
    const result = stripNativeKeys(source);

    expect(result.removed).toEqual(['native.count']);
    expect(result.code).not.toContain('Konto');
    expect(result.code).toContain("'zone.input': 'Input',");
  });

  it('lässt sich von Klammern und Kommas IM Text nicht täuschen', () => {
    // Genau dafür liest der Scanner zeichenweise statt per Muster: Ein Komma
    // im Satz beendete den Eintrag sonst zu früh, und die Zeile darunter
    // bliebe als Bruchstück stehen.
    const source = [
      'export default {',
      "  'native.a': 'Klammer } und Komma, mitten im Satz',",
      "  'zone.input': 'Input',",
      '} satisfies Strings;',
    ].join('\n');
    const result = stripNativeKeys(source);

    expect(result.removed).toEqual(['native.a']);
    expect(result.code).toContain("'zone.input': 'Input',");
    expect(result.code).not.toContain('mitten im Satz');
  });

  it('lässt die Zeilennummern stehen', () => {
    // Dieselbe Begründung wie bei der Sprachauswahl: Eine gelöschte Zeile
    // verschöbe alles darunter, und jede Fehlermeldung zeigte auf die falsche
    // Stelle.
    const source = ['a', "  'native.a': 'X',", 'b'].join('\n');
    expect(stripNativeKeys(source).code.split('\n')).toHaveLength(3);
  });

  it('lässt eine Datei ohne native-Schlüssel unangetastet', () => {
    const source = ['export default {', "  'zone.input': 'Input',", '} satisfies Strings;'].join(
      '\n',
    );
    const result = stripNativeKeys(source);

    expect(result.removed).toEqual([]);
    expect(result.code).toBe(source);
  });

  it('meldet sich, wenn das Bauteil gar keine Sprachdatei gesehen hat', () => {
    // Der Wächter gegen den eigenen Stillstand: Griffe das Pfadmuster eines
    // Tages daneben, liefe der Bau durch und das Bündel trüge die
    // native-Sätze — ohne dass irgendetwas rot würde. Eine Prüfung, deren
    // Vergleichsfeld leer bleibt, meldet Gleichheit; dieser Test ist der
    // Beweis, dass sie es hier NICHT tut.
    const plugin = stripNativeKeysPlugin();
    const hook = plugin.buildEnd;
    const run = typeof hook === 'function' ? hook : hook?.handler;

    expect(run).toBeTypeOf('function');
    expect(() => (run as (this: unknown, error?: Error) => void).call(null)).toThrow(
      /nicht stattgefunden/,
    );
  });

  it('bricht ab, wenn ein Eintrag kein Ende hat', () => {
    const source = ['export default {', "  'native.a': 'unfertig"].join('\n');
    expect(() => stripNativeKeys(source)).toThrow(/kein erkennbares Ende/);
  });

  it('greift auf die echten Sprachdateien und findet dort denselben Schlüssel', async () => {
    // Gegenprobe an der Wirklichkeit statt an einem gebastelten Beispiel: Was
    // hier steht, muss in allen 37 Dateien gleich sein — der Compiler erzwingt
    // das über `satisfies Strings`.
    const codes = Object.keys(CATALOGUE);
    const sets = new Set<string>();
    for (const code of codes) {
      const file = path.join(root, 'src', 'i18n', 'locales', `${code}.ts`);
      const result = stripNativeKeys(await readFile(file, 'utf8'));
      sets.add([...result.removed].sort().join(','));
    }

    expect(codes).toHaveLength(37);
    expect([...sets]).toEqual(['native.vacant.text']);
  });
});

/* ── Der echte Build ───────────────────────────────────────────────────── */

/**
 * Bringt die gebaute Datei auf eine vergleichbare Form.
 *
 * Zweierlei steht darin verschlüsselt: Nicht-lateinische Zeichen schreibt
 * esbuild je nach Einstellung roh oder als `\uXXXX`, und in HTML-Attributen
 * maskiert Vite die Apostrophe als `&#39;` — die CSP steht dort also als
 * `connect-src &#39;none&#39;`. Beides wird zurückgedreht, damit der Test an
 * der Sache hängt und nicht an einer Schreibweise.
 */
function readable(text: string): string {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_whole, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    .replace(/&#39;/g, "'");
}

describe('Subset-Build', () => {
  afterAll(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it(
    'baut eine Datei, in der nur die gewählten Sprachen stecken',
    { timeout: 180_000 },
    async () => {
      process.env[ENV_KEY] = 'de,fr';
      process.env['BUILD_SINGLEFILE'] = '1';
      try {
        await build({
          root,
          mode: 'production',
          configFile: path.join(root, 'vite.config.ts'),
          logLevel: 'silent',
          plugins: [viteSingleFile()],
          build: {
            outDir,
            emptyOutDir: true,
            sourcemap: false,
            cssCodeSplit: false,
            assetsInlineLimit: 10 * 1024 * 1024,
          },
        });
      } finally {
        delete process.env[ENV_KEY];
        delete process.env['BUILD_SINGLEFILE'];
      }

      const html = readable(await readFile(path.join(outDir, 'index.html'), 'utf8'));

      // Was bestellt war, ist da — Englisch als Rückfall ungefragt dazu.
      expect(html).toContain(de['zone.vault']);
      expect(html).toContain(fr['zone.vault']);
      expect(html).toContain(en['zone.vault']);

      // Und der Rest ist wirklich weg, lateinisch geschrieben wie nicht.
      expect(html).not.toContain(ja['zone.vault']);
      expect(html).not.toContain(ru['zone.vault']);
      expect(html).not.toContain(nl['zone.vault']);

      // Nachgewogen: Die Textmenge ist raus, nicht bloß unerreichbar. Das volle
      // Bündel wiegt rund 780 kB.
      //
      // Die Schwelle stand bis V8 bei 400 KiB. V9 hat Instrument Sans durch
      // Inter ersetzt (die Hausschrift der HeroUI-Referenz), und Inter wiegt
      // als data-URI rund 122 KiB mehr — latin 48 statt 30 kB, latin-ext 85
      // statt 11, mal 4/3 fuer Base64. Gemessen lag das de,en,fr-Subset danach
      // bei 464 KiB. Die Schwelle prueft weiterhin dasselbe: dass der Katalog
      // WIRKLICH schrumpft — sie liegt gut 250 KiB unter dem vollen Bau.
      const bytes = Buffer.byteLength(html, 'utf8');
      expect(bytes).toBeLessThan(500 * 1024);

      // Die native-only-Schlüssel sind im Bündel nicht vorhanden — und der
      // Web-Satz derselben Bühne sehr wohl. Beide unterscheiden sich nur im
      // letzten Wort („Browser" gegen „Gerät"), der Vergleich hängt also
      // wirklich am Entfernen und nicht an zwei zufällig verschiedenen Sätzen.
      expect(html).toContain(de['vacant.text']);
      expect(html).not.toContain(de['native.vacant.text']);
      expect(html).not.toContain(en['native.vacant.text']);

      // Das Versprechen der Datei bleibt, wie es war: eine Datei, keine
      // Verbindung, kein Nachladen.
      expect(html).toContain("connect-src 'none'");
      expect(html).not.toContain('fetch(');
      expect(html).not.toContain('import(');
    },
  );
});

/* ── Die Zusage an den Testlauf ────────────────────────────────────────── */

describe('Der Testlauf sieht immer alle Sprachen', () => {
  it('weil das Bauteil nur beim Bauen greift', () => {
    // Das ist die tragende Zusage: `catalogue.test.ts` prüft 37 Sprachen auf
    // Schlüssel, Platzhalter und Mehrzahlformen. Griffe die Auswahl auch im
    // Testlauf, prüfte sie je nach Umgebungsvariable mal 37 und mal 3 — eine
    // Vollständigkeitsprüfung, die man ausschalten kann, ist keine.
    const plugin = subsetLocalePlugin(['de']);
    expect(plugin.name).toBe(PLUGIN_NAME);
    expect(plugin.apply).toBe('build');
    expect(plugin.enforce).toBe('pre');
  });

  it('und der geladene Katalog deshalb vollständig ist', () => {
    // Gegenprobe von der anderen Seite, die auch dann noch gilt, wenn jemand
    // `CLOCKWORK_LANGS` gesetzt hat und `npm test` aufruft.
    expect(Object.keys(CATALOGUE)).toHaveLength(37);
  });

  it('— und dasselbe gilt für die native-only-Schlüssel', () => {
    // Dieselbe Zusage, zweiter Fall: Griffe das Entfernen auch im Testlauf,
    // prüfte `catalogue.test.ts` die `native.`-Schlüssel gar nicht mehr —
    // sie wären dann in 37 Sprachen ungeprüft.
    const plugin = stripNativeKeysPlugin();
    expect(plugin.name).toBe(NATIVE_PLUGIN_NAME);
    expect(plugin.apply).toBe('build');
    expect(plugin.enforce).toBe('pre');
  });

  it('weshalb der Katalog den native-Schlüssel im Testlauf wirklich trägt', () => {
    expect(en['native.vacant.text']).toContain('device');
    expect(de['native.vacant.text']).toContain('Gerät');
  });
});
