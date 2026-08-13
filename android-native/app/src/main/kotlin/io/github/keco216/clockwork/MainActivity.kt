package io.github.keco216.clockwork

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.tooling.preview.Preview
import io.github.keco216.clockwork.ui.theme.ClockworkTheme
import io.github.keco216.clockwork.ui.theme.Dial
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.LocalColors
import kotlin.math.cos
import kotlin.math.sin

/**
 * Die einzige Activity der App.
 *
 * Kein Fragment, kein Navigations-Framework, keine zweite Activity: Die
 * Web-Fassung hat genau EINE Buehne mit zwei Zustaenden (`data-stage`
 * vacant/working), und die native Fassung bildet dieselbe Struktur ab. Ein
 * Navigationsgraph fuer eine Seite waere Apparat ohne Aufgabe.
 *
 * `AppCompatActivity` statt `ComponentActivity` hat genau einen Grund, und der
 * steht in P4: Unterhalb von API 33 traegt AppCompat die per-App-Sprachwahl,
 * und minSdk ist 26. Das Compose-`setContent` funktioniert unveraendert —
 * AppCompatActivity ist ueber FragmentActivity selbst eine ComponentActivity.
 */
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        /* Randlos wie die Web-Fassung unter `viewport-fit=cover`. Die Fugen zu
           den Systemleisten setzt danach `systemBarsPadding()` — dieselbe
           Rolle wie `env(safe-area-inset-*)` im CSS, und dieselbe Falle: Sie
           oben zu vergessen legte in V6 den klebenden Kopf unter die
           Statusleiste. */
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            ClockworkTheme { VacantStage() }
        }
    }
}

/**
 * Die Leer-Buehne, vorerst nur mit dem Emblem.
 *
 * Der volle Zustand — Emblem in 2,2-facher Groesse, ein Satz, das Feld, drei
 * Tasten — kommt in P5, wenn die Bauteile stehen und die 37 Sprachen (P4) die
 * Texte liefern. Was hier schon gilt: Jede Farbe kommt aus [LocalColors], kein
 * Wert steht im Bauteil.
 */
@Composable
private fun VacantStage() {
    val colors = LocalColors.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.ground)
            .systemBarsPadding(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Emblem(tint = colors.ink, modifier = Modifier.size(Dimens.dialSize))
    }
}

/**
 * Zeichen A — die 30er-Skala.
 *
 * Dieselbe Geometrie wie das Emblem im Markenhandbuch und wie das Zifferblatt
 * neben jedem Code: 30 Marken im 12-Grad-Schritt, die Verhaeltnisse aus den
 * `dial-*`-Token. Stumpfe Strichenden sind dabei keine Kleinigkeit — ein
 * abgerundeter Strich auf einer Teilung ist eine ungenaue Angabe.
 *
 * Der drehende Zeiger kommt in P5 dazu; hier steht das ruhende Zeichen.
 */
@Composable
fun Emblem(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) { drawScale(tint) }
}

private fun DrawScope.drawScale(tint: Color) {
    val radius = size.minDimension / 2f
    val center = Offset(size.width / 2f, size.height / 2f)

    val markLength = radius * Dial.TICK_LENGTH
    val markWidth = radius * Dial.TICK_WIDTH

    repeat(Dial.TICK_COUNT) { index ->
        // 360 / 30 = 12 Grad je Marke, 0 Uhr oben. Bogenmass, weil sin und cos
        // damit rechnen.
        val angle = Math.toRadians(index * (360.0 / Dial.TICK_COUNT) - 90.0)
        val inner = radius - markLength
        drawLine(
            color = tint,
            start = center + Offset((cos(angle) * inner).toFloat(), (sin(angle) * inner).toFloat()),
            end = center + Offset((cos(angle) * radius).toFloat(), (sin(angle) * radius).toFloat()),
            strokeWidth = markWidth,
            cap = StrokeCap.Butt,
        )
    }

    // Die Nabe. Das Zeichen braucht einen Mittelpunkt, sonst zerfaellt die
    // Teilung optisch in einen Kreis aus Strichen.
    drawCircle(color = tint, radius = radius * Dial.HUB, center = center, style = Stroke(markWidth))
}

@Preview
@Composable
private fun VacantStagePreview() {
    ClockworkTheme { VacantStage() }
}
