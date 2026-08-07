/**
 * Base32-Codec nach RFC 4648, Abschnitt 6.
 * https://www.rfc-editor.org/rfc/rfc4648#section-6
 *
 * ── WARUM überhaupt Base32? ────────────────────────────────────────────────
 * Ein TOTP-Secret ist in Wahrheit eine Folge roher Bytes (typisch 10 oder 20).
 * Damit man dieses Secret abtippen, vorlesen oder in einen QR-Code packen kann,
 * wird es als Text codiert. Base64 wäre kürzer, benutzt aber Groß- UND
 * Kleinschreibung sowie "+" und "/" — beim Abtippen eine Fehlerquelle.
 * Base32 benutzt nur A–Z und 2–7:
 *   • Groß-/Kleinschreibung ist egal (es gibt nur eine Variante),
 *   • die Ziffern 0, 1 und 8 fehlen bewusst, weil sie mit O, I/l und B
 *     verwechselt werden.
 *
 * ── WIE funktioniert es? ───────────────────────────────────────────────────
 * Das Alphabet hat 32 = 2^5 Zeichen, jedes Zeichen trägt also genau 5 Bit.
 * Byte-Grenzen (8 Bit) und Zeichen-Grenzen (5 Bit) treffen sich erst beim
 * kleinsten gemeinsamen Vielfachen: 40 Bit = 5 Byte = 8 Zeichen. Dieser
 * 40-Bit-Block heißt "Quantum" und ist die Einheit, in der Base32 arbeitet.
 *
 *   Bytes    │ 0 0 1 1 0 0 0 1 │ 0 0 1 1 0 0 1 0 │ …   (je 8 Bit)
 *   Zeichen  │ 0 0 1 1 0 │ 0 0 1 0 0 │ 1 1 0 0 1 │ …   (je 5 Bit)
 *                 = 6         = 4        = 25
 *                 → 'G'       → 'E'      → 'Z'
 *
 * Ein unvollständiger Block wird beim Codieren mit "=" auf 8 Zeichen aufgefüllt.
 * Das "=" trägt keine Information — es sagt dem Decoder nur, wie viele Bytes im
 * letzten Block echt sind. Genau deshalb dürfen wir es beim Decodieren einfach
 * ignorieren, und genau deshalb funktionieren Secrets auch ohne Padding.
 */

import type { Bytes } from './bytes';

/** Das Alphabet aus RFC 4648 Tabelle 3. Der Index IST der 5-Bit-Wert. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Umkehrung des Alphabets: Zeichen → 5-Bit-Wert. Einmalig aufgebaut. */
const CHAR_TO_VALUE: ReadonlyMap<string, number> = new Map(
  [...ALPHABET].map((char, value) => [char, value]),
);

/**
 * Längen, die (mod 8) niemals ein gültiges Base32-Quantum ergeben können.
 * Aus n Zeichen entstehen floor(n*5/8) Bytes; für Rest 1, 3 und 6 bliebe mehr
 * als ein volles Byte an "Restbits" übrig — das wäre nie so codiert worden.
 * Gültige Reste sind also nur 0, 2, 4, 5 und 7.
 */
const IMPOSSIBLE_LENGTH_REMAINDERS: ReadonlySet<number> = new Set([1, 3, 6]);

/** Zeichencode von '=' — dem Füllzeichen. */
const PADDING_CHAR_CODE = 61;

/** Fehler beim Decodieren. Eigener Typ, damit die UI ihn gezielt anzeigen kann. */
export class Base32Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Base32Error';
  }
}

/**
 * Decodiert einen Base32-String zu Bytes.
 *
 * Bewusst tolerant, weil echte Anbieter ihre Secrets sehr unterschiedlich
 * ausliefern:
 *   • Kleinbuchstaben werden akzeptiert (`jbswy3dp` == `JBSWY3DP`),
 *   • Leerzeichen und Bindestriche als Lesehilfe werden entfernt
 *     (`JBSW Y3DP EHPK 3PXP`),
 *   • fehlendes "="-Padding ist in Ordnung.
 *
 * Bewusst streng bei allem, was auf einen echten Tippfehler hindeutet:
 * ungültige Zeichen und unmögliche Längen werfen einen `Base32Error` mit
 * einer Meldung, die man dem Nutzer direkt zeigen kann.
 *
 * @throws {Base32Error}
 */
