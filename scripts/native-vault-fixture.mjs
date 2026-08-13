/**
 * Cross-Fixtures fuer den Tresor: Node gegen Kotlin, in BEIDE Richtungen.
 *
 * ── Warum es dieses Skript gibt ────────────────────────────────────────────
 * Die native App soll die WebView-Fassung abloesen (Posten P8 des
 * Kotlin-Auftrags). Wer aus dem GitHub-Release aktualisiert, muss seinen
 * Tresor mit derselben Passphrase weiter oeffnen koennen — das Format ist also
 * kein neues, sondern DASSELBE. „Dasselbe" ist aber eine Behauptung, solange
 * niemand einen Umschlag der einen Seite mit der anderen aufmacht.
 *
 * Zwei Stellen koennen stumm auseinanderlaufen, und beide wuerden erst beim
 * Nutzer auffallen:
 *
 *   1. **Die Passphrase-Codierung.** `vault.ts` uebergibt PBKDF2 die
 *      UTF-8-BYTES (`TextEncoder`). Java nimmt ein `char[]` und ueberlaesst
 *      die Umrechnung dem Provider. Fuer PBKDF2WithHmacSHA256 ist das UTF-8 —
 *      aber das steht in einer Implementierung, nicht in einer Zusage. Bei den
 *      aelteren PBEWith-Verfahren ist es ausdruecklich NICHT UTF-8. Deshalb
 *      traegt mindestens ein Fixture eine Passphrase mit Umlaut und Emoji:
 *      Passte die Umrechnung nicht, waere genau dieses Fixture rot und alle
 *      ASCII-Fixtures gruen.
 *   2. **Die Laenge des GCM-Tags.** Die Web Crypto API hat dafuer keinen
 *      sichtbaren Parameter (128 Bit ist die Voreinstellung), Java verlangt
 *      ihn ausdruecklich. Wer dort 96 einsetzt, bekommt zwei Formate, die
 *      stumm nicht zusammenpassen — und sucht den Fehler danach in der
 *      Passphrase.
 *
 * ── Aufrufe ───────────────────────────────────────────────────────────────
 *
 *   node scripts/native-vault-fixture.mjs generate [zieldatei]
 *       Versiegelt in Node und schreibt die Umschlaege. Die Datei ist
 *       EINGECHECKT — der Kotlin-Test soll ohne Node laufen.
 *
 *   node scripts/native-vault-fixture.mjs verify <datei>
 *       Oeffnet Umschlaege, die KOTLIN versiegelt hat. Diese Datei entsteht
 *       beim Testlauf unter android-native/app/build/ und ist nicht
 *       eingecheckt.
 *
 * Beide Richtungen zusammen sind der Beweis. Eine allein waere keiner: Ein
 * gemeinsamer Denkfehler faellt nur auf, wenn beide Seiten einmal die Rolle
 * des Schreibers und einmal die des Lesers haben.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

/** Muss zu PBKDF2_ITERATIONS in Vault.kt und vault.ts passen. */
const FULL_ITERATIONS = 600_000;

/**
 * Fast alle Fixtures laufen mit stark herabgesetzter Iterationszahl. 600.000
 * kosten pro Aufruf rund eine halbe Sekunde, und ein Beweis, der eine Minute
 * braucht, wird irgendwann uebersprungen. EIN Fixture laeuft trotzdem mit der
 * vollen Zahl — sonst waere nie gezeigt, dass die echte Einstellung ueber die
 * Sprachgrenze traegt.
 */
const FAST_ITERATIONS = 1000;

const VAULT_VERSION = 1;
const KDF = 'PBKDF2-SHA-256';
const SALT_BYTES = 16;
const IV_BYTES = 12;

/** Die Faelle. Bewusst klein gehalten, aber jeder deckt etwas Eigenes ab. */
const CASES = [
  {
    name: 'ascii',
    why: 'der Normalfall — zwei Zeilen, wie sie im Textfeld stehen',
    passphrase: 'richtige passphrase',
    plaintext: ['GitHub: JBSWY3DPEHPK3PXP', 'otpauth://totp/A?secret=JBSWY3DPEHPK3PXP'].join('\n'),
    iterations: FAST_ITERATIONS,
  },
  {
    name: 'nicht-ascii',
    why: 'DER Beweis: Umlaut und Emoji in Passphrase UND Klartext',
    passphrase: 'Straße-🔐-42',
    plaintext: 'Grüße 🔐\nzweite Zeile\tmit Tab\r\nund CRLF',
    iterations: FAST_ITERATIONS,
  },
  {
    name: 'leerer-klartext',
    why: 'ein Tresor ohne Eintraege ist ein gueltiger Tresor',
    passphrase: 'pass',
    plaintext: '',
    iterations: FAST_ITERATIONS,
  },
  {
    name: 'volle-iterationen',
    why: 'die echte Einstellung, einmal ueber die Sprachgrenze',
    passphrase: 'pass',
    plaintext: 'x',
    iterations: FULL_ITERATIONS,
  },
];

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Genau die Kopfdaten-Zeile aus vault.ts und Vault.kt. */
function headerBytes(v, kdf, iterations) {
  return encoder.encode(`v=${v};kdf=${kdf};it=${iterations}`);
}

