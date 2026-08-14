package io.github.keco216.clockwork.ui

import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.PersistableBundle
import android.view.WindowManager
import androidx.activity.compose.PredictiveBackHandler
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsTopHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.foundation.shape.RoundedCornerShape
import io.github.keco216.clockwork.ui.theme.Motion
import kotlin.math.roundToInt
import io.github.keco216.clockwork.core.ClockworkError
import io.github.keco216.clockwork.core.MigrationError
import io.github.keco216.clockwork.core.ParsedEntry
import io.github.keco216.clockwork.core.describeForSearch
import io.github.keco216.clockwork.core.generateTotpForCounter
import io.github.keco216.clockwork.core.isMigrationUri
import io.github.keco216.clockwork.core.matchesFilter
import io.github.keco216.clockwork.core.parseEntries
import io.github.keco216.clockwork.core.parseMigrationUri
import io.github.keco216.clockwork.core.periodProgress
import io.github.keco216.clockwork.core.timeCounter
import io.github.keco216.clockwork.store.WebViewImport
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collect
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.TextStyles

/**
 * Die eine Buehne mit zwei Zustaenden — das Gegenstueck zu `data-stage` im Web.
 *
 * ── Was den Zustand ausloest ──────────────────────────────────────────────
 * `entries.isEmpty()`, und ausdruecklich NICHT „kein gueltiger Eintrag": Eine
 * unlesbare Zeile IST etwas zu zeigen, und ihre Fehlermeldung ist ein
 * Kanalzug — der braucht die Arbeitsbuehne. Genau so steht es in `ui/app.ts`.
 *
 * ── Das Textfeld ist die Quelle der Wahrheit ──────────────────────────────
 * Es gibt kein verstecktes Datenmodell daneben. Eine Zeile IST ein Eintrag,
 * `parseEntries` macht daraus Konten oder Fehlerkarten. Das ist der Charakter
 * dieser App und der Grund, warum ein Import sichtbar bleibt.
 */
/** Ab so vielen Eintraegen erscheint die Filterzeile — wie im Web. */
private const val FILTER_FROM = 8

/**
 * Der Testschluessel aus RFC 4226 Anhang D: Base32 fuer `12345678901234567890`.
 *
 * Ein Literal in der Oberflaeche und trotzdem kein Verstoss gegen „kein Text in
 * ui/": Das ist kein UEBERSETZBARER Text, sondern ein dokumentierter
 * Testvektor. Die Web-Fassung haelt ihn aus demselben Grund als Literal in
 * `app.ts`.
 */
private const val TEST_KEY = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"

