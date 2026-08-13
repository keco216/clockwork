package io.github.keco216.clockwork.core

import java.util.Base64

/**
 * Import aus dem Google Authenticator.
 *
 * Die App bietet unter "Konten exportieren" einen QR-Code an, der keine normale
 * `otpauth://`-URI enthaelt, sondern eine eigene Sammel-URI:
 *
 *     otpauth-migration://offline?data=<Base64 einer Protobuf-Nachricht>
 *
 * Darin stecken mehrere Konten auf einmal. Das Format ist nirgends offiziell
 * dokumentiert; das folgende Schema ist aus dem Wire-Format rekonstruiert und
 * deckt sich mit allen oeffentlich beschriebenen Exporten:
 *
 *     message MigrationPayload {
 *       repeated OtpParameters otp_parameters = 1;
 *       int32 version     = 2;
 *       int32 batch_size  = 3;   // in wie viele QR-Codes der Export zerfaellt
 *       int32 batch_index = 4;
 *       int32 batch_id    = 5;
 *     }
 *     message OtpParameters {
 *       bytes  secret    = 1;   // ROHE Bytes, nicht Base32!
 *       string name      = 2;   // meist "Issuer:konto"
 *       string issuer    = 3;
 *       enum   algorithm = 4;   // 1 SHA1, 2 SHA256, 3 SHA512, 4 MD5
 *       enum   digits    = 5;   // 1 = sechs, 2 = acht
 *       enum   type      = 6;   // 1 HOTP, 2 TOTP
 *       int64  counter   = 7;   // nur bei HOTP
 *     }
 *
 * ── Warum das Ergebnis otpauth://-Zeilen sind ──────────────────────────────
 * Der Import koennte direkt Konten bauen. Er erzeugt stattdessen ganz normale
 * `otpauth://`-Zeilen, die anschliessend durch denselben Parser laufen wie eine
 * von Hand eingefuegte URI. Zwei Gruende:
 *
 *   1. Es gibt nur einen Weg ins System — also auch nur eine Stelle, an der
 *      etwas falsch sein kann.
 *   2. Der Nutzer SIEHT im Textfeld, was importiert wurde, und kann es pruefen,
 *      korrigieren oder loeschen. Ein Import, der still im Hintergrund Konten
 *      anlegt, ist bei Schluesselmaterial das falsche Verhalten.
 */

/**
 * Ein Konto, das dieser Import nicht uebernehmen kann.
 *
 * Anders als im Web ist das kein fertiger deutscher Satz, sondern das Paar aus
 * Label und Grund-SCHLUESSEL. Der Web-Katalog muss den Satz spaeter per Regex
 * wieder zerlegen (`/^(.*) \(HOTP, zaehlerbasiert\)$/`), um ihn uebersetzen zu
 * koennen — hier faellt dieser Umweg weg.
 *
 * `label == null` heisst "der Export nennt keinen Namen". Im Web steht dafuer
 * das deutsche Wort "Unbenannt" im Datenstrom, das `lib-text.ts` danach wieder
 * herausrechnet; `null` sagt dasselbe, ohne den Umweg ueber eine Sprache.
 */
data class SkippedAccount(val label: String?, val reasonKey: String)

/** Das Ergebnis eines Imports. */
data class MigrationResult(
    /** Fertige `otpauth://`-Zeilen, bereit fuers Textfeld. */
    val lines: List<String>,
    /** Anzahl uebernommener TOTP-Konten. */
    val imported: Int,
    /** Konten, die diese App nicht erzeugen kann (HOTP, MD5) — mit Begruendung. */
    val skipped: List<SkippedAccount>,
)

/** Schnelltest, ob ein Text ein Google-Authenticator-Export sein will. */
fun isMigrationUri(text: String): Boolean =
    text.trim().startsWith("otpauth-migration://", ignoreCase = true)

/** 0 = "unspecified" — Google meint damit die Voreinstellung. */
private val ALGORITHMS: Map<Int, HashAlgorithm> = mapOf(
    0 to HashAlgorithm.SHA1,
    1 to HashAlgorithm.SHA1,
    2 to HashAlgorithm.SHA256,
    3 to HashAlgorithm.SHA512,
    // 4 waere MD5. Absichtlich NICHT eingetragen: Solche Konten werden
    // uebersprungen und benannt, statt sie mit einem anderen Hash falsch zu
    // uebernehmen — ein Code, der stumm nicht passt, ist schlimmer als ein
    // Konto, das fehlt.
)

