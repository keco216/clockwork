package io.github.keco216.clockwork.store

import android.content.Context
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.KeyProperties
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import io.github.keco216.clockwork.core.Json
import io.github.keco216.clockwork.core.VaultKey
import io.github.keco216.clockwork.core.text
import java.io.File
import java.io.IOException
import java.security.GeneralSecurityException
import java.security.KeyStore
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine

/**
 * Die Biometrie — ein KOMFORTWEG, niemals ein Ersatz.
 *
 * ── Was hier eingewickelt wird, und was nicht ─────────────────────────────
 * Eingewickelt wird der ABGELEITETE Schluessel (32 Byte), niemals die
 * Passphrase. Der Unterschied ist der ganze Punkt: Der abgeleitete Schluessel
 * oeffnet genau diesen einen Umschlag. Die Passphrase oeffnet ihn auch — und
 * mit einiger Wahrscheinlichkeit noch anderes, denn Menschen benutzen
 * Passphrasen mehrfach. Was in einem Keystore liegt, soll das kleinere von
 * beidem sein.
 *
 * ── Die Passphrase bleibt der einzige Wiederherstellungsweg ───────────────
 * Der Wickel kann jederzeit wertlos werden — neue Biometrie registriert,
 * Bildschirmsperre entfernt, App deinstalliert, Geraet gewechselt. In all
 * diesen Faellen ist der Tresor NICHT verloren: Er haengt am Umschlag und an
 * der Passphrase, und der Wickel ist nur eine Abkuerzung dorthin. Genau
 * deshalb steht neben dem Schalter ein Satz, der das sagt
 * (`native.vault.biometric.note`) — eine Abkuerzung, die man fuer den einzigen
 * Weg haelt, ist eine Falle.
 *
 * ── Warum `setInvalidatedByBiometricEnrollment(true)` ─────────────────────
 * Ohne diese Zeile bliebe der Wickel gueltig, wenn jemand einen NEUEN
 * Fingerabdruck registriert. Wer kurz Zugriff auf ein entsperrtes Geraet hat,
 * koennte also seinen eigenen Finger hinzufuegen und damit den Tresor eines
 * anderen oeffnen. Mit der Zeile wird der Keystore-Schluessel in diesem
 * Moment unbrauchbar, und die App faellt auf die Passphrase zurueck.
 *
 * Das ist keine Theorie: Der Fall wird am Emulator einmal wirklich
 * durchgespielt (siehe android-native/docs/abnahme).
 *
 * ── Was NICHT geprueft werden kann und deshalb benannt wird ───────────────
 * Der Android-Keystore existiert im JVM-Unit-Test nicht — jeder Aufruf
 * scheiterte dort an einem Stub, genau wie bei `org.json`. Diese Datei hat
 * deshalb keine Unit-Tests, sondern einen Emulator-Beweis. Testbar gehalten
 * ist, was sich trennen liess: die Wickel-DATEI (unten) laeuft ueber
 * `core/Json.kt` und wird auf der JVM geprueft.
 */

/* ── Die Wickel-Datei ───────────────────────────────────────────────────── */

/**
 * Der eingewickelte Schluessel, wie er auf der Platte liegt.
 *
 * @param salt Das Salt des Umschlags, zu dem dieser Wickel gehoert. Es ist
 *   kein Geheimnis — es steht ohnehin im Klartext in `vault.json`. Es steht
 *   hier, damit ein VERALTETER Wickel auffaellt, bevor er benutzt wird: Wer
 *   den Tresor mit einer neuen Passphrase neu anlegt, bekommt ein neues Salt
 *   und damit einen anderen Schluessel. Ohne diesen Vergleich scheiterte das
 *   Aufsperren wortlos und saehe aus wie ein kaputter Fingerabdrucksensor.
 */
class BiometricWrap(val iv: ByteArray, val data: ByteArray, val salt: String)

/** Liest und schreibt den Wickel — ohne Keystore und damit JVM-testbar. */
class BiometricWrapStore(private val dir: File) {

    private val file = File(dir, "vault-wrap.json")

    fun read(): BiometricWrap? {
        val fields = try {
            if (!file.exists()) return null
            Json.parseObject(file.readText(Charsets.UTF_8))
        } catch (_: IOException) {
            return null
        } catch (_: IllegalArgumentException) {
            return null
        }

        val iv = fields.text("iv") ?: return null
        val data = fields.text("data") ?: return null
        val salt = fields.text("salt") ?: return null
        return try {
            BiometricWrap(
                Base64.getDecoder().decode(iv),
                Base64.getDecoder().decode(data),
                salt,
            )
        } catch (_: IllegalArgumentException) {
            null
        }
    }

