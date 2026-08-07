/**
 * Der Übersetzer selbst: Einsetzen, Mehrzahl, Zahlen.
 *
 * Die Mehrzahl-Fälle sind bewusst mit ausgeschriebenen Erwartungen notiert und
 * nicht gegen den Katalog geprüft — sonst würde der Test nur bestätigen, dass
 * der Katalog gleich dem Katalog ist. So steht hier nachlesbar, was in
 * Polnisch, Russisch, Tschechisch und Arabisch bei 0, 1, 2, 5 und 21
 * herauskommen MUSS.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { CATALOGUE } from './catalogue';
import { formatNumber, getLocale, installCatalogue, setLocale, t, tn } from './runtime';

installCatalogue(CATALOGUE);

beforeEach(() => {
  setLocale('en');
});

describe('t()', () => {
  it('liefert den Text der eingestellten Sprache', () => {
    expect(t('zone.vault')).toBe('Vault');
    setLocale('de');
    expect(t('zone.vault')).toBe('Tresor');
  });

  it('setzt Platzhalter ein', () => {
    expect(t('strip.accountFallback', { n: 3 })).toBe('Account 3');
  });

  it('lässt einen unbekannten Platzhalter stehen, statt ihn zu verschlucken', () => {
    // Sichtbar falsch ist besser als unsichtbar falsch.
    expect(t('strip.copyAria', {})).toContain('{name}');
  });

  it('formatiert Zahlen in der Schreibweise der Sprache', () => {
    setLocale('de');
    expect(t('vault.explain', { iterations: formatNumber(600_000) })).toContain('600.000');
    setLocale('en');
    expect(t('vault.explain', { iterations: formatNumber(600_000) })).toContain('600,000');
  });
});

describe('formatNumber()', () => {
  it('gruppiert nach Landesbrauch', () => {
    setLocale('de');
    expect(formatNumber(600_000)).toBe('600.000');
    setLocale('fr');
    // Französisch trennt mit einem schmalen geschützten Leerzeichen.
    expect(formatNumber(600_000).replace(/\s/gu, ' ')).toBe('600 000');
  });

  it('benutzt überall lateinische Ziffern — auch auf Arabisch', () => {
    // Ohne `-u-nu-latn` käme hier ٦٠٠٬٠٠٠ heraus. Die Codes müssen lateinisch
    // bleiben, und zwei Ziffernsysteme auf einem Gerät wären ein Ablesefehler.
    setLocale('ar');
    expect(formatNumber(600_000), 'keine arabisch-indischen Ziffern').not.toMatch(/[٠-٩]/u);
    expect(formatNumber(21)).toBe('21');
    setLocale('hi');
    expect(formatNumber(21)).toBe('21');
  });
});

describe('tn() — Mehrzahl', () => {
  it('Englisch: eine Form gegen alle anderen', () => {
    expect(tn('input.count.accounts', 1)).toBe('1 account');
    expect(tn('input.count.accounts', 0)).toBe('0 accounts');
    expect(tn('input.count.accounts', 2)).toBe('2 accounts');
  });

  it('Deutsch', () => {
    setLocale('de');
    expect(tn('input.count.accounts', 1)).toBe('1 Konto');
    expect(tn('input.count.accounts', 5)).toBe('5 Konten');
  });

  it('Polnisch: one / few / many', () => {
    setLocale('pl');
    expect(tn('input.count.accounts', 0)).toBe('0 kont');
    expect(tn('input.count.accounts', 1)).toBe('1 konto');
    expect(tn('input.count.accounts', 2)).toBe('2 konta');
    expect(tn('input.count.accounts', 5)).toBe('5 kont');
    expect(tn('input.count.accounts', 21)).toBe('21 kont');
  });

  it('Russisch: 21 gehört zur Einzahl', () => {
    setLocale('ru');
    expect(tn('input.count.accounts', 0)).toBe('0 учётных записей');
    expect(tn('input.count.accounts', 1)).toBe('1 учётная запись');
    expect(tn('input.count.accounts', 2)).toBe('2 учётные записи');
    expect(tn('input.count.accounts', 5)).toBe('5 учётных записей');
    expect(tn('input.count.accounts', 21)).toBe('21 учётная запись');
  });

  it('Tschechisch: 0 und 5 fallen auf »other«', () => {
    setLocale('cs');
    expect(tn('input.count.accounts', 0)).toBe('0 účtů');
    expect(tn('input.count.accounts', 1)).toBe('1 účet');
    expect(tn('input.count.accounts', 2)).toBe('2 účty');
    expect(tn('input.count.accounts', 5)).toBe('5 účtů');
    expect(tn('input.count.accounts', 21)).toBe('21 účtů');
  });

  it('Arabisch: zero / one / two / few / many', () => {
    setLocale('ar');
    expect(tn('input.count.accounts', 0)).toBe('0 حساب');
    expect(tn('input.count.accounts', 1)).toBe('1 حساب');
    expect(tn('input.count.accounts', 2)).toBe('2 حساب');
    expect(tn('input.count.accounts', 5)).toBe('5 حسابات');
    expect(tn('input.count.accounts', 21)).toBe('21 حسابًا');
  });

  it('Sprachen ohne Mehrzahl kommen mit einer Form aus', () => {
    setLocale('ja');
    // Ohne Leerzeichen vor dem Zähleinheitswort — so schreibt man das dort.
    expect(tn('input.count.accounts', 1)).toBe('1件のアカウント');
    expect(tn('input.count.accounts', 7)).toBe('7件のアカウント');
    setLocale('id');
    expect(tn('input.count.accounts', 7)).toBe('7 akun');
  });
});

describe('setLocale()', () => {
  it('ignoriert eine unbekannte Sprache, statt die Oberfläche zu leeren', () => {
    setLocale('kl');
    expect(getLocale()).toBe('en');
  });
});