export function decodeBase32(input: string): Bytes {
  // ── Schritt 1: normalisieren ──────────────────────────────────────────────
  // Whitespace (auch Zeilenumbrüche aus Copy&Paste) und Bindestriche raus,
  // alles auf Großbuchstaben.
  const cleaned = input.replace(/[\s-]+/g, '').toUpperCase();

  // ── Schritt 2: Padding abschneiden und prüfen ─────────────────────────────
  // Bewusst eine Schleife statt `cleaned.replace(/=+$/, '')`. Dieser Ausdruck
  // sieht harmlos aus, hat aber quadratische Laufzeit: Bei einer Eingabe aus n
  // Gleichheitszeichen mit einem anderen Zeichen am Ende probiert die
  // Regex-Maschine an JEDER Position alle Längen durch und scheitert jedes Mal
  // am `$`. Gemessen: 10 000 Zeichen ≈ 30 ms, 80 000 Zeichen ≈ 1,8 s — ein
  // eingefrorener Tab, ausgelöst durch einen einzigen unbedachten Copy&Paste.
  // Die Schleife hier ist linear und obendrein leichter zu lesen.
  let end = cleaned.length;
  while (end > 0 && cleaned.charCodeAt(end - 1) === PADDING_CHAR_CODE) {
    end--;
  }
  const data = cleaned.slice(0, end);

  if (data.includes('=')) {
    throw new Base32Error('Das Zeichen »=« darf nur am Ende stehen (es ist nur Auffüllung).');
  }
  if (data.length === 0) {
    throw new Base32Error('Der Secret-Key ist leer.');
  }

  // ── Schritt 3: Zeichen prüfen ─────────────────────────────────────────────
  // Bewusst VOR der Längenprüfung: Ein Tippfehler-Zeichen macht meist auch die
  // Länge kaputt, aber »ungültiges Zeichen »0« an Stelle 5« hilft beim Suchen
  // ungleich mehr als »ungültige Länge«.
  for (let i = 0; i < data.length; i++) {
    const char = data.charAt(i);
    if (!CHAR_TO_VALUE.has(char)) {
      throw new Base32Error(
        `Ungültiges Zeichen »${char}« an Stelle ${i + 1}. Base32 kennt nur A–Z und 2–7 — ` +
          'die Ziffern 0, 1 und 8 kommen nicht vor (verwechselt mit O, I und B?).',
      );
    }
  }

  if (IMPOSSIBLE_LENGTH_REMAINDERS.has(data.length % 8)) {
    throw new Base32Error(
      `Ungültige Länge: ${data.length} Zeichen (ohne Leerzeichen und Padding). ` +
        'Base32 codiert 5 Byte in 8 Zeichen; im letzten Block sind nur 2, 4, 5, 7 ' +
        'oder 8 Zeichen möglich. Vermutlich fehlt ein Zeichen oder ist eines zu viel.',
    );
  }

  // ── Schritt 4: Bit-Eimer ──────────────────────────────────────────────────
  // Wir schaufeln pro Zeichen 5 Bit in einen Zwischenspeicher (`bitBuffer`) und
  // holen unten immer dann ein ganzes Byte heraus, wenn mindestens 8 Bit drin
  // liegen. Damit ist die Umrechnung 5→8 Bit ein einziger, kurzer Durchlauf.
  const bytes = new Uint8Array(Math.floor((data.length * 5) / 8));
  let bitBuffer = 0; // hält maximal 12 Bit — passt locker in eine 32-Bit-Zahl
  let bitCount = 0; // wie viele Bits gerade im Eimer liegen
  let byteIndex = 0;

  for (let i = 0; i < data.length; i++) {
    // Oben bereits geprüft — der Fallback ist nur da, damit der Typ `number` ist.
    const value = CHAR_TO_VALUE.get(data.charAt(i)) ?? 0;

    bitBuffer = (bitBuffer << 5) | value; // 5 neue Bits hinten anhängen
    bitCount += 5;

    if (bitCount >= 8) {
      bitCount -= 8;
      // Die obersten 8 der `bitCount + 8` Bits sind das nächste Byte.
      bytes[byteIndex++] = (bitBuffer >>> bitCount) & 0xff;
    }
  }

  // Übrig bleiben 0–7 Bit. Laut RFC müssten sie alle 0 sein. Wir verwerfen sie
  // stillschweigend, statt zu meckern: Manche Anbieter erzeugen Secrets mit
  // "krummen" Längen, und jede etablierte Authenticator-App akzeptiert die.
  // Ein harter Fehler würde hier nur funktionierende Secrets kaputt machen.
  return bytes;
}

/**
 * Codiert Bytes als Base32. Gegenstück zu {@link decodeBase32}.
 *
 * Die App selbst braucht das nicht — aber die Tests, um Round-trips zu prüfen,
 * und es macht das Verfahren beim Lesen erst rund: Hier läuft der Bit-Eimer
 * genau andersherum (8 Bit rein, 5 Bit raus).
 */
export function encodeBase32(bytes: Uint8Array, options: { padding?: boolean } = {}): string {
  const { padding = true } = options;

  let output = '';
  let bitBuffer = 0;
  let bitCount = 0;

  for (const byte of bytes) {
    bitBuffer = (bitBuffer << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      bitCount -= 5;
      output += ALPHABET.charAt((bitBuffer >>> bitCount) & 0b11111);
    }
  }

  // Restbits (1–4 Stück) mit Nullen nach links auf 5 Bit auffüllen.
  if (bitCount > 0) {
    output += ALPHABET.charAt((bitBuffer << (5 - bitCount)) & 0b11111);
  }

  if (padding) {
    while (output.length % 8 !== 0) {
      output += '=';
    }
  }

  return output;
}
