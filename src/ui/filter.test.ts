import { describe, expect, it } from 'vitest';

import { parseEntries } from '../lib/accounts';
import { describeForSearch, matchesFilter } from './filter';

/** Ein Eintrag aus einer Zeile — so, wie ihn die App auch bekommt. */
function entry(line: string) {
  const [only] = parseEntries(line);
  if (only === undefined) throw new Error(`Zeile ergab keinen Eintrag: ${line}`);
  return only;
}

describe('describeForSearch', () => {
  it('nimmt Aussteller und Kontonamen', () => {
    const text = describeForSearch(
      entry('otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co'),
    );
    expect(text).toContain('acme co');
    expect(text).toContain('kevin@example.com');
  });

  it('nimmt das Secret NICHT auf', () => {
    // Ein Secret ist kein Suchbegriff. Wer danach filtern könnte, könnte es
    // auch stückweise erraten — und es stünde in einem Feld, aus dem es sich
    // vorlesen lässt.
    const text = describeForSearch(entry('GitHub: JBSWY3DPEHPK3PXP'));
    expect(text).toBe('github');
    expect(text).not.toContain('jbswy');
  });

  it('nimmt bei einer unlesbaren Zeile die Zeile selbst', () => {
    const text = describeForSearch(entry('JBSW0Y3DPEHPK3PXP'));
    expect(text).toContain('jbsw0y3dpehpk3pxp');
  });

  it('kommt ohne Kontonamen aus', () => {
    // Der Rückfall „Konto 3" entsteht erst beim Zeichnen; hier darf kein
    // „undefined" im Suchtext landen.
    expect(describeForSearch(entry('JBSWY3DPEHPK3PXP'))).not.toContain('undefined');
  });
});

describe('matchesFilter', () => {
  const haystack = describeForSearch(
    entry(
      'otpauth://totp/Hetzner%20Cloud:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Hetzner%20Cloud',
    ),
  );

  it('findet einen Teil in der Mitte', () => {
    // „beginnt mit" würde hier nichts finden — Konten heißen selten so, wie man
    // nach ihnen sucht.
    expect(matchesFilter(haystack, 'cloud')).toBe(true);
  });

  it('ignoriert Gross- und Kleinschreibung und Leerraum am Rand', () => {
    expect(matchesFilter(haystack, '  HETZNER ')).toBe(true);
  });

  it('lässt bei leerer Eingabe alles durch', () => {
    expect(matchesFilter(haystack, '')).toBe(true);
    expect(matchesFilter(haystack, '   ')).toBe(true);
  });

  it('meldet einen Fehlschlag als Fehlschlag', () => {
    expect(matchesFilter(haystack, 'gibt-es-nicht')).toBe(false);
  });

  it('findet auch bei türkischem I', () => {
    // `toLowerCase()` macht aus „İ" ein „i" mit kombinierendem Punkt darüber —
    // sichtbar identisch mit „i", als Zeichenkette etwas anderes. Genau daran
    // ist der erste Anlauf gescheitert, und aufgefallen ist es hier und nicht
    // beim Nachdenken.
    const turkish = describeForSearch(entry('İSTANBUL: JBSWY3DPEHPK3PXP'));
    expect(matchesFilter(turkish, 'istanbul')).toBe(true);
  });

  it('findet Umlaute auch ohne Umlaut — und umgekehrt', () => {
    // Ein Filter über Eigennamen, der auf einem Akzent besteht, ist in der
    // halben Welt unbrauchbar. Beide Seiten laufen durch dieselbe Faltung,
    // deshalb funktioniert es in beide Richtungen.
    const umlaut = describeForSearch(entry('Müller GmbH: JBSWY3DPEHPK3PXP'));
    expect(matchesFilter(umlaut, 'muller')).toBe(true);
    expect(matchesFilter(umlaut, 'müller')).toBe(true);
  });

  it('lässt eigene Buchstaben eigene Buchstaben bleiben', () => {
    // „ß" ist kein „s" mit etwas darauf, sondern ein eigener Buchstabe. Die
    // Faltung wirft Zeichen weg, die auf einem Buchstaben SITZEN — sie ersetzt
    // keine Buchstaben. Wo die Grenze liegt, gehört festgehalten.
    const sharp = describeForSearch(entry('Straße: JBSWY3DPEHPK3PXP'));
    expect(matchesFilter(sharp, 'straße')).toBe(true);
    expect(matchesFilter(sharp, 'strasse')).toBe(false);
  });
});
