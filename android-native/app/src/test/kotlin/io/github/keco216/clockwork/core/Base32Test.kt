package io.github.keco216.clockwork.core

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Portiert aus `src/lib/base32.test.ts` — Fall fuer Fall, dieselben Vektoren.
 */
class Base32Test {

    private fun ascii(text: String) = text.toByteArray(Charsets.US_ASCII)
    private fun text(bytes: ByteArray) = String(bytes, Charsets.UTF_8)

    /**
     * Die offiziellen Testvektoren aus RFC 4648, Abschnitt 10. Sie decken
     * genau die interessanten Faelle ab: jeden moeglichen Rest beim Auffuellen
     * des 40-Bit-Blocks.
     */
    private val rfc4648 = listOf(
        "" to "",
        "f" to "MY======",
        "fo" to "MZXQ====",
        "foo" to "MZXW6===",
        "foob" to "MZXW6YQ=",
        "fooba" to "MZXW6YTB",
        "foobar" to "MZXW6YTBOI======",
    )

    @Test
    fun `die Tabelle enthaelt alle 7 Vektoren aus Abschnitt 10`() {
        // Wie bei HOTP: Eine Schleife ueber eine zu kurze Tabelle laeuft gruen
        // durch. Diese Zeile gibt den beiden Vektor-Tests ihre Aussage.
        assertEquals(7, rfc4648.size)
    }

    @Test
    fun `encodeBase32 erfuellt RFC 4648 Abschnitt 10`() {
        var checked = 0
        for ((plain, encoded) in rfc4648) {
            assertEquals("\"$plain\"", encoded, encodeBase32(ascii(plain)))
            checked++
        }
        assertEquals(7, checked)
    }

    @Test
    fun `encodeBase32 laesst das Padding auf Wunsch weg`() {
        assertEquals("MZXW6", encodeBase32(ascii("foo"), padding = false))
        assertEquals("MZXW6YTBOI", encodeBase32(ascii("foobar"), padding = false))
    }

    @Test
    fun `decodeBase32 erfuellt RFC 4648 Abschnitt 10`() {
        for ((plain, encoded) in rfc4648) {
            // Die leere Eingabe ist bei uns ein Fehler, siehe unten.
            if (encoded.isEmpty()) continue
            assertEquals("\"$encoded\"", plain, text(decodeBase32(encoded)))
        }
    }

    @Test
    fun `Round-trip fuer alle Laengen 1 bis 40`() {
        for (length in 1..40) {
            // Deterministische Pseudo-Bytes: reproduzierbar, aber ueber den
            // ganzen Wertebereich verteilt.
            val original = ByteArray(length) { ((it * 37 + 11) % 256).toByte() }
            assertArrayEquals("Laenge $length", original, decodeBase32(encodeBase32(original)))
        }
    }

    @Test
    fun `Round-trip funktioniert auch ohne Padding`() {
        for (length in 1..20) {
            val original = ByteArray(length) { ((it * 53 + 7) % 256).toByte() }
            assertArrayEquals(
                "Laenge $length",
                original,
                decodeBase32(encodeBase32(original, padding = false)),
            )
        }
    }

    @Test
    fun `akzeptiert Kleinbuchstaben und gemischte Schreibweise`() {
        val expected = decodeBase32("JBSWY3DPEHPK3PXP")
        assertArrayEquals(expected, decodeBase32("jbswy3dpehpk3pxp"))
        assertArrayEquals(expected, decodeBase32("JbSwY3dPeHpK3pXp"))
    }

    @Test
    fun `akzeptiert Leerzeichen Bindestriche und Zeilenumbrueche`() {
        val expected = decodeBase32("JBSWY3DPEHPK3PXP")
        assertArrayEquals(expected, decodeBase32("JBSW Y3DP EHPK 3PXP"))
        assertArrayEquals(expected, decodeBase32("JBSW-Y3DP-EHPK-3PXP"))
        assertArrayEquals(expected, decodeBase32("JBSWY3DP\nEHPK3PXP"))
        assertArrayEquals(expected, decodeBase32("  JBSWY3DPEHPK3PXP  "))
    }

    @Test
    fun `akzeptiert fehlendes und vorhandenes Padding gleichermassen`() {
        assertArrayEquals(decodeBase32("MZXW6"), decodeBase32("MZXW6==="))
        assertArrayEquals(decodeBase32("MZXW6YQ"), decodeBase32("MZXW6YQ="))
    }

    @Test
    fun `decodiert das RFC-Test-Secret zurueck nach ASCII`() {
        // Dieses Secret taucht in RFC 4226 und RFC 6238 auf — und im
        // Testschluessel-Knopf der App.
        assertEquals(
            "12345678901234567890",
            text(decodeBase32("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ")),
        )
    }

    @Test
    fun `lehnt eine leere Eingabe ab`() {
        assertKey("err.base32.empty") { decodeBase32("") }
        assertKey("err.base32.empty") { decodeBase32("   ") }
        assertKey("err.base32.empty") { decodeBase32("====") }
    }

    @Test
    fun `lehnt Zeichen ausserhalb des Alphabets ab`() {
        // 0, 1 und 8 gibt es in Base32 nicht.
        for (input in listOf("ABCD0FGH", "ABCD1FGH", "ABCD8FGH", "ABCD\$FGH", "ÄBCDEFGH")) {
            assertKey("err.base32.badChar", input) { decodeBase32(input) }
        }
    }

    @Test
    fun `nennt das stoerende Zeichen und seine Stelle`() {
        val error = capture { decodeBase32("JBSW0Y3D") }
        assertEquals("err.base32.badChar", error.key)
        assertEquals("0", error.args["char"])
        assertEquals("5", error.args["position"])
    }

    @Test
    fun `lehnt Padding mitten im String ab`() {
        assertKey("err.base32.paddingInside") { decodeBase32("MZXW6===YTB") }
    }

    @Test
    fun `lehnt unmoegliche Laengen ab`() {
        // Reste 1, 3 und 6 (mod 8) koennen nie entstanden sein.
        for (input in listOf("A", "ABC", "ABCDEF", "ABCDEFGHA")) {
            assertKey("err.base32.badLength", input) { decodeBase32(input) }
        }
    }

    @Test
    fun `bleibt bei pathologischen Eingaben linear schnell`() {
        // Regressionstest aus dem Web: Dort hatte `cleaned.replace(/=+$/, '')`
        // quadratische Laufzeit (80 000 Zeichen ~ 1,8 s — der Tab friert ein).
        // Javas Regex-Maschine hat dasselbe Rueckzugsverhalten, deshalb laeuft
        // das Abschneiden auch hier ueber eine Schleife.
        val start = System.nanoTime()
        for (length in listOf(20_000, 200_000)) {
            // Das Padding steht hier VORNE, das letzte Zeichen ist ein 'A' —
            // abgeschnitten wird also nichts, und der Fehler ist folgerichtig
            // "= mitten drin" und nicht "ungueltiges Zeichen".
            assertKey("err.base32.paddingInside") { decodeBase32("=".repeat(length) + "A") }
        }
        val millis = (System.nanoTime() - start) / 1_000_000
        // Grosszuegige Schranke: linear braucht das wenige Millisekunden,
        // quadratisch waeren es Minuten.
        assertTrue("Laufzeit $millis ms", millis < 1000)
    }

    @Test
    fun `akzeptiert alle moeglichen Laengen`() {
        for (validLength in listOf(2, 4, 5, 7, 8, 10, 16, 26, 32)) {
            val input = "A".repeat(validLength)
            assertEquals("Laenge $validLength", validLength * 5 / 8, decodeBase32(input).size)
        }
    }
}
