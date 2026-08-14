package io.github.keco216.clockwork.ui

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.core.os.LocaleListCompat
import io.github.keco216.clockwork.core.PBKDF2_ITERATIONS
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.TextStyles

/**
 * Die Einstellungen-Seite (N11).
 *
 * ── Was hier steht, und wonach das entschieden ist ────────────────────────
 * Alles, was KONFIGURIERT statt bedient wird. Die Trennlinie ist nicht
 * „selten gebraucht", sondern „einmal entschieden": Die Sprache stellt man
 * einmal, die Zeitschaltung einmal, die Biometrie einmal. Der Tresor-ZUSTAND
 * dagegen — aufsperren, zusperren — ist Arbeitsfluss und bleibt auf der
 * Startseite, obwohl er technisch derselbe Gegenstand ist.
 *
 * ── Warum die Ueber-Seite kein Beiwerk ist ────────────────────────────────
 * Die Lizenzhinweise der benutzten Bibliotheken sind eine Pflicht, und sie
 * standen bisher NIRGENDS — weder im Web noch nativ. Eine App, deren ganze
 * Zusage „nachpruefbar" lautet, kann das nicht offenlassen.
 *
 * ── Und seit N15 sind es ZEILEN und kein Formular ──────────────────────────
 * Bis N14 stand hier gestapelte Web-Struktur: ein Auswahlfeld mit Beschriftung
 * darueber, darunter drei Schalter mit der Bahn VOR dem Wort. Das ist die
 * Anordnung eines Formulars. Eine Einstellungsseite wird aber nicht ausgefuellt,
 * sondern durchsucht — man will EINEN Posten finden, seinen Wert sehen und ihn
 * aendern. Die Begruendung im Einzelnen steht bei [ListRow]; hier stehen die
 * Folgen: Die Karten tragen kein waagerechtes Polster mehr (die Zeilen bringen
 * es mit, damit ihre Trefferflaeche bis zur Kartenkante reicht), zwischen
 * Zeilen liegen Haarlinien, und jeder Wert steht rechts neben seinem Posten.
 */
@Composable
fun SettingsPage(
    vault: VaultController,
    scroll: ScrollState,
    topInset: Dp,
    bottomInset: Dp,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current

    Column(
        modifier = modifier
            .fillMaxWidth()
            .verticalScroll(scroll)
            .padding(
                start = Dimens.gapGroup,
                end = Dimens.gapGroup,
                // Wie auf der Startseite: gemessene Leistenhoehe plus
                // Gruppenfuge, damit die Ueber-Karte vollstaendig ueber die
                // schwebende Leiste hinausgescrollt werden kann (N12/N13).
                bottom = Dimens.gapGroup + bottomInset,
            )
            .padding(top = topInset),
        verticalArrangement = Arrangement.spacedBy(Dimens.gapGroup),
    ) {
        // Die Sprache traegt ihre eigene Beschriftung ueber `lang.label` —
        // eine Ueberschrift darueber saegte denselben Satz zweimal. Als Zeile
        // steht sie links und ihr Wert rechts, also sieht man die gewaehlte
        // Sprache jetzt OHNE das Feld zu oeffnen.
        Panel(
            modifier = Modifier.fillMaxWidth().cardEnter(0),
            padding = ListPanelPadding,
        ) {
            LanguagePicker(
                current = currentLocaleCode(context),
                onPick = { code ->
                    AppCompatDelegate.setApplicationLocales(
                        LocaleListCompat.forLanguageTags(code),
                    )
                },
                style = PickStyle.Row,
            )
        }

        Panel(
            modifier = Modifier.fillMaxWidth().cardEnter(1),
            padding = ListPanelPadding,
        ) {
            Column {
                SectionLabel(text("zone.vault"))

                VaultSettings(
                    controller = vault,
                    state = vault.state,
                    activity = context.findActivity(),
                )

                /* Die Gefahrenzone ist raeumlich abgesetzt: eine ganze
                   Stapelfuge Abstand und die volle Breite. Sie steht bewusst
                   ganz unten — man scrollt an allem anderen vorbei, bevor man
                   sie erreicht. Die Haarlinie darueber ist die Grenze der
                   Liste: Was danach kommt, ist keine Einstellung mehr. */
                RowDivider(modifier = Modifier.padding(vertical = Dimens.sp2))
                Box(modifier = Modifier.padding(Dimens.gapGroup)) {
                    VaultDanger(controller = vault, state = vault.state)
                }
            }
        }

        AboutPanel()
    }
}

