package io.github.keco216.clockwork.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.absoluteOffset
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.AbsoluteAlignment
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInParent
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import io.github.keco216.clockwork.ui.theme.ClockworkColors
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.Motion
import io.github.keco216.clockwork.ui.theme.TextStyles
import kotlinx.coroutines.launch

/**
 * Die zwei Seiten der App.
 *
 * ── Warum es sie ueberhaupt gibt (N11) ────────────────────────────────────
 * Die Web-Fassung ist EINE Seite. Man scrollt, und unten stehen Fuss,
 * Sprachwahl und Tresor-Konfiguration im Fluss — das fuehlt sich nach
 * Webseite an, nicht nach App. Kevins Entscheidung: Die STRUKTUR darf nativ
 * abweichen, die DESIGNSPRACHE nicht.
 *
 * Der Schnitt folgt einer Frage: Wird das hier BEDIENT oder KONFIGURIERT?
 * Der Tresor-Zustand samt Aufsperren bleibt deshalb vorn — wer die App
 * oeffnet, landet genau davor, und die Codes haengen daran. Die Zeitschaltung
 * dagegen stellt man einmal ein und nie wieder.
 */
enum class Page {
    Home,
    Settings,
}

/**
 * Die untere Navigation als schwebende, TRANSLUZENTE Pillen-Karte (N13).
 *
 * ── Woher die Anmutung kommt ──────────────────────────────────────────────
 * Kevins Vorgabe ist die Tab-Leiste aus One UI 8.5, die Samsung gerade durch
 * Telefon, Galerie, Uhr und Nachrichten rollt. Uebernommen sind drei ihrer
 * Merkmale: die milchige Flaeche, durch die der Inhalt sichtbar durchlaeuft;
 * Zeichen MIT Beschriftung; und die aktive Wahl als kompakte Hervorhebung eng
 * um ihren Posten statt als segmentbreiter Block.
 *
 * NICHT uebernommen ist Samsungs Bewegung. Die dortigen Leisten schalten hart
 * um; hier faehrt die Pille weiter in 250 ms auf der Federkurve des Hauses.
 * Eine Anmutung zu leihen heisst nicht, ihre Schwaechen mitzunehmen.
 *
 * ── Was N12 war, und was N13 daran aendert ────────────────────────────────
 * N12 hat die Leiste zum Schweben gebracht: Karte statt Balken, Abstand statt
 * Fuge, konzentrische Radien. Das bleibt alles. Drei Dinge kommen dazu:
 *
 * 1. Die Flaeche ist nicht mehr deckend, sondern `--surface` mit 90 % (N13: 82 %).
 * 2. Die Pille umschliesst nur noch Zeichen und Beschriftung, nicht mehr das
 *    ganze Segment — und sie ist als einziges Bauteil der Leiste DECKEND.
 * 3. Die inaktive Beschriftung steigt von `--ink-3` auf `--ink-2`.
 *
 * Die Punkte 2 und 3 sehen aus wie Geschmack und sind Rechnung. Beide stehen
 * unten bei [NAV_FROST_LIGHT] beziehungsweise [NavItem] begruendet, und beide
 * misst `scripts/native-nav-contrast.mjs` bei jedem Lauf nach.
 *
 * ── Warum die Radien ineinander passen ────────────────────────────────────
 * Karte und Pille tragen beide `--radius-key`, und der klemmt auf die halbe
 * Hoehe. Die Karte ist genau um ihr Polster hoeher als die Pille, also ist die
 * Differenz der Radien genau dieses Polster — die Rundungen sind KONZENTRISCH.
 * Das gilt seit N13 nicht mehr durch zwei ausgerechnete Zahlen, sondern durch
 * den Bau: Die Kartenhoehe IST die Pillenhoehe plus zweimal Polster.
 *
 * ── Der gleitende Cursor ──────────────────────────────────────────────────
 * HeroUI zieht unter seinen Tabs einen Cursor, der beim Wechsel an seine neue
 * Stelle FAEHRT (250 ms, Federkurve). Er faehrt seit N13 nur noch im ORT: Die
 * Pillen sind alle gleich breit (Begruendung unten bei [pillWidth]), und eine
 * Breite, die sich nicht aendert, braucht keine zweite Spur.
 *
 * Beim ERSTEN Mal springt er trotzdem: Wer die App auf der Einstellungen-Seite
 * verlaesst und wieder oeffnet, saehe sonst eine Fahrt, die nichts erklaert —
 * es hat ja niemand umgeschaltet. Deshalb `snapTo` vor der ersten Fahrt.
 *
 * ── Reduzierte Bewegung ───────────────────────────────────────────────────
 * Ohne eigene Abfrage: `Animatable.animateTo` haengt an der Animator-Skala des
 * Systems (`MotionDurationScale`). Steht sie auf 0, springt der Cursor — genau
 * das, was `prefers-reduced-motion` im Web verlangt.
 *
 * ── Was NICHT wartet ──────────────────────────────────────────────────────
 * Der Seiteninhalt wechselt SOFORT. Nur der Cursor faehrt. „Tippen darf nicht
 * warten" ist die aeltere Hausregel und schlaegt die Fahrt.
 */