    fun write(wrap: BiometricWrap) {
        try {
            dir.mkdirs()
            val encoder = Base64.getEncoder()
            file.writeText(
                Json.writeObject(
                    linkedMapOf(
                        "iv" to Json.Value.Text(encoder.encodeToString(wrap.iv)),
                        "data" to Json.Value.Text(encoder.encodeToString(wrap.data)),
                        "salt" to Json.Value.Text(wrap.salt),
                    ),
                ),
                Charsets.UTF_8,
            )
        } catch (_: IOException) {
            // Ohne Wickel bleibt der Passphrasenweg — kein Datenverlust.
        } catch (_: SecurityException) {
            // dito
        }
    }

    fun delete() {
        file.delete()
    }
}

/* ── Der Keystore-Schluessel ────────────────────────────────────────────── */

/**
 * Was beim Vorbereiten eines Vorgangs herauskommt.
 *
 * Drei Ausgaenge statt eines `Cipher?`, weil die Oberflaeche sie
 * unterscheiden MUSS: „neu registrierte Biometrie" braucht eine Erklaerung,
 * „geht hier nicht" braucht eine andere, und beide sind etwas anderes als ein
 * fertiger Cipher.
 */
sealed class WrapCipher {
    class Ready(val cipher: Cipher) : WrapCipher()

    /** Der Schluessel ist durch eine neue Biometrie-Registrierung ungueltig. */
    data object Invalidated : WrapCipher()

    /** Keystore nicht benutzbar, Schluessel fehlt, Geraet ohne Biometrie. */
    data object Unavailable : WrapCipher()
}

object VaultKeystore {

    private const val PROVIDER = "AndroidKeyStore"
    private const val ALIAS = "clockwork.vault.wrap"
    private const val TRANSFORMATION = "AES/GCM/NoPadding"

    /** 128 Bit Tag — dieselbe Zahl wie im Umschlag, aus demselben Grund. */
    private const val TAG_BITS = 128

    /**
     * Ob das Geraet ueberhaupt starke Biometrie anbietet.
     *
     * Ausdruecklich `BIOMETRIC_STRONG` und nicht `BIOMETRIC_WEAK`: Nur ein
     * starker Sensor darf einen Keystore-Schluessel freigeben — ein schwacher
     * kann gar keinen `CryptoObject` tragen. Waere die Abfrage lockerer als
     * die Anforderung, meldete die App eine Faehigkeit, die beim ersten
     * Antippen scheitert.
     */
    fun isAvailable(context: Context): Boolean =
        BiometricManager.from(context).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) ==
            BiometricManager.BIOMETRIC_SUCCESS

    /**
     * Bereitet das EINWICKELN vor — legt den Schluessel an, falls er fehlt.
     *
     * Auch dieser Weg verlangt eine Freigabe durch den Nutzer: Ein Schluessel
     * mit `setUserAuthenticationRequired(true)` ist in BEIDE Richtungen
     * gesperrt. Das ist kein Umstand, sondern die Probe aufs Exempel — wer
     * die Biometrie einschaltet, sieht sofort, ob sie funktioniert.
     */
    fun encryptCipher(): WrapCipher = try {
        val key = loadKey() ?: createKey()
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, key)
        WrapCipher.Ready(cipher)
    } catch (_: KeyPermanentlyInvalidatedException) {
        // Kann beim Einwickeln passieren, wenn der alte Schluessel noch liegt.
        deleteKey()
        WrapCipher.Invalidated
    } catch (_: GeneralSecurityException) {
        WrapCipher.Unavailable
    } catch (_: IllegalStateException) {
        WrapCipher.Unavailable
    }

    /**
     * Bereitet das AUSWICKELN vor.
     *
     * Hier faellt die neue Biometrie-Registrierung auf: `init` wirft dann
     * `KeyPermanentlyInvalidatedException`. Der Schluessel wird in diesem
     * Moment geloescht — ein Wickel, den niemand mehr oeffnen kann, ist
     * Muell, und Muell mit Schluesselmaterial darin ist der schlechteste.
     */
    fun decryptCipher(iv: ByteArray): WrapCipher = try {
        val key = loadKey() ?: return WrapCipher.Unavailable
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(TAG_BITS, iv))
        WrapCipher.Ready(cipher)
    } catch (_: KeyPermanentlyInvalidatedException) {
        deleteKey()
        WrapCipher.Invalidated
    } catch (_: GeneralSecurityException) {
        WrapCipher.Unavailable
    } catch (_: IllegalStateException) {
        WrapCipher.Unavailable
    }

    fun deleteKey() {
        try {
            keystore()?.deleteEntry(ALIAS)
        } catch (_: GeneralSecurityException) {
            // Was sich nicht loeschen laesst, war entweder nie da oder ist
            // ohnehin unbrauchbar. Beides ist der gewuenschte Endzustand.
        }
    }

    private fun keystore(): KeyStore? = try {
        KeyStore.getInstance(PROVIDER).apply { load(null) }
    } catch (_: GeneralSecurityException) {
        null
    } catch (_: IOException) {
        null
    }

    private fun loadKey(): SecretKey? = keystore()?.getKey(ALIAS, null) as? SecretKey

    private fun createKey(): SecretKey {
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, PROVIDER)
        val spec = KeyGenParameterSpec.Builder(
            ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .setUserAuthenticationRequired(true)
            .setInvalidatedByBiometricEnrollment(true)
            .apply {
                /* Ab API 30 wird die alte Sekunden-Angabe durch ein Paar aus
                   Dauer und erlaubtem Verfahren ersetzt. Dauer 0 heisst „bei
                   JEDER Benutzung neu freigeben" — also genau das, was ein
                   `CryptoObject` leistet. Darunter ist das die Voreinstellung
                   von `setUserAuthenticationRequired(true)`, dort ist also
                   nichts zu sagen.

                   Ausdruecklich BIOMETRIC_STRONG und NICHT
                   `DEVICE_CREDENTIAL`: Die PIN des Geraets ist nicht die
                   Passphrase des Tresors. Wer den Tresor per Geraete-PIN
                   oeffnen koennte, haette ihn an die Bildschirmsperre
                   gehaengt — und damit die Zusage aufgegeben, dass ohne die
                   Passphrase nichts geht. */
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
                }
            }
            .build()
        generator.init(spec)
        return generator.generateKey()
    }
}

