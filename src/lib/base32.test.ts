import { describe, expect, it } from 'vitest';
import { Base32Error, decodeBase32, encodeBase32 } from './base32';

const ascii = (text: string): Uint8Array => new TextEncoder().encode(text);
const toText = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/**
 * Die offiziellen Testvektoren aus RFC 4648, Abschnitt 10.
 * Sie decken genau die interessanten Fälle ab: jeden möglichen Rest beim
 * Auffüllen des 40-Bit-Blocks.
 */
const RFC4648_VECTORS: ReadonlyArray<readonly [plain: string, encoded: string]> = [
  ['', ''],
  ['f', 'MY======'],
  ['fo', 'MZXQ===='],
  ['foo', 'MZXW6==='],
  ['foob', 'MZXW6YQ='],
  ['fooba', 'MZXW6YTB'],
  ['foobar', 'MZXW6YTBOI======'],
];

describe('encodeBase32 — RFC 4648 Abschnitt 10', () => {
  for (const [plain, encoded] of RFC4648_VECTORS) {
    it(`codiert "${plain}" zu "${encoded}"`, () => {
      expect(encodeBase32(ascii(plain))).toBe(encoded);
    });
  }

  it('lässt das Padding auf Wunsch weg', () => {
    expect(encodeBase32(ascii('foo'), { padding: false })).toBe('MZXW6');
    expect(encodeBase32(ascii('foobar'), { padding: false })).toBe('MZXW6YTBOI');
  });
});

describe('decodeBase32 — RFC 4648 Abschnitt 10', () => {
  for (const [plain, encoded] of RFC4648_VECTORS) {
    if (encoded === '') continue; // leere Eingabe ist bei uns ein Fehler, siehe unten
    it(`decodiert "${encoded}" zu "${plain}"`, () => {
      expect(toText(decodeBase32(encoded))).toBe(plain);
    });
  }
});

describe('decodeBase32 — Round-trip', () => {
  it('führt für alle Längen 1…40 zurück zum Ausgangs-Byte-Array', () => {
    for (let length = 1; length <= 40; length++) {
      // Deterministische Pseudo-Bytes: reproduzierbar, aber über den ganzen
      // Wertebereich verteilt.
      const original = Uint8Array.from({ length }, (_, i) => (i * 37 + 11) % 256);
      expect(decodeBase32(encodeBase32(original))).toEqual(original);
    }
  });

  it('funktioniert auch ohne Padding', () => {
    for (let length = 1; length <= 20; length++) {
      const original = Uint8Array.from({ length }, (_, i) => (i * 53 + 7) % 256);
      expect(decodeBase32(encodeBase32(original, { padding: false }))).toEqual(original);
    }
  });
});

describe('decodeBase32 — Toleranz gegenüber echten Eingaben', () => {
  const expected = decodeBase32('JBSWY3DPEHPK3PXP');

  it('akzeptiert Kleinbuchstaben', () => {
    expect(decodeBase32('jbswy3dpehpk3pxp')).toEqual(expected);
  });

  it('akzeptiert gemischte Schreibweise', () => {
    expect(decodeBase32('JbSwY3dPeHpK3pXp')).toEqual(expected);
  });

  it('akzeptiert Leerzeichen als Lesehilfe', () => {
    expect(decodeBase32('JBSW Y3DP EHPK 3PXP')).toEqual(expected);
  });

  it('akzeptiert Bindestriche und Zeilenumbrüche', () => {
    expect(decodeBase32('JBSW-Y3DP-EHPK-3PXP')).toEqual(expected);
    expect(decodeBase32('JBSWY3DP\nEHPK3PXP')).toEqual(expected);
    expect(decodeBase32('  JBSWY3DPEHPK3PXP  ')).toEqual(expected);
  });

  it('akzeptiert fehlendes und vorhandenes Padding gleichermassen', () => {
    expect(decodeBase32('MZXW6===')).toEqual(decodeBase32('MZXW6'));
    expect(decodeBase32('MZXW6YQ=')).toEqual(decodeBase32('MZXW6YQ'));
  });

  it('decodiert das RFC-Test-Secret zurück nach ASCII', () => {
    // Dieses Secret taucht in RFC 4226 und RFC 6238 auf — und in der Demo der App.
    expect(toText(decodeBase32('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'))).toBe(
      '12345678901234567890',
    );
  });
});

describe('decodeBase32 — Fehlerfälle', () => {
  it('lehnt eine leere Eingabe ab', () => {
    expect(() => decodeBase32('')).toThrow(Base32Error);
    expect(() => decodeBase32('   ')).toThrow(/leer/i);
    expect(() => decodeBase32('====')).toThrow(/leer/i);
  });

  it('lehnt Zeichen ausserhalb des Alphabets ab', () => {
    // 0, 1 und 8 gibt es in Base32 nicht.
    expect(() => decodeBase32('ABCD0FGH')).toThrow(Base32Error);
    expect(() => decodeBase32('ABCD1FGH')).toThrow(Base32Error);
    expect(() => decodeBase32('ABCD8FGH')).toThrow(Base32Error);
    expect(() => decodeBase32('ABCD$FGH')).toThrow(Base32Error);
    expect(() => decodeBase32('ÄBCDEFGH')).toThrow(Base32Error);
  });

  it('nennt das störende Zeichen in der Fehlermeldung', () => {
    expect(() => decodeBase32('JBSW0Y3D')).toThrow(/»0«/);
    expect(() => decodeBase32('JBSW0Y3D')).toThrow(/Stelle 5/);
  });

  it('lehnt Padding mitten im String ab', () => {
    expect(() => decodeBase32('MZXW6===YTB')).toThrow(/=/);
  });

  it('lehnt unmögliche Längen ab', () => {
    // Reste 1, 3 und 6 (mod 8) können nie entstanden sein.
    expect(() => decodeBase32('A')).toThrow(/Länge/);
    expect(() => decodeBase32('ABC')).toThrow(/Länge/);
    expect(() => decodeBase32('ABCDEF')).toThrow(/Länge/);
    expect(() => decodeBase32('ABCDEFGHA')).toThrow(/Länge/);
  });

  it('akzeptiert alle möglichen Längen', () => {
    for (const validLength of [2, 4, 5, 7, 8, 10, 16, 26, 32]) {
      const input = 'A'.repeat(validLength);
      expect(() => decodeBase32(input)).not.toThrow();
      expect(decodeBase32(input)).toHaveLength(Math.floor((validLength * 5) / 8));
    }
  });
});
