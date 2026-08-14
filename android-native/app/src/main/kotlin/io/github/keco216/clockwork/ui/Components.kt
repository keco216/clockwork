package io.github.keco216.clockwork.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.roundToInt
import androidx.compose.foundation.clickable
import androidx.compose.foundation.text.BasicText
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.Motion
import io.github.keco216.clockwork.ui.theme.TextStyles

/**
 * Die Bauteile — aus Compose Foundation, nicht aus Material.
 *
 * ── Warum selbst gebaut ───────────────────────────────────────────────────
 * Dieselbe Hausregel wie im Web, wo die Oberflaeche aus rohem CSS entsteht und
 * nicht aus Tailwind: Foundation ist die Plattform, Material waere das
 * Framework. Eine Material-Taste braechte ihre eigene Farbrolle, ihre eigene
 * Hoehe und ihre eigene Ripple mit — und damit ein zweites Designsystem neben
 * dem, das in tokens.css steht.
 *
 * Der Preis ist ehrlich zu benennen: Ripple, Fokus-Ring und Trefferflaeche
 * baut man dann selbst. Genau das steht unten.
 */

/* ── Fokus-Ring ─────────────────────────────────────────────────────────── */

/**
 * Der Fokus-Ring der Referenz: 2 px in Signal-Orange.
 *
 * Der VERSATZ unterscheidet sich je Bauteil, und das ist kein Zufall, sondern
 * HeroUIs Regel: Knoepfe und Schalter tragen ihn mit 2 px Abstand, FELDER
 * dagegen mit 0 — dort sitzt er direkt auf der Feldkante. Ein Ring mit Abstand
 * um ein Textfeld saehe aus wie ein zweites, groesseres Feld.
 */
internal fun Modifier.focusRing(
    focused: Boolean,
    colour: Color,
    shape: Shape,
    offset: androidx.compose.ui.unit.Dp,
): Modifier = if (!focused) this else this.drawWithContent {
    drawContent()

    /* GEZEICHNET und nicht als Rahmen gelegt — das ist der Unterschied
       zwischen `outline` und `border` im Web, und er ist hier derselbe: Ein
       Ring, der Platz braucht, verschiebt beim Fokussieren das Layout.

       Die erste Fassung loeste das mit `padding(-offset)`, also einem
       NEGATIVEN Polster. Das ist in Compose verboten und wirft
       „Padding must be non-negative" — nur eben erst, wenn ein Bauteil den
       Fokus wirklich bekommt. Getippt wird mit dem Finger, und der vergibt
       keinen Fokus; aufgefallen ist es deshalb erst, als die
       Navigationsleiste (N11) fokussierbare Posten bekam. Der Fehler lag
       seit P5 in jeder Taste. */
    val grow = offset.toPx()
    val outline = shape.createOutline(
        Size(size.width + 2 * grow, size.height + 2 * grow),
        layoutDirection,
        this,
    )
    translate(left = -grow, top = -grow) {
        drawOutline(outline, colour, style = Stroke(width = 2.dp.toPx()))
    }
}

/* ── Taste ──────────────────────────────────────────────────────────────── */

/**
 * Die vier Tastenvarianten der Web-Fassung.
 *
 * `Primary` ist die EINE Haupthandlung eines Panels, `Default` die neutrale
 * Fuellung, `Flat` die halbe Fuellung („Leeren"), `Danger` die getoente
 * Warnform („Alles loeschen").
 */
enum class KeyVariant { Primary, Default, Flat, Danger }

