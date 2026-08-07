import { describe, expect, it } from 'vitest';
import { isMigrationUri, MigrationError, parseMigrationUri } from './google-auth';
import { ProtobufError, readMessage, WIRE_BYTES, WIRE_VARINT } from './protobuf';
import { parseOtpauthUri } from './otpauth-uri';
import { decodeBase32 } from './base32';
import { generateTotp } from './totp';

/* ────────────────────────────────────────────────────────────────────────────
   Ein winziger Protobuf-SCHREIBER, nur für die Tests.
   Damit lassen sich Exporte bauen, die es öffentlich nicht als Beispiel gibt
   (mehrere Konten, SHA-256, 8 Stellen, HOTP). Der Schreiber teilt bewusst keine
   Zeile Code mit dem Leser — sonst würde ein Vorzeichenfehler auf beiden Seiten
   gleich passieren und der Test bliebe grün.
   ──────────────────────────────────────────────────────────────────────────── */

function varint(value: number): number[] {
  const out: number[] = [];
  let rest = value;
  do {
    let byte = rest & 0x7f;
    rest >>>= 7;
    if (rest > 0) byte |= 0x80;
    out.push(byte);
  } while (rest > 0);
  return out;
}

const key = (field: number, wireType: number): number[] => varint((field << 3) | wireType);
const lengthDelimited = (field: number, payload: number[]): number[] => [
  ...key(field, WIRE_BYTES),
  ...varint(payload.length),
  ...payload,
];
const varintField = (field: number, value: number): number[] => [
  ...key(field, WIRE_VARINT),
  ...varint(value),
];
const utf8 = (text: string): number[] => [...new TextEncoder().encode(text)];

interface AccountSpec {
  secret: number[];
  name: string;
  issuer?: string;
  algorithm?: number;
  digits?: number;
  type?: number;
}

function buildExport(accounts: AccountSpec[]): string {
  const bytes: number[] = [];
  for (const a of accounts) {
    const inner = [
      ...lengthDelimited(1, a.secret),
      ...lengthDelimited(2, utf8(a.name)),
      ...(a.issuer === undefined ? [] : lengthDelimited(3, utf8(a.issuer))),
      ...(a.algorithm === undefined ? [] : varintField(4, a.algorithm)),
      ...(a.digits === undefined ? [] : varintField(5, a.digits)),
      ...varintField(6, a.type ?? 2),
    ];
    bytes.push(...lengthDelimited(1, inner));
  }
  bytes.push(...varintField(2, 1)); // version
  bytes.push(...varintField(3, 1)); // batch_size
  bytes.push(...varintField(4, 0)); // batch_index

  const base64 = btoa(String.fromCharCode(...bytes));
  return `otpauth-migration://offline?data=${encodeURIComponent(base64)}`;
}

/* ──────────────────────────────────────────────────────────────────────────── */

describe('isMigrationUri', () => {
  it('erkennt Export-URIs', () => {
    expect(isMigrationUri('otpauth-migration://offline?data=AAAA')).toBe(true);
    expect(isMigrationUri('  OTPAUTH-MIGRATION://offline?data=AA  ')).toBe(true);
  });

  it('verwechselt sie nicht mit einer normalen otpauth-URI', () => {
    expect(isMigrationUri('otpauth://totp/A?secret=JBSWY3DPEHPK3PXP')).toBe(false);
    expect(isMigrationUri('JBSWY3DPEHPK3PXP')).toBe(false);
  });
});

