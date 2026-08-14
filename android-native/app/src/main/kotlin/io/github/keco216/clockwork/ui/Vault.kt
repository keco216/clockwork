package io.github.keco216.clockwork.ui

import android.content.Context
import android.os.SystemClock
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.foundation.text.BasicText
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import io.github.keco216.clockwork.core.IdleWindow
import io.github.keco216.clockwork.core.PBKDF2_ITERATIONS
import io.github.keco216.clockwork.core.VaultEnvelope
import io.github.keco216.clockwork.core.VaultError
import io.github.keco216.clockwork.core.VaultKey
import io.github.keco216.clockwork.core.newVaultKey
import io.github.keco216.clockwork.core.openVaultWithKey
import io.github.keco216.clockwork.core.sealVaultWithKey
import io.github.keco216.clockwork.store.BiometricWrapStore
import io.github.keco216.clockwork.store.LockSettings
import io.github.keco216.clockwork.store.LockSettingsStore
import io.github.keco216.clockwork.store.UnwrapResult
import io.github.keco216.clockwork.store.VaultKeystore
import io.github.keco216.clockwork.store.VaultStore
import io.github.keco216.clockwork.store.WrapResult
import io.github.keco216.clockwork.store.unwrapVaultKey
import io.github.keco216.clockwork.store.wrapVaultKey
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.TextStyles
import androidx.fragment.app.FragmentActivity
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Der Tresor — Port von `src/ui/vault-panel.ts`.
 *
 * ── Was hier NICHT passiert ───────────────────────────────────────────────
 * Die Passphrase wird nirgends abgelegt. Sie kommt aus dem Feld, wird einmal
 * zu einem Schluessel abgeleitet und ist danach vergessen; das Feld wird nach
 * jedem Vorgang geleert. Was die Sitzung ueberlebt, ist der abgeleitete
 * SCHLUESSEL (siehe `core/VaultKey`) — und der ueberlebt nur, solange der
 * Tresor offen ist.
 *
 * Das ist der eine Punkt, an dem dieser Port die Web-Fassung nicht abschreibt,
 * sondern verbessert. Die Begruendung steht bei [VaultKey].
 *
 * ── Warum es ueberhaupt eine Zeitschaltung gibt ───────────────────────────
 * Ein offener Tresor ist ein Fenster: Wer an das Geraet kommt, sieht alle
 * Codes. Die Zeitschaltung begrenzt das Fenster auf die Zeit, in der man
 * wirklich davorsitzt.
 */

/** Die drei Zustaende aus `vault-panel.ts`. */
enum class VaultState { Off, Locked, Open }

/**
 * Eine Meldung als SCHLUESSEL, nicht als fertiger Satz.
 *
 * Der Grund ist der Sprachwechsel: Ein gespeicherter Satz stuende nach dem
 * Umschalten als einzige Stelle der App noch in der alten Sprache da. Die
 * Web-Fassung loest das, indem sie beim Sprachwechsel neu beschriftet und eine
 * stehen gebliebene Fehlermeldung verwirft; hier loest es sich von selbst,
 * weil der Text erst beim Zeichnen entsteht.
 */
class VaultMessage(
    val key: String,
    val tone: MessageTone = MessageTone.Fault,
    /** Gesetzt, wenn der Schluessel Mehrzahlformen hat. */
    val quantity: Int? = null,
    val args: Map<String, String> = emptyMap(),
)

/**
 * Der Zustand des Tresors und alles, was ihn aendert.
 *
 * Bewusst eine Klasse und keine lose Sammlung von `remember`-Werten: Die
 * Zeitschaltung, die `onStop`-Sperre und die Biometrie greifen alle auf
 * denselben Zustand zu, und zwar auch dann, wenn gerade niemand die Zone
 * ansieht.
 */
