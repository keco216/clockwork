/**
 * Schreibt die Store-Texte aus `scripts/store-texts.mjs` in BEIDE Baeume.
 *
 *   node scripts/store-listing.mjs
 *
 *   play/listing/<locale>/                     → Play Console (Upload von Hand)
 *   fastlane/metadata/android/<locale>/        → F-Droid liest das aus dem Repo
 *
 * ── Warum ein Skript und nicht zweimal Copy&Paste ────────────────────────
 * Weil die beiden Baeume beim Schreiben dieses Skripts nachweislich schon
 * auseinandergelaufen waren: Der erste Satz der Langbeschreibung lautete unter
 * `fastlane/` „The Android app declares no INTERNET permission", unter `play/`
 * „The app declares…". Beide sahen fuer sich richtig aus — genau die Sorte
 * Abweichung, die niemandem auffaellt, weil niemand zwei Kanaele nebeneinander
 * liest (N23).
 *
 * Der Changelog geht in beide Baeume unter dem versionCode: F-Droid zeigt
 * `changelogs/20000.txt` im Katalog an, Play braucht denselben Text im Feld
 * „Neu in dieser Version" beim Upload.
 *
 * ── Was dieses Skript NICHT anfasst ──────────────────────────────────────
 * Die Bilder. Die schreibt `store-frames.mjs`, ebenfalls in beide Baeume, und
 * die alten Changelogs der 1.x-Fassungen bleiben liegen — sie gehoeren zu
 * Fassungen, die es im Katalog weiterhin gibt.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { TEXTE, GRENZEN, VERSION_CODE } from './store-texts.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const befunde = [];

const ZIELE = (locale) => [
  path.join(root, 'play', 'listing', locale),
  path.join(root, 'fastlane', 'metadata', 'android', locale),
];

console.log('\n  Store-Texte\n');

for (const [locale, texte] of Object.entries(TEXTE)) {
  const dateien = {
    'title.txt': texte.title,
    'short_description.txt': texte.short_description,
    'full_description.txt': texte.full_description,
    [`changelogs/${VERSION_CODE}.txt`]: texte.changelog,
  };

  for (const [name, inhalt] of Object.entries(dateien)) {
    /* Ueber den Iterator zaehlen und nicht ueber .length: Ein Zeichen
       ausserhalb der BMP zaehlt in JavaScript doppelt, in der Play Console
       aber einfach. */
    const zeichen = [...inhalt].length;
    const grenze = GRENZEN[name.startsWith('changelogs') ? 'changelog' : name.replace('.txt', '')];
    const marke = zeichen > grenze ? '  ZU LANG' : '';
    if (zeichen > grenze) befunde.push(`${locale}/${name}: ${zeichen} von ${grenze} Zeichen`);

    for (const ziel of ZIELE(locale)) {
      const datei = path.join(ziel, name);
      await mkdir(path.dirname(datei), { recursive: true });
      // Mit abschliessendem Umbruch — Konvention des Repos. Die Tests und die
      // Play Console lesen den Text ohne ihn.
      await writeFile(datei, `${inhalt}\n`, 'utf8');
    }
    console.log(
      `  ${locale}/${name.padEnd(26)} ${String(zeichen).padStart(4)} von ${grenze}${marke}`,
    );
  }
}

console.log(`\n  In beide Baeume geschrieben (play/listing und fastlane/metadata/android).`);
if (befunde.length > 0) {
  console.error(`\n  ${befunde.length} Befund(e):`);
  for (const befund of befunde) console.error(`  • ${befund}`);
  process.exitCode = 1;
}
