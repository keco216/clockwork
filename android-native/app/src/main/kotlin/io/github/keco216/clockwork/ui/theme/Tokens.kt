package io.github.keco216.clockwork.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.animation.core.CubicBezierEasing
import io.github.keco216.clockwork.R

/**
 * Die Design-Tokens der App — abgeschrieben von `src/styles/tokens.css`, und
 * zwar NACHPRUEFBAR abgeschrieben.
 *
 * ── Warum die Werte hier ein zweites Mal stehen ────────────────────────────
 * Weil Compose kein CSS liest. Quelle der Wahrheit bleibt trotzdem
 * `tokens.css`: Dort steht seit V9 das HeroUI-3.2.4-Theme, dort wird es
 * geaendert, und die native App ist nicht „daran angelehnt", sie IST es.
 *
 * Zwei handgepflegte Kopien derselben Zahl laufen unweigerlich auseinander —
 * genau so waren die beiden `theme-color`-Meta-Tags im Web drei Versionen lang
 * veraltet. Deshalb gibt es `scripts/native-theme-check.mjs`: Es liest
 * `tokens.css`, rechnet die oklab-Mischungen selbst aus und vergleicht sie mit
 * den Konstanten hier. Die Marke `// css: …` an jeder Zeile ist der Vertrag
 * zwischen beiden Dateien.
 *
 * ── Die Marke ist Absicht, kein Namensraten ───────────────────────────────
 * Das Skript koennte aus `radiusPanel` auch auf `--radius-panel` schliessen.
 * Dann faende es einen umbenannten Token nicht mehr und meldete „alles gruen" —
 * dieselbe Sorte stiller Fehlschlag wie ein `?.`, das einen Tippfehler
 * verschluckt.
 *
 * ── Wo die abgeleiteten Toene herkommen ───────────────────────────────────
 * `color-mix(in oklab, …)` rechnet im Web der Browser beim Zeichnen aus.
 * Compose kann das nicht, hier stehen deshalb konstante sRGB-Werte. Sie sind
 * nicht geschaetzt: Das Pruefskript rechnet die Mischung mit den
 * Ottosson-Matrizen nach, und die Rechnung ist einmal gegen Chromium gehalten
 * worden — 50 Werte in beiden Themes, 0 Abweichungen.
 */

/* ── Farben ─────────────────────────────────────────────────────────────── */

/**
 * Die Farbrollen. `@Immutable` ist kein Schmuck: Ohne die Zusage vergleicht
 * Compose bei jeder Neuzeichnung alle Felder und komponiert unnoetig neu.
 */