@Composable
fun ClockworkApp() {
    val colors = LocalColors.current
    val context = LocalContext.current
    val density = LocalDensity.current
    val scope = rememberCoroutineScope()
    val unixSeconds by rememberUnixSeconds()

    /* ── Das Textfeld: `remember` und AUSDRUECKLICH NICHT `rememberSaveable`
       ─────────────────────────────────────────────────────────────────────
       Bis P6 stand hier `rememberSaveable`, und das war ein Fehler. Gemessen
       am Emulator (P7): Testschluessel einfuegen, HOME, `am kill` — der
       Prozess ist weg (pidof = 0) —, App wieder oeffnen: Das Secret steht
       wieder im Feld.

       Der Weg dorthin ist der Instanzzustand der Activity. Den haelt das
       System fuer genau diesen Fall bereit, damit eine App nach einem
       Speichermangel-Kill dort weitermacht, wo sie war. Fuer ein Secret ist
       das die falsche Bequemlichkeit: Die Zusage dieser App lautet, dass
       ohne Tresor NICHTS gespeichert wird, und ein Zustand, den das System
       ueber den Prozesstod hinweg aufhebt, ist gespeichert — auch wenn die
       App die Datei nicht selbst schreibt.

       Der Preis ist gemessen null: `configChanges` im Manifest deckt
       Drehung, Schriftskala, Sprache, Dunkelmodus und Dichte ab, die
       Activity wird dafuer also gar nicht neu erstellt, und `remember`
       ueberlebt all das ohnehin. Verloren geht nur der Fall, den wir
       verlieren WOLLEN.

       Die Gegenprobe steht in android-native/docs/abnahme: derselbe Ablauf,
       einmal mit und einmal ohne diese Zeile. */
    var field by remember { mutableStateOf(TextFieldValue("")) }

    // Neu ausgewertet wird nur, wenn sich der TEXT geaendert hat — nicht bei
    // jedem Bild. Die Uhr tickt sechzigmal je Sekunde; `parseEntries` bei
    // jedem Tick laufen zu lassen hiesse, sechzigmal je Sekunde Base32 zu
    // decodieren.
    val entries = remember(field.text) { parseEntries(field.text) }
    val vacant = entries.isEmpty()

    /* ── Der Tresor ────────────────────────────────────────────────────────
       Der Zustandshalter lebt ueber Neuzeichnungen hinweg, weil die
       Zeitschaltung und die `onStop`-Sperre auch dann greifen muessen, wenn
       gerade niemand die Zone ansieht. */
    val vault = remember(context, scope) { VaultController(context.filesDir, scope) }
    LaunchedEffect(vault) {
        /* Die Uebernahme aus der WebView-Fassung laeuft VOR dem ersten Laden —
           sonst saehe der Tresor-Zustand einen Augenblick lang „aus", obwohl
           gleich ein Umschlag da ist, und der Aufklapper malte den falschen
           Zustand vor. Auf jeder Installation ausser der einen, die von 1.x
           kommt, kehrt der Aufruf sofort zurueck: Er sieht nach, ob es
           ueberhaupt WebView-Daten gibt, und tut sonst nichts. */
        WebViewImport(context).runIfNeeded()
        vault.load()
    }

    // Die zwei Lambdas werden bei JEDER Komposition frisch gesetzt: Ein
    // festgehaltenes `field` waere nach dem naechsten Tastendruck veraltet,
    // und der Tresor speicherte dann den vorletzten Stand.
    vault.readSecrets = { field.text }
    vault.writeSecrets = { text -> field = TextFieldValue(text, TextRange(text.length)) }

    var vaultOpen by rememberSaveable { mutableStateOf(false) }

    /* ── Sperren beim Verlassen der App ────────────────────────────────────
       Das native Gegenstueck zu `visibilitychange` im Web. `ON_STOP` und
       nicht `ON_PAUSE`: Pause kommt schon, wenn ein Dialog darueberliegt —
       etwa die Biometrie-Abfrage, die den Tresor gerade aufsperren soll. */
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner, vault) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_STOP) vault.onStopped()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    /* ── FLAG_SECURE ───────────────────────────────────────────────────────
       Voreinstellung AN — und zwar schon in `MainActivity.onCreate`, damit
       zwischen dem ersten Bild und dem Lesen der Einstellungen kein Fenster
       ohne Schutz liegt. Hier wird nur noch nachgezogen, was der Nutzer
       gewaehlt hat. */
    val activity = context.findActivity()
    LaunchedEffect(activity, vault.settings.blockScreenshots) {
        val window = activity?.window ?: return@LaunchedEffect
        if (vault.settings.blockScreenshots) {
            window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }

    // ── Der Zustand der Eingabe-Schublade ──────────────────────────────────
    // Voreinstellung ZU: Wer seine Codes will, soll nicht an der Bedienung
    // vorbeiscrollen. Die eine Ausnahme steht darunter.
    var inputOpen by rememberSaveable { mutableStateOf(false) }
    var fieldFocused by remember { mutableStateOf(false) }

    // „Offen bleibt der Editor beim Buehnenwechsel nur, wenn der Fokus darin
    // liegt" — die V10-Regel woertlich. Wer gerade das erste Secret tippt, dem
    // klappt nichts unter den Fingern zu; wer den Tresor aufsperrt, bekommt
    // die Codes obenan und die Eingabe zu.
    LaunchedEffect(vacant) {
        if (!vacant) inputOpen = fieldFocused
    }

    // ── Die Rueckmeldung zu Import und Scan ────────────────────────────────
    // Das Gegenstueck zu `setNote` in app.ts: eine Zeile, `polite`, und nach
    // 12 Sekunden von selbst wieder leer — eine Quittung, kein Dauerzustand.
    // Der Zaehler startet die Frist bei JEDER neuen Meldung neu, sonst
    // schnitte eine alte Frist die naechste Meldung ab.
    var note by remember { mutableStateOf("") }
    var noteStamp by remember { mutableStateOf(0) }

    fun setNote(message: String) {
        note = message
        noteStamp++
    }

    LaunchedEffect(noteStamp) {
        if (note.isNotEmpty()) {
            delay(12_000)
            note = ""
        }
    }

    /* ── QR-Import ─────────────────────────────────────────────────────────
       Kamera und Bilddatei enden beide hier. Der Inhalt eines QR-Codes ist
       Text aus einer fremden Quelle und wird deshalb wie eine getippte Zeile
       behandelt: angehaengt, expandiert, geparst, SICHTBAR — niemals legt ein
       Scan still Konten an. Wortgleich der Weg aus `ui/app.ts`. */
    fun handleScan(scanned: String) {
        val line = scanned.trim()
        val existing = field.text.trim()
        val joined = if (existing.isEmpty()) line else "$existing\n$line"

        val (expandedText, migrationNote) = expandMigrationLines(context, joined)
        field = TextFieldValue(expandedText, TextRange(expandedText.length))

        // Ein Sammel-Export meldet seine Bilanz (uebernommen/uebersprungen),
        // eine einzelne URI nur die Quittung.
        setNote(if (isMigrationUri(line)) migrationNote else context.text("scan.done"))
    }

    /* ── Der Kopf und das Scrollen ─────────────────────────────────────────
       EIN Scroll-Zustand fuer beide Buehnen: Der Kopf haengt daran, und zwei
       Zustaende hiessen zwei Wahrheiten darueber, wie weit die Seite gerollt
       ist. Die Kopfhoehe wird gemessen, nicht angenommen — sie haengt an der
       Schriftskala und an der Uebersetzung. */
    /* ── Die zwei Seiten (N11) ─────────────────────────────────────────────
       `rememberSaveable`: Die gewaehlte Seite ist keine Geheimnis-Sache, und
       sie soll eine Drehung ueberleben. Das Textfeld daneben traegt
       ausdruecklich `remember` — der Unterschied ist Absicht und in der
       langen Begruendung oben nachzulesen. */
    var page by rememberSaveable { mutableStateOf(Page.Home) }

    /* Jede Seite behaelt ihre eigene Scrollposition — sonst landete man auf
       der Einstellungen-Seite dort, wo die Startseite gerade stand. Der Kopf
       haengt an der Position der SICHTBAREN Seite. */
    val homeScroll = rememberScrollState()
    val settingsScroll = rememberScrollState()
    val scroll = if (page == Page.Settings) settingsScroll else homeScroll

    var mastheadHeight by remember { mutableIntStateOf(0) }

    /* ── Was die Leiste unten verdeckt, wird GEMESSEN (N13) ────────────────
       Bis N12 stand hier eine Konstante (`navOverlayHeight`), addiert aus
       Segmenthoehe, Polster und Abstand. Sie war richtig — solange die Leiste
       eine feste Hoehe hatte.

       Seit N13 kommt ihre Hoehe aus dem Inhalt: Zeichen, Beschriftung und
       deren Vorschub. Bei Schriftskala 1,5 waechst die Beschriftung, und mit
       ihr die Karte; eine Konstante haette dann zu wenig freigehalten, und die
       letzte Karte waere unter der Leiste steckengeblieben — genau der Fehler,
       den N12 fuer die Normalgroesse behoben hat.

       Gemessen wird deshalb dasselbe wie beim Kopf, mit demselben Werkzeug und
       aus demselben Grund. */
    var navHeight by remember { mutableIntStateOf(0) }

    val stowed = rememberStowed(scroll, mastheadHeight)
    val stow by animateFloatAsState(
        targetValue = if (stowed) 1f else 0f,
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "masthead-stow",
    )
    val topInset = with(density) { mastheadHeight.toDp() }

    /* ── Die Tastatur (N13) ────────────────────────────────────────────────
       Kevins Befund am gespiegelten Geraet: Beim Tippen liegt die Tastatur
       ueber der Buehne. Das Feld, in das man gerade schreibt, kann darunter
       verschwinden, und die Tastenzeile darunter ist gar nicht mehr zu
       erreichen.

       Die Ursache ist eine Kombination, die einzeln jeweils richtig aussieht:
       `MainActivity` ruft `enableEdgeToEdge()`, und damit hoert das Fenster
       auf, sich bei geoeffneter Tastatur zu VERKLEINERN — das
       `adjustResize` im Manifest greift nur, solange das Fenster die
       Systemleisten selbst einrechnet. Stattdessen meldet die Plattform den
       Einzug, und die App muss ihn anwenden. Genau das tat sie nirgends.

       Zwei Dinge gehoeren dazu, und keines allein reicht:
         - die Buehne bekommt `imePadding()` (weiter unten), damit ihr
           Sichtfenster wirklich kuerzer wird — nur dann kann Compose ein
           fokussiertes Textfeld in den Blick scrollen;
         - das untere Polster faellt weg, solange die Tastatur steht: Die
           schwebende Leiste liegt dann hinter ihr, und Platz fuer etwas
           freizuhalten, das man nicht sieht, ergaebe eine Luecke von 74 dp
           ueber der Tastatur. */
    val keyboardUp = WindowInsets.ime.getBottom(density) > 0
    val bottomInset = if (keyboardUp) 0.dp else with(density) { navHeight.toDp() }

    /* ── Mit der Tastatur geht auch der Fokus (N15) ─────────────────────────
       Kevins Befund am Geraet: „beim input text wenn ich wieder zurueckgehe ist
       es immer noch angetastet." Er hat recht, und es ist ein Fehler und keine
       Kleinigkeit: Der erste Zurueck-Druck schliesst in Compose nur die
       TASTATUR, den Fokus laesst er stehen. Zurueck bleibt damit ein Feld, das
       aussieht wie ein Feld, in das gerade getippt wird — mit blinkendem
       Cursor in Signalfarbe und der Fuellung `--fill-active` — obwohl es keine
       Tastatur mehr dazu gibt.

       Im Web gibt es das Problem nicht: Dort nimmt ein Klick daneben dem Feld
       den Fokus, und `:focus-within` faellt damit von selbst zurueck. Nativ
       muss man es sagen.

       ── Warum der Uebergang gemerkt wird und nicht der Zustand ────────────
       Weil der Fokus VOR der Tastatur kommt: Wer das Feld antippt, hat einen
       Wimpernschlag lang Fokus ohne Tastatur. Eine Regel „kein IME also kein
       Fokus" wuerde in genau diesem Wimpernschlag zuschlagen und den Fokus
       wieder wegnehmen — die Tastatur ginge nie auf. Geraeumt wird deshalb nur
       der WECHSEL von „Tastatur war da" zu „Tastatur ist weg".

       Das gilt fuer alle drei Felder der App (Secret, Filter, Passphrase) und
       steht deshalb hier, an der einen Stelle, die den IME-Einzug ohnehin
       kennt. */
    val focus = LocalFocusManager.current
    var keyboardWasUp by remember { mutableStateOf(false) }
    LaunchedEffect(keyboardUp) {
        if (keyboardUp) {
            keyboardWasUp = true
        } else if (keyboardWasUp) {
            keyboardWasUp = false
            focus.clearFocus()
        }
    }

    /* ── Zurueck fuehrt zur Startseite (N15) ───────────────────────────────
       Seit N11 hat die App zwei Seiten, und bis N14 fuehrte die Zurueck-Geste
       auf BEIDEN aus der App heraus. Auf der Einstellungen-Seite ist das
       falsch: Wer dort etwas eingestellt hat, will zurueck zu seinen Codes und
       nicht auf den Startbildschirm. Am Geraet gemessen war die Folge, dass der
       naechste Wisch den Launcher scrollte (die Falle steht seit P7 in
       CLAUDE.md).

       ── Warum PREDICTIVE und nicht einfach `BackHandler` ──────────────────
       Weil Android 14 die Geste sichtbar gemacht hat: Wer vom Rand zieht, sieht
       WOHIN es geht, und kann mitten in der Bewegung umkehren. Ein
       `BackHandler` kennt nur das Ergebnis; das Ziehen zeigte dann nichts, und
       ein Abbruch waere nicht zu unterscheiden von einem Treffer.

       Die Vorschau ist die der Plattform: Die abtretende Seite ZIEHT SICH
       ZUSAMMEN, bis zu 5 % bei voller Geste. Kein Ausblenden dazu — was
       zurueckkommen kann, soll nicht wie etwas aussehen, das verschwindet. Der
       Fortschritt ist der echte des Systems (`BackEventCompat.progress`), keine
       eigene Fahrt: Die Bewegung gehoert dem Finger.

       `--dur-calm` steht hier NICHT: Solange gezogen wird, gibt es keine Dauer.
       Nur der Ruecksprung nach einem Abbruch faehrt, und den fuehrt die
       Plattform, indem sie den Fortschritt selbst zurueckdreht. */
    var backProgress by remember { mutableFloatStateOf(0f) }

    PredictiveBackHandler(enabled = page == Page.Settings) { gesture ->
        try {
            gesture.collect { event -> backProgress = event.progress }
            // Durchgezogen: erst die Seite wechseln, dann die Vorschau
            // zuruecknehmen — in dieser Reihenfolge, sonst blitzt die
            // Einstellungen-Seite in voller Groesse auf, bevor sie geht.
            page = Page.Home
            backProgress = 0f
        } catch (_: CancellationException) {
            // Abgebrochen: Die Seite bleibt, die Vorschau geht zurueck.
            backProgress = 0f
        }
    }

    /* ── Die Buehne liegt UNTER der Leiste (N12) ───────────────────────────
       Bis N11 war das hier eine Spalte: Buehne, Fusszeile, Leiste — jede mit
       ihrem eigenen Platz. Seit die Leiste SCHWEBT, gibt es diesen Platz
       nicht mehr; sie liegt als Overlay ueber dem Inhalt, und der laeuft
       unter ihr durch. Deshalb eine Box mit drei Lagen: Buehne, Kopf,
       Leiste.

       ── Und seit N14 eine vierte, ganz oben (Systemleisten-Schutz) ────────
       Die aeussere Box traegt KEIN Polster mehr; das sitzt an der inneren.
       Dazwischen passt damit ein Streifen, der die Statusleiste abdeckt —
       siehe die lange Begruendung weiter unten am `statusScrim`. */
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.ground)
            /* Die Zeitschaltung des Tresors haengt an der Benutzung. Im Web
               sind das `pointerdown`, `keydown` und `focusin` am DOKUMENT —
               hier die INITIAL-Phase der Zeigerereignisse an der Wurzel, also
               bevor ein Kind sie verbraucht. Das ist die woertliche
               Entsprechung zum Mitschneiden im Web; verbraucht wird hier
               nichts. Getipptes deckt `onFieldChange` ab. */
            .pointerInput(vault) {
                awaitPointerEventScope {
                    while (true) {
                        awaitPointerEvent(PointerEventPass.Initial)
                        vault.resetIdleTimer()
                    }
                }
            },
    ) {
      Box(modifier = Modifier.fillMaxSize().systemBarsPadding()) {
        /* Die Buehne — und NUR sie — weicht der Tastatur. Kopf und Leiste
           bleiben aussen vor: Der Kopf steht oben und geht die Tastatur
           nichts an, und die Leiste soll hinter ihr verschwinden statt auf
           ihr zu reiten. Genau deshalb sitzt `imePadding()` hier an einer
           eigenen Huelle und nicht an der grossen Box. */
        Box(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
                /* Die Vorschau der Zurueck-Geste. Der Wert wird IM
                   `graphicsLayer` gelesen und invalidiert damit nur das
                   Zeichnen, nicht die Zusammensetzung — dieselbe Bauart wie der
                   verstaute Kopf. Bei 0 ist die Kette wirkungslos, also braucht
                   sie keine Bedingung. */
                .graphicsLayer {
                    val shrink = 1f - 0.05f * backProgress
                    scaleX = shrink
                    scaleY = shrink
                },
        ) {
            if (page == Page.Settings) {
                SettingsPage(
                    vault = vault,
                    scroll = settingsScroll,
                    topInset = topInset,
                    bottomInset = bottomInset,
                )
            } else if (vacant) {
                VacantStage(
                    field = field,
                    onFieldChange = { field = it; vault.resetIdleTimer() },
                    onFocusChange = { fieldFocused = it },
                    onTestKey = { field = TextFieldValue(TEST_KEY) },
                    note = note,
                    onScan = ::handleScan,
                    onNote = ::setNote,
                    vault = vault,
                    vaultOpen = vaultOpen,
                    onVaultOpenChange = { vaultOpen = it },
                    scroll = scroll,
                    topInset = topInset,
                    bottomInset = bottomInset,
                )
            } else {
                WorkingStage(
                    field = field,
                    onFieldChange = { field = it; vault.resetIdleTimer() },
                    onFocusChange = { fieldFocused = it },
                    entries = entries,
                    unixSeconds = unixSeconds,
                    inputOpen = inputOpen,
                    onToggleInput = { inputOpen = !inputOpen },
                    onCopy = { code -> context.copySensitive(code) },
                    note = note,
                    onScan = ::handleScan,
                    onNote = ::setNote,
                    vault = vault,
                    vaultOpen = vaultOpen,
                    onVaultOpenChange = { vaultOpen = it },
                    scroll = scroll,
                    topInset = topInset,
                    bottomInset = bottomInset,
                )
            }
        }

        /* ── Die Abblendung unter der Leiste (N14) ─────────────────────────
           Sie liegt UEBER der Buehne und UNTER der Leiste — deshalb steht sie
           hier zwischen beiden im Baum.

           ── Warum sie da ist, obwohl N13 sie verworfen hatte ─────────────
           N13 hat sie an der Kontrastmessung abgelehnt: Ein Schleier liegt
           ueber Text UND Grund, und schon ein Viertel Deckung drueckt
           `--ink-3` auf 3,34:1. Das Argument stimmt weiter — es beantwortet
           nur die falsche Frage.

           Kevins Befund am Geraet: Transluzenz OHNE Weichzeichner wirkt
           nicht milchig, sondern kaputt. Man liest halbe Buchstaben durch
           eine Flaeche, auf der Beschriftungen stehen. Und einen echten
           Weichzeichner gibt es hier nicht (siehe
           docs/geprueft-und-verworfen.md).

           Also blendet der Inhalt ab, BEVOR er die Leiste erreicht. Damit
           gilt die Kontrastfrage nicht mehr dem Text IN der Abblendung — der
           ist dort per Definition am Auslaufen, wie ein Wort am unteren
           Bildrand —, sondern der LESBAREN Zone darueber. Wo die endet, ist
           ausgerechnet und steht in der Abnahme-Doku; `native-nav-contrast.mjs
           --abblendung` rechnet es nach.

           ── Die Geometrie ────────────────────────────────────────────────
           Der Anlauf ist `--gap-group` (24 dp) und endet DECKEND an der
           Oberkante der Leiste; darunter bleibt es Grund. Ein kuerzerer
           Anlauf sieht aus wie eine Kante, ein laengerer frisst Ablesbares. */
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .height(with(density) { navHeight.toDp() } + FADE_RUN)
                .background(fadeBrush(colors.ground, navHeight, density.density)),
        )

        // Der Kopf liegt UEBER der Buehne und ist deckend — genau wie
        // `position: sticky` im Web, wo der Inhalt unter ihm durchlaeuft.
        // Deshalb steht er hier als vorletztes Kind der Box; nach ihm kommt
        // nur noch die Leiste, die ueber allem liegt.
        Masthead(
            vaultState = vault.state,
            lifted = scroll.value > 0,
            modifier = Modifier
                .align(Alignment.TopCenter)
                .onSizeChanged { mastheadHeight = it.height }
                // Bewegt wird ausschliesslich `transform` — kein Layout,
                // keine Hoehenaenderung. Die Lambda-Form von `offset`
                // laeuft in der Platzierungsphase und loest keine
                // Neuzusammensetzung aus.
                .offset { IntOffset(0, -(mastheadHeight * stow).roundToInt()) },
        )

        BottomNav(
            current = page,
            onSelect = { page = it },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .onSizeChanged { navHeight = it.height },
        )
      }

        /* ── Der Systemleisten-Schutz (N14) ────────────────────────────────
           Ein deckender Streifen in `--ground`, genau so hoch wie der Einzug
           der Statusleiste, und als LETZTES Kind — er liegt damit ueber
           allem.

           ── Warum das Polster allein nicht reichte ───────────────────────
           Der Einzug sass schon vorher richtig: Die Buehne beginnt unter der
           Statusleiste, gescrollter Inhalt kann gar nicht dorthin. Der Kopf
           aber wird beim Verstauen (M1) mit `offset` nach oben GESCHOBEN, und
           ein Versatz clippt nichts — er zeichnet einfach weiter, auch ueber
           der Polsterkante. Am S24 nachgemessen: Die Zustandszeile
           („Offline · nichts gespeichert") stand neben der Systemuhr.

           Das ist genau der Fall, fuer den das Edge-to-Edge-Muster der
           Plattform die „system bar protection" vorsieht: nicht die Bewegung
           beschneiden, sondern die Systemzone abdecken. Der Kopf faehrt damit
           HINTER den Streifen und ist weg, ohne dass seine Fahrt eine
           Sonderregel braucht.

           `--ground` und nicht `--surface`: Der Streifen ist die Fortsetzung
           des Seitengrunds nach oben, kein eigenes Bauteil. Im Web traegt
           dieselbe Zone die `theme-color`. */
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .windowInsetsTopHeight(WindowInsets.statusBars)
                .background(colors.ground),
        )
    }
}

