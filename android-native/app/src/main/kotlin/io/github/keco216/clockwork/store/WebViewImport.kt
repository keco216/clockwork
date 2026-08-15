package io.github.keco216.clockwork.store

import android.content.Context
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebStorage
import android.webkit.WebView
import android.webkit.WebViewClient
import io.github.keco216.clockwork.core.Json
import io.github.keco216.clockwork.core.VaultEnvelope
import io.github.keco216.clockwork.core.bool
import io.github.keco216.clockwork.core.isVaultEnvelope
import io.github.keco216.clockwork.core.number
import io.github.keco216.clockwork.core.text
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import java.io.ByteArrayInputStream
import java.io.File
import kotlin.coroutines.resume

/**
 * Die Uebernahme des Tresors aus der WebView-Fassung (P8).
 *
 * ── Warum in dieser App ueberhaupt ein WebView vorkommt ────────────────────
 * Die Zusage „keine Browser-Engine" gilt dem BETRIEB: Kein Bild dieser App
 * wird von einer WebView gezeichnet, keine Zeile ihrer Logik laeuft in
 * JavaScript. Hier steht der einzige WebView-Codepfad des Programms, er
 * laeuft genau EINMAL, und er tut nur eines — die Daten holen, die die
 * 1.x-Fassung hinterlassen hat.
 *
 * Der Grund ist unumgaenglich: Der Tresor der WebView-Fassung liegt im
 * `localStorage`, und der ist an einen ORIGIN gebunden. Ihn zu lesen kann nur,
 * wer diesen Origin hat — also eine WebView. Die Datei darunter ist ein
 * LevelDB von Chromium; sie selbst zu zerlegen hiesse, ein undokumentiertes
 * Format nachzubauen, das sich mit jeder System-WebView aendern darf.
 *
 * Die Alternative waere gewesen, den Nutzern beim Update ihren Tresor
 * wegzunehmen. Das ist keine.
 *
 * ── Was dabei NICHT passiert ──────────────────────────────────────────────
 * Kein Netz: Das Manifest traegt weiterhin kein INTERNET, und die eine Seite,
 * die geladen wird, kommt ueber `shouldInterceptRequest` aus dem Programm
 * selbst — sie ist leer. Der Pfad laeuft ausserdem nur, wenn wirklich
 * WebView-Daten des Pakets da sind; auf einer frischen Installation wird gar
 * keine WebView angefasst.
 *
 * ── Die Reihenfolge, an der alles haengt ──────────────────────────────────
 * Lesen → schreiben → PRUEFEN, ob geschrieben wurde → erst dann loeschen.
 * Wer zuerst loescht und dann schreibt, verliert bei einem vollen Speicher
 * den Tresor endgueltig. Schlaegt irgendein Schritt fehl, bleibt alles
 * liegen, und der naechste Start versucht es erneut.
 */
class WebViewImport(private val context: Context) {

    private val vaultStore = VaultStore(context.filesDir)
    private val settingsStore = LockSettingsStore(context.filesDir)

    /**
     * Der Merker, der die Uebernahme zu einer EINMALIGEN macht.
     *
     * Er ist noetig, obwohl der Ablauf sich scheinbar selbst abraeumt: Wir
     * loeschen zwar die WebView-Daten, aber unsere EIGENE WebView legt das
     * Verzeichnis dabei sofort wieder an. Ohne Merker traefe die Vorpruefung
     * „gibt es WebView-Daten?" bei jedem Start wieder zu, und jeder Start
     * zoege eine WebView hoch, um nichts zu finden.
     *
     * Sein INHALT ist fuer den Menschen, der die Dateien der App ansieht;
     * die Tatsache ist seine EXISTENZ. Ein Geheimnis steht nicht darin.
     */
    private val marker = File(context.filesDir, MARKER_FILE)

    /**
     * Das Datenverzeichnis der System-WebView innerhalb des Pakets.
     *
     * Sein Vorhandensein ist das Erkennungszeichen einer 1.x-Installation:
     * Eine frisch installierte 2.x hat es nicht, weil sie nie eine WebView
     * benutzt hat.
     */
    private val webViewData = File(context.dataDir, WEBVIEW_DIR)

