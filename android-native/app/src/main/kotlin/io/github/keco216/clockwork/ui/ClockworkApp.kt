package io.github.keco216.clockwork.ui

import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.PersistableBundle
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.foundation.shape.RoundedCornerShape
import io.github.keco216.clockwork.core.ParsedEntry
import io.github.keco216.clockwork.core.generateTotpForCounter
import io.github.keco216.clockwork.core.parseEntries
import io.github.keco216.clockwork.core.periodProgress
import io.github.keco216.clockwork.core.timeCounter
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.TextStyles

/**
 * Die eine Buehne mit zwei Zustaenden — das Gegenstueck zu `data-stage` im Web.
 *
 * ── Was den Zustand ausloest ──────────────────────────────────────────────
 * `entries.isEmpty()`, und ausdruecklich NICHT „kein gueltiger Eintrag": Eine
 * unlesbare Zeile IST etwas zu zeigen, und ihre Fehlermeldung ist ein
 * Kanalzug — der braucht die Arbeitsbuehne. Genau so steht es in `ui/app.ts`.
 *
 * ── Das Textfeld ist die Quelle der Wahrheit ──────────────────────────────
 * Es gibt kein verstecktes Datenmodell daneben. Eine Zeile IST ein Eintrag,
 * `parseEntries` macht daraus Konten oder Fehlerkarten. Das ist der Charakter
 * dieser App und der Grund, warum ein Import sichtbar bleibt.
 */
@Composable
fun ClockworkApp() {
    val colors = LocalColors.current
    val context = LocalContext.current
    val unixSeconds by rememberUnixSeconds()

    var field by rememberSaveable(stateSaver = TextFieldValue.Saver) {
        mutableStateOf(TextFieldValue(""))
    }

    // Neu ausgewertet wird nur, wenn sich der TEXT geaendert hat — nicht bei
    // jedem Bild. Die Uhr tickt sechzigmal je Sekunde; `parseEntries` bei
    // jedem Tick laufen zu lassen hiesse, sechzigmal je Sekunde Base32 zu
    // decodieren.
    val entries = remember(field.text) { parseEntries(field.text) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.ground)
            .systemBarsPadding()
            .padding(Dimens.gapGroup),
        verticalArrangement = Arrangement.spacedBy(Dimens.gapGroup),
    ) {
        if (entries.isEmpty()) {
            VacantStage(field = field, onFieldChange = { field = it })
        } else {
            WorkingStage(
                field = field,
                onFieldChange = { field = it },
                entries = entries,
                unixSeconds = unixSeconds,
                onCopy = { code -> context.copySensitive(code) },
            )
        }
    }
}

/**
 * Der Leerzustand: Emblem in 2,2-facher Groesse, ein Satz, das Feld selbst.
 *
 * Er ist kein FEHLzustand, sondern die Einladung — dieselbe Haltung wie im Web
 * seit V7.
 */
@Composable
private fun VacantStage(field: TextFieldValue, onFieldChange: (TextFieldValue) -> Unit) {
    val colors = LocalColors.current

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Gauge(
            progress = 0.0,
            modifier = Modifier.size(Dimens.dialSize),
        )
        Spacer(Modifier.height(Dimens.gapGroup))
        BasicText(
            text = text("vacant.text"),
            style = TextStyles.body.copy(color = colors.ink2),
        )
        Spacer(Modifier.height(Dimens.gapStack))
        SecretField(field = field, onFieldChange = onFieldChange)
    }
}

/**
 * Der Arbeitszustand — und die V10-Reihenfolge: Die CODES stehen zuerst.
 *
 * Das ist die halbe Zusage von v1.4.0: Wer nur seinen Code will (der haeufigste
 * Fall ueberhaupt), soll nicht an Eingabefeld und Tresor vorbeiscrollen.
 * Gemessen war der erste Code im Web vorher bei y = 821, danach bei 206.
 */
