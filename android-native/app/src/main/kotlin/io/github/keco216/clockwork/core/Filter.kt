package io.github.keco216.clockwork.core

import java.text.Normalizer

/**
 * Wonach der Filter auf der Buehne sucht — Port von `src/ui/filter.ts`.
 *
 * Eigene Datei und in `core/`, aus demselben Grund wie im Web: So laesst sie
 * sich pruefen. Sie kennt kein Compose, keine Uhr und keine Ressource — sie
 * bekommt einen Eintrag und gibt eine Zeichenkette zurueck.
 *
 * ── Was NICHT durchsucht wird ─────────────────────────────────────────────
 * Der Code. Er aendert sich alle dreissig Sekunden, und ein Filter, dessen
 * Treffer mit der Uhr wandern, ist kein Filter — man tippt „123", bekommt drei
 * Zeilen, und beim naechsten Blick sind es andere drei.
 *
 * Das Secret. Es ist kein Suchbegriff. Wer danach sucht, sucht nach etwas, das
 * er nicht sehen koennen soll.
 */

/** Kombinierende Zeichen — alles, was in NFD hinter einem Grundbuchstaben steht. */
private val COMBINING = Regex("[\\u0300-\\u036f]")

/**
 * Beide Seiten des Vergleichs auf dieselbe Form bringen.
 *
 * ── Warum nicht einfach `lowercase()` allein ──────────────────────────────
 * Weil Kontonamen selten aus dem ASCII-Bereich stammen. Wer „Mueller" als
 * „Müller" gespeichert hat und „muller" tippt, meint dasselbe Konto; wer „Zoë"
 * tippt, ebenso. Ein Filter ueber Eigennamen, der auf einem Akzent besteht,
 * ist in der Haelfte Europas unbrauchbar.
 *
 * ── Warum `lowercase()` OHNE Locale ───────────────────────────────────────
 * Kotlins parameterloses `lowercase()` nimmt `Locale.ROOT` — und genau das ist
 * hier richtig. Ein Kontoname ist Nutzerdatum und hat mit der eingestellten
 * Oberflaechensprache nichts zu tun: Ein Deutscher kann ein tuerkisches Konto
 * haben. Mit tuerkischem Locale wuerde aus „I" ein „ı", und „istanbul" faende
 * „İSTANBUL" nicht mehr.
 *
 * Im Web war genau das ein gemessener Irrtum: `toLocaleLowerCase()` ohne
 * Sprachangabe nimmt die Sprache des SYSTEMS. Die Falle ist auf beiden Seiten
 * dieselbe, nur heisst sie in Kotlin `lowercase(Locale.getDefault())`.
 *
 * Die Zerlegung nach NFD und das Wegwerfen der kombinierenden Zeichen loest
 * beides auf einmal: „İ" zerfaellt in „I" und einen Punkt, der Punkt faellt
 * weg, uebrig bleibt „i". Genau dasselbe passiert mit „ü", „é" und „å".
 *
 * Was das NICHT loest und auch nicht soll: „ß" und „ı" zerfallen nicht — sie
 * sind eigene Buchstaben, keine Buchstaben mit Zeichen darauf.
 */
private fun fold(text: String): String =
    COMBINING.replace(Normalizer.normalize(text, Normalizer.Form.NFD), "").lowercase()

/**
 * Der vorbereitete Suchtext eines Eintrags — einmal je Kanalzug gefaltet, nicht
 * bei jedem Tastendruck ueber die ganze Liste.
 *
 * Bei einer unlesbaren Zeile sind es die Zeile selbst und ihre Fehlermeldung:
 * Wer in einer langen Liste den Fehler sucht, sucht nach dem, was er getippt
 * hat.
 *
 * ── Eine Abweichung vom Web, die die Architektur erzwingt ─────────────────
 * Im Web traegt ein gescheiterter Eintrag den fertigen Satz. Hier traegt er
 * einen SCHLUESSEL (siehe Errors.kt) — `core/` kennt keine Ressourcen und soll
 * auch keine kennen. Die Oberflaeche hat den uebersetzten Satz ohnehin, weil
 * sie ihn anzeigt, und reicht ihn herein. Wer `null` uebergibt, sucht nur in
 * der Zeile selbst; das ist kein Fehler, sondern der Fall „Meldung noch nicht
 * aufgeloest".
 */
fun describeForSearch(entry: ParsedEntry, message: String? = null): String {
    val parts = when (entry) {
        is ParsedEntry.Ok -> listOf(entry.account.issuer, entry.account.accountName)
        is ParsedEntry.Failed -> listOf(entry.source, message)
    }
    return fold(parts.filterNotNull().filter { it.isNotEmpty() }.joinToString(" "))
}

/**
 * Passt ein vorbereiteter Suchtext zur Eingabe?
 *
 * Eine leere Eingabe passt auf alles — sonst muesste jede aufrufende Stelle den
 * Sonderfall selbst kennen, und eine davon vergaesse ihn.
 *
 * Enthalten statt „beginnt mit": Konten heissen „ACME Co" und „Hetzner Cloud";
 * wer „cloud" tippt, meint das zweite.
 */
fun matchesFilter(haystack: String, needle: String): Boolean {
    val folded = fold(needle.trim())
    return folded.isEmpty() || haystack.contains(folded)
}
