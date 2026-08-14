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
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
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
 * Wie lange „Kopiert" stehen bleibt.
 *
 * `COPY_FEEDBACK_MS` aus `strip.ts`, unveraendert uebernommen — die Quittung
 * soll auf beiden Fassungen gleich lang stehen.
 */
private const val COPY_FEEDBACK_MS = 1600L

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

    /* ── Die Kopier-Quittung (N14) ─────────────────────────────────────────
       1,6 s lang steht „Kopiert" in der Taste, und die Nabe des Zifferblatts
       traegt so lange den Akzent. Beides zusammen ist die Quittung der
       Web-Fassung; nativ fehlte sie bis N14.

       Ein ZAEHLER statt eines blossen Schalters: Wer zweimal hintereinander
       kopiert, soll die Meldung zweimal EINTRETEN sehen. Ein Schalter, der
       schon auf true steht, loeste keine zweite Fahrt aus. */
    var copyStamp by remember { mutableIntStateOf(0) }
    var copied by remember { mutableStateOf(false) }
    LaunchedEffect(copyStamp) {
        if (copyStamp == 0) return@LaunchedEffect
        copied = true
        delay(COPY_FEEDBACK_MS)
        copied = false
    }
    val copyNow: () -> Unit = {
        onCopy(code)
        copyStamp++
    }

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

        val meta = "${text("strip.next")} ${groupDigits(nextCode)} · " +
            "$remaining ${text("strip.seconds.abbr")}"

        if (compact) {
            CompactStrip(
                title = title,
                subtitle = subtitle,
                spec = spec,
                code = code,
                codeSize = codeSize,
                meta = meta,
                progress = progress,
                period = period,
                expiring = expiring,
                copied = copied,
                copyStamp = copyStamp,
                onCopyTap = copyNow,
            )
        } else {
            WideStrip(
                title = title,
                subtitle = subtitle,
                spec = spec,
                code = code,
                codeSize = codeSize,
                meta = meta,
                progress = progress,
                period = period,
                expiring = expiring,
                copied = copied,
                copyStamp = copyStamp,
                onCopyTap = copyNow,
            )
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
    meta: String,
    progress: Double,
    period: Int,
    expiring: Boolean,
    copied: Boolean,
    copyStamp: Int,
    onCopyTap: () -> Unit,
) {
    val colors = LocalColors.current

    Column(verticalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Gauge(
                progress = progress,
                period = period,
                expiring = expiring,
                copied = copied,
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

        // Der Code ueber die ganze Kartenbreite — hier kann ihm nichts mehr in
        // den Weg laufen, weil nichts mehr daneben steht.
        FlippingCode(
            code = code,
            fontSize = codeSize,
            modifier = Modifier.fillMaxWidth(),
            onCopy = onCopyTap,
        )

        BasicText(
            text = meta,
            style = TextStyles.micro.copy(color = colors.ink3),
            maxLines = 1,
        )

        // Kopieren ist DIE Handlung dieser Karte, und unten ist die Daumenzone.
        // 44 dp ist die lg-Sprosse der Hoehenleiter — dieselbe Zahl wie im Web.
        CopyKey(
            copied = copied,
            stamp = copyStamp,
            onCopy = onCopyTap,
            modifier = Modifier.fillMaxWidth(),
            large = true,
        )
    }
}

/**
 * Das Raster ab 420 dp — und zwar als echtes Raster.
 *
 * Die Web-Fassung schreibt drei Spalten (auto / 1fr / auto) und drei Zeilen,
 * in denen Kopf und Meta NUR die mittlere Spalte belegen und Blatt und Taste
 * nur die Code-Zeile. Zwei Eigenschaften stecken darin, und beide gehen mit
 * uebereinander gestapelten Zeilen verloren:
 *
 * 1. **Kopfzeile und Metazeile stehen in der CODE-Spalte**, nicht ueber der
 *    ganzen Karte. Der Name beginnt also dort, wo der Code beginnt — sonst
 *    zerfaellt die Karte optisch in etwas Breites und etwas Schmales.
 * 2. **Blatt und Taste stehen NUR in der Code-Zeile** und sind darin
 *    zentriert. Das war der V8-Befund: Liefen sie ueber alle drei Zeilen,
 *    lagen sie auf der Mitte von Kopf, Code und Meta zusammen — gemessen
 *    4,5 px neben dem Code, weil die drei Zeilen nicht symmetrisch sind.
 *
 * Compose hat kein CSS-Raster, also steht hier ein eigenes `Layout`. Das ist
 * kuerzer als der Versuch, dasselbe mit Fuellabstaenden nachzustellen — und
 * vor allem rechnet es die Spaltenbreite aus den GEMESSENEN Bauteilen statt
 * aus geratenen Zahlen.
 */
@Composable
private fun WideStrip(
    title: String,
    subtitle: String?,
    spec: String,
    code: String,
    codeSize: TextUnit,
    meta: String,
    progress: Double,
    period: Int,
    expiring: Boolean,
    copied: Boolean,
    copyStamp: Int,
    onCopyTap: () -> Unit,
) {
    val colors = LocalColors.current

    Layout(
        modifier = Modifier.fillMaxWidth(),
        content = {
            // Reihenfolge = Rolle. Sie wird unten beim Messen wieder
            // auseinandergenommen; wer hier umsortiert, muss dort mitziehen.
            Gauge(
                progress = progress,
                period = period,
                expiring = expiring,
                copied = copied,
                modifier = Modifier.size(Dimens.controlHLg),
            )
            Row(
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
            FlippingCode(code = code, fontSize = codeSize, onCopy = onCopyTap)
            BasicText(
                text = meta,
                style = TextStyles.micro.copy(color = colors.ink3),
                maxLines = 1,
            )
            CopyKey(copied = copied, stamp = copyStamp, onCopy = onCopyTap)
        },
    ) { measurables, constraints ->
        val gaugeM = measurables[0]
        val headM = measurables[1]
        val codeM = measurables[2]
        val metaM = measurables[3]
        val copyM = measurables[4]

        val columnGap = Dimens.gapGroup.roundToPx()
        val rowGap = Dimens.gapPair.roundToPx()
        val full = constraints.maxWidth

        // Die beiden Randspalten sind auto — sie bekommen, was sie brauchen.
        val loose = constraints.copy(minWidth = 0, maxWidth = Constraints.Infinity)
        val gauge = gaugeM.measure(loose)
        val copy = copyM.measure(loose)

        // Die Mittelspalte ist minmax(0, 1fr): der Rest, aber nie negativ.
        val middle = (full - gauge.width - copy.width - 2 * columnGap).coerceAtLeast(0)
        val middleC = constraints.copy(minWidth = 0, maxWidth = middle)
        val head = headM.measure(middleC)
        val codeP = codeM.measure(middleC)
        val metaP = metaM.measure(middleC)

        // Die Code-Zeile wird so hoch wie ihr groesstes Bauteil — kein
        // Ausgleichswert, den man beim naechsten Schriftwechsel nachrechnen
        // muesste.
        val codeRow = maxOf(gauge.height, codeP.height, copy.height)
        val height = head.height + rowGap + codeRow + rowGap + metaP.height
        val left = gauge.width + columnGap
        val codeTop = head.height + rowGap

        layout(full, height) {
            head.place(left, 0)
            gauge.place(0, codeTop + (codeRow - gauge.height) / 2)
            codeP.place(left, codeTop + (codeRow - codeP.height) / 2)
            copy.place(full - copy.width, codeTop + (codeRow - copy.height) / 2)
            metaP.place(left, codeTop + codeRow + rowGap)
        }
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
private fun FlippingCode(
    code: String,
    fontSize: TextUnit,
    modifier: Modifier = Modifier,
    onCopy: (() -> Unit)? = null,
) {
    val colors = LocalColors.current
    val grouped = groupDigits(code)
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()

    /* ── Die Ziffern kopieren selbst (N14) ────────────────────────────────
       Kevins Wunsch: „wenn ich bei den Zahlen antippe, soll auch kopiert
       sein." Das ist eine ABWEICHUNG von der Web-Fassung, und eine bewusste:
       Dort steht die Maus vor einer Taste; hier geht der Daumen zuerst auf
       die groesste Flaeche der Karte, und das sind die Ziffern.

       Die Taste bleibt trotzdem stehen. Sie ist die BESCHRIFTETE Handlung —
       ein Screenreader liest „Kopieren, Schaltflaeche", nicht „988 925". Der
       Code bekommt deshalb kein `Role.Button`, sondern eine eigene
       Beschreibung; er ist eine Abkuerzung, keine zweite Taste.

       Die Rueckmeldung ist dieselbe wie ueberall seit N14: eine Flaeche, die
       in 150 ms kommt. Sie liegt hinter den Ziffern und traegt den Feldradius,
       nicht die Pille — was man drueckt, ist hier ein Stueck Text und kein
       Bedienelement. */
    val touch by animateColorAsState(
        targetValue = if (pressed) colors.surfaceActive else Color.Transparent,
        animationSpec = tween(Motion.quick, easing = Motion.spring),
        label = "Code-Beruehrung",
    )
    val copyAria = text("strip.copyAria", mapOf("name" to code))

    Row(
        modifier = modifier
            .clip(RoundedCornerShape(Dimens.radiusField))
            .background(touch)
            .then(
                if (onCopy == null) {
                    Modifier
                } else {
                    Modifier
                        .clickable(
                            interactionSource = interaction,
                            indication = null,
                            onClick = onCopy,
                        )
                        .semantics { contentDescription = copyAria }
                },
            ),
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

/**
 * Die Kopiertaste samt Quittung — „Kopieren" wird 1,6 s lang „Kopiert" (N14).
 *
 * ── Warum das eine Paritaetsluecke war und kein Wunsch ────────────────────
 * Die Web-Fassung tut das seit V11: `key.copyDone` steht in allen 37 Sprachen
 * im Katalog, die Ressourcen lagen fertig im Baum, und `strip.ts` faehrt den
 * Wortwechsel mit dem Wert-Eintritt der Referenz. Nativ fehlte er schlicht.
 * Aufgefallen ist es Kevin am Geraet: „beim Kopieren soll was Besonderes sein."
 *
 * ── Die Zahlen sind die der Web-Fassung, nicht neu erfunden ───────────────
 *   1600 ms  wie lange das Wort stehen bleibt (`COPY_FEEDBACK_MS`)
 *   250 ms   der Eintritt: aus 8 dp Versatz und 80 % Groesse (`slot-value-in`)
 *   150 ms   der Rueckweg — nur ein Ausblenden
 *
 * Der Unterschied zwischen Hin- und Rueckweg ist Absicht und steht in
 * `strip.ts` begruendet: Der Eintritt meldet ein ERGEBNIS und darf auffallen;
 * das Zuruecksetzen ist Aufraeumen und soll es nicht.
 *
 * ── Reduzierte Bewegung ───────────────────────────────────────────────────
 * Auch hier ohne eigene Abfrage: Steht die Animator-Skala des Systems auf 0,
 * springt der Wert. Das WORT wechselt trotzdem — die Rueckmeldung ist ein
 * Zustand und keine Animation, genau wie die Nabe im Zifferblatt. Wer
 * Bewegung abstellt, verliert die Fahrt, nicht die Auskunft.
 */
@Composable
private fun CopyKey(
    copied: Boolean,
    stamp: Int,
    onCopy: () -> Unit,
    modifier: Modifier = Modifier,
    large: Boolean = false,
) {
    val enter = remember { Animatable(1f) }
    LaunchedEffect(copied, stamp) {
        enter.snapTo(0f)
        enter.animateTo(
            targetValue = 1f,
            animationSpec = tween(
                durationMillis = if (copied) Motion.calm else Motion.quick,
                easing = Motion.spring,
            ),
        )
    }

    val progress = enter.value
    val slide = with(LocalDensity.current) { (8.dp * (1f - progress)).toPx() }

    Key(
        label = if (copied) text("key.copyDone") else text("key.copy"),
        onClick = onCopy,
        modifier = modifier,
        variant = KeyVariant.Default,
        large = large,
        glyph = { tint -> CopyGlyph(tint) },
        labelModifier = Modifier.graphicsLayer {
            alpha = progress
            // Versatz und Groesse NUR auf dem Hinweg: Der Rueckweg ist im Web
            // ein reines Ausblenden.
            if (copied) {
                translationY = slide
                scaleX = 0.8f + 0.2f * progress
                scaleY = 0.8f + 0.2f * progress
            }
        },
    )
}