/**
 * Der Anlauf der Abblendung: die Strecke, auf der der Inhalt verschwindet.
 *
 * `--gap-group`, also dasselbe Mass, das zwei Karten trennt. Der Verlauf soll
 * wie eine Fuge wirken und nicht wie ein Effekt.
 */
private val FADE_RUN: Dp = Dimens.gapGroup

/**
 * Der Verlauf: durchsichtig am Anfang, ab der Leistenoberkante deckend.
 *
 * Die zwei Haltepunkte stehen in ANTEILEN der Gesamthoehe, weil ein
 * Brush in Pixeln rechnet und die Leistenhoehe gemessen wird — eine feste
 * Pixelzahl waere bei Schriftskala 1,5 falsch.
 */
private fun fadeBrush(ground: Color, navHeightPx: Int, densityScale: Float): Brush {
    val run = FADE_RUN.value * densityScale
    val total = navHeightPx + run
    // Bei ungemessener Leiste (erstes Bild) waere `total` gleich `run`; dann
    // ist der Anteil 1 und der Verlauf laeuft ueber die ganze Hoehe. Das ist
    // richtig und nicht bloss unschaedlich — es gibt in dem Bild noch keine
    // Leiste, unter der etwas verschwinden muesste.
    val stop = if (total <= 0f) 1f else (run / total).coerceIn(0f, 1f)
    return Brush.verticalGradient(
        0f to ground.copy(alpha = 0f),
        stop to ground,
        1f to ground,
    )
}