private val DIGITS: Map<Int, Int> = mapOf(0 to 6, 1 to 6, 2 to 8)

private const val TYPE_HOTP = 1
private const val TYPE_TOTP = 2

/**
 * Zerlegt eine `otpauth-migration://`-URI in einzelne Konten.
 *
 * @throws MigrationError wenn die URI, das Base64 oder das Protobuf nicht passt.
 * @throws ProtobufError bei kaputten Binaerdaten.
 */
fun parseMigrationUri(input: String): MigrationResult {
    val payload = decodePayload(input)

    val lines = mutableListOf<String>()
    val skipped = mutableListOf<SkippedAccount>()
    var imported = 0

    for (field in readMessage(payload)) {
        // Feld 1 sind die Konten; alles andere (Version, Batch-Angaben)
        // interessiert uns nicht und wird stillschweigend uebersprungen —
        // genau dafuer ist das Wire-Format gemacht.
        if (field.field != 1 || field !is ProtobufField.Bytes) continue

        val account = readOtpParameters(field.value)

        when {
            account.type == TYPE_HOTP ->
                skipped += SkippedAccount(account.label, "import.skip.hotp")

            account.algorithm == null ->
                skipped += SkippedAccount(account.label, "import.skip.algorithm")

            account.secret.isEmpty() ->
                skipped += SkippedAccount(account.label, "import.skip.emptySecret")

            else -> {
                lines += toOtpauthUri(account)
                imported++
            }
        }
    }

    if (lines.isEmpty() && skipped.isEmpty()) {
        throw MigrationError("err.migration.noAccounts")
    }

    return MigrationResult(lines, imported, skipped)
}

/* ── Innereien ──────────────────────────────────────────────────────────── */

private class OtpParameters(
    var secret: ByteArray = ByteArray(0),
    var name: String = "",
    var issuer: String = "",
    var algorithm: HashAlgorithm? = HashAlgorithm.SHA1,
    var digits: Int = 6,
    var type: Int = TYPE_TOTP,
) {
    /** Der Anzeigename; `null`, wenn der Export gar keinen nennt. */
    val label: String?
        get() = issuer.ifEmpty { name }.ifEmpty { null }
}

private fun readOtpParameters(bytes: ByteArray): OtpParameters {
    val account = OtpParameters()

    for (field in readMessage(bytes)) {
        when (field.field) {
            1 -> if (field is ProtobufField.Bytes) account.secret = field.value
            2 -> account.name = field.asTextSafe()
            3 -> account.issuer = field.asTextSafe()
            // `null` heisst hier "kennen wir nicht" und fuehrt zum
            // Ueberspringen — MD5 (4) landet genau hier.
            4 -> account.algorithm = ALGORITHMS[field.asNumberSafe()]
            5 -> account.digits = DIGITS[field.asNumberSafe()] ?: 6
            6 -> account.type = field.asNumberSafe()
            // Zaehlerstand (7) und alles Kuenftige: bewusst ignoriert.
            else -> Unit
        }
    }

    return account
}

/**
 * Baut aus den Feldern eine `otpauth://`-URI.
 *
 * Der entscheidende Schritt: Das Secret liegt im Export als ROHE Bytes vor, in
 * einer URI muss es Base32 sein. Wer das uebersieht, bekommt ein scheinbar
 * funktionierendes Konto mit durchgehend falschen Codes.
 */
