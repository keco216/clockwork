package io.github.keco216.clockwork.store

import io.github.keco216.clockwork.core.Json
import io.github.keco216.clockwork.core.bool
import io.github.keco216.clockwork.core.number
import java.io.File
import java.io.IOException

/**
 * Die Bedien-Einstellungen des Tresors.
 *
 * ── Was hier stehen darf ──────────────────────────────────────────────────
 * Zahlen und Haekchen. KEIN Geheimnis: keine Passphrase, kein Schluessel,
 * kein Stueck Klartext. Deshalb liegt diese Datei unverschluesselt neben dem
 * Umschlag — die Web-Fassung legt dieselben zwei Werte aus demselben Grund
 * unverschluesselt in den `localStorage`.
 *
 * Und deshalb ist auch das Schreiben hier schlichter als beim Umschlag: Geht
 * eine Einstellung verloren, gilt wieder die Voreinstellung. Geht ein
 * Umschlag verloren, sind die Secrets weg.
 *
 * ── Warum kein DataStore ──────────────────────────────────────────────────
 * Weil vier Werte kein Framework brauchen — dieselbe Begruendung wie beim
 * selbst geschriebenen Protobuf-Leser der Web-Fassung. DataStore braechte
 * Coroutinen-Fluesse, ein Serialisierungsschema und eine Abhaengigkeit fuer
 * eine Datei, die vier Zeilen lang ist.
 *
 * ── Die Feldnamen sind nicht frei gewaehlt ────────────────────────────────
 * `timeoutMs` und `lockOnHide` heissen genau so wie im `localStorage` der
 * WebView-Fassung (`2fa-live.lock-settings.v1`). Die Uebernahme in P8 ist
 * dadurch ein Kopiervorgang und keine Umrechnung.
 */
data class LockSettings(
    /** Untaetigkeit bis zur Sperre. Voreinstellung 5 Minuten, wie im Web. */
    val timeoutMs: Long = DEFAULT_TIMEOUT_MS,
    /**
     * Sperren, wenn die App verlassen wird.
     *
     * Im Web heisst das „beim Verlassen des Tabs" und haengt an
     * `visibilitychange`; hier ist es `onStop` der Activity. Derselbe
     * Gedanke, andere Plattform — deshalb gibt es dafuer einen eigenen
     * `native.`-Satz und nicht den Web-Satz mit dem Wort „Tab" darin.
     */
    val lockOnHide: Boolean = true,
    /**
     * Ob der abgeleitete Schluessel im Keystore eingewickelt liegt.
     *
     * Nur ein Merker fuer die Oberflaeche — der Wickel selbst liegt in seiner
     * eigenen Datei (siehe [BiometricWrapStore]). Beides getrennt zu halten
     * ist Absicht: Ein Haekchen ist eine Einstellung, ein Wickel ist
     * Schluesselmaterial.
     */
    val biometric: Boolean = false,
    /**
     * `FLAG_SECURE`: Bildschirmfotos und Vorschaubilder in der Uebersicht
     * sperren. Voreinstellung AN — so machen es die etablierten
     * FOSS-Authenticatoren, und ein Code, der in der Zuletzt-verwendet-Ansicht
     * stehen bleibt, ist genau das Fenster, das der Tresor schliessen soll.
     *
     * Abschaltbar, weil es sonst keine Abnahmebilder gaebe: `FLAG_SECURE`
     * sperrt auch `adb shell screencap`.
     */
    val blockScreenshots: Boolean = true,
) {
    companion object {
        const val DEFAULT_TIMEOUT_MS = 300_000L

        /** Die drei Stufen des Auswahlfelds — dieselben wie im Web. */
        val TIMEOUT_CHOICES = listOf(60_000L, 300_000L, 900_000L)
    }
}

/** Liest und schreibt [LockSettings] als flache JSON-Datei. */
class LockSettingsStore(private val dir: File) {

    private val file = File(dir, "lock-settings.json")

    /**
     * Liest die Einstellungen — jeder unlesbare Wert faellt einzeln auf seine
     * Voreinstellung zurueck.
     *
     * Feldweise und nicht als Ganzes, weil eine spaetere Fassung dieser App
     * ein Feld ergaenzen wird: Die Datei von gestern soll dann nicht komplett
     * verworfen werden, nur weil ein Name darin fehlt.
     */
    fun read(): LockSettings {
        val fields = try {
            if (!file.exists()) return LockSettings()
            Json.parseObject(file.readText(Charsets.UTF_8))
        } catch (_: IOException) {
            return LockSettings()
        } catch (_: IllegalArgumentException) {
            return LockSettings()
        }

        val default = LockSettings()
        return LockSettings(
            // Eine Sperrzeit, die nicht auf der Leiste steht, waere im
            // Auswahlfeld unsichtbar — der Nutzer saehe eine Einstellung, die
            // er nicht wiederfindet.
            timeoutMs = fields.number("timeoutMs")?.toLong()
                ?.takeIf { it in LockSettings.TIMEOUT_CHOICES }
                ?: default.timeoutMs,
            lockOnHide = fields.bool("lockOnHide") ?: default.lockOnHide,
            biometric = fields.bool("biometric") ?: default.biometric,
            blockScreenshots = fields.bool("blockScreenshots") ?: default.blockScreenshots,
        )
    }

    /**
     * Schreibt die Einstellungen.
     *
     * Ohne Nebendatei und ohne `sync`: Hier steht kein Geheimnis, und der
     * schlimmste Ausgang eines abgebrochenen Schreibvorgangs ist eine
     * unlesbare Datei — [read] faellt dann auf die Voreinstellungen zurueck.
     * Denselben Aufwand wie beim Umschlag zu treiben hiesse, Sorgfalt an der
     * falschen Stelle auszugeben.
     */
    fun write(settings: LockSettings) {
        try {
            dir.mkdirs()
            file.writeText(
                Json.writeObject(
                    linkedMapOf(
                        "timeoutMs" to Json.Value.Number(settings.timeoutMs.toDouble()),
                        "lockOnHide" to Json.Value.Bool(settings.lockOnHide),
                        "biometric" to Json.Value.Bool(settings.biometric),
                        "blockScreenshots" to Json.Value.Bool(settings.blockScreenshots),
                    ),
                ),
                Charsets.UTF_8,
            )
        } catch (_: IOException) {
            // Ohne Speicher gilt die Einstellung eben nur fuer diese Sitzung —
            // wortgleich die Haltung der Web-Fassung.
        } catch (_: SecurityException) {
            // dito
        }
    }

    fun delete() {
        file.delete()
    }
}
