package io.github.keco216.clockwork.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupProperties
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.Motion
import io.github.keco216.clockwork.ui.theme.TextStyles

/**
 * Die Listbox — der Sprachumschalter.
 *
 * ── Warum sie hier ANDERS begruendet ist als im Web ───────────────────────
 * Im Web sitzt die Listbox als Aufsatz auf einem nativen `<select>`: Das Feld
 * bleibt die Wahrheit, und ohne Skript ist die Systemliste weiter bedienbar.
 * Diesen Rueckfall gibt es hier nicht — es gibt kein „ohne Compose". Die
 * Bauteile, die der Browser mitbrachte (Tastaturfuehrung, Scrollen,
 * Screenreader-Rollen), muessen also selbst dastehen. Genau das ist der Preis
 * von „kein UI-Framework", und er wird hier bezahlt statt verschwiegen.
 *
 * ── Die Zeiten stehen in der Solltabelle ──────────────────────────────────
 * Auf 150 ms, zu 100 ms — das Popover geht schneller zu als auf. Der Winkel
 * am Auswahlfeld dreht in 150 ms (NICHT in 250 wie der am Aufklapper: Zwei
 * verschiedene Bauteile, zwei Zeiten der Referenz). Das Haekchen tritt in
 * 250 ms aus `scale(.7)` ein, eine gedrueckte Zeile gibt auf `scale(.98)`
 * nach.
 */

/** Der Winkel am Auswahlfeld — 150 ms, nicht 250 wie am Aufklapper. */
@Composable
private fun SelectChevron(open: Boolean, colour: Color, modifier: Modifier = Modifier) {
    val turn = remember { Animatable(0f) }
    LaunchedEffect(open) {
        turn.animateTo(if (open) 180f else 0f, tween(Motion.quick, easing = Motion.spring))
    }

    androidx.compose.foundation.Canvas(modifier = modifier.size(16.dp)) {
        rotate(turn.value) {
            drawLine(
                color = colour,
                start = Offset(size.width * 0.25f, size.height * 0.4f),
                end = Offset(size.width * 0.5f, size.height * 0.65f),
                strokeWidth = 1.5.dp.toPx(),
                cap = StrokeCap.Butt,
            )
            drawLine(
                color = colour,
                start = Offset(size.width * 0.5f, size.height * 0.65f),
                end = Offset(size.width * 0.75f, size.height * 0.4f),
                strokeWidth = 1.5.dp.toPx(),
                cap = StrokeCap.Butt,
            )
        }
    }
}

/**
 * Das Haekchen der ausgewaehlten Zeile.
 *
 * Es TRITT EIN — 250 ms aus `scale(.7)`, das Muster der Referenz. Ein
 * Haekchen, das einfach dasteht, sagt „ist ausgewaehlt"; eines, das eintritt,
 * sagt „wurde gerade ausgewaehlt". Beim Oeffnen der Liste ist das der
 * Unterschied zwischen einer Anzeige und einer Rueckmeldung.
 */
@Composable
private fun Check(colour: Color, modifier: Modifier = Modifier) {
    val grow = remember { Animatable(0.7f) }
    LaunchedEffect(Unit) { grow.animateTo(1f, tween(Motion.calm, easing = Motion.spring)) }

    androidx.compose.foundation.Canvas(modifier = modifier.size(10.dp).scale(grow.value)) {
        drawLine(
            color = colour,
            start = Offset(0f, size.height * 0.55f),
            end = Offset(size.width * 0.38f, size.height),
            strokeWidth = 1.5.dp.toPx(),
            cap = StrokeCap.Butt,
        )
        drawLine(
            color = colour,
            start = Offset(size.width * 0.38f, size.height),
            end = Offset(size.width, 0f),
            strokeWidth = 1.5.dp.toPx(),
            cap = StrokeCap.Butt,
        )
    }
}