@Composable
fun BottomNav(
    current: Page,
    onSelect: (Page) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalColors.current
    val density = LocalDensity.current
    val cardShape = RoundedCornerShape(Dimens.radiusKey)
    val pillShape = RoundedCornerShape(Dimens.radiusKey)

    /* ── Die Lage der Pille wird in ZWEI Stuecken gemessen ──────────────────
       Die Pille umschliesst seit N13 nur noch Zeichen und Beschriftung. Deren
       Lage steht in zwei verschiedenen Koordinatensystemen: Das Segment kennt
       seinen Ort in der Reihe, der Inhalt seinen Ort IM Segment. Beide werden
       getrennt gehalten und erst beim Zeichnen addiert.

       Warum nicht in einem Zug: Ein `onGloballyPositioned` liefert immer
       Koordinaten relativ zum eigenen Elternteil. Ein Aufruf, der den Inhalt
       misst und dabei die zuletzt gesehene Segmentlage aus einer Variablen
       dazuzaehlt, haengt daran, welcher der beiden Rueckrufe in diesem
       Durchgang zuerst kam — und beim naechsten Durchgang feuert vielleicht
       nur einer. Zwei Zustaende, beim Zeichnen addiert, koennen diesen Fehler
       nicht machen: Aendert sich einer, komponiert Compose neu, und die Summe
       stimmt wieder.

       Warum nicht gerechnet („Inhalt sitzt mittig, also ist x = (Segment −
       Inhalt) / 2"): Weil das die Ausrichtungsregel ein zweites Mal
       hinschriebe. Wer die Zentrierung spaeter aendert, aendert sie dann an
       einer Stelle, und die Pille steht woanders als ihr Posten. */
    var segments by remember { mutableStateOf(mapOf<Page, Float>()) }
    var contents by remember { mutableStateOf(mapOf<Page, NavSlot>()) }

    /* ── Alle Pillen sind GLEICH gross ─────────────────────────────────────
       Der erste N13-Entwurf liess jede Pille genau ihren eigenen Inhalt
       umschliessen. Das ist die woertliche Lesart von „eng um Icon und
       Beschriftung" — und am Geraet war es falsch: „Start" bekam 51 dp,
       „Einstellungen" 100. Kevins Befund dazu ist knapp und richtig: Zwei
       gleich breite Posten mit zwei verschieden grossen Hervorhebungen sehen
       aus wie ein Fehler, nicht wie ein System.

       Das Mass gibt deshalb der BREITESTE Inhalt vor, und alle tragen es.
       Damit bleibt die Pille kompakt (sie umschliesst die laengste
       Beschriftung eng), ohne dass ihre Groesse davon erzaehlt, wie lang ein
       Wort zufaellig ist. In einer anderen Sprache verschiebt sich das Mass
       mit — gemessen wird ja, nicht gerechnet.

       Nebenwirkung, und eine gute: Die Fahrt hat nur noch EINE Spur. Der
       Cursor faehrt im Ort, seine Breite steht fest. */
    val pillWidth = contents.values.maxOfOrNull { it.width }
    val pillHeight = contents.values.maxOfOrNull { it.height }

    /* Die linke Kante des aktiven Segments — und die IST die der Pille (N14).

       Seit die Leiste ihren Inhalt umschliesst (siehe unten), sind Segment und
       Pille dasselbe Rechteck: Jedes Segment ist so breit wie der breiteste
       Inhalt, und die Pille deckt es genau. Die Zwischenrechnung „Mitte des
       Inhalts minus halbe Pille" aus N13 ist damit hinfaellig — sie hat einen
       Unterschied ausgeglichen, den es nicht mehr gibt. */
    val target = segments[current]

    val cursorX = remember { Animatable(0f) }
    var placed by remember { mutableStateOf(false) }

    LaunchedEffect(target) {
        val goal = target ?: return@LaunchedEffect
        if (!placed) {
            placed = true
            cursorX.snapTo(goal)
            return@LaunchedEffect
        }
        cursorX.animateTo(goal, tween(Motion.calm, easing = Motion.spring))
    }

    Box(
        modifier = modifier
            /* ── Die Leiste UMSCHLIESST ihre Posten (N14) ──────────────────
               Bis N13 lief sie ueber die volle Fensterbreite. Kevins Vorbild
               tut das nicht: Die Tab-Leiste in One UI 8.5 ist eine schmale,
               zentrierte Karte, die genau so breit ist wie das, was drin
               steht — in Telefon und Kontakte gemessen etwa 60 % der
               Fensterbreite.

               Kein `fillMaxWidth` also. Die Karte nimmt die Breite ihres
               Inhalts, `align(BottomCenter)` beim Aufrufer zentriert sie, und
               die seitlichen 16 dp sind seither ein MINDESTABSTAND zur
               Fensterkante statt eines Randes an einem randbreiten Balken.

               Das aendert nebenbei die Trefferflaechen: Ein Posten ist nicht
               mehr eine halbe Fensterbreite, sondern so breit wie sein
               Inhalt. Das ist der Preis der Vorlage, und er ist vertretbar —
               100 dp mal 46 dp liegen weit ueber der 44-dp-Regel des
               Hauses. */
            /* Seitlich `--sp-4`, unten `--sp-3`. Die Safe-Area kommt NICHT von
               hier: `ClockworkApp` legt `systemBarsPadding()` um alles, die
               Karte sitzt also schon ueber der Gestenleiste. Es hier noch
               einmal zu setzen ergaebe die doppelte Fuge.

               Das Referenz-Argument fuer diese drei Zahlen ist die Reichweite
               des Daumens: Eine Leiste, die an der Fensterkante klebt, liegt
               im unbequemsten Streifen des Schirms. Die 12 dp nach unten holen
               sie aus ihm heraus, ohne Flaeche zu verschenken. */
            .padding(start = Dimens.sp4, end = Dimens.sp4, bottom = Dimens.sp3)
            /* `--elev-2`, die Overlay-Ebene: Sie schwebt UEBER dem Inhalt, der
               unter ihr durchlaeuft. Hell ist das der Schatten der Referenz,
               dunkel ihre 1-px-Innenlichtkante (`inset 0 0 1px rgb(255 255 255
               / 30%)`) — auf Fast-Schwarz haette ein Schatten nichts, worauf
               er fiele.

               Die drei Lagen der CSS-Fassung (2/8, -6/12 und 14/28 px bei 6,
               3 und 8 %) kann Compose nicht stapeln; genommen ist die
               dominante dritte. Das ist eine ANNAEHERUNG und steht hier als
               solche — wie schon bei `--elev-1` am Panel.

               Seit N13 scheint der Schatten durch die Karte hindurch, weil die
               nicht mehr deckt. Gemessen ist der Effekt 18 % von 8 % Schwarz,
               also gut ein Prozent Abdunklung — unter der Wahrnehmungsschwelle
               und in der Kontrastrechnung auf der sicheren Seite (im Hellen
               dunkelt er den Grund unter dunkler Schrift, was den Abstand
               vergroessert statt ihn zu fressen). */
            .then(
                if (colors.isDark) {
                    Modifier
                } else {
                    Modifier.shadow(
                        elevation = 12.dp,
                        shape = cardShape,
                        ambientColor = Color.Black.copy(alpha = 0.08f),
                        spotColor = Color.Black.copy(alpha = 0.08f),
                    )
                },
            )
            .clip(cardShape)
            .background(navFrost(colors))
            /* ── Die Umrandung ist WEG (N14) ────────────────────────────────
               N13 hatte hier eine Kante: hell eine Haarlinie in `--rule`,
               dunkel die 1-px-Innenlichtkante. Der Grund war gut — bei 82 %
               Deckung ueber einer weissen Karte war die Leiste genau so hell
               wie ihr Untergrund und verschwand.

               Kevins Befund am Vorbild: „Die Pillen-Umrandung sieht nicht
               gleich aus wie beim Samsung." Er hat recht, und zwar an beiden
               Enden — Samsungs Leiste hat GAR keine Kante. Sie trennt sich
               allein durch ihre Flaeche.

               Der Grund, der die Kante noetig machte, ist mit N14 entfallen:
               Unter der Leiste liegt jetzt die Abblendung, ihr Untergrund ist
               also verlaesslich `--ground` und nicht mehr irgendeine Karte.
               Damit steht hell #fefefe auf #f5f5f5 (plus Schatten) und dunkel
               #161618 auf #060607 — beides ein sichtbarer Sprung, und beides
               ohne Strich.

               Eine Kante, deren Anlass weggefallen ist, gehoert entfernt und
               nicht aus Gewohnheit behalten. */
            .padding(NAV_CARD_PADDING),
    ) {
        // Die Pille liegt HINTER den Posten — sie ist Hintergrund, kein
        // Aufsatz. Deshalb steht sie vor der Reihe im Baum.
        if (placed && pillWidth != null && pillHeight != null) {
            Box(
                modifier = Modifier
                    /* ABSOLUT und nicht logisch — beides, die Ausrichtung und
                       der Versatz.

                       Gemessen wird mit `positionInParent().x`, und das ist
                       eine PHYSISCHE Koordinate: linke Kante, von links
                       gezaehlt, in jeder Schreibrichtung. `offset` und
                       `Alignment.CenterStart` sind dagegen LOGISCH — auf
                       Arabisch zaehlen sie von rechts. Wer das eine misst und
                       das andere setzt, bekommt eine Pille, die auf Deutsch
                       stimmt und auf Arabisch unter dem falschen Posten steht.
                       Genau so gemessen, bevor diese Zeilen `absolute`
                       hiessen. */
                    .absoluteOffset(x = with(density) { cursorX.value.toDp() })
                    .width(with(density) { pillWidth.toDp() })
                    .height(with(density) { pillHeight.toDp() })
                    .align(AbsoluteAlignment.CenterLeft)
                    /* ── NEUTRAL, nicht orange (N14, Kevins Entscheidung) ──
                       Bis N13 trug die Pille `--signal-soft`. Kevin hat die
                       Leiste an One UI 8.5 gehalten — dort ist die aktive
                       Wahl eine graue Flaeche mit normaler Schrift, und er
                       will das so. Uebrig vom Akzent bleibt das ZEICHEN des
                       aktiven Postens; die Beschriftung steht in `--ink`.

                       Das ist auch nach der Hausregel die sauberere Fassung:
                       Der Akzent gehoert Zustaenden mit BEDEUTUNG. „Ich bin
                       hier" ist Ortsangabe, keine Meldung — und der Ort ist
                       schon durch die Flaeche markiert. Ein zweites Signal
                       daneben waere doppelt gemoppelt.

                       `--surface-active` ist die Sprosse der Flaechenleiter
                       fuer „beruehrt" und damit die naechstliegende
                       Hervorhebung, die das System schon kennt. DECKEND
                       bleibt sie: Der Untergrund des aktiven Postens soll
                       nicht davon abhaengen, was gerade darunter scrollt. */
                    .background(colors.surfaceActive, pillShape),
            )
        }

        /* Kein `fillMaxWidth` mehr: Die Reihe ist so breit wie ihre Posten,
           und die Karte darum ist es damit auch.

           Gleich breit werden die Posten ueber `widthIn(min = …)` mit dem
           breitesten gemessenen Inhalt. Das ist die wrap-content-Fassung von
           `weight(1f)`: Der schmalere waechst auf das Mass des breiteren, der
           breitere bleibt, wie er ist. Vor der ersten Messung steht dort
           `Dp.Unspecified` — dann traegt jeder Posten kurz seine eigene
           Breite, und das eine Bild sieht niemand. */
        val equal = pillWidth?.let { with(density) { it.toDp() } } ?: Dp.Unspecified

        Row {
            NavItem(
                label = text("native.nav.home"),
                selected = current == Page.Home,
                onSelect = { onSelect(Page.Home) },
                shape = pillShape,
                onSegment = { x -> segments = segments + (Page.Home to x) },
                onContent = { measured -> contents = contents + (Page.Home to measured) },
                modifier = Modifier.widthIn(min = equal),
            ) { tint, turn -> DialGlyph(tint, turn = turn) }

            NavItem(
                label = text("native.nav.settings"),
                selected = current == Page.Settings,
                onSelect = { onSelect(Page.Settings) },
                shape = pillShape,
                onSegment = { x -> segments = segments + (Page.Settings to x) },
                onContent = { measured -> contents = contents + (Page.Settings to measured) },
                modifier = Modifier.widthIn(min = equal),
            ) { tint, turn -> GearGlyph(tint, turn = turn) }
        }
    }
}

