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
  /**
   * Der Beispieltext im leeren Feld (V10).
   *
   * Er beginnt mit dem „z. B."-Kürzel der jeweiligen Sprache: Drei plausible
   * Zeilen ohne Markierung sahen aus wie echte Einträge — ein Platzhalter darf
   * nie so aussehen, als stünde schon etwas im Feld. Die Beispiele selbst
   * bleiben in jeder Sprache gleich; es sind Secrets und URIs, keine Prosa.
   *
   * Rechtsläufige Sprachen (ar, he) stellen ihr Kürzel auf eine eigene erste
   * Zeile: Das Feld ist per `dir="ltr"` festgenagelt, und in einer gemischten
   * Zeile schöbe die Bidi-Regel das Kürzel ans Zeilenende.
   */
  'input.placeholder': string;
  /** `{nameSecret}`, `{uri}`, `{hash}` sind Code-Auszeichnungen. */
  'input.help.formats': string;
  /** `{paste}` ist die Tastenkombination. */
  'input.help.images': string;
  /** `{migration}` ist eine Code-Auszeichnung. */
  'input.help.migration': string;
  /**
   * Beschriftung des Aufklappers über den beiden Hinweisen oben.
   *
   * Kurz halten: Sie steht als einzelne Zeile unter dem Feld und darf in einer
   * 23-rem-Rail nicht umbrechen.
   */
  'input.help.more': string;
  /** Die Steuerungstaste, wie sie in dieser Sprache heißt (Strg, Ctrl, Ctrl …). */
  'shortcut.modifier': string;

  'input.count.accounts': Plural;
  'input.count.errors': Plural;
  /** Verbindet beide Zähler: `{accounts}` und `{errors}`. */
  'input.count.join': string;

  /* ── Tasten ──────────────────────────────────────────────────────────── */

  'key.clear': string;
  'key.qrImage': string;
  'key.camera': string;
  'key.cameraStop': string;
  'key.copy': string;
  'key.copyDone': string;
  'key.copyFailed': string;

  'viewfinder.hint': string;

  /* ── Filter auf der Bühne ────────────────────────────────────────────────
     Erscheint erst ab acht Konten. Darunter wäre er ein Bedienelement für ein
     Problem, das es nicht gibt. */

  /** Nur für Screenreader — sichtbar ist der Platzhalter im Feld. */
  'filter.label': string;
  'filter.placeholder': string;
  /** `{query}` ist das, wonach gesucht wurde — in Anführungszeichen der Sprache. */
  'filter.empty': string;

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
  /**
   * Zwei Sätze: was der Tresor tut und was ohne Passphrase daraus wird. Die
   * Verfahrensnamen stehen absichtlich NICHT hier, sondern in
   * `vault.explain.crypto` — sie sind für die Entscheidung nicht nötig.
   */
  'vault.explain': string;
  /** `{iterations}` ist die PBKDF2-Iterationszahl, lokalisiert gruppiert. */
  'vault.explain.crypto': string;
  /** Beschriftung des Aufklappers über `vault.explain.crypto`. */
  'vault.explain.more': string;
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

  /**
   * Der eine Satz der Onboarding-Bühne.
   *
   * Seit V7 steht das Eingabefeld UNTER diesem Satz, nicht darüber — ein
   * „siehe oben" wäre jetzt falsch. Der Satz nennt deshalb die drei Wege
   * hinein und die Zusage, die dieses Gerät ausmacht.
   */
  'vacant.text': string;
  /**
   * Beschriftung des Knopfes im leeren Zustand.
   *
   * Bewusst „Testschlüssel" und nicht „Demo": Der Knopf fügt den dokumentierten
   * Testvektor aus RFC 4226 ein, und eine Taste soll benennen, was sie tut.
   * „Demo" klänge nach Spielzeugmodus — hier wird echtes, nur eben öffentlich
   * bekanntes Schlüsselmaterial eingesetzt.
   */
  'vacant.demo': string;
  'colophon.note': string;

  /* ── Sprachwahl ──────────────────────────────────────────────────────── */

  'lang.label': string;
  'lang.aria': string;

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

  /* ── Nur für die native App: das Präfix `native.` ────────────────────────
     Diese Schlüssel stehen hier, weil es genau EINEN Katalog geben soll: Der
     Compiler prüft sie über `satisfies Strings` in allen 37 Sprachen mit, und
     `catalogue.test.ts` prüft Platzhalter und Mehrzahlformen ebenso. Eine
     zweite Textquelle neben diesem Vorrat wäre nach dem ersten Tippfehler
     stumm veraltet — und zwar in 36 Sprachen, in denen niemand nachsieht.

     Im WEB-Bündel landen sie trotzdem nicht: `scripts/locale-subset.ts` nimmt
     jeden `native.`-Schlüssel beim Bauen aus den Locale-Dateien. Gemessen ist
     das Bündel danach byte-identisch zu einem ohne diese Schlüssel — das Web
     trägt kein Byte davon. Wer hier etwas ergänzt, ändert also die native App
     und nicht die Web-Fassung.

     Warum es sie überhaupt gibt: Ein Satz wie „nichts davon verlässt diesen
     Browser" ist im Web wahr und in einer nativen App schlicht falsch — dort
     gibt es keinen Browser. Denselben Satz für beide zu biegen hieße, die
     Web-Fassung schlechter zu machen. */

  /**
   * Der eine Satz der Onboarding-Bühne — native Fassung von `vacant.text`.
   *
   * Wortgleich bis auf das letzte Wort: „Gerät" statt „Browser". Die 35
   * maschinellen Übersetzungen sind aus dem vorhandenen `vacant.text`
   * ABGELEITET (nur dieses eine Wort getauscht, Satzbau unverändert) und
   * erben damit den Qualitätsvorbehalt ihrer Ausgangssätze.
   */
  'native.vacant.text': string;

  /**
   * Die Fußzeile — native Fassung von `colophon.note`.
   *
   * Der Web-Satz endet auf „HMAC über die Web Crypto API". Nativ rechnet
   * `javax.crypto`; die Web-Fassung dort stehen zu lassen wäre schlicht
   * falsch, und zwar an der einen Stelle, die das Versprechen der App
   * zusammenfasst.
   *
   * Der API-Name bleibt UNÜBERSETZT, genau wie „Web Crypto API" es in allen
   * 37 Sprachen ist. Das ist auch der Grund, warum die Ableitung so sicher
   * war: Getauscht wurde nur der Name samt Artikel („über die Web Crypto
   * API" → „über javax.crypto"), der Rest jedes Satzes steht Zeichen für
   * Zeichen unverändert.
   */
  'native.colophon.note': string;

  /**
   * Kamera nicht verfügbar — native Fassung von `scan.camera.unavailable`.
   *
   * Der Web-Satz erklärt `file://` und die Browser-Sperre; beides gibt es in
   * einer nativen App nicht. Übrig bleibt der erste Satz mit dem
   * Gerätewort aus `native.vacant.text` (dieselbe Wahl je Sprache) und die
   * „QR aus Bild"-Zusicherung des zweiten — die 35 maschinellen Fassungen
   * sind so ABGELEITET und erben den Qualitätsvorbehalt ihrer Ausgangssätze.
   */
  'native.scan.camera.unavailable': string;

  /**
   * Kamera abgelehnt — native Fassung von `scan.camera.denied`.
   *
   * Der Web-Satz sagt „Erlaubnis im Browser zurücksetzen". Nativ führt der
   * Weg über die App-Einstellungen des Systems — nur dieser Wegweiser ist
   * je Sprache getauscht, erster Satz und „QR aus Bild"-Ausweg stehen
   * unverändert.
   */
  'native.scan.camera.denied': string;
}

/** Alle Schlüssel, deren Wert ein einfacher String ist. */
export type TextKey = {
  [K in keyof Strings]: Strings[K] extends string ? K : never;
}[keyof Strings];

/** Alle Schlüssel mit Mehrzahlformen. */
export type PluralKey = {
  [K in keyof Strings]: Strings[K] extends Plural ? K : never;
}[keyof Strings];
