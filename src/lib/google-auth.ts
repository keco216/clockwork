/**
 * Import aus dem Google Authenticator.
 *
 * Die App bietet unter „Konten exportieren" einen QR-Code an, der keine normale
 * `otpauth://`-URI enthält, sondern eine eigene Sammel-URI:
 *
 *     otpauth-migration://offline?data=<Base64 einer Protobuf-Nachricht>
 *
 * Darin stecken mehrere Konten auf einmal. Das Format ist nirgends offiziell
 * dokumentiert; das folgende Schema ist aus dem Protobuf-Wire-Format
 * rekonstruiert und deckt sich mit allen öffentlich beschriebenen Exporten:
 *
 *     message MigrationPayload {
 *       repeated OtpParameters otp_parameters = 1;
 *       int32 version     = 2;
 *       int32 batch_size  = 3;   // in wie viele QR-Codes der Export zerfällt
 *       int32 batch_index = 4;
 *       int32 batch_id    = 5;
 *     }
 *     message OtpParameters {
 *       bytes  secret    = 1;   // ROHE Bytes, nicht Base32!
 *       string name      = 2;   // meist "Issuer:konto"
 *       string issuer    = 3;
 *       enum   algorithm = 4;   // 1 SHA1, 2 SHA256, 3 SHA512, 4 MD5
 *       enum   digits    = 5;   // 1 = sechs, 2 = acht
 *       enum   type      = 6;   // 1 HOTP, 2 TOTP
 *       int64  counter   = 7;   // nur bei HOTP
 *     }
 *
 * ── Warum das Ergebnis otpauth://-Zeilen sind ──────────────────────────────
 * Der Import könnte direkt `Account`-Objekte bauen. Er erzeugt stattdessen ganz
 * normale `otpauth://`-Zeilen, die anschließend durch denselben Parser laufen
 * wie eine von Hand eingefügte URI. Zwei Gründe:
 *
 *   1. Es gibt nur einen Weg ins System — also auch nur eine Stelle, an der
 *      etwas falsch sein kann.
 *   2. Der Nutzer SIEHT im Textfeld, was importiert wurde, und kann es prüfen,
 *      korrigieren oder löschen. Ein Import, der still im Hintergrund Konten
 *      anlegt, ist bei Schlüsselmaterial das falsche Verhalten.
 */

import { encodeBase32 } from './base32';
import { asNumber, asText, readMessage, type ProtobufField } from './protobuf';
import type { Bytes } from './bytes';

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationError';
  }
}

export interface MigrationResult {
  /** Fertige `otpauth://`-Zeilen, bereit fürs Textfeld. */
  readonly lines: readonly string[];
  /** Anzahl übernommener TOTP-Konten. */
  readonly imported: number;
  /** Konten, die diese App nicht erzeugen kann (HOTP, MD5) — mit Begründung. */
  readonly skipped: readonly string[];
}

/** Schnelltest, ob ein Text ein Google-Authenticator-Export sein will. */
export function isMigrationUri(text: string): boolean {
  return /^otpauth-migration:\/\//i.test(text.trim());
}

const ALGORITHMS: Readonly<Record<number, string>> = {
  0: 'SHA1', // „unspecified" — Google meint damit die Voreinstellung
  1: 'SHA1',
  2: 'SHA256',
  3: 'SHA512',
};

const DIGITS: Readonly<Record<number, number>> = {
  0: 6, // unspecified
  1: 6,
  2: 8,
};

const TYPE_HOTP = 1;
const TYPE_TOTP = 2;

/**
 * Zerlegt eine `otpauth-migration://`-URI in einzelne Konten.
 *
 * @throws {MigrationError} wenn die URI, das Base64 oder das Protobuf nicht passt.
 */
export function parseMigrationUri(input: string): MigrationResult {
  const payload = decodePayload(input);

  const lines: string[] = [];
  const skipped: string[] = [];
  let imported = 0;

  for (const field of readMessage(payload)) {
    // Feld 1 sind die Konten; alles andere (Version, Batch-Angaben) interessiert
    // uns nicht und wird stillschweigend übersprungen — genau dafür ist das
    // Wire-Format gemacht.
    if (field.field !== 1 || field.kind !== 'bytes') {
      continue;
    }

    const account = readOtpParameters(field.value);

    if (account.type === TYPE_HOTP) {
      skipped.push(`${account.label} (HOTP, zählerbasiert)`);
      continue;
    }
    if (account.algorithm === undefined) {
      skipped.push(`${account.label} (nicht unterstützter Algorithmus)`);
      continue;
    }
    if (account.secret.byteLength === 0) {
      skipped.push(`${account.label} (leeres Secret)`);
      continue;
    }

    lines.push(toOtpauthUri(account));
    imported++;
  }

  if (lines.length === 0 && skipped.length === 0) {
    throw new MigrationError('In diesem Export stehen keine Konten.');
  }

  return { lines, imported, skipped };
}

