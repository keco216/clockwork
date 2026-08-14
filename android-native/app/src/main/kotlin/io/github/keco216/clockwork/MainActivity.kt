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

        /* ── Tapjacking: hier steht ABSICHTLICH nichts (F4, N20) ─────────────
           Der Angriff: Eine fremde App legt ein durchsichtiges Fenster ueber
           unseres und faengt die Tipps ab, die der Nutzer fuer den
           Aufsperren-Knopf haelt. Drei Wege wurden geprueft, keiner ist
           eigenmaechtig zu gehen:

           1. `Window.setHideOverlayWindows(true)` (ab API 31) blendet fremde
              Overlays aus, solange unser Fenster sichtbar ist — und verlangt
              dafuer `android.permission.HIDE_OVERLAY_WINDOWS`. Gemessen: Ohne
              sie faellt `lintRelease` mit „Missing permissions required by
              Window.setHideOverlayWindows" aus. Die Berechtigung ist
              „normal", wird also beim Installieren erteilt und fragt nichts —
              aber sie steht danach im Berechtigungsblock von F-Droid und
              Play, und „CAMERA ist die einzige erfragte Berechtigung" ist
              eine Zusage dieses Projekts nach aussen. Das ist Kevins
              Entscheidung, nicht meine.
           2. `View.filterTouchesWhenObscured` auf der Wurzel braucht keine
              Berechtigung und wirkt ab API 26 — verwirft aber Beruehrungen,
              sobald IRGENDEIN Fenster ueberlagert: Blaulichtfilter,
              Bildschirmlupe, Samsungs eigene Einblendungen. Ein
              Authenticator, der sich unter einem Nachtmodus nicht mehr
              antippen laesst, ist schlimmer als die Luecke.
           3. Dasselbe nur auf den sicherheitsrelevanten Tasten waere Kevins
              Vorschlag und ginge in Compose nicht ohne eigenes View-Geruest —
              die Flagge sitzt an einer View, und hier gibt es genau eine.

           Was den Fall entschaerft, und zwar ohne unser Zutun: Seit Android 12
           blockiert die Plattform SELBST Beruehrungen, die durch nicht
           vertrauenswuerdige Overlays hindurchgehen. Genau ab der Fassung, ab
           der auch Weg 1 erst gaebe. Offen bleibt damit API 26 bis 30 — und
           dort hilft nur Weg 2 mit seinem Preis. */

        super.onCreate(savedInstanceState)
        setContent {
            ClockworkTheme { ClockworkApp() }
        }

        /* ── Autofill: gemessen, versucht, NICHT geloest (N20, Folgeposten) ──
           Am S24 gemessen: Ein Tipp ins Secret-Feld loest eine Autofill-Anfrage
           aus, und `dumpsys autofill` nennt den Empfaenger beim Namen —
           `s=com.samsung.android.samsungpassautofill … b=Rect(180,1807-1260,2055)`,
           also genau die Grenzen des Feldes, dazu eine „augmented" Anfrage an
           `com.samsung.android.smartsuggestions`.

           Das ist die falsche Richtung fuer jedes Feld dieser App: Das
           Secret-Feld haelt Schluesselmaterial, das Passphrasenfeld die
           Passphrase, und ein Autofill-Dienst ist eine fremde App.

           Hier stand kurzzeitig
           `window.decorView.importantForAutofill = …NO_EXCLUDE_DESCENDANTS`.
           Es ist wieder heraus, weil es GEMESSEN nichts geaendert hat: nach
           dem Einbau kam dieselbe Anfrage erneut. Der Grund liegt eine Ebene
           tiefer — Compose meldet seine Felder ueber VIRTUELLE View-Ids
           (`i=1073741824:i110` im Protokoll) selbst an, und die Wichtigkeits-
           Regel der View-Hierarchie greift dort nicht.

           Eine Zeile, die aussieht wie ein Schutz und keiner ist, ist
           schlimmer als keine. Der Weg fuehrt ueber die Compose-Semantik und
           braucht eine eigene Runde samt Gegenmessung. */
    }
}
