package io.github.keco216.clockwork.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Portiert aus `src/lib/otpauth-uri.test.ts`.
 */
class OtpauthUriTest {

    @Test
    fun `isOtpauthUri erkennt otpauth-URIs`() {
        assertTrue(isOtpauthUri("otpauth://totp/Test?secret=ABCD"))
        assertTrue(isOtpauthUri("  OTPAUTH://TOTP/Test?secret=ABCD  "))
    }

    @Test
    fun `isOtpauthUri erkennt alles andere nicht als URI`() {
        assertFalse(isOtpauthUri("JBSWY3DPEHPK3PXP"))
        assertFalse(isOtpauthUri("https://example.com"))
        assertFalse(isOtpauthUri("otpauth:totp/Test")) // ohne "//"
        assertFalse(isOtpauthUri(""))
    }

    @Test
    fun `GitHub`() {
        val parsed = parseOtpauthUri("otpauth://totp/GitHub:kevin?secret=JBSWY3DPEHPK3PXP&issuer=GitHub")
        assertEquals(
            ParsedOtpauthUri("JBSWY3DPEHPK3PXP", "GitHub", "kevin", HashAlgorithm.SHA1, 6, 30),
            parsed,
        )
    }

    @Test
    fun `Google mit vollstaendig prozent-codiertem Label`() {
        val parsed = parseOtpauthUri(
            "otpauth://totp/Google%3Akevin%40gmail.com?secret=JBSWY3DPEHPK3PXP&issuer=Google",
        )
        assertEquals("Google", parsed.issuer)
        assertEquals("kevin@gmail.com", parsed.accountName)
        assertEquals("JBSWY3DPEHPK3PXP", parsed.secret)
    }

    @Test
    fun `Microsoft mit allen Parametern explizit`() {
        val parsed = parseOtpauthUri(
            "otpauth://totp/Microsoft:kevin%40outlook.com" +
                "?secret=JBSWY3DPEHPK3PXP&issuer=Microsoft&algorithm=SHA1&digits=6&period=30",
        )
        assertEquals(
            ParsedOtpauthUri(
                "JBSWY3DPEHPK3PXP", "Microsoft", "kevin@outlook.com", HashAlgorithm.SHA1, 6, 30,
            ),
            parsed,
        )
    }

    @Test
    fun `AWS mit At-Zeichen im Kontonamen`() {
        val parsed = parseOtpauthUri(
            "otpauth://totp/AWS:kevin@123456789012?secret=JBSWY3DPEHPK3PXP&issuer=AWS",
        )
        assertEquals("AWS", parsed.issuer)
        assertEquals("kevin@123456789012", parsed.accountName)
    }

    @Test
    fun `Issuer mit Leerzeichen`() {
        val parsed = parseOtpauthUri(
            "otpauth://totp/ACME%20Co:john.doe%40email.com" +
                "?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co" +
                "&algorithm=SHA1&digits=6&period=30",
        )
        assertEquals("ACME Co", parsed.issuer)
        assertEquals("john.doe@email.com", parsed.accountName)
        assertEquals("HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ", parsed.secret)
    }

    @Test
    fun `Label ganz ohne Issuer`() {
        val parsed = parseOtpauthUri("otpauth://totp/kevin%40example.com?secret=JBSWY3DPEHPK3PXP")
        assertNull(parsed.issuer)
        assertEquals("kevin@example.com", parsed.accountName)
    }

    @Test
    fun `leeres Label`() {
        val parsed = parseOtpauthUri("otpauth://totp/?secret=JBSWY3DPEHPK3PXP")
        assertNull(parsed.issuer)
        assertNull(parsed.accountName)
    }

    @Test
    fun `Leerzeichen nach dem Doppelpunkt im Label`() {
        val parsed = parseOtpauthUri("otpauth://totp/GitHub:%20kevin?secret=JBSWY3DPEHPK3PXP")
        assertEquals("kevin", parsed.accountName)
    }

    private val base = "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP"

    @Test
    fun `setzt die Voreinstellungen SHA-1 6 30`() {
        val parsed = parseOtpauthUri(base)
        assertEquals(HashAlgorithm.SHA1, parsed.algorithm)
        assertEquals(6, parsed.digits)
        assertEquals(30, parsed.period)
    }

