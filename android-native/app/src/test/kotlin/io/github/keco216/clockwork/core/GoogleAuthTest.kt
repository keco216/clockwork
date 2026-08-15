package io.github.keco216.clockwork.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Base64

/**
 * Portiert aus `src/lib/google-auth.test.ts`.
 *
 * Der Protobuf-SCHREIBER unten ist Teil des Tests und teilt bewusst KEINE
 * Zeile Code mit dem Leser — sonst wuerde ein Vorzeichenfehler auf beiden
 * Seiten gleich passieren und der Test bliebe gruen. Genau diese Trennung ist
 * im Web dokumentiert, und sie ist in Kotlin noch etwas mehr wert: Hier sind
 * Bytes signed, ein Fehler faellt also leichter in beide Richtungen aus.
 */
class GoogleAuthTest {

    /* ── Ein winziger Protobuf-Schreiber, nur fuer die Tests ──────────── */

    private fun varint(value: Int): List<Int> {
        val out = mutableListOf<Int>()
        var rest = value
        do {
            var byte = rest and 0x7f
            rest = rest ushr 7
            if (rest > 0) byte = byte or 0x80
            out += byte
        } while (rest > 0)
        return out
    }

    private fun key(field: Int, wireType: Int) = varint((field shl 3) or wireType)

    private fun lengthDelimited(field: Int, payload: List<Int>) =
        key(field, WIRE_BYTES) + varint(payload.size) + payload

    private fun varintField(field: Int, value: Int) = key(field, WIRE_VARINT) + varint(value)

    private fun utf8(text: String) = text.toByteArray(Charsets.UTF_8).map { it.toInt() and 0xff }

    private data class Spec(
        val secret: List<Int>,
        val name: String,
        val issuer: String? = null,
        val algorithm: Int? = null,
        val digits: Int? = null,
        val type: Int? = null,
    )

    private fun buildExport(accounts: List<Spec>): String {
        val bytes = mutableListOf<Int>()
        for (a in accounts) {
            val inner = lengthDelimited(1, a.secret) +
                lengthDelimited(2, utf8(a.name)) +
                (a.issuer?.let { lengthDelimited(3, utf8(it)) } ?: emptyList()) +
                (a.algorithm?.let { varintField(4, it) } ?: emptyList()) +
                (a.digits?.let { varintField(5, it) } ?: emptyList()) +
                varintField(6, a.type ?: 2)
            bytes += lengthDelimited(1, inner)
        }
        bytes += varintField(2, 1) // version
        bytes += varintField(3, 1) // batch_size
        bytes += varintField(4, 0) // batch_index

        val raw = ByteArray(bytes.size) { bytes[it].toByte() }
        val base64 = Base64.getEncoder().encodeToString(raw)
        return "otpauth-migration://offline?data=" + encodeForTest(base64)
    }

    /** Prozent-Codierung fuer den Testaufbau — `+`, `/` und `=` muessen weg. */
    private fun encodeForTest(text: String) = buildString {
        for (char in text) {
            if (char.isLetterOrDigit() || char in "-_.!~*'()") append(char)
            else append('%').append("%02X".format(char.code))
        }
    }

    /** "Hello!" gefolgt von DE AD BE EF — als ROHE Bytes, nicht als UTF-8-String. */
    private val hello = listOf(0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21, 0xde, 0xad, 0xbe, 0xef)

    /* ── isMigrationUri ───────────────────────────────────────────────── */

    @Test
    fun `isMigrationUri erkennt Export-URIs`() {
        assertTrue(isMigrationUri("otpauth-migration://offline?data=AAAA"))
        assertTrue(isMigrationUri("  OTPAUTH-MIGRATION://offline?data=AA  "))
    }

    @Test
    fun `isMigrationUri verwechselt sie nicht mit einer normalen otpauth-URI`() {
        assertFalse(isMigrationUri("otpauth://totp/A?secret=JBSWY3DPEHPK3PXP"))
        assertFalse(isMigrationUri("JBSWY3DPEHPK3PXP"))
    }

    /* ── Der dokumentierte Beispiel-Export ────────────────────────────── */

    /**
     * Dieser Export kursiert seit Jahren als Beispiel fuer das Format. Er
     * enthaelt ein Konto mit dem Secret aus den Bytes "Hello!\xDE\xAD\xBE\xEF"
     * — in Base32 ergibt das JBSWY3DPEHPK3PXP.
     */
    private val example = "otpauth-migration://offline?data=" +
        "CjEKCkhlbGxvId6tvu8SGEV4YW1wbGU6YWxpY2VAZ29vZ2xlLmNvbRoHRXhhbXBsZSABKAEwAhACGAEgAA%3D%3D"

