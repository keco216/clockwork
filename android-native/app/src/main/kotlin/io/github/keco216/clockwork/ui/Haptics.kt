package io.github.keco216.clockwork.ui

import android.os.Build
import android.view.HapticFeedbackConstants
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalView

/**
 * Die Haptik der App — EINE Stelle, EINE Regel (N15).
 *
 * ── Die Regel ─────────────────────────────────────────────────────────────
 * **Haptik quittiert einen ZUSTANDSWECHSEL, nicht eine Beruehrung.**
 *
 * Das ist die haptische Fassung derselben Linie, die im Web ueber der
 * Bewegungssprache steht: „Genau ein Akzent, nur fuer Zustaende mit
 * Bedeutung." Eine App, die bei jedem Tipp brummt, sagt damit nichts mehr —
 * sie hat ihr lautestes Mittel an das haeufigste Ereignis verschwendet. Wer
 * eine Taste drueckt, SIEHT die Flaeche umkehren und das Nachgeben (N14); das
 * ist die Rueckmeldung fuer die Beruehrung, und sie genuegt.
 *
 * Deshalb bleibt stumm, was nur navigiert oder aufklappt: Fold-Zeilen,
 * Textfelder, „QR aus Bild", der Testschluessel-Knopf. Und deshalb spricht,
 * was etwas VERAENDERT oder ein Ergebnis meldet:
 *
 * | Wo                                  | Was                | Warum                                              |
 * | ----------------------------------- | ------------------ | -------------------------------------------------- |
 * | Code kopiert                        | [Feedback.Confirm] | die eine Handlung der App — und man sieht dabei    |
 * |                                     |                    | auf ein fremdes Anmeldefeld, nicht auf die Taste   |
 * | QR erkannt                          | [Feedback.Confirm] | der Blick liegt auf dem Motiv, nicht am Schirm     |
 * | Tresor aufgesperrt / versiegelt     | [Feedback.Confirm] | ein Vorgang mit Wartezeit endet                    |
 * | Passphrase falsch                   | [Feedback.Reject]  | die einzige Fehlermeldung, die man ertasten kann   |
 * | Tresor zugesperrt                   | [Feedback.Detent]  | Zustandswechsel ohne Ergebnis                      |
 * | Schalter an / aus                   | [Feedback.Toggle]  | zwei Richtungen, zwei Signale                      |
 * | Seitenwechsel, Auswahl im Popover   | [Feedback.Detent]  | eine Rastung — dieselbe Metapher wie das Zahnrad   |
 * | „Alles loeschen" scharf gestellt    | [Feedback.Warn]    | die Schaerfung ist der eigentliche Moment          |
 * | „Alles loeschen" ausgefuehrt        | [Feedback.Reject]  | unwiderruflich; das darf sich nicht wie ein OK     |
 * |                                     |                    | anfuehlen                                          |
 *
 * ── Warum ueber die Konstanten der Plattform ──────────────────────────────
 * `View.performHapticFeedback` bittet das SYSTEM um eine benannte Wirkung, und
 * das Geraet entscheidet, wie sie klingt — ein S24 hat einen anderen Motor als
 * ein Billiggeraet. Der Weg ueber `Vibrator` mit eigenen Millisekunden waere
 * das Gegenteil: eine Zahl, die auf genau einem Geraet passt.
 *
 * Vor allem aber: **Dieser Weg gehorcht der Systemeinstellung.** Wer die
 * Vibrations-Rueckmeldung abgeschaltet hat, spuert nichts — ohne dass diese
 * App die Einstellung lesen muesste. Das Flag, mit dem man sie uebergehen
 * koennte (`FLAG_IGNORE_GLOBAL_SETTING`), kommt hier nicht vor; es ist das
 * haptische Gegenstueck zum Ignorieren von `prefers-reduced-motion`.
 *
 * ── Die API-Stufen, und warum die Pruefung nicht dem Absturz dient ────────
 * Die feinen Wirkungen sind jung: `CONFIRM`/`REJECT` gibt es ab API 30,
 * `TOGGLE_ON`/`TOGGLE_OFF` und `SEGMENT_TICK` ab 34. minSdk ist 26. Die
 * Konstanten sind `static final int` und werden beim Kompilieren als Zahl
 * eingesetzt — ein altes Geraet stuerzt daran also NICHT ab, es kennt die Zahl
 * nur nicht und tut dann gar nichts. Genau deshalb steht hier eine Abfrage:
 * Nicht um einen Absturz zu verhindern, sondern damit auf Android 8 bis 13
 * ueberhaupt etwas zu spueren ist. Der Rueckfall ist immer die naechstbeste
 * Wirkung, die es seit Jahren gibt.
 */