@Stable
class VaultController(
    filesDir: File,
    private val scope: CoroutineScope,
    /**
     * Die Uhr der Zeitschaltung — ausdruecklich `elapsedRealtime` und nicht
     * `uptimeMillis`, weil nur sie im Tiefschlaf weiterlaeuft. Als Parameter,
     * damit die Rechnung ohne Geraet pruefbar bleibt (siehe [IdleWindow]).
     */
    now: () -> Long = { SystemClock.elapsedRealtime() },
) {
    private val vaultStore = VaultStore(filesDir)
    private val settingsStore = LockSettingsStore(filesDir)
    private val wrapStore = BiometricWrapStore(filesDir)

    var settings by mutableStateOf(LockSettings())
        private set

    var message by mutableStateOf<VaultMessage?>(null)
        private set

    /** Waehrend der Schluesselableitung — der Knopf ist dann gesperrt. */
    var busy by mutableStateOf(false)
        private set

    /** Zweistufiges Loeschen: Der erste Klick schaerft nur. */
    var wipeArmed by mutableStateOf(false)
        private set

    /**
     * Zaehlt die Fehlversuche beim Aufsperren.
     *
     * Er ist kein Zaehler zum Anzeigen, sondern ein SIGNAL: Die Zone markiert
     * daraufhin die eingetippte Passphrase, damit der naechste Tastendruck sie
     * ersetzt. Die Web-Fassung macht das mit `passField.select()` — man tippt
     * sich in aller Regel nur einmal falsch, und dann will man neu tippen und
     * nicht erst loeschen.
     */
    var failedAttempts by mutableStateOf(0)
        private set

    /** Ob ein Biometrie-Wickel auf der Platte liegt. */
    var hasWrap by mutableStateOf(false)
        private set

    private var envelope by mutableStateOf<VaultEnvelope?>(null)

    /**
     * Der Schluessel der laufenden Sitzung. Nur hier, nur im Arbeitsspeicher,
     * und beim Zusperren mit Nullen ueberschrieben.
     */
    private var sessionKey by mutableStateOf<VaultKey?>(null)

    /**
     * Der zuletzt gemalte Zustand — fuer die Frage, ob ein Anstrich einen
     * WECHSEL malt. Daran haengt, ob der Aufklapper angefasst wird: „Neu
     * speichern" im offenen Panel darf das Panel nicht zuschlagen.
     */
    var paintedState: VaultState? = null

    /**
     * Die Frist selbst. Der Job darunter ist nur der Wecker — die WAHRHEIT
     * steht hier, und sie wird bei jedem Wiedereintritt neu befragt.
     */
    private val idle = IdleWindow(now)

    private var idleJob: Job? = null
    private var wipeJob: Job? = null

    /** Wird bei jeder Komposition frisch gesetzt — sonst zeigt die Lambda auf
     *  ein altes Feld. */
    var readSecrets: () -> String = { "" }
    var writeSecrets: (String) -> Unit = {}

    val state: VaultState
        get() = when {
            sessionKey != null -> VaultState.Open
            envelope == null -> VaultState.Off
            else -> VaultState.Locked
        }

    /** Das Salt des gespeicherten Umschlags — der Wickel haengt daran. */
    private val envelopeSalt: String?
        get() = envelope?.salt

    fun load() {
        envelope = vaultStore.read()
        settings = settingsStore.read()
        hasWrap = wrapStore.read() != null
    }

    /* ── Einstellungen ──────────────────────────────────────────────────── */

    fun setTimeout(timeoutMs: Long) {
        settings = settings.copy(timeoutMs = timeoutMs)
        settingsStore.write(settings)
        resetIdleTimer()
    }

    fun setLockOnHide(value: Boolean) {
        settings = settings.copy(lockOnHide = value)
        settingsStore.write(settings)
    }

    fun setBlockScreenshots(value: Boolean) {
        settings = settings.copy(blockScreenshots = value)
        settingsStore.write(settings)
    }

    /* ── Die Vorgaenge ──────────────────────────────────────────────────── */

    /**
     * Versiegelt zum ersten Mal — mit frischem Salt.
     *
     * Der Weg aus dem Zustand „aus". Ein Passphrasenwechsel gibt es bewusst
     * nicht: Die Web-Fassung versteckt das Formular, sobald der Tresor offen
     * ist, und dieselbe Beschraenkung gilt hier. Wer die Passphrase wechseln
     * will, loescht und legt neu an — dann stimmt auch der Biometrie-Wickel,
     * statt still zu einem Schluessel zu gehoeren, den es nicht mehr gibt.
     */
    fun seal(passphrase: String) {
        val secrets = readSecrets().trim()
        if (secrets.isEmpty()) {
            message = VaultMessage("vault.error.nothingToStore")
            return
        }
        run(passphrase) {
            val key = withContext(Dispatchers.Default) { newVaultKey(passphrase) }
            val sealed = withContext(Dispatchers.Default) { sealVaultWithKey(secrets, key) }
            if (!vaultStore.write(sealed)) {
                key.clear()
                message = VaultMessage("native.vault.error.storageBlocked")
                return@run
            }
            envelope = sealed
            sessionKey = key
            resetIdleTimer()
            message = VaultMessage("vault.msg.sealed", MessageTone.Status)
        }
    }

    /** Sperrt auf. */
    fun unseal(passphrase: String) {
        val stored = envelope
        if (stored == null) {
            message = VaultMessage("vault.error.noVault")
            return
        }
        run(passphrase) {
            val key = withContext(Dispatchers.Default) {
                io.github.keco216.clockwork.core.deriveVaultKey(stored, passphrase)
            }
            val secrets = try {
                openVaultWithKey(stored, key)
            } catch (error: VaultError) {
                key.clear()
                failedAttempts++
                message = VaultMessage(error.key, MessageTone.Fault, args = error.args)
                return@run
            }
            sessionKey = key
            writeSecrets(secrets)
            resetIdleTimer()
            message = VaultMessage("vault.msg.unsealed", MessageTone.Status)
        }
    }

    /**
     * „Neu speichern" — derselbe Schluessel, neuer Inhalt, frischer IV.
     *
     * Hier wird NICHT neu abgeleitet: Der Schluessel der Sitzung ist derselbe,
     * und 600.000 Iterationen fuer nichts liessen den Knopf eine halbe Sekunde
     * haengen.
     */
    fun update() {
        val key = sessionKey ?: return
        val secrets = readSecrets().trim()
        if (secrets.isEmpty()) {
            message = VaultMessage("vault.error.nothingToStore")
            return
        }
        val sealed = sealVaultWithKey(secrets, key)
        if (!vaultStore.write(sealed)) {
            message = VaultMessage("native.vault.error.storageBlocked")
            return
        }
        envelope = sealed
        resetIdleTimer()
        message = VaultMessage("vault.msg.resealed", MessageTone.Status)
    }

    /**
     * Sperrt zu.
     *
     * Der wichtigste Schritt ist der letzte: Der Klartext verschwindet aus dem
     * Textfeld. Ein zugesperrter Tresor, dessen Inhalt noch im Feld steht,
     * waere ein Schloss an einer offenen Tuer.
     */
    fun lock(reason: VaultMessage? = null) {
        val key = sessionKey ?: return
        key.clear()
        sessionKey = null
        idle.stop()
        idleJob?.cancel()
        idleJob = null
        writeSecrets("")
        message = reason ?: VaultMessage("vault.msg.locked", MessageTone.Status)
    }

    /** Sperrt zu, wenn die App verlassen wird — `onStop`. */
    fun onStopped() {
        if (settings.lockOnHide) {
            lock(VaultMessage("native.vault.locked.hidden", MessageTone.Status))
        }
    }

    /**
     * Loescht alles — Umschlag, Wickel und Keystore-Schluessel.
     *
     * Zweistufig statt eines Dialogs: Ein Dialog sieht auf jedem System anders
     * aus, der zweite Tipp auf denselben Knopf ist ebenso eindeutig und bleibt
     * im Geraet.
     */
    fun wipe() {
        vaultStore.delete()
        clearWrap()
        sessionKey?.clear()
        sessionKey = null
        envelope = null
        idle.stop()
        idleJob?.cancel()
        idleJob = null
        writeSecrets("")
        message = VaultMessage("vault.msg.wipedNote", MessageTone.Status)
    }

    fun armWipe() {
        wipeArmed = true
        wipeJob?.cancel()
        wipeJob = scope.launch {
            delay(WIPE_ARMED_MS)
            wipeArmed = false
        }
    }

    fun disarmWipe() {
        wipeArmed = false
        wipeJob?.cancel()
        wipeJob = null
    }

    /* ── Biometrie ──────────────────────────────────────────────────────── */

    /**
     * Schaltet die Biometrie ein: wickelt den Schluessel der offenen Sitzung
     * ein.
     *
     * Auch das Einwickeln verlangt eine Freigabe — ein Keystore-Schluessel mit
     * `setUserAuthenticationRequired` ist in beide Richtungen gesperrt. Das ist
     * kein Umstand, sondern die Probe aufs Exempel: Wer die Biometrie
     * einschaltet, sieht sofort, ob sie funktioniert.
     */
    fun enableBiometric(activity: FragmentActivity, title: String, negative: String) {
        val key = sessionKey ?: return
        val salt = envelopeSalt ?: return
        scope.launch {
            when (wrapVaultKey(activity, wrapStore, key, salt, title, negative)) {
                WrapResult.Ok -> {
                    hasWrap = true
                    settings = settings.copy(biometric = true)
                    settingsStore.write(settings)
                    message = null
                }

                WrapResult.Cancelled -> Unit
                WrapResult.Invalidated -> {
                    clearWrap()
                    message = VaultMessage("native.vault.biometric.invalidated")
                }

                WrapResult.Failed -> {
                    clearWrap()
                    message = VaultMessage("native.vault.biometric.failed")
                }
            }
        }
    }

    fun disableBiometric() {
        clearWrap()
        message = null
    }

    /** Sperrt per Biometrie auf — der Weg ohne Passphrase. */
    fun unsealBiometric(activity: FragmentActivity, title: String, negative: String) {
        val stored = envelope ?: return
        scope.launch {
            val outcome = unwrapVaultKey(
                activity,
                wrapStore,
                stored.salt,
                stored.iterations,
                title,
                negative,
            )
            when (outcome) {
                is UnwrapResult.Ok -> {
                    val secrets = try {
                        openVaultWithKey(stored, outcome.key)
                    } catch (_: VaultError) {
                        // Der Wickel passt zum Salt, oeffnet den Umschlag aber
                        // nicht — dann gehoert er zu einem aelteren Stand und
                        // ist Muell. Weg damit, der Passphrasenweg bleibt.
                        outcome.key.clear()
                        clearWrap()
                        message = VaultMessage("native.vault.biometric.invalidated")
                        return@launch
                    }
                    sessionKey = outcome.key
                    writeSecrets(secrets)
                    resetIdleTimer()
                    message = VaultMessage("vault.msg.unsealed", MessageTone.Status)
                }

                UnwrapResult.Cancelled -> Unit
                UnwrapResult.Invalidated -> {
                    clearWrap()
                    message = VaultMessage("native.vault.biometric.invalidated")
                }

                UnwrapResult.Missing -> {
                    clearWrap()
                    message = VaultMessage("native.vault.biometric.failed")
                }

                UnwrapResult.Failed -> message = VaultMessage("native.vault.biometric.failed")
            }
        }
    }

    private fun clearWrap() {
        wrapStore.delete()
        VaultKeystore.deleteKey()
        hasWrap = false
        if (settings.biometric) {
            settings = settings.copy(biometric = false)
            settingsStore.write(settings)
        }
    }

    /* ── Zeitschaltung ──────────────────────────────────────────────────── */

    /**
     * Setzt die Frist zurueck.
     *
     * Im Web haengt das an `pointerdown`, `keydown` und `focusin` am Dokument.
     * Nativ gibt es kein Dokument; die Entsprechung sind Zeigerereignisse an
     * der Wurzel der Komposition (in der INITIAL-Phase, also bevor ein Kind sie
     * verbraucht — das Gegenstueck zum Mitschneiden im Web) und jede Aenderung
     * des Textfelds. Auf einem Telefon geht ohne das eine oder das andere
     * nichts.
     */
    fun resetIdleTimer() {
        idleJob?.cancel()
        idleJob = null
        if (sessionKey == null) {
            idle.stop()
            return
        }
        idle.markActive()
        idleJob = scope.launch {
            /* Der Wecker klingelt, die Uhr entscheidet.

               Bis N19 stand hier ein einzelnes `delay(timeoutMs)`, und damit
               hing die Frist an der monotonen Uhr der Coroutine — die steht
               im Tiefschlaf still. Jetzt wird nach JEDEM Klingeln neu
               gerechnet: Ist die Realzeit-Frist noch nicht um, wird die
               Restzeit weitergeschlafen. Ist sie um, wird gesperrt.

               Die Schleife laeuft damit hoechstens ein zweites Mal und kann
               nicht haengen: `remainingMs` wird nur dann > 0, wenn wirklich
               noch Zeit uebrig ist, und `delay` bringt sie herunter. */
            while (idle.remainingMs(settings.timeoutMs) > 0L) {
                delay(idle.remainingMs(settings.timeoutMs))
            }
            lockIdle()
        }
    }

    /**
     * Prueft beim Wiedereintritt, ob die Frist waehrend der Abwesenheit
     * abgelaufen ist — `onStart`.
     *
     * Das ist der eigentliche Fix aus N19, und er sitzt hier und nicht im
     * Wecker: Wer das Geraet drei Stunden liegen laesst, kommt zurueck, BEVOR
     * ein monotoner Wecker die drei Stunden mitbekommen hat. Gesperrt wird
     * deshalb, bevor wieder jemand etwas SIEHT — `onStart` liegt vor dem
     * ersten Bild.
     *
     * Kein `AlarmManager` und keine neue Berechtigung: Es muss nicht im
     * Hintergrund gesperrt werden. Solange niemand hinsieht, schadet ein
     * offener Tresor im Arbeitsspeicher nicht mehr als der Schluessel, der
     * ohnehin darin liegt — und der Bildschirmschutz haengt an FLAG_SECURE,
     * nicht an dieser Frist.
     */
    fun onStarted() {
        if (sessionKey == null) return
        if (idle.isExpired(settings.timeoutMs)) lockIdle()
    }

    /** Zusperren mit der Meldung der Zeitschaltung — an zwei Stellen gebraucht. */
    private fun lockIdle() {
        val minutes = settings.timeoutMs / 60_000L
        lock(
            VaultMessage(
                "vault.locked.idle",
                MessageTone.Status,
                quantity = minutes.toInt(),
                args = mapOf("n" to minutes.toString()),
            ),
        )
    }

    fun clearMessage() {
        message = null
    }

    /**
     * Der gemeinsame Rahmen fuer die zwei Vorgaenge mit Schluesselableitung.
     *
     * Er sperrt den Knopf, faengt jeden Tresor-Fehler ab und gibt den Knopf am
     * Ende wieder frei — auch dann, wenn etwas schiefging.
     */
    private fun run(passphrase: String, block: suspend () -> Unit) {
        if (passphrase.isEmpty()) {
            message = VaultMessage("vault.error.noPassphrase")
            return
        }
        if (busy) return
        busy = true
        message = null
        scope.launch {
            try {
                block()
            } catch (error: VaultError) {
                message = VaultMessage(error.key, MessageTone.Fault, args = error.args)
            } finally {
                busy = false
            }
        }
    }

    private companion object {
        /** So lange bleibt „Wirklich loeschen?" scharf — wie im Web. */
        const val WIPE_ARMED_MS = 4_000L
    }
}

