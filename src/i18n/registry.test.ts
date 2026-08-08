/**
 * Spracherkennung.
 *
 * `navigator.languages` liefert selten genau die Tags, die wir anbieten. Hier
 * steht, was in den Fällen passiert, die real vorkommen: Regionalvarianten,
 * chinesische Schriftformen, veraltete ISO-Codes und Unbekanntes.
 */

import { afterEach, describe, expect, it } from 'vitest';

import {
  BASE_LOCALE,
  bundledLocales,
  isBundledLocale,
  localeMeta,
  LOCALES,
  resolveLocale,
  restrictToBundled,
} from './registry';

const ALL = LOCALES.map((locale) => locale.code);

// `restrictToBundled()` ist Zustand im Modul. Nach jedem Test wieder auf
// „alles da" stellen, sonst färbt ein Teil-Bündel auf den nächsten Test ab.
afterEach(() => {
  restrictToBundled(ALL);
});

describe('resolveLocale()', () => {
  it('nimmt einen Volltreffer', () => {
    expect(resolveLocale(['de'])).toBe('de');
    expect(resolveLocale(['pt-BR'])).toBe('pt-BR');
    expect(resolveLocale(['zh-Hant'])).toBe('zh-Hant');
  });

  it('ist unempfindlich gegen Groß- und Kleinschreibung', () => {
    expect(resolveLocale(['DE'])).toBe('de');
    expect(resolveLocale(['zh-hans'])).toBe('zh-Hans');
    expect(resolveLocale(['PT-br'])).toBe('pt-BR');
  });

  it('fällt von der Region auf die Sprache zurück', () => {
    expect(resolveLocale(['de-AT'])).toBe('de');
    expect(resolveLocale(['de-CH'])).toBe('de');
    expect(resolveLocale(['en-GB'])).toBe('en');
    expect(resolveLocale(['fr-CA'])).toBe('fr');
    expect(resolveLocale(['es-MX'])).toBe('es');
  });

  it('unterscheidet die beiden Portugiesisch', () => {
    expect(resolveLocale(['pt'])).toBe('pt-PT');
    expect(resolveLocale(['pt-PT'])).toBe('pt-PT');
    expect(resolveLocale(['pt-BR'])).toBe('pt-BR');
    expect(resolveLocale(['pt-AO'])).toBe('pt-PT');
  });

  it('bildet Chinesisch über Schrift und Region ab', () => {
    expect(resolveLocale(['zh-TW'])).toBe('zh-Hant');
    expect(resolveLocale(['zh-HK'])).toBe('zh-Hant');
    expect(resolveLocale(['zh-MO'])).toBe('zh-Hant');
    expect(resolveLocale(['zh-CN'])).toBe('zh-Hans');
    expect(resolveLocale(['zh-SG'])).toBe('zh-Hans');
    expect(resolveLocale(['zh-Hant-TW'])).toBe('zh-Hant');
    expect(resolveLocale(['zh-Hans-CN'])).toBe('zh-Hans');
    // Ohne Region ist vereinfacht die verbreitetere Annahme.
    expect(resolveLocale(['zh'])).toBe('zh-Hans');
  });

  it('kennt die alten ISO-Codes, die Java und Android bis heute senden', () => {
    expect(resolveLocale(['iw'])).toBe('he');
    expect(resolveLocale(['in'])).toBe('id');
    expect(resolveLocale(['no'])).toBe('nb');
    expect(resolveLocale(['nn-NO'])).toBe('nb');
  });

  it('geht die Wunschliste der Reihe nach durch', () => {
    expect(resolveLocale(['kl', 'mi', 'fi-FI', 'de'])).toBe('fi');
    expect(resolveLocale(['', ' ', 'ko'])).toBe('ko');
  });

  it('landet bei Englisch, wenn nichts passt', () => {
    expect(resolveLocale(['kl'])).toBe(BASE_LOCALE);
    expect(resolveLocale([])).toBe(BASE_LOCALE);
    expect(resolveLocale(['xx-YY'])).toBe('en');
  });
});