/** Die gemessene Lage eines Pillen-Inhalts, in Pixeln. */
private data class NavSlot(val x: Float, val width: Float, val height: Float)

/**
 * Ein Segment der Leiste: Zeichen oben, Beschriftung darunter.
 *
 * `selectable` und nicht `clickable`: Damit meldet das Segment der
 * Bedienungshilfe seine Rolle (Tab) UND ob es das gewaehlte ist. Ein Knopf,
 * der nur „angetippt werden kann", laesst einen Screenreader raten, wo man
 * gerade steht.
 *
 * ── Die Trefferflaeche bleibt breit, die Pille wird schmal ────────────────
 * Beide Segmente sind ueber `weight(1f)` weiterhin EXAKT gleich breit, und
 * angetippt wird das ganze Segment. Nur die Hervorhebung ist seit N13 eng.
 * Das ist kein Widerspruch, sondern die uebliche Trennung: Was man TRIFFT,
 * ist grosszuegig; was man SIEHT, ist genau. Eine Pille, die die halbe Leiste
 * einfaerbt, behauptet eine Ausdehnung, die der Posten nicht hat.
 *
 * ── Warum die inaktive Beschriftung `--ink-2` traegt und nicht `--ink-3` ──
 * Ausgerechnet, nicht ausgehandelt. Durch die transluzente Leiste scheint
 * Inhalt; im schlechtesten Fall eine Code-Ziffer in `--ink`, die den
 * Untergrund abdunkelt. `--ink-3` haelt auf `--surface` 5,53:1 und reisst bei
 * 82 % Deckung mit 4,07 die Grenze — genau der Wert, den N13 gewaehlt hatte.
 *
 * **Bei den 90 % aus N14 wuerde auch `--ink-3` halten**, und zwar knapp: Die
 * Schwelle liegt bei 90 % (hell) beziehungsweise 87 % (dunkel). Es bleibt
 * trotzdem bei `--ink-2`, aus zwei Gruenden: Eine Deckung, die auf der
 * Schwelle steht, hat keine Reserve fuer die naechste Aenderung — und wer die
 * Deckung spaeter wieder senkt (etwa weil ein echter Weichzeichner moeglich
 * wird), soll nicht in derselben Bewegung eine Textfarbe nachziehen muessen.
 *
 * Die Regel dahinter ist alt: Im Web traegt Text auf dem GEHAEUSE `--ink-2`
 * und nur Text auf einem PANEL `--ink-3`. Eine Leiste, durch die beliebiger
 * Inhalt scheint, ist der Gehaeusefall in seiner unangenehmsten Form — ihr
 * Untergrund steht nicht einmal fest.
 */
