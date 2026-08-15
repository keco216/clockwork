package io.github.keco216.clockwork.core

/**
 * Parser fuer `otpauth://`-URIs — das Format, das in praktisch jedem
 * 2FA-QR-Code steckt.
 *
 * Es ist kein RFC, sondern eine De-facto-Spezifikation von Google:
 * https://github.com/google/google-authenticator/wiki/Key-Uri-Format
 *
 * ── Aufbau ─────────────────────────────────────────────────────────────────
 *
 *   otpauth://totp/GitHub:kevin@example.com?secret=JBSWY3DP...&issuer=GitHub
 *   \______/   \__/ \____/ \______________/ \_______________________________/
 *    Schema    Typ  Issuer    Kontoname                 Parameter
 *                   \___________ "Label" ____________/
 *
 * - Typ ist `totp` (zeitbasiert) oder `hotp` (zaehlerbasiert). Wir koennen nur
 *   totp.
 * - Das Label ist URL-codiert; `%3A` oder `:` trennt Issuer und Kontoname.
 * - `secret` ist Pflicht, alles andere hat Voreinstellungen.
 * - `issuer` steht meist doppelt drin — im Label UND als Parameter. Die
 *   Spezifikation nennt den Parameter als den verbindlichen.
 *
 * ── Warum die URI hier von Hand zerlegt wird ───────────────────────────────
 * Das Web benutzt den eingebauten `URL`-Parser des Browsers. Sein naechster
 * Verwandter auf der JVM ist `java.net.URI`, und der ist hier UNBRAUCHBAR: Er
 * wirft bei kaputter Prozent-Codierung im Pfad schon beim Zerlegen
 * (`URISyntaxException`), noch bevor wir sie als solche melden koennen — aus
 * "kaputte Codierung im Label" wuerde "keine gueltige URI", also eine
 * schlechtere Auskunft fuer denselben Tippfehler. Dazu kommt, dass seine
 * dekodierenden Getter (`getPath`, `getQuery`) dieselbe `+`-Falle haben wie
 * `URLDecoder` (siehe PercentCodec).
 *
 * Die Zerlegung unten ist deshalb eigener Code — 20 Zeilen, die genau das tun,
 * was diese eine URI-Form braucht. `android.net.Uri` scheidet ohnehin aus:
 * `core/` bleibt androidfrei, damit es als JVM-Unit-Test laeuft.
 */

/** Ein zerlegter otpauth-Eintrag; alle Voreinstellungen sind aufgeloest. */
data class ParsedOtpauthUri(
    /** Das Secret, wie es in der URI steht (noch Base32-Text, nicht decodiert). */
    val secret: String,
    /** Anbieter, z. B. "GitHub". `null`, wenn die URI keinen nennt. */
    val issuer: String?,
    /** Konto, z. B. "kevin@example.com". `null`, wenn nur ein Issuer da ist. */
    val accountName: String?,
    val algorithm: HashAlgorithm,
    val digits: Int,
    val period: Int,
)

/** Schnelltest, ob eine Zeile ueberhaupt eine otpauth-URI sein will. */
fun isOtpauthUri(text: String): Boolean =
    text.trim().startsWith("otpauth://", ignoreCase = true)

/**
 * Zerlegt eine `otpauth://totp/...`-URI.
 *
 * Nicht angegebene Parameter werden mit den Voreinstellungen aus RFC 6238
 * belegt (SHA-1 / 6 Stellen / 30 s) — die Rueckgabe ist also immer vollstaendig.
 *
 * @throws OtpauthUriError bei allem, was nicht passt.
 */
