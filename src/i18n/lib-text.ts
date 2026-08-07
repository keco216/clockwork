/**
 * Übersetzt die deutschen Texte, die aus `src/lib/` herauskommen.
 *
 * ── Warum es diese Datei überhaupt gibt ────────────────────────────────────
 * `src/lib/` bleibt in V3 **byte-identisch** — das ist eine harte Projektregel
 * und für die Krypto-Module seit V1 der Grund, warum man ihnen trauen kann.
 * Diese Module werfen ihre Fehler aber mit fertig formulierten deutschen
 * Sätzen, und die landen ungefiltert auf einer Fehlerkarte. Ohne diese Datei
 * bekäme ein französischer Nutzer bei einem Tippfehler im Secret einen
 * deutschen Absatz zu lesen.
 *
 * ── Warum Mustererkennung vertretbar ist ───────────────────────────────────
 * Mustererkennung auf Fehlermeldungen ist normalerweise eine schlechte Idee,
 * weil sich Meldungen ändern. Hier nicht: Die Quelldateien sind per Regel
 * eingefroren. Was eingefroren ist, kann nicht davonlaufen.
 *
 * Zusätzlich sichert `lib-text.test.ts` das ab, indem es jeden erreichbaren
 * Fehlerpfad in `src/lib/` WIRKLICH auslöst und prüft, dass der Katalog die
 * entstandene Meldung erkennt. Der Katalog kann also nicht unbemerkt veralten —
 * wenn doch jemand eine Meldung ändert, wird der Test rot, nicht der Nutzer
 * ratlos.
 *
 * ── Was bei einem Fehlschlag passiert ──────────────────────────────────────
 * Ein unbekannter Text wird NICHT durchgereicht, sondern durch die neutrale
 * Meldung „Diese Zeile konnte nicht gelesen werden." ersetzt. Lieber eine
 * ungenaue Auskunft in der richtigen Sprache als eine genaue in der falschen.
 */

import { t } from './runtime';
import type { TextKey } from './strings';

/** Meldungen ohne veränderliche Teile — ein simpler Nachschlag. */
const EXACT: ReadonlyMap<string, TextKey> = new Map([
  // base32.ts
  ['Das Zeichen »=« darf nur am Ende stehen (es ist nur Auffüllung).', 'err.base32.paddingInside'],
  ['Der Secret-Key ist leer.', 'err.base32.empty'],
  // hotp.ts
  ['Das Secret ist leer — daraus lässt sich kein Code berechnen.', 'err.otp.emptySecret'],
  // otpauth-uri.ts
  ['Das ist keine gültige URI. Erwartet wird »otpauth://totp/…«.', 'err.uri.invalid'],
  [
    'Das ist eine HOTP-URI (zählerbasiert). Diese App erzeugt nur zeitbasierte ' +
      'TOTP-Codes — der Zählerstand müsste dafür gespeichert werden.',
    'err.uri.hotp',
  ],
  ['In der URI fehlt der Parameter »secret«.', 'err.uri.noSecret'],
  [
    'Das Label der URI enthält eine kaputte Prozent-Codierung (z. B. ein einzelnes »%«).',
    'err.uri.badLabel',
  ],
  // accounts.ts
  ['Diese Zeile konnte nicht gelesen werden.', 'err.line.unreadable'],
  // vault.ts
  [
    'Der Tresor ließ sich nicht öffnen. Passphrase falsch — oder die gespeicherten ' +
      'Daten wurden verändert.',
    'err.vault.openFailed',
  ],
  ['Ohne Passphrase gibt es keinen Schlüssel.', 'vault.error.noPassphrase'],
  ['Die gespeicherten Tresordaten haben ein unbekanntes Format.', 'err.vault.badFormat'],
  // google-auth.ts
  [
    'Das ist kein Google-Authenticator-Export. Erwartet wird »otpauth-migration://offline?data=…«.',
    'err.migration.notExport',
  ],
  ['In der URI fehlt der Parameter »data«.', 'err.migration.noData'],
  ['Der »data«-Parameter enthält eine kaputte Prozent-Codierung.', 'err.migration.badPercent'],
  ['Der »data«-Parameter ist kein gültiges Base64.', 'err.migration.badBase64'],
  ['In diesem Export stehen keine Konten.', 'err.migration.noAccounts'],
]);

interface Rule {
  readonly pattern: RegExp;
  readonly translate: (groups: readonly string[]) => string;
}

/** Ein Treffergruppen-Zugriff, der `noUncheckedIndexedAccess` zufriedenstellt. */
function group(groups: readonly string[], index: number): string {
  return groups[index] ?? '';
}

