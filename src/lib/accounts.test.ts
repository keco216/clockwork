import { describe, expect, it } from 'vitest';
import { parseEntries, parseLine, type ParsedEntry } from './accounts';
import { generateTotp } from './totp';

const asAccount = (entry: ParsedEntry) => {
  if (entry.kind !== 'account') {
    throw new Error(`Erwartet wurde ein Konto, bekommen: ${entry.message}`);
  }
  return entry.account;
};

describe('parseLine — rohe Base32-Secrets', () => {
  it('nimmt ein nacktes Secret an', () => {
    const account = asAccount(parseLine('JBSWY3DPEHPK3PXP'));
    expect(account.secret).toHaveLength(10);
    expect(account.issuer).toBeUndefined();
    expect(account.algorithm).toBe('SHA-1');
    expect(account.digits).toBe(6);
    expect(account.period).toBe(30);
  });

  it('nimmt ein Secret mit Leerzeichen und Kleinbuchstaben an', () => {
    expect(asAccount(parseLine('jbsw y3dp ehpk 3pxp')).secret).toEqual(
      asAccount(parseLine('JBSWY3DPEHPK3PXP')).secret,
    );
  });

  it('erkennt "Name: SECRET"', () => {
    const account = asAccount(parseLine('GitHub: JBSWY3DPEHPK3PXP'));
    expect(account.issuer).toBe('GitHub');
    expect(account.secret).toEqual(asAccount(parseLine('JBSWY3DPEHPK3PXP')).secret);
  });

  it('trennt am letzten Doppelpunkt, damit der Name selbst einen enthalten darf', () => {
    const account = asAccount(parseLine('Arbeit: GitHub: JBSWY3DPEHPK3PXP'));
    expect(account.issuer).toBe('Arbeit: GitHub');
  });
});

describe('parseLine — otpauth-URIs', () => {
  it('übernimmt Label und Parameter aus der URI', () => {
    const account = asAccount(
      parseLine('otpauth://totp/GitHub:kevin?secret=JBSWY3DPEHPK3PXP&issuer=GitHub&digits=8'),
    );
    expect(account.issuer).toBe('GitHub');
    expect(account.accountName).toBe('kevin');
    expect(account.digits).toBe(8);
  });

  it('decodiert das Secret aus der URI', async () => {
    const fromUri = asAccount(
      parseLine('otpauth://totp/RFC?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'),
    );
    expect(await generateTotp({ secret: fromUri.secret, unixSeconds: 59 })).toBe('287082');
  });
});

describe('parseLine — Fehler werden zu Ergebnissen, nicht zu Ausnahmen', () => {
  it('meldet ungültige Base32-Zeichen', () => {
    const entry = parseLine('JBSW0Y3DPEHPK3PX');
    expect(entry.kind).toBe('error');
    if (entry.kind === 'error') {
      expect(entry.message).toMatch(/»0«/);
      expect(entry.source).toBe('JBSW0Y3DPEHPK3PX');
    }
  });

  it('meldet kaputte URIs', () => {
    const entry = parseLine('otpauth://totp/Test');
    expect(entry.kind).toBe('error');
    if (entry.kind === 'error') {
      expect(entry.message).toMatch(/secret/);
    }
  });

  it('wirft niemals', () => {
    for (const line of ['', '?', '::::', 'otpauth://', 'otpauth://totp/%', 'A'.repeat(999)]) {
      expect(() => parseLine(line)).not.toThrow();
    }
  });
});

describe('parseEntries — mehrere Zeilen gemischt', () => {
  const input = [
    '# Meine Konten',
    'JBSWY3DPEHPK3PXP',
    '',
    'GitHub: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
    'otpauth://totp/ACME:kevin%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME&period=60',
    '   ',
    'kaputt!!!',
  ].join('\n');

  it('überspringt Leerzeilen und Kommentare', () => {
    expect(parseEntries(input)).toHaveLength(4);
  });

  it('verarbeitet rohe Secrets und URIs gemischt', () => {
    const entries = parseEntries(input);
    expect(entries.map((entry) => entry.kind)).toEqual(['account', 'account', 'account', 'error']);
    expect(asAccount(entries[1]!).issuer).toBe('GitHub');
    expect(asAccount(entries[2]!).period).toBe(60);
  });

  it('vergibt für jede Zeile einen eigenen Schlüssel — auch bei Duplikaten', () => {
    const entries = parseEntries('JBSWY3DPEHPK3PXP\nJBSWY3DPEHPK3PXP');
    expect(entries).toHaveLength(2);
    expect(entries[0]!.key).not.toBe(entries[1]!.key);
  });

  it('lässt eine kaputte Zeile die anderen nicht beschädigen', () => {
    const entries = parseEntries('kaputt!!!\nJBSWY3DPEHPK3PXP');
    expect(entries[0]!.kind).toBe('error');
    expect(entries[1]!.kind).toBe('account');
  });

  it('liefert für leeren Text eine leere Liste', () => {
    expect(parseEntries('')).toEqual([]);
    expect(parseEntries('\n\n  \n# nur ein Kommentar\n')).toEqual([]);
  });
});