/** Version, Zusagen, Lizenzen, Quelltext. */
@Composable
private fun AboutPanel() {
    val colors = LocalColors.current
    val context = LocalContext.current
    val version = remember(context) { versionLine(context) }

    Panel(
        modifier = Modifier.fillMaxWidth().cardEnter(2),
        padding = ListPanelPadding,
    ) {
        Column {
            SectionLabel(text("native.about.title"))

            /* Die Version ist eine ZEILE — Posten links, Wert rechts. Sie ist
               die einzige Angabe dieser Karte, die dieselbe Form hat wie eine
               Einstellung: eine Frage mit einer Antwort. */
            ListRow(label = text("native.about.version"), value = version)

            RowDivider(modifier = Modifier.padding(vertical = Dimens.sp2))

            /* Alles Weitere ist Prosa und bleibt Prosa. Ein Absatz in eine
               Zeile zu pressen hiesse, ihn zu kuerzen — und das sind ausgerechnet
               die Saetze, die die Zusagen der App tragen. Sie bekommen deshalb
               die Einrueckung der Zeilen, aber nicht ihre Form. */
            Column(
                modifier = Modifier.padding(horizontal = Dimens.gapGroup),
                verticalArrangement = Arrangement.spacedBy(Dimens.gapStack),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
                    BasicText(
                        text = text("native.about.network"),
                        style = TextStyles.micro.copy(color = colors.ink2),
                    )

                    /* Die zwei uebrigen Zusagen stehen laengst im Katalog — beim
                       Tresor-Panel, das sie erklaert, solange der Tresor aus ist.
                       Sie hier zu wiederholen hiesse, denselben Satz zweimal zu
                       pflegen und ihn beim naechsten Mal an einer Stelle zu
                       vergessen. */
                    BasicText(
                        text = text("vault.explain"),
                        style = TextStyles.micro.copy(color = colors.ink3),
                    )
                    BasicText(
                        text = text(
                            "vault.explain.crypto",
                            mapOf("iterations" to formatNumber(PBKDF2_ITERATIONS.toLong())),
                        ),
                        style = TextStyles.micro.copy(color = colors.ink3),
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
                    BasicText(
                        text = text("native.about.licenses"),
                        style = TextStyles.small.copy(color = colors.ink),
                    )
                    for (line in LICENCES) {
                        BasicText(
                            text = line,
                            style = TextStyles.micro.copy(color = colors.ink3),
                        )
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
                    BasicText(
                        text = text("native.about.source"),
                        style = TextStyles.small.copy(color = colors.ink),
                    )
                    /* Als TEXT und nicht als Verweis: Ein Antippen muesste einen
                       Browser oeffnen, und diese App hat keine
                       Netz-Berechtigung. Ein Knopf, der aus der App
                       herausfuehrt, waere ausserdem genau das, was die
                       Zusagen-Zeile darueber ausschliesst. Wer die Adresse
                       braucht, liest sie ab. */
                    BasicText(
                        text = SOURCE_URL,
                        style = TextStyles.micro.copy(color = colors.ink2),
                    )
                }
            }
        }
    }
}

/**
 * Die Ueberschrift einer Kartengruppe.
 *
 * Sie traegt die Einrueckung der ZEILEN und nicht die eines Panels — sonst
 * stuende sie neben ihrer eigenen Liste. Senkrecht bekommt sie die Paarfuge
 * nach unten, damit sie zur Liste gehoert und nicht darueber schwebt.
 */
@Composable
private fun SectionLabel(label: String) {
    val colors = LocalColors.current
    BasicText(
        text = label,
        style = TextStyles.small.copy(color = colors.ink),
        modifier = Modifier.padding(
            start = Dimens.gapGroup,
            end = Dimens.gapGroup,
            top = Dimens.sp2,
            bottom = Dimens.gapPair,
        ),
    )
}

/**
 * Versionsname und -nummer, vom System erfragt.
 *
 * Nicht aus `BuildConfig`: Das Bauteil ist ausgeschaltet (`buildConfig =
 * false`), weil eine generierte Klasse fuer eine einzige Zahl Apparat ohne
 * Aufgabe waere. Der PackageManager weiss es ohnehin, und er weiss es
 * richtig — auch dann, wenn jemand das APK umsigniert.
 */
/*
 * `BidiSpoofing` ist hier ein Fehlalarm, und zwar auf die LOESUNG (N20).
 *
 * Lint beanstandet jede Zeichenkette mit Bidi-Steuerzeichen, weil sich damit
 * Text tarnen laesst — ein Dateiname, der rueckwaerts gelesen harmlos aussieht.
 * Die zwei Zeichen unten tun das Gegenteil: U+2068/U+2069 KLAMMERN die
 * Versionsangabe ein, damit der Bidi-Algorithmus sie auf Arabisch nicht
 * umstellt (aus „2.0.0-dev-debug (20000)" wurde sonst „dev-debug (20000)-2.0.0",
 * eine Versionsnummer, die es nicht gibt — der Befund aus N11).
 *
 * Sie stehen also genau deshalb da, wovor die Regel warnt: damit niemand
 * getaeuscht wird. Unterdrueckt statt entfernt, mit der Begruendung daneben.
 */
@Suppress("BidiSpoofing")
private fun versionLine(context: Context): String = try {
    val info = context.packageManager.getPackageInfo(context.packageName, 0)
    val code = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        info.longVersionCode
    } else {
        @Suppress("DEPRECATION")
        info.versionCode.toLong()
    }
    /* In BIDI-ISOLATION. Ohne sie zerlegt der Bidi-Algorithmus die Zeile in
       einem arabischen Absatz in ihre Teile und setzt sie um: Aus
       „2.0.0-dev-debug (20000)" wurde am Geraet gemessen
       „dev-debug (20000)-2.0.0" — eine Versionsnummer, die es nicht gibt.

       U+2068 (First Strong Isolate) und U+2069 (Pop Directional Isolate)
       sagen dem Algorithmus: Das hier ist EIN Stueck, seine Richtung bestimmt
       sein erstes starkes Zeichen, und es faerbt nicht auf den Rest der Zeile
       ab. Dieselbe Sorgfalt wie das erzwungene `-u-nu-latn` bei den Ziffern —
       eine technische Angabe muss ablesbar bleiben, nicht huebsch. */
    "⁨${info.versionName} ($code)⁩"
} catch (_: PackageManager.NameNotFoundException) {
    // Das eigene Paket nicht zu finden ist unmoeglich — aber die Signatur
    // verlangt den Fang, und eine leere Zeile ist besser als ein Absturz.
    ""
}