@Immutable
data class ClockworkColors(
    /** Der Seitengrund (HeroUI `--background`). */
    val ground: Color,
    /** Panel, Karte, Overlay (HeroUI `--surface`). */
    val surface: Color,
    /** Gefuellte Flaeche: Felder, neutrale Tasten (HeroUI `--default`). */
    val surfaceFill: Color,
    /** Beruehrt oder fokussiert — Panel 92 % + Textfarbe 8 %. */
    val surfaceActive: Color,
    /** Hover der gefuellten Flaeche (HeroUI `--default-hover`, 96/4). */
    val fillActive: Color,
    /** Flat-Taste und neutraler Chip: die halbe Fuellung. */
    val fillSoft: Color,
    /** Umgekehrte Flaeche — der Sprunglink. */
    val surfaceInverted: Color,

    /** Textstufe 1: mindestens 4,5:1 auf JEDER Flaeche der Leiter. */
    val ink: Color,
    val ink2: Color,
    val ink3: Color,
    val inkOnInverted: Color,

    /** Fuge zwischen Kanalzuegen. */
    val rule: Color,
    /** Die wenigen echten Umrisse. */
    val ruleStrong: Color,

    /** Der eine Akzent (HeroUI `--accent`). */
    val signal: Color,
    /** Die Schrift AUF Signal — gemessen, nicht uebernommen: Snow haelt dort
     *  nur 3,39:1, Eclipse 5,23.
     *
     *  Diese Rolle spiegelt weiter `--signal-ink` und wird von
     *  native-theme-check geprueft. Die native Taste benutzt sie seit N15
     *  NICHT mehr — siehe [signalKeyInk] samt Begruendung. */
    val signalInk: Color,

    /**
     * Die Schrift auf der SIGNAL-TASTE — eine bewusste Abweichung von
     * `--signal-ink`, auf Kevins Entscheidung (N15).
     *
     * ── Was hier passiert ist ─────────────────────────────────────────────
     * Der Testschluessel-Knopf ist mit N15 die Haupthandlung geworden, also
     * eine Flaeche in `--signal` (so steht es in index.html:320). Kevins
     * Ansage dazu: „aber die schrifttexte weiss."
     *
     * ── Die Folge, gemessen und ihm genannt ───────────────────────────────
     * Snow auf `--signal` haelt **3,30:1**, gedrueckt (`--signal-hover`) nur
     * **2,88:1**. Eine 14-sp-Beschriftung braucht nach WCAG AA 4,5:1. Genau
     * deshalb steht in tokens.css ueberhaupt `--signal-ink` (#18181b, 5,23:1)
     * — die Zahl ist dort seit V9 notiert.
     *
     * Ihm ist beides vorgelegt worden: Snow auf einem TIEFEREN Orange
     * (#a8360c, 6,40:1) haette weisse Schrift UND die Zusage gehalten. Er hat
     * das Markenorange gewaehlt. Das ist seine Entscheidung, sie ist mit der
     * Zahl daneben getroffen, und sie steht hier, damit sie nachlesbar bleibt
     * statt unbemerkt zu wirken.
     *
     * ── Warum eine eigene Rolle und nicht ein geaenderter Wert ────────────
     * Weil `--signal-ink` im WEB weiter #18181b ist und dort gilt. Den Wert in
     * Tokens.kt zu ueberschreiben hiesse, die Marke `// css:` zu entfernen und
     * damit einen der 92 geprueften Werte still aus der Pruefung zu nehmen —
     * dieselbe Sorte stiller Verlust, die dieses Projekt an anderen Stellen
     * teuer bezahlt hat. Diese Rolle traegt deshalb KEINE `// css:`-Marke: Sie
     * hat absichtlich kein Gegenstueck.
     */
    val signalKeyInk: Color,
    val signalHover: Color,
    /** Feine Geometrie: Schrift, Zeiger, Leuchten. */
    val signalText: Color,
    val signalSoft: Color,
    val signalSoftInk: Color,

    /** Fehler — bewusst NICHT der Akzent: Eine unlesbare Zeile ist kein
     *  Betriebszustand, sondern ein Eingabefehler. */
    val fault: Color,
    val faultSoft: Color,
    val faultSoftHover: Color,
    val faultSoftInk: Color,

    /** Der Switch-Daumen ist in BEIDEN Themes Snow — die Referenz traegt fest
     *  `bg-white`, und die Bahn spielt hell wie dunkel dieselben Rollen. */
    val switchThumb: Color,
    val scrollbarThumb: Color,

    /** Ob dieses Schema das dunkle ist. Die Erhebung haengt daran: Im Dunkeln
     *  gibt es KEINEN Schatten — `--elev-1: none` steht so in tokens.css, und
     *  bei HeroUI woertlich `--surface-shadow: transparent`. */
    val isDark: Boolean,
)