/**
 * Die Zusagen-Zeile am Fuss der Startseite.
 *
 * Der Satz kommt aus `native.colophon.note` und nicht aus `colophon.note`:
 * Die Web-Fassung endet auf „HMAC ueber die Web Crypto API", und nativ
 * rechnet `javax.crypto`. Ausgerechnet der Satz, der die Zusagen der App
 * zusammenfasst, darf nicht die falsche nennen.
 *
 * Der Sprachumschalter stand hier bis N11 daneben — er ist jetzt auf der
 * Einstellungen-Seite. Ein Auswahlfeld im Fuss ist die Handschrift einer
 * Webseite, nicht die einer App.
 *
 * ── Sie SCROLLT wieder, und das ist die Ruecknahme einer N11-Entscheidung ──
 * N11 hatte sie aus dem Scrollbereich geholt und fest ueber die Leiste
 * gestellt, mit dem Argument: Eine Vertrauenszeile, die man erst erscrollen
 * muss, wirkt nicht beim ersten Blick. Das Argument stimmt weiter, die
 * Umsetzung ist mit N12 unmoeglich geworden — und zwar nicht aus Bequemlichkeit:
 *
 * Die Leiste schwebt jetzt, der Inhalt laeuft UNTER ihr durch. Eine feste
 * Zeile ohne eigene Flaeche stuende damit im Weg des durchlaufenden Inhalts —
 * Text ueber Text. Sie mit einer deckenden Flaeche zu hinterlegen, hiesse
 * einen Riegel ueber die volle Breite einzuziehen, und genau den hat N12
 * abgeschafft.
 *
 * Sie steht deshalb wieder am Ende der Buehne. Der Preis ist benannt: Auf der
 * Arbeitsbuehne sieht man sie erst nach dem Scrollen. Im Leerzustand — dem
 * ersten Bild jeder frischen Installation — steht sie weiter im Blick, weil
 * die Buehne dort zentriert.
 */
