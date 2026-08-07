import { describe, expect, it } from 'vitest';
import { isOtpauthUri, OtpauthUriError, parseOtpauthUri } from './otpauth-uri';

describe('isOtpauthUri', () => {
  it('erkennt otpauth-URIs', () => {
    expect(isOtpauthUri('otpauth://totp/Test?secret=ABCD')).toBe(true);
    expect(isOtpauthUri('  OTPAUTH://TOTP/Test?secret=ABCD  ')).toBe(true);
  });

  it('erkennt alles andere nicht als URI', () => {
    expect(isOtpauthUri('JBSWY3DPEHPK3PXP')).toBe(false);
    expect(isOtpauthUri('https://example.com')).toBe(false);
    expect(isOtpauthUri('otpauth:totp/Test')).toBe(false); // ohne "//"
    expect(isOtpauthUri('')).toBe(false);
  });
});

describe('parseOtpauthUri — URIs, wie echte Anbieter sie erzeugen', () => {
  it('GitHub', () => {
    const parsed = parseOtpauthUri(
      'otpauth://totp/GitHub:kevin?secret=JBSWY3DPEHPK3PXP&issuer=GitHub',
    );
    expect(parsed).toEqual({
      secret: 'JBSWY3DPEHPK3PXP',
      issuer: 'GitHub',
      accountName: 'kevin',
      algorithm: 'SHA-1',
      digits: 6,
      period: 30,
    });
  });

  it('Google (Label vollständig prozent-codiert)', () => {
    const parsed = parseOtpauthUri(
      'otpauth://totp/Google%3Akevin%40gmail.com?secret=JBSWY3DPEHPK3PXP&issuer=Google',
    );
    expect(parsed.issuer).toBe('Google');
    expect(parsed.accountName).toBe('kevin@gmail.com');
    expect(parsed.secret).toBe('JBSWY3DPEHPK3PXP');
  });

  it('Microsoft (alle Parameter explizit)', () => {
    const parsed = parseOtpauthUri(
      'otpauth://totp/Microsoft:kevin%40outlook.com' +
        '?secret=JBSWY3DPEHPK3PXP&issuer=Microsoft&algorithm=SHA1&digits=6&period=30',
    );
    expect(parsed).toEqual({
      secret: 'JBSWY3DPEHPK3PXP',
      issuer: 'Microsoft',
      accountName: 'kevin@outlook.com',
      algorithm: 'SHA-1',
      digits: 6,
      period: 30,
    });
  });

  it('AWS (Kontoname enthält ein @ mit Zahlenkonto)', () => {
    const parsed = parseOtpauthUri(
      'otpauth://totp/AWS:kevin@123456789012?secret=JBSWY3DPEHPK3PXP&issuer=AWS',
    );
    expect(parsed.issuer).toBe('AWS');
    expect(parsed.accountName).toBe('kevin@123456789012');
  });

  it('Issuer mit Leerzeichen', () => {
    const parsed = parseOtpauthUri(
      'otpauth://totp/ACME%20Co:john.doe%40email.com' +
        '?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&period=30',
    );
    expect(parsed.issuer).toBe('ACME Co');
    expect(parsed.accountName).toBe('john.doe@email.com');
    expect(parsed.secret).toBe('HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ');
  });

  it('Label ganz ohne Issuer', () => {
    const parsed = parseOtpauthUri('otpauth://totp/kevin%40example.com?secret=JBSWY3DPEHPK3PXP');
    expect(parsed.issuer).toBeUndefined();
    expect(parsed.accountName).toBe('kevin@example.com');
  });

  it('leeres Label', () => {
    const parsed = parseOtpauthUri('otpauth://totp/?secret=JBSWY3DPEHPK3PXP');
    expect(parsed.issuer).toBeUndefined();
    expect(parsed.accountName).toBeUndefined();
  });

  it('Leerzeichen nach dem Doppelpunkt im Label', () => {
    const parsed = parseOtpauthUri('otpauth://totp/GitHub:%20kevin?secret=JBSWY3DPEHPK3PXP');
    expect(parsed.accountName).toBe('kevin');
  });
});