val LightColors = ClockworkColors(
    ground = Color(0xFFF5F5F5), // css: light --ground
    surface = Color(0xFFFFFFFF), // css: light --surface
    surfaceFill = Color(0xFFEBEBEC), // css: light --surface-fill
    surfaceActive = Color(0xFFEAEAEA), // css: light --surface-active
    fillActive = Color(0xFFE1E1E2), // css: light --fill-active
    fillSoft = Color(0x80EBEBEC), // css: light --fill-soft
    surfaceInverted = Color(0xFF18181B), // css: light --surface-inverted
    ink = Color(0xFF18181B), // css: light --ink
    ink2 = Color(0xFF52525C), // css: light --ink-2
    ink3 = Color(0xFF676770), // css: light --ink-3
    inkOnInverted = Color(0xFFFCFCFC), // css: light --ink-on-inverted
    rule = Color(0xFFE4E4E7), // css: light --rule
    ruleStrong = Color(0xFFDEDEE0), // css: light --rule-strong
    signal = Color(0xFFF05A28), // css: light --signal
    signalInk = Color(0xFF18181B), // css: light --signal-ink
    // abweichung: Snow statt --signal-ink, Kevins Entscheidung (N15) — 3,30:1
    signalKeyInk = Color(0xFFFCFCFC),
    signalHover = Color(0xFFF46D44), // css: light --signal-hover
    signalText = Color(0xFFA8360C), // css: light --signal-text
    signalSoft = Color(0x26F05A28), // css: light --signal-soft
    signalSoftInk = Color(0xFF863218), // css: light --signal-soft-ink
    fault = Color(0xFF9C2F1C), // css: light --fault
    faultSoft = Color(0x1F9C2F1C), // css: light --fault-soft
    faultSoftHover = Color(0x2E9C2F1C), // css: light --fault-soft-hover
    faultSoftInk = Color(0xFF9C2F1C), // css: light --fault-soft-ink
    switchThumb = Color(0xFFFCFCFC), // css: light --switch-thumb
    scrollbarThumb = Color(0x2618181B), // css: light --scrollbar-thumb
    isDark = false,
)

val DarkColors = ClockworkColors(
    ground = Color(0xFF060607), // css: dark --ground
    surface = Color(0xFF18181B), // css: dark --surface
    surfaceFill = Color(0xFF27272A), // css: dark --surface-fill
    surfaceActive = Color(0xFF27272A), // css: dark --surface-active
    fillActive = Color(0xFF2E2E31), // css: dark --fill-active
    fillSoft = Color(0x8027272A), // css: dark --fill-soft
    surfaceInverted = Color(0xFFFCFCFC), // css: dark --surface-inverted
    ink = Color(0xFFFCFCFC), // css: dark --ink
    ink2 = Color(0xFFC2C2C9), // css: dark --ink-2
    ink3 = Color(0xFF9F9FA9), // css: dark --ink-3
    inkOnInverted = Color(0xFF18181B), // css: dark --ink-on-inverted
    rule = Color(0xFF212124), // css: dark --rule
    ruleStrong = Color(0xFF28282C), // css: dark --rule-strong
    signal = Color(0xFFF05A28), // css: dark --signal
    signalInk = Color(0xFF18181B), // css: dark --signal-ink
    // abweichung: dieselbe Zahl in BEIDEN Themes — die Flaeche darunter ist in
    // beiden `--signal`, also darf die Tinte darauf nicht mit dem Theme kippen.
    signalKeyInk = Color(0xFFFCFCFC),
    signalHover = Color(0xFFF46D44), // css: dark --signal-hover
    signalText = Color(0xFFF4825C), // css: dark --signal-text
    signalSoft = Color(0x1FF05A28), // css: dark --signal-soft
    signalSoftInk = Color(0xFFF98B6A), // css: dark --signal-soft-ink
    fault = Color(0xFFE88B7A), // css: dark --fault
    faultSoft = Color(0x3D9C2F1C), // css: dark --fault-soft
    faultSoftHover = Color(0x529C2F1C), // css: dark --fault-soft-hover
    faultSoftInk = Color(0xFFE88B7A), // css: dark --fault-soft-ink
    switchThumb = Color(0xFFFCFCFC), // css: dark --switch-thumb
    scrollbarThumb = Color(0x26FCFCFC), // css: dark --scrollbar-thumb
    isDark = true,
)