    @Test
    fun `der Beispiel-Export liefert genau ein Konto`() {
        val result = parseMigrationUri(example)
        assertEquals(1, result.imported)
        assertEquals(emptyList<SkippedAccount>(), result.skipped)
        assertEquals(1, result.lines.size)
    }

    @Test
    fun `der Beispiel-Export erzeugt eine URI die der eigene Parser versteht`() {
        val parsed = parseOtpauthUri(parseMigrationUri(example).lines[0])
        assertEquals("Example", parsed.issuer)
        assertEquals("alice@google.com", parsed.accountName)
        assertEquals(HashAlgorithm.SHA1, parsed.algorithm)
        assertEquals(6, parsed.digits)
        assertEquals(30, parsed.period)
    }

    @Test
    fun `wandelt die rohen Secret-Bytes korrekt nach Base32`() {
        // Das ist die Stelle, an der Importe typischerweise scheitern: Im
        // Export stehen ROHE Bytes, in der URI muss Base32 stehen.
        val parsed = parseOtpauthUri(parseMigrationUri(example).lines[0])
        assertEquals("JBSWY3DPEHPK3PXP", parsed.secret)
    }

    @Test
    fun `erzeugt am Ende einen Code der zum Secret passt`() {
        val parsed = parseOtpauthUri(parseMigrationUri(example).lines[0])
        val secret = decodeBase32(parsed.secret)
        // Die Erwartung steht bewusst als Byte-Liste da: Ein String wie
        // "Hello!Þ­¾ï" wuerde als UTF-8 codiert und ergaebe 14 statt 10 Byte —
        // genau die Verwechslung, die ein Importer nie machen darf.
        assertEquals(hello, secret.map { it.toInt() and 0xff })
        assertEquals(6, generateTotp(secret, 0.0).length)
    }

    /* ── Selbst gebaute Exporte ───────────────────────────────────────── */

    @Test
    fun `importiert mehrere Konten auf einmal`() {
        val uri = buildExport(
            listOf(
                Spec(hello, "GitHub:kevin", "GitHub"),
                Spec(hello, "AWS:kevin@123", "AWS"),
                Spec(hello, "ohne-issuer"),
            ),
        )
        val result = parseMigrationUri(uri)
        assertEquals(3, result.imported)
        assertEquals(
            listOf("GitHub", "AWS", null),
            result.lines.map { parseOtpauthUri(it).issuer },
        )
    }

    @Test
    fun `doppelt den Issuer nicht wenn er schon im Namen steht`() {
        val uri = buildExport(listOf(Spec(hello, "GitHub:kevin", "GitHub")))
        val parsed = parseOtpauthUri(parseMigrationUri(uri).lines[0])
        assertEquals("GitHub", parsed.issuer)
        assertEquals("kevin", parsed.accountName)
    }

    @Test
    fun `uebernimmt SHA-256 und acht Stellen`() {
        val uri = buildExport(listOf(Spec(hello, "Krypto", "Krypto", algorithm = 2, digits = 2)))
        val parsed = parseOtpauthUri(parseMigrationUri(uri).lines[0])
        assertEquals(HashAlgorithm.SHA256, parsed.algorithm)
        assertEquals(8, parsed.digits)
    }

    @Test
    fun `uebernimmt SHA-512`() {
        val uri = buildExport(listOf(Spec(hello, "X", "X", algorithm = 3)))
        assertEquals(
            HashAlgorithm.SHA512,
            parseOtpauthUri(parseMigrationUri(uri).lines[0]).algorithm,
        )
    }

    @Test
    fun `behandelt unspecified als die Voreinstellung SHA-1 6 Stellen`() {
        val uri = buildExport(listOf(Spec(hello, "X", algorithm = 0, digits = 0)))
        val parsed = parseOtpauthUri(parseMigrationUri(uri).lines[0])
        assertEquals(HashAlgorithm.SHA1, parsed.algorithm)
        assertEquals(6, parsed.digits)
    }

    @Test
    fun `ueberspringt HOTP-Konten mit Begruendung`() {
        val uri = buildExport(
            listOf(
                Spec(hello, "Zaehler", "Zaehler", type = 1),
                Spec(hello, "Zeit", "Zeit", type = 2),
            ),
        )
        val result = parseMigrationUri(uri)
        assertEquals(1, result.imported)
        assertEquals(listOf(SkippedAccount("Zaehler", "import.skip.hotp")), result.skipped)
    }

    @Test
    fun `ueberspringt MD5-Konten`() {
        val uri = buildExport(listOf(Spec(hello, "Alt", "Alt", algorithm = 4)))
        val result = parseMigrationUri(uri)
        assertEquals(0, result.imported)
        assertEquals(listOf(SkippedAccount("Alt", "import.skip.algorithm")), result.skipped)
    }

