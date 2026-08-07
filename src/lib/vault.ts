/**
 * Verschlüsselter Tresor — strikt opt-in.
 *
 * ── Die Ausgangslage ───────────────────────────────────────────────────────
 * Ohne Tresor ist diese App zustandslos: Tab zu, Secret weg. Das ist die
 * einfachste denkbare Sicherheitsaussage und deshalb die Voreinstellung. Wer
 * seine Secrets nicht bei jedem Start neu einfügen will, gibt genau diese
 * Aussage auf — und bekommt dafür etwas, das ohne Passphrase wertlos ist.
 *
 * ── Was gespeichert wird ───────────────────────────────────────────────────
 * Ausschließlich der Umschlag unten: Salt, IV, Iterationszahl und Chiffrat.
 * Kein Klartext, keine Passphrase, kein abgeleiteter Schlüssel. Beides existiert
 * nur im Arbeitsspeicher und nur, solange der Tresor offen ist.
 *
 * ── Warum PBKDF2 mit sehr vielen Iterationen ───────────────────────────────
 * Eine Passphrase hat viel weniger Entropie als ein 256-Bit-Schlüssel. Wer den
 * Umschlag in die Hände bekommt, kann offline beliebig viele Passphrasen
 * durchprobieren — dagegen hilft nur, jeden einzelnen Versuch teuer zu machen.
 * 600.000 Iterationen sind die aktuelle OWASP-Empfehlung für PBKDF2-SHA-256 und
 * kosten auf einem normalen Rechner rund eine halbe Sekunde. Einmal beim
 * Aufsperren ist das kaum spürbar; für einen Angreifer sind es 600.000-mal die
 * Kosten pro Rateversuch.
 *
 * Argon2id wäre die noch bessere Wahl (speicherhart, also auch gegen GPUs
 * teuer) — die Web Crypto API kennt es aber nicht, und eine mitgelieferte
 * WASM-Implementierung wäre fremder Krypto-Code im Bundle. Wir bleiben bei dem,
 * was der Browser selbst mitbringt.
 *
 * ── Warum AES-GCM und nicht AES-CBC ────────────────────────────────────────
 * GCM ist „authenticated encryption": Es verschlüsselt UND erkennt jede
 * nachträgliche Veränderung am Chiffrat. Wer ein Byte kippt, bekommt beim
 * Entsperren einen Fehler statt stillschweigend falscher Daten. Bei CBC müsste
 * man diese Prüfung selbst dazubauen — und genau daran scheitern die meisten
 * Eigenbauten.
 *
 * ── Warum die Kopfdaten mitauthentifiziert werden ──────────────────────────
 * `additionalData` (AAD) bindet Version, Verfahren und Iterationszahl an das
 * Chiffrat, ohne sie zu verschlüsseln. Ohne das könnte ein Angreifer die
 * gespeicherte Iterationszahl von 600.000 auf 1 herunterschreiben; die App würde
 * beim nächsten Aufsperren mit dieser Zahl ableiten, und das Durchprobieren
 * würde 600.000-mal billiger. Mit AAD schlägt die Entschlüsselung fehl, sobald
 * jemand daran dreht.
 */

import type { Bytes } from './bytes';

/** OWASP-Empfehlung für PBKDF2-SHA-256 (Stand 2023 und weiterhin gültig). */
export const PBKDF2_ITERATIONS = 600_000;

/** 128 Bit Salt — verhindert vorberechnete Tabellen über mehrere Tresore hinweg. */
const SALT_BYTES = 16;

/**
 * 96 Bit IV. Das ist für GCM nicht irgendeine Länge, sondern DIE Länge: Bei
 * genau 96 Bit wird der Zählerblock direkt aus dem IV gebildet; bei jeder
 * anderen Länge hasht GCM ihn erst, was nur Angriffsfläche schafft.
 */
const IV_BYTES = 12;

export const VAULT_VERSION = 1;

/**
 * Was auf die Platte geht. Bewusst reines JSON mit base64-Feldern statt eines
 * Binärformats: Man kann es mit einem Texteditor ansehen und nachvollziehen,
 * dass da wirklich nichts Lesbares drinsteht.
 */
export interface VaultEnvelope {
  readonly v: number;
  readonly kdf: 'PBKDF2-SHA-256';
  readonly iterations: number;
  readonly salt: string;
  readonly iv: string;
  readonly data: string;
}

export class VaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VaultError';
  }
}

export interface SealOptions {
  /**
   * Nur für Tests herabsetzbar. In der App gilt immer {@link PBKDF2_ITERATIONS} —
   * ein Tresor mit weniger Iterationen wäre schlicht kaputt.
   */
  readonly iterations?: number;
}

