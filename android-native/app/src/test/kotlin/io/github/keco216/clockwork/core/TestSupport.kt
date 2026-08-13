package io.github.keco216.clockwork.core

import org.junit.Assert.assertEquals
import org.junit.Assert.fail

/**
 * Zwei Helfer fuer alle Kern-Tests.
 *
 * Der Grund, warum sie ueberhaupt existieren: Der Port wirft SCHLUESSEL statt
 * Saetzen (siehe Errors.kt). Die Web-Tests pruefen darum haeufig mit einem
 * Regex auf die deutsche Meldung (`toThrow(/»0«/)`); hier wird stattdessen der
 * Schluessel samt Parametern geprueft — genauer und sprachfrei.
 */

/** Faengt den erwarteten Fehler ab und gibt ihn zur genauen Pruefung zurueck. */
fun capture(block: () -> Unit): ClockworkError {
    try {
        block()
    } catch (error: ClockworkError) {
        return error
    }
    fail("Erwartet wurde ein ClockworkError, es wurde keiner geworfen.")
    error("unerreichbar")
}

/** Prueft, dass ein Aufruf mit genau diesem i18n-Schluessel scheitert. */
fun assertKey(expectedKey: String, hint: String = "", block: () -> Unit) {
    val error = capture(block)
    assertEquals(if (hint.isEmpty()) "Schluessel" else "Schluessel fuer \"$hint\"", expectedKey, error.key)
}
