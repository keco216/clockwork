package io.github.keco216.clockwork.store

import io.github.keco216.clockwork.core.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Die Uebernahme aus der WebView-Fassung — der Teil ohne Geraet.
 *
 * ── Was hier geprueft wird, und warum gerade das ──────────────────────────
 * Eine WebView laesst sich im JVM-Test nicht bauen. Das Deuten ihrer ANTWORT
 * dagegen schon, und genau dort sitzt der Fehler, der sich nicht meldet:
 * Wuerde die Codierung falsch abgenommen, liefe die Uebernahme nicht auf
 * einen Absturz hinaus, sondern auf ein stilles „nichts gefunden" — der
 * Nutzer verlaengert sein Update und sein Tresor ist weg.
 *
 * ── Die Grenze dieser Tests, ehrlich benannt ──────────────────────────────
 * Die zwei Huellen werden hier von [quote] nachgebaut, nicht von Chromium
 * erzeugt. Der Test kann also beweisen, dass der Leser JSON-Codierung
 * richtig abnimmt — nicht, dass Chromium genau so codiert. Dafuer gibt es
 * den Emulator-Beweis in `docs/abnahme`, und nur dafuer.
 */
class WebViewImportTest {

    /* Ein echter Umschlag: die Datei, die die App in P7 geschrieben hat und
       die Node ueber die Web Crypto API geoeffnet hat. */
    private val envelope =
        """{"v":1,"kdf":"PBKDF2-SHA-256","iterations":600000,""" +
            """"salt":"53CyD2fo+KW7ZTBTw6/efw==","iv":"0nHL2r/WhLHSpV00","data":"PaBv9BNO"}"""

    /**
     * Codiert eine Zeichenkette als JSON-Literal — das, was `JSON.stringify`
     * und `evaluateJavascript` je einmal tun.
     */
    private fun quote(text: String): String = buildString {
        append('"')
        for (char in text) {
            when (char) {
                '"' -> append("\\\"")
                '\\' -> append("\\\\")
                '\n' -> append("\\n")
                else -> append(char)
            }
        }
        append('"')
    }

    /** Baut die Antwort so auf, wie sie aus der WebView herauskommt. */
    private fun answer(vault: String?, settings: String?): String {
        val inner = Json.writeObject(
            linkedMapOf(
                "vault" to (vault?.let { Json.Value.Text(it) } ?: Json.Value.Null),
                "settings" to (settings?.let { Json.Value.Text(it) } ?: Json.Value.Null),
            ),
        )
        return quote(inner)
    }

    /* ── Die Antwort deuten ─────────────────────────────────────────────── */

    @Test
    fun `ein Umschlag kommt durch beide Huellen heil an`() {
        val settings = """{"timeoutMs":900000,"lockOnHide":false}"""
        val payload = WebViewPayload.parseResult(answer(envelope, settings))

        assertEquals(envelope, payload?.vault)
        assertEquals(settings, payload?.settings)
    }

    @Test
    fun `nichts gespeichert ist kein Fehler`() {
        // Der Unterschied, an dem alles haengt: ein Payload mit zwei Leerwerten
        // heisst „nachgesehen, nichts da"; `null` hiesse „nicht nachgesehen".
        val payload = WebViewPayload.parseResult(answer(null, null))

        assertNull(payload?.vault)
        assertNull(payload?.settings)
        assertEquals(WebViewPayload.Payload(null, null), payload)
    }

    @Test
    fun `eine Antwort ohne Tresor traegt trotzdem die Einstellungen`() {
        val payload = WebViewPayload.parseResult(answer(null, """{"lockOnHide":false}"""))

        assertNull(payload?.vault)
        assertEquals("""{"lockOnHide":false}""", payload?.settings)
    }

    @Test
    fun `eine unlesbare Antwort ist ein Fehler und kein Leerbefund`() {
        // Genau hier trennt sich „konnte nicht lesen" von „nichts da". Wer
        // beides gleich behandelt, loescht Altdaten, die er nie gesehen hat.
        assertNull(WebViewPayload.parseResult("null"))
        assertNull(WebViewPayload.parseResult(""))
        assertNull(WebViewPayload.parseResult(quote("kein Objekt")))
        assertNull(WebViewPayload.parseResult("{\"vault\":null}"))
    }

    /* ── Die eine Huelle, die der JSON-Leser abnimmt ────────────────────── */

    @Test
    fun `parseStringOrNull nimmt genau eine Huelle ab`() {
        assertEquals("""{"v":1}""", Json.parseStringOrNull(quote("""{"v":1}""")))
        assertEquals("mit \" und \\", Json.parseStringOrNull(quote("mit \" und \\")))
        assertEquals("Zeile\nZeile", Json.parseStringOrNull(quote("Zeile\nZeile")))
        assertEquals("Straße 🔑", Json.parseStringOrNull("\"Stra\\u00dfe \\ud83d\\udd11\""))
        assertNull(Json.parseStringOrNull("null"))
    }