/**
 * Verschlüsselt Klartext zu einem Umschlag.
 *
 * Salt und IV sind bei JEDEM Aufruf frisch. Beim IV ist das nicht Kosmetik: Ein
 * zweimal mit demselben Schlüssel und demselben IV verwendetes GCM gibt den
 * XOR beider Klartexte preis und macht die Authentifizierung fälschbar. Deshalb
 * gibt es hier keinen Weg, einen IV wiederzuverwenden.
 */
export async function sealVault(
  plaintext: string,
  passphrase: string,
  options: SealOptions = {},
): Promise<VaultEnvelope> {
  assertPassphrase(passphrase);
  const iterations = options.iterations ?? PBKDF2_ITERATIONS;

  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const header = { v: VAULT_VERSION, kdf: 'PBKDF2-SHA-256' as const, iterations };
  const key = await deriveKey(passphrase, salt, iterations, ['encrypt']);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: headerBytes(header) },
    key,
    new TextEncoder().encode(plaintext),
  );

  return {
    ...header,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext)),
  };
}

/**
 * Entschlüsselt einen Umschlag.
 *
 * @throws {VaultError} bei falscher Passphrase, verändertem Chiffrat oder
 *   veränderten Kopfdaten. Alle drei Fälle sehen von außen absichtlich gleich
 *   aus: Eine Fehlermeldung, die verrät, WORAN es lag, wäre für einen Angreifer
 *   ein Hinweis — und für den Nutzer ist die Antwort ohnehin dieselbe.
 */
export async function openVault(envelope: VaultEnvelope, passphrase: string): Promise<string> {
  assertPassphrase(passphrase);
  assertEnvelope(envelope);

  const salt = fromBase64(envelope.salt, 'salt');
  const iv = fromBase64(envelope.iv, 'iv');
  const data = fromBase64(envelope.data, 'data');
  const key = await deriveKey(passphrase, salt, envelope.iterations, ['decrypt']);

  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: headerBytes({
          v: envelope.v,
          kdf: envelope.kdf,
          iterations: envelope.iterations,
        }),
      },
      key,
      data,
    );
  } catch {
    throw new VaultError(
      'Der Tresor ließ sich nicht öffnen. Passphrase falsch — oder die gespeicherten ' +
        'Daten wurden verändert.',
    );
  }

  return new TextDecoder().decode(plaintext);
}

/** Prüft, ob ein beliebiger Wert die Form eines Umschlags hat. */
export function isVaultEnvelope(value: unknown): value is VaultEnvelope {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['v'] === 'number' &&
    candidate['kdf'] === 'PBKDF2-SHA-256' &&
    typeof candidate['iterations'] === 'number' &&
    typeof candidate['salt'] === 'string' &&
    typeof candidate['iv'] === 'string' &&
    typeof candidate['data'] === 'string'
  );
}

/* ── Innereien ───────────────────────────────────────────────────────────── */

async function deriveKey(
  passphrase: string,
  salt: Bytes,
  iterations: number,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new VaultError(`Ungültige Iterationszahl: ${iterations}.`);
  }

  // Die Passphrase wird als Schlüsselmaterial importiert, nicht als Schlüssel.
  // `extractable: false` an beiden Stellen: Weder die Passphrase noch der
  // abgeleitete Schlüssel können danach aus dem Krypto-Subsystem heraus gelesen
  // werden — auch nicht von unserem eigenen Code.
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    usages,
  );
}

/** Die Kopfdaten in genau der Form, in der sie authentifiziert werden. */
function headerBytes(header: { v: number; kdf: string; iterations: number }): Bytes {
  // Feste Feldreihenfolge, kein `JSON.stringify` über ein Objekt mit
  // unbestimmter Schlüsselreihenfolge: Die AAD muss beim Ver- und Entschlüsseln
  // Byte für Byte identisch sein.
  return new TextEncoder().encode(`v=${header.v};kdf=${header.kdf};it=${header.iterations}`);
}

function assertPassphrase(passphrase: string): void {
  if (passphrase.length === 0) {
    throw new VaultError('Ohne Passphrase gibt es keinen Schlüssel.');
  }
}

function assertEnvelope(envelope: VaultEnvelope): void {
  if (!isVaultEnvelope(envelope)) {
    throw new VaultError('Die gespeicherten Tresordaten haben ein unbekanntes Format.');
  }
  if (envelope.v !== VAULT_VERSION) {
    throw new VaultError(
      `Tresor-Version ${envelope.v} wird nicht unterstützt (erwartet: ${VAULT_VERSION}).`,
    );
  }
}

function randomBytes(length: number): Bytes {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toBase64(bytes: Bytes): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(text: string, field: string): Bytes {
  let binary: string;
  try {
    binary = atob(text);
  } catch {
    throw new VaultError(`Das Feld »${field}« der Tresordaten ist kein gültiges Base64.`);
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
