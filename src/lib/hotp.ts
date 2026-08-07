/**
 * HOTP — HMAC-based One-Time Password nach RFC 4226.
 * https://www.rfc-editor.org/rfc/rfc4226
 *
 * ── Die Grundidee in einem Satz ────────────────────────────────────────────
 * Server und Client kennen dasselbe Geheimnis (`secret`) und denselben Zähler
 * (`counter`). Beide rechnen daraus mit HMAC eine Prüfsumme aus und schneiden
 * daraus 6 Ziffern heraus. Wer dieselben 6 Ziffern nennt, muss dasselbe
 * Geheimnis kennen — ohne es je zu verraten.
 *
 * ── Der Ablauf ─────────────────────────────────────────────────────────────
 *
 *   secret (Bytes)  ─┐
 *                    ├─► HMAC-SHA-1 ─► 20 Byte ─► Dynamic Truncation ─► 31-Bit-Zahl
 *   counter (8 Byte)─┘                                                      │
 *                                                          modulo 10^6 ─────┘
 *                                                                │
 *                                                          "755224"
 *
 * ── Warum HMAC und nicht einfach SHA-1(secret ‖ counter)? ──────────────────
 * Weil ein simples Hash-über-alles anfällig für Length-Extension-Angriffe ist:
 * Wer H(secret ‖ x) kennt, kann bei SHA-1 daraus H(secret ‖ x ‖ y) berechnen,
 * ohne das Secret zu kennen. HMAC hasht deshalb zweimal mit zwei aus dem Secret
 * abgeleiteten Padding-Blöcken und schließt diese Klasse von Angriffen aus.
 * Wir implementieren HMAC NICHT selbst — dafür gibt es die Web Crypto API, die
 * im Browser nativ und konstant-zeitig arbeitet.
 *
 * ── Warum drei Schritte statt "nimm einfach die ersten 6 Ziffern"? ─────────
 * Siehe {@link dynamicTruncate} — dort steht der interessanteste Teil.
 */

import type { Bytes } from './bytes';

/**
 * Die Hash-Funktionen, die die Web Crypto API für HMAC anbietet und die in
 * der TOTP-Welt vorkommen. Die Namen sind exakt die Strings, die
 * `crypto.subtle` erwartet (mit Bindestrich!).
 *
 * MD5 fehlt bewusst: Die Web Crypto API bietet es nicht an — aus gutem Grund.
 */
export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

/** Alle unterstützten Algorithmen, z. B. für Validierung und UI. */
export const HASH_ALGORITHMS: readonly HashAlgorithm[] = ['SHA-1', 'SHA-256', 'SHA-512'];

/** Kleinste bzw. größte Stellenzahl, die diese App erlaubt. */
export const MIN_DIGITS = 6;
export const MAX_DIGITS = 8;

/** Fehler in der HOTP-/TOTP-Berechnung (falsche Parameter, kaputtes Secret …). */
export class OtpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OtpError';
  }
}

/**
 * Prüft die Stellenzahl. 6–8 deckt alles ab, was real vorkommt.
 *
 * Die Obergrenze hat auch einen technischen Grund: Die Dynamic Truncation
 * liefert eine 31-Bit-Zahl (max. 2 147 483 647). Bei mehr als 9 Stellen wäre
 * `zahl % 10^n` schlicht die Zahl selbst — die führenden Stellen wären dann
 * nicht gleichverteilt, sondern immer klein. Bei 8 Stellen ist das kein Thema.
 */
function assertDigits(digits: number): void {
  if (!Number.isInteger(digits) || digits < MIN_DIGITS || digits > MAX_DIGITS) {
    throw new OtpError(
      `Ungültige Stellenzahl: ${digits}. Erlaubt sind ${MIN_DIGITS} bis ${MAX_DIGITS}.`,
    );
  }
}

/**
 * Schritt 1 — Der Zähler wird zu 8 Byte in Big-Endian ("höchstwertiges Byte
 * zuerst", RFC 4226 nennt das "the counter value ... 8-byte value").
 *
 * WARUM fest 8 Byte und Big-Endian? Weil HMAC über *Bytes* rechnet: Client und
 * Server müssen die Zahl bitgenau identisch darstellen, sonst kommen zwei
 * verschiedene Codes heraus. Die 8 Byte sind auch nicht verhandelbar — ein
 * Zähler 1 als 4-Byte-Wert ergäbe eine andere HMAC-Eingabe als derselbe Zähler
 * als 8-Byte-Wert.
 *
 *   counter = 1  →  00 00 00 00 00 00 00 01
 *   counter = 256→  00 00 00 00 00 00 01 00
 */
export function counterToBytes(counter: number | bigint): Bytes {
  let value: bigint;
  if (typeof counter === 'bigint') {
    value = counter;
  } else {
    if (!Number.isSafeInteger(counter)) {
      throw new OtpError(`Der Zähler ${counter} ist keine ganze Zahl im sicheren Bereich.`);
    }
    value = BigInt(counter);
  }
  if (value < 0n) {
    throw new OtpError('Der Zähler darf nicht negativ sein.');
  }
  if (value > 0xffff_ffff_ffff_ffffn) {
    throw new OtpError('Der Zähler passt nicht in 8 Byte.');
  }

  const bytes = new Uint8Array(8);
  // `DataView` schreibt explizit Big-Endian (drittes Argument `littleEndian = false`)
  // und ist damit unabhängig davon, wie der Prozessor Zahlen ablegt.
  new DataView(bytes.buffer).setBigUint64(0, value, false);
  return bytes;
}

