package io.github.keco216.clockwork.ui

import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.PersistableBundle
import android.view.WindowManager
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
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
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
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
import kotlinx.coroutines.delay
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
    val stowed = rememberStowed(scroll, mastheadHeight)
    val stow by animateFloatAsState(
        targetValue = if (stowed) 1f else 0f,
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "masthead-stow",
    )
    val topInset = with(density) { mastheadHeight.toDp() }

    /* ── Die Buehne liegt UNTER der Leiste (N12) ───────────────────────────
       Bis N11 war das hier eine Spalte: Buehne, Fusszeile, Leiste — jede mit
       ihrem eigenen Platz. Seit die Leiste SCHWEBT, gibt es diesen Platz
       nicht mehr; sie liegt als Overlay ueber dem Inhalt, und der laeuft
       unter ihr durch. Deshalb eine Box mit drei Lagen: Buehne, Kopf,
       Leiste. */
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.ground)
            .systemBarsPadding()
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
        if (page == Page.Settings) {
            SettingsPage(vault = vault, scroll = settingsScroll, topInset = topInset)
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
            )
        }

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
            modifier = Modifier.align(Alignment.BottomCenter),
        )
    }
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
                bottom = Dimens.gapGroup + navOverlayHeight,
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
                variant = KeyVariant.Default,
                large = true,
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
                // Leistenhoehe plus Gruppenfuge: So laesst sich die letzte
                // Karte vollstaendig ueber die schwebende Leiste hinaus
                // scrollen, und darunter bleiben sichtbare 24 dp Luft.
                bottom = Dimens.gapGroup + navOverlayHeight,
                start = Dimens.gapGroup,
                end = Dimens.gapGroup,
            ),
        verticalArrangement = Arrangement.spacedBy(Dimens.gapGroup),
    ) {
        Panel(modifier = Modifier.fillMaxWidth()) {
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
        Panel(modifier = Modifier.fillMaxWidth()) {
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
                        modifier = Modifier.padding(top = Dimens.gapPair),
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
            modifier = Modifier.fillMaxWidth(),
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
    // Ausserhalb des Modifiers geholt: `semantics {}` ist kein Composable und
    // darf `text()` nicht aufrufen.
    val label = text("filter.label")

    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        singleLine = true,
        textStyle = TextStyles.body.copy(color = colors.ink),
        cursorBrush = androidx.compose.ui.graphics.SolidColor(colors.signal),
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = Dimens.controlH)
            .clip(RoundedCornerShape(Dimens.radiusField))
            .background(colors.surfaceFill)
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
 */
@Composable
private fun SecretField(
    field: TextFieldValue,
    onFieldChange: (TextFieldValue) -> Unit,
    onFocusChange: (Boolean) -> Unit,
) {
    val colors = LocalColors.current

    BasicTextField(
        value = field,
        onValueChange = onFieldChange,
        textStyle = TextStyles.body.copy(color = colors.ink),
        cursorBrush = androidx.compose.ui.graphics.SolidColor(colors.signal),
        modifier = Modifier
            .fillMaxWidth()
            .onFocusChanged { onFocusChange(it.isFocused) }
            .clip(RoundedCornerShape(Dimens.radiusField))
            .background(colors.surfaceFill)
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
