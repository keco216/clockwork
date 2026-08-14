package io.github.keco216.clockwork.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.InlineTextContent
import androidx.compose.foundation.text.appendInlineContent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.Placeholder
import androidx.compose.ui.text.PlaceholderVerticalAlign
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.Fonts
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.Motion
import io.github.keco216.clockwork.ui.theme.TextStyles
import io.github.keco216.clockwork.ui.theme.Typo
import kotlin.math.abs

/**
 * Der klebende Kopf — Port von `src/ui/masthead.ts` und der Wortmarke aus
 * `src/styles/mark.css`.
 *
 * ── Warum er ueberhaupt da sein muss ──────────────────────────────────────
 * Er trug bis P6 gar nicht — auf allen Abnahmebildern fehlte er. Drei Dinge
 * fehlten damit: die Marke, der Untertitel und vor allem die ZUSTANDSZEILE,
 * die sagt, ob gerade etwas gespeichert ist. Eine App, die einen Tresor hat,
 * aber nirgends anzeigt, ob er zu ist, laesst genau die Frage offen, fuer die
 * es ihn gibt.
 *
 * ── Dreizeilig, weil das Telefon schmal ist ───────────────────────────────
 * Die Web-Fassung stellt den Kopf ab 46 rem in eine Zeile und darunter in
 * drei. Diese App ist eine Telefon-App im Hochformat, also gilt durchgehend
 * die dreizeilige Form.
 *
 * ── Und genau deshalb weicht er beim Scrollen ─────────────────────────────
 * Drei Zeilen sind auf einem 812 dp hohen Schirm rund ein Zehntel der Hoehe,
 * dauerhaft belegt von etwas, das man einmal liest. Das Muster ist von der
 * Browserleiste geliehen: runter heisst lesen, hoch heisst suchen.
 */

/* ── Die Hysterese ─────────────────────────────────────────────────────────
   Die drei Betraege sind woertlich aus `ui/masthead.ts` uebernommen, und sie
   sind bewusst UNGLEICH:

   Verstauen darf teuer sein — wer liest, scrollt am Stueck, und 24 dp sind
   eine halbe Zeile. Zurueckholen muss billig sein: Wer nach oben wischt, will
   etwas vom Kopf (den Zustand, die Marke) und soll ihn nicht erst
   freischaufeln muessen. Und ganz oben gibt es nichts zu verstauen, daher die
   dritte Zahl.

   Ohne Hysterese flattert der Kopf: Jede Wischbewegung wechselt ein paarmal
   die Richtung, und der Riegel fuehre im Takt mit. */
private const val VERSTAUEN_AB_DP = 24
private const val ZURUECK_AB_DP = 12
private const val IMMER_SICHTBAR_BIS_DP = 8

/**
 * Der Zustandsautomat aus `masthead.ts`, Zeile fuer Zeile.
 *
 * Er lebt in einer eigenen Klasse statt in `remember`-Werten, weil er sich
 * merken muss, WO die aktuelle Richtung begonnen hat — das ist der Bezugspunkt
 * der Hysterese und ueberlebt jede Neuzeichnung.
 */
private class StowTracker {
    var stowed by mutableStateOf(false)
        private set

    private var letztes = 0

    /** Wo die aktuelle Richtung begonnen hat. */
    private var wende = 0
    private var abwaerts = false

    fun pruefen(y: Int, hoehe: Int, verstauenAb: Int, zurueckAb: Int, immerSichtbarBis: Int) {
        if (y <= immerSichtbarBis) {
            stowed = false
            letztes = y
            wende = y
            return
        }

        val jetztAbwaerts = y > letztes
        if (jetztAbwaerts != abwaerts) {
            abwaerts = jetztAbwaerts
            wende = letztes
        }

        val weg = abs(y - wende)
        if (abwaerts) {
            // Erst verstauen, wenn der Kopf ohnehin schon durchgelaufen ist —
            // sonst fuehre er dem Inhalt entgegen, den er gerade freigibt.
            if (y > hoehe && weg >= verstauenAb) stowed = true
        } else if (weg >= zurueckAb) {
            stowed = false
        }

        letztes = y
    }
}

/**
 * Ob der Kopf gerade verstaut ist.
 *
 * ── Warum ein Fluss und kein Rueckruf bei jedem Bild ──────────────────────
 * Im Web haengt das an einem `scroll`-Zuhoerer, der per
 * `requestAnimationFrame` zusammengefasst wird — hoechstens einmal je Bild.
 * `snapshotFlow` tut genau dasselbe: Es meldet den Wert je Bild einmal und
 * ueberspringt Zwischenstaende. Und wie im Web wird dabei NICHTS gemessen:
 * `ScrollState.value` ist ein gefuehrter Wert, seine Abfrage kostet kein
 * Layout. Die einzige echte Messung ist die Kopfhoehe, und die kommt aus
 * `onSizeChanged` — das Gegenstueck zum ResizeObserver.
 */