    /**
     * Fuehrt die Uebernahme aus, falls es etwas zu uebernehmen gibt.
     *
     * Muss VOR dem ersten [VaultController]-Laden laufen und auf dem
     * Hauptfaden aufgerufen werden — eine WebView entsteht nur dort.
     */
    suspend fun runIfNeeded(): ImportOutcome {
        if (marker.exists()) return ImportOutcome.Skipped
        if (!webViewData.exists()) return ImportOutcome.Skipped

        /* Ein nativer Tresor ist da, und trotzdem liegen WebView-Daten herum?
           Dann ist etwas anders gelaufen als gedacht — und in diesem Fall wird
           NICHT geloescht: Was wir nicht gelesen haben, raeumen wir auch nicht
           weg. Der Merker verhindert nur, dass wir es bei jedem Start erneut
           versuchen. */
        if (vaultStore.exists()) {
            writeMarker(imported = false)
            return ImportOutcome.Skipped
        }

        val webView = createWebView() ?: return ImportOutcome.Failed
        val outcome = try {
            harvest(webView)
        } finally {
            webView.stopLoading()
            webView.destroy()
        }

        if (outcome == ImportOutcome.Failed) return outcome

        if (outcome != ImportOutcome.Unreadable) {
            /* Die zweite Loeschstufe, nachdem die WebView weg ist. Die erste
               ist in [harvest] durch die Speicherschicht selbst gelaufen — das
               ist die verlaessliche —, hier folgt das grobe Aufraeumen: Was die
               1.x-Fassung sonst noch abgelegt hat (der zwischengespeicherte
               Web-Bau), ist nach dem Update totes Gewicht. */
            WebStorage.getInstance().deleteAllData()
            webViewData.deleteRecursively()
        }

        writeMarker(imported = outcome == ImportOutcome.Imported)
        return outcome
    }

    /* ── Der Teil, der die WebView braucht ──────────────────────────────── */

    private suspend fun harvest(webView: WebView): ImportOutcome {
        val raw = withTimeoutOrNull(TIMEOUT_MS) {
            loadEmptyPage(webView)
            evaluate(webView, WebViewPayload.READ_SCRIPT)
        } ?: return ImportOutcome.Failed

        val payload = WebViewPayload.parseResult(raw) ?: return ImportOutcome.Failed

        /* Dieselbe Pruefung wie in der Web-Fassung (`readEnvelope` +
           `isVaultEnvelope`): Was sich nicht als Umschlag lesen laesst, ist
           keiner. Ein halb erkannter waere schlimmer als gar keiner. */
        val envelope = WebViewPayload.readEnvelope(payload.vault)

        /* Da lag etwas unter dem Tresor-Schluessel, und es ist kein Umschlag,
           den DIESE Fassung kennt. Dann wird nichts geloescht.

           Der Fall ist nicht bloss theoretisch: Bekaeme die 1.x-Fassung je ein
           zweites Umschlag-Format, faenden wir hier fremde Bytes vor — und ein
           alter Importeur, der ein neueres Format wegraeumt, ist genau die
           Sorte Datenverlust, gegen die die ganze Reihenfolge in dieser Klasse
           gebaut ist. Der Merker sorgt dafuer, dass wir es trotzdem nur einmal
           versuchen; die Bytes bleiben liegen, wo sie sind. */
        if (payload.vault != null && envelope == null) return ImportOutcome.Unreadable

        if (envelope != null) {
            if (!vaultStore.write(envelope)) return ImportOutcome.Failed

            /* Die Einstellungen wandern nur MIT einem Tresor mit. Ohne ihn
               regeln sie nichts — sie sagen, wann zugesperrt wird —, und eine
               Datei fuer nichts widerspraeche der Zusage, dass ohne Tresor
               nichts gespeichert wird. */
            settingsStore.write(
                WebViewPayload.mergeSettings(payload.settings, settingsStore.read()),
            )
        }

        /* Erst jetzt, und nur bei bestaetigtem Schreiben: die Altdaten weg.
           Ueber die Speicherschicht selbst und nicht ueber die Datei — so
           kann Chromium den Eintrag nicht nach unserem Loeschen aus einem
           Puffer neu schreiben. Ob das gelingt, ist fuer den Ausgang
           nachrangig; der Tresor ist zu diesem Zeitpunkt in Sicherheit. */
        withTimeoutOrNull(TIMEOUT_MS) { evaluate(webView, WebViewPayload.CLEAR_SCRIPT) }

        return if (envelope != null) ImportOutcome.Imported else ImportOutcome.Empty
    }

