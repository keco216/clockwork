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
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
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

/**
 * Der Winkel am Auswahlfeld — 150 ms, nicht 250 wie am Aufklapper.
 *
 * Die Form kommt seit N12 aus `Icons.kt`; verschieden bleibt nur die Zeit.
 * Zwei Bauteile der Referenz, zwei Dauern — `.select__indicator` traegt
 * `duration-150`, `.disclosure__indicator` 250.
 */
@Composable
private fun SelectChevron(open: Boolean, colour: Color, modifier: Modifier = Modifier) {
    val turn = remember { Animatable(0f) }
    LaunchedEffect(open) {
        turn.animateTo(if (open) 180f else 0f, tween(Motion.quick, easing = Motion.spring))
    }

    ChevronGlyph(tint = colour, turn = turn.value, modifier = modifier)
}

/**
 * Wie hoch das Popover werden darf: `min(60vh, 22rem)` der Web-Fassung.
 *
 * Beide Grenzen sind noetig, und die Web-Fassung sagt auch, warum: 22 rem sind
 * das Mass, ueber dem eine Auswahlliste selbst auf einem grossen Schirm keine
 * Liste mehr ist, sondern eine Seite. Die 60 % sind die Grenze auf einem
 * kleinen — mit einer Tastatur im Bild bleibt sonst nichts von der Buehne
 * uebrig.
 */
private val POPOVER_MAX = 352.dp // css: min(60vh, 22rem) -> 22rem = 352px
private const val POPOVER_MAX_SHARE = 0.6f

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
            /* 44 dp und nicht die 36 der Web-Fassung (N15).
               `.listbox__option` traegt dort `--control-h-sm`, und das ist
               richtig — dort zeigt eine Maus darauf. Hier ist es ein Daumen,
               und diese Liste hat 37 Zeilen: Bei 36 dp trifft man in einer
               fahrenden Liste die Nachbarzeile. Es ist dieselbe Entscheidung,
               die die ganze Hoehenleiter dieser App auf die Mobilwerte gestellt
               hat (Tokens.kt, `controlH`). */
            .defaultMinSize(minHeight = Dimens.touchMin)
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
        if (selected) CheckGlyph(tint = colors.signal)
    }
}

/**
 * Wie das Auswahlfeld aussieht — zwei Formen, ein Bauteil (N15).
 *
 * [Field] ist die Form der Web-Fassung: Beschriftung darueber, Feldflaeche
 * darunter. [Row] ist die Listenzeile der Einstellungen-Seite: Beschriftung
 * links, Wert und Winkel rechts, Trefferflaeche ueber die ganze Kartenbreite.
 *
 * Die zweite Form ist eine STRUKTUR-Abweichung (N11a) und kein zweites
 * Bauteil: Popover, Zeilen, Haekchen, Zeiten und Farben sind dieselben.
 */
enum class PickStyle { Field, Row }

