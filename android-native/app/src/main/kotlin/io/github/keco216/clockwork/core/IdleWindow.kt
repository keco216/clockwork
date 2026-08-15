package io.github.keco216.clockwork.core

/**
 * Die Frist der Zeitschaltung — die RECHNUNG, nicht der Wecker.
 *
 * ── Der Fehler, wegen dem es diese Klasse gibt (N19) ──────────────────────
 * Bis N17 war die Zeitschaltung EIN `delay(timeoutMs)` in einer Coroutine.
 * Das sieht richtig aus und ist es nicht: Die Verzoegerung von
 * `kotlinx.coroutines` haengt an einer MONOTONEN Uhr (`System.nanoTime`
 * bzw. `Handler.postDelayed` auf `SystemClock.uptimeMillis`), und die steht
 * still, sobald das Geraet wirklich schlaeft. Ein Telefon, das drei Stunden
 * in der Tasche liegt, hat davon fuer die Frist nur die Wachzeiten vergehen
 * lassen.
 *
 * Damit hielt eine SICHERHEITSZUSAGE der Oberflaeche nicht: „Sperrt
 * automatisch nach 5 Minuten" ist kein Komfortversprechen, sondern die
 * Begruendung dafuer, dass man den Tresor ueberhaupt offen stehen lassen
 * darf.
 *
 * ── Die richtige Uhr ──────────────────────────────────────────────────────
 * `SystemClock.elapsedRealtime()` zaehlt seit dem Start des Geraets und
 * LAEUFT im Tiefschlaf weiter (CLOCK_BOOTTIME); `uptimeMillis` tut es nicht
 * (CLOCK_MONOTONIC). Genau diese zwei Uhren gehen auseinander, und die
 * Differenz IST die verschlafene Zeit.
 *
 * Bewusst NICHT die Wanduhr (`System.currentTimeMillis`): Die kann der
 * Nutzer stellen, und eine Frist, die man durch Zurueckdrehen der Uhr
 * verlaengert, ist keine.
 *
 * ── Warum die Rechnung hier steht und nicht im Controller ─────────────────
 * Weil sie so ohne Geraet pruefbar ist. Die Zeitquelle ist ein Parameter,
 * der Test schiebt sie von Hand weiter — damit laesst sich ein Tiefschlaf
 * von drei Stunden in einer Millisekunde nachstellen. Am Geraet ist genau
 * das die teure Messung (siehe docs/abnahme, N19).
 *
 * `core/` bleibt dabei androidfrei: Diese Klasse kennt `SystemClock` nicht,
 * sie bekommt eine Funktion. Wer sie einsetzt, entscheidet ueber die Uhr.
 */
class IdleWindow(private val now: () -> Long) {

    /** Wann zuletzt etwas passiert ist. `null` heisst „die Frist laeuft nicht". */
    private var lastActive: Long? = null

    /** Ob ueberhaupt eine Frist laeuft. */
    val armed: Boolean
        get() = lastActive != null

    /** Setzt die Frist zurueck — Aufsperren, Tippen, Antippen. */
    fun markActive() {
        lastActive = now()
    }

    /** Beendet die Frist. Nach dem Zusperren gibt es nichts mehr zu bewachen. */
    fun stop() {
        lastActive = null
    }

    /**
     * Ist die Frist abgelaufen?
     *
     * Der Sonderfall steht ausdruecklich da: Eine Zeitquelle, die RUECKWAERTS
     * gelaufen ist, kann diese Klasse nicht erklaeren — `elapsedRealtime`
     * kann es nicht, und wer eine andere Uhr einsetzt, hat sich vertan. In
     * dem Fall wird gesperrt und nicht offen gelassen: Bei einer Frist, die
     * ein Geheimnis bewacht, ist die sichere Richtung die geschlossene.
     */
    fun isExpired(timeoutMs: Long): Boolean {
        val start = lastActive ?: return false
        val since = now() - start
        return since < 0 || since >= timeoutMs
    }

    /**
     * Wie lange die Frist noch laeuft, in Millisekunden. `0` heisst
     * „abgelaufen".
     *
     * Das ist der Wert, mit dem der Wecker gestellt wird — und zwar bei JEDEM
     * Aufwachen neu. Ein Wecker, der einmal auf die volle Frist gestellt wird
     * und danach nie wieder nachrechnet, ist genau der Fehler von oben.
     *
     * Ohne laufende Frist kommt die volle Zeit zurueck; ein Aufrufer, der
     * daraus einen Wecker stellt, hat vorher [markActive] vergessen, und ein
     * zu FRUEH klingelnder Wecker ist harmlos — die Wahrheit sagt ohnehin
     * [isExpired].
     */
    fun remainingMs(timeoutMs: Long): Long {
        val start = lastActive ?: return timeoutMs
        val since = now() - start
        if (since < 0) return 0
        return (timeoutMs - since).coerceAtLeast(0L)
    }
}