@Composable
fun Key(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: KeyVariant = KeyVariant.Default,
    large: Boolean = false,
    enabled: Boolean = true,
    /**
     * Das Zeichen vor der Beschriftung (N14, Kevins Wunsch aus der
     * Spiegelung).
     *
     * Optional, und ausdruecklich nicht an jeder Taste: Ein Zeichen soll die
     * Handlung schneller lesbar machen, nicht die Zeile fuellen. Es kommt
     * dorthin, wo es eine bekannte Form gibt — Kopieren, Bild, Kamera,
     * Schluessel. „Zusperren" oder „Neu speichern" tragen keines, weil jedes
     * Schloss-Zeichen dort raten liesse, welcher der beiden Zustaende gemeint
     * ist.
     *
     * Es bekommt die Vordergrundfarbe der Variante uebergeben und zeichnet
     * damit — eine Taste hat EINE Tinte.
     */
    glyph: (@Composable (Color) -> Unit)? = null,
    /**
     * Ein Modifier NUR fuer die Beschriftung — fuer die Kopier-Quittung.
     *
     * Die Kopiertaste laesst ihr Wort eintreten, wenn es sich aendert
     * („Kopieren" wird „Kopiert"); das ZEICHEN daneben bleibt dabei stehen.
     * Deshalb ein eigener Griff an der Schrift statt einer Bewegung an der
     * ganzen Taste — dieselbe Trennung wie im Web, wo `slot-value-in` am
     * `<span>` haengt und nicht am `<button>`.
     */
    labelModifier: Modifier = Modifier,
) {
    val colors = LocalColors.current
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val focused by interaction.collectIsFocusedAsState()

    val target = when (variant) {
        KeyVariant.Primary -> if (pressed) colors.signalHover else colors.signal
        KeyVariant.Default -> if (pressed) colors.fillActive else colors.surfaceFill
        KeyVariant.Flat -> colors.fillSoft
        KeyVariant.Danger -> if (pressed) colors.faultSoftHover else colors.faultSoft
    }

    /* ── Die Flaeche FAEHRT, sie springt nicht (N14) ───────────────────────
       Bis N13 wechselte der Ton beim Druck hart. Im Web tut er das nicht: Die
       Tasten tragen dort einen Uebergang auf `background-color`, und ohne ihn
       wirkt die Umkehr wie ein Bildfehler statt wie eine Rueckmeldung.

       `--dur-quick` (150 ms) und nicht `--dur-calm`: Eine Rueckmeldung auf
       eine Beruehrung muss schneller sein als eine Bewegung, die etwas
       erzaehlt. Das Nachgeben (`scale`) bleibt auf 250 ms — es ist Physik,
       kein Signal, und die zwei duerfen verschieden schnell sein.

       Wie beim Nachgeben haengt auch das an der Animator-Skala des Systems:
       Steht sie auf 0, springt der Wert — das native Gegenstueck zu
       `prefers-reduced-motion`. */
    val background by animateColorAsState(
        targetValue = target,
        animationSpec = tween(durationMillis = Motion.quick, easing = Motion.spring),
        label = "Tastenflaeche",
    )
    val foreground = when (variant) {
        KeyVariant.Primary -> colors.signalInk
        KeyVariant.Default, KeyVariant.Flat -> colors.ink
        KeyVariant.Danger -> colors.faultSoftInk
    }

    /* Der Druckpunkt: 3 % nachgeben auf der Federkurve. Im Web ist das
       `scale(.97)` — die Physik, die Apple jedem Knopf mitgibt, und seit V5
       zusaetzlich zur Umkehrung aus V2.

       `animateFloatAsState` haengt an der Animator-Skala des Systems: Steht sie
       auf 0 (Entwickleroptionen oder „Animationen entfernen"), springt der
       Wert ohne Fahrt. Das ist das native Gegenstueck zu
       `prefers-reduced-motion` und braucht keine eigene Abfrage. */
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.97f else 1f,
        animationSpec = tween(durationMillis = Motion.calm, easing = Motion.spring),
        label = "Tastendruck",
    )

    val shape = RoundedCornerShape(Dimens.radiusKey)

    Box(
        modifier = modifier
            .scale(scale)
            .height(if (large) Dimens.controlHLg else Dimens.controlH)
            .focusRing(focused, colors.signal, shape, 2.dp)
            .clip(shape)
            .background(background)
            .alpha(if (enabled) 1f else 0.5f)
            .clickable(
                interactionSource = interaction,
                // Keine Ripple: Die Rueckmeldung dieses Geraets ist die
                // Flaechenumkehr plus das Nachgeben, nicht eine Welle. `null`
                // schaltet die Standard-Indikation ab — mit Material waere sie
                // nicht abwaehlbar.
                indication = null,
                enabled = enabled,
                role = Role.Button,
                onClick = onClick,
            )
            .padding(horizontal = Dimens.sp4),
        contentAlignment = Alignment.Center,
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (glyph != null) {
                /* Das Zeichen steht bei 20 dp und nicht bei den 24 des
                   Satzes: Neben einer 14-sp-Zeile in einer 40-dp-Taste waere
                   der volle Kasten so hoch wie die halbe Taste. Das Raster
                   bleibt dasselbe — `Glyph` rechnet in Anteilen der
                   Kastenseite, also skaliert der Strich mit. */
                Box(modifier = Modifier.size(KEY_GLYPH)) { glyph(foreground) }
            }
            BasicText(
                text = label,
                style = TextStyles.small.copy(color = foreground),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = labelModifier,
            )
        }
    }
}

