package io.github.keco216.clockwork.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Die Zeitschaltung, ohne Geraet.
 *
 * ── Warum dieser Test der Kern des N19-Fixes ist ──────────────────────────
 * Der Fehler war nicht sichtbar und nicht schnell nachstellbar: Er zeigt sich
 * erst, wenn ein Geraet WIRKLICH schlaeft, und das dauert am Schreibtisch
 * Minuten bis Stunden. Genau deshalb ist die Rechnung aus dem Controller
 * herausgezogen und bekommt ihre Uhr als Parameter — hier vergehen drei
 * Stunden Tiefschlaf in einer Zuweisung.
 *
 * Die Uhr zaehlt in Millisekunden seit dem Start des Geraets, so wie
 * `SystemClock.elapsedRealtime()`. Sie wird von Hand weitergeschoben.
 */
class IdleWindowTest {

    /** Die Zeitquelle, die der Test steuert. */
    private var now = 1_000L
    private val window = IdleWindow { now }

    private val fiveMinutes = 300_000L

    @Test
    fun `ohne Aufsperren laeuft keine Frist`() {
        assertFalse(window.armed)
        assertFalse(window.isExpired(fiveMinutes))
        // Ohne Frist ist die volle Zeit uebrig — ein Wecker, der daraus
        // gestellt wird, klingelt zu frueh und nicht zu spaet.
        assertEquals(fiveMinutes, window.remainingMs(fiveMinutes))
    }

    @Test
    fun `laeuft nach genau der eingestellten Zeit ab, keine Sekunde frueher`() {
        window.markActive()

        now += fiveMinutes - 1
        assertFalse("eine Millisekunde davor", window.isExpired(fiveMinutes))
        assertEquals(1L, window.remainingMs(fiveMinutes))

        now += 1
        assertTrue("genau auf der Grenze", window.isExpired(fiveMinutes))
        assertEquals(0L, window.remainingMs(fiveMinutes))
    }

    @Test
    fun `jede Beruehrung setzt die Frist zurueck`() {
        window.markActive()
        now += 290_000
        window.markActive() // getippt, kurz vor Schluss

        now += 290_000
        assertFalse("die zweite Beruehrung zaehlt", window.isExpired(fiveMinutes))
        assertEquals(10_000L, window.remainingMs(fiveMinutes))
    }

    @Test
    fun `der Tiefschlaf zaehlt mit — das ist der ganze Punkt von N19`() {
        // Der Fall, der vorher durchgerutscht ist: Der Wecker der Coroutine
        // haengt an einer monotonen Uhr und hat in diesen drei Stunden NICHTS
        // mitbekommen. `elapsedRealtime` hat sie mitgezaehlt, und diese
        // Rechnung rechnet mit ihr.
        window.markActive()

        val dreiStunden = 3 * 60 * 60 * 1000L
        now += dreiStunden

        assertTrue(window.isExpired(fiveMinutes))
        assertEquals(0L, window.remainingMs(fiveMinutes))
    }

    @Test
    fun `nach dem Zusperren laeuft nichts mehr`() {
        window.markActive()
        window.stop()

        now += 10 * 60 * 1000L
        assertFalse(window.armed)
        assertFalse("ein zugesperrter Tresor hat keine Frist", window.isExpired(fiveMinutes))
    }

    @Test
    fun `eine rueckwaerts laufende Uhr sperrt zu, statt offen zu lassen`() {
        // `elapsedRealtime` kann das nicht — wer diese Klasse mit einer
        // anderen Uhr benutzt, hat sich vertan. Die sichere Richtung ist die
        // geschlossene, und die Rechnung darf dabei nicht ueberlaufen:
        // `remainingMs` liefert 0 und keine riesige Restzeit.
        window.markActive()
        now -= 5_000

        assertTrue(window.isExpired(fiveMinutes))
        assertEquals(0L, window.remainingMs(fiveMinutes))
    }

    @Test
    fun `die drei Stufen des Auswahlfelds rechnen alle richtig`() {
        for (timeout in LockSettingsTimeouts) {
            now = 1_000L
            window.markActive()

            now += timeout - 1
            assertFalse("$timeout ms: eine Millisekunde davor", window.isExpired(timeout))

            now += 1
            assertTrue("$timeout ms: auf der Grenze", window.isExpired(timeout))
        }
    }

    private companion object {
        /**
         * Die Werte aus `LockSettings.TIMEOUT_CHOICES`, hier von Hand
         * wiederholt: `core/` kennt `store/` nicht, und diese Richtung soll
         * es auch nicht — die Abhaengigkeit laeuft andersherum.
         */
        val LockSettingsTimeouts = listOf(60_000L, 300_000L, 900_000L)
    }
}
