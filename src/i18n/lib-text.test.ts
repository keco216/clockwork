/**
 * Deckt der Übersetzungskatalog wirklich alles ab, was aus `src/lib/`
 * herauskommt?
 *
 * ── Warum dieser Test der wichtigste der V3 ist ────────────────────────────
 * `src/lib/` bleibt byte-identisch und wirft deshalb weiterhin deutsche Sätze.
 * `i18n/lib-text.ts` erkennt sie an ihrem Wortlaut. Das funktioniert nur so
 * lange, wie beide Seiten zusammenpassen — und genau das wird hier nicht
 * behauptet, sondern nachgemessen: Jeder Fehlerpfad wird WIRKLICH ausgelöst und
 * die dabei entstandene Meldung durch den Katalog geschickt.
 *
 * Ändert jemand eine Meldung in `src/lib/`, wird dieser Test rot — nicht der
 * Nutzer ratlos.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { decodeBase32 } from '../lib/base32';
import { parseMigrationUri } from '../lib/google-auth';
import { generateHotp } from '../lib/hotp';
import { parseOtpauthUri } from '../lib/otpauth-uri';
import { openVault, sealVault, type VaultEnvelope } from '../lib/vault';
import { CATALOGUE } from './catalogue';
import { translateLibMessage, translateLibText } from './lib-text';
import { installCatalogue, setLocale } from './runtime';

beforeAll(() => {
  installCatalogue(CATALOGUE);
  setLocale('en');
});

/** Führt etwas aus, das werfen MUSS, und liefert die Meldung. */
function thrownMessage(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error('Erwartet wurde ein Fehler, es kam keiner.');
}

async function thrownMessageAsync(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error('Erwartet wurde ein Fehler, es kam keiner.');
}

/** Prüft: erkannt UND nicht mehr deutsch. */
function expectTranslated(message: string, contains?: string): string {
  const english = translateLibText(message);
  expect(english, `nicht erkannt: ${message}`).not.toBeNull();
  expect(english).not.toBe(message);
  if (contains !== undefined) {
    expect(english).toContain(contains);
  }
  return english ?? '';
}

describe('base32', () => {
  it('Padding mittendrin', () => {
    expectTranslated(thrownMessage(() => decodeBase32('AB=CD')));
  });

  it('leeres Secret', () => {
    expectTranslated(thrownMessage(() => decodeBase32('')));
  });

  it('ungültiges Zeichen — Zeichen und Stelle kommen mit', () => {
    const english = expectTranslated(thrownMessage(() => decodeBase32('ABCD0FGH')));
    expect(english).toContain('“0”');
    expect(english).toContain('5');
  });

  it('unmögliche Länge — die Länge kommt mit', () => {
    expectTranslated(
      thrownMessage(() => decodeBase32('ABC')),
      '3',
    );
  });
});

