package io.github.keco216.clockwork.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Portiert aus `src/lib/hotp.test.ts` — RFC 4226 Anhang D, vollstaendig.
 */
class HotpTest {

    /** Das Secret aus RFC 4226 Anhang D: die ASCII-Zeichen "12345678901234567890". */
    private val secret = "12345678901234567890".toByteArray(Charsets.US_ASCII)

    private fun hex(bytes: ByteArray) = bytes.joinToString("") { "%02x".format(it.toInt() and 0xff) }

    private fun fromHex(hex: String) =
        ByteArray(hex.length / 2) { hex.substring(it * 2, it * 2 + 2).toInt(16).toByte() }

    private data class Vector(
        val counter: Long,
        val hmacHex: String,
        val truncated: Int,
        val code: String,
    )

    /**
     * RFC 4226, Anhang D — die vollstaendige Tabelle.
     *
     * Geprueft werden absichtlich nicht nur die Endcodes, sondern auch beide
     * Zwischenergebnisse. Geht etwas kaputt, sagt der Test sofort, WELCHER
     * Schritt schuld ist: HMAC, Truncation oder das abschliessende Modulo.
     */
    private val vectors = listOf(
        Vector(0, "cc93cf18508d94934c64b65d8ba7667fb7cde4b0", 1284755224, "755224"),
        Vector(1, "75a48a19d4cbe100644e8ac1397eea747a2d33ab", 1094287082, "287082"),
        Vector(2, "0bacb7fa082fef30782211938bc1c5e70416ff44", 137359152, "359152"),
        Vector(3, "66c28227d03a2d5529262ff016a1e6ef76557ece", 1726969429, "969429"),
        Vector(4, "a904c900a64b35909874b33e61c5938a8e15ed1c", 1640338314, "338314"),
        Vector(5, "a37e783d7b7233c083d4f62926c7a25f238d0316", 868254676, "254676"),
        Vector(6, "bc9cd28561042c83f219324d3c607256c03272ae", 1918287922, "287922"),
        Vector(7, "a4fb960c0bc06e1eabb804e5b397cdc4b45596fa", 82162583, "162583"),
        Vector(8, "1b3c89f65e6c9e883012052823443f048b4332db", 673399871, "399871"),
        Vector(9, "1637409809a679dc698207310c8c7fc07290d9e5", 645520489, "520489"),
    )

    @Test
    fun `counterToBytes codiert 0 als acht Nullbytes`() {
        assertEquals("0000000000000000", hex(counterToBytes(0L)))
    }

    @Test
    fun `counterToBytes codiert kleine Zahlen rechtsbuendig`() {
        assertEquals("0000000000000001", hex(counterToBytes(1L)))
        assertEquals("00000000000000ff", hex(counterToBytes(255L)))
        assertEquals("0000000000000100", hex(counterToBytes(256L)))
    }

    @Test
    fun `counterToBytes codiert die Zaehlerstaende aus den RFC-6238-Vektoren`() {
        assertEquals("0000000000000001", hex(counterToBytes(1L)))
        assertEquals("00000000023523ec", hex(counterToBytes(37037036L)))
        assertEquals("00000000023523ed", hex(counterToBytes(37037037L)))
        assertEquals("000000000273ef07", hex(counterToBytes(41152263L)))
        assertEquals("0000000003f940aa", hex(counterToBytes(66666666L)))
        assertEquals("0000000027bc86aa", hex(counterToBytes(666666666L)))
    }

    @Test
    fun `counterToBytes kommt mit dem groessten 64-Bit-Wert klar`() {
        // Im Web braucht dieser Fall ein `bigint`, hier genuegt der Typ:
        // ULong.MAX_VALUE IST 0xFFFFFFFFFFFFFFFF. Die Obergrenze, die das Web
        // von Hand prueft, kann in Kotlin gar nicht ueberschritten werden.
        assertEquals("ffffffffffffffff", hex(counterToBytes(ULong.MAX_VALUE)))
    }

    @Test
    fun `counterToBytes weist negative Zaehler zurueck`() {
        assertKey(KEY_UNREADABLE) { counterToBytes(-1L) }
        // Die beiden anderen Faelle des Web-Tests — 1.5 und 2^64 — kann es
        // hier nicht geben: `Long` ist ganzzahlig, `ULong` deckelt bei 2^64-1.
        // Was dort eine Laufzeitpruefung braucht, prueft hier der Compiler.
    }