@Composable
private fun NavItem(
    label: String,
    selected: Boolean,
    onSelect: () -> Unit,
    shape: Shape,
    onSegment: (Float) -> Unit,
    onContent: (NavSlot) -> Unit,
    modifier: Modifier = Modifier,
    glyph: @Composable (Color, Float) -> Unit,
) {
    val colors = LocalColors.current
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val focused by interaction.collectIsFocusedAsState()

    // Derselbe Druckpunkt wie an jeder Taste: 3 % nachgeben auf der Feder.
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.97f else 1f,
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "nav-press",
    )

    /* Drei Toene, nicht zwei (N14): Das ZEICHEN des aktiven Postens traegt den
       Akzent, seine BESCHRIFTUNG die volle Tinte, und der inaktive Posten
       beides in `--ink-2`.

       Der Grund fuer die Trennung ist Lesbarkeit, nicht Schmuck: Ein Wort in
       `--signal-text` auf einer neutralen Pille steht zwar ueber 4,5:1, wirkt
       neben dem inaktiven Wort aber wie eine andere Schrift. Ein ZEICHEN
       vertraegt die Farbe, weil es keine Buchstabenformen hat, die man
       vergleicht.

       ── Und beide FAHREN (N14) ─────────────────────────────────────────────
       Bis hierher sprang die Farbe hart um, waehrend die Pille 250 ms lang
       fuhr. Das sah aus, als gehoerten die beiden nicht zusammen: Die Flaeche
       war noch unterwegs, der Text schon angekommen. Jetzt laufen alle drei
       Spuren auf derselben Dauer und derselben Kurve — Pille, Zeichenfarbe,
       Schriftfarbe. Genau das ist es, was Samsungs Leisten geschlossen wirken
       laesst. */
    val glyphTint by animateColorAsState(
        targetValue = if (selected) colors.signalText else colors.ink2,
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "nav-glyph",
    )
    val labelTint by animateColorAsState(
        targetValue = if (selected) colors.ink else colors.ink2,
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "nav-label",
    )

    /* ── Der Sprung des Zeichens ──────────────────────────────────────────
       Wer umschaltet, soll sehen, WOHIN — nicht nur, dass sich etwas bewegt.
       Das frisch gewaehlte Zeichen geht deshalb kurz auf 112 % und wieder
       zurueck. Es ist die einzige Bewegung der Leiste, die nicht gleitet,
       und sie dauert absichtlich nur `--dur-snap` (190 ms): Ein Sprung, der
       so lang ist wie eine Fahrt, wird zum Wackeln.

       `Animatable` und nicht `animateFloatAsState`, aus demselben Grund wie
       beim Cursor: Der Wert soll beim ersten Bild schon am Ziel stehen und
       nicht von dort losfahren. Nur ein WECHSEL loest den Sprung aus,
       gemerkt an `previously`. */
    val turn = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()

    /* ── Die Beruehrung bekommt eine eigene Flaeche (N14) ──────────────────
       Kevins Befund am Vorbild: Samsungs Leiste zeigt auch am BERUEHRTEN
       Posten eine Pille — schwaecher als die des aktiven, aber sichtbar. In
       seinem Bild traegt „Letzte" sie, waehrend „Kontakte" gewaehlt ist.

       Das ist mehr als Zierrat: Zwischen Antippen und Seitenwechsel liegt
       zwar keine Wartezeit (der Inhalt wechselt sofort), aber der Finger
       verdeckt die Stelle. Wer danebentippt, sieht sonst nirgends, was er
       getroffen hat.

       Zwei Stufen, weil es zwei Ausgangslagen gibt: Der inaktive Posten
       bekommt `--surface-active` (die Sprosse „beruehrt"), der aktive
       `--fill-active` — unter ihm liegt schon die Pille, und eine Beruehrung
       muss auch DARAUF sichtbar sein. */
    val touch by animateColorAsState(
        targetValue = when {
            !pressed -> Color.Transparent
            selected -> colors.fillActive
            else -> colors.surfaceActive
        },
        animationSpec = tween(Motion.quick, easing = Motion.spring),
        label = "nav-touch",
    )

    Box(
        modifier = modifier
            .onGloballyPositioned { layout -> onSegment(layout.positionInParent().x) }
            .clip(shape)
            .background(touch)
            /* Die Hoehe kommt aus dem INHALT und steht nicht als Zahl da —
               `--touch-min` ist nur die Untergrenze. Bei Schriftskala 1,5
               waechst die Beschriftung, und mit ihr Pille und Karte; eine
               feste Hoehe haette den Text stattdessen gestaucht. Was die
               Buehnen unten freihalten muessen, messen sie deshalb ebenfalls
               (siehe `ClockworkApp`), statt es aus einer Konstanten zu
               rechnen. */
            .heightIn(min = Dimens.touchMin)
            .scale(scale)
            .selectable(
                selected = selected,
                interactionSource = interaction,
                indication = null,
                role = Role.Tab,
                onClick = {
                    onSelect()
                    // Bei JEDEM Tipp, auch auf den schon gewaehlten Posten:
                    // Ein Uhrwerk laeuft auch dann weiter, wenn man es
                    // zweimal anstoesst.
                    scope.launch {
                        turn.snapTo(0f)
                        /* `--dur-spin` (750 ms), und das ist keine beliebige
                           groessere Zahl: Es ist die Dauer, die dieses Projekt
                           fuer GENAU EINE UMDREHUNG bereits kennt — der
                           Wartezeiger dreht sich in ihr einmal herum.

                           Der erste Anlauf nahm `--dur-sheet` (350 ms). Kevins
                           Urteil am Geraet: zu schnell. Er hat recht, und die
                           Zahl sagt warum — eine volle Umdrehung in 350 ms ist
                           ein Schnappen, keine Bewegung, die man verfolgen
                           kann.

                           Beide Zeichen laufen dieselbe Zeit, obwohl das eine
                           360 Grad zurueklegt und das andere 45. Genau so
                           verhaelt sich ein Getriebe: gekoppelte Raeder
                           brauchen dieselbe Zeit und drehen verschieden weit.
                           Gleiche WINKELgeschwindigkeit waere die
                           unphysikalische Variante. */
                        turn.animateTo(1f, tween(Motion.spin, easing = Motion.spring))
                    }
                },
            ),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                /* VOR dem Polster in der Kette, mit Absicht: Gemessen wird
                   damit der Kasten EINSCHLIESSLICH seiner 12 dp, und genau den
                   deckt die Pille. Stuende der Aufruf hinter dem Polster,
                   umschloesse die Pille nur die Zeichen und saehe aus wie ein
                   zu enger Kragen. */
                .onGloballyPositioned { layout ->
                    onContent(
                        NavSlot(
                            x = layout.positionInParent().x,
                            width = layout.size.width.toFloat(),
                            height = layout.size.height.toFloat(),
                        ),
                    )
                }
                /* ── Der Fokusring haengt an der PILLE, nicht am Segment ────
                   Er stand bis N13 aussen, am ganzen Segment — solange die
                   Hervorhebung ebenso breit war, stimmte das auch. Mit der
                   kompakten Pille sah es am Geraet aus wie ein Fehler: ein
                   orangefarbener Ring um die halbe Leiste, in dem eine kleine
                   Pille sitzt.

                   Aufgeloest nach derselben Trennung, die auch die Pille
                   begruendet: Was man TRIFFT, bleibt das ganze Segment — die
                   `selectable`-Zone oben ist unveraendert. Was man SIEHT, ist
                   genau. Der Ring ist etwas, das man sieht.

                   Er kostet keinen Platz (`drawWithContent`, siehe
                   `focusRing`), steht also hinter der Messung und veraendert
                   die Pillenlage nicht. */
                .focusRing(focused, colors.signal, shape, 2.dp)
                /* Waagerecht `--sp-3`, senkrecht nichts — und das ist gemessen
                   und nicht vergessen: Das Zeichen sitzt in einem 24-dp-Kasten
                   und traegt seinen Strich mit rund 1 dp Abstand zum Rand, die
                   Beschriftung steht in einer 18-dp-Zeile bei 12 sp Schrift,
                   hat also oben und unten 3 dp Vorschub. Senkrecht ist die
                   Luft damit schon da. Waagerecht endet die Beschriftung an
                   ihrem letzten Buchstaben — dort gibt es keine, also kommt
                   sie hier dazu. */
                .padding(horizontal = Dimens.sp3),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(Dimens.sp1, Alignment.CenterVertically),
        ) {
            glyph(glyphTint, turn.value)

            BasicText(
                text = label,
                style = TextStyles.micro.copy(color = labelTint),
                maxLines = 1,
                softWrap = false,
                // Eine lange Uebersetzung soll kuerzen und nicht unter die
                // Nachbarpille laufen — dieselbe Entscheidung wie am
                // Kontonamen der Code-Karte.
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

/**
 * Die Deckkraft der Leiste, je Theme.
 *
 * ── Wie die Zahl zustande kam ─────────────────────────────────────────────
 * Nicht nach Gefuehl. `scripts/native-nav-contrast.mjs --sweep` rechnet den
 * schlechtesten Fall ueber alle Inhaltsfarben aus, die unter der Leiste
 * vorkommen koennen, und nennt die Deckung, bis zu der AA gerade noch haelt:
 * **76 % in beiden Themes.**
 *
 * N13 nahm daraufhin 82 % — moeglichst viel Durchsicht bei sechs Punkten
 * Reserve. **N14 geht auf 90 %**, und zwar nicht wegen der Rechnung, sondern
 * wegen des Auges: Kevins Befund am Geraet lautet, dass Transluzenz OHNE
 * Weichzeichner nicht milchig wirkt, sondern kaputt — man liest halbe
 * Buchstaben durch eine Flaeche, auf der Beschriftungen stehen. Seit N14
 * blendet der Inhalt darunter ohnehin ab (siehe `fadeBrush` in
 * ClockworkApp.kt); was durchscheint, ist dann meist schon `--ground`.
 *
 * Die strenge Pruefung bleibt trotzdem auf der ganzen Inhaltsliste stehen und
 * wird nicht auf „ist ja abgeblendet" verkuerzt: Faellt die Abblendung
 * irgendwann weg, soll die Leiste immer noch lesbar sein — und die Pruefung
 * es merken.
 *
 * Dass beide Themes dieselbe Schwelle haben, ist keine Absicht, sondern das
 * Ergebnis: Hell wird die Leiste von dunklem Inhalt heruntergezogen, dunkel
 * von hellem hinauf, und die Leitern sind an dieser Stelle gleich steil. Die
 * zwei Konstanten bleiben trotzdem getrennt — laeuft eine Leiter spaeter
 * anders, soll man EINE Zahl aendern koennen.
 *
 * Die Marke `// nav-frost: …` ist der Vertrag mit dem Pruefskript, genau wie
 * `// css: …` in Tokens.kt der Vertrag mit native-theme-check.mjs ist.
 *
 * ── Und warum das kein Token in tokens.css ist ────────────────────────────
 * Weil es die Leiste im Web nicht gibt. Ein Token, das dort niemand liest,
 * waere totes Gewicht in einem Buendel, dessen Byte-Gleichheit dieses Projekt
 * bei jedem Posten nachmisst. Die MISCHREGEL ist trotzdem die des Hauses:
 * `color-mix(in oklab, var(--surface) 90%, transparent)` ergibt
 * vormultipliziert exakt `--surface` mit 90 % Deckkraft, und nichts anderes
 * tut `Color.copy(alpha = …)`.
 */
private const val NAV_FROST_LIGHT = 0.90f // nav-frost: light

private const val NAV_FROST_DARK = 0.90f // nav-frost: dark

private fun navFrost(colors: ClockworkColors): Color =
    colors.surface.copy(alpha = if (colors.isDark) NAV_FROST_DARK else NAV_FROST_LIGHT)

/**
 * Das Polster der Karte um ihre Pille.
 *
 * Es ist zugleich die Differenz der beiden Radien — siehe die Bemerkung zur
 * Konzentrizitaet am Kopf dieser Datei.
 */
private val NAV_CARD_PADDING: Dp = Dimens.sp1
