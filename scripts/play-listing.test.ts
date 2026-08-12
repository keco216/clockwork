/**
 * Die Play-Store-Texte gegen die Grenzen, an denen sie hochgeladen werden.
 *
 * Warum ein Test und nicht das Auge: Die beiden Kurzbeschreibungen liegen bei
 * 75 und 78 von 80 Zeichen. Ein eingefuegtes Wort sprengt sie, und auffallen
 * wuerde das erst in der Play Console — also am Ende eines Vorgangs, den man
 * gerade abschliessen wollte. Play zaehlt ZEICHEN, nicht Byte; „ü" ist eins.
 *
 * Der abschliessende Zeilenumbruch zaehlt hier nicht mit: In die Console wird
 * der Text ohne ihn eingefuegt, und eine Datei ohne Umbruch am Ende waere
 * gegen die Konvention des Repos.
 */

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { SITE_URL } from './site';

/** Die Grenzen der Play Console, Stand August 2026. */
const GRENZEN = {
  'title.txt': 30,
  'short_description.txt': 80,
  'full_description.txt': 4000,
} as const;

const SPRACHEN = ['en-US', 'de-DE'] as const;

async function lies(sprache: string, datei: string): Promise<string> {
  const url = new URL(`../play/listing/${sprache}/${datei}`, import.meta.url);
  return (await readFile(fileURLToPath(url), 'utf8')).trimEnd();
}

describe('play/listing', () => {
  for (const sprache of SPRACHEN) {
    for (const [datei, grenze] of Object.entries(GRENZEN)) {
      it(`${sprache}/${datei} bleibt unter ${grenze} Zeichen`, async () => {
        const text = await lies(sprache, datei);

        expect(text.length).toBeGreaterThan(0);
        // Ueber den Iterator zaehlen, nicht ueber .length: Ein Zeichen ausserhalb
        // der BMP zaehlt in JavaScript sonst doppelt, in der Console aber einfach.
        expect([...text].length).toBeLessThanOrEqual(grenze);
      });
    }
  }

  it('fuehrt in beiden Sprachen dieselben Dateien', async () => {
    const [englisch, deutsch] = await Promise.all(
      SPRACHEN.map(async (sprache) =>
        (await readdir(fileURLToPath(new URL(`../play/listing/${sprache}`, import.meta.url))))
          .filter((name) => name.endsWith('.txt'))
          .sort(),
      ),
    );

    expect(deutsch).toEqual(englisch);
    expect(englisch).toEqual(Object.keys(GRENZEN).sort());
  });

  it('kommt ohne Markdown aus', async () => {
    /* Die Play Console zeigt die Beschreibung als reinen Text. Ein
       Sternchen-Aufzaehlungszeichen aus den fastlane-Texten stuende dort
       wortwoertlich da — deshalb echte Punkte (•). */
    for (const sprache of SPRACHEN) {
      const text = await lies(sprache, 'full_description.txt');

      expect(text).not.toMatch(/^\s*[*#-]\s/m);
      expect(text).not.toMatch(/\*\*/);
    }
  });

  it('nennt dieselbe Adresse wie scripts/site.ts', async () => {
    /* Dieselbe Doppelung wie in der Datenschutzseite: Der Text nennt die
       Adresse ausgeschrieben, weil ein Store-Eintrag keinen Platzhalter
       ersetzen kann. Ein Domainwechsel muss hier also mitwandern. */
    const host = new URL(SITE_URL).host;

    for (const sprache of SPRACHEN) {
      expect(await lies(sprache, 'full_description.txt')).toContain(host);
    }
  });

  it('wirbt nicht fuer eine andere Bezugsquelle', async () => {
    /* Play-Richtlinie: Ein Store-Eintrag darf keinen konkurrierenden
       Vertriebsweg bewerben. Die eigene Webseite und der Quelltext auf GitHub
       sind erlaubt und stehen bewusst drin — ein zweiter App-Katalog nicht,
       auch wenn Clockwork dort ebenfalls liegt. */
    for (const sprache of SPRACHEN) {
      const text = (await lies(sprache, 'full_description.txt')).toLowerCase();

      expect(text).not.toContain('f-droid');
      expect(text).not.toContain('fdroid');
    }
  });
});