/**
 * Woher die aktuelle Sprache kommt: erst die per-App-Wahl, sonst die
 * Konfiguration. Beides kann Regionalvarianten tragen, deshalb laeuft es
 * durch denselben Aufloeser wie im Web.
 */
private fun currentLocaleCode(context: Context): String {
    val applied = AppCompatDelegate.getApplicationLocales()
    val tags = buildList {
        for (index in 0 until applied.size()) applied[index]?.toLanguageTag()?.let(::add)
        val configured = context.resources.configuration.locales
        for (index in 0 until configured.size()) add(configured[index].toLanguageTag())
    }
    return resolveLocaleCode(tags)
}

/**
 * Die Lizenzhinweise.
 *
 * Sie stehen als Konstanten im Code und NICHT im Katalog: Eigennamen und
 * SPDX-Kennungen bleiben in allen 37 Sprachen dieselben — dieselbe
 * Begruendung, mit der seit N8 „javax.crypto" im Fuss unuebersetzt steht.
 * Uebersetzt wird die Ueberschrift darueber, und die steht im Katalog.
 */
private val LICENCES = listOf(
    "ZXing — Apache-2.0",
    "AndroidX, Jetpack Compose — Apache-2.0",
    "Inter, Chivo Mono — SIL OFL 1.1",
)

private const val SOURCE_URL = "https://github.com/keco216/clockwork"
