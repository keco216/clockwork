/**
 * Der Schlüsselvorrat der Oberfläche.
 *
 * ── Warum ein TypeScript-Interface und keine JSON-Dateien ──────────────────
 * Weil der Compiler dann mitprüft. Jede Locale-Datei endet auf
 * `satisfies Strings`; fehlt ein Schlüssel, gibt es einen Typfehler, und ein
 * überzähliger Schlüssel (Tippfehler!) wird ebenfalls angemeckert. Bei 37
 * Sprachen ist das der Unterschied zwischen „übersetzt" und „vollständig
 * übersetzt". Ein Laufzeit-Test sichert zusätzlich ab, was der Compiler nicht
 * sehen kann: die Plural-Kategorien.
 *
 * ── Warum flache Punkt-Schlüssel ───────────────────────────────────────────
 * `'vault.action.seal'` statt verschachtelter Objekte. Verschachtelt sähe
 * hübscher aus, aber die Vollständigkeitsprüfung müsste dann rekursiv laufen,
 * und ein fehlender Zweig fiele leichter durch. Flach ist hier langweiliger und
 * deshalb besser.
 *
 * ── Platzhalter ────────────────────────────────────────────────────────────
 * `{name}` wird zur Laufzeit ersetzt. Ein Platzhalter, der in `en` steht, muss
 * in jeder Übersetzung desselben Schlüssels vorkommen — auch das prüft ein
 * Test. Die Reihenfolge ist frei: Genau dafür sind es benannte Platzhalter und
 * keine Positionsangaben.
 */

/** Die sechs CLDR-Kategorien. Welche eine Sprache wirklich braucht, sagt `Intl`. */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * Ein Eintrag mit Mehrzahlformen.
 *
 * `other` ist Pflicht — es ist die Auffangform, die jede Sprache kennt. Alles
 * andere ist optional, weil jede Sprache andere Kategorien hat: Deutsch braucht
 * `one` und `other`, Polnisch zusätzlich `few` und `many`, Arabisch alle sechs.
 * Naive „+s"-Regeln wären hier schlicht falsch.
 */
export type Plural = { readonly other: string } & Partial<Readonly<Record<PluralCategory, string>>>;

export interface Strings {
  /* ── Dokument und Kopf ───────────────────────────────────────────────── */

  /** `<title>`. „Clockwork" ist die Marke und bleibt in jeder Sprache stehen. */
  'meta.title': string;
  'meta.description': string;
  /** Untertitel im Kopf. „RFC 6238" ist eine Normnummer und bleibt. */
  'brand.tagline': string;
  'skip.toCodes': string;

  /** Statuszeile im Kopf: `{connection}` und `{vault}`, damit RTL umstellen kann. */
  'status.line': string;
  'status.offline': string;
  'status.vault.off': string;
  'status.vault.locked': string;
  'status.vault.open': string;

  /* ── Zonen ───────────────────────────────────────────────────────────── */

  'zone.input': string;
  'zone.vault': string;
  'zone.codes': string;

  /* ── Eingabe ─────────────────────────────────────────────────────────── */

  'input.legend': string;
  /** `{nameSecret}`, `{uri}`, `{hash}` sind Code-Auszeichnungen. */
  'input.help.formats': string;
  /** `{paste}` ist die Tastenkombination. */
  'input.help.images': string;
  /** `{migration}` ist eine Code-Auszeichnung. */
  'input.help.migration': string;
  /** Die Steuerungstaste, wie sie in dieser Sprache heißt (Strg, Ctrl, Ctrl …). */
  'shortcut.modifier': string;

  'input.count.accounts': Plural;
  'input.count.errors': Plural;
  /** Verbindet beide Zähler: `{accounts}` und `{errors}`. */
  'input.count.join': string;

  /* ── Tasten ──────────────────────────────────────────────────────────── */

  'key.demo': string;
  'key.clear': string;
  'key.qrImage': string;
  'key.camera': string;
  'key.cameraStop': string;
  'key.copy': string;
  'key.copyDone': string;
  'key.copyFailed': string;

  'viewfinder.hint': string;

  /* ── Kanalzug ────────────────────────────────────────────────────────── */

  /** Parameterzeile: `{algorithm} · {digits} · {period}`. */
  'strip.spec': string;
  'strip.digits': Plural;
  /** `{n}` Sekunden Periode. Bleibt kurz — die Zeile steht rechts und darf nicht umbrechen. */
  'strip.period': string;
  'strip.next': string;
  /** Einheitenzeichen am Zifferblatt. Kurz halten, es steht neben der Zahl. */
  'strip.seconds.abbr': string;
  /** Langform für `<abbr title>`. */
  'strip.seconds.title': string;
  /** Nur für Screenreader: „… Sekunden **gültig**". */
  'strip.seconds.valid': string;
  /** Wenn die Zeile keinen Namen hergibt: „Konto {n}". */
  'strip.accountFallback': string;
  /** `aria-label` der Kopiertaste, `{name}` ist der Kontoname. */
  'strip.copyAria': string;
  /** Meldung nach dem Kopieren, `{digits}` sind die einzeln gesprochenen Ziffern. */
  'strip.copyAnnounce': string;
  'strip.copyFailedHint': string;

  'fault.title': string;