@Composable
fun rememberStowed(scroll: ScrollState, mastheadHeightPx: Int): Boolean {
    val density = LocalDensity.current
    val verstauenAb = with(density) { VERSTAUEN_AB_DP.dp.roundToPx() }
    val zurueckAb = with(density) { ZURUECK_AB_DP.dp.roundToPx() }
    val immerSichtbarBis = with(density) { IMMER_SICHTBAR_BIS_DP.dp.roundToPx() }

    val tracker = remember { StowTracker() }

    LaunchedEffect(scroll, mastheadHeightPx, verstauenAb, zurueckAb, immerSichtbarBis) {
        snapshotFlow { scroll.value }.collect { y ->
            tracker.pruefen(y, mastheadHeightPx, verstauenAb, zurueckAb, immerSichtbarBis)
        }
    }

    return tracker.stowed
}

/**
 * Der Kopf selbst.
 *
 * @param lifted Ob unter ihm etwas durchlaeuft. Erst dann bekommt er Fuge und
 *   Erhebung — eine Flaeche, die schon am Seitenanfang schwebt, behauptet eine
 *   Erhebung, die es nicht gibt.
 * @param stow 0 = ganz da, 1 = ganz verstaut. Als Bruchteil und nicht als
 *   Wahrheitswert, damit der Aufrufer die Fahrt fuehrt.
 */
@Composable
fun Masthead(
    vaultState: VaultState,
    lifted: Boolean,
    modifier: Modifier = Modifier,
) {
    val colors = LocalColors.current

    // Die Fuge nach unten blendet ein, statt zu erscheinen — 250 ms, wie im
    // Web (`transition: border-color var(--dur-calm)`).
    val edge by animateFloatAsState(
        targetValue = if (lifted) 1f else 0f,
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "masthead-edge",
    )

    Column(
        modifier = modifier
            .fillMaxWidth()
            /* Die Erhebung ist `--elev-2`. Hell ist das der Overlay-Schatten
               der Referenz; im Dunkeln steht dort `inset 0 0 1px rgb(255 255
               255 / 30%)`, also eine Innenlichtkante — und die ist an einem
               randlosen Riegel ueber die volle Breite genau die Fuge, die
               unten ohnehin gezeichnet wird. Deshalb traegt der dunkle Modus
               hier keinen Schatten; benannt statt stillschweigend
               weggelassen. */
            .then(
                if (colors.isDark) {
                    Modifier
                } else {
                    Modifier.shadow(
                        elevation = (2 * edge).dp,
                        shape = RectangleShape,
                        clip = false,
                        ambientColor = Color.Black.copy(alpha = 0.08f),
                        spotColor = Color.Black.copy(alpha = 0.08f),
                    )
                },
            )
            .background(colors.ground),
    ) {
        Column(
            modifier = Modifier.padding(
                horizontal = Dimens.gapGroup,
                vertical = Dimens.sp4,
            ),
            verticalArrangement = Arrangement.spacedBy(Dimens.gapPair),
        ) {
            Wordmark()

            BasicText(
                text = text("brand.tagline"),
                style = TextStyles.micro.copy(color = colors.ink3),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )

            StatusLine(vaultState = vaultState)
        }

        // Die Fuge. Sie traegt in beiden Themes — im Dunkeln ist sie das
        // sichtbare Stueck der Innenlichtkante.
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(colors.rule.copy(alpha = colors.rule.alpha * edge)),
        )
    }
}

/**
 * Die Zustandszeile: „Offline · nichts gespeichert".
 *
 * Beide Teile stehen als eigene Platzhalter in `status.line`, damit eine
 * Sprache sie umstellen kann. Die Leuchte wird Signal, sobald der Tresor offen
 * ist — der eine Akzent, fuer einen Zustand mit Bedeutung.
 */