/**
 * Der Kontoname aus einem Google-Export. Liefert der Export keinen, setzt
 * `google-auth.ts` das deutsche Wort „Unbenannt" ein — das muss hier wieder
 * heraus.
 */
function importLabel(raw: string): string {
  return raw === 'Unbenannt' ? t('import.unnamed') : raw;
}

/** Meldungen mit eingesetzten Werten. Reihenfolge egal, die Muster sind disjunkt. */
const RULES: readonly Rule[] = [
  // base32.ts
  {
    pattern: /^Ungültiges Zeichen »(.)« an Stelle (\d+)\./u,
    translate: (g) => t('err.base32.badChar', { char: group(g, 1), position: group(g, 2) }),
  },
  {
    pattern: /^Ungültige Länge: (\d+) Zeichen \(ohne Leerzeichen und Padding\)\./u,
    translate: (g) => t('err.base32.badLength', { length: group(g, 1) }),
  },
  // hotp.ts
  {
    pattern: /^Ungültige Stellenzahl: (\S+)\. Erlaubt sind (\d+) bis (\d+)\.$/u,
    translate: (g) =>
      t('err.otp.digits', { value: group(g, 1), min: group(g, 2), max: group(g, 3) }),
  },
  // otpauth-uri.ts
  {
    pattern: /^Unbekanntes Schema »(.*)«\. Erwartet wird »otpauth«\.$/u,
    translate: (g) => t('err.uri.scheme', { scheme: group(g, 1) }),
  },
  {
    pattern: /^Unbekannter Typ »(.*)«\. Nach »otpauth:\/\/« muss »totp« stehen\.$/u,
    translate: (g) => {
      const raw = group(g, 1);
      return t('err.uri.type', { type: raw === '(leer)' ? t('err.uri.typeEmpty') : raw });
    },
  },
  {
    pattern: /^Unbekannter Algorithmus »(.*)«\. Unterstützt werden SHA1, SHA256 und SHA512\.$/u,
    translate: (g) => t('err.uri.algorithm', { value: group(g, 1) }),
  },
  {
    pattern: /^Ungültiger Wert für »digits«: (\S+)\. Erlaubt sind (\d+) bis (\d+)\.$/u,
    translate: (g) =>
      t('err.uri.digits', { value: group(g, 1), min: group(g, 2), max: group(g, 3) }),
  },
  {
    pattern: /^Ungültiger Wert für »period«: (\S+)\. Erwartet werden 1 bis 3600 Sekunden\.$/u,
    translate: (g) => t('err.uri.period', { value: group(g, 1) }),
  },
  {
    pattern: /^Der Parameter »(.*)« muss eine ganze Zahl sein, gefunden wurde »(.*)«\.$/u,
    translate: (g) => t('err.uri.integer', { name: group(g, 1), value: group(g, 2) }),
  },
  // vault.ts
  {
    pattern: /^Tresor-Version (\S+) wird nicht unterstützt \(erwartet: (\S+)\)\.$/u,
    translate: (g) => t('err.vault.version', { version: group(g, 1), expected: group(g, 2) }),
  },
  {
    pattern: /^Das Feld »(.*)« der Tresordaten ist kein gültiges Base64\.$/u,
    translate: (g) => t('err.vault.base64', { field: group(g, 1) }),
  },
  {
    pattern: /^Ungültige Iterationszahl: (\S+)\.$/u,
    translate: (g) => t('err.vault.iterations', { value: group(g, 1) }),
  },
  // google-auth.ts — die Liste übersprungener Konten
  {
    pattern: /^(.*) \(HOTP, zählerbasiert\)$/u,
    translate: (g) => t('import.skip.hotp', { label: importLabel(group(g, 1)) }),
  },
  {
    pattern: /^(.*) \(nicht unterstützter Algorithmus\)$/u,
    translate: (g) => t('import.skip.algorithm', { label: importLabel(group(g, 1)) }),
  },
  {
    pattern: /^(.*) \(leeres Secret\)$/u,
    translate: (g) => t('import.skip.emptySecret', { label: importLabel(group(g, 1)) }),
  },
];

/**
 * Übersetzt einen aus `src/lib/` stammenden Text.
 * `null` heißt: nicht erkannt — der Aufrufer entscheidet, was dann gilt.
 */
export function translateLibText(message: string): string | null {
  const exact = EXACT.get(message);
  if (exact !== undefined) {
    return t(exact);
  }
  for (const rule of RULES) {
    const match = rule.pattern.exec(message);
    if (match !== null) {
      return rule.translate(match);
    }
  }
  return null;
}

/** Wie {@link translateLibText}, aber mit neutraler Auffangmeldung statt `null`. */
export function translateLibMessage(message: string): string {
  return translateLibText(message) ?? t('err.line.unreadable');
}
