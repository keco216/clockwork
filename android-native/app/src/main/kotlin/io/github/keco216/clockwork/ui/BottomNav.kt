package io.github.keco216.clockwork.ui

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.AbsoluteAlignment
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
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
import androidx.compose.foundation.Canvas as FoundationCanvas

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
 * Die untere Navigationsleiste.
 *
 * ── Der wandernde Indikator ───────────────────────────────────────────────
 * HeroUI zeichnet unter seinen Tabs einen „Cursor", der beim Wechsel an seine
 * neue Stelle FAEHRT statt zu springen (250 ms, Federkurve). Die V11-Analyse
 * hatte das Muster als „keine Tabs" verworfen — jetzt gibt es Tabs, jetzt
 * gilt es.
 *
 * Er faehrt in Ort UND Breite, obwohl beide Posten hier gleich breit sind:
 * Die Breite kommt aus der GEMESSENEN Lage der Posten
 * (`onGloballyPositioned`), nicht aus einer Rechnung „halbe Leiste". Eine
 * dritte Seite oder eine laengere Uebersetzung wuerde die Rechnung still
 * falsch machen, die Messung nicht.
 *
 * ── Reduzierte Bewegung ───────────────────────────────────────────────────
 * Ohne eigene Abfrage: `animateDpAsState` haengt an der Animator-Skala des
 * Systems. Steht sie auf 0, springt der Cursor — genau das, was
 * `prefers-reduced-motion` im Web verlangt. Dieselbe Mechanik wie beim
 * Tastendruck in [Key].
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

    /* Die gemessene Lage der Posten, in Pixeln der Leiste. Sie steht hier und
       nicht im Posten selbst, weil der Cursor sie braucht — und der liegt
       HINTER beiden. */
    var slots by remember { mutableStateOf(mapOf<Page, Pair<Float, Float>>()) }
    val slot = slots[current]

    val cursorX by animateDpAsState(
        targetValue = with(density) { (slot?.first ?: 0f).toDp() },
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "nav-cursor-x",
    )
    val cursorWidth by animateDpAsState(
        targetValue = with(density) { (slot?.second ?: 0f).toDp() },
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "nav-cursor-width",
    )

    Column(
        modifier = modifier
            .fillMaxWidth()
            /* Erhebung nur im Hellen — dieselbe Begruendung wie beim klebenden
               Kopf: Im Dunkeln traegt die Fuge allein, ein Schatten auf Nacht
               hat keinen Platz mehr. Die Fuge zeigt nach OBEN, deshalb steht
               sie als erstes Kind. */
            .then(
                if (colors.isDark) {
                    Modifier
                } else {
                    Modifier.shadow(
                        elevation = 2.dp,
                        shape = RectangleShape,
                        clip = false,
                        ambientColor = Color.Black.copy(alpha = 0.08f),
                        spotColor = Color.Black.copy(alpha = 0.08f),
                    )
                },
            )
            .background(colors.surface),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(colors.rule),
        )

        Box(modifier = Modifier.fillMaxWidth()) {
            // Der Cursor liegt HINTER den Posten — er ist Hintergrund, kein
            // Aufsatz. Deshalb steht er vor der Reihe im Baum.
            if (slot != null) {
                Box(
                    modifier = Modifier
                        /* ABSOLUT und nicht logisch — beides, die Ausrichtung
                           und der Versatz.

                           Gemessen wird mit `positionInParent().x`, und das
                           ist eine PHYSISCHE Koordinate: linke Kante, von
                           links gezaehlt, in jeder Schreibrichtung. `offset`
                           und `Alignment.CenterStart` sind dagegen LOGISCH —
                           auf Arabisch zaehlen sie von rechts. Wer das eine
                           misst und das andere setzt, bekommt einen Cursor,
                           der auf Deutsch stimmt und auf Arabisch unter dem
                           falschen Posten steht. Genau so gemessen, bevor
                           diese Zeilen `absolute` hiessen.

                           Dieselbe Trennung wie im Web, nur andersherum
                           angewandt: Position logisch, Geometrie physisch —
                           hier ist die Position aus der Messung physisch, also
                           muss die Platzierung es auch sein. */
                        .absoluteOffset(x = cursorX)
                        .width(cursorWidth)
                        .height(Dimens.controlHLg)
                        .padding(horizontal = Dimens.gapPair)
                        .align(AbsoluteAlignment.CenterLeft)
                        .background(colors.fillSoft, RoundedCornerShape(Dimens.radiusItem)),
                )
            }

            Row(modifier = Modifier.fillMaxWidth()) {
                NavItem(
                    label = text("native.nav.home"),
                    selected = current == Page.Home,
                    onSelect = { onSelect(Page.Home) },
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
}

/**
 * Ein Posten der Leiste: Zeichen oben, Beschriftung darunter.
 *
 * `selectable` und nicht `clickable`: Damit meldet der Posten der
 * Bedienungshilfe seine Rolle (Tab) UND ob er der gewaehlte ist. Ein Knopf,
 * der nur „angetippt werden kann", laesst einen Screenreader raten, wo man
 * gerade steht.
 */
@Composable
private fun NavItem(
    label: String,
    selected: Boolean,
    onSelect: () -> Unit,
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
    val shape = RoundedCornerShape(Dimens.radiusItem)

    Column(
        modifier = modifier
            .scale(scale)
            .padding(horizontal = Dimens.gapPair)
            .focusRing(focused, colors.signal, shape, 2.dp)
            .selectable(
                selected = selected,
                interactionSource = interaction,
                indication = null,
                role = Role.Tab,
                onClick = onSelect,
            )
            // Trefferflaeche: Die Leiste ist hoeher als 44 dp, der Posten
            // fuellt sie ganz aus — Zeichen und Beschriftung zusammen sind
            // EIN Ziel, nicht zwei.
            .height(NAV_HEIGHT)
            .padding(vertical = Dimens.gapPair),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically),
    ) {
        Box(modifier = Modifier.size(GLYPH_SIZE)) { glyph(tint) }

        BasicText(
            text = label,
            style = TextStyles.micro.copy(color = tint),
            maxLines = 1,
        )
    }
}

/**
 * Das Zifferblatt, vereinfacht.
 *
 * Die Marke traegt eine 30er-Teilung — bei 22 dp verschmieren dreissig Striche
 * zu einem grauen Ring. Gezeichnet ist deshalb JEDER FUENFTE Strich, also die
 * sechs Positionen, die auch ein Zifferblatt aus Zahlen zeigen wuerde, plus
 * der Zeiger. Es ist dieselbe Geometrie, nur grober aufgeloest: eine
 * Vereinfachung, keine zweite Form.
 */
@Composable
private fun DialGlyph(tint: Color) {
    FoundationCanvas(modifier = Modifier.size(GLYPH_SIZE)) {
        val radius = size.minDimension / 2f
        val stroke = radius * 0.13f
        val tickOuter = radius * 0.96f
        val tickInner = radius * 0.62f

        for (index in 0 until 6) {
            rotate(degrees = index * 60f) {
                drawLine(
                    color = tint,
                    start = Offset(center.x, center.y - tickOuter),
                    end = Offset(center.x, center.y - tickInner),
                    strokeWidth = stroke,
                    cap = StrokeCap.Round,
                )
            }
        }

        // Der Zeiger steht auf zwoelf — die Ruhelage des Emblems.
        drawLine(
            color = tint,
            start = center,
            end = Offset(center.x, center.y - radius * 0.44f),
            strokeWidth = stroke,
            cap = StrokeCap.Round,
        )
    }
}

/**
 * Das Zahnrad.
 *
 * Bei einer Uhrwerks-Marke ist das Zahnrad kein Klischee, sondern das Motiv —
 * Kevins Begruendung, und sie stimmt: Was ein Uhrwerk antreibt, darf die
 * Einstellungen bezeichnen. Acht Zaehne, weil sechs zu grob und zwoelf bei
 * 22 dp wieder ein Ring waeren.
 */
@Composable
private fun GearGlyph(tint: Color) {
    FoundationCanvas(modifier = Modifier.size(GLYPH_SIZE)) {
        val radius = size.minDimension / 2f
        val stroke = radius * 0.15f

        for (index in 0 until 8) {
            rotate(degrees = index * 45f) {
                drawLine(
                    color = tint,
                    start = Offset(center.x, center.y - radius * 0.98f),
                    end = Offset(center.x, center.y - radius * 0.66f),
                    strokeWidth = stroke,
                    cap = StrokeCap.Round,
                )
            }
        }

        drawRing(tint, radius * 0.62f, stroke)
        drawRing(tint, radius * 0.24f, stroke)
    }
}

private fun DrawScope.drawRing(tint: Color, radius: Float, stroke: Float) {
    drawCircle(color = tint, radius = radius, style = Stroke(width = stroke))
}

/**
 * Die Hoehe der Leiste.
 *
 * 56 dp traegt Zeichen und Beschriftung uebereinander und liegt ueber der
 * 44-dp-Trefferflaeche des Hauses. Das Polster zu den Systemleisten kommt
 * NICHT von hier: `ClockworkApp` legt `systemBarsPadding()` um alles, die
 * Leiste sitzt also schon ueber der Gestenleiste. Es hier noch einmal zu
 * setzen ergaebe die doppelte Fuge.
 */
private val NAV_HEIGHT: Dp = 56.dp

/** Die Kantenlaenge der Zeichen. */
private val GLYPH_SIZE: Dp = 22.dp
