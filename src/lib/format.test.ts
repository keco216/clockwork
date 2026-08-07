import { describe, expect, it } from 'vitest';
import { describeIdentity, describeParameters, groupDigits, truncateForDisplay } from './format';
import type { Account } from './accounts';

const account = (overrides: Partial<Account> = {}): Account => ({
  issuer: undefined,
  accountName: undefined,
  secret: new Uint8Array(10),
  algorithm: 'SHA-1',
  digits: 6,
  period: 30,
  ...overrides,
});

describe('groupDigits', () => {
  it('teilt sechs Ziffern in zwei Dreierblöcke', () => {
    expect(groupDigits('123456')).toBe('123 456');
  });

  it('gibt bei ungerader Länge dem vorderen Block die Extraziffer', () => {
    expect(groupDigits('1234567')).toBe('1234 567');
  });

  it('teilt acht Ziffern in zwei Viererblöcke', () => {
    expect(groupDigits('12345678')).toBe('1234 5678');
  });

  it('lässt sehr kurze Codes unangetastet', () => {
    expect(groupDigits('1234')).toBe('1234');
    expect(groupDigits('')).toBe('');
  });

  it('behält führende Nullen', () => {
    expect(groupDigits('000042')).toBe('000 042');
  });
});

describe('describeParameters', () => {
  it('nennt Algorithmus, Stellen und Periode', () => {
    expect(describeParameters(account())).toBe('SHA-1 · 6 Stellen · 30 s');
    expect(describeParameters(account({ algorithm: 'SHA-256', digits: 8, period: 60 }))).toBe(
      'SHA-256 · 8 Stellen · 60 s',
    );
  });
});

describe('describeIdentity', () => {
  it('nutzt Issuer als Titel und Konto als Unterzeile', () => {
    expect(describeIdentity(account({ issuer: 'GitHub', accountName: 'kevin' }), 0)).toEqual({
      title: 'GitHub',
      subtitle: 'kevin',
    });
  });

  it('kommt mit nur einem der beiden Werte aus', () => {
    expect(describeIdentity(account({ issuer: 'GitHub' }), 0)).toEqual({
      title: 'GitHub',
      subtitle: undefined,
    });
    expect(describeIdentity(account({ accountName: 'kevin@example.com' }), 0)).toEqual({
      title: 'kevin@example.com',
      subtitle: undefined,
    });
  });

  it('nummeriert namenlose Konten durch', () => {
    expect(describeIdentity(account(), 0).title).toBe('Konto 1');
    expect(describeIdentity(account(), 4).title).toBe('Konto 5');
  });
});

describe('truncateForDisplay', () => {
  it('lässt kurze Texte in Ruhe', () => {
    expect(truncateForDisplay('kurz')).toBe('kurz');
  });

  it('kürzt in der Mitte und behält Anfang und Ende', () => {
    // 21 Zeichen = 10 vom Anfang + "…" + 10 vom Ende.
    const result = truncateForDisplay('A'.repeat(30) + 'B'.repeat(30), 21);
    expect(result).toBe(`${'A'.repeat(10)}…${'B'.repeat(10)}`);
    expect(result).toHaveLength(21);
  });

  it('kürzt bei ungerader Restlänge den vorderen Teil länger', () => {
    // 20 Zeichen = 10 vom Anfang + "…" + 9 vom Ende.
    const result = truncateForDisplay('A'.repeat(30) + 'B'.repeat(30), 20);
    expect(result).toBe(`${'A'.repeat(10)}…${'B'.repeat(9)}`);
  });
});