    private fun createWebView(): WebView? = try {
        WebView(context).apply {
            settings.javaScriptEnabled = true
            // Ohne das ist `localStorage` in der Seite gar nicht vorhanden —
            // die Daten auf der Platte bleiben davon unberuehrt, nur lesen
            // koennte man sie nicht.
            settings.domStorageEnabled = true
        }
    } catch (_: Exception) {
        /* Ein Geraet ohne WebView-Anbieter gibt es (abgespeckte Systeme,
           deaktiviertes Systempaket). Dann ist die Uebernahme unmoeglich — ein
           Absturz beim ersten Start waere der teurere Ausgang. Ohne Merker
           versucht der naechste Start es wieder. */
        null
    }

    private suspend fun loadEmptyPage(webView: WebView): Unit =
        suspendCancellableCoroutine { continuation ->
            webView.webViewClient = object : WebViewClient() {
                /* Hier entsteht der Origin, und zwar ohne eine einzige
                   Netzanfrage: Jede Anfrage wird aus dem Programm heraus mit
                   einer leeren Seite beantwortet. */
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest,
                ): WebResourceResponse = WebResourceResponse(
                    "text/html",
                    "utf-8",
                    200,
                    "OK",
                    emptyMap(),
                    ByteArrayInputStream(EMPTY_PAGE),
                )

                override fun onPageFinished(view: WebView, url: String) {
                    // Kann mehrfach kommen; die Fortsetzung gibt es nur einmal.
                    if (continuation.isActive) continuation.resume(Unit)
                }
            }
            webView.loadUrl("$ORIGIN/")
        }

    private suspend fun evaluate(webView: WebView, script: String): String =
        suspendCancellableCoroutine { continuation ->
            webView.evaluateJavascript(script) { result ->
                if (continuation.isActive) continuation.resume(result ?: "null")
            }
        }

    private fun writeMarker(imported: Boolean) {
        try {
            marker.writeText(
                Json.writeObject(linkedMapOf("imported" to Json.Value.Bool(imported))),
                Charsets.UTF_8,
            )
        } catch (_: Exception) {
            // Ohne Merker laeuft die Vorpruefung beim naechsten Start noch
            // einmal — unschoen, aber harmlos: Der Tresor ist dann schon da,
            // und der Zweig darueber greift.
        }
    }

    private companion object {
        const val MARKER_FILE = "webview-import.json"
        const val WEBVIEW_DIR = "app_webview"

        /**
         * Der Origin der 1.x-Fassung.
         *
         * ── Warum das hier eine Konstante ist und kein gelesener Wert ──────
         * Der Auftrag sagt „Scheme/Host aus `capacitor.config.json` ablesen".
         * Das geht nicht: In dieser Datei steht nichts davon — weder im Repo
         * noch in der ausgelieferten 1.5.4 (nachgesehen in deren
         * `assets/capacitor.config.json`). Es gibt keinen `server`-Block, und
         * damit gelten Capacitors VORGABEN, die in seinem Java-Quelltext
         * stehen: `CapConfig.java` setzt `hostname = "localhost"` und
         * `androidScheme = CAPACITOR_HTTPS_SCHEME`.
         *
         * Genau deshalb ist der Wert am Geraet NACHGEMESSEN und nicht
         * geglaubt worden (siehe docs/abnahme): Ein falscher Origin liefert
         * hier keinen Fehler, sondern still `null` — die Uebernahme meldete
         * dann „nichts gefunden", obwohl der Tresor da war. Das ist dieselbe
         * Falle wie beim APK-Vergleich, dessen leeres Vergleichsfeld
         * „identisch" meldete.
         *
         * Sollte eine kuenftige 1.x-Fassung je einen `server`-Block
         * bekommen, gehoert dieser Wert nachgezogen — deshalb steht er an
         * genau einer Stelle.
         */
        const val ORIGIN = "https://localhost"

        val EMPTY_PAGE = "<!doctype html><html><head></head><body></body></html>"
            .toByteArray(Charsets.UTF_8)

        /**
         * Reichlich bemessen, weil es nur einmal im Leben der App zaehlt: Die
         * WebView-Engine startet hier ihren ersten Prozess. Ohne Grenze waere
         * der schlimmste Ausgang ein Startbild, das nie weitergeht.
         */
        const val TIMEOUT_MS = 15_000L
    }
}

/** Wie die Uebernahme ausgegangen ist. */
enum class ImportOutcome {
    /** Es gab nichts zu tun — frische Installation, oder schon gelaufen. */
    Skipped,

    /** WebView-Daten waren da, ein Tresor darin nicht. */
    Empty,

    /**
     * Unter dem Tresor-Schluessel lag etwas, das kein bekannter Umschlag ist.
     * Es wurde NICHTS geloescht — fremde Bytes raeumt diese App nicht weg.
     */
    Unreadable,

    /** Der Tresor ist uebernommen. */
    Imported,

