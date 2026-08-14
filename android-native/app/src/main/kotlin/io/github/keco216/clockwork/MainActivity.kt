package io.github.keco216.clockwork

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
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
        /* ── Der Start-Bildschirm (N15) ──────────────────────────────────────
           Als ERSTE Zeile, vor `super.onCreate` — der Aufruf schaltet das
           Fenster vom Start-Thema auf `Theme.Clockwork` um
           (`postSplashScreenTheme`), und AppCompatActivity prueft das Thema in
           `super.onCreate`. In der anderen Reihenfolge stuende dort noch das
           Splash-Thema.

           ── Was hier ABSICHTLICH fehlt ─────────────────────────────────────
           `setKeepOnScreenCondition`. Damit liesse sich der Splash halten, bis
           die App „fertig" ist — und genau das waere hier falsch: Diese App hat
           nichts zu laden. Sie liest keine Netzdaten und keine Datenbank; ihr
           Tresor liegt in einer Datei von wenigen hundert Byte. Einen
           Startbildschirm laenger stehen zu lassen, als der Start dauert, ist
           eine Wartezeit, die man ERFINDET. Das ist die haptische Fassung der
           Hausregel „Tippen darf nicht warten".

           Auch kein `setOnExitAnimationListener`: Der Uebergang, den die
           Plattform selbst faehrt, ist derselbe wie in jeder anderen App des
           Geraets. Ein eigener waere eine Bewegung, die nur diese App kennt. */
        installSplashScreen()

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
