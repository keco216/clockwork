/**
 * Der Übersetzer. Absichtlich klein — keine Bibliothek, kein Compiler, kein
 * Nachladen.
 *
 * ── Was er kann ────────────────────────────────────────────────────────────
 *   t('key')                        einfacher Text
 *   t('key', { name: 'GitHub' })    Text mit Platzhaltern
 *   tn('key', 5)                    Mehrzahl über Intl.PluralRules
 *   formatNumber(600000)            „600,000" / „600 000" / „600.000"
 *
 * ── Warum Intl.PluralRules und keine eigene Regel ──────────────────────────
 * Weil „n === 1 ? Einzahl : Mehrzahl" nur für eine Handvoll Sprachen stimmt.
 * Polnisch hat vier Formen, Arabisch sechs, Slowenisch unterscheidet die Zwei
 * von allem anderen, und Französisch zählt die 0 zur Einzahl. Diese Tabellen
 * bringt jeder Browser als CLDR-Daten mit — sie selbst zu pflegen wäre
 * derselbe Fehler wie eine eigene HMAC-Implementierung.
 *
 * ── Warum überall lateinische Ziffern ──────────────────────────────────────
 * `Intl.NumberFormat` würde auf Arabisch von sich aus ٦٠٠٬٠٠٠ liefern. Die
 * Codes müssen aber lateinisch bleiben (sie werden in fremde Anmeldefelder
 * getippt), und die Zifferblattschrift Chivo Mono kennt ohnehin nur
 * lateinische Ziffern. Zwei Ziffernsysteme auf einem Gerät wären ein
 * Ablesefehler mit Ansage — deshalb erzwingt das Unicode-Kürzel `-u-nu-latn`
 * überall dasselbe. Die eigentliche Lokalisierung, die Gruppierung, bleibt
 * erhalten.
 */

import { BASE_LOCALE, localeMeta } from './registry';
import type { PluralKey, Strings, TextKey } from './strings';

export type Params = Readonly<Record<string, string | number>>;

/** Wird von catalogue.ts gefüllt — hier nur der Typ, damit runtime.ts leicht bleibt. */
export type Catalogue = Readonly<Record<string, Strings>>;

let catalogue: Catalogue = {};
let currentCode: string = BASE_LOCALE;
let current: Strings | undefined;
let base: Strings | undefined;

const listeners = new Set<() => void>();
const pluralCache = new Map<string, Intl.PluralRules>();
const numberCache = new Map<string, Intl.NumberFormat>();

/** Einmal beim Start: den Katalog übergeben. Trennt Daten von Mechanik. */
export function installCatalogue(all: Catalogue): void {
  catalogue = all;
  base = all[BASE_LOCALE];
  current = all[currentCode] ?? base;
}

export function getLocale(): string {
  return currentCode;
}

/** Setzt die Sprache und benachrichtigt alles, was sich neu zeichnen muss. */
export function setLocale(code: string): void {
  const strings = catalogue[code];
  if (strings === undefined || code === currentCode) {
    return;
  }
  currentCode = code;
  current = strings;
  for (const listener of listeners) {
    listener();
  }
}

/** Meldet einen Rückruf an, der nach jedem Sprachwechsel läuft. */
export function onLocaleChange(listener: () => void): void {
  listeners.add(listener);
}

/** Einfacher Text, optional mit Platzhaltern. */
export function t(key: TextKey, params?: Params): string {
  // Der Rückfall auf den Schlüsselnamen ist reine Vorsicht: Der Compiler
  // garantiert über `satisfies Strings`, dass jede Locale jeden Schlüssel hat.
  const template = current?.[key] ?? base?.[key] ?? key;
  return interpolate(template, params);
}

/**
 * Text mit Mehrzahl. `count` steht in der Vorlage als `{n}` zur Verfügung und
 * wird lokalisiert gruppiert eingesetzt.
 */
export function tn(key: PluralKey, count: number, params?: Params): string {
  const entry = current?.[key] ?? base?.[key];
  if (entry === undefined) {
    return key;
  }
  const category = pluralRules().select(count);
  const template = entry[category] ?? entry.other;
  return interpolate(template, { n: count, ...params });
}

/** Eine Zahl in der Schreibweise der aktuellen Sprache, immer lateinisch. */
export function formatNumber(value: number): string {
  let formatter = numberCache.get(currentCode);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(`${currentCode}-u-nu-latn`);
    numberCache.set(currentCode, formatter);
  }
  return formatter.format(value);
}

/** Die Leserichtung der aktuellen Sprache. */
export function currentDir(): 'ltr' | 'rtl' {
  return localeMeta(currentCode).dir;
}

/* ── Innereien ─────────────────────────────────────────────────────────── */

function pluralRules(): Intl.PluralRules {
  let rules = pluralCache.get(currentCode);
  if (rules === undefined) {
    rules = new Intl.PluralRules(currentCode);
    pluralCache.set(currentCode, rules);
  }
  return rules;
}

/**
 * Ersetzt `{name}` durch den passenden Wert.
 *
 * Ein unbekannter Platzhalter bleibt unangetastet stehen, statt zu
 * verschwinden: Ein sichtbares `{foo}` fällt beim Durchsehen sofort auf, eine
 * stillschweigend gelöschte Angabe nicht.
 */
function interpolate(template: string, params?: Params): string {
  if (params === undefined) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name];
    if (value === undefined) {
      return whole;
    }
    return typeof value === 'number' ? formatNumber(value) : value;
  });
}