    /** Etwas ging schief. Es wurde nichts geloescht; der naechste Start probiert erneut. */
    Failed,
}

/**
 * Die reinen Teile der Uebernahme — alles, was ohne Geraet pruefbar ist.
 *
 * Sie stehen bewusst getrennt von der Klasse darueber: Eine WebView laesst
 * sich im JVM-Test nicht bauen, das Deuten ihrer Antwort aber sehr wohl — und
 * genau dort sitzt der Fehler, der sich nicht meldet. Liefe das Deuten falsch,
 * meldete die Uebernahme „nichts gefunden" statt eines Fehlers.
 */
internal object WebViewPayload {

    /** Die zwei `localStorage`-Schluessel der 1.x-Fassung, aus `vault-panel.ts`. */
    const val VAULT_KEY = "2fa-live.vault.v1"
    const val SETTINGS_KEY = "2fa-live.lock-settings.v1"

    /**
     * Holt beide Werte in EINEM Zug.
     *
     * Ein Aufruf statt zweier, damit beide aus demselben Seitenzustand
     * stammen — und damit es nur eine Stelle gibt, an der die Codierung
     * abgenommen werden muss.
     */
    const val READ_SCRIPT =
        "JSON.stringify({vault:localStorage.getItem('$VAULT_KEY')," +
            "settings:localStorage.getItem('$SETTINGS_KEY')})"

    /** Raeumt die Altdaten durch die Speicherschicht selbst weg. */
    const val CLEAR_SCRIPT = "localStorage.clear()"

    /** Was in der 1.x-Fassung gefunden wurde. `null` heisst „stand nicht da". */
    data class Payload(val vault: String?, val settings: String?)

    /**
     * Deutet die Antwort von `evaluateJavascript`.
     *
     * Zwei Huellen liegen darum: `evaluateJavascript` codiert sein Ergebnis
     * als JSON, und das Ergebnis ist hier selbst ein JSON-Text. Aus
     * `{"vault":"{\"v\":1,…}"}` wird auf dem Weg heraus also
     * `"{\"vault\":\"{\\\"v\\\":1,…}\"}"`.
     *
     * @return `null`, wenn sich die Antwort nicht deuten laesst — das ist ein
     *   FEHLER und ausdruecklich nicht dasselbe wie „nichts gespeichert".
     */
    fun parseResult(raw: String): Payload? = try {
        val inner = Json.parseStringOrNull(raw)
        if (inner == null) {
            null
        } else {
            val fields = Json.parseObject(inner)
            Payload(fields.text(VAULT_FIELD), fields.text(SETTINGS_FIELD))
        }
    } catch (_: IllegalArgumentException) {
        null
    }

    /**
     * Liest den Umschlag aus dem, was im `localStorage` stand.
     *
     * Wortgleich die Pruefung der Web-Fassung: `JSON.parse` plus
     * `isVaultEnvelope`. `null` heisst „kein Umschlag" — der Aufrufer
     * unterscheidet danach, ob ueberhaupt etwas dastand.
     */
    fun readEnvelope(vaultText: String?): VaultEnvelope? = vaultText
        ?.let { VaultEnvelope.fromJsonOrNull(it) }
        ?.takeIf { isVaultEnvelope(it) }

    /**
     * Uebernimmt die zwei Werte, die es im Web ueberhaupt gibt.
     *
     * `biometric` und `blockScreenshots` haben dort kein Gegenstueck und
     * behalten ihre native Voreinstellung — die Biometrie ist aus (es gibt
     * noch keinen Wickel), die Bildschirmsperre an.
     */
    fun mergeSettings(json: String?, current: LockSettings): LockSettings {
        if (json == null) return current
        val fields = try {
            Json.parseObject(json)
        } catch (_: IllegalArgumentException) {
            return current
        }
        return current.copy(
            /* Dieselbe Klemme wie in [LockSettingsStore.read]: Eine Sperrzeit,
               die nicht auf der Leiste steht, waere im Auswahlfeld unsichtbar.
               Die Web-Fassung nimmt beim Lesen jede Zahl an, schreibt aber nur
               diese drei — gemessen sind es dieselben drei. */
            timeoutMs = fields.number("timeoutMs")?.toLong()
                ?.takeIf { it in LockSettings.TIMEOUT_CHOICES }
                ?: current.timeoutMs,
            lockOnHide = fields.bool("lockOnHide") ?: current.lockOnHide,
        )
    }

    private const val VAULT_FIELD = "vault"
    private const val SETTINGS_FIELD = "settings"
}
