package io.github.keco216.clockwork.core

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Portiert aus `src/lib/accounts.test.ts`.
 */
class AccountsTest {

    private fun account(entry: ParsedEntry): Account {
        assertTrue("Erwartet wurde ein Konto, bekommen: $entry", entry is ParsedEntry.Ok)
        return (entry as ParsedEntry.Ok).account
    }

    @Test
    fun `nimmt ein nacktes Secret an`() {
        val account = account(parseLine("JBSWY3DPEHPK3PXP"))
        assertEquals(10, account.secret.size)
        assertNull(account.issuer)
        assertEquals(HashAlgorithm.SHA1, account.algorithm)
        assertEquals(6, account.digits)
        assertEquals(30, account.period)
    }

    @Test
    fun `nimmt ein Secret mit Leerzeichen und Kleinbuchstaben an`() {
        assertArrayEquals(
            account(parseLine("JBSWY3DPEHPK3PXP")).secret,
            account(parseLine("jbsw y3dp ehpk 3pxp")).secret,
        )
    }

    @Test
    fun `erkennt Name doppelpunkt SECRET`() {
        val account = account(parseLine("GitHub: JBSWY3DPEHPK3PXP"))
        assertEquals("GitHub", account.issuer)
        assertArrayEquals(account(parseLine("JBSWY3DPEHPK3PXP")).secret, account.secret)
    }

    @Test
    fun `trennt am letzten Doppelpunkt`() {
        // Damit der Name selbst einen enthalten darf — das Secret nie.
        assertEquals("Arbeit: GitHub", account(parseLine("Arbeit: GitHub: JBSWY3DPEHPK3PXP")).issuer)
    }

    @Test
    fun `uebernimmt Label und Parameter aus der URI`() {
        val account = account(
            parseLine("otpauth://totp/GitHub:kevin?secret=JBSWY3DPEHPK3PXP&issuer=GitHub&digits=8"),
        )
        assertEquals("GitHub", account.issuer)
        assertEquals("kevin", account.accountName)
        assertEquals(8, account.digits)
    }

    @Test
    fun `decodiert das Secret aus der URI`() {
        val account = account(parseLine("otpauth://totp/RFC?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"))
        assertEquals("287082", generateTotp(account.secret, 59.0))
    }

    @Test
    fun `meldet ungueltige Base32-Zeichen als Ergebnis statt als Ausnahme`() {
        val entry = parseLine("JBSW0Y3DPEHPK3PX")
        assertTrue(entry is ParsedEntry.Failed)
        entry as ParsedEntry.Failed
        assertEquals("err.base32.badChar", entry.messageKey)
        assertEquals("0", entry.messageArgs["char"])
        assertEquals("JBSW0Y3DPEHPK3PX", entry.source)
    }

    @Test
    fun `meldet kaputte URIs`() {
        val entry = parseLine("otpauth://totp/Test")
        assertTrue(entry is ParsedEntry.Failed)
        assertEquals("err.uri.noSecret", (entry as ParsedEntry.Failed).messageKey)
    }

    @Test
    fun `parseLine wirft niemals`() {
        for (line in listOf("", "?", "::::", "otpauth://", "otpauth://totp/%", "A".repeat(999))) {
            // Kein assertThrows, sondern der Aufruf selbst: Ein geworfener
            // Fehler liesse den Test scheitern, und genau das ist die Zusage.
            val entry = parseLine(line)
            assertTrue("Zeile \"$line\"", entry is ParsedEntry.Failed || entry is ParsedEntry.Ok)
        }
    }

    private val mixed = listOf(
        "# Meine Konten",
        "JBSWY3DPEHPK3PXP",
        "",
        "GitHub: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
        "otpauth://totp/ACME:kevin%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME&period=60",
        "   ",
        "kaputt!!!",
    ).joinToString("\n")

    @Test
    fun `ueberspringt Leerzeilen und Kommentare`() {
        assertEquals(4, parseEntries(mixed).size)
    }

    @Test
    fun `verarbeitet rohe Secrets und URIs gemischt`() {
        val entries = parseEntries(mixed)
        assertEquals(
            listOf(true, true, true, false),
            entries.map { it is ParsedEntry.Ok },
        )
        assertEquals("GitHub", account(entries[1]).issuer)
        assertEquals(60, account(entries[2]).period)
    }

    @Test
    fun `vergibt fuer jede Zeile einen eigenen Schluessel auch bei Duplikaten`() {
        val entries = parseEntries("JBSWY3DPEHPK3PXP\nJBSWY3DPEHPK3PXP")
        assertEquals(2, entries.size)
        assertNotEquals(entries[0].key, entries[1].key)
    }

    @Test
    fun `laesst eine kaputte Zeile die anderen nicht beschaedigen`() {
        val entries = parseEntries("kaputt!!!\nJBSWY3DPEHPK3PXP")
        assertTrue(entries[0] is ParsedEntry.Failed)
        assertTrue(entries[1] is ParsedEntry.Ok)
    }

    @Test
    fun `liefert fuer leeren Text eine leere Liste`() {
        assertEquals(emptyList<ParsedEntry>(), parseEntries(""))
        assertEquals(emptyList<ParsedEntry>(), parseEntries("\n\n  \n# nur ein Kommentar\n"))
    }
}
