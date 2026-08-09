/**
 * Wonach der Filter auf der Bühne sucht.
 *
 * Eigene Datei und nicht eine Funktion in app.ts, aus einem einzigen Grund: So
 * lässt sie sich prüfen. app.ts fasst beim Start das Dokument an und ist damit
 * in einem Node-Testlauf nicht zu importieren; diese Datei kennt kein DOM,
 * keine Uhr und keine Übersetzung — sie bekommt einen Eintrag und gibt eine
 * Zeichenkette zurück.
 *
 * ── Was NICHT durchsucht wird ─────────────────────────────────────────────
 * Der Code. Er ändert sich alle dreißig Sekunden, und ein Filter, dessen
 * Treffer mit der Uhr wandern, ist kein Filter — man tippt „123", bekommt drei
 * Zeilen, und beim nächsten Blick sind es andere drei.
 *
 * Das Secret. Es ist kein Suchbegriff. Wer danach sucht, sucht nach etwas, das
 * er nicht sehen können soll.
 */

import type { ParsedEntry } from '../lib/accounts';

/** Kombinierende Zeichen — alles, was in NFD hinter einem Grundbuchstaben steht. */
const COMBINING = /[̀-ͯ]/gu;

/**
 * Beide Seiten des Vergleichs auf dieselbe Form bringen.
 *
 * ── Warum nicht einfach `toLowerCase()` ────────────────────────────────────
 * Weil Kontonamen selten aus dem ASCII-Bereich stammen. Wer „Müller" gespeichert
 * hat und „muller" tippt, meint dasselbe Konto; wer „Zoë" tippt, ebenso. Ein
 * Filter über Eigennamen, der auf einem Akzent besteht, ist in der Hälfte
 * Europas unbrauchbar.
 *
 * ── Warum nicht `toLocaleLowerCase()` ─────────────────────────────────────
 * Das war der erste Versuch, und er beruhte auf einem Irrtum: Ohne ausdrückliche
 * Sprachangabe nimmt `toLocaleLowerCase()` die Sprache des SYSTEMS, nicht die
 * der Oberfläche — und verhält sich damit in aller Regel wie `toLowerCase()`.
 * Das türkische „İ" wird so zu „i" plus kombinierendem Punkt und findet
 * „istanbul" nicht. Aufgefallen ist das nicht beim Nachdenken, sondern im Test.
 *
 * Eine Sprachangabe mitzugeben wäre ebenfalls falsch: Ein Kontoname ist
 * Nutzerdatum und hat mit der eingestellten Oberflächensprache nichts zu tun.
 * Ein Deutscher kann ein türkisches Konto haben.
 *
 * Die Zerlegung nach NFD und das Wegwerfen der kombinierenden Zeichen löst
 * beides auf einmal: „İ" zerfällt in „I" und einen Punkt, der Punkt fällt weg,
 * übrig bleibt „i". Genau dasselbe passiert mit „ü", „é" und „å".
 *
 * Was das NICHT löst und auch nicht soll: „ß" und „ı" zerfallen nicht — sie
 * sind eigene Buchstaben, keine Buchstaben mit Zeichen darauf.
 */
function fold(text: string): string {
  return text.normalize('NFD').replace(COMBINING, '').toLowerCase();
}

/**
 * Der vorbereitete Suchtext eines Eintrags — einmal je Kanalzug gefaltet, nicht
 * bei jedem Tastendruck über die ganze Liste.
 *
 * Bei einer unlesbaren Zeile sind es die Zeile selbst und ihre Fehlermeldung:
 * Wer in einer langen Liste den Fehler sucht, sucht nach dem, was er getippt
 * hat.
 */
export function describeForSearch(entry: ParsedEntry): string {
  const parts =
    entry.kind === 'account'
      ? [entry.account.issuer, entry.account.accountName]
      : [entry.source, entry.message];

  return fold(parts.filter((part): part is string => part !== undefined && part !== '').join(' '));
}

/**
 * Passt ein vorbereiteter Suchtext zur Eingabe?
 *
 * Eine leere Eingabe passt auf alles — sonst müsste jede aufrufende Stelle den
 * Sonderfall selbst kennen, und eine davon vergäße ihn.
 *
 * Enthalten statt „beginnt mit": Konten heißen „ACME Co" und „Hetzner Cloud";
 * wer „cloud" tippt, meint das zweite.
 */
export function matchesFilter(haystack: string, needle: string): boolean {
  const folded = fold(needle.trim());
  return folded === '' || haystack.includes(folded);
}
