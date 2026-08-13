package io.github.keco216.clockwork.ui

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
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
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
private fun Modifier.focusRing(
    focused: Boolean,
    colour: Color,
    shape: Shape,
    offset: androidx.compose.ui.unit.Dp,
): Modifier = if (!focused) this else this
    .padding(-offset)
    .border(BorderStroke(2.dp, colour), shape)
    .padding(offset)

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
) {
    val colors = LocalColors.current
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val focused by interaction.collectIsFocusedAsState()

    val background = when (variant) {
        KeyVariant.Primary -> if (pressed) colors.signalHover else colors.signal
        KeyVariant.Default -> if (pressed) colors.fillActive else colors.surfaceFill
        KeyVariant.Flat -> colors.fillSoft
        KeyVariant.Danger -> if (pressed) colors.faultSoftHover else colors.faultSoft
    }
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
        BasicText(
            text = label,
            style = TextStyles.small.copy(color = foreground),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
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