describe('parseOtpauthUri — Parameter', () => {
  const base = 'otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP';

  it('setzt die Voreinstellungen SHA-1 / 6 / 30, wenn nichts angegeben ist', () => {
    const parsed = parseOtpauthUri(base);
    expect(parsed.algorithm).toBe('SHA-1');
    expect(parsed.digits).toBe(6);
    expect(parsed.period).toBe(30);
  });

  it('übersetzt die Algorithmus-Namen in die Schreibweise der Web Crypto API', () => {
    expect(parseOtpauthUri(`${base}&algorithm=SHA1`).algorithm).toBe('SHA-1');
    expect(parseOtpauthUri(`${base}&algorithm=sha1`).algorithm).toBe('SHA-1');
    expect(parseOtpauthUri(`${base}&algorithm=SHA-1`).algorithm).toBe('SHA-1');
    expect(parseOtpauthUri(`${base}&algorithm=SHA256`).algorithm).toBe('SHA-256');
    expect(parseOtpauthUri(`${base}&algorithm=sha512`).algorithm).toBe('SHA-512');
  });

  it('liest abweichende Stellenzahlen und Perioden', () => {
    expect(parseOtpauthUri(`${base}&digits=8`).digits).toBe(8);
    expect(parseOtpauthUri(`${base}&period=60`).period).toBe(60);
    expect(parseOtpauthUri(`${base}&period=15`).period).toBe(15);
  });

  it('bevorzugt den issuer-Parameter gegenüber dem Label-Präfix', () => {
    // Die Key-Uri-Spezifikation erklärt den Parameter für verbindlich.
    const parsed = parseOtpauthUri(
      'otpauth://totp/Alt:kevin?secret=JBSWY3DPEHPK3PXP&issuer=Richtig',
    );
    expect(parsed.issuer).toBe('Richtig');
    expect(parsed.accountName).toBe('kevin');
  });
});

describe('parseOtpauthUri — Fehlerfälle', () => {
  it('lehnt fremde Schemata ab', () => {
    expect(() => parseOtpauthUri('https://example.com/?secret=ABCD')).toThrow(OtpauthUriError);
  });

  it('lehnt HOTP mit einer erklärenden Meldung ab', () => {
    expect(() => parseOtpauthUri('otpauth://hotp/Test?secret=ABCD&counter=1')).toThrow(/HOTP/);
  });

  it('lehnt unbekannte Typen ab', () => {
    expect(() => parseOtpauthUri('otpauth://xotp/Test?secret=ABCD')).toThrow(/totp/i);
  });

  it('verlangt den Parameter secret', () => {
    expect(() => parseOtpauthUri('otpauth://totp/Test')).toThrow(/secret/);
    expect(() => parseOtpauthUri('otpauth://totp/Test?secret=')).toThrow(/secret/);
    expect(() => parseOtpauthUri('otpauth://totp/Test?issuer=Foo')).toThrow(/secret/);
  });

  it('lehnt unbekannte Algorithmen ab', () => {
    expect(() => parseOtpauthUri('otpauth://totp/T?secret=ABCD&algorithm=MD5')).toThrow(/MD5/);
  });

  it('lehnt unsinnige Zahlenwerte ab', () => {
    expect(() => parseOtpauthUri('otpauth://totp/T?secret=ABCD&digits=5')).toThrow(/digits/);
    expect(() => parseOtpauthUri('otpauth://totp/T?secret=ABCD&digits=9')).toThrow(/digits/);
    expect(() => parseOtpauthUri('otpauth://totp/T?secret=ABCD&digits=sechs')).toThrow(/digits/);
    expect(() => parseOtpauthUri('otpauth://totp/T?secret=ABCD&digits=6x')).toThrow(/digits/);
    expect(() => parseOtpauthUri('otpauth://totp/T?secret=ABCD&period=0')).toThrow(/period/);
    expect(() => parseOtpauthUri('otpauth://totp/T?secret=ABCD&period=-30')).toThrow(/period/);
  });

  it('lehnt kaputte Prozent-Codierung im Label ab', () => {
    expect(() => parseOtpauthUri('otpauth://totp/Test%ZZ?secret=ABCD')).toThrow(/Codierung/);
  });

  it('lehnt komplett unlesbare Eingaben ab', () => {
    expect(() => parseOtpauthUri('das ist keine uri')).toThrow(OtpauthUriError);
  });
});
