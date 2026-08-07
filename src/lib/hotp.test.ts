import { describe, expect, it } from 'vitest';
import { counterToBytes, dynamicTruncate, generateHotp, hmac, OtpError } from './hotp';

/** Das Secret aus RFC 4226 Anhang D: die ASCII-Zeichen "12345678901234567890". */
const RFC4226_SECRET = new TextEncoder().encode('12345678901234567890');

const toHex = (bytes: Uint8Array): string =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');

/**
 * RFC 4226, Anhang D — die vollständige Tabelle.
 * https://www.rfc-editor.org/rfc/rfc4226#appendix-D
 *
 * Wir prüfen absichtlich nicht nur den Endcode, sondern auch die beiden
 * Zwischenergebnisse. Geht ein Test kaputt, sagt einem das sofort, WELCHER
 * Schritt falsch ist: HMAC, Truncation oder das abschliessende Modulo.
 */
const RFC4226_VECTORS: ReadonlyArray<{
  counter: number;
  hmacHex: string;
  truncated: number;
  code: string;
}> = [
  { counter: 0, hmacHex: 'cc93cf18508d94934c64b65d8ba7667fb7cde4b0', truncated: 1284755224, code: '755224' },
  { counter: 1, hmacHex: '75a48a19d4cbe100644e8ac1397eea747a2d33ab', truncated: 1094287082, code: '287082' },
  { counter: 2, hmacHex: '0bacb7fa082fef30782211938bc1c5e70416ff44', truncated: 137359152, code: '359152' },
  { counter: 3, hmacHex: '66c28227d03a2d5529262ff016a1e6ef76557ece', truncated: 1726969429, code: '969429' },
  { counter: 4, hmacHex: 'a904c900a64b35909874b33e61c5938a8e15ed1c', truncated: 1640338314, code: '338314' },
  { counter: 5, hmacHex: 'a37e783d7b7233c083d4f62926c7a25f238d0316', truncated: 868254676, code: '254676' },
  { counter: 6, hmacHex: 'bc9cd28561042c83f219324d3c607256c03272ae', truncated: 1918287922, code: '287922' },
  { counter: 7, hmacHex: 'a4fb960c0bc06e1eabb804e5b397cdc4b45596fa', truncated: 82162583, code: '162583' },
  { counter: 8, hmacHex: '1b3c89f65e6c9e883012052823443f048b4332db', truncated: 673399871, code: '399871' },
  { counter: 9, hmacHex: '1637409809a679dc698207310c8c7fc07290d9e5', truncated: 645520489, code: '520489' },
];

describe('counterToBytes — 8 Byte Big-Endian (RFC 4226 §5.1)', () => {
  it('codiert 0 als acht Nullbytes', () => {
    expect(toHex(counterToBytes(0))).toBe('0000000000000000');
  });

  it('codiert kleine Zahlen rechtsbündig', () => {
    expect(toHex(counterToBytes(1))).toBe('0000000000000001');
    expect(toHex(counterToBytes(255))).toBe('00000000000000ff');
    expect(toHex(counterToBytes(256))).toBe('0000000000000100');
  });

  it('codiert die Zählerstände aus den RFC-6238-Vektoren', () => {
    expect(toHex(counterToBytes(1))).toBe('0000000000000001'); // t = 59 s
    expect(toHex(counterToBytes(37037036))).toBe('00000000023523ec'); // t = 1111111109 s
    expect(toHex(counterToBytes(37037037))).toBe('00000000023523ed'); // t = 1111111111 s
    expect(toHex(counterToBytes(41152263))).toBe('000000000273ef07'); // t = 1234567890 s
    expect(toHex(counterToBytes(66666666))).toBe('0000000003f940aa'); // t = 2000000000 s
    expect(toHex(counterToBytes(666666666))).toBe('0000000027bc86aa'); // t = 20000000000 s
  });

  it('kommt auch mit BigInt jenseits von Number.MAX_SAFE_INTEGER klar', () => {
    expect(toHex(counterToBytes(0xffff_ffff_ffff_ffffn))).toBe('ffffffffffffffff');
  });

  it('weist ungültige Zähler zurück', () => {
    expect(() => counterToBytes(-1)).toThrow(OtpError);
    expect(() => counterToBytes(1.5)).toThrow(OtpError);
    expect(() => counterToBytes(2n ** 64n)).toThrow(OtpError);
  });
});