/* ── Die Abfrage ────────────────────────────────────────────────────────── */

/** Was eine Abfrage ergeben hat. */
sealed class BiometricOutcome {
    class Ok(val cipher: Cipher) : BiometricOutcome()

    /** Abgebrochen — der Nutzer weiss, was er getan hat. Keine Meldung. */
    data object Cancelled : BiometricOutcome()

    /** Gescheitert: zu viele Versuche, Sensor blockiert, Hardware weg. */
    data object Failed : BiometricOutcome()
}

/**
 * Zeigt die System-Abfrage und gibt den freigeschalteten Cipher zurueck.
 *
 * ── Warum `suspendCancellableCoroutine` ───────────────────────────────────
 * `BiometricPrompt` meldet sich ueber Rueckrufe, die Oberflaeche will ein
 * Ergebnis. Dazwischen liegt genau eine Umsetzung, und die steht hier — statt
 * in jedem Aufrufer noch einmal.
 *
 * `onAuthenticationFailed` beendet NICHTS: Es heisst „dieser Finger war es
 * nicht, versuch es noch mal", und die Abfrage bleibt stehen. Nur Erfolg und
 * Fehler sind Endzustaende, und nur auf sie wird geantwortet — sonst
 * antwortete dieselbe Coroutine mehrfach.
 */
suspend fun askBiometric(
    activity: FragmentActivity,
    cipher: Cipher,
    title: String,
    negative: String,
): BiometricOutcome = suspendCancellableCoroutine { continuation ->
    val prompt = BiometricPrompt(
        activity,
        ContextCompat.getMainExecutor(activity),
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                val unlocked = result.cryptoObject?.cipher
                continuation.resume(
                    if (unlocked == null) BiometricOutcome.Failed else BiometricOutcome.Ok(unlocked),
                )
            }

            override fun onAuthenticationError(code: Int, message: CharSequence) {
                continuation.resume(
                    when (code) {
                        BiometricPrompt.ERROR_NEGATIVE_BUTTON,
                        BiometricPrompt.ERROR_USER_CANCELED,
                        BiometricPrompt.ERROR_CANCELED,
                        -> BiometricOutcome.Cancelled

                        else -> BiometricOutcome.Failed
                    },
                )
            }
        },
    )

    val info = BiometricPrompt.PromptInfo.Builder()
        .setTitle(title)
        // Der Abbruchknopf fuehrt zurueck zum Passphrasenfeld und heisst
        // deshalb auch so. „Abbrechen" waere die Beschriftung eines
        // Sackgassen-Knopfes; hier gibt es einen zweiten Weg, und er gehoert
        // benannt.
        .setNegativeButtonText(negative)
        // Bestaetigung aus: Ein Fingerabdruck ist bereits eine bewusste
        // Handlung. Der zusaetzliche Knopf ist fuer Verfahren gedacht, die
        // passiv ausloesen (Gesicht) — dort schaltet ihn das System selbst
        // wieder ein.
        .setConfirmationRequired(false)
        .build()

    prompt.authenticate(info, BiometricPrompt.CryptoObject(cipher))

    continuation.invokeOnCancellation { prompt.cancelAuthentication() }
}