@Composable
private fun ColophonLine(modifier: Modifier = Modifier) {
    val colors = LocalColors.current

    BasicText(
        text = text("native.colophon.note"),
        style = TextStyles.micro.copy(color = colors.ink3),
        modifier = modifier,
    )
}

/**
 * Der Leerzustand: Emblem in 2,2-facher Groesse, ein Satz, das Feld selbst.
 *
 * Er ist kein FEHLzustand, sondern die Einladung — dieselbe Haltung wie im Web
 * seit V7.
 */
@Composable
private fun VacantStage(
    field: TextFieldValue,
    onFieldChange: (TextFieldValue) -> Unit,
    onFocusChange: (Boolean) -> Unit,
    onTestKey: () -> Unit,
    note: String,
    onScan: (String) -> Unit,
    onNote: (String) -> Unit,
    vault: VaultController,
    vaultOpen: Boolean,
    onVaultOpenChange: (Boolean) -> Unit,
    scroll: ScrollState,
    topInset: Dp,
    bottomInset: Dp,
) {
    val colors = LocalColors.current

    /* `verticalScroll` steht hier seit P6, und der Grund ist gemessen: Mit
       offenem Sucher wird die Buehne hoeher als der Schirm, und eine
       Column OHNE Scroll beschneidet dann nicht etwa unten — sie STAUCHT
       ihre spaeteren Kinder auf die Resthoehe (die Tastenzeile war am
       Emulator 28 statt 40 dp, die „Kamera aus"-Zeile ganz verschluckt).
       Mit Scroll behaelt jedes Kind sein Mass, und die Zentrierung wirkt
       weiter, solange der Inhalt kleiner als der Schirm ist — genau das
       Verhalten der Web-Buehne.

       `topInset` ist die gemessene Kopfhoehe. Als PADDING und nicht als
       Zwischenraum: Bei zentrierter Anordnung wuerde ein fuehrender
       Abstandhalter mitzentriert und schoebe den Inhalt nur halb so weit
       hinunter. Als Polster verkleinert er den Raum, in dem zentriert wird —
       und genau das ist gemeint.

       Unten steht seit N12 dasselbe fuer die schwebende Leiste: Der Inhalt
       laeuft unter ihr durch, also zentriert er zwischen Kopf und Leiste und
       nicht zwischen Kopf und Fensterkante. */
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scroll)
            .padding(
                top = topInset,
                bottom = Dimens.gapGroup + bottomInset,
                start = Dimens.gapGroup,
                end = Dimens.gapGroup,
            ),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Gauge(
            progress = 0.0,
            modifier = Modifier.size(Dimens.dialSize),
        )
        Spacer(Modifier.height(Dimens.gapGroup))
        BasicText(
            // `native.` und nicht `vacant.text`: Der Web-Satz endet auf „…
            // verlaesst diesen Browser", und hier gibt es keinen Browser. Der
            // Schluessel steht im gemeinsamen Katalog (dort prueft der Compiler
            // ihn in allen 37 Sprachen), wird aber aus dem Web-Buendel
            // genommen — Einzelheiten in src/i18n/strings.ts. Das Praefix am
            // Aufruf ist Absicht: Man sieht der Zeile an, dass dieser Text der
            // nativen App gehoert.
            text = text("native.vacant.text"),
            style = TextStyles.body.copy(color = colors.ink2),
        )
        Spacer(Modifier.height(Dimens.gapStack))
        SecretField(
            field = field,
            onFieldChange = onFieldChange,
            onFocusChange = onFocusChange,
        )

        // ── Der Testschluessel-Knopf ───────────────────────────────────────
        // Er lebt NUR im Leerzustand, und zusaetzlich prueft der Handler auf
        // ein leeres Feld. Die Zusage aus V4 bleibt damit woertlich erfuellt:
        // Es gibt keinen Zustand, in dem er echtes Schluesselmaterial
        // ueberschreiben koennte. Bei Schluesselmaterial ist ein zweites
        // Schloss billiger als die Frage, ob das erste noch haelt.
        if (field.text.isEmpty()) {
            Spacer(Modifier.height(Dimens.gapPair))
            Key(
                label = text("vacant.demo"),
                onClick = { if (field.text.isEmpty()) onTestKey() },
                modifier = Modifier.fillMaxWidth(),
                /* ── Die HAUPTHANDLUNG dieser Buehne (N15) ──────────────────
                   Bis N14 stand hier `Default`, also die neutrale Fuellung.
                   Das war ein Paritaetsfehler, und er ist in einer Zeile
                   nachlesbar — `index.html`:320 gibt diesem Knopf
                   `class="key key--primary key--lg"`, also die volle
                   Signalflaeche und die grosse Sprosse.

                   Kevins Befund am Geraet: „ich meine den hover button herum
                   orange". Genau das ist `--signal` als Flaeche samt
                   `--signal-hover` beim Druck; die Tinte darauf ist
                   `--signal-ink` (#18181b, gemessen 5,23:1 — Snow haelt dort
                   nur 3,39).

                   Inhaltlich stimmt es auch: Im Leerzustand gibt es genau eine
                   Handlung, die ohne eigenes Material funktioniert, und die
                   Hausregel gibt der EINEN Haupthandlung eines Panels die
                   Signalflaeche. Die zwei Wege daneben („QR aus Bild",
                   „Kamera") bleiben `Default` — auch das wie im Web. */
                variant = KeyVariant.Primary,
                large = true,
                glyph = { tint -> KeyGlyph(tint) },
            )
        }

        // Die drei Wege hinein (V7): tippen, Bild, Kamera. Der Sucher oeffnet
        // sich unter den Tasten, wie im Web unter der Tastenzeile.
        Spacer(Modifier.height(Dimens.gapPair))
        ScanControls(
            active = true,
            onScan = onScan,
            onNote = onNote,
            modifier = Modifier.fillMaxWidth(),
        )
        MessageRow(
            text = note,
            tone = MessageTone.Status,
            modifier = Modifier.fillMaxWidth(),
        )

        /* ── Der Tresor im Leerzustand ─────────────────────────────────────
           Weg — er ist erst relevant, wenn es etwas zu speichern gibt.

           Mit einer Ausnahme, und die ist keine Feinheit: Ist bereits ein
           Tresor GESPERRT, dann ist das Feld beim Start leer, und zwar genau
           deshalb, weil der Inhalt im Tresor liegt. Wuerde die Zone dann
           verschwinden, waere das Passphrasenfeld unerreichbar und der Tresor
           faktisch nicht mehr zu oeffnen. Der Leerzustand versteckt also nur
           einen Tresor, der AUS ist — wortgleich `paintVaultZone` im Web. */
        if (vault.state != VaultState.Off) {
            Spacer(Modifier.height(Dimens.gapGroup))
            VaultZone(
                controller = vault,
                expanded = vaultOpen,
                onExpandedChange = onVaultOpenChange,
                modifier = Modifier.fillMaxWidth(),
            )
        }

        Spacer(Modifier.height(Dimens.gapGroup))
        ColophonLine()
    }
}

