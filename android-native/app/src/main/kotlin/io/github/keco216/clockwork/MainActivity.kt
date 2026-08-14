package io.github.keco216.clockwork

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import io.github.keco216.clockwork.ui.ClockworkApp
import io.github.keco216.clockwork.ui.theme.ClockworkTheme

/**
 * Die einzige Activity der App.
 *
 * Kein Fragment, kein Navigations-Framework, keine zweite Activity: Die
 * Web-Fassung hat genau EINE Buehne mit zwei Zustaenden (`data-stage`
 * vacant/working), und die native Fassung bildet dieselbe Struktur ab. Ein
 * Navigationsgraph fuer eine Seite waere Apparat ohne Aufgabe.
 *
 * `AppCompatActivity` statt `ComponentActivity` hat genau einen Grund: Ab API
 * 33 traegt der LocaleManager der Plattform die per-App-Sprachwahl, DARUNTER
 * traegt sie AppCompat — und minSdk ist 26. Das Compose-`setContent`
 * funktioniert unveraendert, AppCompatActivity ist ueber FragmentActivity
 * selbst eine ComponentActivity.
 */
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        /* Randlos wie die Web-Fassung unter `viewport-fit=cover`. Die Fugen zu
           den Systemleisten setzt danach `systemBarsPadding()` — dieselbe
           Rolle wie `env(safe-area-inset-*)` im CSS, und dieselbe Falle: Sie
           oben zu vergessen legte in V6 den klebenden Kopf unter die
           Statusleiste. */
        enableEdgeToEdge()

        /* FLAG_SECURE, bevor irgendetwas gezeichnet wird.

           Die Einstellung wird erst in der Komposition gelesen (aus
           `lock-settings.json`), und bis dahin waere das Fenster ungeschuetzt
           — eine Vorschau in der Zuletzt-verwendet-Ansicht entsteht schon beim
           ersten Bild. Deshalb hier die sichere Seite zuerst; wer die Sperre
           abgeschaltet hat, bekommt sie einen Wimpernschlag spaeter wieder
           weg. Der umgekehrte Fehler waere teurer.

           Der Abschalter existiert, weil FLAG_SECURE auch `adb shell
           screencap` sperrt — ohne ihn gaebe es keine Abnahmebilder. */
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)

        super.onCreate(savedInstanceState)
        setContent {
            ClockworkTheme { ClockworkApp() }
        }
    }
}