private fun toOtpauthUri(account: OtpParameters): String {
    val secret = encodeBase32(account.secret, padding = false)

    // Der Kontoname enthaelt oft schon "Issuer:konto". Dann wuerde ein zweites
    // Voranstellen "GitHub:GitHub:kevin" ergeben.
    val bare = stripIssuerPrefix(account.name, account.issuer)
    val label = if (account.issuer.isNotEmpty()) {
        "${account.issuer}:${bare.ifEmpty { account.issuer }}"
    } else {
        bare.ifEmpty { "Konto" }
    }

    // Der Doppelpunkt zwischen Issuer und Konto muss als TRENNER erhalten
    // bleiben, alles andere im Label aber codiert werden. Deshalb wird an ihm
    // getrennt und jede Haelfte einzeln codiert.
    val labelParts = label.split(":")
    val encodedLabel = listOf(labelParts.first(), labelParts.drop(1).joinToString(":"))
        .filter { it.isNotEmpty() }
        .joinToString(":") { encodeComponent(it) }

    val parameters = buildString {
        append("secret=").append(encodeComponent(secret))
        if (account.issuer.isNotEmpty()) {
            append("&issuer=").append(encodeComponent(account.issuer))
        }
        append("&algorithm=").append(account.algorithm?.uriName ?: HashAlgorithm.SHA1.uriName)
        append("&digits=").append(account.digits)
        // Der Export kennt kein Periodenfeld — Google Authenticator rechnet
        // immer mit 30 s. Der Wert steht trotzdem ausdruecklich da, damit die
        // erzeugte Zeile vollstaendig ist und nicht von einer Voreinstellung
        // abhaengt, die jemand spaeter aendert.
        append("&period=30")
    }

    return "otpauth://totp/$encodedLabel?$parameters"
}

private fun stripIssuerPrefix(name: String, issuer: String): String {
    if (issuer.isNotEmpty() && name.lowercase().startsWith("${issuer.lowercase()}:")) {
        return name.substring(issuer.length + 1).trim()
    }
    return name.trim()
}

/**
 * Prozent-Codierung wie `encodeURIComponent`.
 *
 * Die JDK-Alternative `URLEncoder.encode` ist hier falsch: Sie schreibt `+`
 * statt `%20` fuer ein Leerzeichen — die Formular-Regel, nicht die URI-Regel.
 * Ein Issuer "ACME Co" wuerde damit als "ACME+Co" in der URI landen und beim
 * Zurueckcodieren als "ACME+Co" gelesen werden.
 */
private fun encodeComponent(text: String): String {
    val unreserved = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~*'()"
    return buildString {
        for (byte in text.toByteArray(Charsets.UTF_8)) {
            val value = byte.toInt() and 0xff
            val char = value.toChar()
            if (char in unreserved) {
                append(char)
            } else {
                append('%').append("%02X".format(value))
            }
        }
    }
}

private fun decodePayload(input: String): ByteArray {
    val trimmed = input.trim()
    if (!isMigrationUri(trimmed)) {
        throw MigrationError("err.migration.notExport")
    }

    // NICHT ueber einen Query-Parser: Das Feld ist Standard-Base64 und enthaelt
    // damit `+`-Zeichen. Jeder Decoder mit Formular-Semantik (URLDecoder,
    // Uri.getQueryParameter, URLSearchParams im Web) deutet `+` als Leerzeichen
    // und zerstoert die Nutzdaten STILL. Deshalb wird der Rohwert von Hand
    // herausgeschnitten und nur prozent-decodiert.
    val match = Regex("[?&]data=([^&]*)").find(trimmed)
    val raw = match?.groupValues?.get(1)
    if (raw.isNullOrEmpty()) {
        throw MigrationError("err.migration.noData")
    }

    val base64Raw = try {
        PercentCodec.decode(raw)
    } catch (_: IllegalArgumentException) {
        throw MigrationError("err.migration.badPercent")
    }

    // Manche Werkzeuge liefern Base64url (`-` und `_` statt `+` und `/`).
    var base64 = base64Raw.replace('-', '+').replace('_', '/')
    while (base64.length % 4 != 0) {
        base64 += "="
    }

    return try {
        // java.util.Base64 gibt es seit API 26 — genau die Untergrenze dieser
        // App. Die Android-eigene android.util.Base64 waere die Alternative,
        // aber `core/` bleibt androidfrei, damit es als JVM-Test laeuft.
        Base64.getDecoder().decode(base64)
    } catch (_: IllegalArgumentException) {
        throw MigrationError("err.migration.badBase64")
    }
}

/** Wie `asText`, wirft aber nicht bei einem unerwarteten Wire-Type. */
private fun ProtobufField.asTextSafe(): String =
    if (this is ProtobufField.Bytes) asText() else ""

/** Wie `asNumber`, liefert aber -1 statt zu werfen. */
private fun ProtobufField.asNumberSafe(): Int =
    if (this is ProtobufField.Varint) asNumber() else -1