/**
 * Das Auswahlfeld samt Popover — allgemein, weil es zwei Aufgaben hat.
 *
 * Gebaut wurde es in P5 fuer den Sprachumschalter; P7 braucht dasselbe
 * Bauteil fuer die Sperrzeit des Tresors. Die achtzig Zeilen Popover-Logik
 * ein zweites Mal hinzuschreiben waere die Sorte Verdopplung, die dieses
 * Projekt sonst ueberall vermeidet — und die erste Abweichung faellt dann
 * erst auf, wenn jemand beide nebeneinander sieht.
 *
 * ── Was N15 hier repariert hat, und warum es ein Fehler war ────────────────
 * Vier Dinge, und alle vier waren an derselben Wurzel: Das Popover war ein
 * freistehender Kasten mit geratenen Zahlen statt eines Aufsatzes auf seinem
 * Auslöser.
 *
 * 1. **Es hing nicht am Trigger.** Der `Popup` stand als GESCHWISTER der
 *    Spalte im Baum, und ein Compose-Popup rechnet seine Lage aus den Grenzen
 *    seines Elternteils. Das war hier die Karte — nicht das Feld. Die Liste
 *    erschien also in der Naehe des Feldes und nicht darunter, und beim
 *    naechsten Layout woanders.
 * 2. **Die Breite war eine Konstante** (240 dp beim Sprachumschalter, 200 dp
 *    bei der Zeitschaltung). Die Web-Fassung hat gar keine: `.listbox` traegt
 *    `inset-inline: 0` und ist damit per Definition so breit wie ihr Trigger.
 *    Jetzt wird die Triggerbreite gemessen und weitergegeben — dieselbe
 *    Mechanik wie beim Kopf und bei der Leiste, die ihre Hoehe auch messen
 *    statt zu rechnen.
 * 3. **Die Hoehe war eine zweite Konstante** (320/200 dp) statt
 *    `min(60vh, 22rem)`.
 * 4. **Es hatte gar keine Kante.** Nur `--surface` auf `--surface` — im
 *    Dunkeln stand damit ein #18181b-Kasten auf einer #18181b-Karte, und die
 *    Liste hatte keinen Rand, den man sehen konnte. Die Referenz gibt ihr
 *    `--elev-2`, und dieses Token ist in beiden Themes verschieden gebaut:
 *    hell drei Schattenlagen, dunkel `inset 0 0 1px rgb(255 255 255 / 30%)`.
 *    Beides steht jetzt da.
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
    style: PickStyle = PickStyle.Field,
) {
    val colors = LocalColors.current
    val feedback = rememberFeedback()

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

    /* Die gemessene Breite des Trigger — sie IST die Breite des Popovers.
       Solange nichts gemessen ist (erstes Bild), gibt es auch kein offenes
       Popover; die Null kann also nie sichtbar werden. */
    var triggerWidth by remember { mutableIntStateOf(0) }
    val current = selected?.let(display) ?: emptyLabel

    val popover: @Composable () -> Unit = {
        if (rendered) {
            PickPopover(
                width = triggerWidth,
                enter = enter.value,
                options = options,
                selected = selected,
                display = display,
                onDismiss = { open = false },
                onChoose = { option ->
                    open = false
                    // Eine Rastung, wie das Weiterschalten eines Waehlers —
                    // das Konzept steht in Haptics.kt.
                    feedback(Feedback.Detent)
                    onPick(option)
                },
            )
        }
    }

    when (style) {
        PickStyle.Field -> Column(modifier = modifier) {
            BasicText(
                text = label,
                style = TextStyles.micro.copy(color = colors.ink3),
            )

            /* Der Anker ist das FELD und nicht die Spalte: Das Popover haengt
               unter dem Feld, nicht unter der Beschriftung. Deshalb steht der
               `Popup`-Aufruf in dieser Box und nicht daneben. */
            Box(modifier = Modifier.padding(top = Dimens.sp1)) {
                Row(
                    modifier = Modifier
                        .onSizeChanged { triggerWidth = it.width }
                        .clip(RoundedCornerShape(Dimens.radiusField))
                        .background(colors.surfaceFill)
                        .clickable(role = Role.DropdownList) { open = !open }
                        .semantics { contentDescription = aria }
                        // Das Auswahlfeld ist fest 36 dp hoch — die sm-Sprosse
                        // der Hoehenleiter, dieselbe Zahl wie im Web.
                        .defaultMinSize(minHeight = Dimens.controlHSm)
                        .padding(horizontal = Dimens.sp3),
                    horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    BasicText(
                        text = current,
                        style = TextStyles.small.copy(color = colors.ink),
                        maxLines = 1,
                    )
                    SelectChevron(open = open, colour = colors.ink2)
                }

                popover()
            }
        }

        PickStyle.Row -> Box(
            modifier = modifier.onSizeChanged { triggerWidth = it.width },
        ) {
            ListRow(
                label = label,
                value = current,
                role = Role.DropdownList,
                onClick = { open = !open },
                trailing = { SelectChevron(open = open, colour = colors.ink2) },
            )

            popover()
        }
    }
}

/**
 * Das Popover — der Aufsatz, der die Liste traegt.
 *
 * @param width die gemessene Breite des Trigger, in Pixeln.
 * @param enter 0 … 1, die laufende Ein- oder Ausfahrt.
 */
