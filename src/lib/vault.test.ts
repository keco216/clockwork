import { describe, expect, it } from 'vitest';
import {
  isVaultEnvelope,
  openVault,
  PBKDF2_ITERATIONS,
  sealVault,
  VaultError,
  VAULT_VERSION,
  type VaultEnvelope,
} from './vault';

/**
 * Fast alle Tests laufen mit stark herabgesetzter Iterationszahl — 600.000
 * Iterationen kosten pro Aufruf rund eine halbe Sekunde, und ein Test, der eine
 * Minute läuft, wird irgendwann übersprungen. Dass die App den richtigen Wert
 * benutzt, prüft der letzte Block gesondert.
 */
const FAST = { iterations: 1000 } as const;

const SECRETS = ['GitHub: JBSWY3DPEHPK3PXP', 'otpauth://totp/A?secret=JBSWY3DPEHPK3PXP'].join('\n');

describe('sealVault / openVault — Roundtrip', () => {
  it('gibt denselben Klartext zurück', async () => {
    const envelope = await sealVault(SECRETS, 'richtige passphrase', FAST);
    expect(await openVault(envelope, 'richtige passphrase')).toBe(SECRETS);
  });

  it('überlebt Umlaute, Emoji und Zeilenumbrüche', async () => {
    const text = 'Grüße 🔐\nzweite Zeile\tmit Tab\r\nund CRLF';
    const envelope = await sealVault(text, 'pass', FAST);
    expect(await openVault(envelope, 'pass')).toBe(text);
  });

  it('kommt mit leerem Klartext klar', async () => {
    const envelope = await sealVault('', 'pass', FAST);
    expect(await openVault(envelope, 'pass')).toBe('');
  });

  it('überlebt JSON.stringify → JSON.parse (so liegt es im Speicher)', async () => {
    const envelope = await sealVault(SECRETS, 'pass', FAST);
    const roundTripped: unknown = JSON.parse(JSON.stringify(envelope));
    expect(isVaultEnvelope(roundTripped)).toBe(true);
    expect(await openVault(roundTripped as VaultEnvelope, 'pass')).toBe(SECRETS);
  });
});

describe('Der Umschlag verrät nichts', () => {
  it('enthält den Klartext nirgends', async () => {
    const envelope = await sealVault('GitHub: JBSWY3DPEHPK3PXP', 'pass', FAST);
    const serialised = JSON.stringify(envelope);
    expect(serialised).not.toContain('JBSWY3DPEHPK3PXP');
    expect(serialised).not.toContain('GitHub');
  });

  it('enthält die Passphrase nirgends', async () => {
    const envelope = await sealVault(SECRETS, 'streng-geheim-42', FAST);
    expect(JSON.stringify(envelope)).not.toContain('streng-geheim-42');
  });

  it('benennt Verfahren und Version offen — das ist kein Geheimnis', async () => {
    const envelope = await sealVault(SECRETS, 'pass', FAST);
    expect(envelope.kdf).toBe('PBKDF2-SHA-256');
    expect(envelope.v).toBe(VAULT_VERSION);
  });
});

describe('Salt und IV sind bei jedem Speichervorgang frisch', () => {
  it('erzeugt für gleichen Inhalt und gleiche Passphrase zwei verschiedene Umschläge', async () => {
    const a = await sealVault(SECRETS, 'pass', FAST);
    const b = await sealVault(SECRETS, 'pass', FAST);

    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
    // Der entscheidende Punkt: Auch das Chiffrat unterscheidet sich. Wären IV
    // oder Salt wiederverwendet, sähe man hier zweimal dasselbe — und bei GCM
    // wäre eine IV-Wiederverwendung ein katastrophaler Fehler.
    expect(a.data).not.toBe(b.data);
  });

  it('benutzt 16 Byte Salt und 12 Byte IV', async () => {
    const envelope = await sealVault(SECRETS, 'pass', FAST);
    expect(atob(envelope.salt)).toHaveLength(16);
    expect(atob(envelope.iv)).toHaveLength(12);
  });
});

describe('Falsche Passphrase', () => {
  it('wird abgewiesen', async () => {
    const envelope = await sealVault(SECRETS, 'richtig', FAST);
    await expect(openVault(envelope, 'falsch')).rejects.toThrow(VaultError);
  });

  it('wird auch bei einem einzigen falschen Zeichen abgewiesen', async () => {
    const envelope = await sealVault(SECRETS, 'passphrase', FAST);
    await expect(openVault(envelope, 'passphrasE')).rejects.toThrow(VaultError);
  });

  it('verrät in der Meldung nicht, was genau falsch war', async () => {
    const envelope = await sealVault(SECRETS, 'richtig', FAST);
    await expect(openVault(envelope, 'falsch')).rejects.toThrow(/Passphrase falsch — oder/);
  });

  it('lehnt eine leere Passphrase ab', async () => {
    await expect(sealVault(SECRETS, '', FAST)).rejects.toThrow(VaultError);
  });
});

