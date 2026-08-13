package io.github.keco216.clockwork.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
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
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import io.github.keco216.clockwork.core.groupDigits
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.Motion
import io.github.keco216.clockwork.ui.theme.TextStyles
import io.github.keco216.clockwork.ui.theme.Typo
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Unter dieser FENSTERbreite traegt die Karte das Kompaktraster.
 *
 * Die Web-Fassung schaltet bei `max-width: 26.1875rem` um — 419 px, also
 * „unter 420". Gemessen am Geraet, fuer das der Umbau gebaut ist: Das Galaxy
 * S24 Ultra meldet 1440 px bei Dichte 600, macht 1440 / (600/160) = **384 dp**
 * und liegt damit klar darunter. Die Zahl steht hier, weil „unter 420" ohne
 * sie eine Behauptung waere — auf einem Geraet mit 480 dp greift die Regel
 * eben NICHT, und das ist Absicht.
 */
private const val COMPACT_BELOW_DP = 420

/**
 * Wie viel der KARTENbreite die Ziffer einnimmt — das `cqi` der Web-Fassung.
 *
 * Ohne Blatt daneben hat der Code die volle Breite und darf groesser werden:
 * 14 % statt 10 %. Beide Werte stehen so in `style.css`.
 */
private const val DIAL_CQI_WIDE = 0.10f
private const val DIAL_CQI_COMPACT = 0.14f

/**
 * Der Kanalzug — eine Zeile je Konto.
 *
 * ── Konten sind keine Karten ──────────────────────────────────────────────
 * Die naheliegende Umsetzung waere ein Kaertchen je Konto. Das waere das
 * genaue Gegenteil der Identitaet dieser App: Erhoben und gerundet ist die
 * GRUPPE, die Zuege darin bleiben Zuege, getrennt durch eine Haarlinie. Drei
 * Dutzend schwebende Kaertchen waeren ein anderes Produkt.
 *
 * ── Zwei Raster, und warum es zwei sein muessen ───────────────────────────
 * Der erste Wurf fuehrte den Code mit `weight(1f)` zwischen Blatt und
 * Kopiertaste. Das war falsch, und zwar messbar: `BasicText` SCHRUMPFT NICHT.
 * Es nimmt seine Schriftgroesse, laeuft ueber den zugewiesenen Platz hinaus,
 * und der Nachbar legt sich darueber — auf dem S24 verschwand die letzte
 * Ziffer von „768 449" hinter „Kopieren". Ein Code, dem eine Ziffer fehlt,
 * ist schlimmer als gar keiner: Man sieht ihm nicht an, dass er unvollstaendig
 * ist, und tippt ihn ab.
 *
 * Die Web-Fassung loest das seit V10 nicht mit kleinerer Schrift, sondern mit
 * einem anderen Raster — und genau das ist hier portiert. Weder Ellipse noch
 * Schrumpfen kaemen infrage: Beide machen aus einem falschen Layout einen
 * falschen Code.
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
    val remaining = remainingSeconds(progress, period)
    val expiring = remaining <= 5

    // Die FENSTERbreite entscheidet ueber das Raster, so wie im Web die
    // Media Query. Die KARTENbreite entscheidet ueber die Ziffergroesse, so
    // wie dort `cqi`. Zwei verschiedene Masse fuer zwei verschiedene Fragen —
    // das ist keine Unsauberkeit, sondern die Vorlage.
    val compact = LocalConfiguration.current.screenWidthDp < COMPACT_BELOW_DP

    BoxWithConstraints(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = Dimens.sp3),
    ) {
        // `clamp(--t-dial-min, Ncqi, --t-dial-max)` in Kotlin. Die Grenzen
        // stehen in `sp` und wachsen deshalb mit der Schriftgroesse des
        // Systems; der mittlere Wert kommt ueber `toSp()` aus der Kartenbreite
        // und tut das nicht — genau die Mischung, die `rem` und `cqi` im Web
        // ergeben.
        //
        // Von Hand geklemmt und nicht ueber `coerceIn`: `TextUnit` ist eine
        // Value-Class mit `compareTo`-OPERATOR, implementiert aber kein
        // `Comparable` — `coerceIn` verlangt genau das und findet keinen
        // Kandidaten.
        val fromWidth = with(LocalDensity.current) {
            (maxWidth * if (compact) DIAL_CQI_COMPACT else DIAL_CQI_WIDE).toSp()
        }
        val codeSize = when {
            fromWidth < Typo.dialMin -> Typo.dialMin
            fromWidth > Typo.dialMax -> Typo.dialMax
            else -> fromWidth
        }

        Column(verticalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
            if (compact) {
                CompactStrip(
                    title = title,
                    subtitle = subtitle,
                    spec = spec,
                    code = code,
                    codeSize = codeSize,
                    progress = progress,
                    period = period,
                    expiring = expiring,
                    onCopy = onCopy,
                )
            } else {
                WideStrip(
                    title = title,
                    subtitle = subtitle,
                    spec = spec,
                    code = code,
                    codeSize = codeSize,
                    progress = progress,
                    period = period,
                    expiring = expiring,
                    onCopy = onCopy,
                )
            }

            // Die folgt-Zeile. Sie zeigt, dass der naechste Code jetzt schon
            // feststeht — TOTP rechnet, es fragt nicht.
            BasicText(
                text = "${text("strip.next")} ${groupDigits(nextCode)} · " +
                    "$remaining ${text("strip.seconds.abbr")}",
                style = TextStyles.micro.copy(color = LocalColors.current.ink3),
                maxLines = 1,
            )

            // Im Kompaktraster steht die Kopiertaste GANZ UNTEN und ueber die
            // volle Kartenbreite: Kopieren ist DIE Handlung dieser Karte, und
            // unten ist die Daumenzone. 44 dp ist die lg-Sprosse der
            // Hoehenleiter — dieselbe Zahl wie im Web.
            if (compact) {
                Key(
                    label = text("key.copy"),
                    onClick = { onCopy(code) },
                    modifier = Modifier.fillMaxWidth(),
                    variant = KeyVariant.Default,
                    large = true,
                )
            }
        }
    }
}

/**
 * Das Raster unter 420 dp: Blatt neben dem Namen, Code in voller Breite.
 *
 * Die Kopfzeile ist hier ein BLOCK und keine Zeile — bei dieser Breite ist
 * „Chip daneben" keine Option mehr. Im Web macht das `display: block`.
 */
