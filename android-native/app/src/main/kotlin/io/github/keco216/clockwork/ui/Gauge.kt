package io.github.keco216.clockwork.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import io.github.keco216.clockwork.ui.theme.Dial
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.Motion
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

    /* ── Die drei Farben stehen jetzt so, wie sie im Web stehen (N15) ──────
       Kevins Befund am Geraet: „beim logo design die uhr muss beim zeiger
       orange sein." Er hat recht, und es war nicht Geschmack, sondern ein
       Paritaetsfehler — gleich ein dreifacher. Die Web-Fassung sagt in
       `styles/mark.css`:

         .dialface__tick     { stroke: var(--ink-3) }
         .dialface__handMark { stroke: var(--signal-text) }   ← IMMER
         .dialface__hub      { fill:   var(--ink) }
         .strip--expiring .dialface__tick { stroke: var(--signal-text) }
         .strip--copied   .dialface__hub  { fill:   var(--signal-text) }

       Nativ stand dagegen: Zeiger in `--ink-2` und nur in den letzten fuenf
       Sekunden in Signal, Nabe in derselben Farbe wie der Zeiger, Marken nie
       in Signal. Damit war der EINE Akzent des Zifferblatts verschwunden — und
       der Zeiger ist genau die Stelle, an der die Marke ihn traegt (das Emblem
       hat seine Signalmarke auf 12 Uhr, die Wortmarke ihren Index, das C-Werk
       sein Lager).

       Warum der TIEFE Signal-Ton und nicht der Markenwert: Der Zeiger ist
       0,073 R stark, also feine Geometrie — und `#f05a28` haelt auf der
       beruehrten Flaeche hell nur 2,89:1. Steht so gemessen in mark.css.

       Was `expiring` jetzt tut, ist die Umkehrung des alten Fehlers: Nicht der
       Zeiger wird orange (der ist es schon), sondern die TEILUNG zieht mit an.
       Im Web ist das „der einzige Moment, in dem das Geraet von sich aus
       Signalfarbe zeigt". */
    val tickColour = if (expiring) colors.signalText else colors.ink3
    val handColour = colors.signalText

    /* Die Nabe traegt `--ink` und quittiert das Kopieren — und sie FAEHRT
       dabei, weil sie es im Web auch tut (`transition: fill var(--dur-calm)`).
       Als Farbfahrt und nicht als Animation: Steht die Animator-Skala auf 0,
       springt der Wert, und die Quittung ist trotzdem da. */
    val hubColour by animateColorAsState(
        targetValue = if (copied) colors.signalText else colors.ink,
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "dial-hub",
    )

    Canvas(modifier = modifier) {
        drawDial(
            progress = progress.coerceIn(0.0, 1.0),
            period = period,
            tickColour = tickColour,
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
