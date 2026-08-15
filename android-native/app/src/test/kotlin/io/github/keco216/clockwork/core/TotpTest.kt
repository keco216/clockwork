package io.github.keco216.clockwork.core

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Portiert aus `src/lib/totp.test.ts` — RFC 6238 Anhang B, alle 18 Vektoren.
 */
class TotpTest {

    private fun ascii(text: String) = text.toByteArray(Charsets.US_ASCII)

    /**
     * RFC 6238, Anhang B — die Secrets.
     *
     * ACHTUNG, klassische Stolperfalle: Jeder Algorithmus benutzt ein ANDERES,
     * unterschiedlich langes Secret. Der Fliesstext des RFC sagt "the same
     * secret", die Seed-Tabelle darunter listet aber drei verschiedene — und
     * nur mit denen kommen die Testwerte heraus (Erratum 2866). Die Laengen
     * entsprechen der Ausgabelaenge des jeweiligen Hashs: 20 Byte fuer SHA-1,
     * 32 fuer SHA-256, 64 fuer SHA-512. Wer stur 20 Byte fuer alle drei nimmt,
     * sucht den Fehler stundenlang im eigenen HMAC.
     */
    private val seeds = mapOf(
        HashAlgorithm.SHA1 to ascii("12345678901234567890"),
        HashAlgorithm.SHA256 to ascii("12345678901234567890123456789012"),
        HashAlgorithm.SHA512 to
            ascii("1234567890123456789012345678901234567890123456789012345678901234"),
    )

    private data class Vector(
        val unixSeconds: Double,
        val utc: String,
        val counterHex: String,
        val codes: Map<HashAlgorithm, String>,
    )

    private val vectors = listOf(
        Vector(
            59.0, "1970-01-01 00:00:59", "0000000000000001",
            mapOf(
                HashAlgorithm.SHA1 to "94287082",
                HashAlgorithm.SHA256 to "46119246",
                HashAlgorithm.SHA512 to "90693936",
            ),
        ),
        Vector(
            1111111109.0, "2005-03-18 01:58:29", "00000000023523EC",
            mapOf(
                HashAlgorithm.SHA1 to "07081804",
                HashAlgorithm.SHA256 to "68084774",
                HashAlgorithm.SHA512 to "25091201",
            ),
        ),
        Vector(
            1111111111.0, "2005-03-18 01:58:31", "00000000023523ED",
            mapOf(
                HashAlgorithm.SHA1 to "14050471",
                HashAlgorithm.SHA256 to "67062674",
                HashAlgorithm.SHA512 to "99943326",
            ),
        ),
        Vector(
            1234567890.0, "2009-02-13 23:31:30", "000000000273EF07",
            mapOf(
                HashAlgorithm.SHA1 to "89005924",
                HashAlgorithm.SHA256 to "91819424",
                HashAlgorithm.SHA512 to "93441116",
            ),
        ),
        Vector(
            2000000000.0, "2033-05-18 03:33:20", "0000000003F940AA",
            mapOf(
                HashAlgorithm.SHA1 to "69279037",
                HashAlgorithm.SHA256 to "90698825",
                HashAlgorithm.SHA512 to "38618901",
            ),
        ),
        Vector(
            20000000000.0, "2603-10-11 11:33:20", "0000000027BC86AA",
            mapOf(
                HashAlgorithm.SHA1 to "65353130",
                HashAlgorithm.SHA256 to "77737706",
                HashAlgorithm.SHA512 to "47863826",
            ),
        ),
    )

    @Test
    fun `timeCounter wechselt an absoluten 30-Sekunden-Grenzen`() {
        assertEquals(0L, timeCounter(0.0))
        assertEquals(0L, timeCounter(29.0))
        assertEquals(1L, timeCounter(30.0))
        assertEquals(1L, timeCounter(59.0))
        assertEquals(2L, timeCounter(60.0))
    }

    @Test
    fun `timeCounter rechnet die Zaehlerstaende aus RFC 6238 Anhang B aus`() {
        for (vector in vectors) {
            val counter = timeCounter(vector.unixSeconds, 30)
            val hex = counter.toString(16).padStart(16, '0').uppercase()
            assertEquals("t = ${vector.unixSeconds}", vector.counterHex, hex)
        }
    }

    @Test
    fun `timeCounter beruecksichtigt abweichende Perioden`() {
        assertEquals(1L, timeCounter(119.0, 60))
        assertEquals(2L, timeCounter(120.0, 60))
        assertEquals(2L, timeCounter(44.0, 15))
    }

