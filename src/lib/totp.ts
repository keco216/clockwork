/**
 * TOTP — Time-based One-Time Password nach RFC 6238.
 * https://www.rfc-editor.org/rfc/rfc6238
 *
 * ── Was TOTP zu HOTP hinzufügt: nichts ausser einer Uhr ────────────────────
 * TOTP ist HOTP mit einem Zähler, den beide Seiten aus der Uhrzeit ableiten
 * statt hochzuzählen:
 *
 *     counter = floor(unixZeit / periode)
 *
 * Bei der üblichen Periode von 30 Sekunden erhöht sich dieser Zähler alle
 * 30 Sekunden um genau 1 — bei jedem, überall auf der Welt, ohne dass jemand
 * etwas synchronisieren müsste. Das ist der ganze Trick.
 *
 *   Unix-Zeit  0 … 29  →  counter 0  →  Code A
 *             30 … 59  →  counter 1  →  Code B
 *             60 … 89  →  counter 2  →  Code C
 *
 * Wichtig: Der Wechsel passiert an *absoluten* 30-Sekunden-Grenzen der Unix-Zeit
 * (also bei :00 und :30 jeder Minute), nicht 30 Sekunden nachdem man die Seite
 * geöffnet hat. Deshalb ist die erste angezeigte Restzeit oft kürzer als 30 s.
 *
 * ── Die drei Stellschrauben ────────────────────────────────────────────────
 * Algorithmus, Stellenzahl und Periode sind konfigurierbar. In der Praxis nutzen
 * über 99 % aller Anbieter die Voreinstellung SHA-1 / 6 Stellen / 30 s — auch
 * Google, GitHub und Microsoft. Andere Werte kommen fast nur über
 * `otpauth://`-URIs herein.
 *
 * ── Ein Parameter, den wir NICHT anbieten: T0 ──────────────────────────────
 * RFC 6238 erlaubt einen Startzeitpunkt T0 ≠ 0, also `floor((zeit - T0) / periode)`.
 * Kein Anbieter benutzt das, das `otpauth://`-Format sieht dafür kein Feld vor,
 * und die RFC-Testvektoren gehen alle von T0 = 0 aus. Wir setzen T0 fest auf 0.
 */

import { generateHotp, OtpError, type HashAlgorithm } from './hotp';

export const DEFAULT_ALGORITHM: HashAlgorithm = 'SHA-1';
export const DEFAULT_DIGITS = 6;
export const DEFAULT_PERIOD = 30;

/**
 * Wandelt eine Unix-Zeit (Sekunden) in den TOTP-Zählerstand um.
 * Das ist die einzige Zeile, die TOTP von HOTP unterscheidet.
 */
export function timeCounter(unixSeconds: number, period: number = DEFAULT_PERIOD): number {
  assertPeriod(period);
  if (!Number.isFinite(unixSeconds)) {
    throw new OtpError(`Ungültige Zeitangabe: ${unixSeconds}`);
  }
  if (unixSeconds < 0) {
    throw new OtpError('Zeiten vor dem 1.1.1970 werden nicht unterstützt.');
  }
  return Math.floor(unixSeconds / period);
}

/**
 * Wie lange gilt der aktuelle Code noch? Ergebnis liegt in (0, periode].
 *
 * Beispiel bei Periode 30: bei Sekunde :00 sind es 30, bei :29 genau 1.
 * Wir zählen bewusst bis 1 herunter und nicht bis 0 — eine Anzeige, die eine
 * Sekunde lang auf "0" stehen bleibt, wirkt eingefroren.
 */
export function secondsUntilNextCode(
  unixSeconds: number,
  period: number = DEFAULT_PERIOD,
): number {
  assertPeriod(period);
  const elapsed = unixSeconds - timeCounter(unixSeconds, period) * period;
  return Math.ceil(period - elapsed) || period;
}

/**
 * Anteil der bereits verstrichenen Periode, 0 … 1 — für den Countdown-Ring.
 * Nimmt absichtlich Nachkommastellen entgegen, damit die Animation flüssig ist.
 */
export function periodProgress(unixSeconds: number, period: number = DEFAULT_PERIOD): number {
  assertPeriod(period);
  const elapsed = unixSeconds - Math.floor(unixSeconds / period) * period;
  return elapsed / period;
}

export interface TotpParams {
  /** Das gemeinsame Geheimnis als rohe Bytes. */
  readonly secret: Uint8Array;
  /** Unix-Zeit in **Sekunden** (nicht Millisekunden!). */
  readonly unixSeconds: number;
  readonly algorithm?: HashAlgorithm;
  readonly digits?: number;
  readonly period?: number;
}

/**
 * Erzeugt den TOTP-Code für einen Zeitpunkt.
 */
export async function generateTotp({
  secret,
  unixSeconds,
  algorithm = DEFAULT_ALGORITHM,
  digits = DEFAULT_DIGITS,
  period = DEFAULT_PERIOD,
}: TotpParams): Promise<string> {
  return generateTotpForCounter({
    secret,
    counter: timeCounter(unixSeconds, period),
    algorithm,
    digits,
  });
}

export interface TotpCounterParams {
  readonly secret: Uint8Array;
  readonly counter: number;
  readonly algorithm?: HashAlgorithm;
  readonly digits?: number;
}

/**
 * Erzeugt den Code für einen bereits ausgerechneten Zählerstand.
 *
 * Die UI benutzt das, weil sie zwei Codes gleichzeitig braucht: den aktuellen
 * (`counter`) und die Vorschau auf den nächsten (`counter + 1`). Über den Zähler
 * zu gehen ist dabei ehrlicher als "rechne mit Zeit + 30 s" — es zeigt direkt,
 * dass der nächste Code jetzt schon feststeht.
 */
export async function generateTotpForCounter({
  secret,
  counter,
  algorithm = DEFAULT_ALGORITHM,
  digits = DEFAULT_DIGITS,
}: TotpCounterParams): Promise<string> {
  return generateHotp({ secret, counter, algorithm, digits });
}

function assertPeriod(period: number): void {
  if (!Number.isInteger(period) || period <= 0) {
    throw new OtpError(`Ungültige Periode: ${period}. Erwartet wird eine positive ganze Zahl.`);
  }
}
