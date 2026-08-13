package io.github.keco216.clockwork

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
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
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.Canvas
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
        setContent { ClockworkApp() }
    }
}

@Composable
private fun ClockworkApp() {
    /* Kein Hell/Dunkel-Umschalter, wie im Web: Die App folgt der
       Systemeinstellung. `isSystemInDarkTheme()` ist das Gegenstueck zu
       `prefers-color-scheme`.

       Die beiden Werte hier sind `--ground` aus src/styles/tokens.css. In P3
       loest ein Token-Objekt sie ab, samt Dauerpruefung gegen die CSS-Datei —
       bis dahin stehen sie genau zweimal im Projekt (hier und im XML-Theme),
       und das ist eine Stelle zu viel. Deshalb ist P3 der naechste Posten. */
    val dark = isSystemInDarkTheme()
    val ground = if (dark) Color(0xFF060607) else Color(0xFFF5F5F5)
    val ink = if (dark) Color(0xFFFCFCFC) else Color(0xFF18181B)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ground)
            .systemBarsPadding(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        EmblemPlaceholder(tint = ink, modifier = Modifier.size(96.dp))
    }
}

/**
 * Platzhalter fuer das Emblem (Zeichen A — die 30er-Skala).
 *
 * Bewusst noch NICHT das echte Zifferblatt: Dessen Proportionen stehen als
 * `--dial-*`-Token in tokens.css und wandern in P3 nach Tokens.kt, gezeichnet
 * wird es in P5 zusammen mit dem Kanalzug. Was hier steht, ist die Geometrie
 * in ihrer einfachsten Form — 30 Marken im 12-Grad-Schritt, stumpfe
 * Strichenden. Stumpf ist keine Kleinigkeit: Ein abgerundeter Strich auf einer
 * Teilung ist eine ungenaue Angabe.
 */
@Composable
private fun EmblemPlaceholder(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) { drawScale(tint) }
}

private fun DrawScope.drawScale(tint: Color) {
    val radius = size.minDimension / 2f
    val center = Offset(size.width / 2f, size.height / 2f)

    // Verhaeltnisse aus dem Markenhandbuch: Marke 0,20*R lang, 0,048*R stark.
    val markLength = radius * 0.20f
    val markWidth = radius * 0.048f

    repeat(30) { index ->
        // 12 Grad je Marke, 0 Uhr oben. Bogenmass, weil sin/cos damit rechnen.
        val angle = Math.toRadians(index * 12.0 - 90.0)
        val outer = radius
        val inner = radius - markLength
        drawLine(
            color = tint,
            start = center + Offset((cos(angle) * inner).toFloat(), (sin(angle) * inner).toFloat()),
            end = center + Offset((cos(angle) * outer).toFloat(), (sin(angle) * outer).toFloat()),
            strokeWidth = markWidth,
            cap = StrokeCap.Butt,
        )
    }

    // Die Nabe — 0,052*R. Das Zeichen braucht einen Mittelpunkt, sonst zerfaellt
    // die Teilung optisch in einen Kreis aus Strichen.
    drawCircle(color = tint, radius = radius * 0.052f, center = center, style = Stroke(markWidth))
}

@Preview
@Composable
private fun ClockworkAppPreview() {
    ClockworkApp()
}
