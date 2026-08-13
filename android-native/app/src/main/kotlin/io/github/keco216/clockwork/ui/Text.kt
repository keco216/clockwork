package io.github.keco216.clockwork.ui

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.platform.LocalContext
import io.github.keco216.clockwork.core.KEY_UNREADABLE
import java.text.NumberFormat
import java.util.Locale

/**
 * Der Zugang zu den Texten — das Gegenstueck zu `t()` und `tn()` im Web.
 *
 * ── Warum es diesen Umweg ueberhaupt gibt ─────────────────────────────────
 * Fuer feste Texte ruft die Oberflaeche `stringResource(R.string.key_copy)`
 * auf, und damit ist alles gesagt. Zwei Faelle gehen so aber nicht:
 *
 *   1. Der Kern wirft SCHLUESSEL (`err.base32.badChar`), keine Ressourcen-Ids.
 *      Welcher Text gilt, steht erst zur Laufzeit fest.
 *   2. Zahlen. Und die sind der eigentliche Grund fuer diese Datei.
 *
 * ── Die Ziffern bleiben lateinisch ────────────────────────────────────────
 * `NumberFormat.getInstance(Locale("ar"))` liefert ٦٠٠٬٠٠٠. Die Web-Fassung
 * erzwingt ueberall `-u-nu-latn` und hat dafuer einen harten Grund: Ein Code
 * wird in ein fremdes Anmeldefeld getippt und muss lateinisch sein; die
 * Zifferblattschrift Chivo Mono kennt ohnehin nur lateinische Ziffern, und
 * zwei Ziffernsysteme nebeneinander auf einem Messgeraet waeren ein
 * Ablesefehler mit Ansage.
 *
 * Dieselbe Regel hier: [formatNumber] setzt die Ziffern hart auf `latn` und
 * laesst nur die GRUPPIERUNG lokal (600,000 / 600.000 / 600 000). Deshalb
 * tragen auch alle generierten Platzhalter `%s` und nie `%d` — ein `%d` waere
 * genau die Stelle, an der Android die Ziffern der Sprache einsetzt.
 */

/**
 * Formatiert eine Zahl mit lokaler Gruppierung, aber lateinischen Ziffern.
 *
 * Der Unicode-Erweiterungsschluessel `-u-nu-latn` ist derselbe, den
 * `Intl.NumberFormat` im Web bekommt. `Locale.Builder` ist der Weg, ihn auf
 * der JVM zu setzen — ein `Locale("ar")` allein traegt ihn nicht.
 */
fun formatNumber(value: Long, locale: Locale): String {
    val latin = Locale.Builder().setLocale(locale).setUnicodeLocaleKeyword("nu", "latn").build()
    return NumberFormat.getInstance(latin).format(value)
}

@Composable
@ReadOnlyComposable
fun formatNumber(value: Long): String = formatNumber(value, currentLocale())

@Composable
@ReadOnlyComposable
private fun currentLocale(): Locale {
    val configuration = LocalContext.current.resources.configuration
    return configuration.locales[0] ?: Locale.getDefault()
}

/**
 * Schlaegt einen i18n-Schluessel samt Parametern nach.
 *
 * Unbekannte Schluessel werden NICHT durchgereicht, sondern durch die neutrale
 * Auffangmeldung ersetzt — dieselbe Entscheidung wie `translateLibMessage` im
 * Web: lieber ungenau in der richtigen Sprache als genau in der falschen.
 */
fun Context.text(key: String, args: Map<String, String> = emptyMap()): String {
    val resource = StringKeys.resourceFor(key)
        ?: return getString(StringKeys.resourceFor(KEY_UNREADABLE)!!)

    val order = StringKeys.placeholdersFor(key)
    if (order.isEmpty()) return getString(resource)

    // Die Reihenfolge stammt aus der Basissprache und ist in allen 37 Sprachen
    // dieselbe — der Generator hat sie beim Schreiben eingesetzt. Ein
    // fehlender Wert wird zur leeren Zeichenkette statt zu einem Absturz:
    // Eine Fehlermeldung, die beim Anzeigen selbst scheitert, ist die
    // schlechteste aller Auskuenfte.
    val values = order.map { args[it] ?: "" }.toTypedArray()
    return getString(resource, *values)
}

@Composable
@ReadOnlyComposable
fun text(key: String, args: Map<String, String> = emptyMap()): String =
    LocalContext.current.text(key, args)

/**
 * Mehrzahl. `quantity` waehlt die Form, die Werte kommen getrennt herein —
 * deshalb kann die Zahl selbst als bereits formatierter Text uebergeben
 * werden und behaelt ihre lateinischen Ziffern.
 *
 * Auch als Context-Funktion, nicht nur als Composable: Die Scan-Rueckwege
 * (P6) bauen ihre Meldung in einem Callback zusammen, und dort gibt es keine
 * Komposition — dieselbe Lage wie bei [text].
 */
fun Context.textPlural(key: String, quantity: Int, args: Map<String, String> = emptyMap()): String {
    val resource = StringKeys.pluralFor(key) ?: return text(KEY_UNREADABLE)
    val order = StringKeys.placeholdersFor(key)
    val values = order.map { args[it] ?: "" }.toTypedArray()
    return resources.getQuantityString(resource, quantity, *values)
}

@Composable
@ReadOnlyComposable
fun textPlural(key: String, quantity: Int, args: Map<String, String> = emptyMap()): String =
    LocalContext.current.textPlural(key, quantity, args)

/** Der haeufigste Fall: „{n} Konten" mit lateinisch gesetzter Zahl. */
@Composable
@ReadOnlyComposable
fun textCount(key: String, count: Int): String =
    textPlural(key, count, mapOf("n" to formatNumber(count.toLong())))