describe('parseMigrationUri — der dokumentierte Beispiel-Export', () => {
  /**
   * Dieser Export kursiert seit Jahren als Beispiel für das Format. Er enthält
   * ein Konto mit dem Secret aus den Bytes "Hello!\xDE\xAD\xBE\xEF" — in Base32
   * ergibt das JBSWY3DPEHPK3PXP, das bekannteste Test-Secret überhaupt.
   */
  const EXAMPLE =
    'otpauth-migration://offline?data=' +
    'CjEKCkhlbGxvId6tvu8SGEV4YW1wbGU6YWxpY2VAZ29vZ2xlLmNvbRoHRXhhbXBsZSABKAEwAhACGAEgAA%3D%3D';

  it('liefert genau ein Konto', () => {
    const result = parseMigrationUri(EXAMPLE);
    expect(result.imported).toBe(1);
    expect(result.skipped).toEqual([]);
    expect(result.lines).toHaveLength(1);
  });

  it('erzeugt eine otpauth-URI, die der eigene Parser versteht', () => {
    const [line] = parseMigrationUri(EXAMPLE).lines;
    const parsed = parseOtpauthUri(line!);

    expect(parsed.issuer).toBe('Example');
    expect(parsed.accountName).toBe('alice@google.com');
    expect(parsed.algorithm).toBe('SHA-1');
    expect(parsed.digits).toBe(6);
    expect(parsed.period).toBe(30);
  });

  it('wandelt die rohen Secret-Bytes korrekt nach Base32', () => {
    // Das ist die Stelle, an der Importe typischerweise scheitern: Im Export
    // stehen rohe Bytes, in der URI muss Base32 stehen.
    const [line] = parseMigrationUri(EXAMPLE).lines;
    expect(parseOtpauthUri(line!).secret).toBe('JBSWY3DPEHPK3PXP');
  });

  it('erzeugt am Ende einen Code, der zum Secret passt', async () => {
    const [line] = parseMigrationUri(EXAMPLE).lines;
    const secret = decodeBase32(parseOtpauthUri(line!).secret);

    // Gegenprobe über den kompletten eigenen Stapel: rohe Bytes → Base32 → URI
    // → Base32 → Bytes → TOTP. Die Erwartung steht bewusst als Byte-Liste da:
    // Ein String wie 'Hello!Þ­¾ï' würde von `TextEncoder` als UTF-8 codiert und
    // ergäbe 14 statt 10 Byte — genau die Verwechslung, die ein Importer nie
    // machen darf.
    expect([...secret]).toEqual([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21, 0xde, 0xad, 0xbe, 0xef]);
    expect(await generateTotp({ secret, unixSeconds: 0 })).toHaveLength(6);
  });
});

