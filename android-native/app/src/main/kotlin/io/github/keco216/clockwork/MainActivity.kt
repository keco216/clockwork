package io.github.keco216.clockwork

import android.os.Bundle
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
        super.onCreate(savedInstanceState)
        setContent {
            ClockworkTheme { ClockworkApp() }
        }
    }
}