/* ── Innereien ───────────────────────────────────────────────────────────── */

interface OtpParameters {
  secret: Bytes;
  name: string;
  issuer: string;
  algorithm: string | undefined;
  digits: number;
  type: number;
  label: string;
}

function readOtpParameters(bytes: Bytes): OtpParameters {
  const account: OtpParameters = {
    secret: new Uint8Array(0),
    name: '',
    issuer: '',
    algorithm: 'SHA1',
    digits: 6,
    type: TYPE_TOTP,
    label: '',
  };

  for (const field of readMessage(bytes)) {
    switch (field.field) {
      case 1:
        if (field.kind === 'bytes') account.secret = field.value;
        break;
      case 2:
        account.name = asTextSafe(field);
        break;
      case 3:
        account.issuer = asTextSafe(field);
        break;
      case 4:
        account.algorithm = ALGORITHMS[asNumberSafe(field)];
        break;
      case 5:
        account.digits = DIGITS[asNumberSafe(field)] ?? 6;
        break;
      case 6:
        account.type = asNumberSafe(field);
        break;
      default:
        // Zählerstand (7) und alles Künftige: bewusst ignoriert.
        break;
    }
  }

  account.label = account.issuer || account.name || 'Unbenannt';
  return account;
}

/**
 * Baut aus den Feldern eine `otpauth://`-URI.
 *
 * Der entscheidende Schritt: Das Secret liegt im Export als ROHE Bytes vor, in
 * einer URI muss es Base32 sein. Wer das übersieht, bekommt ein scheinbar
 * funktionierendes Konto mit durchgehend falschen Codes.
 */
function toOtpauthUri(account: OtpParameters): string {
  const secret = encodeBase32(account.secret, { padding: false });

  // Der Kontoname enthält oft schon „Issuer:konto". Dann würde ein zweites
  // Voranstellen „GitHub:GitHub:kevin" ergeben.
  const bare = stripIssuerPrefix(account.name, account.issuer);
  const label = account.issuer ? `${account.issuer}:${bare || account.issuer}` : bare || 'Konto';

  const parameters = new URLSearchParams();
  parameters.set('secret', secret);
  if (account.issuer) {
    parameters.set('issuer', account.issuer);
  }
  parameters.set('algorithm', account.algorithm ?? 'SHA1');
  parameters.set('digits', String(account.digits));
  parameters.set('period', '30');

  // `encodeURIComponent` statt der Automatik von `URL`: Der Doppelpunkt zwischen
  // Issuer und Konto muss als Trenner erhalten bleiben, alles andere im Label
  // aber codiert werden.
  const [issuerPart, ...rest] = label.split(':');
  const encodedLabel = [issuerPart ?? '', rest.join(':')]
    .filter((part) => part !== '')
    .map((part) => encodeURIComponent(part))
    .join(':');

  return `otpauth://totp/${encodedLabel}?${parameters.toString()}`;
}

function stripIssuerPrefix(name: string, issuer: string): string {
  if (issuer && name.toLowerCase().startsWith(`${issuer.toLowerCase()}:`)) {
    return name.slice(issuer.length + 1).trim();
  }
  return name.trim();
}

function decodePayload(input: string): Bytes {
  const trimmed = input.trim();
  if (!isMigrationUri(trimmed)) {
    throw new MigrationError(
      'Das ist kein Google-Authenticator-Export. Erwartet wird »otpauth-migration://offline?data=…«.',
    );
  }

  // NICHT über URLSearchParams: Das Feld ist Standard-Base64 und enthält damit
  // »+«-Zeichen. `URLSearchParams` deutet »+« in einem Query-String als
  // Leerzeichen und zerstört die Nutzdaten still. Deshalb wird der rohe Wert von
  // Hand herausgeschnitten und nur prozent-decodiert.
  const match = /[?&]data=([^&]*)/.exec(trimmed);
  if (match?.[1] === undefined || match[1] === '') {
    throw new MigrationError('In der URI fehlt der Parameter »data«.');
  }

  let base64: string;
  try {
    base64 = decodeURIComponent(match[1]);
  } catch {
    throw new MigrationError('Der »data«-Parameter enthält eine kaputte Prozent-Codierung.');
  }

  // Manche Werkzeuge liefern Base64url (»-« und »_« statt »+« und »/«).
  base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new MigrationError('Der »data«-Parameter ist kein gültiges Base64.');
  }

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/** Wie `asText`, wirft aber nicht bei einem unerwarteten Wire-Type. */
function asTextSafe(field: ProtobufField): string {
  return field.kind === 'bytes' ? asText(field) : '';
}

/** Wie `asNumber`, liefert aber −1 statt zu werfen. */
function asNumberSafe(field: ProtobufField): number {
  return field.kind === 'varint' ? asNumber(field) : -1;
}
