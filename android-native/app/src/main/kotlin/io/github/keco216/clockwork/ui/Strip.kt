package io.github.keco216.clockwork.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.style.TextOverflow
import io.github.keco216.clockwork.core.groupDigits
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.Motion
import io.github.keco216.clockwork.ui.theme.TextStyles
import io.github.keco216.clockwork.ui.theme.Typo
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Der Kanalzug — eine Zeile je Konto.
 *
 * ── Konten sind keine Karten ──────────────────────────────────────────────
 * Die naheliegende Umsetzung waere ein Kaertchen je Konto. Das waere das
 * genaue Gegenteil der Identitaet dieser App: Erhoben und gerundet ist die
 * GRUPPE, die Zuege darin bleiben Zuege, getrennt durch eine Haarlinie. Drei
 * Dutzend schwebende Kaertchen waeren ein anderes Produkt.
 */
@Composable
fun Strip(
    title: String,
    subtitle: String?,
    spec: String,
    code: String,
    nextCode: String,
    progress: Double,
    period: Int,
    onCopy: (String) -> Unit,
    modifier: Modifier = Modifier,
    lead: Boolean = false,
) {
    val colors = LocalColors.current
    val remaining = remainingSeconds(progress, period)
    val expiring = remaining <= 5

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = Dimens.sp3),
        verticalArrangement = Arrangement.spacedBy(Dimens.gapPair),
    ) {
        // Kopfzeile: Name und Parameter-Chip sind ein PAAR, also 8 dp Fuge.
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                BasicText(
                    text = title,
                    style = TextStyles.lead.copy(color = colors.ink),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (subtitle != null) {
                    BasicText(
                        text = subtitle,
                        style = TextStyles.micro.copy(color = colors.ink3),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            Chip(label = spec, accent = true)
        }

        // Die Code-Zeile: Zifferblatt links, Code, Kopiertaste rechts — alle
        // drei in DIESER Zeile zentriert und damit auf einer Achse. Genau das
        // war der V8-Befund: Vorher liefen Blatt und Taste ueber alle drei
        // Zeilen und lagen 4,5 px neben dem Code.
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Gauge(
                progress = progress,
                period = period,
                expiring = expiring,
                modifier = Modifier.size(Dimens.controlHLg),
            )
            FlippingCode(
                code = code,
                modifier = Modifier.weight(1f),
            )
            Key(
                label = text("key.copy"),
                onClick = { onCopy(code) },
                variant = KeyVariant.Default,
            )
        }

        // Die folgt-Zeile. Sie zeigt, dass der naechste Code jetzt schon
        // feststeht — TOTP rechnet, es fragt nicht.
        BasicText(
            text = "${text("strip.next")} ${groupDigits(nextCode)} · " +
                "$remaining ${text("strip.seconds.abbr")}",
            style = TextStyles.micro.copy(color = colors.ink3),
            maxLines = 1,
        )
    }
}

/**
 * Der Code mit dem Fallblatt-Umsprung.
 *
 * ── Nur die Ziffern, die sich WIRKLICH aendern ────────────────────────────
 * Wie an einer Fallblattanzeige, wo auch nur die rollenden Blaetter fallen.
 * Waehrend eines Wechsels von 483232 auf 483556 bewegen sich drei Ziffern,
 * nicht sechs.
 *
 * ── Die Stauchung ist 45 %, nicht 6 % ─────────────────────────────────────
 * Die genauere Nachbildung waere fuer den Bruchteil einer Sekunde unlesbar,
 * und bei einem Code, den jemand gerade abtippt, ist das ein Nutzungsfehler
 * und kein Charme. Aus demselben Grund startet die Deckkraft bei 0,7 und
 * nicht darunter: Bei 190 ms waere weniger als Blinzeln sichtbar.
 */
@Composable
private fun FlippingCode(code: String, modifier: Modifier = Modifier) {
    val colors = LocalColors.current
    val grouped = groupDigits(code)

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.Start,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        grouped.forEachIndexed { index, char ->
            if (char == ' ') {
                // Die Fuge zwischen den Bloecken ist Teil der Lesbarkeit, kein
                // Zeichen — sie flippt nie.
                BasicText(
                    text = " ",
                    style = TextStyles.dial.copy(color = colors.ink, fontSize = Typo.dialMin),
                )
            } else {
                FlippingDigit(
                    digit = char,
                    // Der Versatz zaehlt die tatsaechlich wechselnden Stellen,
                    // nicht ihre Position — 20 ms je Stelle. Weniger sieht aus
                    // wie ein Fehler, mehr wie eine Animation.
                    staggerIndex = index,
                )
            }
        }
    }
}

@Composable
private fun FlippingDigit(digit: Char, staggerIndex: Int) {
    val colors = LocalColors.current
    val scaleY = remember { Animatable(1f) }
    val alpha = remember { Animatable(1f) }

    LaunchedEffect(digit) {
        // `snapTo` statt eines Startwerts: `Animatable` steht auf 1f, damit die
        // Ziffer beim ERSTEN Zeichnen still steht. Nur ein Wechsel ist ein
        // Wechsel — ein Kanalzug, der beim Erscheinen einmal durchfaellt, waere
        // eine Animation und keine Mitteilung.
        scaleY.snapTo(0.45f)
        alpha.snapTo(0.7f)
        delay((staggerIndex * Motion.staggerFlap).toLong())
        launch { alpha.animateTo(1f, tween(Motion.snap, easing = Motion.spring)) }
        scaleY.animateTo(1f, tween(Motion.snap, easing = Motion.spring))
    }

    BasicText(
        text = digit.toString(),
        style = TextStyles.dial.copy(color = colors.ink, fontSize = Typo.dialMin),
        modifier = Modifier
            .scale(scaleX = 1f, scaleY = scaleY.value)
            .alpha(alpha.value),
    )
}

/** Ein Kanalzug, der eine kaputte Zeile meldet statt eines Codes. */
@Composable
fun FaultStrip(source: String, message: String, modifier: Modifier = Modifier) {
    val colors = LocalColors.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = Dimens.sp3),
        verticalArrangement = Arrangement.spacedBy(Dimens.gapPair),
    ) {
        BasicText(
            text = text("fault.title"),
            style = TextStyles.small.copy(color = colors.fault),
        )
        BasicText(
            text = message,
            style = TextStyles.body.copy(color = colors.ink2),
        )
        Box {
            BasicText(
                text = io.github.keco216.clockwork.core.truncateForDisplay(source),
                style = TextStyles.micro.copy(color = colors.ink3),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}