fun parseOtpauthUri(input: String): ParsedOtpauthUri {
    val parts = splitUri(input.trim()) ?: throw OtpauthUriError("err.uri.invalid")

    if (!parts.scheme.equals("otpauth", ignoreCase = true)) {
        throw OtpauthUriError("err.uri.scheme", mapOf("scheme" to parts.scheme))
    }

    val type = parts.authority.lowercase()
    if (type == "hotp") {
        throw OtpauthUriError("err.uri.hotp")
    }
    if (type != "totp") {
        // Der Web-Katalog kennt fuer den leeren Fall einen eigenen Schluessel
        // (`err.uri.typeEmpty`), der als WERT des Platzhalters eingesetzt wird.
        // Diese Aufloesung gehoert der Oberflaeche, nicht dem Kern — hier steht
        // deshalb der Rohwert, und die leere Zeichenkette IST die Auskunft.
        throw OtpauthUriError("err.uri.type", mapOf("type" to parts.authority))
    }

    val label = parseLabel(parts.rawPath)
    val query = parseQuery(parts.rawQuery)

    val secret = query["secret"]?.trim()
    if (secret.isNullOrEmpty()) {
        throw OtpauthUriError("err.uri.noSecret")
    }

    // Parameter schlaegt Label — so will es die Key-Uri-Spezifikation.
    val issuerParam = query["issuer"]?.trim()
    val issuer = if (!issuerParam.isNullOrEmpty()) issuerParam else label.issuerFromLabel

    return ParsedOtpauthUri(
        secret = secret,
        issuer = issuer?.ifEmpty { null },
        accountName = label.accountName?.ifEmpty { null },
        algorithm = parseAlgorithm(query["algorithm"]),
        digits = parseDigits(query["digits"]),
        period = parsePeriod(query["period"]),
    )
}

/* ── Innereien ──────────────────────────────────────────────────────────── */

private class UriParts(
    val scheme: String,
    val authority: String,
    val rawPath: String,
    val rawQuery: String,
)

/**
 * Zerlegt `schema://authority/pfad?query` in seine ROHEN Teile.
 *
 * "Roh" ist der Punkt: Prozent-Gruppen bleiben stehen und werden erst dort
 * aufgeloest, wo klar ist, was sie bedeuten sollen. Ein `%3A` im Label ist ein
 * Trenner, ein `%3A` im Secret waere ein Fehler — dieselbe Byte-Folge, zwei
 * Bedeutungen.
 *
 * `null` heisst "sieht ueberhaupt nicht nach einer URI aus".
 */
private fun splitUri(input: String): UriParts? {
    val schemeEnd = input.indexOf(':')
    if (schemeEnd <= 0) return null
    val scheme = input.substring(0, schemeEnd)
    // Ein Schema besteht laut RFC 3986 aus ALPHA *( ALPHA / DIGIT / + / - / . )
    if (!scheme[0].isLetter() || !scheme.all { it.isLetterOrDigit() || it in "+-." }) return null
    if (!input.startsWith("//", schemeEnd + 1)) return null

    val afterSlashes = schemeEnd + 3
    var index = afterSlashes
    while (index < input.length && input[index] != '/' && input[index] != '?') index++
    val authority = input.substring(afterSlashes, index)

    val queryStart = input.indexOf('?', index)
    val rawPath = if (queryStart == -1) input.substring(index) else input.substring(index, queryStart)
    val rawQuery = if (queryStart == -1) "" else input.substring(queryStart + 1)

    return UriParts(scheme, authority, rawPath, rawQuery)
}

private class Label(val issuerFromLabel: String?, val accountName: String?)

/**
 * Zerlegt den Pfadteil in Issuer und Kontoname.
 *
 * Der Pfad ist URL-codiert (`ACME%20Co:john%40example.com`), also erst
 * decodieren, dann am ERSTEN Doppelpunkt trennen. Beide Teile werden getrimmt,
 * weil manche Anbieter nach dem Doppelpunkt ein Leerzeichen setzen.
 */
private fun parseLabel(rawPath: String): Label {
    val raw = rawPath.removePrefix("/")

    val label = try {
        PercentCodec.decode(raw)
    } catch (_: IllegalArgumentException) {
        // Die Ursache wird bewusst nicht angehaengt: Sie traegt den kaputten
        // Rohwert, und der ist bei einer otpauth-URI Schluesselmaterial in
        // unmittelbarer Nachbarschaft. Ein Stacktrace ist kein Ort dafuer.
        throw OtpauthUriError("err.uri.badLabel")
    }

    val separator = label.indexOf(':')
    if (separator == -1) {
        return Label(issuerFromLabel = null, accountName = label.trim().ifEmpty { null })
    }
    return Label(
        issuerFromLabel = label.substring(0, separator).trim().ifEmpty { null },
        accountName = label.substring(separator + 1).trim().ifEmpty { null },
    )
}

