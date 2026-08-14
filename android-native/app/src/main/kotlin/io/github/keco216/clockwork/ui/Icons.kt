package io.github.keco216.clockwork.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import io.github.keco216.clockwork.ui.theme.Motion

/**
 * Die Zeichen der App — EIN Raster, EIN Strichgewicht (N12).
 *
 * ── Warum es diese Datei gibt ─────────────────────────────────────────────
 * Bis N11 zeichnete jedes Bauteil sein Zeichen selbst: der Aufklapper-Winkel
 * 1,5 dp mit stumpfen Enden in einem 16-dp-Kasten, das Haekchen 1,5 dp in
 * einem 10er, die beiden Leisten-Zeichen 1,4 bzw. 1,65 dp (aus einem
 * Radius-Anteil gerechnet) in einem 22er. Vier Kaesten, drei Strichstaerken,
 * zwei Kappenformen — jedes fuer sich vertretbar, zusammen kein System.
 *
 * Seit N12 gilt: **24-dp-Kasten, 2 dp Strich, runde Kappen und Ecken.** Wer
 * ein Zeichen braucht, holt es hier; wer eines aendert, aendert es fuer alle.
 *
 * ── Die eine Ausnahme, und warum sie eine bleibt ──────────────────────────
 * Das Zifferblatt neben dem Code ([Gauge]) und die beiden O der Wortmarke
 * sind KEINE Zeichen, sondern die MARKE in Betrieb. Sie tragen weiter stumpfe
 * Enden und die exakte 30er-Teilung, weil ein abgerundeter Strich auf einer
 * Teilung eine ungenaue Angabe ist. Die Grenze laeuft also nicht zwischen
 * „gross" und „klein", sondern zwischen ABLESEN und BEZEICHNEN.
 *
 * ── Abweichung von der Web-Fassung, benannt statt verschwiegen ────────────
 * Im Web sind die Winkel 1,5 px starke CSS-Kanten (`.vault__state::after`,
 * `.pick-shell::after`, `.listbox__option::after`). Nativ sind sie 2 dp mit
 * runden Kappen. Das ist Kevins Entscheidung aus N12 („EIN Strichgewicht fuer
 * alle Icons") und keine Nachlaessigkeit: Auf einem Telefon steht neben den
 * Winkeln keine Maus, sondern ein Daumen, und ein Haarstrich neben einem
 * 2-dp-Zifferblatt sieht aus wie ein Zeichen aus einem anderen Satz.
 */
object Glyph {
    /** Der Kasten. Jedes Zeichen wird darin gezeichnet — und NUR darin. */
    val box: Dp = 24.dp

    /** Das eine Strichgewicht. */
    val stroke: Dp = 2.dp

    /**
     * Die Betriebsleuchte: 6 dp, also drei Strichbreiten.
     *
     * Sie ist gefuellt und nicht gestrichelt, weil sie keine Form bezeichnet,
     * sondern einen Zustand zeigt — und weil dieselbe Scheibe im Zifferblatt
     * als Nabe sitzt.
     */
    val dot: Dp = 6.dp
}

/**
 * Die Umrechnung: eine Einheit des 24er-Rasters in Pixel.
 *
 * Alle Zahlen unten stehen damit im Raster und nicht in Pixeln — dieselbe
 * Schreibweise wie in einem 24er-SVG, und derselbe Grund: Man kann sie mit der
 * Vorlage vergleichen, ohne zu rechnen.
 */
private fun DrawScope.unit(): Float = size.minDimension / 24f

/**
 * Das Zifferblatt — Zeichen A des Markensystems, auf Icon-Groesse GESCHNITTEN
 * und nicht verkleinert.
 *
 * ── Der Befund, der dazu gefuehrt hat ─────────────────────────────────────
 * Die N11-Fassung nahm sechs lange Striche und einen kurzen Zeiger. Bei 24 dp
 * las sich das als STERN, nicht als Uhr — Kevins Befund am S24, am Bild
 * bestaetigt. Der Grund ist nicht die Anzahl, sondern die LAENGE: Ein Strich,
 * der ein Drittel des Radius einnimmt, ist eine Zacke; erst viele kurze
 * Marken schliessen sich im Auge zu einem Kreis.
 *
 * ── Was geaendert wurde, und was ausdruecklich nicht ──────────────────────
 * Geaendert ist die ANZAHL: 30 Marken des Emblems → 12. Dreissig Marken
 * verschmieren bei 24 dp zu einem grauen Ring, zwoelf sind die Teilung, die
 * auch ein Zifferblatt aus Zahlen zeigt.
 *
 * Die PROPORTION ist die des Emblems geblieben: Die Tinte eines Strichs misst
 * 2,2 von 11 Raster-Einheiten Radius — dieselben 0,2 R, die `Dial.TICK_LENGTH`
 * fuer das grosse Blatt vorgibt. Dass die gezeichnete Linie dabei nur 0,2
 * Einheiten lang ist, liegt an der runden Kappe: Sie traegt an jedem Ende
 * eine halbe Strichbreite bei und macht damit fast den ganzen Strich aus. Der
 * Zeiger steht auf zwoelf wie der Signal-Index des Emblems und reicht bis
 * 0,7 R, genau wie am grossen Blatt.
 *
 * Gemessen wurde die Wirkung, nicht behauptet: gerendert bei 63 px (24 dp bei
 * Dichte 420) und bei 90 px (Dichte 600), hell und dunkel, neben dem Zahnrad.
 * Die Bilder liegen in docs/abnahme.
 */
