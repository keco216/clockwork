package io.github.keco216.clockwork.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.em
import androidx.core.view.WindowCompat

/**
 * Das Theme der App.
 *
 * Es gibt bewusst KEINEN Hell/Dunkel-Umschalter — die App folgt der
 * Systemeinstellung, genau wie die Web-Fassung mit `prefers-color-scheme`.
 * `isSystemInDarkTheme()` ist dessen Gegenstueck.
 *
 * Was hier NICHT steht, ist ebenso Absicht: kein `MaterialTheme`, kein
 * `ColorScheme`, keine `Typography` aus Material. Die Oberflaeche liest ihre
 * Werte ueber [LocalColors] und die Objekte in Tokens.kt — dieselbe Struktur
 * wie im Web, wo jedes Bauteil seine Werte aus `var(--…)` zieht und keines
 * eigene setzt.
 */
@Composable
fun ClockworkTheme(
    dark: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (dark) DarkColors else LightColors

    val view = LocalView.current
    if (!view.isInEditMode) {
        // Die Symbole der Systemleisten muessen zur Flaeche darunter passen.
        // Im Web macht das `theme-color` samt der Falle, dass es die einzige
        // handkopierte Palettenstelle war — hier faellt es aus demselben
        // Token wie alles andere.
        remember(dark) {
            val window = (view.context as? android.app.Activity)?.window
            if (window != null) {
                WindowCompat.getInsetsController(window, view).apply {
                    isAppearanceLightStatusBars = !dark
                    isAppearanceLightNavigationBars = !dark
                }
            }
            dark
        }
    }

    CompositionLocalProvider(LocalColors provides colors, content = content)
}

/**
 * Die Textstile der App — abgeleitet aus [Typo], nicht neu erfunden.
 *
 * `LineHeightStyle.Trim.None` steht hier, weil Compose sonst die
 * Ueberhaenge der ersten und letzten Zeile abschneidet. Das sieht bei einer
 * einzelnen Zeile aufgeraeumt aus und bricht genau dort, wo dieses Projekt
 * empfindlich ist: Der Code und sein Zifferblatt stehen auf einer Achse, und
 * ein getrimmter Ueberhang verschiebt sie gegeneinander — dieselbe Sorte
 * Fehler wie die 4,5 px Achsenversatz, die V8 an der Code-Karte gefunden hat.
 */
object TextStyles {
    private val base = TextStyle(
        fontFamily = Fonts.ui,
        lineHeightStyle = LineHeightStyle(
            alignment = LineHeightStyle.Alignment.Center,
            trim = LineHeightStyle.Trim.None,
        ),
    )

    /** Beschreibungen, Chips, Meta- und Statuszeilen. */
    val micro: TextStyle
        @Composable @ReadOnlyComposable
        get() = base.copy(
            fontSize = Typo.micro,
            lineHeight = Typo.micro * Typo.lineHeightNormal,
            fontWeight = Typo.weightNormal,
        )

    /** Beschriftungen, Tasten, Bedientext. */
    val small: TextStyle
        @Composable @ReadOnlyComposable
        get() = base.copy(
            fontSize = Typo.small,
            lineHeight = Typo.small * Typo.lineHeightNormal,
            fontWeight = Typo.weightMedium,
        )

    /** Fliesstext und Feldtext. */
    val body: TextStyle
        @Composable @ReadOnlyComposable
        get() = base.copy(
            fontSize = Typo.body,
            lineHeight = Typo.body * Typo.lineHeightNormal,
            fontWeight = Typo.weightNormal,
        )

    /** Der Kontoname — die lg-Stufe der Referenz, eng gespannt. */
    val lead: TextStyle
        @Composable @ReadOnlyComposable
        get() = base.copy(
            fontSize = Typo.lead,
            lineHeight = Typo.lead * Typo.lineHeightTight,
            fontWeight = Typo.weightSemibold,
            letterSpacing = (-0.02).em,
        )

    /**
     * Der Code selbst. Chivo Mono, weil ein TOTP-Code in fremde Anmeldefelder
     * getippt wird und dicktengleiche Ziffern braucht.
     *
     * Die Groesse setzt der Kanalzug selbst — sie klemmt zwischen
     * [Typo.dialMin] und [Typo.dialMax] und haengt an der Kartenbreite.
     */
    val dial: TextStyle
        @Composable @ReadOnlyComposable
        get() = base.copy(
            fontFamily = Fonts.mono,
            fontWeight = Typo.weightDial,
            letterSpacing = 0.005.em,
            lineHeight = Typo.dialMin * Typo.lineHeightTight,
        )
}