    @Test
    fun `ueberspringt Konten mit leerem Secret`() {
        val uri = buildExport(listOf(Spec(emptyList(), "Leer", "Leer")))
        assertEquals(
            listOf(SkippedAccount("Leer", "import.skip.emptySecret")),
            parseMigrationUri(uri).skipped,
        )
    }

    @Test
    fun `ein Konto ganz ohne Namen meldet null statt eines deutschen Wortes`() {
        // Im Web steht hier "Unbenannt" im Datenstrom, das `lib-text.ts`
        // spaeter wieder herausrechnet. `null` sagt dasselbe ohne den Umweg
        // ueber eine Sprache — die Oberflaeche setzt `import.unnamed` ein.
        val uri = buildExport(listOf(Spec(hello, "", type = 1)))
        assertNull(parseMigrationUri(uri).skipped[0].label)
    }

    @Test
    fun `kommt mit Umlauten und Leerzeichen im Namen klar`() {
        val uri = buildExport(listOf(Spec(hello, "Büro Süd:käthe", "Büro Süd")))
        val parsed = parseOtpauthUri(parseMigrationUri(uri).lines[0])
        assertEquals("Büro Süd", parsed.issuer)
        assertEquals("käthe", parsed.accountName)
    }

    /* ── Die Plus-Falle ───────────────────────────────────────────────── */

    @Test
    fun `ueberlebt ein Base64 mit Plus und Schraegstrich`() {
        // Ein Decoder mit Formular-Semantik wuerde `+` als Leerzeichen lesen
        // und die Nutzdaten still zerstoeren. Dieses Secret ist so gewaehlt,
        // dass sein Base64 beide Zeichen enthaelt.
        val secret = listOf(0xff, 0xef, 0xbe, 0x3f, 0xfb, 0xef, 0xbe, 0x2f, 0x00, 0xff)
        val uri = buildExport(listOf(Spec(secret, "Plus", "Plus")))
        assertTrue(
            "Der Testaufbau muss wirklich %2B oder %2F erzeugen",
            Regex("data=[^&]*(%2B|%2F)", RegexOption.IGNORE_CASE).containsMatchIn(uri),
        )

        val parsed = parseOtpauthUri(parseMigrationUri(uri).lines[0])
        assertEquals(secret, decodeBase32(parsed.secret).map { it.toInt() and 0xff })
    }

    @Test
    fun `akzeptiert auch Base64url`() {
        val secret = listOf(0xff, 0xef, 0xbe, 0x3f, 0xfb, 0xef, 0xbe, 0x2f, 0x00, 0xff)
        val standard = buildExport(listOf(Spec(secret, "Plus", "Plus")))
        val raw = PercentCodec.decode(Regex("data=([^&]*)").find(standard)!!.groupValues[1])
        val urlSafe = raw.replace('+', '-').replace('/', '_').trimEnd('=')

        val result = parseMigrationUri("otpauth-migration://offline?data=$urlSafe")
        assertEquals(
            secret,
            decodeBase32(parseOtpauthUri(result.lines[0]).secret).map { it.toInt() and 0xff },
        )
    }

    /* ── Fehlerfaelle ─────────────────────────────────────────────────── */

    @Test
    fun `lehnt eine normale otpauth-URI ab`() {
        assertKey("err.migration.notExport") {
            parseMigrationUri("otpauth://totp/A?secret=JBSWY3DPEHPK3PXP")
        }
    }

    @Test
    fun `verlangt den data-Parameter`() {
        assertKey("err.migration.noData") { parseMigrationUri("otpauth-migration://offline") }
        assertKey("err.migration.noData") { parseMigrationUri("otpauth-migration://offline?data=") }
    }

    @Test
    fun `lehnt ungueltiges Base64 ab`() {
        assertKey("err.migration.badBase64") {
            parseMigrationUri("otpauth-migration://offline?data=%23%23%23")
        }
    }

    @Test
    fun `meldet einen leeren Export`() {
        assertKey("err.migration.noAccounts") {
            parseMigrationUri("otpauth-migration://offline?data=EAEYASAA")
        }
    }

    @Test
    fun `lehnt Daten ab die kein Protobuf sind`() {
        // Vier 0xFF-Bytes ergeben einen Wire-Type 7, den es nicht gibt.
        val data = Base64.getEncoder().encodeToString(ByteArray(4) { 0xff.toByte() })
        assertThrows(ProtobufError::class.java) {
            parseMigrationUri("otpauth-migration://offline?data=" + encodeForTest(data))
        }
    }
}
