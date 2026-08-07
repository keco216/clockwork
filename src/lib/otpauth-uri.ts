/**
 * Parser für `otpauth://`-URIs — das Format, das in praktisch jedem
 * 2FA-QR-Code steckt.
 *
 * Es ist kein RFC, sondern eine De-facto-Spezifikation von Google:
 * https://github.com/google/google-authenticator/wiki/Key-Uri-Format
 *
 * ── Aufbau ─────────────────────────────────────────────────────────────────
 *
 *   otpauth://totp/GitHub:kevin@example.com?secret=JBSWY3DP…&issuer=GitHub
 *   └──┬───┘   └─┬┘ └──┬─┘ └──────┬───────┘ └──────────┬──────────────────┘
 *   Schema      Typ  Issuer    Kontoname            Parameter
 *              └──────────── "Label" ─────────────┘
 *
 * • Typ ist `totp` (zeitbasiert) oder `hotp` (zählerbasiert). Wir können nur totp.
 * • Das Label ist URL-codiert; `%3A` oder `:` trennt Issuer und Kontoname.
 * • `secret` ist Pflicht, alles andere hat Voreinstellungen.
 * • `issuer` steht meist doppelt drin — im Label UND als Parameter. Die
 *   Spezifikation nennt den Parameter als den verbindlichen; genau so machen
 *   wir es auch.
 *
 * ── Was in freier Wildbahn ankommt ─────────────────────────────────────────
 *   GitHub     otpauth://totp/GitHub:kevin?secret=…&issuer=GitHub
 *   Google     otpauth://totp/Google%3Akevin%40gmail.com?secret=…&issuer=Google
 *   Microsoft  otpauth://totp/Microsoft:kevin?secret=…&issuer=Microsoft&digits=6&period=30
 *   AWS        otpauth://totp/AWS:kevin@123456789012?secret=…&issuer=AWS
 */

import { DEFAULT_ALGORITHM, DEFAULT_DIGITS, DEFAULT_PERIOD } from './totp';
import { MAX_DIGITS, MIN_DIGITS, type HashAlgorithm } from './hotp';

/** Fehler beim Zerlegen einer URI. */
export class OtpauthUriError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OtpauthUriError';
  }
}

export interface ParsedOtpauthUri {
  /** Das Secret, wie es in der URI steht (noch Base32-Text, nicht decodiert). */
  readonly secret: string;
  /** Anbieter, z. B. "GitHub". `undefined`, wenn die URI keinen nennt. */
  readonly issuer: string | undefined;
  /** Konto, z. B. "kevin@example.com". `undefined`, wenn nur ein Issuer da ist. */
  readonly accountName: string | undefined;
  readonly algorithm: HashAlgorithm;
  readonly digits: number;
  readonly period: number;
}

/** Schnelltest, ob eine Zeile überhaupt eine otpauth-URI sein will. */
export function isOtpauthUri(text: string): boolean {
  return /^otpauth:\/\//i.test(text.trim());
}

/**
 * Zerlegt eine `otpauth://totp/…`-URI.
 *
 * Nicht angegebene Parameter werden mit den Voreinstellungen aus RFC 6238
 * belegt (SHA-1 / 6 Stellen / 30 s) — die Rückgabe ist also immer vollständig.
 *
 * @throws {OtpauthUriError} bei allem, was nicht passt — mit einer Meldung,
 *   die man dem Nutzer direkt zeigen kann.
 */