@Composable
fun DialGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        val stroke = Glyph.stroke.toPx()

        // Zwoelf Marken. Die Linie laeuft von 9,8 bis 10,0 — die runde Kappe
        // dehnt die Tinte auf 8,8 bis 11,0 und damit auf 2,2 Einheiten.
        repeat(12) { index ->
            rotate(degrees = index * 30f) {
                drawLine(
                    color = tint,
                    start = Offset(center.x, center.y - 9.8f * u),
                    end = Offset(center.x, center.y - 10.0f * u),
                    strokeWidth = stroke,
                    cap = StrokeCap.Round,
                )
            }
        }

        // Der Zeiger auf zwoelf: Tinte bis 7,7 Einheiten, also 0,7 R.
        drawLine(
            color = tint,
            start = center,
            end = Offset(center.x, center.y - 6.7f * u),
            strokeWidth = stroke,
            cap = StrokeCap.Round,
        )

        // Die Nabe — eine Strichbreite im Durchmesser, wie am grossen Blatt.
        drawCircle(color = tint, radius = 1.0f * u, center = center)
    }
}

/**
 * Das Zahnrad.
 *
 * Bei einer Uhrwerks-Marke ist das Zahnrad kein Klischee, sondern das Motiv —
 * was ein Uhrwerk antreibt, darf die Einstellungen bezeichnen.
 *
 * ── Warum es KLEINER ist als das Zifferblatt ──────────────────────────────
 * Weil es sonst groesser WIRKT. Gemessen an der gedeckten Flaeche des
 * 24er-Kastens: Zifferblatt 10,1 %, Zahnrad 22,1 % — ein Ring plus acht Zaehne
 * tragen doppelt so viel Tinte wie zwoelf Marken plus Zeiger. Ein dichtes
 * Zeichen bei gleichem Aussendurchmesser laesst das offene daneben schrumpfen.
 * Der Aussenkreis der Zaehne endet deshalb bei 10,4 statt bei 11,0 Einheiten,
 * also 5 % enger. Das ist die uebliche optische Korrektur eines Zeichensatzes
 * und keine Ungenauigkeit.
 *
 * Die Nabe ist gefuellt und nicht als zweiter Ring gezeichnet: Sie ist damit
 * dieselbe Scheibe wie im Zifferblatt und in der Betriebsleuchte — drei
 * Zeichen, ein Bauteil.
 */
@Composable
fun GearGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        val stroke = Glyph.stroke.toPx()

        repeat(8) { index ->
            rotate(degrees = index * 45f) {
                drawLine(
                    color = tint,
                    start = Offset(center.x, center.y - 8.0f * u),
                    end = Offset(center.x, center.y - 9.4f * u),
                    strokeWidth = stroke,
                    cap = StrokeCap.Round,
                )
            }
        }

        drawCircle(color = tint, radius = 6.0f * u, style = Stroke(width = stroke))
        drawCircle(color = tint, radius = 1.2f * u, center = center)
    }
}

/**
 * Der Winkel — Aufklapper, Auswahlfeld, Listbox.
 *
 * Die Spanne ist 12 × 6 Einheiten, mittig im Kasten: die kanonische Geometrie
 * eines 24er-Rasters. Gedreht wird um die Kastenmitte, und die ist zugleich
 * die Mitte des Winkels — deshalb kippt er beim Aufklappen um seinen eigenen
 * Scheitel und nicht um einen Punkt daneben.
 *
 * @param turn Drehung in Grad. Der AUFRUFER bestimmt sie, weil die Dauer je
 *   Bauteil verschieden ist: 250 ms am Aufklapper, 150 ms am Auswahlfeld —
 *   zwei Bauteile der Referenz, zwei Zeiten.
 */
