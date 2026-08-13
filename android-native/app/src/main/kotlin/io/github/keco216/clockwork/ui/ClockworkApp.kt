package io.github.keco216.clockwork.ui

import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.PersistableBundle
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.foundation.shape.RoundedCornerShape
import io.github.keco216.clockwork.core.ParsedEntry
import io.github.keco216.clockwork.core.describeForSearch
import io.github.keco216.clockwork.core.generateTotpForCounter
import io.github.keco216.clockwork.core.matchesFilter
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
/** Ab so vielen Eintraegen erscheint die Filterzeile — wie im Web. */
private const val FILTER_FROM = 8

/**
 * Der Testschluessel aus RFC 4226 Anhang D: Base32 fuer `12345678901234567890`.
 *
 * Ein Literal in der Oberflaeche und trotzdem kein Verstoss gegen „kein Text in
 * ui/": Das ist kein UEBERSETZBARER Text, sondern ein dokumentierter
 * Testvektor. Die Web-Fassung haelt ihn aus demselben Grund als Literal in
 * `app.ts`.
 */
private const val TEST_KEY = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"

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
    val vacant = entries.isEmpty()

    // ── Der Zustand der Eingabe-Schublade ──────────────────────────────────
    // Voreinstellung ZU: Wer seine Codes will, soll nicht an der Bedienung
    // vorbeiscrollen. Die eine Ausnahme steht darunter.
    var inputOpen by rememberSaveable { mutableStateOf(false) }
    var fieldFocused by remember { mutableStateOf(false) }

    // „Offen bleibt der Editor beim Buehnenwechsel nur, wenn der Fokus darin
    // liegt" — die V10-Regel woertlich. Wer gerade das erste Secret tippt, dem
    // klappt nichts unter den Fingern zu; wer den Tresor aufsperrt, bekommt
    // die Codes obenan und die Eingabe zu.
    LaunchedEffect(vacant) {
        if (!vacant) inputOpen = fieldFocused
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.ground)
            .systemBarsPadding()
            .padding(Dimens.gapGroup),
        verticalArrangement = Arrangement.spacedBy(Dimens.gapGroup),
    ) {
        if (vacant) {
            VacantStage(
                field = field,
                onFieldChange = { field = it },
                onFocusChange = { fieldFocused = it },
                onTestKey = { field = TextFieldValue(TEST_KEY) },
            )
        } else {
            WorkingStage(
                field = field,
                onFieldChange = { field = it },
                onFocusChange = { fieldFocused = it },
                entries = entries,
                unixSeconds = unixSeconds,
                inputOpen = inputOpen,
                onToggleInput = { inputOpen = !inputOpen },
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
private fun VacantStage(
    field: TextFieldValue,
    onFieldChange: (TextFieldValue) -> Unit,
    onFocusChange: (Boolean) -> Unit,
    onTestKey: () -> Unit,
) {
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
            // `native.` und nicht `vacant.text`: Der Web-Satz endet auf „…
            // verlaesst diesen Browser", und hier gibt es keinen Browser. Der
            // Schluessel steht im gemeinsamen Katalog (dort prueft der Compiler
            // ihn in allen 37 Sprachen), wird aber aus dem Web-Buendel
            // genommen — Einzelheiten in src/i18n/strings.ts. Das Praefix am
            // Aufruf ist Absicht: Man sieht der Zeile an, dass dieser Text der
            // nativen App gehoert.
            text = text("native.vacant.text"),
            style = TextStyles.body.copy(color = colors.ink2),
        )
        Spacer(Modifier.height(Dimens.gapStack))
        SecretField(
            field = field,
            onFieldChange = onFieldChange,
            onFocusChange = onFocusChange,
        )

        // ── Der Testschluessel-Knopf ───────────────────────────────────────
        // Er lebt NUR im Leerzustand, und zusaetzlich prueft der Handler auf
        // ein leeres Feld. Die Zusage aus V4 bleibt damit woertlich erfuellt:
        // Es gibt keinen Zustand, in dem er echtes Schluesselmaterial
        // ueberschreiben koennte. Bei Schluesselmaterial ist ein zweites
        // Schloss billiger als die Frage, ob das erste noch haelt.
        if (field.text.isEmpty()) {
            Spacer(Modifier.height(Dimens.gapPair))
            Key(
                label = text("vacant.demo"),
                onClick = { if (field.text.isEmpty()) onTestKey() },
                modifier = Modifier.fillMaxWidth(),
                variant = KeyVariant.Default,
                large = true,
            )
        }
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
    onFocusChange: (Boolean) -> Unit,
    entries: List<ParsedEntry>,
    unixSeconds: Double,
    inputOpen: Boolean,
    onToggleInput: () -> Unit,
    onCopy: (String) -> Unit,
) {
    val colors = LocalColors.current
    val context = LocalContext.current

    var filter by rememberSaveable { mutableStateOf("") }

    // Der Suchtext wird EINMAL je Eintrag gefaltet, nicht bei jedem
    // Tastendruck ueber die ganze Liste. Bei einer unlesbaren Zeile geht die
    // uebersetzte Meldung mit hinein — wer in einer langen Liste den Fehler
    // sucht, sucht nach dem, was er getippt hat.
    val haystacks = remember(entries, context) {
        entries.map { entry ->
            when (entry) {
                is ParsedEntry.Ok -> describeForSearch(entry)
                is ParsedEntry.Failed ->
                    describeForSearch(entry, context.text(entry.messageKey, entry.messageArgs))
            }
        }
    }

    // Drei Kanaele in zwei Spalten sind kein Raster, sondern eine angefangene
    // Zeile — dieselbe Zahl schaltet im Web den Filter frei.
    val showFilter = entries.size >= FILTER_FROM
    val shown = entries.filterIndexed { index, _ ->
        !showFilter || matchesFilter(haystacks[index], filter)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(Dimens.gapGroup),
    ) {
        Panel(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
                if (showFilter) {
                    FilterField(value = filter, onValueChange = { filter = it })
                }

                if (shown.isEmpty()) {
                    // Ein leeres Ergebnis ist eine Auskunft, kein leerer Kasten.
                    BasicText(
                        text = text("filter.empty", mapOf("query" to filter.trim())),
                        style = TextStyles.body.copy(color = colors.ink2),
                    )
                }

                shown.forEachIndexed { index, entry ->
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

        // ── Die Eingabe als Fold-Zeile (V10) ───────────────────────────────
        // „Eingabe · 3 Konten" mit demselben Zaehler wie im Web: eine Zahl,
        // eine Quelle. Tippen oeffnet den Editor in der Schublade darunter.
        Panel(modifier = Modifier.fillMaxWidth()) {
            Column {
                FoldRow(
                    label = "${text("zone.input")} · ${countLabel(entries)}",
                    expanded = inputOpen,
                    onToggle = onToggleInput,
                )
                Drawer(open = inputOpen) {
                    // Die Fuge zur Zeile faehrt als Innenabstand der Schublade
                    // mit zu — stuende sie aussen, bliebe im zugeklappten
                    // Zustand eine Luecke ohne Inhalt stehen.
                    Box(modifier = Modifier.padding(top = Dimens.gapPair)) {
                        SecretField(
                            field = field,
                            onFieldChange = onFieldChange,
                            onFocusChange = onFocusChange,
                        )
                    }
                }
            }
        }
    }
}

/**
 * Der Zaehler der Fold-Zeile — dieselbe Zahl wie im Web, aus derselben Quelle.
 *
 * Stehen kaputte Zeilen im Feld, nennt der Zaehler beide Mengen ueber
 * `input.count.join`. Eine unlesbare Zeile IST etwas, das da ist; sie
 * wegzuzaehlen hiesse, sie zu verstecken.
 */
@Composable
private fun countLabel(entries: List<ParsedEntry>): String {
    val accounts = entries.count { it is ParsedEntry.Ok }
    val errors = entries.size - accounts
    val accountsText = textCount("input.count.accounts", accounts)
    if (errors == 0) return accountsText

    return text(
        "input.count.join",
        mapOf("accounts" to accountsText, "errors" to textCount("input.count.errors", errors)),
    )
}

/**
 * Die Filterzeile — sie klebt im Web, hier steht sie am Kopf der Karte.
 *
 * Gesucht wird ueber `core/Filter.kt`, also ueber Aussteller und Kontoname,
 * niemals ueber den Code (er wandert mit der Uhr) und niemals ueber das
 * Secret (danach sucht nur, wer es sehen will).
 */
@Composable
private fun FilterField(value: String, onValueChange: (String) -> Unit) {
    val colors = LocalColors.current
    // Ausserhalb des Modifiers geholt: `semantics {}` ist kein Composable und
    // darf `text()` nicht aufrufen.
    val label = text("filter.label")

    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        singleLine = true,
        textStyle = TextStyles.body.copy(color = colors.ink),
        cursorBrush = androidx.compose.ui.graphics.SolidColor(colors.signal),
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = Dimens.controlH)
            .clip(RoundedCornerShape(Dimens.radiusField))
            .background(colors.surfaceFill)
            .padding(horizontal = Dimens.sp3, vertical = Dimens.sp2)
            .semantics { contentDescription = label },
        decorationBox = { inner ->
            if (value.isEmpty()) {
                BasicText(
                    text = text("filter.placeholder"),
                    style = TextStyles.body.copy(color = colors.ink3),
                    maxLines = 1,
                )
            }
            inner()
        },
    )
}

/**
 * Das Textfeld.
 *
 * `BasicTextField` und nicht `TextField`: Letzteres kommt aus Material und
 * braechte Label, Rahmen und Fuellung seines eigenen Systems mit.
 */
@Composable
private fun SecretField(
    field: TextFieldValue,
    onFieldChange: (TextFieldValue) -> Unit,
    onFocusChange: (Boolean) -> Unit,
) {
    val colors = LocalColors.current

    BasicTextField(
        value = field,
        onValueChange = onFieldChange,
        textStyle = TextStyles.body.copy(color = colors.ink),
        cursorBrush = androidx.compose.ui.graphics.SolidColor(colors.signal),
        modifier = Modifier
            .fillMaxWidth()
            .onFocusChanged { onFocusChange(it.isFocused) }
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