/* ── Masse ──────────────────────────────────────────────────────────────── */

/**
 * Abstaende, Radien und Hoehen.
 *
 * Die Umrechnung ist 1 CSS-px der Mobil-Referenz = 1 dp, rem × 16. Das ist
 * keine Naeherung: Beide Einheiten sind als „ungefaehr 1/160 Zoll" definiert,
 * und die Web-Fassung rechnet mobil ohnehin in genau diesen Punkten.
 */
object Dimens {
    // Die Skala: acht Sprossen, keine dazwischen (V8-Regel, unveraendert).
    val sp1 = 4.dp // css: --sp-1
    val sp2 = 8.dp // css: --sp-2
    val sp3 = 12.dp // css: --sp-3
    val sp4 = 16.dp // css: --sp-4
    val sp5 = 24.dp // css: --sp-5
    val sp6 = 32.dp // css: --sp-6
    val sp7 = 48.dp // css: --sp-7
    val sp8 = 64.dp // css: --sp-8

    // Abstaende nach ROLLE — gleiche Beziehungen bekommen nie zwei Luecken.
    val gapPair = 8.dp // css: --gap-pair
    val gapStack = 16.dp // css: --gap-stack
    val gapGroup = 24.dp // css: --gap-group

    val radiusPanel = 24.dp // css: --radius-panel
    val radiusItem = 16.dp // css: --radius-item
    val radiusField = 12.dp // css: --radius-field
    val radiusInset = 8.dp // css: --radius-inset

    /**
     * Die Pille. In CSS steht 999px, weil ein Radius groesser als die halbe
     * Hoehe ohnehin auf sie klemmt; in Compose gilt dasselbe. Der Wert ist
     * bewusst uebernommen statt durch eine Prozentform ersetzt — das
     * Pruefskript vergleicht Zahlen, und eine Prozentform waere keine.
     */
    val radiusKey = 999.dp // css: --radius-key

    /**
     * Hoehenleiter — die MOBILWERTE. Die Web-Fassung schaltet ab 48 rem auf
     * 36/40 herunter; diese App ist eine Telefon-App im Hochformat, also gilt
     * durchgehend die Touch-Stufe.
     */
    val controlH = 40.dp // css: --control-h
    val controlHLg = 44.dp // css: --control-h-lg
    val controlHSm = 36.dp // css: --control-h-sm
    val touchMin = 44.dp // css: --touch-min
    val chipH = 24.dp // css: --chip-h

    val dialSize = 104.dp // css: --dial-size

    /** Unter dieser Breite traegt die Karte das Kompaktraster (V10). */
    val compactCardWidth = 420.dp
}

/**
 * Unter dieser FENSTERbreite rueckt die Buehne naeher an den Rand.
 *
 * Die Web-Fassung schaltet bei `@media (max-width: 34rem)` um — 34 × 16 =
 * **544 px** (`src/style.css`, dort wird `--device-pad` von `--gap-group` auf
 * `--sp-4` gesetzt). Das ist eine ANDERE Schwelle als die 420 dp des
 * Kompaktrasters, und sie hat auch einen anderen Grund: Beim Kompaktraster
 * geht es um die Anordnung IN der Karte, hier um den Platz DANEBEN.
 */
private const val DEVICE_PAD_BELOW_DP = 544

