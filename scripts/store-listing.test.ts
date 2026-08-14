/**
 * Zwei Baeume, eine Wahrheit — und die Bildtexte vollstaendig (N22/N23).
 *
 * Der Store-Auftritt liegt doppelt im Repo: `play/listing/<locale>/` fuer die
 * Play Console, `fastlane/metadata/android/<locale>/` fuer F-Droid, das seine
 * Metadaten direkt aus dem Repo liest. Beide sehen fuer sich plausibel aus,
 * und genau deshalb faellt eine Abweichung ohne Test niemandem auf: Beim
 * Schreiben dieses Tests standen dort zwei verschiedene erste Saetze
 * („The Android app declares…" gegen „The app declares…"), entstanden beim
 * letzten Release und seither unbemerkt.
 *
 * Geschrieben werden beide Baeume von `scripts/store-listing.mjs` (Texte) und
 * `scripts/store-frames.mjs` (Bilder) aus je EINER Quelle. Dieser Test prueft
 * das Ergebnis — nicht die Absicht.
 *
 * Dazu die Vollstaendigkeitsregel fuer die Bildtexte (N22): Die
 * Marketing-Ueberschriften sind keine App-Strings und stehen deshalb nicht im
 * 37-Sprachen-Katalog, sondern in `play/captions/<locale>.json`. Was der
 * Compiler dort nicht mehr prueft, prueft dieser Test: dieselbe
 * Schluesselmenge wie in der Standardsprache, und kein leerer Satz.
 */

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const SPRACHEN = ['en-US', 'de-DE'] as const;
const STANDARD = 'en-US';

/** Was in beiden Baeumen Zeichen fuer Zeichen gleich sein muss. */
const GETEILT = [
  'title.txt',
  'short_description.txt',
  'full_description.txt',
  'changelogs/20000.txt',
  'images/featureGraphic.png',
  ...Array.from({ length: 7 }, (_unused, i) => `images/phoneScreenshots/${i + 1}.png`),
] as const;

const pfad = (baum: 'play' | 'fastlane', sprache: string, datei: string): string =>
  fileURLToPath(
    new URL(
      baum === 'play'
        ? `../play/listing/${sprache}/${datei}`
        : `../fastlane/metadata/android/${sprache}/${datei}`,
      import.meta.url,
    ),
  );

describe('Store-Auftritt', () => {
  describe('beide Baeume tragen dasselbe (N23)', () => {
    for (const sprache of SPRACHEN) {
      for (const datei of GETEILT) {
        it(`${sprache}/${datei}`, async () => {
          const [play, fastlane] = await Promise.all([
            readFile(pfad('play', sprache, datei)),
            readFile(pfad('fastlane', sprache, datei)),
          ]);

          expect(play.length).toBeGreaterThan(0);
          // Byte fuer Byte, nicht „sieht gleich aus": Bei den PNGs ist das die
          // einzig sinnvolle Frage, und bei den Texten faengt es ein
          // verrutschtes Leerzeichen mit.
          expect(fastlane.equals(play)).toBe(true);
        });
      }
    }
  });

  describe('die Bilder tragen Play-Masse', () => {
    for (const sprache of SPRACHEN) {
      it(`${sprache}: sieben Screenshots 1080x1920, Funktionsgrafik 1024x500`, async () => {
        for (let nr = 1; nr <= 7; nr++) {
          const png = await readFile(pfad('play', sprache, `images/phoneScreenshots/${nr}.png`));

          expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1080, 1920]);
          /* Farbtyp 2 = RGB ohne Alphakanal. Play verlangt das ausdruecklich
             fuer die Funktionsgrafik; die Screenshots tragen es aus demselben
             Grund, aus dem der Rest des Satzes es traegt — ein Alphakanal in
             einem Bild ohne Transparenz ist ein Viertel Datei fuer nichts. */
          expect(png[25]).toBe(2);
        }

        const feature = await readFile(pfad('play', sprache, 'images/featureGraphic.png'));

        expect([feature.readUInt32BE(16), feature.readUInt32BE(20)]).toEqual([1024, 500]);
        expect(feature[25]).toBe(2);
      });
    }

    it('laesst keine Bilder der 1.x-Fassung liegen', async () => {
      /* Die alten Screenshots hiessen ebenso 1.png bis 4.png und sind
         ueberschrieben. Was hier auffallen soll, ist eine DATEI ZU VIEL: ein
         5.png aus einem frueheren Satz, das der neue Lauf nicht mehr schreibt
         und das Play trotzdem anzeigen wuerde. */
      for (const sprache of SPRACHEN) {
        for (const baum of ['play', 'fastlane'] as const) {
          const namen = (await readdir(pfad(baum, sprache, 'images/phoneScreenshots'))).sort();

          expect(namen).toEqual(['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png']);
        }
      }
    });
  });

  describe('Bildtexte (N22)', () => {
    const lies = async (
      sprache: string,
    ): Promise<Record<string, { headline: string; subline: string }>> => {
      const roh: unknown = JSON.parse(
        await readFile(
          fileURLToPath(new URL(`../play/captions/${sprache}.json`, import.meta.url)),
          'utf8',
        ),
      );
      return roh as Record<string, { headline: string; subline: string }>;
    };

    it('fuehrt in jeder Sprache dieselben Schluessel wie die Standardsprache', async () => {
      const standard = Object.keys(await lies(STANDARD)).sort();

      expect(standard).toEqual(['1', '2', '3', '4', '5', '6', '7', 'feature']);

      for (const sprache of SPRACHEN) {
        expect(Object.keys(await lies(sprache)).sort()).toEqual(standard);
      }
    });

    it('hat zu jedem Motiv eine Ueberschrift', async () => {
      for (const sprache of SPRACHEN) {
        const texte = await lies(sprache);

        for (const [schluessel, eintrag] of Object.entries(texte)) {
          expect(eintrag.headline.length, `${sprache}/${schluessel}`).toBeGreaterThan(0);
          // Die Unterzeile darf fehlen — Motiv 7 hat bewusst keine. Der
          // SCHLUESSEL muss trotzdem da sein, sonst faellt beim naechsten
          // Uebersetzen niemandem auf, dass dort eine Entscheidung liegt.
          expect(typeof eintrag.subline, `${sprache}/${schluessel}`).toBe('string');
        }
      }
    });

    it('nennt in keiner Ueberschrift eine Zahl, die die App nicht haelt', async () => {
      /* Die einzige nachpruefbare ZAHL im Bildsatz ist die Sprachenzahl. Sie
         steht in `src/i18n/locales/` als Ordnerinhalt und im Store-Text als
         Behauptung — hier treffen sie sich. Ein Wert, der auseinanderlaeuft,
         waere genau die Sorte Zusage, die N18 verbietet. */
      const locales = (
        await readdir(fileURLToPath(new URL('../src/i18n/locales', import.meta.url)))
      )
        .filter((name) => name.endsWith('.ts') && !name.includes('.test.'))
        .filter((name) => name !== 'index.ts');

      for (const sprache of SPRACHEN) {
        const sprachenbild = (await lies(sprache))['6'];

        // Ohne die Prüfung stünde hier ein `?.` — und ein `?.` verschluckt
        // auch einen Tippfehler im Schlüssel (Falle aus CLAUDE.md).
        expect(sprachenbild, `${sprache}: Motiv 6 fehlt`).toBeDefined();
        expect(sprachenbild?.headline.match(/\d+/g) ?? []).toEqual([String(locales.length)]);
      }
    });
  });
});
