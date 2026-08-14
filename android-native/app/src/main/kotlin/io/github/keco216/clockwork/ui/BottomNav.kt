package io.github.keco216.clockwork.ui

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
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.AbsoluteAlignment
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.compositeOver
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
 * 1. Die Flaeche ist nicht mehr deckend, sondern `--surface` mit 82 %.
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

    /* Die MITTE des aktiven Postens, gemessen: Segmentlage plus Inhaltslage
       im Segment plus halbe Inhaltsbreite. Aus ihr und der festen Pillenbreite
       ergibt sich die linke Kante — und nicht aus einer Rechnung „halbe
       Leiste", die bei einer dritten Seite still falsch wuerde. */
    val target = contents[current]?.let { content ->
        segments[current]?.let { segmentX ->
            pillWidth?.let { width -> segmentX + content.x + content.width / 2f - width / 2f }
        }
    }

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
            .fillMaxWidth()
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
            /* ── Die Kante, und warum sie im Hellen dazukommt ───────────────
               N12 kam mit dem Schatten aus, weil die Karte deckend weiss war
               und der Inhalt an ihr endete. Seit N13 ist sie durchscheinend:
               Laeuft eine weisse Karte darunter durch, ist die Leiste an
               dieser Stelle exakt so hell wie ihr Untergrund, und es bleibt
               nur der Schatten — der liegt aussen und ist leise.

               Deshalb im Hellen zusaetzlich eine Haarlinie in `--rule`, also
               dieselbe Fuge, die im Web zwei Kanalzuege trennt. Im Dunkeln
               tut das weiterhin die Innenlichtkante; dort ist die Karte
               ohnehin heller als der Grund. */
            .border(
                1.dp,
                if (colors.isDark) Color.White.copy(alpha = 0.30f) else colors.rule,
                cardShape,
            )
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
                    /* DECKEND, als einziges Bauteil der Leiste — die
                       Begruendung steht in native-nav-contrast.mjs und in
                       einem Satz hier: `--signal-text` ist so ausgelegt, dass
                       es auf den Hausflaechen GERADE 4,5:1 haelt. Es hat keine
                       Reserve, die man an Transluzenz verfuettern koennte.

                       `compositeOver` mischt dabei genau das, was der
                       Compositor sonst beim Zeichnen taete — nur einmal
                       vorweg. Deshalb steht hier keine abgeschriebene
                       Hexzahl: Aendert sich `--signal-soft` oder `--surface`,
                       wandert die Pille mit. */
                    .background(colors.signalSoft.compositeOver(colors.surface), pillShape),
            )
        }

        Row(modifier = Modifier.fillMaxWidth()) {
            NavItem(
                label = text("native.nav.home"),
                selected = current == Page.Home,
                onSelect = { onSelect(Page.Home) },
                shape = pillShape,
                onSegment = { x -> segments = segments + (Page.Home to x) },
                onContent = { measured -> contents = contents + (Page.Home to measured) },
                modifier = Modifier.weight(1f),
            ) { tint -> DialGlyph(tint) }

            NavItem(
                label = text("native.nav.settings"),
                selected = current == Page.Settings,
                onSelect = { onSelect(Page.Settings) },
                shape = pillShape,
                onSegment = { x -> segments = segments + (Page.Settings to x) },
                onContent = { measured -> contents = contents + (Page.Settings to measured) },
                modifier = Modifier.weight(1f),
            ) { tint -> GearGlyph(tint) }
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
 * Untergrund abdunkelt. `--ink-3` haelt auf `--surface` 5,53:1 — bei 82 %
 * Deckung faellt es auf 4,07 und reisst AA. `--ink-2` haelt dort 6,29.
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
    glyph: @Composable (Color) -> Unit,
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

    val tint = if (selected) colors.signalText else colors.ink2

    Box(
        modifier = modifier
            .onGloballyPositioned { layout -> onSegment(layout.positionInParent().x) }
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
                onClick = onSelect,
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
            glyph(tint)

            BasicText(
                text = label,
                style = TextStyles.micro.copy(color = tint),
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
 * **76 % in beiden Themes.** Genommen sind 82 % — sechs Punkte Reserve, und
 * damit sichtbar durchscheinender Inhalt statt einer Milchglasscheibe.
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
 * `color-mix(in oklab, var(--surface) 82%, transparent)` ergibt
 * vormultipliziert exakt `--surface` mit 82 % Deckkraft, und nichts anderes
 * tut `Color.copy(alpha = …)`.
 */
private const val NAV_FROST_LIGHT = 0.82f // nav-frost: light

private const val NAV_FROST_DARK = 0.82f // nav-frost: dark

private fun navFrost(colors: ClockworkColors): Color =
    colors.surface.copy(alpha = if (colors.isDark) NAV_FROST_DARK else NAV_FROST_LIGHT)

/**
 * Das Polster der Karte um ihre Pille.
 *
 * Es ist zugleich die Differenz der beiden Radien — siehe die Bemerkung zur
 * Konzentrizitaet am Kopf dieser Datei.
 */
private val NAV_CARD_PADDING: Dp = Dimens.sp2