@Composable
private fun <T> PickPopover(
    width: Int,
    enter: Float,
    options: List<T>,
    selected: T?,
    display: (T) -> String,
    onDismiss: () -> Unit,
    onChoose: (T) -> Unit,
) {
    val colors = LocalColors.current
    val density = LocalDensity.current
    val shape = RoundedCornerShape(Dimens.radiusPanel)
    val scroll = rememberScrollState()

    /* Die Hoehengrenze rechnet mit der FENSTERhoehe, wie `60vh` im Web.
       `screenHeightDp` ist die Hoehe ohne Systemleisten — genau das, was `vh`
       in einer Browser-Fassung ohne Adressleiste auch waere. */
    val cap = (LocalConfiguration.current.screenHeightDp * POPOVER_MAX_SHARE).dp
    val maxHeight = if (cap < POPOVER_MAX) cap else POPOVER_MAX

    Popup(
        onDismissRequest = onDismiss,
        properties = PopupProperties(focusable = true),
        popupPositionProvider = remember(density) {
            PopoverPosition(gap = with(density) { Dimens.sp2.roundToPx() })
        },
    ) {
        Box(
            modifier = Modifier
                // Fade + zoom-95 + 4 dp Weg — die drei Spuren der
                // Referenz, alle an derselben Fahrt.
                .alpha(enter)
                .scale(0.95f + 0.05f * enter)
                .padding(top = (4 * (1f - enter)).dp)
                .width(with(density) { width.toDp() })
                /* `--elev-2`, hell: die dominante der drei Lagen der
                   CSS-Fassung (14/28 px bei 8 %). Compose kann nur EINE
                   Elevation je Flaeche — dieselbe benannte Annaeherung wie am
                   Panel und an der Navigationsleiste, und dieselbe Zahl wie
                   dort. */
                .then(
                    if (colors.isDark) {
                        Modifier
                    } else {
                        Modifier.shadow(
                            elevation = 12.dp,
                            shape = shape,
                            ambientColor = Color.Black.copy(alpha = 0.08f),
                            spotColor = Color.Black.copy(alpha = 0.08f),
                        )
                    },
                )
                .clip(shape)
                /* ── Im Dunkeln trennt die HELLIGKEIT, nicht eine Linie ─────
                   Der erste N15-Anlauf setzte hier `--elev-2` woertlich um:
                   dunkel `inset 0 0 1px rgb(255 255 255 / 30%)`, also eine
                   helle Kante. Kevins Urteil an der Spiegelung: „die fette
                   Umrandung brauche ich nicht beim Darkmode." Er hat recht, und
                   die Zahl sagt warum — 1 dp sind auf diesem Geraet VIER Pixel
                   in einem Ton, der zwischen Flaeche und Text liegt. Das liest
                   sich als Rahmen, und Rahmen hat dieses Geraet seit V9 keine
                   mehr.

                   Die Aufgabe bleibt: Ein Popover auf `--surface` ueber einer
                   Karte auf `--surface` hat gar keine Kante. Geloest wird sie
                   jetzt mit dem Mittel, das dieses Haus im Dunkeln ohnehin
                   benutzt — die naechste Sprosse der FLAECHENLEITER. Am Panel
                   steht die Regel woertlich: „Hell traegt sie den
                   Surface-Schatten der Referenz, dunkel NICHTS — dort trennt
                   allein die Helligkeit."

                   `--surface-fill` ist diese Sprosse (#27272a auf #18181b).
                   Damit ist die Erhebung eine Flaeche und kein Strich, und die
                   Leiste unten macht es seit N14 genauso: Kante weg, Flaeche
                   traegt. */
                .background(if (colors.isDark) colors.surfaceFill else colors.surface)
                // 8 px Rand + 16 px Zeilenradius = 24 px Panelradius: Die
                // Rundungen laufen konzentrisch, nichts stoesst an.
                .padding(Dimens.sp2),
        ) {
            Column(
                modifier = Modifier
                    .heightIn(max = maxHeight)
                    // Die Maske sitzt UEBER dem Scroller: Sie blendet dessen
                    // Sichtfenster aus, nicht seinen Inhalt.
                    .scrollEdges(scroll)
                    .verticalScroll(scroll),
            ) {
                for (option in options) {
                    ListboxRow(
                        label = display(option),
                        selected = option == selected,
                        onClick = { onChoose(option) },
                    )
                }
            }
        }
    }
}

/**
 * Wo das Popover steht: unter dem Trigger, linksbuendig mit ihm — und darueber,
 * wenn unten nichts mehr ist.
 *
 * ── Warum ein eigener Positionsgeber ──────────────────────────────────────
 * Der eingebaute (`alignment` + `offset`) kann nur EINE Regel und kennt die
 * Fensterkante nicht. Die Web-Fassung klappt ihr Popover AUSDRUECKLICH nach
 * oben auf, weil ihr Trigger im Fuss sitzt („dort ist unten nichts mehr",
 * styles/panels.css). Nativ steht derselbe Trigger einmal oben in einer Karte
 * und einmal weiter unten in einer Liste — die Richtung ist also nicht mehr
 * eine Eigenschaft des Bauteils, sondern seines Ortes. Deshalb entscheidet sie
 * hier, mit den echten Zahlen des Fensters.
 */
private class PopoverPosition(private val gap: Int) : PopupPositionProvider {
    override fun calculatePosition(
        anchorBounds: IntRect,
        windowSize: IntSize,
        layoutDirection: LayoutDirection,
        popupContentSize: IntSize,
    ): IntOffset {
        val below = anchorBounds.bottom + gap
        val above = anchorBounds.top - gap - popupContentSize.height
        // Unten ist die Vorgabe. Nach oben nur, wenn unten wirklich kein Platz
        // ist UND oben welcher — sonst stuende die Liste halb im Nichts.
        val fitsBelow = below + popupContentSize.height <= windowSize.height
        val y = if (fitsBelow || above < 0) below else above

        // Linksbuendig mit dem Trigger, aber niemals aus dem Fenster heraus.
        val room = (windowSize.width - popupContentSize.width).coerceAtLeast(0)
        return IntOffset(anchorBounds.left.coerceIn(0, room), y.coerceAtLeast(0))
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
    style: PickStyle = PickStyle.Field,
) {
    Pick(
        label = text("lang.label"),
        aria = text("lang.aria"),
        options = LOCALES,
        selected = LOCALES.firstOrNull { it.code == current },
        display = { it.name },
        onPick = { onPick(it.code) },
        modifier = modifier,
        style = style,
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