/**
 * Zerlegt den Query-Teil.
 *
 * Ein `LinkedHashMap` und kein Multimap: Taucht ein Parameter zweimal auf,
 * gewinnt der ERSTE — dasselbe Verhalten wie `URLSearchParams.get`.
 */
private fun parseQuery(rawQuery: String): Map<String, String> {
    if (rawQuery.isEmpty()) return emptyMap()
    val result = LinkedHashMap<String, String>()
    for (pair in rawQuery.split('&')) {
        if (pair.isEmpty()) continue
        val equals = pair.indexOf('=')
        val rawName = if (equals == -1) pair else pair.substring(0, equals)
        val rawValue = if (equals == -1) "" else pair.substring(equals + 1)
        // Ein kaputt codierter Parameter ist kein Grund, die ganze URI zu
        // verwerfen — der Browser laesst ihn ebenfalls stehen. Also im
        // Zweifel der Rohwert; scheitern soll erst der, der ihn braucht.
        val name = runCatching { PercentCodec.decode(rawName) }.getOrDefault(rawName)
        val value = runCatching { PercentCodec.decode(rawValue) }.getOrDefault(rawValue)
        result.putIfAbsent(name, value)
    }
    return result
}

/**
 * `SHA1` / `sha256` / `SHA-512` -> der Enum-Wert.
 * Die URI schreibt den Namen ohne Bindestrich, manche Anbieter mit.
 */
private fun parseAlgorithm(value: String?): HashAlgorithm {
    if (value == null || value.isBlank()) return DEFAULT_ALGORITHM
    return when (value.trim().uppercase().replace("-", "")) {
        "SHA1" -> HashAlgorithm.SHA1
        "SHA256" -> HashAlgorithm.SHA256
        "SHA512" -> HashAlgorithm.SHA512
        else -> throw OtpauthUriError("err.uri.algorithm", mapOf("value" to value))
    }
}

private fun parseDigits(value: String?): Int {
    if (value == null || value.isBlank()) return DEFAULT_DIGITS
    val digits = parseIntegerStrict(value, "digits")
    if (digits < MIN_DIGITS || digits > MAX_DIGITS) {
        throw OtpauthUriError(
            "err.uri.digits",
            mapOf(
                "value" to digits.toString(),
                "min" to MIN_DIGITS.toString(),
                "max" to MAX_DIGITS.toString(),
            ),
        )
    }
    return digits
}

private fun parsePeriod(value: String?): Int {
    if (value == null || value.isBlank()) return DEFAULT_PERIOD
    val period = parseIntegerStrict(value, "period")
    if (period < 1 || period > 3600) {
        throw OtpauthUriError("err.uri.period", mapOf("value" to period.toString()))
    }
    return period
}

/**
 * Bewusst strenger als `toIntOrNull` es allein waere: Nur Ziffern, nichts
 * sonst. Im Web war das Vorbild `parseInt("6abc")`, das stillschweigend 6
 * liefert und damit einen Tippfehler verschluckt.
 *
 * Ein Nebeneffekt der Strenge: "-30" faellt hier durch (kein reines Ziffern-
 * muster) und nicht erst an der Bereichspruefung. Die Meldung ist dann
 * "muss eine ganze Zahl sein" statt "erwartet werden 1 bis 3600" — dasselbe
 * wie im Web, wo `/^\d+$/` ebenfalls vor dem Bereich greift.
 */
private fun parseIntegerStrict(value: String, parameterName: String): Int {
    val trimmed = value.trim()
    if (trimmed.isEmpty() || !trimmed.all { it in '0'..'9' }) {
        throw OtpauthUriError(
            "err.uri.integer",
            mapOf("name" to parameterName, "value" to value),
        )
    }
    // Sehr lange Ziffernfolgen passen in keinen Int. Sie sind ebenfalls keine
    // gueltige Angabe — dieselbe Meldung, statt einer Ausnahme aus dem Parser.
    return trimmed.toIntOrNull()
        ?: throw OtpauthUriError(
            "err.uri.integer",
            mapOf("name" to parameterName, "value" to value),
        )
}