/** Die Zeichengroesse in einer Taste. */
private val KEY_GLYPH: Dp = 20.dp

/**
 * Die Fuellung eines Feldes, die auf BERUEHRUNG reagiert (N14).
 *
 * ── Warum es das gibt ─────────────────────────────────────────────────────
 * Kevins Ansage nach der Sichtung: „beim Beruehren soll auch animiert sein
 * wie ein Hover-Effekt — das soll beim Input-Text und bei allen Sachen, auch
 * bei den Buttons."
 *
 * Die Tasten hatten es schon; die FELDER nicht. Sie standen in jeder Lage auf
 * `--surface-fill`, ob man sie gerade beschrieb oder nicht. Im Web tun sie das
 * nicht: Dort traegt ein Feld unter `:focus-within` die naechste Sprosse der
 * Flaechenleiter — und genau diese Sprosse steht hier.
 *
 * ── Warum FOKUS und nicht Druck ───────────────────────────────────────────
 * Ein Feld wird nicht gedrueckt, sondern beschrieben. Der Druck dauert einen
 * Wimpernschlag, das Schreiben Minuten — und die ganze Zeit soll man sehen,
 * wohin die Tastatur tippt. Deshalb haengt die Fuellung am Fokus und nicht an
 * `pressed`.
 *
 * `--dur-quick` wie bei den Tasten: Eine Rueckmeldung auf eine Beruehrung ist
 * schneller als eine Bewegung, die etwas erzaehlt.
 */
@Composable
fun fieldFill(interaction: MutableInteractionSource): Color {
    val colors = LocalColors.current
    val focused by interaction.collectIsFocusedAsState()
    val fill by animateColorAsState(
        targetValue = if (focused) colors.fillActive else colors.surfaceFill,
        animationSpec = tween(durationMillis = Motion.quick, easing = Motion.spring),
        label = "Feldfuellung",
    )
    return fill
}

/* ── Chip ───────────────────────────────────────────────────────────────── */

/**
 * Ein Chip ist eine ANGABE, kein Bedienelement — er wird gelesen, nicht
 * gedrueckt. Deshalb hat er auch keine Trefferflaeche: 24 dp Hoehe, fertig.
 *
 * Die V8-Lehre steht in seiner Geometrie: Als Gravur mit Versalsatz und
 * Sperrung war er 212 px breit und liess dem Kontonamen in einer 458 px
 * breiten Karte 0 px. Ohne beides sind es 136.
 */