/**
 * Der Arbeitszustand — und die V10-Reihenfolge: Die CODES stehen zuerst.
 *
 * Das ist die halbe Zusage von v1.4.0: Wer nur seinen Code will (der haeufigste
 * Fall ueberhaupt), soll nicht an Eingabefeld und Tresor vorbeiscrollen.
 * Gemessen war der erste Code im Web vorher bei y = 821, danach bei 206.
 */
@Composable
private fun WorkingStage(
    field: TextFieldValue,
    onFieldChange: (TextFieldValue) -> Unit,
    onFocusChange: (Boolean) -> Unit,
    entries: List<ParsedEntry>,
    unixSeconds: Double,
    inputOpen: Boolean,
    onToggleInput: () -> Unit,
    onCopy: (String) -> Unit,
    note: String,
    onScan: (String) -> Unit,
    onNote: (String) -> Unit,
    vault: VaultController,
    vaultOpen: Boolean,
    onVaultOpenChange: (Boolean) -> Unit,
    scroll: ScrollState,
    topInset: Dp,
    bottomInset: Dp,
) {
    val colors = LocalColors.current
    val context = LocalContext.current

    var filter by rememberSaveable { mutableStateOf("") }

    // Der Suchtext wird EINMAL je Eintrag gefaltet, nicht bei jedem
    // Tastendruck ueber die ganze Liste. Bei einer unlesbaren Zeile geht die
    // uebersetzte Meldung mit hinein — wer in einer langen Liste den Fehler
    // sucht, sucht nach dem, was er getippt hat.
    val haystacks = remember(entries, context) {
        entries.map { entry ->
            when (entry) {
                is ParsedEntry.Ok -> describeForSearch(entry)
                is ParsedEntry.Failed ->
                    describeForSearch(entry, context.text(entry.messageKey, entry.messageArgs))
            }
        }
    }

    // Drei Kanaele in zwei Spalten sind kein Raster, sondern eine angefangene
    // Zeile — dieselbe Zahl schaltet im Web den Filter frei.
    val showFilter = entries.size >= FILTER_FROM
    val shown = entries.filterIndexed { index, _ ->
        !showFilter || matchesFilter(haystacks[index], filter)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scroll)
            .padding(
                top = topInset,
                // Gemessene Leistenhoehe plus Gruppenfuge: So laesst sich die
                // letzte Karte vollstaendig ueber die schwebende Leiste hinaus
                // scrollen, und darunter bleiben sichtbare 24 dp Luft.
                bottom = Dimens.gapGroup + bottomInset,
                start = Dimens.gapGroup,
                end = Dimens.gapGroup,
            ),
        verticalArrangement = Arrangement.spacedBy(Dimens.gapGroup),
    ) {
        // Die drei Karten treten NACHEINANDER ein (N15) — 20 ms Versatz, wie
        // die Ziffern eines Codes. Die Reihenfolge ist die des Lesens: erst die
        // Codes, dann die Eingabe, dann der Tresor.
        Panel(modifier = Modifier.fillMaxWidth().cardEnter(0)) {
            Column(verticalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
                if (showFilter) {
                    FilterField(value = filter, onValueChange = { filter = it })
                }

                // Ein leeres Ergebnis ist eine Auskunft, kein leerer Kasten —
                // und eine, die ein Screenreader ansagen soll. Die Zeile bleibt
                // deshalb IMMER in der Komposition und faehrt nur auf Hoehe 0
                // zusammen: Eine Live-Region, die erst mit ihrem Text entsteht,
                // meldet ihn nicht zuverlaessig.
                if (showFilter) {
                    MessageRow(
                        text = if (shown.isEmpty()) {
                            text("filter.empty", mapOf("query" to filter.trim()))
                        } else {
                            ""
                        },
                        tone = MessageTone.Status,
                    )
                }

                shown.forEachIndexed { index, entry ->
                    when (entry) {
                        is ParsedEntry.Ok -> {
                            val account = entry.account
                            val counter = timeCounter(unixSeconds, account.period)
                            val code = remember(entry.key, counter) {
                                generateTotpForCounter(
                                    secret = account.secret,
                                    counter = counter,
                                    algorithm = account.algorithm,
                                    digits = account.digits,
                                )
                            }
                            val next = remember(entry.key, counter) {
                                generateTotpForCounter(
                                    secret = account.secret,
                                    counter = counter + 1,
                                    algorithm = account.algorithm,
                                    digits = account.digits,
                                )
                            }
                            Strip(
                                title = account.issuer
                                    ?: account.accountName
                                    ?: text(
                                        "strip.accountFallback",
                                        mapOf("n" to formatNumber((index + 1).toLong())),
                                    ),
                                subtitle = if (account.issuer != null) account.accountName else null,
                                spec = text(
                                    "strip.spec",
                                    mapOf(
                                        "algorithm" to account.algorithm.displayName,
                                        "digits" to textCount("strip.digits", account.digits),
                                        "period" to text(
                                            "strip.period",
                                            mapOf("n" to formatNumber(account.period.toLong())),
                                        ),
                                    ),
                                ),
                                code = code,
                                nextCode = next,
                                progress = periodProgress(unixSeconds, account.period),
                                period = account.period,
                                onCopy = onCopy,
                                lead = index == 0,
                            )
                        }

                        is ParsedEntry.Failed -> FaultStrip(
                            source = entry.source,
                            message = context.text(entry.messageKey, entry.messageArgs),
                        )
                    }
                }
            }
        }

        // ── Die Eingabe als Fold-Zeile (V10) ───────────────────────────────
        // „Eingabe · 3 Konten" mit demselben Zaehler wie im Web: eine Zahl,
        // eine Quelle. Tippen oeffnet den Editor in der Schublade darunter.
        Panel(
            modifier = Modifier.fillMaxWidth().cardEnter(1),
            padding = FoldPanelPadding,
        ) {
            Column {
                FoldRow(
                    label = "${text("zone.input")} · ${countLabel(entries)}",
                    expanded = inputOpen,
                    onToggle = onToggleInput,
                )
                Drawer(open = inputOpen) {
                    // Die Fuge zur Zeile faehrt als Innenabstand der Schublade
                    // mit zu — stuende sie aussen, bliebe im zugeklappten
                    // Zustand eine Luecke ohne Inhalt stehen.
                    Column(
                        // Unten dasselbe Mass wie oben: Seit die Karte nur
                        // noch --sp-2 Polster traegt (N14), muss die
                        // Schublade ihre eigene Fuge zur Unterkante
                        // mitbringen.
                        modifier = Modifier.padding(top = Dimens.gapPair, bottom = Dimens.gapPair),
                        verticalArrangement = Arrangement.spacedBy(Dimens.gapPair),
                    ) {
                        SecretField(
                            field = field,
                            onFieldChange = onFieldChange,
                            onFocusChange = onFocusChange,
                        )
                        // `active = inputOpen`: Faehrt die Schublade zu, endet
                        // eine laufende Kamera mit — die V10-Regel.
                        ScanControls(
                            active = inputOpen,
                            onScan = onScan,
                            onNote = onNote,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }

                // AUSSERHALB der Schublade, mit Absicht: Die Schublade nimmt
                // ihren Inhalt bei Hoehe 0 ganz aus der Komposition (tote
                // Fugen), eine Live-Region muss aber DA sein, bevor Text
                // hineinkommt. Unter der Fold-Zeile bleibt die Meldung auch
                // bei zugeklappter Eingabe sichtbar — im Web steckt sie in
                // der zugefahrenen Schublade und ist nur zu HOEREN; das hier
                // ist die ehrlichere Stelle, keine Abweichung aus Geschmack.
                MessageRow(
                    text = note,
                    tone = MessageTone.Status,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }

        // Die zweite zugeklappte Zeile der V10-Struktur. Sie steht NACH der
        // Eingabe, weil die Reihenfolge im Web dieselbe ist: erst ablesen,
        // dann einstellen, und der Tresor ist das, was man einmal einrichtet.
        VaultZone(
            controller = vault,
            expanded = vaultOpen,
            onExpandedChange = onVaultOpenChange,
            modifier = Modifier.fillMaxWidth().cardEnter(2),
        )

        ColophonLine()
    }
}

/**
 * Der Zaehler der Fold-Zeile — dieselbe Zahl wie im Web, aus derselben Quelle.
 *
 * Stehen kaputte Zeilen im Feld, nennt der Zaehler beide Mengen ueber
 * `input.count.join`. Eine unlesbare Zeile IST etwas, das da ist; sie
 * wegzuzaehlen hiesse, sie zu verstecken.
 */
@Composable
private fun countLabel(entries: List<ParsedEntry>): String {
    val accounts = entries.count { it is ParsedEntry.Ok }
    val errors = entries.size - accounts
    val accountsText = textCount("input.count.accounts", accounts)
    if (errors == 0) return accountsText

    return text(
        "input.count.join",
        mapOf("accounts" to accountsText, "errors" to textCount("input.count.errors", errors)),
    )
}

/**
 * Die Filterzeile — sie klebt im Web, hier steht sie am Kopf der Karte.
 *
 * Gesucht wird ueber `core/Filter.kt`, also ueber Aussteller und Kontoname,
 * niemals ueber den Code (er wandert mit der Uhr) und niemals ueber das
 * Secret (danach sucht nur, wer es sehen will).
 */
@Composable
private fun FilterField(value: String, onValueChange: (String) -> Unit) {
    val colors = LocalColors.current
    val interaction = remember { MutableInteractionSource() }
    val keyboard = LocalSoftwareKeyboardController.current
    val focus = LocalFocusManager.current
    // Ausserhalb des Modifiers geholt: `semantics {}` ist kein Composable und
    // darf `text()` nicht aufrufen.
    val label = text("filter.label")

    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        singleLine = true,
        /* ── IME-Politur (N15) ────────────────────────────────────────────
           Drei Angaben, und jede loest etwas Sichtbares:

           `ImeAction.Search` beschriftet die Eingabetaste der Tastatur mit der
           Lupe. Vorher stand dort ein Zeilenumbruch — in einem EINZEILIGEN Feld
           also eine Taste, die nichts tut.

           Auf Search hin geht die Tastatur zu und der Fokus weg: Gesucht wird
           bei jedem Zeichen (die Liste filtert live), das Absenden ist also
           schon passiert. Was der Nutzer meint, ist „fertig, zeig mir die
           Treffer" — und dafuer muss die Tastatur aus dem Weg, die auf einem
           Telefon die halbe Liste verdeckt.

           Keine Grossschreibung, keine Autokorrektur: Ein Aussteller heisst
           „github" und nicht „Github", und eine Autokorrektur, die aus einem
           Kontonamen ein Wort ihres Woerterbuchs macht, laesst die Liste leer
           aussehen. */
        keyboardOptions = KeyboardOptions(
            capitalization = KeyboardCapitalization.None,
            autoCorrectEnabled = false,
            imeAction = ImeAction.Search,
        ),
        keyboardActions = KeyboardActions(
            onSearch = {
                keyboard?.hide()
                focus.clearFocus()
            },
        ),
        textStyle = TextStyles.body.copy(color = colors.ink),
        cursorBrush = androidx.compose.ui.graphics.SolidColor(colors.signal),
        interactionSource = interaction,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = Dimens.controlH)
            .clip(RoundedCornerShape(Dimens.radiusField))
            .background(fieldFill(interaction))
            .padding(horizontal = Dimens.sp3, vertical = Dimens.sp2)
            .semantics { contentDescription = label },
        decorationBox = { inner ->
            if (value.isEmpty()) {
                BasicText(
                    text = text("filter.placeholder"),
                    style = TextStyles.body.copy(color = colors.ink3),
                    maxLines = 1,
                )
            }
            inner()
        },
    )
}

/**
 * Das Textfeld.
 *
 * `BasicTextField` und nicht `TextField`: Letzteres kommt aus Material und
 * braechte Label, Rahmen und Fuellung seines eigenen Systems mit.
 *
 * ── Die Tastatur darf hier NICHTS mitreden (N15) ──────────────────────────
 * In diesem Feld steht Schluesselmaterial: `otpauth://`-Zeilen und Base32.
 * Beides vertraegt keine Hilfe.
 *
 * `KeyboardCapitalization.None` — eine Tastatur, die den Satzanfang gross
 * schreibt, macht aus `otpauth://` ein `Otpauth://`. Base32 ist zwar
 * gross-klein-gleichgueltig (`base32.ts` faltet), die URI ist es nicht.
 *
 * `autoCorrectEnabled = false` — das ist der wichtigere der beiden. Eine
 * Autokorrektur, die einen 32-Zeichen-Schluessel für ein verschriebenes Wort
 * haelt, aendert ihn STILL, und man sieht dem Ergebnis nichts an: Der Code
 * rechnet sich weiter aus, er stimmt nur nicht mehr. Genau dieser Fehler ist
 * dem Projekt schon einmal passiert, nur mit `adb shell input text` als
 * Verursacher (CLAUDE.md, Fallen) — und er hat damals eine Dreiviertelstunde
 * gekostet, weil der falsche Code aussah wie ein Rechenfehler.
 *
 * `KeyboardType.Ascii` — bittet um ein lateinisches Tastenfeld
 * (`IME_FLAG_FORCE_ASCII`). Auf einem Geraet mit kyrillischem oder
 * arabischem Layout steht sonst eine Tastatur da, mit der man kein Base32
 * tippen kann. Die Sprache der Oberflaeche bleibt davon unberuehrt — es geht um
 * die Zeichen im FELD, nicht um die der App.
 *
 * KEIN `imeAction`: Das Feld ist mehrzeilig, eine Zeile ist ein Konto. Die
 * Eingabetaste muss also ein Zeilenumbruch bleiben — hier waere eine
 * Aktionstaste ein Verlust.
 *
 * ── Was hier NICHT erreichbar ist, und das gehoert gesagt ─────────────────
 * `IME_FLAG_NO_PERSONALIZED_LEARNING` — die Bitte an die Tastatur, das
 * Getippte nicht in ihr Woerterbuch zu uebernehmen. Compose' `KeyboardOptions`
 * hat dafuer keinen Griff, und ein Passwort-Typ ist hier falsch: Man muss den
 * Schluessel SEHEN, um ihn zu pruefen. Die Passphrase des Tresors traegt
 * `KeyboardType.Password` und ist damit abgedeckt; dieses Feld ist es nicht.
 */
@Composable
private fun SecretField(
    field: TextFieldValue,
    onFieldChange: (TextFieldValue) -> Unit,
    onFocusChange: (Boolean) -> Unit,
) {
    val colors = LocalColors.current
    val interaction = remember { MutableInteractionSource() }

    BasicTextField(
        value = field,
        onValueChange = onFieldChange,
        keyboardOptions = KeyboardOptions(
            capitalization = KeyboardCapitalization.None,
            autoCorrectEnabled = false,
            keyboardType = KeyboardType.Ascii,
        ),
        textStyle = TextStyles.body.copy(color = colors.ink),
        cursorBrush = androidx.compose.ui.graphics.SolidColor(colors.signal),
        interactionSource = interaction,
        modifier = Modifier
            .fillMaxWidth()
            .onFocusChanged { onFocusChange(it.isFocused) }
            .clip(RoundedCornerShape(Dimens.radiusField))
            .background(fieldFill(interaction))
            .padding(Dimens.sp3),
        decorationBox = { inner ->
            if (field.text.isEmpty()) {
                BasicText(
                    text = text("input.placeholder"),
                    style = TextStyles.body.copy(color = colors.ink3),
                )
            }
            inner()
        },
    )
}

/**
 * Kopiert einen Code in die Zwischenablage — als VERTRAULICH markiert.
 *
 * Ab API 33 zeigt Android beim Kopieren eine Vorschau des Inhalts. Ein
 * TOTP-Code haette darin nichts verloren: Er waere fuer jeden sichtbar, der
 * gerade auf den Bildschirm schaut, und ueberlebte den Moment als
 * Bildschirmfoto. `EXTRA_IS_SENSITIVE` unterdrueckt die Vorschau.
 *
 * Unter 33 gibt es das Flag nicht — dort bleibt die Vorschau, wie sie ist.
 * Das ist eine echte Luecke und keine, die sich hier schliessen laesst;
 * benannt statt uebergangen.
 */
private fun Context.copySensitive(code: String) {
    val clipboard = getSystemService(ClipboardManager::class.java) ?: return
    val clip = ClipData.newPlainText(null, code)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        clip.description.extras = PersistableBundle().apply {
            putBoolean(ClipDescription.EXTRA_IS_SENSITIVE, true)
        }
    }
    clipboard.setPrimaryClip(clip)
}

