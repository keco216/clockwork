package io.github.keco216.clockwork.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Der Filter — dieselben Faelle wie `src/ui/filter.test.ts`.
 *
 * Die Faltung ist der interessante Teil: Sie soll Buchstaben mit Zeichen
 * DARAUF zusammenfuehren und eigene Buchstaben eigene bleiben lassen. Beides
 * steht unten als Probe und Gegenprobe.
 */
class FilterTest {

    private fun account(
        issuer: String? = null,
        name: String? = null,
        secret: String = "JBSWY3DPEHPK3PXP",
    ): ParsedEntry.Ok = parseEntries(
        buildString {
            if (issuer != null || name != null) {
                append(listOfNotNull(issuer, name).joinToString(" "))
                append(": ")
            }
            append(secret)
        },
    ).filterIsInstance<ParsedEntry.Ok>().first()

    /* ── describeForSearch ─────────────────────────────────────────────── */

    @Test
    fun `nimmt Aussteller und Kontonamen`() {
        val entry = parseEntries("otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co")
            .filterIsInstance<ParsedEntry.Ok>()
            .first()
        val text = describeForSearch(entry)

        assertTrue(text.contains("acme co"))
        assertTrue(text.contains("kevin@example.com"))
    }

    @Test
    fun `nimmt das Secret NICHT auf`() {
        // Wer danach sucht, sucht nach etwas, das er nicht sehen koennen soll.
        val entry = account(issuer = "GitHub")
        val text = describeForSearch(entry)

        assertFalse(text.contains("jbswy"))
    }

    @Test
    fun `nimmt bei einer unlesbaren Zeile die Zeile selbst`() {
        val entry = parseEntries("JBSW0Y3DPEHPK3PXP")
            .filterIsInstance<ParsedEntry.Failed>()
            .first()

        assertTrue(describeForSearch(entry).contains("jbsw0y3dpehpk3pxp"))
    }

    @Test
    fun `nimmt bei einer unlesbaren Zeile auch die uebersetzte Meldung`() {
        // Die Abweichung vom Web: Der Satz kommt von aussen herein, weil
        // `core/` keine Ressourcen kennt.
        val entry = parseEntries("JBSW0Y3DPEHPK3PXP")
            .filterIsInstance<ParsedEntry.Failed>()
            .first()

        assertTrue(describeForSearch(entry, "Ungueltiges Zeichen").contains("ungueltiges zeichen"))
    }

    @Test
    fun `kommt ohne Kontonamen aus`() {
        val text = describeForSearch(account())
        assertFalse(text.contains("null"))
        assertEquals("", text)
    }

    /* ── matchesFilter ─────────────────────────────────────────────────── */

    private val haystack = describeForSearch(account(issuer = "Hetzner Cloud"))

    @Test
    fun `findet einen Teil in der Mitte`() {
        // Enthalten statt „beginnt mit": Wer „cloud" tippt, meint dieses Konto.
        assertTrue(matchesFilter(haystack, "cloud"))
    }

    @Test
    fun `ignoriert Gross- und Kleinschreibung und Leerraum am Rand`() {
        assertTrue(matchesFilter(haystack, "  HETZNER "))
    }

    @Test
    fun `laesst bei leerer Eingabe alles durch`() {
        assertTrue(matchesFilter(haystack, ""))
        assertTrue(matchesFilter(haystack, "   "))
    }

    @Test
    fun `meldet einen Fehlschlag als Fehlschlag`() {
        assertFalse(matchesFilter(haystack, "gibt-es-nicht"))
    }

    @Test
    fun `findet auch bei tuerkischem I`() {
        // Der Fall, der `lowercase(Locale.getDefault())` zerlegt haette.
        val turkish = describeForSearch(account(issuer = "İSTANBUL"))
        assertTrue(matchesFilter(turkish, "istanbul"))
    }

    @Test
    fun `findet Umlaute auch ohne Umlaut — und umgekehrt`() {
        val umlaut = describeForSearch(account(issuer = "Müller"))
        assertTrue(matchesFilter(umlaut, "muller"))
        assertTrue(matchesFilter(umlaut, "müller"))
    }

    @Test
    fun `laesst eigene Buchstaben eigene Buchstaben bleiben`() {
        // Die Gegenprobe zur Faltung: „ß" ist kein „s" mit einem Zeichen
        // darauf, also darf „strasse" hier NICHT treffen. Ohne diese Zeile
        // waere „faltet Diakritika weg" von „faltet alles weg" nicht zu
        // unterscheiden.
        val sharp = describeForSearch(account(issuer = "Straße"))
        assertTrue(matchesFilter(sharp, "straße"))
        assertFalse(matchesFilter(sharp, "strasse"))
    }
}
