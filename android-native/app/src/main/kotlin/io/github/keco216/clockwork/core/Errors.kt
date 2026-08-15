package io.github.keco216.clockwork.core

/**
 * Die Fehler aus `core/` — und der eine Punkt, an dem der Port die Web-Fassung
 * bewusst VERBESSERT statt sie abzuschreiben.
 *
 * ── Wie es im Web laeuft ───────────────────────────────────────────────────
 * `src/lib/` ist seit v1 byte-identisch eingefroren, und diese Module werfen
 * ihre Fehler mit fertig formulierten DEUTSCHEN Saetzen. Damit ein
 * franzoesischer Nutzer bei einem Tippfehler keinen deutschen Absatz liest,
 * erkennt `src/i18n/lib-text.ts` diese Saetze per Mustererkennung wieder und
 * setzt sie neu. Das ist dort vertretbar — was eingefroren ist, kann nicht
 * davonlaufen —, aber es ist ein Umweg: Ein Satz wird formuliert, um gleich
 * darauf wieder zerlegt zu werden.
 *
 * ── Wie es hier laeuft ─────────────────────────────────────────────────────
 * Der Port ist nicht eingefroren, also darf er den Umweg abschneiden: Er wirft
 * den SCHLUESSEL samt Parametern, und die Oberflaeche schlaegt die Ressource
 * nach. Kein Satz, kein Muster, keine Sprache in `core/`.
 *
 * Die Schluessel sind Zeichen fuer Zeichen dieselben wie im Web-Katalog
 * (`err.base32.badChar`, `err.uri.period`, …) — sie MUESSEN es sein, denn P4
 * erzeugt die `values-xx/strings.xml` aus genau diesen 37 Locale-Dateien. Wer
 * hier einen Schluessel erfindet, bekommt in 37 Sprachen eine leere Stelle.
 *
 * (Nebenbei eine Falle, die hier zugeschlagen hat: Der Ressourcenordner heisst
 * mit Platzhalter `values-` plus Stern plus Schraegstrich — und genau diese
 * zwei Zeichen BEENDEN einen Block-Kommentar. Der Compiler meldete danach 30
 * Syntaxfehler ab dieser Zeile. Dieselbe Familie wie die zwei Bindestriche,
 * die einen XML-Kommentar beenden.)
 *
 * Die Parameternamen stammen ebenfalls von dort (`{char}`, `{position}`, …).
 * P4 bildet sie auf positionsfeste `%1$s`-Formate ab; die Zuordnung
 * Name -> Position haelt der Generator je Schluessel fest.
 */
sealed class ClockworkError(
    /** Der i18n-Schluessel, z. B. `err.base32.badChar`. */
    val key: String,
    /** Die benannten Platzhalter dieses Schluessels. */
    val args: Map<String, String> = emptyMap(),
) : Exception(
    // Die Message ist NUR fuer Stacktraces und Testausgaben da. Sie wird
    // niemandem angezeigt — sonst waere sie wieder unuebersetzter Text.
    if (args.isEmpty()) key else "$key $args",
)

/** Fehler beim Base32-Decodieren. Entspricht `Base32Error` im Web. */
class Base32Error(key: String, args: Map<String, String> = emptyMap()) : ClockworkError(key, args)

/** Fehler in der HOTP-/TOTP-Berechnung. Entspricht `OtpError` im Web. */
class OtpError(key: String, args: Map<String, String> = emptyMap()) : ClockworkError(key, args)

/** Fehler beim Zerlegen einer `otpauth://`-URI. Entspricht `OtpauthUriError`. */
class OtpauthUriError(key: String, args: Map<String, String> = emptyMap()) :
    ClockworkError(key, args)

/** Fehler im Google-Authenticator-Import. Entspricht `MigrationError`. */
class MigrationError(key: String, args: Map<String, String> = emptyMap()) :
    ClockworkError(key, args)

/**
 * Fehler im Protobuf-Leser.
 *
 * Diese Fehler haben — wie im Web — KEINEN eigenen Katalogeintrag: Sie
 * entstehen nur an kaputten Binaerdaten, und die Oberflaeche zeigt dafuer die
 * neutrale Auffangmeldung. Deshalb tragen sie alle denselben Schluessel.
 * `detail` haelt fest, WAS kaputt war — fuer Tests und Protokoll, nicht fuer
 * die Anzeige.
 */
class ProtobufError(val detail: String) : ClockworkError(KEY_UNREADABLE)

/** Fehler am Tresor. Entspricht `VaultError` im Web. */
class VaultError(key: String, args: Map<String, String> = emptyMap()) : ClockworkError(key, args)

/**
 * Die neutrale Auffangmeldung. Im Web steht sie in `accounts.ts` als deutscher
 * Satz und in `lib-text.ts` noch einmal als Schluessel; hier gibt es sie genau
 * einmal.
 */
const val KEY_UNREADABLE: String = "err.line.unreadable"