@Composable
private fun CompactStrip(
    title: String,
    subtitle: String?,
    spec: String,
    code: String,
    codeSize: TextUnit,
    progress: Double,
    period: Int,
    expiring: Boolean,
    onCopy: (String) -> Unit,
) {
    val colors = LocalColors.current

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
            // `margin-block-start: var(--sp-1)` der Web-Fassung.
            Box(modifier = Modifier.padding(top = Dimens.sp1)) {
                Chip(label = spec, accent = true)
            }
        }
    }

    // Der Code ueber die ganze Kartenbreite — hier kann ihm nichts mehr in den
    // Weg laufen, weil nichts mehr daneben steht.
    FlippingCode(code = code, fontSize = codeSize, modifier = Modifier.fillMaxWidth())
}

/**
 * Das Raster ab 420 dp: Blatt, Code und Kopiertaste in EINER Zeile.
 *
 * Alle drei stehen in der CODE-Zeile und sind darin zentriert, liegen also auf
 * einer Achse. Das war der V8-Befund: Vorher liefen Blatt und Taste ueber alle
 * drei Zeilen und lagen damit auf der Mitte von Kopfzeile, Code und Metazeile
 * zusammen — gemessen 4,5 px neben dem Code.
 */
@Composable
private fun WideStrip(
    title: String,
    subtitle: String?,
    spec: String,
    code: String,
    codeSize: TextUnit,
    progress: Double,
    period: Int,
    expiring: Boolean,
    onCopy: (String) -> Unit,
) {
    val colors = LocalColors.current

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

    Row(
        modifier = Modifier.fillMaxWidth(),
        // `column-gap: var(--gap-group)` — 24 dp, nicht 8. Im ersten Wurf
        // stand hier die Paar-Fuge; die Web-Fassung setzt an dieser einen
        // Stelle die Gruppen-Fuge, weil Blatt, Code und Taste drei Dinge sind
        // und kein Paar.
        horizontalArrangement = Arrangement.spacedBy(Dimens.gapGroup),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Gauge(
            progress = progress,
            period = period,
            expiring = expiring,
            modifier = Modifier.size(Dimens.controlHLg),
        )
        FlippingCode(code = code, fontSize = codeSize, modifier = Modifier.weight(1f))
        Key(
            label = text("key.copy"),
            onClick = { onCopy(code) },
            variant = KeyVariant.Default,
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
private fun FlippingCode(code: String, fontSize: TextUnit, modifier: Modifier = Modifier) {
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
                    style = TextStyles.dial.copy(color = colors.ink, fontSize = fontSize),
                )
            } else {
                FlippingDigit(
                    digit = char,
                    fontSize = fontSize,
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
private fun FlippingDigit(digit: Char, fontSize: TextUnit, staggerIndex: Int) {
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
        style = TextStyles.dial.copy(color = colors.ink, fontSize = fontSize),
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
