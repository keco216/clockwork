package io.github.keco216.clockwork.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ScrollState
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
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
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalDensity
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
import kotlinx.coroutines.delay

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
 * Die vier Tastenvarianten der Web-Fassung — und eine fuenfte, die ein ZUSTAND
 * ist.
 *
 * `Primary` ist die EINE Haupthandlung eines Panels, `Default` die neutrale
 * Fuellung, `Flat` die halbe Fuellung („Leeren"), `Danger` die getoente
 * Warnform („Alles loeschen").
 *
 * `Accent` (N15) ist keine fuenfte Sorte Taste, sondern die HALTEFARBE einer
 * quittierenden: Die Kopiertaste traegt sie die 1,6 Sekunden lang, in denen
 * „Kopiert" steht. Das Tonpaar ist keines aus dem Nichts — `--signal-soft` auf
 * `--signal-soft-ink` ist genau der Akzent-Chip, den die Karte im Kopf schon
 * traegt. Der Wechsel faehrt darum von selbst: Die Flaeche haengt seit N14 an
 * `animateColorAsState`.
 */
enum class KeyVariant { Primary, Default, Flat, Danger, Accent }

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
        // Die halbe Fuellung, und beim Druck die VOLLE — so steht es im Web
        // (`.key--flat { --key-bg: var(--fill-soft); --key-bg-hover:
        // var(--surface-fill) }`). N15 ist der erste Posten, der diese Variante
        // wirklich benutzt („Leeren"), und damit der erste, an dem ihre
        // Rueckmeldung ueberhaupt sichtbar wird.
        KeyVariant.Flat -> if (pressed) colors.surfaceFill else colors.fillSoft
        KeyVariant.Danger -> if (pressed) colors.faultSoftHover else colors.faultSoft
        KeyVariant.Accent -> colors.signalSoft
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
    /* Die Tinte FAEHRT mit, weil die Flat-Taste als einzige zwei hat: `--ink-2`
       in Ruhe, `--ink` beim Druck (`.key--flat:hover { color: var(--ink) }`).
       Sie ist die leiseste Taste des Geraets — eine, die man nicht sucht, und
       die deshalb erst beim Anfassen ihre volle Tinte zeigt. */
    val foregroundTarget = when (variant) {
        // Snow und nicht `--signal-ink` — Kevins Entscheidung, samt gemessener
        // Folge dokumentiert bei `ClockworkColors.signalKeyInk` (N15).
        KeyVariant.Primary -> colors.signalKeyInk
        KeyVariant.Default -> colors.ink
        KeyVariant.Flat -> if (pressed) colors.ink else colors.ink2
        KeyVariant.Danger -> colors.faultSoftInk
        KeyVariant.Accent -> colors.signalSoftInk
    }
    val foreground by animateColorAsState(
        targetValue = foregroundTarget,
        animationSpec = tween(durationMillis = Motion.quick, easing = Motion.spring),
        label = "Tastentinte",
    )

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
 * ── Und die Bahn steht seit N15 am ZEILENENDE ─────────────────────────────
 * Im Web steht das Kaestchen VOR seiner Beschriftung (`.vault__check`). Auf
 * Android steht das Bedienelement einer Einstellungszeile am Ende — und zwar
 * nicht aus Gewohnheit: Die Zeilen einer Liste werden an ihrem Anfang gelesen
 * und an ihrem Ende bedient, deshalb fluchten dort alle Schalter untereinander
 * statt hinter Woertern verschiedener Laenge zu wandern.
 *
 * Das ist eine STRUKTUR-Abweichung und damit von N11a ausdruecklich gedeckt
 * („Die Struktur darf nativ abweichen, die Designsprache nicht"). Am Bauteil
 * selbst aendert sich nichts: 40 × 20, Daumen 22 × 16, Weg 14, 250/300 ms,
 * Bahn im Akzent. Es steht nur woanders.
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
    val feedback = rememberFeedback()

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

    ListRow(
        label = label,
        description = description,
        modifier = modifier.alpha(if (enabled) 1f else 0.5f),
        enabled = enabled,
        interaction = interaction,
        // `Switch` und nicht `Checkbox`: TalkBack sagt dann „an"/„aus"
        // statt „angehakt", und genau das ist dieses Bauteil.
        role = Role.Switch,
        stateLabel = if (checked) "on" else "off",
        onClick = {
            onCheckedChange(!checked)
            // Zwei Richtungen, zwei Wirkungen — das Konzept steht in Haptics.kt.
            feedback(if (checked) Feedback.Untoggle else Feedback.Toggle)
        },
        trailing = {
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
        },
    )
}

/* ── Listenzeile ────────────────────────────────────────────────────────────
   Die Zeile der Einstellungen-Seite (N15). */

/**
 * Das Polster einer Karte, die LISTENZEILEN traegt.
 *
 * Waagerecht NICHTS — das tragen die Zeilen selbst. Der Unterschied ist
 * sichtbar und beabsichtigt: Die Trefferflaeche und die Beruehrungsfarbe einer
 * Zeile laufen damit von Kartenkante zu Kartenkante, so wie in jeder
 * Einstellungsliste dieser Plattform. Stuende das Polster an der Karte, saesse
 * die Zeile in einem Rahmen und man traefe neben ihr ins Leere.
 *
 * Senkrecht `--sp-2` wie am Fold-Panel: Eine Liste aus 44-dp-Zeilen braucht
 * keine 24 dp Luft darueber, die Zeilen bringen ihre eigene mit.
 *
 * Die WAAGERECHTE Einrueckung der Zeilen ist trotzdem `--gap-group`, damit ihr
 * Text mit dem Inhalt der Nachbarkarten fluchtet — dieselbe Begruendung wie bei
 * [FoldPanelPadding].
 */
val ListPanelPadding: PaddingValues = PaddingValues(vertical = Dimens.sp2)

/**
 * Eine Zeile in einer Einstellungsliste: Beschriftung links, Wert und
 * Bedienelement rechts.
 *
 * ── Warum die Einstellungen ueberhaupt Zeilen geworden sind (N15) ──────────
 * Bis N14 stand dort gestapelte Web-Struktur: ein Auswahlfeld mit Beschriftung
 * darueber, darunter drei Schalter mit ihrer Bahn VOR dem Wort. Das ist die
 * Anordnung eines Formulars — man liest sie von oben nach unten und fuellt sie
 * aus. Eine Einstellungsseite ist aber kein Formular: Man sucht darin EINEN
 * Posten, sieht seinen Wert und aendert ihn. Dafuer gibt es auf dieser
 * Plattform genau eine Form, und sie ist so alt wie sie: die Zeile.
 *
 * Was das praktisch bringt, ist an zwei Stellen messbar: Der WERT steht jetzt
 * neben seinem Posten, ohne dass man ein Feld oeffnen muss („Sprache ·
 * Deutsch"), und alle Bedienelemente fluchten am rechten Rand.
 *
 * ── Die Designsprache bleibt ──────────────────────────────────────────────
 * Kein neues Mass, keine neue Farbe: 44 dp Trefferflaeche (`--touch-min`),
 * `--gap-group` Einrueckung, `--t-small` in `--ink` fuer die Beschriftung,
 * `--t-micro` in `--ink-3` fuer die Beschreibung, der Wert in `--ink-2`, und
 * die Beruehrungsfarbe ist dieselbe `--surface-active` in 150 ms wie an
 * Fold-Zeile und Navigationsposten (N14).
 *
 * @param value Der aktuelle Wert, rechts vor dem Bedienelement.
 * @param stateLabel Was ein Screenreader als Zustand hoeren soll.
 * @param interaction Von aussen, wenn das Bedienelement im [trailing]-Fach den
 *   Fokus des Zeilen-Knopfes anzeigen muss (so macht es der [Switch]).
 */
@Composable
fun ListRow(
    label: String,
    modifier: Modifier = Modifier,
    value: String? = null,
    description: String? = null,
    labelColour: Color? = null,
    enabled: Boolean = true,
    role: Role = Role.Button,
    stateLabel: String? = null,
    interaction: MutableInteractionSource? = null,
    onClick: (() -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    val colors = LocalColors.current
    val source = interaction ?: remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()

    val touch by animateColorAsState(
        targetValue = if (pressed) colors.surfaceActive else Color.Transparent,
        animationSpec = tween(durationMillis = Motion.quick, easing = Motion.spring),
        label = "Zeilen-Beruehrung",
    )

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(touch)
            .then(
                if (onClick == null) {
                    Modifier
                } else {
                    Modifier
                        .clickable(
                            interactionSource = source,
                            indication = null,
                            enabled = enabled,
                            role = role,
                            onClick = onClick,
                        )
                        .semantics {
                            if (stateLabel != null) stateDescription = stateLabel
                        }
                },
            )
            .defaultMinSize(minHeight = Dimens.touchMin)
            .padding(horizontal = Dimens.gapGroup, vertical = Dimens.sp2),
        horizontalArrangement = Arrangement.spacedBy(Dimens.gapStack),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(Dimens.sp1),
        ) {
            BasicText(
                text = label,
                style = TextStyles.small.copy(color = labelColour ?: colors.ink),
            )
            if (description != null) {
                BasicText(
                    text = description,
                    style = TextStyles.micro.copy(color = colors.ink3),
                )
            }
        }

        if (value != null) {
            BasicText(
                text = value,
                style = TextStyles.small.copy(color = colors.ink2),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }

        if (trailing != null) trailing()
    }
}

/**
 * Die Haarlinie zwischen zwei Listenzeilen.
 *
 * `--rule`, 1 dp, und waagerecht auf `--gap-group` eingerueckt: Sie beginnt
 * dort, wo der Text beginnt. Eine Linie, die von Kartenkante zu Kartenkante
 * lief, teilte die Karte in Kaesten — hier soll sie Zeilen trennen, nicht
 * Bereiche.
 *
 * Dieselbe Rolle wie die Fuge zwischen zwei Kanalzuegen, und aus demselben
 * Grund dieselbe Farbe.
 */
@Composable
fun RowDivider(modifier: Modifier = Modifier) {
    val colors = LocalColors.current
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = Dimens.gapGroup)
            .height(1.dp)
            .background(colors.rule),
    )
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
    /**
     * Ob die Leuchte gefuellt ist — beim Tresor sagt die FORM den dritten
     * Zustand (N15, siehe [Lamp]).
     */
    lampFilled: Boolean = true,
    /**
     * Die Farbe der Beschriftung, wenn sie mit dem Zustand geht.
     *
     * Der Tresor tut das: `--ink-3` aus, `--ink` gesperrt, `--signal-text`
     * offen — die Leiter der Web-Fassung („die Leiter geht mit dem Gewicht der
     * Auskunft", styles/panels.css). Die Eingabe-Zeile daneben tut es nicht,
     * ihre Beschriftung ist immer gleich wichtig.
     */
    labelColour: Color? = null,
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
                // 8 dp und nicht 6: Das ist die ZUSTANDS-Leuchte, und die
                // Web-Fassung gibt ihr an dieser Stelle ein eigenes Mass.
                Lamp(colour = lamp, filled = lampFilled, size = Glyph.dotState)
            }
            BasicText(
                text = label,
                style = TextStyles.small.copy(color = labelColour ?: colors.ink),
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

/* ── Kantenzeichen an einer Scrollflaeche (N15) ─────────────────────────── */

/**
 * Blendet den Inhalt an der Kante aus, an der etwas verborgen liegt.
 *
 * ── Warum eine MASKE und kein Verlauf darueber ────────────────────────────
 * Weil ein Verlauf eine Farbe braeuchte, und die gibt es hier nicht: Das
 * Popover traegt `--surface`, der Inhalt darunter sind Zeilen mit
 * Beruehrungsflaeche. Ein Streifen in `--surface` laege ueber einer beruehrten
 * Zeile als heller Fleck. Eine Maske hat das Problem nicht — sie blendet aus,
 * was da ist, statt etwas darueberzulegen. Genau deshalb arbeitet auch die
 * Referenz mit `mask-image` (`scroll-shadow.css`), und die Web-Fassung dieses
 * Projekts in `styles/panels.css` ebenso.
 *
 * `BlendMode.DstIn` ist die woertliche Entsprechung: Der Verlauf liefert nur
 * Deckung, und was er nicht deckt, verschwindet.
 *
 * ── Warum die Maske nur dasteht, wenn sie etwas tut ───────────────────────
 * Weil sie eine eigene Zeichenebene kostet (`CompositingStrategy.Offscreen`) —
 * dasselbe Argument, mit dem die Web-Fassung ihre Maske an ein Attribut
 * gebunden hat: gemessen 19 Compositor-Ebenen mit, 18 ohne.
 *
 * ── Warum hier trotz Scrollen nichts je Bild neu zusammengesetzt wird ─────
 * Die zwei Fragen sind Wahrheitswerte („liegt oben etwas verborgen?"), und sie
 * stehen in `derivedStateOf`. Damit loest nur der WECHSEL eine
 * Neuzusammensetzung aus, nicht jeder gescrollte Pixel — das native Gegenstueck
 * zum IntersectionObserver, den `ui/scroll-edge.ts` aus genau diesem Grund
 * benutzt.
 *
 * Die Laenge faehrt in 150 ms auf `--ease-snap` herein, wie im Web
 * (`--fade-start` ist dort ueber `@property` animierbar gemacht).
 *
 * @param fade `--scroll-fade`, also `--sp-6`.
 */
@Composable
fun Modifier.scrollEdges(state: ScrollState, fade: Dp = Dimens.sp6): Modifier {
    val atStart by remember(state) { derivedStateOf { state.value > 0 } }
    val atEnd by remember(state) { derivedStateOf { state.value < state.maxValue } }

    val head by animateFloatAsState(
        targetValue = if (atStart) 1f else 0f,
        animationSpec = tween(Motion.quick, easing = Motion.snapEasing),
        label = "scroll-fade-start",
    )
    val foot by animateFloatAsState(
        targetValue = if (atEnd) 1f else 0f,
        animationSpec = tween(Motion.quick, easing = Motion.snapEasing),
        label = "scroll-fade-end",
    )

    if (head <= 0f && foot <= 0f) return this

    val length = with(LocalDensity.current) { fade.toPx() }

    return this
        .graphicsLayer(compositingStrategy = CompositingStrategy.Offscreen)
        .drawWithContent {
            drawContent()

            /* Der Verlauf klemmt ausserhalb seiner Haltepunkte (`TileMode.Clamp`
               ist die Vorgabe). Ueber `length` hinaus ist er deshalb deckend
               schwarz und laesst alles stehen — deswegen darf das Rechteck die
               ganze Flaeche sein und muss kein Streifen sein. */
            if (head > 0f) {
                drawRect(
                    brush = Brush.verticalGradient(
                        0f to Color.Transparent,
                        1f to Color.Black,
                        startY = 0f,
                        endY = length * head,
                    ),
                    blendMode = BlendMode.DstIn,
                )
            }
            if (foot > 0f) {
                drawRect(
                    brush = Brush.verticalGradient(
                        0f to Color.Black,
                        1f to Color.Transparent,
                        startY = size.height - length * foot,
                        endY = size.height,
                    ),
                    blendMode = BlendMode.DstIn,
                )
            }
        }
}

/* ── Karten-Eintritt (N15) ──────────────────────────────────────────────── */

/**
 * Eine Karte TRITT EIN, statt einfach dazustehen.
 *
 * ── Was Kevin daran wollte, und was dagegen sprach ────────────────────────
 * Der Auftrag nennt „Karten-Eintritte". Die Web-Fassung hat sie NICHT, und das
 * ist kein Versehen: Eine Seite im Browser wird gezeichnet, wenn sie ankommt,
 * und ihre Karten sind einfach da.
 *
 * Nativ ist die Lage anders, und zwar zweimal: Die App baut ihre Seite nach
 * einem Kaltstart hinter dem Splash auf (N15/4), und sie WECHSELT Seiten
 * (N11). In beiden Faellen entsteht die Karte in dem Moment, in dem man
 * hinsieht — und etwas, das entsteht, darf man entstehen sehen. Das ist die
 * gleiche Begruendung, mit der die Meldungszeile einfaehrt statt aufzuploppen.
 *
 * ── Die Zahlen sind alle schon im Haus ────────────────────────────────────
 *   250 ms   `--dur-calm`, die Hausdauer fuer eine Bewegung, die etwas erzaehlt
 *   8 dp     derselbe Weg wie beim Wert-Eintritt (`slot-value-in`)
 *   20 ms    `--stagger-flap` je Karte — die Zahl, mit der schon die Ziffern
 *            eines Codes nacheinander fallen
 *
 * Der Versatz macht aus drei gleichzeitigen Eintritten eine REIHENFOLGE. Mehr
 * als 20 ms saehe nach Animation aus, weniger nach Zufall — dasselbe Urteil,
 * das an der Fallblattanzeige schon gefaellt ist.
 *
 * ── Es laeuft genau EINMAL ────────────────────────────────────────────────
 * `LaunchedEffect(Unit)` an einem `remember`-Wert: Die Fahrt haengt am
 * ENTSTEHEN des Bauteils, nicht an seinen Werten. Ein Kanalzug, der jede
 * Sekunde eine neue Zahl bekommt, tritt deshalb nicht jede Sekunde neu ein.
 *
 * Gelesen wird der Wert INNERHALB von `graphicsLayer` — damit invalidiert er
 * nur das Zeichnen und nicht die Zusammensetzung, wie schon beim verstauten
 * Kopf (`offset {}`).
 *
 * ── Reduzierte Bewegung ───────────────────────────────────────────────────
 * Wie ueberall hier ohne eigene Abfrage: `Animatable` haengt an der
 * Animator-Skala des Systems. Steht sie auf 0, ist die Karte sofort da.
 */
@Composable
fun Modifier.cardEnter(order: Int = 0): Modifier {
    val enter = remember { Animatable(0f) }

    LaunchedEffect(Unit) {
        if (order > 0) delay((order * Motion.staggerFlap).toLong())
        enter.animateTo(1f, tween(Motion.calm, easing = Motion.spring))
    }

    return this.graphicsLayer {
        alpha = enter.value
        translationY = (1f - enter.value) * 8.dp.toPx()
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