@Composable
fun ChevronGlyph(tint: Color, turn: Float, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        rotate(turn) {
            val path = Path().apply {
                moveTo(6f * u, 9f * u)
                lineTo(12f * u, 15f * u)
                lineTo(18f * u, 9f * u)
            }
            drawPath(
                path = path,
                color = tint,
                style = Stroke(
                    width = Glyph.stroke.toPx(),
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round,
                ),
            )
        }
    }
}

/**
 * Das Haekchen der gewaehlten Zeile.
 *
 * Es TRITT EIN — 250 ms aus `scale(.7)`, das Muster der Referenz. Ein
 * Haekchen, das einfach dasteht, sagt „ist ausgewaehlt"; eines, das eintritt,
 * sagt „wurde gerade ausgewaehlt".
 *
 * Die Bewegung steht hier und nicht beim Aufrufer, weil sie zum Zeichen
 * gehoert: Es gibt keinen Ort, an dem ein Haekchen anders erscheinen soll.
 */
@Composable
fun CheckGlyph(tint: Color, modifier: Modifier = Modifier) {
    /* `Animatable` und nicht `animateFloatAsState`: Letzteres startet BEIM
       Zielwert, es gaebe also gar keine Fahrt. Hier soll das Zeichen aus 0,7
       eintreten, und der Anfangswert ist deshalb Teil des Zustands. Dieselbe
       Bauart wie im Web, wo dafuer `@keyframes` steht und kein `transition` —
       aus demselben Grund: Das Zeichen ENTSTEHT mit dem Zustand. */
    val grow = remember { Animatable(0.7f) }
    LaunchedEffect(Unit) {
        grow.animateTo(1f, tween(Motion.calm, easing = Motion.spring))
    }

    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        // Um die eigene Mitte, deshalb `scale` im Zeichnen und nicht als
        // Modifier: Ein Modifier skalierte den ganzen Kasten samt
        // Trefferflaeche.
        scale(scale = grow.value) {
            val path = Path().apply {
                moveTo(6f * u, 12.5f * u)
                lineTo(10f * u, 16.5f * u)
                lineTo(18f * u, 7.5f * u)
            }
            drawPath(
                path = path,
                color = tint,
                style = Stroke(
                    width = Glyph.stroke.toPx(),
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round,
                ),
            )
        }
    }
}

/**
 * Die Betriebsleuchte.
 *
 * Sie steht im Kopf (Zustandszeile) und an der Fold-Zeile des Tresors. Bis N12
 * war sie an beiden Stellen ein eigener 6-dp-Kasten mit derselben Zahl — zwei
 * Kopien, die beim naechsten Mal auseinanderlaufen.
 */
@Composable
fun Lamp(colour: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(Glyph.dot)
            .clip(CircleShape)
            .background(colour),
    )
}

/**
 * Ein Eckwinkel des Suchers.
 *
 * Kein Zierrat: Die vier zeigen, wohin der QR-Code gehoert. Sie liegen
 * ausserhalb des 24er-Kastens (ihre Schenkel sind 18 dp lang), tragen aber
 * dasselbe Strichgewicht und dieselbe Rundung — auch die ECKE, die seit N12
 * ein echter Bogen ist statt zweier stumpf aneinanderstossender Striche.
 *
 * @param x,y der Punkt der Ecke, [toRight]/[toBottom] die Richtung der beiden
 *   Schenkel von dort aus.
 */
internal fun DrawScope.drawViewfinderCorner(
    x: Float,
    y: Float,
    toRight: Boolean,
    toBottom: Boolean,
    leg: Float,
    colour: Color,
) {
    val stroke = Glyph.stroke.toPx()
    val half = stroke / 2f
    val dx = if (toRight) 1f else -1f
    val dy = if (toBottom) 1f else -1f
    // Der Bogen hat den Radius einer Strichbreite — dieselbe Rundung, die die
    // runde Kappe an jedem anderen Zeichen erzeugt.
    val radius = stroke

    // Auf der Mitte des Strichs verankert, damit die AUSSENkante genau auf dem
    // Einzug liegt: Ein Strich waechst in beide Richtungen um seine halbe
    // Breite.
    val cx = x + dx * half
    val cy = y + dy * half

    val path = Path().apply {
        moveTo(cx, cy + dy * leg)
        lineTo(cx, cy + dy * radius)
        quadraticTo(cx, cy, cx + dx * radius, cy)
        lineTo(cx + dx * leg, cy)
    }
    drawPath(
        path = path,
        color = colour,
        style = Stroke(width = stroke, cap = StrokeCap.Round, join = StrokeJoin.Round),
    )
}