    @Test
    fun `die Tabelle enthaelt alle 10 Vektoren aus Anhang D`() {
        // Eine Schleife ueber eine zu kurze Tabelle laeuft gruen durch und
        // beweist nichts. Diese Zeile ist der Grund, warum die drei
        // Vektor-Tests unten eine Aussage haben.
        assertEquals(10, vectors.size)
    }

    @Test
    fun `hmac erfuellt RFC 4226 Anhang D`() {
        var checked = 0
        for (vector in vectors) {
            val mac = hmac(HashAlgorithm.SHA1, secret, counterToBytes(vector.counter))
            assertEquals("Zaehler ${vector.counter}", vector.hmacHex, hex(mac))
            checked++
        }
        assertEquals(10, checked)
    }

    @Test
    fun `hmac lehnt ein leeres Secret ab`() {
        assertKey("err.otp.emptySecret") { hmac(HashAlgorithm.SHA1, ByteArray(0), ByteArray(8)) }
    }

    @Test
    fun `dynamicTruncate erfuellt RFC 4226 Abschnitt 5 3`() {
        var checked = 0
        for (vector in vectors) {
            assertEquals(
                "Zaehler ${vector.counter}",
                vector.truncated,
                dynamicTruncate(fromHex(vector.hmacHex)),
            )
            checked++
        }
        assertEquals(10, checked)
    }

    @Test
    fun `dynamicTruncate maskiert das oberste Bit immer aus`() {
        // Letztes Byte 0x00 -> Offset 0; die ersten vier Byte sind 0xFFFFFFFF.
        // Genau hier zahlt sich aus, dass die RFC das Bit wegwirft: In Kotlin
        // waeren die vier Bytes als Int schlicht -1.
        val bytes = ByteArray(20)
        for (i in 0 until 4) bytes[i] = 0xff.toByte()
        assertEquals(0x7fffffff, dynamicTruncate(bytes))
    }

    @Test
    fun `dynamicTruncate liest den Offset aus den letzten vier Bit`() {
        val bytes = ByteArray(20)
        bytes[19] = 0xf5.toByte() // and 0x0f = 5
        bytes[5] = 0x01
        bytes[6] = 0x02
        bytes[7] = 0x03
        bytes[8] = 0x04
        assertEquals(0x01020304, dynamicTruncate(bytes))
    }

    @Test
    fun `dynamicTruncate lehnt zu kurze Eingaben ab`() {
        assertKey(KEY_UNREADABLE) { dynamicTruncate(ByteArray(19)) }
    }

    @Test
    fun `generateHotp erfuellt die 10 Testvektoren aus RFC 4226 Anhang D`() {
        var checked = 0
        for (vector in vectors) {
            assertEquals(
                "Zaehler ${vector.counter}",
                vector.code,
                generateHotp(secret, vector.counter),
            )
            checked++
        }
        assertEquals(10, checked)
    }

    @Test
    fun `generateHotp behaelt fuehrende Nullen`() {
        var found = false
        var counter = 0L
        while (counter < 500 && !found) {
            val code = generateHotp(secret, counter)
            assertEquals("Laenge bei Zaehler $counter", 6, code.length)
            if (code.startsWith("0")) found = true
            counter++
        }
        assertTrue("Kein Code mit fuehrender Null in 500 Zaehlern gefunden", found)
    }

    @Test
    fun `generateHotp unterstuetzt 6 bis 8 Stellen`() {
        // Die laengeren Codes sind Praefix-Verlaengerungen desselben
        // 31-Bit-Werts: 1284755224 -> "84755224" (8), "4755224" (7), "755224".
        assertEquals("84755224", generateHotp(secret, 0, digits = 8))
        assertEquals("4755224", generateHotp(secret, 0, digits = 7))
        assertEquals("755224", generateHotp(secret, 0, digits = 6))
    }

    @Test
    fun `generateHotp lehnt ungueltige Stellenzahlen ab`() {
        assertKey("err.otp.digits") { generateHotp(secret, 0, digits = 5) }
        assertKey("err.otp.digits") { generateHotp(secret, 0, digits = 9) }
    }
}