@Composable
private fun StatusLine(vaultState: VaultState) {
    val colors = LocalColors.current

    val vaultLabel = when (vaultState) {
        VaultState.Off -> text("status.vault.off")
        VaultState.Locked -> text("status.vault.locked")
        VaultState.Open -> text("status.vault.open")
    }

    Row(
        horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(if (vaultState == VaultState.Open) colors.signalText else colors.ink),
        )
        BasicText(
            text = text(
                "status.line",
                mapOf("connection" to text("status.offline"), "vault" to vaultLabel),
            ),
            style = TextStyles.micro.copy(color = colors.ink2),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

/* ── Die Wortmarke ──────────────────────────────────────────────────────── */

/**
 * Anteil des Kastens, den der Ring links freilaesst.
 *
 * Er bildet `margin-left: var(--track-mark)` der Web-Fassung nach: Rechts
 * kommt die Sperrung der Schrift dazu, links muss sie nachgebildet werden —
 * sonst klebte das O am vorigen Buchstaben. Der Kasten ist deshalb 0,16 em
 * breiter als der Ring.
 */
private const val MARK_BOX_EM = 0.86f
private const val MARK_BOX_HEIGHT_EM = 0.8f

/**
 * Die Wortmarke: CLOCKWORK, beide O als Zifferblaetter.
 *
 * ── Warum inline-Platzhalter und keine Zeile aus Kaesten ──────────────────
 * Weil die Web-Fassung genau das tut: Die Ringe sind `inline-block` und sitzen
 * damit mit ihrer Unterkante auf der GRUNDLINIE. Eine Compose-`Row` mit
 * vertikaler Zentrierung saehe fast gleich aus und waere doch etwas anderes —
 * dieselbe Sorte Fehler wie die 4,5 px Achsenversatz, die V8 an der Code-Karte
 * gefunden hat. `PlaceholderVerticalAlign.AboveBaseline` ist die woertliche
 * Entsprechung von `inline-block`.
 *
 * ── Warum der Kasten hoeher ist als der Ring ──────────────────────────────
 * Der Signal-Index steht bei `top: -0.1em`, ragt also ueber den Ring hinaus.
 * Ausserhalb des Platzhalters zu zeichnen waere eine Wette darauf, dass die
 * Textzeile nicht beschneidet. Stattdessen ist der Kasten 0,8 em hoch, der
 * Ring sitzt in seinen unteren 0,7 em, und der Index hat seine 0,1 em Platz —
 * die Geometrie der Vorlage, ohne Wette.
 *
 * ── Und warum sie in jeder Sprache lateinisch bleibt ──────────────────────
 * Ein Logo wird nicht uebersetzt. `Fonts.brand` kippt deshalb nicht mit dem
 * Schriftsystem, und die Leserichtung ist hart LTR: Auf Arabisch stuenden die
 * Buchstaben sonst verkehrt herum.
 */
@Composable
private fun Wordmark() {
    val colors = LocalColors.current

    val style = TextStyles.micro.copy(
        fontFamily = Fonts.brand,
        fontSize = Typo.mark,
        fontWeight = FontWeight.SemiBold,
        lineHeight = Typo.mark * 1.0f,
        // css: --track-mark, die Markengeometrie und keine UI-Sperrung.
        letterSpacing = 0.16.em,
        color = colors.ink,
    )

    val marked = buildAnnotatedString {
        append("CL")
        appendInlineContent(ID_INDEX, "O")
        append("CKW")
        appendInlineContent(ID_PLAIN, "O")
        append("RK")
    }

    val placeholder = Placeholder(
        width = MARK_BOX_EM.em,
        height = MARK_BOX_HEIGHT_EM.em,
        placeholderVerticalAlign = PlaceholderVerticalAlign.AboveBaseline,
    )

    val inline = mapOf(
        ID_INDEX to InlineTextContent(placeholder) {
            DialRing(ink = colors.ink, index = colors.signal)
        },
        ID_PLAIN to InlineTextContent(placeholder) {
            DialRing(ink = colors.ink, index = null)
        },
    )

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        BasicText(
            text = marked,
            style = style,
            inlineContent = inline,
            maxLines = 1,
            // Der sichtbare Teil ist Geometrie, kein Text: Ein Screenreader
            // soll „Clockwork" hoeren und nicht „C L O C K W O R K" mit zwei
            // Luecken. Im Web macht das ein `sr-only`-Span neben einem
            // `aria-hidden`-Span; hier genuegt eine Zeile.
            modifier = Modifier.clearAndSetSemantics { contentDescription = "Clockwork" },
        )
    }
}

private const val ID_INDEX = "wordmark-o-index"
private const val ID_PLAIN = "wordmark-o"

/**
 * Ein O als Zifferblatt: Ring, und beim ersten O der Signal-Index auf 12 Uhr.
 *
 * Alle Masse sind die der Vorlage `clockwork-logo-c-wortmarke.svg`, in
 * Bruchteilen der Schriftgroesse: Ring 0,7 em Durchmesser bei 0,092 em Strich,
 * Index 0,092 em breit und 0,3 em hoch ab 0,1 em ueber dem Ring.
 */
@Composable
private fun DialRing(ink: Color, index: Color?) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        // Der Kasten ist 0,86 em breit — daraus folgt das em in Pixeln, und
        // damit laesst sich jede Zahl der Vorlage direkt hinschreiben.
        val em = size.width / MARK_BOX_EM

        val stroke = 0.092f * em
        val diameter = 0.7f * em
        val left = 0.16f * em
        val top = 0.1f * em

        // Butt caps und exakte Geometrie: Ein abgerundeter Strich auf einer
        // Teilung ist eine ungenaue Angabe. Das gilt fuer die Marke wie fuer
        // das Zifferblatt neben jedem Code.
        drawArc(
            color = ink,
            startAngle = 0f,
            sweepAngle = 360f,
            useCenter = false,
            topLeft = Offset(left + stroke / 2f, top + stroke / 2f),
            size = Size(diameter - stroke, diameter - stroke),
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = stroke),
        )

        if (index != null) {
            // Der Signal-Index auf 12 Uhr: 0,092 em breit, 0,3 em hoch, und er
            // beginnt 0,1 em UEBER dem Ring. Genau dafuer ist der Kasten
            // hoeher als der Ring.
            val centreX = left + diameter / 2f
            drawRect(
                color = index,
                topLeft = Offset(centreX - stroke / 2f, 0f),
                size = Size(stroke, 0.3f * em),
            )
        }
    }
}
