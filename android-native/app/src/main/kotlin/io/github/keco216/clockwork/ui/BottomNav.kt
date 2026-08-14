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
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInParent
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
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
 * Die untere Navigation als SCHWEBENDE Pillen-Karte (N12).
 *
 * ── Was an der N11-Fassung falsch war ─────────────────────────────────────
 * Sie war ein randbuendiger Balken mit einer Fuge nach oben und einer
 * Aktiv-Flaeche, die schmaler war als ihr Posten. Kevins Urteil am S24: „wirkt
 * billig". Er hat recht, und der Grund ist benennbar — drei Fehler auf einmal:
 *
 * 1. Ein Balken, der die Fensterkante beruehrt, ist ein Stueck FENSTER. Eine
 *    Karte mit Abstand ist ein Stueck GERAET. Dieses Projekt baut ein
 *    Instrument; seine Navigation gehoert auf das Gehaeuse gelegt, nicht in
 *    den Rahmen geklebt.
 * 2. Die Fuge nach oben war eine Behauptung, die die Flaeche nicht einloest:
 *    Ein Strich trennt zwei Ebenen, die aneinanderstossen. Etwas, das
 *    SCHWEBT, trennt sich durch seinen Schatten (hell) beziehungsweise seine
 *    Lichtkante (dunkel) — genau das, was `--elev-2` fuer Overlays vorsieht.
 * 3. Die Aktiv-Flaeche sass nicht auf ihrem Posten, sondern irgendwo darin.
 *    Jetzt deckt die Pille GENAU das Segment: gemessen, nicht gerechnet.
 *
 * ── Warum die Radien ineinander passen ────────────────────────────────────
 * Karte und Pille tragen beide `--radius-key`, und der klemmt auf die halbe
 * Hoehe: aussen 64 / 2 = 32, innen 48 / 2 = 24. Die Differenz ist genau das
 * Polster der Karte (8). Damit sind beide Rundungen KONZENTRISCH — die Regel,
 * an der man eine gebaute Form von einer gestapelten unterscheidet.
 *
 * ── Der gleitende Cursor ──────────────────────────────────────────────────
 * HeroUI zieht unter seinen Tabs einen Cursor, der beim Wechsel an seine neue
 * Stelle FAEHRT (250 ms, Federkurve). Er faehrt in Ort UND Breite, obwohl
 * beide Posten hier gleich breit sind: Die Werte kommen aus der GEMESSENEN
 * Lage (`onGloballyPositioned`) und nicht aus einer Rechnung „halbe Leiste".
 * Eine dritte Seite wuerde die Rechnung still falsch machen, die Messung
 * nicht.
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
    val segmentShape = RoundedCornerShape(Dimens.radiusKey)

    /* Die gemessene Lage der Posten, in Pixeln der Karte. Sie steht hier und
       nicht im Posten selbst, weil die Pille sie braucht — und die liegt
       HINTER beiden. */
    var slots by remember { mutableStateOf(mapOf<Page, Pair<Float, Float>>()) }
    val slot = slots[current]

    val cursorX = remember { Animatable(0f) }
    val cursorWidth = remember { Animatable(0f) }
    var placed by remember { mutableStateOf(false) }

    LaunchedEffect(slot) {
        val target = slot ?: return@LaunchedEffect
        if (!placed) {
            placed = true
            cursorX.snapTo(target.first)
            cursorWidth.snapTo(target.second)
            return@LaunchedEffect
        }
        // Zwei Spuren, eine Fahrt: `launch` startet beide im selben Rahmen,
        // sonst liefe die Breite der Stelle hinterher.
        launch { cursorX.animateTo(target.first, tween(Motion.calm, easing = Motion.spring)) }
        launch {
            cursorWidth.animateTo(target.second, tween(Motion.calm, easing = Motion.spring))
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            /* Seitlich `--sp-4`, unten `--sp-3`. Die Safe-Area kommt NICHT von
               hier: `ClockworkApp` legt `systemBarsPadding()` um alles, die
               Karte sitzt also schon ueber der Gestenleiste. Es hier noch
               einmal zu setzen ergaebe die doppelte Fuge. */
            .padding(start = Dimens.sp4, end = Dimens.sp4, bottom = Dimens.sp3)
            /* `--elev-2`, die Overlay-Ebene: Sie schwebt UEBER dem Inhalt, der
               unter ihr durchlaeuft. Hell ist das der Schatten der Referenz,
               dunkel ihre 1-px-Innenlichtkante (`inset 0 0 1px rgb(255 255 255
               / 30%)`) — auf Fast-Schwarz haette ein Schatten nichts, worauf
               er fiele.

               Die drei Lagen der CSS-Fassung (2/8, -6/12 und 14/28 px bei 6,
               3 und 8 %) kann Compose nicht stapeln; genommen ist die
               dominante dritte. Das ist eine ANNAEHERUNG und steht hier als
               solche — wie schon bei `--elev-1` am Panel. */
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
            .background(colors.surface)
            .then(
                if (colors.isDark) {
                    Modifier.border(1.dp, Color.White.copy(alpha = 0.30f), cardShape)
                } else {
                    Modifier
                },
            )
            .padding(NAV_CARD_PADDING),
    ) {
        // Die Pille liegt HINTER den Posten — sie ist Hintergrund, kein
        // Aufsatz. Deshalb steht sie vor der Reihe im Baum.
        if (placed) {
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
                    .width(with(density) { cursorWidth.value.toDp() })
                    .height(NAV_SEGMENT_HEIGHT)
                    .align(AbsoluteAlignment.CenterLeft)
                    .background(colors.signalSoft, segmentShape),
            )
        }

        Row(modifier = Modifier.fillMaxWidth()) {
            NavItem(
                label = text("native.nav.home"),
                selected = current == Page.Home,
                onSelect = { onSelect(Page.Home) },
                shape = segmentShape,
                modifier = Modifier
                    .weight(1f)
                    .onGloballyPositioned { layout ->
                        slots = slots + (
                            Page.Home to (
                                layout.positionInParent().x to layout.size.width.toFloat()
                                )
                            )
                    },
            ) { tint -> DialGlyph(tint) }

            NavItem(
                label = text("native.nav.settings"),
                selected = current == Page.Settings,
                onSelect = { onSelect(Page.Settings) },
                shape = segmentShape,
                modifier = Modifier
                    .weight(1f)
                    .onGloballyPositioned { layout ->
                        slots = slots + (
                            Page.Settings to (
                                layout.positionInParent().x to layout.size.width.toFloat()
                                )
                            )
                    },
            ) { tint -> GearGlyph(tint) }
        }
    }
}