export function parseOtpauthUri(input: string): ParsedOtpauthUri {
  const trimmed = input.trim();

  // Der eingebaute URL-Parser des Browsers kann auch unbekannte Schemata, solange
  // ein `//` folgt. Das erspart uns eine eigene, fehleranfällige Zerlegung.
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new OtpauthUriError('Das ist keine gültige URI. Erwartet wird »otpauth://totp/…«.');
  }

  if (url.protocol.toLowerCase() !== 'otpauth:') {
    throw new OtpauthUriError(
      `Unbekanntes Schema »${url.protocol.replace(':', '')}«. Erwartet wird »otpauth«.`,
    );
  }

  // Bei fremden Schemata lässt der URL-Parser den Host so, wie er dasteht —
  // deshalb hier selbst kleinschreiben.
  const type = url.hostname.toLowerCase();
  if (type === 'hotp') {
    throw new OtpauthUriError(
      'Das ist eine HOTP-URI (zählerbasiert). Diese App erzeugt nur zeitbasierte ' +
        'TOTP-Codes — der Zählerstand müsste dafür gespeichert werden.',
    );
  }
  if (type !== 'totp') {
    throw new OtpauthUriError(
      `Unbekannter Typ »${url.hostname || '(leer)'}«. Nach »otpauth://« muss »totp« stehen.`,
    );
  }

  const { issuerFromLabel, accountName } = parseLabel(url.pathname);

  // ── secret (Pflicht) ──
  const secret = url.searchParams.get('secret')?.trim();
  if (!secret) {
    throw new OtpauthUriError('In der URI fehlt der Parameter »secret«.');
  }

  // ── issuer: Parameter schlägt Label ──
  const issuerParam = url.searchParams.get('issuer')?.trim();
  const issuer = issuerParam || issuerFromLabel;

  return {
    secret,
    issuer: issuer || undefined,
    accountName: accountName || undefined,
    algorithm: parseAlgorithm(url.searchParams.get('algorithm')),
    digits: parseDigits(url.searchParams.get('digits')),
    period: parsePeriod(url.searchParams.get('period')),
  };
}

/**
 * Zerlegt den Pfadteil in Issuer und Kontoname.
 *
 * Der Pfad ist URL-codiert (`ACME%20Co:john%40example.com`), also erst
 * decodieren, dann am ersten Doppelpunkt trennen. Beide Teile werden getrimmt,
 * weil manche Anbieter nach dem Doppelpunkt ein Leerzeichen setzen.
 */
function parseLabel(pathname: string): {
  issuerFromLabel: string | undefined;
  accountName: string | undefined;
} {
  const raw = pathname.replace(/^\//, '');

  let label: string;
  try {
    label = decodeURIComponent(raw);
  } catch {
    throw new OtpauthUriError(
      'Das Label der URI enthält eine kaputte Prozent-Codierung (z. B. ein einzelnes »%«).',
    );
  }

  const separator = label.indexOf(':');
  if (separator === -1) {
    return { issuerFromLabel: undefined, accountName: label.trim() || undefined };
  }
  return {
    issuerFromLabel: label.slice(0, separator).trim() || undefined,
    accountName: label.slice(separator + 1).trim() || undefined,
  };
}

/**
 * `SHA1` / `sha256` / `SHA-512` → der Name, den `crypto.subtle` erwartet.
 * Die URI schreibt den Namen ohne Bindestrich, die Web Crypto API mit.
 */
function parseAlgorithm(value: string | null): HashAlgorithm {
  if (value === null || value.trim() === '') {
    return DEFAULT_ALGORITHM;
  }
  switch (value.trim().toUpperCase().replace(/-/g, '')) {
    case 'SHA1':
      return 'SHA-1';
    case 'SHA256':
      return 'SHA-256';
    case 'SHA512':
      return 'SHA-512';
    default:
      throw new OtpauthUriError(
        `Unbekannter Algorithmus »${value}«. Unterstützt werden SHA1, SHA256 und SHA512.`,
      );
  }
}

function parseDigits(value: string | null): number {
  if (value === null || value.trim() === '') {
    return DEFAULT_DIGITS;
  }
  const digits = parseIntegerStrict(value, 'digits');
  if (digits < MIN_DIGITS || digits > MAX_DIGITS) {
    throw new OtpauthUriError(
      `Ungültiger Wert für »digits«: ${digits}. Erlaubt sind ${MIN_DIGITS} bis ${MAX_DIGITS}.`,
    );
  }
  return digits;
}

function parsePeriod(value: string | null): number {
  if (value === null || value.trim() === '') {
    return DEFAULT_PERIOD;
  }
  const period = parseIntegerStrict(value, 'period');
  if (period < 1 || period > 3600) {
    throw new OtpauthUriError(
      `Ungültiger Wert für »period«: ${period}. Erwartet werden 1 bis 3600 Sekunden.`,
    );
  }
  return period;
}

/**
 * Bewusst strenger als `parseInt`: `parseInt("6abc")` liefert 6 und verschluckt
 * damit stillschweigend einen Tippfehler.
 */
function parseIntegerStrict(value: string, parameterName: string): number {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new OtpauthUriError(
      `Der Parameter »${parameterName}« muss eine ganze Zahl sein, gefunden wurde »${value}«.`,
    );
  }
  return Number(trimmed);
}
