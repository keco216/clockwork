/**
 * Die Version — an EINER Stelle: `package.json`.
 *
 * Dieselbe Bauart wie `scripts/csp.ts` und `scripts/site.ts`: Was mehrfach von
 * Hand gepflegt wird, laeuft auseinander.
 *
 * ── Warum das nachgezogen wurde (D1b) ──────────────────────────────────────
 * Der Sprung von 2.0.0 auf 2.0.1 hat gezeigt, was die harte Zahl kostet: Sie
 * stand an fuenf Stellen — `VERSION_CODE` in `store-texts.mjs`, der Dateiname
 * `changelogs/20000.txt` in `store-listing.test.ts`, die Abbruchbedingung in
 * `store-shots.mjs`, dazu die Nennungen in der Doku. Jede einzeln richtig,
 * zusammen eine Handarbeit, die bei 2.0.2 wieder anfaellt. Und die teuerste
 * davon faellt STILL aus: Ein Changelog unter der falschen Nummer heisst nicht
 * „Fehler", sondern „im Katalog steht kein Aenderungshinweis" — gesehen wird
 * das Tage spaeter, wenn das Tag laengst draussen ist.
 *
 * ── Warum package.json und nicht der Bauplan ───────────────────────────────
 * Es gibt ZWEI Android-Baeume, die dasselbe Paket ausliefern: die eingefrorene
 * WebView-Huelle in `android/` (1.5.4 = 10504, siehe `release-metadata.test.ts`)
 * und die native App in `android-native/`. Einer von beiden muesste sonst die
 * Wahrheit halten, und der andere waere still im Unrecht. `package.json` steht
 * ueber beiden und ist die Datei, die ohnehin jeder als erstes ansieht.
 *
 * Die Kopplung an den nativen Baum haelt `native-version.test.ts` — sie prueft,
 * nicht schreibt. Ein Generator, der `build.gradle.kts` umschreibt, waere die
 * naechste stille Quelle: Er liefe beim Bauen und niemand saehe die Aenderung
 * im Diff.
 */

import { readFileSync } from 'node:fs';

const paket = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/** Die Version, wie sie in `package.json` steht — z. B. `2.0.1`. */
export const VERSION = paket.version;

/**
 * Das Hausschema: `Major*10000 + Minor*100 + Patch`.
 *
 * Es ist monoton, solange keine Stelle ueber 99 laeuft, und man liest die
 * Version aus der Zahl zurueck (20001 → 2.0.1) — was beim Vergleich mit dem
 * Katalog jedes Mal hilft.
 *
 * Wirft statt zurueckzufallen: Ein `NaN` als versionCode waere genau der
 * stille Fehler, gegen den diese Datei gebaut ist. Android entscheidet Updates
 * ausschliesslich an dieser Zahl.
 */
export function versionCodeVon(name) {
  const treffer = /^(\d+)\.(\d+)\.(\d+)$/.exec(name);
  if (treffer === null) {
    throw new Error(`Version "${name}" ist nicht Major.Minor.Patch — das Schema traegt sie nicht.`);
  }

  const [, major, minor, patch] = treffer.map(Number);
  if (minor > 99 || patch > 99) {
    throw new Error(
      `Version "${name}": Minor und Patch muessen unter 100 bleiben, sonst ist der versionCode nicht mehr monoton.`,
    );
  }

  return major * 10000 + minor * 100 + patch;
}

/** Der versionCode zur Version aus `package.json` — z. B. 20001. */
export const VERSION_CODE = versionCodeVon(VERSION);