async function deriveKey(passphrase, salt, iterations, usages) {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
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

async function sealVault(plaintext, passphrase, iterations) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt, iterations, ['encrypt']);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: headerBytes(VAULT_VERSION, KDF, iterations) },
    key,
    encoder.encode(plaintext),
  );

  return {
    v: VAULT_VERSION,
    kdf: KDF,
    iterations,
    salt: Buffer.from(salt).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    data: Buffer.from(new Uint8Array(ciphertext)).toString('base64'),
  };
}

async function openVault(envelope, passphrase) {
  const salt = Buffer.from(envelope.salt, 'base64');
  const iv = Buffer.from(envelope.iv, 'base64');
  const data = Buffer.from(envelope.data, 'base64');
  const key = await deriveKey(passphrase, salt, envelope.iterations, ['decrypt']);

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: headerBytes(envelope.v, envelope.kdf, envelope.iterations),
    },
    key,
    data,
  );
  return decoder.decode(plaintext);
}

/**
 * Das Dateiformat ist bewusst JSONL — eine Zeile, ein FLACHES Objekt.
 *
 * Der Grund liegt auf der Kotlin-Seite: Dort liest `core/Json.kt` flache
 * Objekte und ausdruecklich keine verschachtelten. Ein verschachteltes Fixture
 * haette also entweder einen zweiten Leser noetig gemacht (der dann nie
 * benutzt wird und nichts beweist) oder eine JSON-Bibliothek. Flach heisst:
 * Der Test benutzt genau den Leser, der spaeter auch den echten Umschlag
 * liest — das Fixture prueft ihn nebenbei mit.
 */
function toLine(testCase, envelope) {
  return JSON.stringify({
    name: testCase.name,
    why: testCase.why,
    passphrase: testCase.passphrase,
    plaintext: testCase.plaintext,
    v: envelope.v,
    kdf: envelope.kdf,
    iterations: envelope.iterations,
    salt: envelope.salt,
    iv: envelope.iv,
    data: envelope.data,
  });
}

function fromLine(line) {
  const row = JSON.parse(line);
  return {
    name: row.name,
    passphrase: row.passphrase,
    plaintext: row.plaintext,
    envelope: {
      v: row.v,
      kdf: row.kdf,
      iterations: row.iterations,
      salt: row.salt,
      iv: row.iv,
      data: row.data,
    },
  };
}

async function generate(target) {
  const lines = [];
  for (const testCase of CASES) {
    const envelope = await sealVault(testCase.plaintext, testCase.passphrase, testCase.iterations);

    // Gegenprobe im eigenen Haus, bevor die Datei entsteht: Ein Fixture, das
    // nicht einmal Node selbst wieder aufbekommt, wuerde in Kotlin als
    // „Kotlin ist kaputt" erscheinen.
    const roundTrip = await openVault(envelope, testCase.passphrase);
    if (roundTrip !== testCase.plaintext) {
      throw new Error(`Fixture ${testCase.name}: Node oeffnet den eigenen Umschlag nicht`);
    }

    lines.push(toLine(testCase, envelope));
    process.stdout.write(`  versiegelt: ${testCase.name} (${testCase.iterations} Iterationen)\n`);
  }

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${lines.join('\n')}\n`, 'utf8');
  process.stdout.write(`\n${lines.length} Umschlaege geschrieben nach ${target}\n`);
}

async function verify(source) {
  const lines = (await readFile(source, 'utf8')).split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) {
    throw new Error(`${source} enthaelt keine Faelle`);
  }

  let checked = 0;
  for (const line of lines) {
    const testCase = fromLine(line);
    const plaintext = await openVault(testCase.envelope, testCase.passphrase);
    if (plaintext !== testCase.plaintext) {
      throw new Error(
        `Fall ${testCase.name}: Node liest "${plaintext}", erwartet war "${testCase.plaintext}"`,
      );
    }
    process.stdout.write(`  geoeffnet: ${testCase.name}\n`);
    checked++;
  }

  process.stdout.write(`\n${checked} von Kotlin versiegelte Umschlaege in Node geoeffnet.\n`);
}

const [command, argument] = process.argv.slice(2);

if (command === 'generate') {
  const target = resolve(argument ?? 'android-native/app/src/test/resources/vault-fixtures.jsonl');
  process.stdout.write('Node versiegelt, Kotlin oeffnet:\n');
  await generate(target);
} else if (command === 'verify') {
  if (argument === undefined) {
    throw new Error('verify braucht eine Datei');
  }
  process.stdout.write('Kotlin versiegelt, Node oeffnet:\n');
  await verify(resolve(argument));
} else {
  process.stderr.write('Aufruf: native-vault-fixture.mjs generate [datei] | verify <datei>\n');
  process.exitCode = 1;
}
