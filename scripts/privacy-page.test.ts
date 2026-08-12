/**
 * Die Datenschutzseite gegen ihre eigene Aussage.
 *
 * `public/privacy.html` behauptet, Clockwork lade nichts nach und schicke
 * nichts weg. Eine Seite, die das behauptet und dabei selbst eine fremde
 * Schrift, ein Zählpixel oder ein Skript holt, widerlegt sich beim Aufrufen —
 * und zwar vor genau dem Publikum, das nachsieht. Deshalb wird hier gemessen
 * statt versprochen.
 *
 * Zwei Doppelungen bewacht dieser Test zusätzlich, beide unvermeidbar:
 *
 * 1. **Die Adresse.** `public/` wandert unverändert nach `dist/` —
 *    `transformIndexHtml` fasst nur die Einstiegsseite an, der Platzhalter
 *    `%SITE_URL%` würde hier also wörtlich stehen bleiben. Die Adresse steht
 *    deshalb ausgeschrieben in der Seite und wird gegen `scripts/site.ts`
 *    geprüft. Dieselbe Bauart wie bei den `theme-color`-Meta-Tags, die
 *    `check-tokens.mjs` gegen `--case` hält: Wo HTML kein `var()` lesen kann,
 *    tritt eine Prüfung an die Stelle der Variablen.
 * 2. **Die Kontaktadresse**, die auch in SECURITY.md steht. Ein Tippfehler
 *    darin führt niemanden zurück.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { SITE_URL } from './site';

const page = await readFile(
  fileURLToPath(new URL('../public/privacy.html', import.meta.url)),
  'utf8',
);

const security = await readFile(fileURLToPath(new URL('../SECURITY.md', import.meta.url)), 'utf8');

describe('public/privacy.html', () => {
  /*
   * Die Ladeliste ist absichtlich streng: Verboten ist jedes Mittel, mit dem
   * ein Browser beim Anzeigen eine weitere Ressource holen KÖNNTE — auch ein
   * `data:`-Bild, das harmlos wäre. Eine Ausnahme müsste man begründen, und
   * genau dann soll dieser Test im Weg stehen. Verlinken bleibt erlaubt: Ein
   * `<a href>` lädt nichts, es wartet auf einen Klick.
   */
  const ladendeMittel: readonly (readonly [string, RegExp])[] = [
    ['ein Skript', /<script\b/i],
    ['ein <link> (Stylesheet, Preload, Favicon)', /<link\b/i],
    ['ein Bild-Element', /<img\b/i],
    ['ein eingebettetes Dokument', /<(iframe|object|embed|video|audio|source|track)\b/i],
    ['ein ladendes Attribut', /\s(src|srcset|poster|formaction|action)\s*=/i],
    ['ein CSS-@import', /@import/i],
    ['ein url() im CSS', /url\(/i],
  ];

  for (const [was, muster] of ladendeMittel) {
    it(`holt beim Anzeigen nichts nach — ${was}`, () => {
      expect(page).not.toMatch(muster);
    });
  }

  it('verlinkt nach außen nur mit <a href> oder mailto', () => {
    /* Jede externe Adresse muss in einem Anker stehen. Steht sie woanders,
       liefe sie Gefahr, doch geladen zu werden — oder sie ist Prosa in einem
       Attribut, was ebenfalls niemand will. */
    const adressen = page.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
    expect(adressen.length).toBeGreaterThan(0);

    for (const adresse of adressen) {
      expect(page).toContain(`<a href="${adresse}"`);
    }
  });

  it('nennt dieselbe Adresse wie scripts/site.ts', () => {
    expect(page).toContain(SITE_URL);

    /* Und keine andere Fassung derselben Seite: Ein übrig gebliebenes
       `clockwork.vercel.app` aus der Zeit vor der Vercel-Zuteilung wäre ein
       toter Link an der Stelle, an der Play nachsieht. */
    const fremdeClockworkAdressen = (page.match(/https?:\/\/[^\s"'<>]*clockwork[^\s"'<>]*/g) ?? [])
      .filter((adresse) => !adresse.startsWith(SITE_URL))
      .filter((adresse) => !adresse.startsWith('https://github.com/keco216/clockwork'));

    expect(fremdeClockworkAdressen).toEqual([]);
  });

  it('nennt dieselbe Kontaktadresse wie SECURITY.md', () => {
    const kontakt = page.match(/mailto:([^"']+)/)?.[1];

    expect(kontakt).toBeDefined();
    expect(security).toContain(kontakt);
  });

  it('steht Suchmaschinen offen', () => {
    /* Anders als 404.html: Play prüft diese Adresse, und eine
       Datenschutzerklärung, die niemand finden darf, ist keine.

       Geprüft wird das META-TAG und nicht das Wort: Im Kommentarkopf der Seite
       steht „noindex" in der Begründung, warum dort keines steht. Die erste
       Fassung dieses Tests ist genau daran gescheitert — eine Prüfung, die
       Prosa für ein Bauteil hält, meldet einen Fehler, den es nicht gibt. */
    expect(page).not.toMatch(/<meta[^>]+name=["']robots["'][^>]*>/i);
  });

  it('trägt beide Sprachen, englisch zuerst', () => {
    expect(page).toMatch(/<html lang="en"/);
    expect(page).toMatch(/<section lang="de">/);

    /* Englisch ist die Basissprache des Projekts und steht deshalb oben. */
    expect(page.indexOf('<section lang="de">')).toBeGreaterThan(page.indexOf('<h1>'));
  });

  it('sagt, wann sie zuletzt geändert wurde', () => {
    /* Ohne Datum ist eine Datenschutzerklärung nicht datierbar — und Play
       fragt bei Änderungen genau danach. Je Sprache eine Angabe. */
    const datumszeilen = page.match(/<p class="date">/g) ?? [];
    expect(datumszeilen).toHaveLength(2);
  });
});