describe('otpauth-uri', () => {
  it('gar keine URI', () => {
    expectTranslated(thrownMessage(() => parseOtpauthUri('nicht mal fast eine URI')));
  });

  it('fremdes Schema', () => {
    expectTranslated(
      thrownMessage(() => parseOtpauthUri('https://example.com/x')),
      'https',
    );
  });

  it('HOTP statt TOTP', () => {
    expectTranslated(
      thrownMessage(() => parseOtpauthUri('otpauth://hotp/x?secret=JBSW')),
      'HOTP',
    );
  });

  it('unbekannter Typ', () => {
    expectTranslated(
      thrownMessage(() => parseOtpauthUri('otpauth://steam/x?secret=JBSW')),
      'steam',
    );
  });

  it('leerer Typ wird nicht deutsch durchgereicht', () => {
    // `otpauth:///x` hat einen leeren Host; src/lib setzt dafür »(leer)« ein.
    const english = expectTranslated(thrownMessage(() => parseOtpauthUri('otpauth:///x?secret=A')));
    expect(english).toContain('(empty)');
    expect(english).not.toContain('leer');
  });

  it('secret fehlt', () => {
    expectTranslated(thrownMessage(() => parseOtpauthUri('otpauth://totp/GitHub:me')));
  });

  it('kaputte Prozent-Codierung im Label', () => {
    expectTranslated(thrownMessage(() => parseOtpauthUri('otpauth://totp/%?secret=JBSW')));
  });

  it('unbekannter Algorithmus', () => {
    expectTranslated(
      thrownMessage(() => parseOtpauthUri('otpauth://totp/x?secret=JBSW&algorithm=SHA3')),
      'SHA3',
    );
  });

  it('digits außerhalb des Bereichs', () => {
    const english = expectTranslated(
      thrownMessage(() => parseOtpauthUri('otpauth://totp/x?secret=JBSW&digits=9')),
    );
    expect(english).toContain('9');
    expect(english).toContain('6');
    expect(english).toContain('8');
  });

  it('period außerhalb des Bereichs', () => {
    expectTranslated(
      thrownMessage(() => parseOtpauthUri('otpauth://totp/x?secret=JBSW&period=9999')),
      '9999',
    );
  });

  it('keine ganze Zahl', () => {
    const english = expectTranslated(
      thrownMessage(() => parseOtpauthUri('otpauth://totp/x?secret=JBSW&digits=sechs')),
    );
    expect(english).toContain('digits');
    expect(english).toContain('sechs');
  });
});

describe('hotp', () => {
  it('unerlaubte Stellenzahl', async () => {
    const message = await thrownMessageAsync(() =>
      generateHotp({ secret: new Uint8Array([1, 2, 3]), counter: 0, digits: 9 }),
    );
    expectTranslated(message, '9');
  });

  it('leeres Secret', async () => {
    const message = await thrownMessageAsync(() =>
      generateHotp({ secret: new Uint8Array(0), counter: 0 }),
    );
    expectTranslated(message);
  });
});

describe('vault', () => {
  let envelope: VaultEnvelope;

  beforeAll(async () => {
    // Wenige Iterationen: Der Test prüft Fehlerpfade, nicht die Rechenzeit.
    envelope = await sealVault('GEZDGNBVGY3TQOJQ', 'passphrase', { iterations: 2 });
  });

  it('falsche Passphrase', async () => {
    expectTranslated(await thrownMessageAsync(() => openVault(envelope, 'falsch')));
  });

  it('gar keine Passphrase', async () => {
    expectTranslated(await thrownMessageAsync(() => sealVault('x', '')));
  });

  it('unbekanntes Format', async () => {
    const broken = { v: 1 } as unknown as VaultEnvelope;
    expectTranslated(await thrownMessageAsync(() => openVault(broken, 'passphrase')));
  });

  it('falsche Version', async () => {
    const message = await thrownMessageAsync(() => openVault({ ...envelope, v: 2 }, 'passphrase'));
    expectTranslated(message, '2');
  });

  it('kaputtes Base64 in einem Feld', async () => {
    const message = await thrownMessageAsync(() =>
      openVault({ ...envelope, salt: '###' }, 'passphrase'),
    );
    expectTranslated(message, 'salt');
  });

  it('heruntergesetzte Iterationszahl', async () => {
    const message = await thrownMessageAsync(() =>
      openVault({ ...envelope, iterations: 0 }, 'passphrase'),
    );
    expectTranslated(message, '0');
  });
});

/* ── Google-Authenticator-Export ───────────────────────────────────────────
   Die Nutzlast wird hier von Hand als Protobuf gebaut — mit denselben
   Wire-Format-Regeln, die protobuf.ts liest, aber ohne eine Zeile davon zu
   benutzen. Ein Vorzeichenfehler würde sonst auf beiden Seiten gleich passieren
   und der Test bliebe grün. */

function base64(bytes: readonly number[]): string {
  return btoa(String.fromCharCode(...bytes));
}

/** Eine rohe MigrationPayload. */
function migrationUri(payload: readonly number[]): string {
  return `otpauth-migration://offline?data=${encodeURIComponent(base64(payload))}`;
}

