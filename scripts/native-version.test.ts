/**
 * Die native App trägt dieselbe Version wie `package.json` — geprüft, nicht
 * gehofft.
 *
 * ── Warum es diese Prüfung gibt ────────────────────────────────────────────
 * Der Sprung von 2.0.0 auf 2.0.1 hat gezeigt, wie eine Versionsnummer
 * auseinanderläuft: Sie stand an fünf Stellen, jede für sich richtig gepflegt,
 * und nichts hielt sie zusammen. `scripts/version.mjs` macht `package.json`
 * zur einen Quelle — aber `android-native/app/build.gradle.kts` kann sie nicht
 * lesen, denn Gradle liest kein JSON aus dem Web-Baum, und ein Generator, der
 * die Datei umschriebe, wäre die nächste stille Quelle: Er liefe beim Bauen,
 * und niemand sähe die Änderung im Diff.
 *
 * Also die andere Richtung: Die Zahl steht von Hand im Bauplan, und dieser
 * Test hält sie gegen die Quelle. Wer eine der beiden ändert und die andere
 * vergisst, sieht Rot — vor dem Tag, nicht nach dem Upload.
 *
 * ── Was ein falscher versionCode kostet ────────────────────────────────────
 * Android entscheidet Updates ausschließlich an dieser Zahl, nicht am Namen.
 * Ein versionCode, der zum Namen nicht passt, fällt nirgends auf: Der Build
 * läuft, der Store nimmt ihn an, und erst die Geräte melden sich nicht zum
 * Update. Play nimmt eine Nummer außerdem kein zweites Mal an — ein versehen
 * hochgeladener Code ist dauerhaft verbrannt (genau das ist 20000 passiert).
 *
 * ── Diese Prüfung war absichtlich einmal rot ───────────────────────────────
 * Gegenprobe beim Schreiben: `versionCode` im Bauplan versuchsweise auf 20002
 * gesetzt. Der Test meldete
 * „expected 20002 to be 20001" — er sieht den Unterschied also wirklich. Ein
 * Test, der nur grün werden kann, prüft nichts.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { VERSION, VERSION_CODE, versionCodeVon } from './version.mjs';

const wurzel = (pfad: string) => fileURLToPath(new URL(`../${pfad}`, import.meta.url));

const gradle = await readFile(wurzel('android-native/app/build.gradle.kts'), 'utf8');

const versionName = /^\s*versionName\s*=\s*"([^"]+)"/m.exec(gradle)?.[1];
const versionCode = Number(/^\s*versionCode\s*=\s*(\d+)/m.exec(gradle)?.[1]);

describe('Native Version gegen package.json', () => {
  it('liest beide Angaben aus build.gradle.kts', () => {
    /* Zuerst die Messung selbst prüfen: Ein Muster, das nichts trifft, ergibt
       `undefined` bzw. `NaN` — und ein Vergleich gegen `undefined` schlägt
       zwar fehl, sagt aber das Falsche. Wer zwei Dinge vergleicht, zeigt
       zuerst, dass er beide gelesen hat. */
    expect(versionName, 'versionName nicht in build.gradle.kts gefunden').toBeDefined();
    expect(Number.isInteger(versionCode), 'versionCode nicht in build.gradle.kts gefunden').toBe(
      true,
    );
  });

  it('versionName ist die Version aus package.json', () => {
    expect(versionName).toBe(VERSION);
  });

  it('versionCode folgt dem Hausschema Major·10000 + Minor·100 + Patch', () => {
    expect(versionCode).toBe(VERSION_CODE);
    // Und derselbe Wert noch einmal aus dem Namen im Bauplan gerechnet: Damit
    // ist auch der Fall abgedeckt, dass BEIDE Dateien gemeinsam falsch sind.
    expect(versionCode).toBe(versionCodeVon(versionName as string));
  });

  it('liegt über dem letzten Stand der WebView-Fassung', async () => {
    /* Die native App löst die 1.x-Fassung als Update ab — dieselbe
       applicationId, derselbe Katalogeintrag. Ein versionCode darunter würde
       vom Gerät als Rückschritt abgelehnt, und zwar wortlos. */
    const alt = await webViewVersionCode();
    expect(alt, 'versionCode der WebView-Fassung nicht gelesen').toBeGreaterThan(0);
    expect(versionCode).toBeGreaterThan(alt);
  });
});

/** Der versionCode der eingefrorenen WebView-Fassung in `android/`. */
async function webViewVersionCode(): Promise<number> {
  const text = await readFile(wurzel('android/app/build.gradle'), 'utf8').catch(() => '');
  return Number(/^\s*versionCode\s+(\d+)/m.exec(text)?.[1] ?? 0);
}