/**
 * Der seitliche Rand der Buehne — `--device-pad` der Web-Fassung.
 *
 * ── Warum es diesen Wert gibt (P9, gemessen am 15.08.2026) ────────────────
 * Bis P9 stand an beiden Buehnen fest `Dimens.gapGroup`, also 24 dp. Die
 * Web-Fassung nimmt unter 34 rem aber nur 16 — und der Unterschied ist
 * sichtbar, nicht theoretisch. Gemessen an den Kartenkanten der
 * P9-Vergleichsbilder bei gleicher logischer Breite (374,8 dp):
 *
 *     Web    Rand links/rechts 16,0 dp   Karte 343,0 dp breit
 *     Nativ  Rand links/rechts 23,9 dp   Karte 326,9 dp breit
 *
 * Die native Karte war also 16 dp schmaler als dieselbe Karte im Web. Nach
 * der Auftragsregel aus N6 ist eine sichtbare Abweichung ein Fehler und wird
 * gefixt, nicht notiert.
 *
 * Ein eigener Wert und nicht einfach `sp4`: Oberhalb der Schwelle gilt weiter
 * 24 dp, genau wie im Web. Ein Telefon im Hochformat liegt praktisch immer
 * darunter, ein Tablet oder das Querformat nicht — und dort waere der enge
 * Rand falsch.
 */
val Dimens.devicePad: Dp
    @Composable
    @ReadOnlyComposable
    get() = if (LocalConfiguration.current.screenWidthDp < DEVICE_PAD_BELOW_DP) sp4 else gapGroup

/**
 * Das INNENmass einer Karte — `--panel-pad` der Web-Fassung.
 *
 * Es faellt unter derselben Schwelle und auf denselben Wert wie
 * [devicePad]; im Web stehen die beiden Zeilen woertlich untereinander
 * (`src/style.css`, `@media (max-width: 34rem)`). Sie trotzdem als ZWEI Werte
 * zu fuehren ist Absicht und nicht Umstaendlichkeit: Der eine misst den Platz
 * NEBEN der Karte, der andere den DARIN. Wer spaeter einen davon aendert,
 * soll nicht ungewollt den anderen mitnehmen — und die Web-Fassung fuehrt sie
 * aus demselben Grund getrennt.
 *
 * Gemessen an der „Kopieren"-Taste der P9-Vergleichsbilder, die in beiden
 * Fassungen ueber die volle Kartenbreite spannt (374,8 dp logische Breite):
 *
 *     Web    Innenmass links/rechts 17,5 dp
 *     Nativ  Innenmass links/rechts 25,3 dp
 *
 * Die 1,5 dp ueber dem Nennwert sind die Rundung der Pille und stehen auf
 * beiden Seiten gleich — der Unterschied der beiden Fassungen sind die
 * 8 dp der Sprosse.
 *
 * Es gilt ueberall, wo bisher `gapGroup` als KARTENINNENMASS stand: am Polster
 * der Karte selbst, an den Listenzeilen und an ihren Haarlinien. NICHT
 * betroffen ist der senkrechte Rhythmus (`--gap-group` bleibt im Web auch
 * mobil 24) und nicht die Fuge zwischen den Spalten im Kartenraster.
 */
val Dimens.panelPad: Dp
    @Composable
    @ReadOnlyComposable
    get() = if (LocalConfiguration.current.screenWidthDp < DEVICE_PAD_BELOW_DP) sp4 else gapGroup

/* ── Schrift ────────────────────────────────────────────────────────────── */

/**
 * Die zwei Familien, beide als variable TTF unter `res/font/`.
 *
 * Warum TTF und nicht die woff2 aus `src/assets/fonts/`: Android liest woff2
 * nicht. Es sind deshalb die offiziellen Releases — Inter 4.1 (rsms/inter) und
 * Chivo Mono aus google/fonts —, nicht die Subsets des Web-Bundles. Der Preis
 * steht in P9 als gemessene APK-Groesse; kuerzen liesse er sich nur mit
 * fonttools, und auf dieser Maschine gibt es kein Python.
 *
 * Variable Fonts als Ressource brauchen API 26 — genau die Untergrenze dieser
 * App. Ohne sie muessten hier vier statische Schnitte je Familie liegen.
 */
object Fonts {
    val ui = FontFamily(Font(R.font.inter_variable))
    val mono = FontFamily(Font(R.font.chivo_mono_variable))