@Composable
private fun WorkingStage(
    field: TextFieldValue,
    onFieldChange: (TextFieldValue) -> Unit,
    entries: List<ParsedEntry>,
    unixSeconds: Double,
    onCopy: (String) -> Unit,
) {
    val colors = LocalColors.current
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(Dimens.gapGroup),
    ) {
        Panel(modifier = Modifier.fillMaxWidth()) {
            Column {
                entries.forEachIndexed { index, entry ->
                    when (entry) {
                        is ParsedEntry.Ok -> {
                            val account = entry.account
                            val counter = timeCounter(unixSeconds, account.period)
                            val code = remember(entry.key, counter) {
                                generateTotpForCounter(
                                    secret = account.secret,
                                    counter = counter,
                                    algorithm = account.algorithm,
                                    digits = account.digits,
                                )
                            }
                            val next = remember(entry.key, counter) {
                                generateTotpForCounter(
                                    secret = account.secret,
                                    counter = counter + 1,
                                    algorithm = account.algorithm,
                                    digits = account.digits,
                                )
                            }
                            Strip(
                                title = account.issuer
                                    ?: account.accountName
                                    ?: text(
                                        "strip.accountFallback",
                                        mapOf("n" to formatNumber((index + 1).toLong())),
                                    ),
                                subtitle = if (account.issuer != null) account.accountName else null,
                                spec = text(
                                    "strip.spec",
                                    mapOf(
                                        "algorithm" to account.algorithm.displayName,
                                        "digits" to textCount("strip.digits", account.digits),
                                        "period" to text(
                                            "strip.period",
                                            mapOf("n" to formatNumber(account.period.toLong())),
                                        ),
                                    ),
                                ),
                                code = code,
                                nextCode = next,
                                progress = periodProgress(unixSeconds, account.period),
                                period = account.period,
                                onCopy = onCopy,
                                lead = index == 0,
                            )
                        }

                        is ParsedEntry.Failed -> FaultStrip(
                            source = entry.source,
                            message = context.text(entry.messageKey, entry.messageArgs),
                        )
                    }
                }
            }
        }

        Panel(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
                BasicText(
                    text = text("zone.input"),
                    style = TextStyles.small.copy(color = colors.ink2),
                )
                SecretField(field = field, onFieldChange = onFieldChange)
            }
        }
    }
}

/**
 * Das Textfeld.
 *
 * `BasicTextField` und nicht `TextField`: Letzteres kommt aus Material und
 * braechte Label, Rahmen und Fuellung seines eigenen Systems mit.
 */
@Composable
private fun SecretField(field: TextFieldValue, onFieldChange: (TextFieldValue) -> Unit) {
    val colors = LocalColors.current

    BasicTextField(
        value = field,
        onValueChange = onFieldChange,
        textStyle = TextStyles.body.copy(color = colors.ink),
        cursorBrush = androidx.compose.ui.graphics.SolidColor(colors.signal),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Dimens.radiusField))
            .background(colors.surfaceFill)
            .padding(Dimens.sp3),
        decorationBox = { inner ->
            if (field.text.isEmpty()) {
                BasicText(
                    text = text("input.placeholder"),
                    style = TextStyles.body.copy(color = colors.ink3),
                )
            }
            inner()
        },
    )
}

/**
 * Kopiert einen Code in die Zwischenablage — als VERTRAULICH markiert.
 *
 * Ab API 33 zeigt Android beim Kopieren eine Vorschau des Inhalts. Ein
 * TOTP-Code haette darin nichts verloren: Er waere fuer jeden sichtbar, der
 * gerade auf den Bildschirm schaut, und ueberlebte den Moment als
 * Bildschirmfoto. `EXTRA_IS_SENSITIVE` unterdrueckt die Vorschau.
 *
 * Unter 33 gibt es das Flag nicht — dort bleibt die Vorschau, wie sie ist.
 * Das ist eine echte Luecke und keine, die sich hier schliessen laesst;
 * benannt statt uebergangen.
 */
private fun Context.copySensitive(code: String) {
    val clipboard = getSystemService(ClipboardManager::class.java) ?: return
    val clip = ClipData.newPlainText(null, code)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        clip.description.extras = PersistableBundle().apply {
            putBoolean(ClipDescription.EXTRA_IS_SENSITIVE, true)
        }
    }
    clipboard.setPrimaryClip(clip)
}