/* ── Die Zone ───────────────────────────────────────────────────────────── */

/**
 * Die Tresor-Zone: eine Fold-Zeile mit der Statuszeile, alles Weitere
 * dahinter.
 *
 * Die Statuszeile ist die Zusammenfassung und damit IMMER sichtbar: Ob etwas
 * gespeichert ist, muss man ablesen koennen, ohne etwas zu oeffnen. Alles,
 * womit man etwas TUT, liegt hinter dem Aufklapper.
 */
@Composable
fun VaultZone(
    controller: VaultController,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalColors.current
    val context = LocalContext.current
    val activity = context.findActivity()

    // `TextFieldValue` und nicht `String`: Nur damit laesst sich der Text
    // MARKIEREN, und genau das passiert nach einem Fehlversuch.
    var passphrase by remember { mutableStateOf(TextFieldValue("")) }
    val state = controller.state
    val feedback = rememberFeedback()

    LaunchedEffect(controller.failedAttempts) {
        if (controller.failedAttempts > 0) {
            passphrase = passphrase.copy(selection = TextRange(0, passphrase.text.length))
            /* Die einzige Fehlermeldung dieser App, die man ertasten kann — und
               die haeufigste ueberhaupt. Wer eine Passphrase eintippt, sieht
               dabei auf die Tastatur; die Markierung im Feld bemerkt er
               vielleicht erst beim naechsten Zeichen (N15/3). */
            feedback(Feedback.Reject)
        }
    }

    /* ── Die paintedState-Logik aus vault-panel.ts ───────────────────────
       Ein GESPERRTER Tresor oeffnet den Aufklapper von selbst — und zwar der
       wichtigste Fall ueberhaupt: Beim Start ist das Textfeld leer, weil der
       Inhalt hier drin liegt. Laege das Passphrasenfeld dann hinter einem
       Tipp, muesste man erst suchen, wo die eigenen Codes geblieben sind.

       Nach dem Auf- ODER Zusperren faellt er zu: „Offen" heisst, die Codes
       stehen laengst im Feld — der Tresor ist erledigt. Nur beim WECHSEL,
       nicht bei jedem Anstrich: Wer im offenen Panel „Neu speichern" tippt,
       dem darf nichts unter der Hand zuklappen. */
    LaunchedEffect(state) {
        if (controller.paintedState != state) {
            val vorher = controller.paintedState
            controller.paintedState = state
            passphrase = TextFieldValue("")
            when (state) {
                VaultState.Locked -> onExpandedChange(true)
                VaultState.Open -> onExpandedChange(false)
                VaultState.Off -> Unit
            }

            /* Haptik nur bei einem WECHSEL, und der erste Anstrich ist keiner:
               Beim Start steht `paintedState` auf `null`, und ein gesperrter
               Tresor, der schon gesperrt WAR, hat nichts quittiert. */
            if (vorher != null) {
                when (state) {
                    // Aufsperren und Versiegeln enden beide hier — und beide
                    // haben eine Wartezeit (PBKDF2). Genau dafuer gibt es
                    // CONFIRM: Der Vorgang ist durch.
                    VaultState.Open -> feedback(Feedback.Confirm)
                    // Zusperren ist ein Zustandswechsel ohne Ergebnis: eine
                    // Rastung, kein Erfolg.
                    VaultState.Locked -> feedback(Feedback.Detent)
                    VaultState.Off -> Unit
                }
            }
        }
    }

    val stateLabel = when {
        controller.busy -> text("vault.action.deriving")
        state == VaultState.Off -> text("vault.state.off")
        state == VaultState.Locked -> text("vault.state.locked")
        else -> text("vault.state.open")
    }

    /* ── Die drei Zustaende in FORM und Farbe (N15) ────────────────────────
       Bis N14 war die Leuchte immer gefuellt und trug nur zwei Toene: Akzent
       fuer „offen", Tinte fuer alles andere. Der AUSGESCHALTETE Tresor sah
       damit genauso aus wie der gesperrte — von den drei Zustaenden waren zwei
       nicht zu unterscheiden, und der Unterschied ist der wichtigste der App
       („liegt hier etwas gespeichert?").

       Die Web-Fassung macht es anders und begruendet es in `panels.css`: „Aus =
       leerer Ring, gesperrt = gefuellt in Ink, offen = gefuellt im Akzent. Nie
       NUR ueber Farbe: Ring gegen Flaeche ist ein Formunterschied, und der
       bleibt auch fuer jemanden lesbar, der die beiden Toene nicht
       unterscheiden kann." Dazu faerbt dort die Zustandszeile mit — „die Leiter
       geht mit dem Gewicht der Auskunft".

       Beides steht jetzt hier. Es ist kein neuer Ton und kein neues Mass: alle
       drei Farben und beide Formen kommen aus der Web-Fassung. */
    val lampColour = when (state) {
        VaultState.Off -> colors.ink3
        VaultState.Locked -> colors.ink
        VaultState.Open -> colors.signalText
    }

    Panel(modifier = modifier, padding = FoldPanelPadding) {
        Column {
            FoldRow(
                label = stateLabel,
                expanded = expanded,
                onToggle = { onExpandedChange(!expanded) },
                lamp = lampColour,
                lampFilled = state != VaultState.Off,
                labelColour = lampColour,
            )

            Drawer(open = expanded) {
                Column(
                    // Wie in der Eingabe-Schublade: eigene Fuge zur
                    // Unterkante, weil die Karte nur noch --sp-2 traegt.
                    modifier = Modifier.padding(top = Dimens.gapPair, bottom = Dimens.gapPair),
                    verticalArrangement = Arrangement.spacedBy(Dimens.gapStack),
                ) {
                    // Die Erklaerung gilt nur, solange der Tresor AUS ist —
                    // danach hat der Nutzer die Entscheidung getroffen.
                    if (state == VaultState.Off) {
                        Column(verticalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
                            BasicText(
                                text = text("vault.explain"),
                                style = TextStyles.micro.copy(color = colors.ink2),
                            )
                            BasicText(
                                text = text(
                                    "vault.explain.crypto",
                                    mapOf("iterations" to formatNumber(PBKDF2_ITERATIONS.toLong())),
                                ),
                                style = TextStyles.micro.copy(color = colors.ink3),
                            )
                        }
                    }

                    if (state != VaultState.Open) {
                        PassphraseForm(
                            passphrase = passphrase,
                            onPassphraseChange = { passphrase = it },
                            state = state,
                            busy = controller.busy,
                            onSubmit = {
                                // Die Passphrase bleibt im Feld, bis der
                                // Vorgang durch ist: Beim Aufsperren markiert
                                // sie ein Fehlversuch, beim Versiegeln raeumt
                                // sie der Zustandswechsel weg. Sie hier sofort
                                // zu loeschen hiesse, dem Nutzer nach einem
                                // Tippfehler nichts mehr zu zeigen.
                                if (state == VaultState.Off) {
                                    controller.seal(passphrase.text)
                                } else {
                                    controller.unseal(passphrase.text)
                                }
                            },
                        )

                        // Der Biometrie-Weg steht nur da, wenn es wirklich
                        // einen Wickel gibt — ein Knopf, der beim Antippen
                        // „geht nicht" sagt, ist keiner.
                        if (state == VaultState.Locked && controller.hasWrap && activity != null) {
                            val title = text("native.vault.biometric.label")
                            val negative = text("native.vault.biometric.cancel")
                            Key(
                                label = title,
                                onClick = {
                                    controller.unsealBiometric(activity, title, negative)
                                },
                                modifier = Modifier.fillMaxWidth(),
                                variant = KeyVariant.Default,
                            )
                        }
                    }

                    /* Nur die KERNAKTIONEN stehen hier. Zeitschaltung,
                       Biometrie-Schalter, Bildschirmfoto-Sperre und das
                       Loeschen sind seit N11 auf der Einstellungen-Seite:
                       Sie werden konfiguriert, nicht bedient. Was der
                       Arbeitsfluss braucht — aufsperren, zusperren, neu
                       speichern — bleibt vorn. */
                    VaultActions(controller = controller, state = state)
                }
            }

            // AUSSERHALB der Schublade: Eine Live-Region muss im Baum sein,
            // bevor Text hineinkommt — und eine Sperrmeldung soll auch dann
            // ankommen, wenn der Aufklapper zu ist.
            val note = controller.message
            MessageRow(
                text = if (note == null) {
                    ""
                } else if (note.quantity != null) {
                    textPlural(note.key, note.quantity, note.args)
                } else {
                    text(note.key, note.args)
                },
                tone = note?.tone ?: MessageTone.Status,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

/** Passphrasenfeld und die eine Haupthandlung des Panels. */
@Composable
private fun PassphraseForm(
    passphrase: TextFieldValue,
    onPassphraseChange: (TextFieldValue) -> Unit,
    state: VaultState,
    busy: Boolean,
    onSubmit: () -> Unit,
) {
    val colors = LocalColors.current
    val interaction = remember { MutableInteractionSource() }
    val label = if (state == VaultState.Off) {
        text("vault.pass.new")
    } else {
        text("vault.pass.existing")
    }

    /* ── Gestapelt, nicht nebeneinander (N14) ─────────────────────────────
       Bis N13 standen Feld und Taste in EINER Zeile. Auf dem S24 war das
       Ergebnis ein gestauchtes Feld neben einer breiten Taste — Kevins
       Befund, und er gilt fuer beide Zustaende („Neue Passphrase" wie
       „Aufsperren").

       Die Web-Fassung macht es mobil anders, und danach richtet sich diese
       App: Beschriftung, Feld in VOLLER Breite, Haupthandlung in voller
       Breite darunter. Der Grund ist nicht Geschmack, sondern die
       Zeichenzahl — eine Passphrase ist laenger als ein Tastenwort, und ein
       Feld, das die Haelfte davon zeigt, laesst einen Tippfehler nicht
       finden.

       Die Taste traegt `--control-h-lg` (44 dp) statt der normalen 40: Sie
       ist die EINE Haupthandlung dieses Panels, und die Web-Fassung gibt der
       Haupthandlung eine eigene Sprosse der Hoehenleiter. */
    Column(verticalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
        BasicText(text = label, style = TextStyles.micro.copy(color = colors.ink3))

        BasicTextField(
            value = passphrase,
            onValueChange = onPassphraseChange,
            singleLine = true,
            // `PasswordVisualTransformation` und Keyboard-Typ Passwort:
            // Damit bietet die Tastatur keine Vorschlaege an und traegt
            // die Passphrase nicht in ihr eigenes Woerterbuch ein.
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Go,
            ),
            keyboardActions = KeyboardActions(onGo = { onSubmit() }),
            textStyle = TextStyles.body.copy(color = colors.ink),
            cursorBrush = SolidColor(colors.signal),
            interactionSource = interaction,
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = Dimens.controlH)
                .clip(RoundedCornerShape(Dimens.radiusField))
                .background(fieldFill(interaction))
                .padding(horizontal = Dimens.sp3, vertical = Dimens.sp2)
                .semantics { contentDescription = label },
        )

        Key(
            label = if (state == VaultState.Off) {
                text("vault.action.seal")
            } else {
                text("vault.action.unseal")
            },
            onClick = onSubmit,
            variant = KeyVariant.Primary,
            enabled = !busy,
            large = true,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

/**
 * Zusperren und neu speichern.
 *
 * „Alles loeschen" stand hier bis N11 daneben — als dritte Taste in derselben
 * Zeile, in der man zusperrt. Es steht jetzt als [VaultDanger] auf der
 * Einstellungen-Seite, raeumlich abgesetzt: Eine Taste, die alles
 * unwiderruflich wegnimmt, gehoert nicht neben die, die man staendig
 * benutzt.
 */
@Composable
private fun VaultActions(controller: VaultController, state: VaultState) {
    if (state != VaultState.Open) return

    Row(horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
        Key(
            label = text("vault.action.lock"),
            onClick = { controller.lock() },
            modifier = Modifier.weight(1f),
        )
        Key(
            label = text("vault.action.update"),
            onClick = { controller.update() },
            modifier = Modifier.weight(1f),
        )
    }
}

/**
 * Die Gefahrenzone: alles loeschen, zweistufig.
 *
 * Zweistufig heisst hier woertlich, was es im Web heisst: Der erste Tipp
 * SCHAERFT nur und beschriftet die Taste um, der zweite loescht. Wer den
 * zweiten nicht tippt, hat nichts verloren — die Schaerfung faellt nach
 * kurzer Zeit von selbst zurueck.
 */
@Composable
fun VaultDanger(controller: VaultController, state: VaultState) {
    if (state == VaultState.Off) return

    val feedback = rememberFeedback()

    Key(
        label = if (controller.wipeArmed) {
            text("vault.action.wipeConfirm")
        } else {
            text("vault.action.wipe")
        },
        onClick = {
            if (controller.wipeArmed) {
                controller.disarmWipe()
                controller.wipe()
                /* Ein Loeschen quittiert mit ABLEHNUNG und nicht mit
                   Bestaetigung. Das ist kein Wortspiel: Die beiden Wirkungen
                   der Plattform fuehlen sich verschieden an, und was
                   unwiderruflich ist, darf sich nicht anfuehlen wie ein
                   gelungener Vorgang. */
                feedback(Feedback.Reject)
            } else {
                // Die SCHAERFUNG ist der eigentliche Moment — danach genuegt
                // ein zweiter Tipp. Wer sie nur mit dem Auge bemerkt, hat sie
                // vielleicht nicht bemerkt.
                controller.armWipe()
                feedback(Feedback.Warn)
            }
        },
        modifier = Modifier.fillMaxWidth(),
        variant = KeyVariant.Danger,
    )
}

/**
 * Sperrzeit, Sperren beim Verlassen, Biometrie, Bildschirmfotos — als
 * Listenzeilen (N15).
 *
 * Keine Fuge zwischen den Zeilen und kein `spacedBy`: Eine Zeile bringt ihre
 * 44 dp und ihr senkrechtes Polster selbst mit, und getrennt werden sie durch
 * die Haarlinie. Ein zusaetzlicher Abstand machte aus der Liste wieder einen
 * Stapel Kaesten.
 */
@Composable
fun VaultSettings(
    controller: VaultController,
    state: VaultState,
    activity: FragmentActivity?,
) {
    val context = LocalContext.current
    val settings = controller.settings

    // Die Auswahl braucht die drei Beschriftungen ueber die Mehrzahlregeln —
    // „1 Minute", „5 Minuten", auf Polnisch „5 minutach".
    //
    // Die Sprache wird HIER gelesen und nicht in der Lambda: `LocalConfiguration`
    // ist die beobachtbare Quelle, `context.resources.configuration` nicht —
    // dieselbe Falle wie in Text.kt, und dort steht die Begruendung
    // ausfuehrlich. Eine Lambda, die den Kontext erst beim Aufruf befragt,
    // haette den Sprachwechsel gar nicht mitbekommen.
    val locale = LocalConfiguration.current.locales[0]
    val choices = LockSettings.TIMEOUT_CHOICES
    val minutes: (Long) -> String = { ms ->
        context.textPlural(
            "vault.timeout.minutes",
            (ms / 60_000L).toInt(),
            mapOf("n" to formatNumber(ms / 60_000L, locale)),
        )
    }

    Column {
        Pick(
            label = text("vault.timeout.label"),
            aria = text("vault.timeout.label"),
            options = choices,
            selected = choices.firstOrNull { it == settings.timeoutMs },
            display = minutes,
            onPick = { controller.setTimeout(it) },
            style = PickStyle.Row,
        )

        RowDivider()

        Switch(
            checked = settings.lockOnHide,
            onCheckedChange = { controller.setLockOnHide(it) },
            label = text("native.vault.lockOnHide"),
        )

        // Der Biometrie-Schalter steht nur im OFFENEN Tresor: Nur dort gibt es
        // den abgeleiteten Schluessel, den er einwickeln soll. Im gesperrten
        // Zustand steht stattdessen der Knopf weiter oben.
        if (state == VaultState.Open && activity != null) {
            val available = remember { VaultKeystore.isAvailable(context) }
            val title = text("native.vault.biometric.label")
            val negative = text("native.vault.biometric.cancel")

            RowDivider()

            Switch(
                checked = settings.biometric,
                onCheckedChange = { on ->
                    if (on) {
                        controller.enableBiometric(activity, title, negative)
                    } else {
                        controller.disableBiometric()
                    }
                },
                label = title,
                enabled = available,
                description = if (available) {
                    text("native.vault.biometric.note")
                } else {
                    text("native.vault.biometric.unavailable")
                },
            )
        }

        RowDivider()

        Switch(
            checked = settings.blockScreenshots,
            onCheckedChange = { controller.setBlockScreenshots(it) },
            label = text("native.vault.screenshots.label"),
        )
    }
}

/**
 * Die Activity hinter einem Context.
 *
 * `BiometricPrompt` braucht eine `FragmentActivity` — es haengt sein Fragment
 * in deren Manager. Compose reicht nur einen Context herein, und der ist unter
 * Umstaenden in mehrere `ContextWrapper` verpackt.
 */
internal tailrec fun Context.findActivity(): FragmentActivity? = when (this) {
    is FragmentActivity -> this
    is android.content.ContextWrapper -> baseContext.findActivity()
    else -> null
}