    /**
     * Die Wortmarke bleibt in JEDER Sprache lateinisch — ein Logo wird nicht
     * uebersetzt. Eigenes Feld, weil `ui` bei nichtlateinischen Schriften auf
     * das System zurueckfaellt (die Entsprechung zu `styles/scripts.css`),
     * diese Zeile aber nicht.
     */
    val brand = ui
}

/**
 * Die Typo-Treppe der Referenz: xs 12 · sm 14 · base 16 · lg 18.
 *
 * `--t-small` und `--t-body` tragen bewusst denselben Wert — zwei ROLLEN auf
 * einer Stufe, wie Label und Feldtext bei HeroUI. Ein Token je Rolle, damit
 * eine spaetere Trennung eine Zeile kostet und keinen Umbau.
 */
object Typo {
    val micro = 12.sp // css: --t-micro
    val small = 14.sp // css: --t-small
    val body = 14.sp // css: --t-body
    val lead = 18.sp // css: --t-lead
    val mark = 18.sp // css: --t-mark

    /** Das Zifferblatt klemmt zwischen diesen beiden Groessen. */
    val dialMin = 40.sp // css: --t-dial-min
    val dialMax = 72.sp // css: --t-dial-max

    val weightNormal = FontWeight.Normal
    val weightMedium = FontWeight.Medium // Label, Tasten, Kartentitel
    val weightSemibold = FontWeight.SemiBold // Kontoname
    val weightDial = FontWeight(450) // css: --wght-dial

    val lineHeightTight = 1.15f
    val lineHeightNormal = 1.5f
}

/* ── Bewegung ───────────────────────────────────────────────────────────── */

/**
 * Der Takt der Referenz. Die Federkurve ist Zeichen fuer Zeichen HeroUIs
 * `--ease-out-fluid`.
 *
 * Der Zeiger des Zifferblatts benutzt NICHTS davon: Er rechnet linear mit der
 * Uhr. Eine Federkurve auf einer Zeitanzeige waere eine Luege ueber die Zeit.
 */
object Motion {
    val flash = 100 // css: --dur-flash
    val quick = 150 // css: --dur-quick
    val snap = 190 // css: --dur-snap
    val calm = 250 // css: --dur-calm
    val glide = 300 // css: --dur-glide
    val sheet = 350 // css: --dur-sheet
    val spin = 750 // css: --dur-spin
    val staggerFlap = 20 // css: --stagger-flap

    /** cubic-bezier(0.32, 0.72, 0, 1) — css: --ease-spring */
    val spring = CubicBezierEasing(0.32f, 0.72f, 0f, 1f)

    /** cubic-bezier(0.2, 0.85, 0.3, 1) — css: --ease-snap */
    val snapEasing = CubicBezierEasing(0.2f, 0.85f, 0.3f, 1f)
}

/* ── Zifferblatt ────────────────────────────────────────────────────────── */

/**
 * Die Proportionen aus `branding/clockwork-logo-a-skala.svg`. Das Instrument
 * in der App IST die Marke — dieselben Verhaeltnisse wie im Emblem, nur mit
 * drehendem Zeiger.
 */
object Dial {
    const val TICK_COUNT = 30
    const val TICK_LENGTH = 0.2f // css: --dial-tick-len
    const val HAND_LENGTH = 0.3f // css: --dial-hand-len
    const val TICK_WIDTH = 0.048f // css: --dial-tick-w
    const val HAND_WIDTH = 0.073f // css: --dial-hand-w
    const val HUB = 0.052f // css: --dial-hub
}

/* ── Der Zugriff ────────────────────────────────────────────────────────── */

/**
 * `staticCompositionLocalOf`, nicht `compositionLocalOf`: Das Farbschema
 * wechselt nur, wenn das ganze System umschaltet — und dann wird ohnehin alles
 * neu gezeichnet. Die dynamische Variante wuerde bei jedem Lesen eine
 * Abhaengigkeit vermerken, die nie ausloest.
 */
val LocalColors = staticCompositionLocalOf { LightColors }
