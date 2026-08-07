/**
 * Vollständigkeit des Katalogs.
 *
 * Der Compiler prüft über `satisfies Strings` bereits, dass jede Locale jeden
 * Schlüssel hat und keinen zu viel. Was er NICHT sehen kann, steht hier:
 *
 *   • ob die Platzhalter übereinstimmen — `{n}` in `en`, aber vergessen in `pl`,
 *     wäre ein Typ-korrekter Satz mit fehlender Zahl;
 *   • ob die Mehrzahlformen zu den CLDR-Regeln der jeweiligen Sprache passen —
 *     Polnisch braucht vier, Arabisch sechs, Indonesisch eine;
 *   • ob überhaupt etwas dasteht.
 */

import { describe, expect, it } from 'vitest';

import { CATALOGUE } from './catalogue';
import en from './locales/en';
import { LOCALES } from './registry';
import type { Plural, PluralCategory, Strings } from './strings';

const CODES = LOCALES.map((locale) => locale.code);
const KEYS = Object.keys(en) as (keyof Strings)[];

const PLURAL_KEYS = KEYS.filter((key) => typeof en[key] === 'object');
const TEXT_KEYS = KEYS.filter((key) => typeof en[key] === 'string');

const VALID_CATEGORIES: readonly PluralCategory[] = ['zero', 'one', 'two', 'few', 'many', 'other'];

/** Die Namen aller `{platzhalter}` in einer Vorlage. */
function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '').sort();
}

describe('Katalog', () => {
  it('enthält genau die Sprachen aus der Registry', () => {
    expect(Object.keys(CATALOGUE).sort()).toEqual([...CODES].sort());
  });

  it('hat 37 Sprachen', () => {
    // Die Liste im Auftrag ist mit „36" überschrieben, zählt aber 37 Einträge.
    // Umgesetzt ist die Liste, nicht die Überschrift.
    expect(CODES).toHaveLength(37);
  });
});

describe.each(CODES)('%s', (code) => {
  const locale = CATALOGUE[code] as Strings;

  it('hat exakt die Schlüssel von en', () => {
    expect(Object.keys(locale).sort()).toEqual([...KEYS].sort());
  });

  it('hat nirgends einen leeren Text', () => {
    for (const key of TEXT_KEYS) {
      expect((locale[key] as string).trim(), `${code}/${key}`).not.toBe('');
    }
    for (const key of PLURAL_KEYS) {
      for (const [category, form] of Object.entries(locale[key] as Plural)) {
        expect(form.trim(), `${code}/${key}/${category}`).not.toBe('');
      }
    }
  });

  it('benutzt dieselben Platzhalter wie en', () => {
    for (const key of TEXT_KEYS) {
      expect(placeholders(locale[key] as string), `${code}/${key}`).toEqual(
        placeholders(en[key] as string),
      );
    }
  });

  it('benutzt in jeder Mehrzahlform die Platzhalter von en', () => {
    for (const key of PLURAL_KEYS) {
      const expected = placeholders((en[key] as Plural).other);
      for (const [category, form] of Object.entries(locale[key] as Plural)) {
        expect(placeholders(form), `${code}/${key}/${category}`).toEqual(expected);
      }
    }
  });

  /**
   * Die verbindliche Liste liefert `Intl` selbst — sie stammt aus denselben
   * CLDR-Daten, nach denen `tn()` zur Laufzeit auswählt. Eine fehlende Kategorie
   * wäre ein Satz, den nie jemand zu sehen bekommt; eine erfundene wäre ein
   * Tippfehler.
   */
  it('deckt die Mehrzahl-Kategorien ab, die diese Sprache kennt', () => {
    const required = new Intl.PluralRules(code).resolvedOptions().pluralCategories;
    for (const key of PLURAL_KEYS) {
      const entry = locale[key] as Plural;
      for (const category of required) {
        expect(entry, `${code}/${key} braucht »${category}«`).toHaveProperty(category);
      }
      for (const category of Object.keys(entry)) {
        expect(VALID_CATEGORIES, `${code}/${key} kennt »${category}« nicht`).toContain(category);
      }
    }
  });
});