describe('hmac — HMAC-SHA-1 (RFC 4226 Anhang D)', () => {
  for (const { counter, hmacHex } of RFC4226_VECTORS) {
    it(`Zähler ${counter} ergibt ${hmacHex.slice(0, 8)}…`, async () => {
      const mac = await hmac('SHA-1', RFC4226_SECRET, counterToBytes(counter));
      expect(toHex(mac)).toBe(hmacHex);
    });
  }

  it('lehnt ein leeres Secret ab', async () => {
    await expect(hmac('SHA-1', new Uint8Array(0), new Uint8Array(8))).rejects.toThrow(OtpError);
  });
});

describe('dynamicTruncate — RFC 4226 §5.3', () => {
  for (const { counter, hmacHex, truncated } of RFC4226_VECTORS) {
    it(`Zähler ${counter} ergibt ${truncated}`, () => {
      const bytes = Uint8Array.from(hmacHex.match(/../g) ?? [], (pair) => parseInt(pair, 16));
      expect(dynamicTruncate(bytes)).toBe(truncated);
    });
  }

  it('maskiert das oberste Bit immer aus', () => {
    // Letztes Byte 0x00 → Offset 0; die ersten vier Byte sind 0xFFFFFFFF.
    const bytes = new Uint8Array(20);
    bytes.fill(0xff, 0, 4);
    expect(dynamicTruncate(bytes)).toBe(0x7fff_ffff);
  });

  it('liest den Offset aus den letzten vier Bit', () => {
    const bytes = new Uint8Array(20);
    bytes[19] = 0xf5; // & 0x0f = 5
    bytes.set([0x01, 0x02, 0x03, 0x04], 5);
    expect(dynamicTruncate(bytes)).toBe(0x01020304);
  });

  it('lehnt zu kurze Eingaben ab', () => {
    expect(() => dynamicTruncate(new Uint8Array(19))).toThrow(OtpError);
  });
});

describe('generateHotp — die 10 Testvektoren aus RFC 4226 Anhang D', () => {
  for (const { counter, code } of RFC4226_VECTORS) {
    it(`Zähler ${counter} ergibt ${code}`, async () => {
      expect(await generateHotp({ secret: RFC4226_SECRET, counter })).toBe(code);
    });
  }

  it('behält führende Nullen', async () => {
    // Wir suchen einen Zähler, dessen 6-stelliger Code mit 0 beginnt, und
    // stellen sicher, dass er als String mit führender Null herauskommt.
    let found = false;
    for (let counter = 0; counter < 500 && !found; counter++) {
      const code = await generateHotp({ secret: RFC4226_SECRET, counter });
      expect(code).toHaveLength(6);
      if (code.startsWith('0')) {
        found = true;
      }
    }
    expect(found).toBe(true);
  });

  it('unterstützt 6 bis 8 Stellen', async () => {
    // Die längeren Codes sind Präfix-verlängerungen desselben 31-Bit-Werts:
    // 1284755224 → "84755224" (8), "4755224" (7), "755224" (6).
    expect(await generateHotp({ secret: RFC4226_SECRET, counter: 0, digits: 8 })).toBe('84755224');
    expect(await generateHotp({ secret: RFC4226_SECRET, counter: 0, digits: 7 })).toBe('4755224');
    expect(await generateHotp({ secret: RFC4226_SECRET, counter: 0, digits: 6 })).toBe('755224');
  });

  it('lehnt ungültige Stellenzahlen ab', async () => {
    await expect(generateHotp({ secret: RFC4226_SECRET, counter: 0, digits: 5 })).rejects.toThrow(
      OtpError,
    );
    await expect(generateHotp({ secret: RFC4226_SECRET, counter: 0, digits: 9 })).rejects.toThrow(
      OtpError,
    );
  });
});