@Composable
fun Chip(label: String, modifier: Modifier = Modifier, accent: Boolean = false) {
    val colors = LocalColors.current
    Box(
        modifier = modifier
            .height(Dimens.chipH)
            .clip(RoundedCornerShape(Dimens.radiusItem))
            .background(if (accent) colors.signalSoft else colors.fillSoft)
            .padding(horizontal = Dimens.sp2),
        contentAlignment = Alignment.Center,
    ) {
        BasicText(
            text = label,
            style = TextStyles.micro.copy(
                color = if (accent) colors.signalSoftInk else colors.ink2,
            ),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

/* ── Panel ──────────────────────────────────────────────────────────────── */

/**
 * Eine Karte: randlos, mit Radius 24.
 *
 * Hell traegt sie den Surface-Schatten der Referenz, dunkel NICHTS — dort
 * trennt allein die Helligkeit. Das ist keine Auslassung, sondern steht bei
 * HeroUI woertlich als `--surface-shadow: transparent` im Paket, und in
 * tokens.css als `--elev-1: none`.
 */
/**
 * Das Polster einer Karte, die nur eine Fold-Zeile traegt (N14).
 *
 * Kevins Befund aus der Spiegelung: „die Boxen muessen schmaler sein beim
 * Input und beim Off." Er hat recht, und die Zahl sagt warum — mit dem
 * normalen Gruppenpolster ergaben 24 + 44 + 24 eine **92 dp hohe Karte fuer
 * eine einzige Textzeile.** Das liest sich nicht als Zeile, sondern als
 * leerer Kasten mit Beschriftung.
 *
 * Die 44 dp der Zeile sind dabei nicht verhandelbar (Trefferflaeche), das
 * Polster schon: `--sp-2` oben und unten ergibt **60 dp**. Seitlich bleibt es
 * beim Gruppenmass, damit die Zeile mit dem Inhalt der Nachbarkarten
 * fluchtet — ein Kasten, der schmaler wird, ruecke sonst als einziger ein.
 */
val FoldPanelPadding: PaddingValues =
    PaddingValues(horizontal = Dimens.gapGroup, vertical = Dimens.sp2)

@Composable
fun Panel(
    modifier: Modifier = Modifier,
    padding: PaddingValues = PaddingValues(Dimens.gapGroup),
    content: @Composable () -> Unit,
) {
    val colors = LocalColors.current
    val shape = RoundedCornerShape(Dimens.radiusPanel)

    Box(
        modifier = modifier
            .then(
                // Der Schatten der Referenz sind drei enge, leise Lagen. Compose
                // kennt nur EINE Elevation je Flaeche — das ist eine
                // ANNAEHERUNG, und sie steht hier als solche. Im Dunkeln
                // entfaellt die Frage, weil dort ohnehin kein Schatten liegt.
                if (colors.isDark) Modifier else Modifier.shadowApprox(shape)
            )
            .clip(shape)
            .background(colors.surface)
            .padding(padding),
    ) {
        content()
    }
}

/**
 * Die Annaeherung an `--elev-1`.
 *
 * CSS legt drei Schatten uebereinander (2/4, 1/2 und 0/1 Pixel bei 4, 6 und
 * 6 % Schwarz). Compose bietet eine Elevation mit einem Ambient- und einem
 * Spot-Anteil. 2 dp bei 6 % Deckkraft trifft die Summe am ehesten; die drei
 * Lagen einzeln nachzubauen hiesse drei uebereinanderliegende Boxen, und das
 * kostet drei Zeichenschritte fuer einen Unterschied, den man nicht sieht.
 *
 * Das ist die einzige Stelle des Themes, an der nicht Zahl fuer Zahl dasselbe
 * herauskommt — deshalb steht sie hier benannt und nicht versteckt.
 */
private fun Modifier.shadowApprox(shape: Shape): Modifier = this.shadow(
    elevation = 2.dp,
    shape = shape,
    ambientColor = Color.Black.copy(alpha = 0.06f),
    spotColor = Color.Black.copy(alpha = 0.06f),
)

/* ── Schalter ───────────────────────────────────────────────────────────── */

/**
 * Der Switch der Referenz.
 *
 * ── Die Geometrie ist abgemessen, nicht geschaetzt ────────────────────────
 * Bahn 40 × 20, Daumen 22 × 16 mit 2 dp Rand, Weg also 40 − 22 − 4 = 14 dp.
 * Die Bahn faerbt in 250 ms um, der Daumen faehrt in 300 ms — zwei Zeiten,
 * weil die Referenz zwei hat (`--dur-calm` und `--dur-glide`). Der Daumen ist
 * in BEIDEN Themes Snow: `.switch__thumb` traegt dort fest `bg-white`.
 *
 * Eingeschaltet ist die Bahn Signal-Orange. Das ist die V9-Entscheidung gegen
 * die aeltere Regel „an in Tinte": In einem HeroUI-Theme ist der Akzent die
 * Farbe jedes Ein-Zustands, und „genau ein Akzent" bleibt damit wahr.
 *
 * ── Eine bewusste Abweichung von der Web-Fassung ──────────────────────────
 * Im Web ist der Schalter ein `<input type="checkbox">` von 20 px Hoehe, und
 * getroffen wird er mit der Maus. Hier traegt die ganze ZEILE die
 * Trefferflaeche von 44 dp — dieselbe Sprosse wie die Aufklapper. Ein 20 dp
 * hohes Ziel ist auf einem Telefon kein Ziel, sondern eine Geduldsprobe.
 *
 * ── Warum der Weg ueber `offset` und nicht `absoluteOffset` laeuft ────────
 * `offset` ist leserichtungsbewusst: Auf Arabisch faehrt der Daumen von
 * selbst nach links. Die Web-Fassung braucht dafuer eine eigene
 * `:root[dir='rtl']`-Regel; hier faellt sie weg.
 */
@Composable
fun Switch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    description: String? = null,
) {
    val colors = LocalColors.current
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()

    val travel by animateFloatAsState(
        targetValue = if (checked) 1f else 0f,
        animationSpec = tween(Motion.glide, easing = Motion.spring),
        label = "switch-thumb",
    )
    val tint by animateFloatAsState(
        targetValue = if (checked) 1f else 0f,
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "switch-track",
    )

    val trackShape = RoundedCornerShape(Dimens.radiusKey)

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Dimens.radiusField))
            .clickable(
                interactionSource = interaction,
                indication = null,
                enabled = enabled,
                // `Switch` und nicht `Checkbox`: TalkBack sagt dann „an"/„aus"
                // statt „angehakt", und genau das ist dieses Bauteil.
                role = Role.Switch,
                onClick = { onCheckedChange(!checked) },
            )
            .semantics { stateDescription = if (checked) "on" else "off" }
            .defaultMinSize(minHeight = Dimens.touchMin)
            .alpha(if (enabled) 1f else 0.5f)
            .padding(vertical = Dimens.sp2),
        horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .focusRing(focused, colors.signal, trackShape, 2.dp)
                .size(width = 40.dp, height = 20.dp)
                .clip(trackShape)
                .background(lerp(colors.surfaceFill, colors.signal, tint)),
        ) {
            Box(
                modifier = Modifier
                    .padding(2.dp)
                    .offset(x = (14 * travel).dp)
                    .size(width = 22.dp, height = 16.dp)
                    .clip(RoundedCornerShape(Dimens.radiusInset))
                    .background(colors.switchThumb),
            )
        }

        Column(verticalArrangement = Arrangement.spacedBy(Dimens.sp1)) {
            BasicText(text = label, style = TextStyles.small.copy(color = colors.ink))
            if (description != null) {
                BasicText(
                    text = description,
                    style = TextStyles.micro.copy(color = colors.ink3),
                )
            }
        }
    }
}