describe('parseMigrationUri — selbst gebaute Exporte', () => {
  /** "Hello!" gefolgt von DE AD BE EF — als rohe Bytes, nicht als UTF-8-String. */
  const HELLO = [0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21, 0xde, 0xad, 0xbe, 0xef];

  it('importiert mehrere Konten auf einmal', () => {
    const uri = buildExport([
      { secret: HELLO, name: 'GitHub:kevin', issuer: 'GitHub' },
      { secret: HELLO, name: 'AWS:kevin@123', issuer: 'AWS' },
      { secret: HELLO, name: 'ohne-issuer' },
    ]);
    const result = parseMigrationUri(uri);

    expect(result.imported).toBe(3);
    expect(result.lines.map((line) => parseOtpauthUri(line).issuer)).toEqual([
      'GitHub',
      'AWS',
      undefined,
    ]);
  });

  it('doppelt den Issuer nicht, wenn er schon im Namen steht', () => {
    const uri = buildExport([{ secret: HELLO, name: 'GitHub:kevin', issuer: 'GitHub' }]);
    const parsed = parseOtpauthUri(parseMigrationUri(uri).lines[0]!);
    expect(parsed.issuer).toBe('GitHub');
    expect(parsed.accountName).toBe('kevin');
  });

  it('übernimmt SHA-256 und acht Stellen', () => {
    const uri = buildExport([
      { secret: HELLO, name: 'Krypto', issuer: 'Krypto', algorithm: 2, digits: 2 },
    ]);
    const parsed = parseOtpauthUri(parseMigrationUri(uri).lines[0]!);
    expect(parsed.algorithm).toBe('SHA-256');
    expect(parsed.digits).toBe(8);
  });

  it('übernimmt SHA-512', () => {
    const uri = buildExport([{ secret: HELLO, name: 'X', issuer: 'X', algorithm: 3 }]);
    expect(parseOtpauthUri(parseMigrationUri(uri).lines[0]!).algorithm).toBe('SHA-512');
  });

  it('behandelt „unspecified" (0) als die Voreinstellung SHA-1 / 6 Stellen', () => {
    const uri = buildExport([{ secret: HELLO, name: 'X', algorithm: 0, digits: 0 }]);
    const parsed = parseOtpauthUri(parseMigrationUri(uri).lines[0]!);
    expect(parsed.algorithm).toBe('SHA-1');
    expect(parsed.digits).toBe(6);
  });

  it('überspringt HOTP-Konten mit Begründung statt sie falsch zu importieren', () => {
    const uri = buildExport([
      { secret: HELLO, name: 'Zaehler', issuer: 'Zaehler', type: 1 },
      { secret: HELLO, name: 'Zeit', issuer: 'Zeit', type: 2 },
    ]);
    const result = parseMigrationUri(uri);

    expect(result.imported).toBe(1);
    expect(result.skipped).toEqual(['Zaehler (HOTP, zählerbasiert)']);
  });

  it('überspringt MD5-Konten — die Web Crypto API kennt MD5 nicht', () => {
    const uri = buildExport([{ secret: HELLO, name: 'Alt', issuer: 'Alt', algorithm: 4 }]);
    const result = parseMigrationUri(uri);
    expect(result.imported).toBe(0);
    expect(result.skipped).toEqual(['Alt (nicht unterstützter Algorithmus)']);
  });

  it('überspringt Konten mit leerem Secret', () => {
    const uri = buildExport([{ secret: [], name: 'Leer', issuer: 'Leer' }]);
    expect(parseMigrationUri(uri).skipped).toEqual(['Leer (leeres Secret)']);
  });

  it('kommt mit Umlauten und Leerzeichen im Namen klar', () => {
    const uri = buildExport([{ secret: HELLO, name: 'Büro Süd:käthe', issuer: 'Büro Süd' }]);
    const parsed = parseOtpauthUri(parseMigrationUri(uri).lines[0]!);
    expect(parsed.issuer).toBe('Büro Süd');
    expect(parsed.accountName).toBe('käthe');
  });
});

describe('parseMigrationUri — die »+«-Falle', () => {
  it('überlebt ein Base64 mit »+« und »/«', () => {
    // URLSearchParams würde »+« als Leerzeichen lesen und die Nutzdaten still
    // zerstören. Deshalb schneidet der Parser den Rohwert selbst heraus.
    // Dieses Secret ist so gewählt, dass sein Base64 beide Zeichen enthält.
    const secret = [0xff, 0xef, 0xbe, 0x3f, 0xfb, 0xef, 0xbe, 0x2f, 0x00, 0xff];
    const uri = buildExport([{ secret, name: 'Plus', issuer: 'Plus' }]);
    expect(/data=[^&]*(%2B|%2F)/i.test(uri)).toBe(true);

    const parsed = parseOtpauthUri(parseMigrationUri(uri).lines[0]!);
    expect([...decodeBase32(parsed.secret)]).toEqual(secret);
  });

  it('akzeptiert auch Base64url (»-« und »_«)', () => {
    const secret = [0xff, 0xef, 0xbe, 0x3f, 0xfb, 0xef, 0xbe, 0x2f, 0x00, 0xff];
    const standard = buildExport([{ secret, name: 'Plus', issuer: 'Plus' }]);
    const raw = decodeURIComponent(/data=([^&]*)/.exec(standard)![1]!);
    const urlSafe = raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const result = parseMigrationUri(`otpauth-migration://offline?data=${urlSafe}`);
    expect([...decodeBase32(parseOtpauthUri(result.lines[0]!).secret)]).toEqual(secret);
  });
});

