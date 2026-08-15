package io.github.keco216.clockwork.core

/**
 * Verbindet die Bausteine: aus einem mehrzeiligen Textfeld werden fertige
 * Konten (oder verstaendliche Fehlermeldungen).
 *
 * Erlaubte Schreibweisen pro Zeile:
 *
 *   JBSWY3DPEHPK3PXP                       rohes Base32-Secret
 *   jbsw y3dp ehpk 3pxp                    dito, mit Leerzeichen und klein
 *   GitHub: JBSWY3DPEHPK3PXP               Secret mit selbst vergebenem Namen
 *   otpauth://totp/GitHub:me?secret=...    vollstaendige URI aus dem QR-Code
 *   # eigene Notiz                         Kommentar, wird uebersprungen
 *
 * Die Variante `Name: SECRET` ist eine bewusste Zutat dieser App (kein
 * Standard). Sie kostet fuenf Zeilen Code und macht eine Liste mit mehreren
 * Konten ueberhaupt erst benutzbar — ohne sie waeren alle Karten namenlos.
 * Verwechslungsgefahr gibt es keine: Ein Doppelpunkt kommt in Base32 nie vor.
 *
 * ── Das Textfeld bleibt die Quelle der Wahrheit ────────────────────────────
 * Auch nativ. Es gibt kein verstecktes Datenmodell daneben, das mit dem Text
 * synchron gehalten werden muesste — eine Zeile IST ein Eintrag. Das ist der
 * Charakter dieser App und der Grund, warum ein Import sichtbar ist.
 */

/** Ein einsatzbereites Konto: alles decodiert, alle Voreinstellungen aufgeloest. */
data class Account(
    val issuer: String?,
    val accountName: String?,
    val secret: ByteArray,
    val algorithm: HashAlgorithm,
    val digits: Int,
    val period: Int,
) {
    // ByteArray in einer data class: `equals`/`hashCode` von Hand, sonst
    // vergleicht der Compiler Referenzen.
    override fun equals(other: Any?): Boolean =
        this === other || (
            other is Account &&
                issuer == other.issuer &&
                accountName == other.accountName &&
                secret.contentEquals(other.secret) &&
                algorithm == other.algorithm &&
                digits == other.digits &&
                period == other.period
            )

    override fun hashCode(): Int {
        var result = issuer?.hashCode() ?: 0
        result = 31 * result + (accountName?.hashCode() ?: 0)
        result = 31 * result + secret.contentHashCode()
        result = 31 * result + algorithm.hashCode()
        result = 31 * result + digits
        result = 31 * result + period
        return result
    }
}

/**
 * Das Ergebnis einer Zeile. Ein Fehler ist hier ein ganz normaler Rueckgabewert
 * und keine Ausnahme: Eine kaputte Zeile soll eine Fehlerkarte erzeugen und die
 * anderen Zeilen in Ruhe lassen.
 */
sealed class ParsedEntry {
    abstract val key: String
    abstract val source: String

    data class Ok(
        override val key: String,
        override val source: String,
        val account: Account,
    ) : ParsedEntry()

    /**
     * Traegt Schluessel und Parameter statt eines fertigen Satzes — die
     * Oberflaeche schlaegt die Ressource nach. Siehe Errors.kt.
     */
    data class Failed(
        override val key: String,
        override val source: String,
        val messageKey: String,
        val messageArgs: Map<String, String>,
    ) : ParsedEntry()
}

/**
 * Zerlegt den gesamten Inhalt des Textfelds.
 * Leerzeilen und `#`-Kommentare fallen heraus.
 */
fun parseEntries(text: String): List<ParsedEntry> {
    val entries = mutableListOf<ParsedEntry>()

    // Der Schluessel identifiziert eine Karte ueber Neu-Auswertungen hinweg,
    // damit die Oberflaeche beim Tippen nur wirklich geaenderte Karten neu
    // aufbaut. Er besteht aus dem Zeileninhalt plus einem Zaehler fuer
    // Duplikate — bewusst NICHT aus der Zeilennummer: Sonst wuerde eine oben
    // eingefuegte Zeile alle Karten darunter ungueltig machen, obwohl sich an
    // ihnen nichts geaendert hat.
    val occurrences = mutableMapOf<String, Int>()

    for (line in text.split(Regex("\r?\n"))) {
        val source = line.trim()
        if (source.isEmpty() || source.startsWith("#")) continue

        val seen = occurrences.getOrDefault(source, 0)
        occurrences[source] = seen + 1
        entries += parseLine(source, if (seen == 0) source else "$source #${seen + 1}")
    }

    return entries
}

/** Zerlegt eine einzelne, bereits getrimmte Zeile. Wirft niemals. */
fun parseLine(source: String, key: String = source): ParsedEntry = try {
    val account = if (isOtpauthUri(source)) accountFromUri(source) else accountFromSecret(source)
    ParsedEntry.Ok(key, source, account)
} catch (error: ClockworkError) {
    ParsedEntry.Failed(key, source, error.key, error.args)
} catch (_: Exception) {
    // Alles Unerwartete bekommt die neutrale Meldung. Im Web steht dafuer
    // `describeError`, das nur die eigenen Fehlertypen durchlaesst — dieselbe
    // Absicht: Es sollen keine internen Meldungen durchsickern.
    ParsedEntry.Failed(key, source, KEY_UNREADABLE, emptyMap())
}

private fun accountFromUri(source: String): Account {
    val uri = parseOtpauthUri(source)
    return Account(
        issuer = uri.issuer,
        accountName = uri.accountName,
        secret = decodeBase32(uri.secret),
        algorithm = uri.algorithm,
        digits = uri.digits,
        period = uri.period,
    )
}

private fun accountFromSecret(source: String): Account {
    // Am LETZTEN Doppelpunkt trennen: Ein Label darf dann selbst einen
    // enthalten ("Arbeit: GitHub: SECRET"), das Secret niemals.
    val separator = source.lastIndexOf(':')
    val label = if (separator == -1) null else source.substring(0, separator).trim()
    val secretText = if (separator == -1) source else source.substring(separator + 1).trim()

    return Account(
        issuer = label?.ifEmpty { null },
        accountName = null,
        secret = decodeBase32(secretText),
        algorithm = DEFAULT_ALGORITHM,
        digits = DEFAULT_DIGITS,
        period = DEFAULT_PERIOD,
    )
}