/** Ein OtpParameters-Feld (Feldnummer 1, längenbegrenzt) um `inner` herum. */
function withAccount(inner: readonly number[]): number[] {
  return [0x0a, inner.length, ...inner];
}

const SECRET_FIELD = [0x0a, 0x01, 0x41]; // secret = ein Byte
const NAME_FIELD = [0x12, 0x01, 0x58]; // name = "X"

describe('google-auth', () => {
  it('gar kein Export', () => {
    expectTranslated(thrownMessage(() => parseMigrationUri('otpauth://totp/x?secret=A')));
  });

  it('data fehlt', () => {
    expectTranslated(thrownMessage(() => parseMigrationUri('otpauth-migration://offline')));
  });

  it('kaputte Prozent-Codierung in data', () => {
    expectTranslated(
      thrownMessage(() => parseMigrationUri('otpauth-migration://offline?data=%zz')),
    );
  });

  it('kaputtes Base64 in data', () => {
    expectTranslated(
      thrownMessage(() => parseMigrationUri('otpauth-migration://offline?data=!!!')),
    );
  });

  it('Export ohne Konten', () => {
    // Nur Feld 2 (version) — kein einziges otp_parameters.
    expectTranslated(thrownMessage(() => parseMigrationUri(migrationUri([0x10, 0x02]))));
  });

  it('HOTP-Konto wird übersprungen und benannt', () => {
    const inner = [...SECRET_FIELD, ...NAME_FIELD, 0x30, 0x01]; // type = HOTP
    const result = parseMigrationUri(migrationUri(withAccount(inner)));
    expect(result.imported).toBe(0);
    expect(result.skipped).toHaveLength(1);
    expectTranslated(result.skipped[0] ?? '', 'HOTP');
  });

  it('unbekannter Algorithmus wird übersprungen', () => {
    const inner = [...SECRET_FIELD, ...NAME_FIELD, 0x20, 0x04]; // algorithm = MD5
    const result = parseMigrationUri(migrationUri(withAccount(inner)));
    expectTranslated(result.skipped[0] ?? '', 'X');
  });

  it('leeres Secret wird übersprungen', () => {
    const result = parseMigrationUri(migrationUri(withAccount(NAME_FIELD)));
    expectTranslated(result.skipped[0] ?? '', 'X');
  });

  it('»Unbenannt« wird mitübersetzt', () => {
    // Weder issuer noch name: src/lib setzt dafür das deutsche Wort ein.
    const result = parseMigrationUri(migrationUri(withAccount([0x30, 0x01])));
    const english = expectTranslated(result.skipped[0] ?? '');
    expect(english).toContain('Unnamed');
    expect(english).not.toContain('Unbenannt');
  });

  it('ein gültiges Konto kommt durch', () => {
    const inner = [...SECRET_FIELD, ...NAME_FIELD];
    const secretWithBytes = [0x0a, 0x0a, ...new Array<number>(10).fill(0x41)];
    const result = parseMigrationUri(
      migrationUri(withAccount([...secretWithBytes, ...inner.slice(SECRET_FIELD.length)])),
    );
    expect(result.imported).toBe(1);
    expect(result.skipped).toHaveLength(0);
  });
});

describe('Auffangnetz', () => {
  it('gibt Unbekanntes NICHT auf Deutsch weiter', () => {
    expect(translateLibText('Ein Satz, den niemand kennt.')).toBeNull();
    expect(translateLibMessage('Ein Satz, den niemand kennt.')).toBe(
      'This line could not be read.',
    );
  });

  it('übersetzt auch die neutrale Auffangmeldung selbst', () => {
    expectTranslated('Diese Zeile konnte nicht gelesen werden.');
  });

  it('folgt der eingestellten Sprache', () => {
    setLocale('fr');
    expect(translateLibText('Der Secret-Key ist leer.')).toBe('La clé secrète est vide.');
    setLocale('de');
    expect(translateLibText('Der Secret-Key ist leer.')).toBe('Der Secret-Key ist leer.');
    setLocale('en');
  });
});