enum class Feedback {
    /** Eine Rastung — Seitenwechsel, Auswahl, Zusperren. */
    Detent,

    /** Ein Schalter geht AN. */
    Toggle,

    /** Ein Schalter geht AUS. */
    Untoggle,

    /** Ein Vorgang ist gelungen. */
    Confirm,

    /** Ein Vorgang ist misslungen — oder war unwiderruflich. */
    Reject,

    /** Etwas ist scharf gestellt und wartet auf die Bestaetigung. */
    Warn,
}

/**
 * Die Konstante der Plattform samt Rueckfall.
 *
 * `CLOCK_TICK` als Rueckfall der Rastung ist kein Notnagel, sondern die aeltere
 * Fassung derselben Sache: Es ist die Wirkung, die Android seit API 21 fuer das
 * Weiterrasten eines Waehlers benutzt.
 */
private fun Feedback.constant(): Int = when (this) {
    Feedback.Detent -> if (Build.VERSION.SDK_INT >= 34) {
        HapticFeedbackConstants.SEGMENT_TICK
    } else {
        HapticFeedbackConstants.CLOCK_TICK
    }

    Feedback.Toggle -> if (Build.VERSION.SDK_INT >= 34) {
        HapticFeedbackConstants.TOGGLE_ON
    } else {
        HapticFeedbackConstants.CLOCK_TICK
    }

    Feedback.Untoggle -> if (Build.VERSION.SDK_INT >= 34) {
        HapticFeedbackConstants.TOGGLE_OFF
    } else {
        HapticFeedbackConstants.CLOCK_TICK
    }

    Feedback.Confirm -> if (Build.VERSION.SDK_INT >= 30) {
        HapticFeedbackConstants.CONFIRM
    } else {
        // KEYBOARD_TAP ist der kurze, unaufgeregte Stoss der Plattform. Kein
        // LONG_PRESS: Das ist der schwerste Stoss, den es gibt, und eine
        // gelungene Handlung ist keine Warnung.
        HapticFeedbackConstants.KEYBOARD_TAP
    }

    Feedback.Reject -> if (Build.VERSION.SDK_INT >= 30) {
        HapticFeedbackConstants.REJECT
    } else {
        HapticFeedbackConstants.LONG_PRESS
    }

    Feedback.Warn -> if (Build.VERSION.SDK_INT >= 34) {
        // Die Wirkung, mit der die Plattform das Erreichen einer Schwelle
        // meldet — genau das ist eine Schaerfung.
        HapticFeedbackConstants.GESTURE_THRESHOLD_ACTIVATE
    } else {
        HapticFeedbackConstants.LONG_PRESS
    }
}

/**
 * Der Griff, den die Oberflaeche benutzt.
 *
 * Er haengt an der `View` und nicht an Compose' `LocalHapticFeedback`, weil
 * dessen Wirkungs-Auswahl je Compose-Fassung eine andere Teilmenge der
 * Plattform-Konstanten abbildet. Die Zuordnung oben soll hier stehen und
 * nachlesbar sein — sie ist eine Design-Entscheidung, keine Bibliotheksfrage.
 */
@Composable
fun rememberFeedback(): (Feedback) -> Unit {
    val view = LocalView.current
    return remember(view) {
        { kind: Feedback -> view.performHapticFeedback(kind.constant()) }
    }
}