/* ── Die zwei Vorgaenge ─────────────────────────────────────────────────── */

/**
 * Wickelt den abgeleiteten Schluessel ein.
 *
 * @return `true`, wenn danach ein brauchbarer Wickel auf der Platte liegt.
 */
suspend fun wrapVaultKey(
    activity: FragmentActivity,
    store: BiometricWrapStore,
    key: VaultKey,
    saltBase64: String,
    title: String,
    negative: String,
): WrapResult {
    val prepared = VaultKeystore.encryptCipher()
    if (prepared !is WrapCipher.Ready) {
        return if (prepared is WrapCipher.Invalidated) WrapResult.Invalidated else WrapResult.Failed
    }

    return when (val outcome = askBiometric(activity, prepared.cipher, title, negative)) {
        is BiometricOutcome.Ok -> try {
            val cipher = outcome.cipher
            store.write(BiometricWrap(cipher.iv, cipher.doFinal(key.bytes), saltBase64))
            WrapResult.Ok
        } catch (_: GeneralSecurityException) {
            WrapResult.Failed
        }

        BiometricOutcome.Cancelled -> WrapResult.Cancelled
        BiometricOutcome.Failed -> WrapResult.Failed
    }
}

/**
 * Wickelt den Schluessel wieder aus.
 *
 * @param saltBase64 Das Salt des Umschlags, der geoeffnet werden soll. Passt
 *   es nicht zum Wickel, ist der Wickel veraltet — er wird geloescht und der
 *   Passphrasenweg bleibt.
 */
suspend fun unwrapVaultKey(
    activity: FragmentActivity,
    store: BiometricWrapStore,
    saltBase64: String,
    iterations: Int,
    title: String,
    negative: String,
): UnwrapResult {
    val wrap = store.read() ?: return UnwrapResult.Missing
    if (wrap.salt != saltBase64) {
        // Der Umschlag ist ein anderer als der, zu dem dieser Wickel gehoert.
        store.delete()
        VaultKeystore.deleteKey()
        return UnwrapResult.Missing
    }

    val prepared = VaultKeystore.decryptCipher(wrap.iv)
    if (prepared !is WrapCipher.Ready) {
        if (prepared is WrapCipher.Invalidated) {
            store.delete()
            return UnwrapResult.Invalidated
        }
        return UnwrapResult.Failed
    }

    return when (val outcome = askBiometric(activity, prepared.cipher, title, negative)) {
        is BiometricOutcome.Ok -> try {
            val bytes = outcome.cipher.doFinal(wrap.data)
            UnwrapResult.Ok(
                VaultKey(bytes, Base64.getDecoder().decode(saltBase64), iterations),
            )
        } catch (_: GeneralSecurityException) {
            UnwrapResult.Failed
        } catch (_: IllegalArgumentException) {
            UnwrapResult.Failed
        }

        BiometricOutcome.Cancelled -> UnwrapResult.Cancelled
        BiometricOutcome.Failed -> UnwrapResult.Failed
    }
}

/** Ergebnis von [wrapVaultKey]. */
enum class WrapResult { Ok, Cancelled, Invalidated, Failed }

/** Ergebnis von [unwrapVaultKey]. */
sealed class UnwrapResult {
    class Ok(val key: VaultKey) : UnwrapResult()
    data object Cancelled : UnwrapResult()

    /** Neue Biometrie registriert — der Wickel ist weg, die Passphrase gilt. */
    data object Invalidated : UnwrapResult()

    /** Es gibt gar keinen (brauchbaren) Wickel. */
    data object Missing : UnwrapResult()
    data object Failed : UnwrapResult()
}