    @Test
    fun `timeCounter weist unsinnige Parameter zurueck`() {
        assertKey(KEY_UNREADABLE) { timeCounter(-1.0) }
        assertKey(KEY_UNREADABLE) { timeCounter(Double.NaN) }
        assertKey(KEY_UNREADABLE) { timeCounter(0.0, 0) }
        assertKey(KEY_UNREADABLE) { timeCounter(0.0, -30) }
        // Der Web-Fall `timeCounter(0, 1.5)` entfaellt: Die Periode ist hier
        // ein `Int`, eine gebrochene Periode ist ein Uebersetzungsfehler.
    }

    @Test
    fun `secondsUntilNextCode zaehlt von der Periode bis 1 herunter`() {
        assertEquals(30, secondsUntilNextCode(0.0))
        assertEquals(29, secondsUntilNextCode(1.0))
        assertEquals(1, secondsUntilNextCode(29.0))
        assertEquals(30, secondsUntilNextCode(30.0))
        assertEquals(1, secondsUntilNextCode(59.0))
    }

    @Test
    fun `secondsUntilNextCode zeigt nie 0 an`() {
        var t = 0.0
        while (t < 300) {
            val remaining = secondsUntilNextCode(t)
            assertTrue("t = $t ergab $remaining", remaining in 1..30)
            t += 0.25
        }
    }

    @Test
    fun `periodProgress laeuft von 0 bis knapp 1`() {
        assertEquals(0.0, periodProgress(0.0), 1e-9)
        assertEquals(0.5, periodProgress(15.0), 1e-9)
        assertEquals(1.0, periodProgress(29.999), 1e-3)
        assertEquals(0.0, periodProgress(30.0), 1e-9)
    }

    @Test
    fun `generateTotp erfuellt RFC 6238 Anhang B fuer alle drei Algorithmen`() {
        var checked = 0
        for (algorithm in HashAlgorithm.entries) {
            for (vector in vectors) {
                val code = generateTotp(
                    secret = seeds.getValue(algorithm),
                    unixSeconds = vector.unixSeconds,
                    algorithm = algorithm,
                    digits = 8,
                    period = 30,
                )
                assertEquals(
                    "$algorithm bei t = ${vector.unixSeconds} (${vector.utc} UTC)",
                    vector.codes.getValue(algorithm),
                    code,
                )
                checked++
            }
        }
        assertEquals("Es muessen 18 Vektoren geprueft worden sein", 18, checked)
    }

    @Test
    fun `generateTotp liefert fuer die gesamte Periode denselben Code`() {
        val secret = seeds.getValue(HashAlgorithm.SHA1)
        val codes = listOf(30.0, 35.0, 45.0, 59.0, 59.999)
            .map { generateTotp(secret, it) }
            .toSet()
        assertEquals(1, codes.size)
    }

    @Test
    fun `generateTotp liefert nach der Periodengrenze einen anderen Code`() {
        val secret = seeds.getValue(HashAlgorithm.SHA1)
        assertNotEquals(generateTotp(secret, 59.0), generateTotp(secret, 60.0))
    }

    @Test
    fun `generateTotp nutzt die Voreinstellungen SHA-1 6 Stellen 30 s`() {
        // Ohne Optionen muss bei t = 59 s die 6-stellige Variante des
        // RFC-6238-Vektors 94287082 herauskommen.
        assertEquals("287082", generateTotp(seeds.getValue(HashAlgorithm.SHA1), 59.0))
    }

    @Test
    fun `generateTotpForCounter stimmt mit der naechsten Periode ueberein`() {
        val secret = seeds.getValue(HashAlgorithm.SHA1)
        val preview = generateTotpForCounter(secret, timeCounter(45.0) + 1)
        assertEquals(generateTotp(secret, 75.0), preview)
    }

    @Test
    fun `der Testschluessel der App erzeugt die Codes aus dem RFC`() {
        // GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ ist "12345678901234567890" in
        // Base32 — dasselbe Secret wie in RFC 4226 und RFC 6238.
        val secret = decodeBase32("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ")
        assertArrayEquals(seeds.getValue(HashAlgorithm.SHA1), secret)
        assertEquals("287082", generateTotp(secret, 59.0))
        assertEquals("005924", generateTotp(secret, 1234567890.0))
    }
}