/**
 * Schritt 2 — HMAC über die Web Crypto API.
 *
 * Das ist die EINZIGE Krypto-Primitive, die wir nicht selbst schreiben. Eigene
 * SHA-1-/HMAC-Implementierungen in JavaScript sind langsam, schwer zu prüfen und
 * praktisch nie seitenkanalfrei. `crypto.subtle` ist im Browser eingebaut.
 *
 * `extractable: false` sorgt dafür, dass der Schlüssel das Krypto-Subsystem
 * nicht mehr verlassen kann — selbst unser eigener Code kann ihn danach nicht
 * mehr auslesen. Kostet nichts und ist die richtige Voreinstellung.
 */
export async function hmac(algorithm: HashAlgorithm, key: Bytes, message: Bytes): Promise<Bytes> {
  if (key.length === 0) {
    throw new OtpError('Das Secret ist leer — daraus lässt sich kein Code berechnen.');
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: { name: algorithm } },
    false, // nicht exportierbar
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

/**
 * Schritt 3 — "Dynamic Truncation" (RFC 4226, Abschnitt 5.3).
 *
 * Wir haben 20 Byte HMAC und brauchen 6 Ziffern. Man könnte einfach die ersten
 * 4 Byte nehmen — aber dann würde ein Angreifer, der irgendwann eine Schwäche in
 * genau diesen Bytes findet, sie immer an derselben Stelle ausnutzen können.
 * Deshalb bestimmt der HMAC *selbst*, welche 4 Byte verwendet werden:
 *
 *   1. Die letzten 4 Bit des HMAC ergeben einen Offset 0–15.
 *      (letztes Byte & 0x0F)
 *   2. Ab diesem Offset werden 4 Byte als Big-Endian-Zahl gelesen.
 *   3. Das oberste Bit wird ausmaskiert (& 0x7FFFFFFF).
 *
 * Schritt 3 hat einen sehr praktischen Grund: 1998 gab es Sprachen ohne
 * vorzeichenlose 32-Bit-Zahlen (Java!). Wäre das oberste Bit gesetzt, läse die
 * eine Implementierung eine negative Zahl und die andere eine positive — und
 * `modulo` würde unterschiedliche Ergebnisse liefern. Ein Bit wegwerfen ist der
 * Preis dafür, dass der Algorithmus überall identisch rechnet.
 *
 * Der Offset ist maximal 15, wir lesen 4 Byte → wir brauchen mindestens 19+1 = 20
 * Byte. Genau die Länge von SHA-1. SHA-256 (32 B) und SHA-512 (64 B) sind länger;
 * ihre hinteren Bytes fließen also gar nicht in den Code ein — das ist so gewollt
 * und in RFC 6238 ausdrücklich so festgelegt.
 */
export function dynamicTruncate(hmacResult: Uint8Array): number {
  if (hmacResult.byteLength < 20) {
    throw new OtpError(
      `HMAC-Ergebnis zu kurz: ${hmacResult.byteLength} Byte, mindestens 20 werden gebraucht.`,
    );
  }

  // `DataView` statt direkter Index-Zugriffe: die Getter sind exakt typisiert
  // (liefern `number`, nie `undefined`) und `getUint32(…, false)` ist genau die
  // Big-Endian-Leseoperation, die der RFC beschreibt.
  const view = new DataView(hmacResult.buffer, hmacResult.byteOffset, hmacResult.byteLength);

  const offset = view.getUint8(view.byteLength - 1) & 0x0f;
  const fourBytes = view.getUint32(offset, false);

  return fourBytes & 0x7fff_ffff;
}

export interface HotpParams {
  /** Das gemeinsame Geheimnis als rohe Bytes (aus Base32 decodiert). */
  readonly secret: Bytes;
  /** Der Zählerstand. Bei TOTP: `floor(unixZeit / periode)`. */
  readonly counter: number | bigint;
  /** Stellen des Codes, 6–8. Voreinstellung 6. */
  readonly digits?: number;
  /** Hash für HMAC. Voreinstellung SHA-1 (so gut wie alle Anbieter nutzen das). */
  readonly algorithm?: HashAlgorithm;
}

/**
 * Erzeugt einen HOTP-Code — die drei Schritte oben in Reihe.
 *
 * Rückgabe ist bewusst ein String, kein `number`: Führende Nullen gehören zum
 * Code. Aus 42 wird "000042", und `42` wäre schlicht falsch.
 */
export async function generateHotp({
  secret,
  counter,
  digits = 6,
  algorithm = 'SHA-1',
}: HotpParams): Promise<string> {
  assertDigits(digits);

  const counterBytes = counterToBytes(counter); // Schritt 1
  const mac = await hmac(algorithm, secret, counterBytes); // Schritt 2
  const truncated = dynamicTruncate(mac); // Schritt 3

  // Schritt 4: auf die gewünschte Stellenzahl kürzen und links mit Nullen füllen.
  return String(truncated % 10 ** digits).padStart(digits, '0');
}