    @Test
    fun `uebersetzt die Algorithmus-Namen`() {
        assertEquals(HashAlgorithm.SHA1, parseOtpauthUri("$base&algorithm=SHA1").algorithm)
        assertEquals(HashAlgorithm.SHA1, parseOtpauthUri("$base&algorithm=sha1").algorithm)
        assertEquals(HashAlgorithm.SHA1, parseOtpauthUri("$base&algorithm=SHA-1").algorithm)
        assertEquals(HashAlgorithm.SHA256, parseOtpauthUri("$base&algorithm=SHA256").algorithm)
        assertEquals(HashAlgorithm.SHA512, parseOtpauthUri("$base&algorithm=sha512").algorithm)
    }

    @Test
    fun `liest abweichende Stellenzahlen und Perioden`() {
        assertEquals(8, parseOtpauthUri("$base&digits=8").digits)
        assertEquals(60, parseOtpauthUri("$base&period=60").period)
        assertEquals(15, parseOtpauthUri("$base&period=15").period)
    }

    @Test
    fun `bevorzugt den issuer-Parameter gegenueber dem Label-Praefix`() {
        // Die Key-Uri-Spezifikation erklaert den Parameter fuer verbindlich.
        val parsed = parseOtpauthUri("otpauth://totp/Alt:kevin?secret=JBSWY3DPEHPK3PXP&issuer=Richtig")
        assertEquals("Richtig", parsed.issuer)
        assertEquals("kevin", parsed.accountName)
    }

    @Test
    fun `lehnt fremde Schemata ab`() {
        val error = capture { parseOtpauthUri("https://example.com/?secret=ABCD") }
        assertEquals("err.uri.scheme", error.key)
        assertEquals("https", error.args["scheme"])
    }

    @Test
    fun `lehnt HOTP mit einer erklaerenden Meldung ab`() {
        assertKey("err.uri.hotp") { parseOtpauthUri("otpauth://hotp/Test?secret=ABCD&counter=1") }
    }

    @Test
    fun `lehnt unbekannte Typen ab`() {
        val error = capture { parseOtpauthUri("otpauth://xotp/Test?secret=ABCD") }
        assertEquals("err.uri.type", error.key)
        assertEquals("xotp", error.args["type"])
    }

    @Test
    fun `verlangt den Parameter secret`() {
        assertKey("err.uri.noSecret") { parseOtpauthUri("otpauth://totp/Test") }
        assertKey("err.uri.noSecret") { parseOtpauthUri("otpauth://totp/Test?secret=") }
        assertKey("err.uri.noSecret") { parseOtpauthUri("otpauth://totp/Test?issuer=Foo") }
    }

    @Test
    fun `lehnt unbekannte Algorithmen ab`() {
        val error = capture { parseOtpauthUri("otpauth://totp/T?secret=ABCD&algorithm=MD5") }
        assertEquals("err.uri.algorithm", error.key)
        assertEquals("MD5", error.args["value"])
    }

    @Test
    fun `lehnt unsinnige Zahlenwerte ab`() {
        assertKey("err.uri.digits") { parseOtpauthUri("otpauth://totp/T?secret=ABCD&digits=5") }
        assertKey("err.uri.digits") { parseOtpauthUri("otpauth://totp/T?secret=ABCD&digits=9") }
        assertKey("err.uri.integer") { parseOtpauthUri("otpauth://totp/T?secret=ABCD&digits=sechs") }
        assertKey("err.uri.integer") { parseOtpauthUri("otpauth://totp/T?secret=ABCD&digits=6x") }
        assertKey("err.uri.period") { parseOtpauthUri("otpauth://totp/T?secret=ABCD&period=0") }
        // "-30" faellt schon am Ziffernmuster durch, nicht erst am Bereich —
        // genau wie im Web, wo /^\d+$/ vor der Bereichspruefung greift.
        assertKey("err.uri.integer") { parseOtpauthUri("otpauth://totp/T?secret=ABCD&period=-30") }
    }

    @Test
    fun `lehnt kaputte Prozent-Codierung im Label ab`() {
        assertKey("err.uri.badLabel") { parseOtpauthUri("otpauth://totp/Test%ZZ?secret=ABCD") }
    }

    @Test
    fun `lehnt komplett unlesbare Eingaben ab`() {
        assertKey("err.uri.invalid") { parseOtpauthUri("das ist keine uri") }
    }

    @Test
    fun `ein Plus im Parameter bleibt ein Plus`() {
        // Bewusster Unterschied zur Web-Fassung, siehe PercentCodec: Dort
        // liest `URLSearchParams` das `+` als Leerzeichen, ein Anbieter "AT+T"
        // hiesse also "AT T". Hier bleibt er stehen.
        val parsed = parseOtpauthUri("$base&issuer=AT%2BT")
        assertEquals("AT+T", parsed.issuer)
    }
}
