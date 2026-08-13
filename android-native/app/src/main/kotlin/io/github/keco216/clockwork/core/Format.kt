package io.github.keco216.clockwork.core

import kotlin.math.ceil
import kotlin.math.floor

/**
 * Reine Darstellungs-Helfer — ohne Android-Import, damit sie testbar bleiben.
 *
 * ── Zwei Funktionen aus format.ts fehlen hier, und zwar absichtlich ────────
 * Die Web-Fassung hat zusaetzlich `describeParameters` ("SHA-1 - 6 Stellen -
 * 30 s") und `describeIdentity` ("Konto 3"). Beide erzeugen DEUTSCHEN TEXT.
 *
 * Im Web stehen sie noch da, weil `src/lib/` byte-identisch eingefroren ist —
 * die App BENUTZT sie seit V3 nicht mehr, die Parameterzeile und der
 * Kontoname-Rueckfall entstehen uebersetzt in `ui/strip.ts`. Sie sind also
 * keine Vorlage, sondern ein Rest, den nur die Einfrier-Regel am Leben haelt.
 *
 * Ein Port muesste sie mitschleppen, ohne sie zu benutzen — und wuerde dabei
 * gegen die Regel "kein Text in `core/`" verstossen. Deshalb bleiben sie weg;
 * die Oberflaeche setzt beide Zeilen aus Ressourcen zusammen, so wie die
 * Web-Oberflaeche es auch tut. Portiert ist damit, was die App wirklich
 * braucht — und was in jeder Sprache dasselbe bedeutet.
 */

/**
 * Gruppiert einen Code in zwei Bloecke: "123456" -> "123 456".
 *
 * WARUM? Sieben plus/minus zwei — Ziffernbloecke von drei bis vier Zeichen
 * kann man auf einen Blick erfassen und fehlerfrei abtippen; sechs Ziffern am
 * Stueck muss man zaehlen. Bei ungerader Laenge bekommt der vordere Block die
 * Extraziffer (7 -> "1234 567"), weil man von links liest.
 *
 * Achtung: Das ist NUR fuer die Anzeige. Kopiert wird immer der rohe Code.
 */
fun groupDigits(code: String): String {
    if (code.length <= 4) return code
    val split = ceil(code.length / 2.0).toInt()
    return "${code.substring(0, split)} ${code.substring(split)}"
}

/**
 * Kuerzt eine Eingabezeile fuer die Anzeige auf einer Fehlerkarte.
 *
 * Bei einem Tippfehler im Secret hilft es, die Zeile zu sehen — aber die ganze
 * Zeile stehen zu lassen waere unschoen (lange URIs) und unnoetig: Fuer die
 * Fehlersuche reichen Anfang und Ende.
 */
fun truncateForDisplay(text: String, maxLength: Int = 48): String {
    if (text.length <= maxLength) return text
    val head = ceil((maxLength - 1) / 2.0).toInt()
    val tail = floor((maxLength - 1) / 2.0).toInt()
    return "${text.substring(0, head)}…${text.substring(text.length - tail)}"
}