/**
 * Ersetzt jede `otpauth-migration://`-Zeile an Ort und Stelle durch ihre
 * `otpauth://`-Zeilen — der Port von `expandMigrationLines` aus `ui/app.ts`.
 *
 * Der Nutzer SIEHT damit, was importiert wurde, und kann es pruefen oder
 * loeschen; ab da laufen die Zeilen durch denselben Parser wie alles andere.
 * Eine unlesbare Export-Zeile wird zur `#`-Notiz im Feld UND zur Meldung —
 * sie verschwindet nicht wortlos.
 *
 * @return das expandierte Feld und die Bilanz-Meldung (leer, wenn gar kein
 *   Export im Feld stand).
 */
private fun expandMigrationLines(context: Context, fieldText: String): Pair<String, String> {
    val lines = fieldText.split(NEWLINE)
    if (lines.none { isMigrationUri(it) }) return fieldText to ""

    val expanded = mutableListOf<String>()
    var imported = 0
    val skipped = mutableListOf<String>()
    val problems = mutableListOf<String>()

    for (line in lines) {
        if (!isMigrationUri(line)) {
            expanded += line
            continue
        }
        try {
            val result = parseMigrationUri(line)
            expanded += result.lines
            imported += result.imported
            skipped += result.skipped.map { skip ->
                context.text(
                    skip.reasonKey,
                    mapOf("label" to (skip.label ?: context.text("import.unnamed"))),
                )
            }
        } catch (error: MigrationError) {
            val message = context.text(error.key, error.args)
            expanded += "# $message"
            problems += message
        } catch (error: ClockworkError) {
            // Kaputte Binaerdaten (Protobuf & Co.): Im Web faellt alles, was
            // kein MigrationError ist, auf die neutrale Export-Meldung.
            val message = context.text("import.unreadable")
            expanded += "# $message"
            problems += message
        }
    }

    val parts = mutableListOf<String>()
    if (imported > 0) {
        val locale = context.resources.configuration.locales[0]
        parts += context.textPlural(
            "import.done",
            imported,
            mapOf("n" to formatNumber(imported.toLong(), locale)),
        )
    }
    if (skipped.isNotEmpty()) {
        parts += context.text("import.skipped", mapOf("list" to skipped.joinToString(", ")))
    }
    parts += problems

    return expanded.joinToString("\n") to parts.joinToString(" · ")
}

/** Zeilenenden wie im Web (`/\r?\n/`) — eingefuegter Text kann `\r\n` tragen. */
private val NEWLINE = Regex("\r?\n")