    @Test
    fun `parseStringOrNull ist streng`() {
        // Ein stillschweigend gedeuteter Rueckgabewert waere hier teurer als
        // eine Ausnahme: Der Aufrufer behandelt die Ausnahme als Fehler und
        // laesst die Altdaten in Ruhe.
        assertThrows(IllegalArgumentException::class.java) { Json.parseStringOrNull("600000") }
        assertThrows(IllegalArgumentException::class.java) { Json.parseStringOrNull("true") }
        assertThrows(IllegalArgumentException::class.java) { Json.parseStringOrNull("""{"v":1}""") }
        assertThrows(IllegalArgumentException::class.java) { Json.parseStringOrNull("\"a\" \"b\"") }
    }

    /* ── Der Umschlag ───────────────────────────────────────────────────── */

    @Test
    fun `liest den Umschlag wie die Web-Fassung`() {
        assertEquals("53CyD2fo+KW7ZTBTw6/efw==", WebViewPayload.readEnvelope(envelope)?.salt)
        assertNull(WebViewPayload.readEnvelope(null))
        assertNull(WebViewPayload.readEnvelope("kein JSON"))
        assertNull(WebViewPayload.readEnvelope("""{"v":1,"salt":"a"}"""))
    }

    @Test
    fun `ein fremdes Ableitungsverfahren ist kein Umschlag`() {
        // Der Fall, wegen dem die Uebernahme zwischen „nichts da" und
        // „unlesbar" unterscheidet: Bekaeme die 1.x-Fassung je ein zweites
        // Format, faende ein alter Importeur hier fremde Bytes vor. Er darf
        // sie dann nicht wegraeumen.
        val fremd = envelope.replace("PBKDF2-SHA-256", "Argon2id")

        assertNull(WebViewPayload.readEnvelope(fremd))
    }

    /* ── Die Einstellungen ──────────────────────────────────────────────── */

    @Test
    fun `uebernimmt die zwei Werte, die es im Web gibt`() {
        val merged = WebViewPayload.mergeSettings(
            """{"timeoutMs":900000,"lockOnHide":false}""",
            LockSettings(),
        )

        assertEquals(900_000L, merged.timeoutMs)
        assertEquals(false, merged.lockOnHide)
    }

    @Test
    fun `die nativen Werte bleiben auf ihrer Voreinstellung`() {
        // `biometric` und `blockScreenshots` haben im Web kein Gegenstueck.
        // Sie duerfen von einer Uebernahme nicht angefasst werden — sonst
        // kaeme ein Geraet aus dem Update mit abgeschalteter Bildschirmsperre.
        val merged = WebViewPayload.mergeSettings(
            """{"timeoutMs":60000,"lockOnHide":true,"biometric":true,"blockScreenshots":false}""",
            LockSettings(),
        )

        assertEquals(60_000L, merged.timeoutMs)
        assertEquals(false, merged.biometric)
        assertEquals(true, merged.blockScreenshots)
    }

    @Test
    fun `eine Sperrzeit neben der Leiter faellt auf die Voreinstellung`() {
        // Die Web-Fassung nimmt beim LESEN jede Zahl an; ihr Auswahlfeld
        // schreibt aber nur die drei Stufen. Eine vierte waere nativ im Feld
        // unsichtbar — der Nutzer saehe eine Einstellung, die er nicht
        // wiederfindet.
        val merged = WebViewPayload.mergeSettings("""{"timeoutMs":45000}""", LockSettings())

        assertEquals(LockSettings.DEFAULT_TIMEOUT_MS, merged.timeoutMs)
    }

    @Test
    fun `ohne oder mit kaputten Einstellungen bleibt alles, wie es ist`() {
        val current = LockSettings(timeoutMs = 60_000L, lockOnHide = false)

        assertEquals(current, WebViewPayload.mergeSettings(null, current))
        assertEquals(current, WebViewPayload.mergeSettings("kein JSON", current))
        assertEquals(current, WebViewPayload.mergeSettings("{}", current))
    }

    /* ── Die Schluessel selbst ──────────────────────────────────────────── */

    @Test
    fun `die Schluessel sind die der Web-Fassung`() {
        // Ein Tippfehler hier faellt sonst erst auf einem fremden Geraet auf,
        // und dann als „nichts gefunden". Die Werte stehen in
        // src/ui/vault-panel.ts.
        assertEquals("2fa-live.vault.v1", WebViewPayload.VAULT_KEY)
        assertEquals("2fa-live.lock-settings.v1", WebViewPayload.SETTINGS_KEY)
        assertTrue(WebViewPayload.READ_SCRIPT.contains(WebViewPayload.VAULT_KEY))
        assertTrue(WebViewPayload.READ_SCRIPT.contains(WebViewPayload.SETTINGS_KEY))
    }
}