describe('Manipulierter Umschlag — die GCM-Authentifizierung muss anschlagen', () => {
  /** Kippt ein einzelnes Bit in einem base64-codierten Feld. */
  function flipBit(base64: string, byteIndex: number): string {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    bytes[byteIndex] = (bytes[byteIndex] ?? 0) ^ 0b0000_0001;
    return btoa(String.fromCharCode(...bytes));
  }

  it('erkennt ein gekipptes Bit im Chiffrat', async () => {
    const envelope = await sealVault(SECRETS, 'pass', FAST);
    const tampered: VaultEnvelope = { ...envelope, data: flipBit(envelope.data, 0) };
    await expect(openVault(tampered, 'pass')).rejects.toThrow(VaultError);
  });

  it('erkennt ein gekipptes Bit im Authentifizierungs-Tag am Ende', async () => {
    const envelope = await sealVault(SECRETS, 'pass', FAST);
    const lastByte = atob(envelope.data).length - 1;
    const tampered: VaultEnvelope = { ...envelope, data: flipBit(envelope.data, lastByte) };
    await expect(openVault(tampered, 'pass')).rejects.toThrow(VaultError);
  });

  it('erkennt einen veränderten IV', async () => {
    const envelope = await sealVault(SECRETS, 'pass', FAST);
    const tampered: VaultEnvelope = { ...envelope, iv: flipBit(envelope.iv, 0) };
    await expect(openVault(tampered, 'pass')).rejects.toThrow(VaultError);
  });

  it('erkennt ein verändertes Salt', async () => {
    const envelope = await sealVault(SECRETS, 'pass', FAST);
    const tampered: VaultEnvelope = { ...envelope, salt: flipBit(envelope.salt, 0) };
    await expect(openVault(tampered, 'pass')).rejects.toThrow(VaultError);
  });

  it('erkennt eine heruntergeschriebene Iterationszahl', async () => {
    // Der eigentliche Zweck der AAD: Ohne sie könnte ein Angreifer die
    // gespeicherten 600.000 auf 1 setzen und danach 600.000-mal billiger raten.
    const envelope = await sealVault(SECRETS, 'pass', FAST);
    const tampered: VaultEnvelope = { ...envelope, iterations: 1 };
    await expect(openVault(tampered, 'pass')).rejects.toThrow(VaultError);
  });

  it('erkennt ein abgeschnittenes Chiffrat', async () => {
    const envelope = await sealVault(SECRETS, 'pass', FAST);
    const bytes = Uint8Array.from(atob(envelope.data), (c) => c.charCodeAt(0)).slice(0, -4);
    const tampered: VaultEnvelope = { ...envelope, data: btoa(String.fromCharCode(...bytes)) };
    await expect(openVault(tampered, 'pass')).rejects.toThrow(VaultError);
  });
});

describe('Kaputte Eingaben', () => {
  it('weist eine unbekannte Version zurück', async () => {
    const envelope = await sealVault(SECRETS, 'pass', FAST);
    await expect(openVault({ ...envelope, v: 99 }, 'pass')).rejects.toThrow(/Version/);
  });

  it('weist ungültiges Base64 zurück', async () => {
    const envelope = await sealVault(SECRETS, 'pass', FAST);
    await expect(openVault({ ...envelope, salt: 'kein base64 !!' }, 'pass')).rejects.toThrow(
      VaultError,
    );
  });

  it('erkennt Fremdobjekte nicht als Umschlag', () => {
    expect(isVaultEnvelope(null)).toBe(false);
    expect(isVaultEnvelope('text')).toBe(false);
    expect(isVaultEnvelope({})).toBe(false);
    expect(
      isVaultEnvelope({ v: 1, kdf: 'scrypt', iterations: 1, salt: '', iv: '', data: '' }),
    ).toBe(false);
  });
});

describe('Parameterstärke', () => {
  it('benutzt in der App 600.000 PBKDF2-Iterationen', () => {
    // OWASP-Empfehlung für PBKDF2-SHA-256. Dieser Test ist eine Sperre gegen
    // ein späteres „mach das mal schneller".
    expect(PBKDF2_ITERATIONS).toBe(600_000);
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600_000);
  });

  it('schreibt ohne Option die vollen Iterationen in den Umschlag', async () => {
    // Der einzige Test mit voller Stärke — er dauert entsprechend.
    const envelope = await sealVault('x', 'pass');
    expect(envelope.iterations).toBe(PBKDF2_ITERATIONS);
    expect(await openVault(envelope, 'pass')).toBe('x');
  }, 30_000);
});
