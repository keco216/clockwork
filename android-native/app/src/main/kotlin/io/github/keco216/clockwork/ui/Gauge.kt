package io.github.keco216.clockwork.ui

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import io.github.keco216.clockwork.ui.theme.Dial
import io.github.keco216.clockwork.ui.theme.LocalColors
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * Das Zifferblatt — Zeichen A des Markensystems, in Betrieb.
 *
 * ── Es ist KEIN Donut-Ring ────────────────────────────────────────────────
 * Es gibt keinen Kreisbogen, der sich leert: 30 einzelne Striche, ein Zeiger,
 * eine Nabe. Ein Zeiger auf einer Teilung zeigt eine ABLESBARE Position
 * („noch acht Marken"), und darum geht es bei einem Code, der in einer
 * zaehlbaren Anzahl Sekunden ungueltig wird.
 *
 * ── Der Zeiger rechnet linear ─────────────────────────────────────────────
 * Eine Umdrehung je Periode, angetrieben vom Fortschritt der Uhr. KEINE
 * Federkurve — eine Federkurve auf einer Zeitanzeige waere eine Luege ueber
 * die Zeit. Dieselbe Trennung wie im Web und beim Wartezeiger.
 *
 * ── Stumpfe Strichenden ───────────────────────────────────────────────────
 * `StrokeCap.Butt`, und das ist keine Kleinigkeit: Ein abgerundeter Strich auf
 * einer Teilung ist eine ungenaue Angabe.
 */
@Composable
fun Gauge(
    progress: Double,
    modifier: Modifier = Modifier,
    period: Int = 30,
    expiring: Boolean = false,
    /**
     * Frisch kopiert (N14) — dann traegt die NABE den Akzent.
     *
     * Woertlich die Regel der Web-Fassung: `.strip--copied .dialface__hub
     * { fill: var(--signal-text) }`. Nur die Nabe, nicht der Zeiger: Der
     * zeigt die Zeit an und darf nicht behaupten, sie sei abgelaufen.
     *
     * Und als ZUSTAND, nicht als Animation — wer Bewegung abstellt, soll die
     * Quittung trotzdem sehen. Derselbe Satz steht im Web in mark.css.
     */
    copied: Boolean = false,
) {
    val colors = LocalColors.current
    // Die letzten fuenf Sekunden sind einer der wenigen Zustaende MIT
    // Bedeutung — also einer der wenigen, die den Akzent tragen duerfen.
    val handColour = if (expiring) colors.signalText else colors.ink2
    // Nur die NABE quittiert das Kopieren — der Zeiger zeigt die Zeit an.
    val hubColour = if (copied) colors.signalText else handColour

    Canvas(modifier = modifier) {
        drawDial(
            progress = progress.coerceIn(0.0, 1.0),
            period = period,
            tickColour = colors.ink3,
            handColour = handColour,
            hubColour = hubColour,
        )
    }
}

private fun DrawScope.drawDial(
    progress: Double,
    period: Int,
    tickColour: Color,
    handColour: Color,
    hubColour: Color,
) {
    val radius = size.minDimension / 2f
    val center = Offset(size.width / 2f, size.height / 2f)

    /* Wie viele Marken?
       Bei der ueblichen Periode von 30 s ist es eine Marke je Sekunde — genau
       das Emblem. Bei laengeren Perioden wird die Teilung ausgeduennt, statt
       sie zuzukleistern: 60 Marken auf einem 44-dp-Blatt waeren ein grauer
       Ring. Bei genau 60 s stehen 60 Marken, so wie im Web. */
    val ticks = when {
        period <= Dial.TICK_COUNT -> period
        period <= 60 -> period
        else -> Dial.TICK_COUNT
    }.coerceAtLeast(1)

    val tickLength = radius * Dial.TICK_LENGTH
    val tickWidth = radius * Dial.TICK_WIDTH

    repeat(ticks) { index ->
        val angle = Math.toRadians(index * (360.0 / ticks) - 90.0)
        val inner = radius - tickLength
        drawLine(
            color = tickColour,
            start = center + Offset((cos(angle) * inner).toFloat(), (sin(angle) * inner).toFloat()),
            end = center + Offset((cos(angle) * radius).toFloat(), (sin(angle) * radius).toFloat()),
            strokeWidth = tickWidth,
            cap = StrokeCap.Butt,
        )
    }

    // Der Zeiger: eine Umdrehung je Periode, 0 Uhr oben.
    val handAngle = Math.toRadians(progress * 360.0 - 90.0)
    val handLength = radius * Dial.HAND_LENGTH
    drawLine(
        color = handColour,
        start = center,
        end = center + Offset(
            (cos(handAngle) * (radius - handLength)).toFloat(),
            (sin(handAngle) * (radius - handLength)).toFloat(),
        ),
        strokeWidth = radius * Dial.HAND_WIDTH,
        cap = StrokeCap.Butt,
    )

    drawCircle(color = hubColour, radius = radius * Dial.HUB, center = center)
}

/** Die verbleibenden Sekunden als Text — fuer die Zeile unter dem Code. */
fun remainingSeconds(progress: Double, period: Int): Int =
    ((1.0 - progress) * period).roundToInt().coerceIn(1, period)