/* ── Zeile ──────────────────────────────────────────────────────────────── */

/** Eine Zeile mit Paar-Fuge — der haeufigste Aufbau der Oberflaeche. */
@Composable
fun PairRow(
    modifier: Modifier = Modifier,
    verticalAlignment: Alignment.Vertical = Alignment.CenterVertically,
    content: @Composable () -> Unit,
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair),
        verticalAlignment = verticalAlignment,
    ) {
        content()
    }
}

/** Die Mindesthoehe fuer eine Trefferflaeche, wo sie noetig ist. */
fun Modifier.touchTarget(): Modifier = this.defaultMinSize(minHeight = Dimens.touchMin)

/* ── Aufklapper: Fold-Zeile und Schublade (V10) ─────────────────────────── */

/**
 * Der Winkel am Aufklapper.
 *
 * Die FORM steht seit N12 in `Icons.kt` — ein Raster, ein Strichgewicht fuer
 * die ganze App. Hier bleibt nur die ZEIT: 250 ms, die der Referenz
 * (`.disclosure__indicator`), und bewusst dieselbe wie die der Schublade
 * darunter. Zwei ineinander geschachtelte Winkel mit verschiedenem Tempo
 * sahen im Web aus wie zwei Bauteile aus zwei Systemen — das war ein
 * gemessener V11-Befund.
 */
@Composable
private fun Chevron(expanded: Boolean, colour: Color, modifier: Modifier = Modifier) {
    val turn by animateFloatAsState(
        targetValue = if (expanded) 180f else 0f,
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "chevron",
    )

    ChevronGlyph(tint = colour, turn = turn, modifier = modifier)
}