  /* ── Tresor ──────────────────────────────────────────────────────────── */

  'vault.state.off': string;
  'vault.state.locked': string;
  'vault.state.open': string;
  /** `{iterations}` ist die PBKDF2-Iterationszahl, lokalisiert gruppiert. */
  'vault.explain': string;
  'vault.pass.new': string;
  'vault.pass.existing': string;
  'vault.action.seal': string;
  'vault.action.unseal': string;
  'vault.action.deriving': string;
  'vault.action.lock': string;
  'vault.action.update': string;
  'vault.action.wipe': string;
  'vault.action.wipeConfirm': string;
  'vault.timeout.label': string;
  'vault.timeout.minutes': Plural;
  'vault.lockOnHide': string;

  'vault.error.nothingToStore': string;
  'vault.error.storageBlocked': string;
  'vault.error.noVault': string;
  'vault.error.noPassphrase': string;
  'vault.error.sealFailed': string;
  'vault.error.unsealFailed': string;

  'vault.msg.sealed': string;
  'vault.msg.resealed': string;
  'vault.msg.unsealed': string;
  'vault.msg.locked': string;
  'vault.msg.wiped': string;
  'vault.msg.wipedNote': string;
  'vault.locked.idle': Plural;
  'vault.locked.hidden': string;

  /* ── QR ──────────────────────────────────────────────────────────────── */

  'scan.noQr': string;
  'scan.unreadable': string;
  'scan.done': string;
  'scan.camera.unavailable': string;
  'scan.camera.denied': string;
  'scan.camera.notFound': string;
  'scan.camera.busy': string;
  'scan.camera.failed': string;

  /* ── Google-Authenticator-Import ─────────────────────────────────────── */

  'import.done': Plural;
  /** `{list}` ist die Aufzählung der übersprungenen Konten. */
  'import.skipped': string;
  /** `{label}` ist der Kontoname aus dem Export. */
  'import.skip.hotp': string;
  'import.skip.algorithm': string;
  'import.skip.emptySecret': string;
  /** Kontoname, wenn der Export keinen liefert. */
  'import.unnamed': string;
  'import.unreadable': string;

  /* ── Leerzustand und Fuß ─────────────────────────────────────────────── */

  /** `{demo}` ist der eingebettete Knopf „Demo einsetzen". */
  'vacant.text': string;
  'colophon.note': string;

  /* ── Sprachwahl ──────────────────────────────────────────────────────── */

  'lang.label': string;
  'lang.aria': string;

  /* ── Demo-Inhalt ─────────────────────────────────────────────────────── */

  /** Kommentarzeile, die „Demo einsetzen" mit einfügt. */
  'demo.comment': string;
  /** Kontoname des Demo-Eintrags. */
  'demo.label': string;

  /* ── Fehlermeldungen aus src/lib ─────────────────────────────────────────
     Diese Texte entstehen in Modulen, die byte-identisch bleiben (siehe
     i18n/lib-text.ts). Sie werden dort auf Deutsch geworfen und an der Grenze
     zur Oberfläche über diese Schlüssel neu gesetzt. */

  'err.base32.paddingInside': string;
  'err.base32.empty': string;
  /** `{char}` ist das gefundene Zeichen, `{position}` die 1-basierte Stelle. */
  'err.base32.badChar': string;
  /** `{length}` ist die Zeichenzahl ohne Leerzeichen und Padding. */
  'err.base32.badLength': string;

  'err.uri.invalid': string;
  'err.uri.scheme': string;
  'err.uri.hotp': string;
  'err.uri.type': string;
  /** Einsetzung für `{type}`, wenn nach `otpauth://` gar nichts steht. */
  'err.uri.typeEmpty': string;
  'err.uri.noSecret': string;
  'err.uri.badLabel': string;
  'err.uri.algorithm': string;
  /** `{value}` gefunden, erlaubt `{min}` bis `{max}`. */
  'err.uri.digits': string;
  'err.uri.period': string;
  /** `{name}` ist der Parametername, `{value}` das Gefundene. */
  'err.uri.integer': string;

  /** `{value}` gefunden, erlaubt `{min}` bis `{max}`. */
  'err.otp.digits': string;
  'err.otp.emptySecret': string;

  /** Auffangmeldung für eine Zeile, die sich keinem bekannten Fehler zuordnen lässt. */
  'err.line.unreadable': string;

  'err.vault.openFailed': string;
  'err.vault.badFormat': string;
  /** `{version}` gefunden, `{expected}` erwartet. */
  'err.vault.version': string;
  'err.vault.base64': string;
  /** `{value}` ist die unsinnige Iterationszahl aus manipulierten Tresordaten. */
  'err.vault.iterations': string;

  'err.migration.notExport': string;
  'err.migration.noData': string;
  'err.migration.badPercent': string;
  'err.migration.badBase64': string;
  'err.migration.noAccounts': string;
}

/** Alle Schlüssel, deren Wert ein einfacher String ist. */
export type TextKey = {
  [K in keyof Strings]: Strings[K] extends string ? K : never;
}[keyof Strings];

/** Alle Schlüssel mit Mehrzahlformen. */
export type PluralKey = {
  [K in keyof Strings]: Strings[K] extends Plural ? K : never;
}[keyof Strings];
