package io.github.keco216.clockwork.core

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Portiert aus `src/lib/format.test.ts`.
 *
 * Die dortigen Bloecke zu `describeParameters` und `describeIdentity` fehlen
 * hier, weil die beiden Funktionen fehlen — sie erzeugen deutschen Text und
 * werden auch im Web von der App nicht mehr benutzt. Begruendung im Kopf von
 * Format.kt.
 */
class FormatTest {

    @Test
    fun `groupDigits teilt sechs Ziffern in zwei Dreierbloecke`() {
        assertEquals("123 456", groupDigits("123456"))
    }

    @Test
    fun `groupDigits gibt bei ungerader Laenge dem vorderen Block die Extraziffer`() {
        assertEquals("1234 567", groupDigits("1234567"))
    }

    @Test
    fun `groupDigits teilt acht Ziffern in zwei Viererbloecke`() {
        assertEquals("1234 5678", groupDigits("12345678"))
    }

    @Test
    fun `groupDigits laesst sehr kurze Codes unangetastet`() {
        assertEquals("1234", groupDigits("1234"))
        assertEquals("", groupDigits(""))
    }

    @Test
    fun `groupDigits behaelt fuehrende Nullen`() {
        assertEquals("000 042", groupDigits("000042"))
    }

    @Test
    fun `truncateForDisplay laesst kurze Texte in Ruhe`() {
        assertEquals("kurz", truncateForDisplay("kurz"))
    }

    @Test
    fun `truncateForDisplay kuerzt in der Mitte`() {
        // 21 Zeichen = 10 vom Anfang + Auslassungszeichen + 10 vom Ende.
        val result = truncateForDisplay("A".repeat(30) + "B".repeat(30), 21)
        assertEquals("A".repeat(10) + "…" + "B".repeat(10), result)
        assertEquals(21, result.length)
    }

    @Test
    fun `truncateForDisplay kuerzt bei ungerader Restlaenge den vorderen Teil laenger`() {
        // 20 Zeichen = 10 vom Anfang + Auslassungszeichen + 9 vom Ende.
        val result = truncateForDisplay("A".repeat(30) + "B".repeat(30), 20)
        assertEquals("A".repeat(10) + "…" + "B".repeat(9), result)
    }
}