/** Eine Zeile im Popover. */
@Composable
private fun ListboxRow(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val colors = LocalColors.current
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val press = remember { Animatable(1f) }

    LaunchedEffect(pressed) {
        press.animateTo(if (pressed) 0.98f else 1f, tween(Motion.calm, easing = Motion.spring))
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .scale(press.value)
            .clip(RoundedCornerShape(Dimens.radiusItem))
            .background(if (pressed) colors.fillActive else Color.Transparent)
            .clickable(
                interactionSource = interaction,
                indication = null,
                role = Role.Button,
                onClick = onClick,
            )
            .semantics { this.selected = selected }
            .defaultMinSize(minHeight = 36.dp)
            .padding(horizontal = Dimens.sp3, vertical = Dimens.sp2),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BasicText(
            text = label,
            style = TextStyles.small.copy(color = colors.ink),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        // Das Haekchen entsteht NEU, wenn die Zeile ausgewaehlt ist — genau
        // deshalb laeuft seine Eintrittsfahrt. Stuende es immer da und waere
        // nur unsichtbar, gaebe es nichts einzutreten.
        if (selected) Check(colour = colors.signal)
    }
}

/**
 * Das Auswahlfeld samt Popover — allgemein, weil es zwei Aufgaben hat.
 *
 * Gebaut wurde es in P5 fuer den Sprachumschalter; P7 braucht dasselbe
 * Bauteil fuer die Sperrzeit des Tresors. Die achtzig Zeilen Popover-Logik
 * ein zweites Mal hinzuschreiben waere die Sorte Verdopplung, die dieses
 * Projekt sonst ueberall vermeidet — und die erste Abweichung faellt dann
 * erst auf, wenn jemand beide nebeneinander sieht.
 *
 * @param emptyLabel Was im Feld steht, wenn nichts passt. Ohne den Wert
 *   stuende dort im Fehlerfall gar nichts, und ein leeres Auswahlfeld sieht
 *   aus wie ein kaputtes.
 */
@Composable
fun <T> Pick(
    label: String,
    aria: String,
    options: List<T>,
    selected: T?,
    display: (T) -> String,
    onPick: (T) -> Unit,
    modifier: Modifier = Modifier,
    emptyLabel: String = "",
    popoverWidth: Dp = 240.dp,
    maxPopoverHeight: Dp = 320.dp,
) {
    val colors = LocalColors.current

    var open by remember { mutableStateOf(false) }
    // `rendered` haelt das Popover waehrend der ABFAHRT im Baum. Ohne das
    // verschwaende es im selben Bild, in dem `open` false wird — eine Fahrt,
    // die niemand sieht, ist keine.
    var rendered by remember { mutableStateOf(false) }
    val enter = remember { Animatable(0f) }

    LaunchedEffect(open) {
        if (open) {
            rendered = true
            enter.animateTo(1f, tween(Motion.quick, easing = Motion.spring))
        } else {
            enter.animateTo(0f, tween(Motion.flash, easing = Motion.spring))
            rendered = false
        }
    }

    Column(modifier = modifier) {
        BasicText(
            text = label,
            style = TextStyles.micro.copy(color = colors.ink3),
        )

        Row(
            modifier = Modifier
                .padding(top = Dimens.sp1)
                .clip(RoundedCornerShape(Dimens.radiusField))
                .background(colors.surfaceFill)
                .clickable(role = Role.DropdownList) { open = !open }
                .semantics { contentDescription = aria }
                // Das Auswahlfeld ist fest 36 dp hoch — die sm-Sprosse der
                // Hoehenleiter, dieselbe Zahl wie im Web.
                .defaultMinSize(minHeight = Dimens.controlHSm)
                .padding(horizontal = Dimens.sp3),
            horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BasicText(
                text = selected?.let(display) ?: emptyLabel,
                style = TextStyles.small.copy(color = colors.ink),
                maxLines = 1,
            )
            SelectChevron(open = open, colour = colors.ink2)
        }
    }

    if (rendered) {
        val density = LocalDensity.current
        Popup(
            onDismissRequest = { open = false },
            properties = PopupProperties(focusable = true),
            offset = IntOffset(0, with(density) { Dimens.sp2.roundToPx() }),
        ) {
            Box(
                modifier = Modifier
                    // Fade + zoom-95 + 4 dp Weg — die drei Spuren der
                    // Referenz, alle an derselben Fahrt.
                    .alpha(enter.value)
                    .scale(0.95f + 0.05f * enter.value)
                    .padding(top = (4 * (1f - enter.value)).dp)
                    .width(popoverWidth)
                    .clip(RoundedCornerShape(Dimens.radiusPanel))
                    .background(colors.surface)
                    .padding(Dimens.sp2),
            ) {
                Column(
                    modifier = Modifier
                        .heightIn(max = maxPopoverHeight)
                        .verticalScroll(rememberScrollState()),
                ) {
                    for (option in options) {
                        ListboxRow(
                            label = display(option),
                            selected = option == selected,
                            onClick = {
                                open = false
                                onPick(option)
                            },
                        )
                    }
                }
            }
        }
    }
}

/**
 * Der Sprachumschalter.
 *
 * Die Liste kommt aus `LocaleRegistry.kt` — erzeugt aus `registry.ts`, nach
 * Eigennamen sortiert. NICHT aus `Locale.getDisplayLanguage`: Die
 * Plattformdaten nennen dieselbe Sprache je nach Geraet anders (gemessen:
 * zh-Hans ist dort „中文 (简体)", im Katalog „简体中文").
 */
@Composable
fun LanguagePicker(
    current: String,
    onPick: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Pick(
        label = text("lang.label"),
        aria = text("lang.aria"),
        options = LOCALES,
        selected = LOCALES.firstOrNull { it.code == current },
        display = { it.name },
        onPick = { onPick(it.code) },
        modifier = modifier,
        // Kennt die Registry den Code nicht, steht der Code selbst da. Das
        // ist keine schoene Anzeige, aber eine ehrliche: Sie sagt, WAS gilt.
        emptyLabel = current,
    )
}

/**
 * Welche Sprache gerade gilt — als Code aus der Registry.
 *
 * Die per-App-Sprachwahl kann leer sein (dann gilt die Systemsprache), und
 * das System liefert Regionalvarianten wie `de-AT`. Beides muss auf einen
 * Code der Registry abgebildet werden, sonst faende der Umschalter seine
 * eigene Auswahl nicht wieder. Dieselbe Reihenfolge wie `resolveLocale` im
 * Web: exakt, dann nur die Sprache, dann Englisch.
 */
fun resolveLocaleCode(tags: List<String>): String {
    for (tag in tags) {
        LOCALES.firstOrNull { it.code.equals(tag, ignoreCase = true) }?.let { return it.code }
    }
    for (tag in tags) {
        val language = tag.substringBefore('-')
        // Verwandtes vor Englisch: Ein brasilianischer Browser bekommt im Web
        // europaeisches Portugiesisch statt Englisch. Hier gilt dasselbe.
        LOCALES.firstOrNull { it.code.substringBefore('-').equals(language, ignoreCase = true) }
            ?.let { return it.code }
    }
    return "en"
}