/**
 * Die Fold-Zeile — der Aufklapper aus V10.
 *
 * Auf dem Handy schrumpft die Bedienung auf zwei zugeklappte Zeilen, damit
 * die Codes obenan stehen. Die Zeile ist 44 dp hoch: Das ist die
 * Touch-Sprosse der Hoehenleiter und nicht verhandelbar — sie wird mit dem
 * Daumen getroffen.
 *
 * `Role.Button` und `stateDescription` stehen hier, weil Foundation nichts
 * davon mitbringt. Ohne sie waere die Zeile fuer TalkBack ein Stueck Text,
 * das sich auf Antippen unerklaerlich veraendert — das Gegenstueck zu
 * `aria-expanded` im Web.
 */
@Composable
fun FoldRow(
    label: String,
    expanded: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
    /**
     * Die Betriebsleuchte vor der Beschriftung — nur der Tresor traegt eine.
     *
     * Sie liegt auf der Mitte der Kleinbuchstaben, nicht auf der Grundlinie:
     * Eine Leuchte auf der Grundlinie sieht aus wie ein Punkt am Satzende. Im
     * Web macht das `vertical-align: 0.26em`; hier genuegt die Zentrierung der
     * Zeile, weil die Leuchte ein eigenes Rechteck ist und keinen Schriftzug
     * tragen muss. Ihr Mass steht seit N12 als `Glyph.dot` an einer Stelle.
     */
    lamp: Color? = null,
) {
    val colors = LocalColors.current
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()

    /* Dieselbe Beruehrungs-Rueckmeldung wie an Tasten und Navigationsposten
       (N14): Die Zeile ist ein Knopf ueber die volle Kartenbreite, und ohne
       Flaeche sieht man nur, DASS sich etwas aufklappt — nicht, dass man
       getroffen hat. */
    val touch by animateColorAsState(
        targetValue = if (pressed) colors.surfaceActive else Color.Transparent,
        animationSpec = tween(durationMillis = Motion.quick, easing = Motion.spring),
        label = "Fold-Beruehrung",
    )

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Dimens.radiusField))
            .background(touch)
            .clickable(
                interactionSource = interaction,
                indication = null,
                role = Role.Button,
                onClick = onToggle,
            )
            .semantics {
                stateDescription = if (expanded) "expanded" else "collapsed"
            }
            .defaultMinSize(minHeight = Dimens.touchMin)
            .padding(vertical = Dimens.sp2),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            modifier = Modifier.weight(1f, fill = false),
            horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (lamp != null) {
                Lamp(colour = lamp)
            }
            BasicText(
                text = label,
                style = TextStyles.small.copy(color = colors.ink),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Chevron(expanded = expanded, colour = colors.ink2)
    }
}

/**
 * Die Schublade darunter — das Gegenstueck zu `grid-template-rows: 0fr -> 1fr`.
 *
 * ── Warum ein eigenes Layout und kein Sichtbarkeitsschalter ───────────────
 * Weil die Web-Fassung genau das tut: Der Inhalt wird in voller Hoehe
 * GEMESSEN und der Behaelter darueber auf einen Bruchteil davon gesetzt. Ein
 * Ein-/Ausblenden waere etwas anderes — es kennt die Zielhoehe nicht und
 * springt deshalb, sobald der Inhalt sich aendert.
 *
 * ── Bewegung reduzieren ───────────────────────────────────────────────────
 * Hier steht dafuer keine einzige Zeile, und das ist Absicht: Compose koppelt
 * `animateFloatAsState` an die Animator-Skala des Systems
 * (`MotionDurationScale`). Steht sie auf 0, ist die Fahrt sofort zu Ende —
 * der Zustand stimmt trotzdem. Gemessen wird das, nicht geglaubt (siehe
 * android-native/docs/abnahme).
 */
