import { describe, expect, it } from 'vitest';
import { OtpError, type HashAlgorithm } from './hotp';
import {
  generateTotp,
  generateTotpForCounter,
  periodProgress,
  secondsUntilNextCode,
  timeCounter,
} from './totp';
import { decodeBase32 } from './base32';

const ascii = (text: string): Uint8Array => new TextEncoder().encode(text);

/**
 * RFC 6238, Anhang B — die Secrets.
 * https://www.rfc-editor.org/rfc/rfc6238#appendix-B
 *
 * ACHTUNG, klassische Stolperfalle: Jeder Algorithmus benutzt ein ANDERES,
 * unterschiedlich langes Secret! Der Fliesstext des RFC sagt "the same secret",
 * die Seed-Tabelle darunter listet aber drei verschiedene — und nur mit denen
 * kommen die Testwerte heraus (bekanntes Erratum 2866 zum RFC). Die Längen
 * entsprechen der Ausgabelänge des jeweiligen Hashs: 20 Byte für SHA-1,
 * 32 für SHA-256, 64 für SHA-512. Wer stur 20 Byte für alle drei nimmt, bekommt
 * bei SHA-256 und SHA-512 falsche Codes und sucht den Fehler stundenlang im
 * eigenen HMAC.
 */
const SEEDS: Readonly<Record<HashAlgorithm, Uint8Array>> = {
  'SHA-1': ascii('12345678901234567890'),
  'SHA-256': ascii('12345678901234567890123456789012'),
  'SHA-512': ascii('1234567890123456789012345678901234567890123456789012345678901234'),
};

/**
 * RFC 6238, Anhang B — die Testwerte (alle mit 8 Stellen und Periode 30 s).
 */
const RFC6238_VECTORS: ReadonlyArray<{
  unixSeconds: number;
  utc: string;
  counterHex: string;
  codes: Readonly<Record<HashAlgorithm, string>>;
}> = [
  {
    unixSeconds: 59,
    utc: '1970-01-01 00:00:59',
    counterHex: '0000000000000001',
    codes: { 'SHA-1': '94287082', 'SHA-256': '46119246', 'SHA-512': '90693936' },
  },
  {
    unixSeconds: 1111111109,
    utc: '2005-03-18 01:58:29',
    counterHex: '00000000023523EC',
    codes: { 'SHA-1': '07081804', 'SHA-256': '68084774', 'SHA-512': '25091201' },
  },
  {
    unixSeconds: 1111111111,
    utc: '2005-03-18 01:58:31',
    counterHex: '00000000023523ED',
    codes: { 'SHA-1': '14050471', 'SHA-256': '67062674', 'SHA-512': '99943326' },
  },
  {
    unixSeconds: 1234567890,
    utc: '2009-02-13 23:31:30',
    counterHex: '000000000273EF07',
    codes: { 'SHA-1': '89005924', 'SHA-256': '91819424', 'SHA-512': '93441116' },
  },
  {
    unixSeconds: 2000000000,
    utc: '2033-05-18 03:33:20',
    counterHex: '0000000003F940AA',
    codes: { 'SHA-1': '69279037', 'SHA-256': '90698825', 'SHA-512': '38618901' },
  },
  {
    unixSeconds: 20000000000,
    utc: '2603-10-11 11:33:20',
    counterHex: '0000000027BC86AA',
    codes: { 'SHA-1': '65353130', 'SHA-256': '77737706', 'SHA-512': '47863826' },
  },
];

const ALGORITHMS: readonly HashAlgorithm[] = ['SHA-1', 'SHA-256', 'SHA-512'];

describe('timeCounter — counter = floor(unixZeit / periode)', () => {
  it('wechselt an absoluten 30-Sekunden-Grenzen', () => {
    expect(timeCounter(0)).toBe(0);
    expect(timeCounter(29)).toBe(0);
    expect(timeCounter(30)).toBe(1);
    expect(timeCounter(59)).toBe(1);
    expect(timeCounter(60)).toBe(2);
  });

  it('rechnet die Zählerstände aus RFC 6238 Anhang B korrekt aus', () => {
    for (const { unixSeconds, counterHex } of RFC6238_VECTORS) {
      const counter = timeCounter(unixSeconds, 30);
      expect(counter.toString(16).padStart(16, '0').toUpperCase()).toBe(counterHex);
    }
  });

  it('berücksichtigt abweichende Perioden', () => {
    expect(timeCounter(119, 60)).toBe(1);
    expect(timeCounter(120, 60)).toBe(2);
    expect(timeCounter(44, 15)).toBe(2);
  });

  it('weist unsinnige Parameter zurück', () => {
    expect(() => timeCounter(-1)).toThrow(OtpError);
    expect(() => timeCounter(Number.NaN)).toThrow(OtpError);
    expect(() => timeCounter(0, 0)).toThrow(OtpError);
    expect(() => timeCounter(0, -30)).toThrow(OtpError);
    expect(() => timeCounter(0, 1.5)).toThrow(OtpError);
  });
});