describe('parseMigrationUri — Fehlerfälle', () => {
  it('lehnt eine normale otpauth-URI ab', () => {
    expect(() => parseMigrationUri('otpauth://totp/A?secret=JBSWY3DPEHPK3PXP')).toThrow(
      MigrationError,
    );
  });

  it('verlangt den data-Parameter', () => {
    expect(() => parseMigrationUri('otpauth-migration://offline')).toThrow(/data/);
    expect(() => parseMigrationUri('otpauth-migration://offline?data=')).toThrow(/data/);
  });

  it('lehnt ungültiges Base64 ab', () => {
    expect(() => parseMigrationUri('otpauth-migration://offline?data=###')).toThrow(
      /Base64|Codierung/,
    );
  });

  it('meldet einen leeren Export', () => {
    expect(() => parseMigrationUri('otpauth-migration://offline?data=EAEYASAA')).toThrow(
      /keine Konten/,
    );
  });

  it('lehnt Daten ab, die kein Protobuf sind', () => {
    // 0xFF... ergibt einen Wire-Type 7, den es nicht gibt.
    const data = btoa('ÿÿÿÿ');
    expect(() =>
      parseMigrationUri(`otpauth-migration://offline?data=${encodeURIComponent(data)}`),
    ).toThrow(ProtobufError);
  });
});

describe('protobuf — der Leser selbst', () => {
  const bytes = (...values: number[]): Uint8Array<ArrayBuffer> => Uint8Array.from(values);

  it('liest ein einbytiges Varint', () => {
    const fields = [...readMessage(bytes(0x08, 0x01))]; // Feld 1, Varint, Wert 1
    expect(fields).toEqual([{ field: 1, kind: 'varint', value: 1n }]);
  });

  it('liest ein mehrbytiges Varint (300 = 0xAC 0x02)', () => {
    const fields = [...readMessage(bytes(0x08, 0xac, 0x02))];
    expect(fields[0]).toMatchObject({ kind: 'varint', value: 300n });
  });

  it('liest 64-Bit-Werte ohne Präzisionsverlust', () => {
    // 2^53 + 1 — als `number` wäre dieser Wert nicht mehr darstellbar.
    const big = 9_007_199_254_740_993n;
    const encoded: number[] = [0x08];
    let rest = big;
    do {
      let byte = Number(rest & 0x7fn);
      rest >>= 7n;
      if (rest > 0n) byte |= 0x80;
      encoded.push(byte);
    } while (rest > 0n);

    expect([...readMessage(bytes(...encoded))][0]).toMatchObject({ value: big });
  });

  it('liest ein Längen-Feld als Bytes', () => {
    const fields = [...readMessage(bytes(0x12, 0x02, 0x41, 0x42))]; // Feld 2, "AB"
    expect(fields[0]).toMatchObject({ field: 2, kind: 'bytes' });
    expect([...(fields[0] as { value: Uint8Array }).value]).toEqual([0x41, 0x42]);
  });

  it('liest mehrere Felder hintereinander', () => {
    const fields = [...readMessage(bytes(0x08, 0x05, 0x10, 0x07))];
    expect(fields.map((f) => f.field)).toEqual([1, 2]);
  });

  it('erkennt abgeschnittene Daten', () => {
    expect(() => [...readMessage(bytes(0x08))]).toThrow(ProtobufError);
    expect(() => [...readMessage(bytes(0x12, 0x05, 0x41))]).toThrow(/Byte/);
  });

  it('erkennt ein endloses Varint', () => {
    expect(() => [...readMessage(bytes(0x08, ...Array<number>(12).fill(0xff)))]).toThrow(
      ProtobufError,
    );
  });

  it('lehnt Feldnummer 0 ab', () => {
    expect(() => [...readMessage(bytes(0x00, 0x01))]).toThrow(/Feldnummer 0/);
  });
});