@Composable
fun Drawer(open: Boolean, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val fraction by animateFloatAsState(
        targetValue = if (open) 1f else 0f,
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "drawer",
    )

    // Ganz zu heisst: gar nicht erst im Baum. Ein Kasten der Hoehe 0 frisst
    // sonst die Fuge seines Elternteils — genau die „toten Fugen" aus dem
    // V8-Abstands-Audit.
    if (fraction <= 0f) return

    Layout(
        content = content,
        modifier = modifier.clipToBounds(),
    ) { measurables, constraints ->
        val placeables = measurables.map { it.measure(constraints) }
        val full = placeables.maxOfOrNull { it.height } ?: 0
        val width = placeables.maxOfOrNull { it.width } ?: 0
        val shown = (full * fraction).roundToInt()

        layout(width, shown) {
            // Oben verankert und unten beschnitten — die Schublade faehrt
            // heraus, der Inhalt wandert nicht.
            placeables.forEach { it.place(0, 0) }
        }
    }
}

/* ── Meldungszeilen ─────────────────────────────────────────────────────── */

/** Wie dringend eine Meldung ist — bestimmt Farbe UND Ansage-Verhalten. */
enum class MessageTone { Status, Fault }

/**
 * Eine Meldungszeile, die einfaehrt statt aufzuploppen.
 *
 * ── Die Regel, die hier ueber allem steht ─────────────────────────────────
 * Eine Live-Region muss IM BAUM sein, bevor Text hineinkommt. Wird sie im
 * selben Moment eingeblendet und gefuellt, meldet ein Screenreader die
 * Aenderung nicht zuverlaessig — und genau das Melden ist ihr einziger Zweck.
 * Die Zeile verschwindet deshalb nie aus der Komposition; sie faehrt nur auf
 * Hoehe 0 zusammen. Im Web ist das die `:empty`-Regel, die den FLUSS
 * verlaesst und nicht den BAUM.
 *
 * ── Warum der letzte Text stehen bleibt ───────────────────────────────────
 * Beim Ausfahren wird der Text leer, bevor die Fahrt zu Ende ist. Stuende
 * dann schon nichts mehr da, faellt die Zeile in sich zusammen statt
 * auszufahren — man saehe ein Verschwinden und keine Bewegung. Sie behaelt
 * deshalb den letzten nicht-leeren Text bis zum Schluss.
 *
 * ── Zwei Spuren, zwei Zeiten ──────────────────────────────────────────────
 * Deckkraft 150 ms, Hoehe 250 ms — das Muster der Referenz (`field-error`
 * faehrt dort 150/350). Die Hoehe nimmt die Hausdauer, damit die Zeile im
 * selben Takt faehrt wie die Aufklapper daneben.
 *
 * Beide haengen wie alles hier an der Animator-Skala des Systems: Steht sie
 * auf 0, ist die Zeile sofort da — und die Ansage geht trotzdem raus.
 */
@Composable
fun MessageRow(text: String, tone: MessageTone, modifier: Modifier = Modifier) {
    val colors = LocalColors.current

    var last by remember { mutableStateOf(text) }
    if (text.isNotEmpty()) last = text

    val open = text.isNotEmpty()
    val extent by animateFloatAsState(
        targetValue = if (open) 1f else 0f,
        animationSpec = tween(Motion.calm, easing = Motion.spring),
        label = "message-height",
    )
    val fade by animateFloatAsState(
        targetValue = if (open) 1f else 0f,
        animationSpec = tween(Motion.quick, easing = Motion.spring),
        label = "message-fade",
    )

    Layout(
        modifier = modifier
            .clipToBounds()
            .semantics {
                liveRegion = when (tone) {
                    // Ein Fehler unterbricht, eine Rueckmeldung wartet. Das ist
                    // dieselbe Trennung wie `role="alert"` gegen
                    // `role="status"` im Web.
                    MessageTone.Fault -> LiveRegionMode.Assertive
                    MessageTone.Status -> LiveRegionMode.Polite
                }
            },
        content = {
            BasicText(
                text = last,
                style = TextStyles.micro.copy(
                    color = if (tone == MessageTone.Fault) colors.fault else colors.ink2,
                ),
                modifier = Modifier.alpha(fade),
            )
        },
    ) { measurables, constraints ->
        val placeable = measurables[0].measure(constraints)
        val shown = (placeable.height * extent).roundToInt()

        layout(placeable.width, shown) {
            // Oben verankert: Die Zeile waechst nach unten heraus, der Text
            // wandert nicht.
            placeable.place(0, 0)
        }
    }
}