describe('secondsUntilNextCode', () => {
  it('zählt von der Periode bis 1 herunter', () => {
    expect(secondsUntilNextCode(0)).toBe(30);
    expect(secondsUntilNextCode(1)).toBe(29);
    expect(secondsUntilNextCode(29)).toBe(1);
    expect(secondsUntilNextCode(30)).toBe(30);
    expect(secondsUntilNextCode(59)).toBe(1);
  });

  it('zeigt nie 0 an', () => {
    for (let t = 0; t < 300; t += 0.25) {
      const remaining = secondsUntilNextCode(t);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30);
    }
  });
});

describe('periodProgress', () => {
  it('läuft innerhalb einer Periode von 0 bis knapp 1', () => {
    expect(periodProgress(0)).toBe(0);
    expect(periodProgress(15)).toBeCloseTo(0.5);
    expect(periodProgress(29.999)).toBeCloseTo(1, 3);
    expect(periodProgress(30)).toBe(0);
  });
});

describe('generateTotp — RFC 6238 Anhang B, alle Testvektoren', () => {
  for (const algorithm of ALGORITHMS) {
    describe(algorithm, () => {
      for (const { unixSeconds, utc, codes } of RFC6238_VECTORS) {
        it(`t = ${unixSeconds} (${utc} UTC) ergibt ${codes[algorithm]}`, async () => {
          const code = await generateTotp({
            secret: SEEDS[algorithm],
            unixSeconds,
            algorithm,
            digits: 8,
            period: 30,
          });
          expect(code).toBe(codes[algorithm]);
        });
      }
    });
  }
});

describe('generateTotp — Verhalten innerhalb einer Periode', () => {
  const secret = SEEDS['SHA-1'];

  it('liefert für die gesamte Periode denselben Code', async () => {
    const codes = await Promise.all(
      [30, 35, 45, 59, 59.999].map((unixSeconds) => generateTotp({ secret, unixSeconds })),
    );
    expect(new Set(codes).size).toBe(1);
  });

  it('liefert nach der Periodengrenze einen anderen Code', async () => {
    const before = await generateTotp({ secret, unixSeconds: 59 });
    const after = await generateTotp({ secret, unixSeconds: 60 });
    expect(before).not.toBe(after);
  });

  it('nutzt die Voreinstellungen SHA-1 / 6 Stellen / 30 s', async () => {
    // Ohne Optionen muss bei t = 59 s die 6-stellige Variante des
    // RFC-6238-Vektors 94287082 herauskommen.
    expect(await generateTotp({ secret, unixSeconds: 59 })).toBe('287082');
  });
});

describe('generateTotpForCounter — Vorschau auf den nächsten Code', () => {
  const secret = SEEDS['SHA-1'];

  it('stimmt mit dem zeitbasierten Ergebnis der nächsten Periode überein', async () => {
    const nextPreview = await generateTotpForCounter({ secret, counter: timeCounter(45) + 1 });
    const nextActual = await generateTotp({ secret, unixSeconds: 75 });
    expect(nextPreview).toBe(nextActual);
  });
});

describe('Demo-Secret der App', () => {
  it('erzeugt die Codes aus dem RFC', async () => {
    // GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ ist "12345678901234567890" in Base32 —
    // dasselbe Secret wie in RFC 4226 und RFC 6238.
    const secret = decodeBase32('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(secret).toEqual(SEEDS['SHA-1']);
    expect(await generateTotp({ secret, unixSeconds: 59 })).toBe('287082');
    expect(await generateTotp({ secret, unixSeconds: 1234567890 })).toBe('005924');
  });
});