describe('Registry', () => {
  it('hat für jede Sprache einen Eigennamen, eine Richtung und ein Schriftsystem', () => {
    for (const locale of LOCALES) {
      expect(locale.name.trim(), locale.code).not.toBe('');
      expect(['ltr', 'rtl']).toContain(locale.dir);
      expect(locale.script.trim(), locale.code).not.toBe('');
    }
  });

  it('vergibt keinen Code und keinen Eigennamen doppelt', () => {
    expect(new Set(LOCALES.map((l) => l.code)).size).toBe(LOCALES.length);
    expect(new Set(LOCALES.map((l) => l.name)).size).toBe(LOCALES.length);
  });

  it('führt genau Arabisch und Hebräisch von rechts nach links', () => {
    const rtl = LOCALES.filter((locale) => locale.dir === 'rtl').map((locale) => locale.code);
    expect(rtl.sort()).toEqual(['ar', 'he']);
  });

  it('liefert Metadaten unabhängig von der Schreibweise', () => {
    expect(localeMeta('ZH-hANT').code).toBe('zh-Hant');
    expect(isBundledLocale('pt-br')).toBe(true);
    expect(isBundledLocale('kl')).toBe(false);
  });

  it('kennt für jede Sprache gültige Intl-Daten', () => {
    // Fängt Tippfehler im Code ab: `new Intl.PluralRules('zh-Hnat')` wirft nicht,
    // sondern liefert stillschweigend die Regeln der Ersatzsprache.
    for (const locale of LOCALES) {
      const resolved = new Intl.PluralRules(locale.code).resolvedOptions().locale;
      expect(resolved.toLowerCase(), locale.code).toContain(
        locale.code.split('-')[0]?.toLowerCase() ?? '',
      );
    }
  });
});

/**
 * Ein Bündel, das über `CLOCKWORK_LANGS` beschnitten wurde (siehe
 * scripts/locale-subset.ts). Die Metadaten-Tabelle bleibt dabei vollständig —
 * beschnitten ist der Katalog, und `installCatalogue()` meldet das hierher.
 */
describe('Teil-Bündel', () => {
  it('bietet nur an, was mitgekommen ist', () => {
    restrictToBundled(['de', 'en', 'fr']);
    expect(bundledLocales().map((locale) => locale.code)).toEqual(['de', 'en', 'fr']);
    expect(isBundledLocale('de')).toBe(true);
    expect(isBundledLocale('ja')).toBe(false);
  });

  it('behält die Reihenfolge der Tabelle, nicht die der Meldung', () => {
    restrictToBundled(['ja', 'fr', 'en']);
    expect(bundledLocales().map((locale) => locale.code)).toEqual(['en', 'fr', 'ja']);
  });

  it('schickt eine fehlende Sprache nach Englisch statt ins Leere', () => {
    restrictToBundled(['de', 'en', 'fr']);
    expect(resolveLocale(['ja'])).toBe(BASE_LOCALE);
    expect(resolveLocale(['ja-JP', 'de-AT'])).toBe('de');
    expect(resolveLocale(['de'])).toBe('de');
  });

  it('nimmt die verwandte Variante, bevor es zu Englisch greift', () => {
    // Für einen brasilianischen Browser ist europäisches Portugiesisch die
    // deutlich bessere Antwort als Englisch — und umgekehrt.
    restrictToBundled(['en', 'pt-PT']);
    expect(resolveLocale(['pt-BR'])).toBe('pt-PT');
    restrictToBundled(['en', 'pt-BR']);
    expect(resolveLocale(['pt-PT'])).toBe('pt-BR');

    restrictToBundled(['en', 'zh-Hant']);
    expect(resolveLocale(['zh-CN'])).toBe('zh-Hant');
    restrictToBundled(['en', 'zh-Hans']);
    expect(resolveLocale(['zh-TW'])).toBe('zh-Hans');
  });

  it('läuft mit einer einzigen Sprache immer noch', () => {
    restrictToBundled(['en']);
    expect(bundledLocales().map((locale) => locale.code)).toEqual(['en']);
    expect(resolveLocale(['de-AT', 'fr'])).toBe('en');
  });

  it('lässt die Metadaten aller Sprachen unangetastet', () => {
    // Die Tabelle wird nicht beschnitten: `resolveLocale()` braucht sie ganz,
    // um pt-BR und pt-PT überhaupt als Geschwister zu erkennen.
    restrictToBundled(['en']);
    expect(LOCALES).toHaveLength(37);
    expect(localeMeta('ja').name).toBe('日本語');
  });
});