/**
 * Ein Segment der Leiste: Zeichen oben, Beschriftung darunter.
 *
 * `selectable` und nicht `clickable`: Damit meldet das Segment der
 * Bedienungshilfe seine Rolle (Tab) UND ob es das gewaehlte ist. Ein Knopf,
 * der nur „angetippt werden kann", laesst einen Screenreader raten, wo man
 * gerade steht.
 *
 * Die beiden Segmente sind ueber `weight(1f)` EXAKT gleich breit — auch dann,
 * wenn eine Uebersetzung laenger ist als die andere. Das ist der Unterschied
 * zwischen einer Leiste und zwei nebeneinander stehenden Knoepfen.
 */
@Composable
private fun NavItem(
    label: String,
    selected: Boolean,
    onSelect: () -> Unit,
    shape: Shape,
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

    val tint = if (selected) colors.signalText else colors.ink3

    Column(
        modifier = modifier
            .height(NAV_SEGMENT_HEIGHT)
            .scale(scale)
            .focusRing(focused, colors.signal, shape, 2.dp)
            .selectable(
                selected = selected,
                interactionSource = interaction,
                indication = null,
                role = Role.Tab,
                onClick = onSelect,
            )
            .padding(horizontal = Dimens.sp2),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically),
    ) {
        glyph(tint)

        BasicText(
            text = label,
            style = TextStyles.micro.copy(color = tint),
            maxLines = 1,
        )
    }
}

/**
 * Die Hoehe eines Segments.
 *
 * 48 dp traegt Zeichen (24) und Beschriftung (12 sp) uebereinander und liegt
 * ueber der 44-dp-Trefferflaeche des Hauses. Es ist zugleich die Sprosse der
 * Hoehenleiter, die die Web-Fassung fuer die EINE Haupthandlung eines Panels
 * vorsieht — und genau das ist ein Navigationsposten.
 */
private val NAV_SEGMENT_HEIGHT: Dp = 48.dp

/** Das Polster der Karte um ihre Segmente. */
private val NAV_CARD_PADDING: Dp = Dimens.sp2

/**
 * Wie weit die Leiste in den Inhalt hineinragt: Kartenhoehe plus ihr Abstand
 * nach unten.
 *
 * Die Buehnen rechnen ihr unteres Polster daraus, damit die letzte Karte und
 * der Fuss vollstaendig ueber die Leiste hinausgescrollt werden koennen. Die
 * Zahl steht deshalb HIER und nicht dort: Wer die Leiste hoeher macht, soll
 * nicht in drei Dateien nachziehen muessen.
 */
val navOverlayHeight: Dp = NAV_SEGMENT_HEIGHT + NAV_CARD_PADDING * 2 + Dimens.sp3
