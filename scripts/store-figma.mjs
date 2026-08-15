/**
 * Uebernimmt die in Figma gebauten Store-Bilder in BEIDE Baeume (D6).
 *
 * ── Warum es diesen Schritt gibt ──────────────────────────────────────────
 * Bis D6 entstanden die sieben Motive je Sprache in `store-frames.mjs`: rohe
 * Geraeteaufnahme plus gezeichneter Rahmen, komplett aus dem Repo heraus und
 * wiederholbar. Kevin hat die Motive danach in Figma ueberarbeitet — die
 * Wortmarke sass im montierten Rahmen falsch, und das Telefon war so
 * beschnitten, dass die Navigationsleiste fehlte. Was aus Figma kommt, ist
 * damit die neue Wahrheit fuer die Screenshots.
 *
 * ── Der Preis, ausgeschrieben ─────────────────────────────────────────────
 * `store-frames.mjs` schreibt dieselben Dateien und wuerde sie ueberschreiben.
 * Wer den Rahmen umbaut, faehrt danach DIESES Skript, sonst stehen im Store
 * wieder die montierten Bilder. Die Funktionsgrafik ist davon nicht betroffen:
 * Sie ist in beiden Wegen dieselbe Datei (byte-identisch nachgemessen).
 *
 * ── Warum umkodiert und nicht kopiert wird ────────────────────────────────
 * Figma exportiert RGBA (PNG-Farbtyp 6). Der Store-Test verlangt Farbtyp 2:
 * Ein Alphakanal in einem Bild ohne Transparenz ist ein Viertel Datei fuer
 * nichts. `ohneAlpha` prueft deshalb JEDEN Punkt auf volle Deckung und bricht
 * ab, statt eine Grundfarbe zu erfinden — beim ersten Lauf gemessen: 2.073.600
 * von 2.073.600 Punkten undurchsichtig, das Strippen ist verlustfrei.
 *
 * Geschrieben wird in beide Baeume, weil F-Droid `fastlane/` direkt aus dem
 * Repo liest und Play `play/listing/` bekommt (N23). Ein Test haelt sie
 * gegeneinander.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { decodePng, encodePng, ohneAlpha } from './png.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Play verlangt diese Masse; der Test prueft sie am Ergebnis noch einmal. */
const BREITE = 1080;
const HOEHE = 1920;
const FEATURE_BREITE = 1024;
const FEATURE_HOEHE = 500;

/**
 * Was uebernommen wird: sieben Motive und die Funktionsgrafik.
 *
 * Die Funktionsgrafik ist seit D7 hier mit drin, obwohl sie aus der Montage
 * stammt und in beiden Wegen byte-identisch war. Der Grund ist nicht das Bild,
 * sondern die Regel: `store-frames.mjs` schreibt seit D7 nur noch in die
 * Werkstatt. Bliebe die Funktionsgrafik dort, haette die Auslieferung eine
 * Datei ohne Schreiber — und die faellt beim naechsten Aufraeumen weg, ohne
 * dass jemand es merkt.
 */
const BILDER = [
  ...Array.from({ length: 7 }, (_unused, i) => ({
    quelle: (figma) => `${figma}-${i + 1}.png`,
    ziel: `images/phoneScreenshots/${i + 1}.png`,
    breite: BREITE,
    hoehe: HOEHE,
  })),
  {
    quelle: () => 'featureGraphic.png',
    ziel: 'images/featureGraphic.png',
    breite: FEATURE_BREITE,
    hoehe: FEATURE_HOEHE,
  },
];

/** Figma-Ordner → Store-Locale. Die Nummern 1..7 sind die Reihenfolge bei Play. */
const SPRACHEN = [
  { figma: 'en', locale: 'en-US' },
  { figma: 'de', locale: 'de-DE' },
];

const ZIELE = (locale, relativ) => [
  path.join(root, 'play', 'listing', locale, relativ),
  path.join(root, 'fastlane', 'metadata', 'android', locale, relativ),
];

const befunde = [];

console.log('\n  Figma-Bilder uebernehmen\n');

for (const { figma, locale } of SPRACHEN) {
  for (const bildplan of BILDER) {
    const name = bildplan.quelle(figma);
    const quelle = path.join(root, 'play', 'Figma', figma, name);

    let bild;
    try {
      bild = decodePng(await readFile(quelle));
    } catch (fehler) {
      befunde.push(`${figma}/${name}: ${fehler.message}`);
      continue;
    }

    if (bild.breite !== bildplan.breite || bild.hoehe !== bildplan.hoehe) {
      befunde.push(
        `${figma}/${name}: ${bild.breite}x${bild.hoehe}, erwartet ${bildplan.breite}x${bildplan.hoehe}`,
      );
      continue;
    }

    let png;
    try {
      png = encodePng(ohneAlpha(bild), bildplan.breite, bildplan.hoehe);
    } catch (fehler) {
      befunde.push(`${figma}/${name}: ${fehler.message}`);
      continue;
    }

    for (const ziel of ZIELE(locale, bildplan.ziel)) {
      await mkdir(path.dirname(ziel), { recursive: true });
      await writeFile(ziel, png);
    }

    const vorher = (await readFile(quelle)).length;
    console.log(
      `  ${locale}/${bildplan.ziel.padEnd(34)} ${String(png.length).padStart(7)} Byte` +
        `   (aus ${name}, ${vorher} Byte)`,
    );
  }
}

if (befunde.length > 0) {
  console.error('\n  NICHT uebernommen:\n');
  for (const b of befunde) console.error(`  - ${b}`);
  process.exit(1);
}

console.log('\n  In beide Baeume geschrieben (play/listing und fastlane/metadata/android).\n');
