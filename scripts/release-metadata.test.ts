/**
 * Die drei Angaben, die ein Release zusammenhalten — gegeneinander geprüft.
 *
 * Ein Release besteht aus Dingen an mehreren Orten: `versionName`/`versionCode`
 * im Bauplan und dem Changelog unter `fastlane/…/changelogs/<versionCode>.txt`.
 * Seit F-Droid mit `AutoUpdateMode: Version` selbst zieht, liest es genau diese
 * Dateien — es fragt niemanden, ob sie zusammenpassen.
 *
 * Diese Datei prüft den EINGEFRORENEN 1.x-Baum in `android/` und die
 * Changelogs beider Fassungen. Die Version der ausgelieferten App hält
 * `native-version.test.ts` gegen `package.json` (D1b).
 *
 * ── Warum das eine Prüfung braucht ─────────────────────────────────────────
 * Der vergessene Changelog ist der teuerste Fehler dieser Kette, weil er
 * NICHT auffällt: F-Droid baut trotzdem, die App erscheint im Katalog, nur der
 * Änderungshinweis fehlt — und gesehen hat man es dann Tage später im Store,
 * wenn das Tag längst draußen ist. Ein Tag lässt sich nicht zurücknehmen, ohne
 * dass es jemand gemerkt hat.
 *
 * Genauso still liefe ein `versionCode`, der nicht zur Version passt: Android
 * entscheidet Updates ausschließlich an dieser Zahl, nicht am Namen.
 *
 * ── Die Formel ─────────────────────────────────────────────────────────────
 * `Major·10000 + Minor·100 + Patch`. Sie ist monoton, solange keine Stelle
 * über 99 läuft, und man liest die Version aus der Zahl zurück (10504 → 1.5.4)
 * — was beim Vergleich mit dem Katalog jedes Mal hilft.
 */

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { versionCodeVon } from './version.mjs';

/** F-Droids Grenze für einen Changelog, dieselbe wie Plays „What's new". */
const CHANGELOG_MAX = 500;

const SPRACHEN = ['en-US', 'de-DE'] as const;

const wurzel = (pfad: string) => fileURLToPath(new URL(`../${pfad}`, import.meta.url));

const gradle = await readFile(wurzel('android/app/build.gradle'), 'utf8');

const versionCode = Number(gradle.match(/^\s*versionCode\s+(\d+)/m)?.[1]);
const versionName = gradle.match(/^\s*versionName\s+"([^"]+)"/m)?.[1];

describe('Release-Metadaten', () => {
  it('liest versionCode und versionName aus build.gradle', () => {
    expect(Number.isInteger(versionCode)).toBe(true);
    expect(versionName).toBeDefined();
  });

  /* ── Warum hier NICHT mehr gegen package.json geprüft wird (D1b) ─────────
     Bis 2.0.0 stand hier `expect(versionName).toBe(paket.version)`, und das
     war richtig, solange `android/` die ausgelieferte App war. Seit dem
     Kotlin-Zweig ist sie es nicht mehr: Der Baum ist die eingefrorene
     1.x-WebView-Hülle, absichtlich auf 1.5.4/10504 stehengelassen, damit ein
     Tag bei F-Droid wirkungslos bleibt, solange der Metadaten-MR fehlt.

     `package.json` trägt die Version der AUSGELIEFERTEN App, also die native.
     Diese Kopplung prüft `native-version.test.ts`. Hier bleibt, was diesen
     Baum betrifft: dass er in sich stimmt und eingefroren bleibt. */
  it('die eingefrorene WebView-Fassung steht auf 1.5.4 / 10504', () => {
    expect(versionName).toBe('1.5.4');
    expect(versionCode).toBe(10504);
  });

  it('versionCode folgt der Formel Major·10000 + Minor·100 + Patch', () => {
    /* Dieselbe Formel wie für die native App, deshalb dieselbe Funktion aus
       `version.mjs` — eine zweite Rechnung an dieser Stelle wäre genau die
       Doppelung, die D1b abgeräumt hat. */
    expect(versionCode).toBe(versionCodeVon(versionName as string));
  });

  for (const sprache of SPRACHEN) {
    it(`hat einen Changelog für ${versionCode} in ${sprache}`, async () => {
      const text = await readFile(
        wurzel(`fastlane/metadata/android/${sprache}/changelogs/${versionCode}.txt`),
        'utf8',
      );

      expect(text.trim().length).toBeGreaterThan(0);
      // Zeichen zählen, nicht Byte: „ä" ist eins, im Katalog wie hier.
      expect([...text.trim()].length).toBeLessThanOrEqual(CHANGELOG_MAX);
    });
  }

  it('hat zu jedem englischen Changelog einen deutschen', async () => {
    const [englisch, deutsch] = await Promise.all(
      SPRACHEN.map(async (sprache) =>
        (await readdir(wurzel(`fastlane/metadata/android/${sprache}/changelogs`))).sort(),
      ),
    );

    expect(deutsch).toEqual(englisch);
  });

  it('hält ALLE Changelogs unter der Grenze, nicht nur den aktuellen', async () => {
    /* Ein zu langer Changelog fällt erst auf, wenn F-Droid ihn anzeigt — und
       das kann eine alte Fassung sein, denn der Katalog zeigt die Historie. */
    const zuLang: string[] = [];

    for (const sprache of SPRACHEN) {
      const ordner = `fastlane/metadata/android/${sprache}/changelogs`;
      for (const datei of await readdir(wurzel(ordner))) {
        const text = (await readFile(wurzel(`${ordner}/${datei}`), 'utf8')).trim();
        const zeichen = [...text].length;
        if (zeichen > CHANGELOG_MAX) zuLang.push(`${sprache}/${datei}: ${zeichen}`);
      }
    }

    expect(zuLang).toEqual([]);
  });

  it('nennt keinen Changelog für einen versionCode, den es nicht gibt', async () => {
    /* Ein Changelog für 10600, während build.gradle auf 10504 steht, ist ein
       halb durchgeführtes Release — entweder wurde die Version vergessen oder
       der Changelog zu früh geschrieben.

       Seit dem Kotlin-Zweig gibt es ZWEI Fassungen, die dasselbe Paket
       ausliefern: die WebView-Hülle in `android/` (1.5.4 = 10504) und die
       native App in `android-native/` (2.0.0 = 20000). Beide schreiben in
       denselben fastlane-Baum, weil F-Droid und Play die App an ihrer ID
       kennen und nicht an ihrem Bauplatz. Die Obergrenze ist deshalb der
       HÖCHSTE der beiden versionCodes — und `android-native/` wird nur
       mitgezählt, wenn es den Ordner gibt: Auf `main` liegt er nicht, und
       dort soll dieselbe Prüfung weiter gegen 10504 laufen. */
    const nativeGradle = await readFile(
      wurzel('android-native/app/build.gradle.kts'),
      'utf8',
    ).catch(() => '');
    const nativeCode = Number(nativeGradle.match(/^\s*versionCode\s*=\s*(\d+)/m)?.[1] ?? 0);
    const grenze = Math.max(versionCode, nativeCode);

    const dateien = await readdir(wurzel('fastlane/metadata/android/en-US/changelogs'));
    const codes = dateien.map((d) => Number(d.replace('.txt', '')));

    expect(codes.every(Number.isInteger)).toBe(true);
    expect(Math.max(...codes)).toBeLessThanOrEqual(grenze);
  });
});
