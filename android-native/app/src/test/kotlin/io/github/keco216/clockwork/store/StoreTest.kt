package io.github.keco216.clockwork.store

import io.github.keco216.clockwork.core.SealOptions
import io.github.keco216.clockwork.core.openVault
import io.github.keco216.clockwork.core.sealVault
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

/**
 * Die Ablage auf der Platte.
 *
 * ── Was hier geprueft wird und was nicht ──────────────────────────────────
 * Geprueft wird alles, was ohne Android auskommt: die Dateien, ihr Format,
 * ihre Rueckfaelle. NICHT geprueft ist der Android-Keystore — den gibt es im
 * JVM-Unit-Test nicht, jeder Aufruf liefe gegen einen Stub. Genau deshalb ist
 * der Wickel in zwei Teile getrennt: [BiometricWrapStore] ist eine Datei und
 * steht hier, der Keystore-Teil bekommt den Emulator-Beweis. Eine Trennung,
 * die nur der Testbarkeit dient, waere schlechte Architektur — diese hier
 * trennt zwei wirklich verschiedene Dinge: einen Behaelter und ein Schloss.
 */
class VaultStoreTest {

    @get:Rule
    val folder = TemporaryFolder()

    private val fast = SealOptions(iterations = 1000)

    private fun store() = VaultStore(folder.root)

    @Test
    fun `ohne Datei gibt es keinen Tresor`() {
        assertNull(store().read())
        assertFalse(store().exists())
    }

    @Test
    fun `schreibt und liest denselben Umschlag`() {
        val envelope = sealVault("GitHub: JBSWY3DPEHPK3PXP", "pass", fast)
        assertTrue(store().write(envelope))
        assertEquals(envelope, store().read())
    }

    @Test
    fun `der Umschlag auf der Platte ist der der Web-Fassung`() {
        // Die Datei ist das, was P8 aus dem localStorage der WebView-Fassung
        // uebernimmt. Steht sie anders da, ist die Uebernahme keine Kopie
        // mehr, sondern eine Umrechnung — und die kann falsch sein.
        val envelope = sealVault("x", "pass", fast)
        store().write(envelope)
        val text = File(folder.root, "vault.json").readText(Charsets.UTF_8)

        assertEquals(envelope.toJson(), text)
        // Die Feldreihenfolge ist die von `{...header, salt, iv, data}`.
        assertTrue(text.startsWith("{\"v\":1,\"kdf\":\"PBKDF2-SHA-256\",\"iterations\":1000,"))
    }

    @Test
    fun `der gelesene Umschlag laesst sich wirklich oeffnen`() {
        // Gegenprobe: Ein Leser, der nur Felder vergleicht, laeuft auch dann
        // gruen, wenn base64 unterwegs verstuemmelt wurde.
        val envelope = sealVault("GitHub: JBSWY3DPEHPK3PXP", "pass", fast)
        store().write(envelope)
        assertEquals("GitHub: JBSWY3DPEHPK3PXP", openVault(store().read()!!, "pass"))
    }

    @Test
    fun `ersetzt einen vorhandenen Tresor`() {
        // Der Fall, an dem `File.renameTo` auf manchen Dateisystemen scheitert
        // — deshalb `Files.move` mit REPLACE_EXISTING.
        store().write(sealVault("eins", "pass", fast))
        val zweite = sealVault("zwei", "pass", fast)
        assertTrue(store().write(zweite))
        assertEquals("zwei", openVault(store().read()!!, "pass"))
    }

    @Test
    fun `laesst keine Nebendatei liegen`() {
        // Eine liegen gebliebene `.tmp` waere ein zweiter Ort mit Chiffrat —
        // und einer, den „Alles loeschen" uebersehen koennte.
        store().write(sealVault("x", "pass", fast))
        assertFalse(File(folder.root, "vault.json.tmp").exists())
    }

    @Test
    fun `eine kaputte Datei gilt als kein Tresor`() {
        File(folder.root, "vault.json").writeText("das ist kein JSON", Charsets.UTF_8)
        assertNull(store().read())
    }

    @Test
    fun `ein halber Umschlag gilt als kein Tresor`() {
        // Genau der Zustand, den das atomare Ersetzen verhindern soll — wenn
        // er doch eintritt, muss er als „kein Tresor" gelesen werden und nicht
        // als halber.
        File(folder.root, "vault.json").writeText("{\"v\":1,\"kdf\":\"PBKDF2-SHA-256\"}", Charsets.UTF_8)
        assertNull(store().read())
    }

    @Test
    fun `meldet einen fehlgeschlagenen Schreibvorgang statt ihn zu verschlucken`() {
        // Der Ordner ist hier eine DATEI — schreiben ist damit unmoeglich.
        // Das ist die Ersatzlage fuer „Speicher voll": Der Aufrufer muss ein
        // `false` bekommen und die Meldung zeigen, statt zu glauben, es sei
        // gespeichert.
        val asFile = File(folder.root, "kein-ordner")
        asFile.writeText("x")
        assertFalse(VaultStore(asFile).write(sealVault("x", "pass", fast)))
    }

    @Test
    fun `loeschen raeumt Datei und Nebendatei weg`() {
        store().write(sealVault("x", "pass", fast))
        File(folder.root, "vault.json.tmp").writeText("rest")
        store().delete()
        assertFalse(File(folder.root, "vault.json").exists())
        assertFalse(File(folder.root, "vault.json.tmp").exists())
        assertNull(store().read())
    }
}

class LockSettingsStoreTest {

    @get:Rule
    val folder = TemporaryFolder()

    private fun store() = LockSettingsStore(folder.root)

    @Test
    fun `ohne Datei gelten die Voreinstellungen`() {
        val settings = store().read()
        assertEquals(300_000L, settings.timeoutMs)
        assertTrue(settings.lockOnHide)
        assertFalse(settings.biometric)
        // FLAG_SECURE ist AN, solange niemand es abschaltet.
        assertTrue(settings.blockScreenshots)
    }

    @Test
    fun `die Voreinstellung ist dieselbe wie im Web`() {
        assertEquals(300_000L, LockSettings.DEFAULT_TIMEOUT_MS)
        assertEquals(listOf(60_000L, 300_000L, 900_000L), LockSettings.TIMEOUT_CHOICES)
    }

    @Test
    fun `schreibt und liest alle vier Werte`() {
        val settings = LockSettings(
            timeoutMs = 900_000L,
            lockOnHide = false,
            biometric = true,
            blockScreenshots = false,
        )
        store().write(settings)
        assertEquals(settings, store().read())
    }

    @Test
    fun `die Feldnamen sind die des localStorage der WebView-Fassung`() {
        // Daran haengt P8: Die Uebernahme soll ein Kopiervorgang sein.
        store().write(LockSettings())
        val text = File(folder.root, "lock-settings.json").readText(Charsets.UTF_8)
        assertTrue(text.contains("\"timeoutMs\":300000"))
        assertTrue(text.contains("\"lockOnHide\":true"))
    }

    @Test
    fun `ein fehlendes Feld faellt einzeln auf seine Voreinstellung zurueck`() {
        // Feldweise und nicht als Ganzes: Die Datei von gestern soll nicht
        // komplett verworfen werden, nur weil ein Name darin fehlt.
        File(folder.root, "lock-settings.json").writeText("{\"lockOnHide\":false}", Charsets.UTF_8)
        val settings = store().read()
        assertEquals(300_000L, settings.timeoutMs)
        assertFalse(settings.lockOnHide)
        assertTrue(settings.blockScreenshots)
    }

    @Test
    fun `eine Sperrzeit neben der Leiter wird verworfen`() {
        // Sonst zeigte das Auswahlfeld eine Einstellung an, die es gar nicht
        // anbietet — der Nutzer saehe einen Wert, den er nicht wiederfindet.
        File(folder.root, "lock-settings.json").writeText("{\"timeoutMs\":7}", Charsets.UTF_8)
        assertEquals(300_000L, store().read().timeoutMs)
    }

    @Test
    fun `eine kaputte Datei gibt die Voreinstellungen`() {
        File(folder.root, "lock-settings.json").writeText("kaputt", Charsets.UTF_8)
        assertEquals(LockSettings(), store().read())
    }
}

class BiometricWrapStoreTest {

    @get:Rule
    val folder = TemporaryFolder()

    private fun store() = BiometricWrapStore(folder.root)

    private val iv = ByteArray(12) { it.toByte() }
    private val data = ByteArray(48) { (it * 7).toByte() }

    @Test
    fun `ohne Datei gibt es keinen Wickel`() {
        assertNull(store().read())
    }

    @Test
    fun `schreibt und liest den Wickel zurueck`() {
        store().write(BiometricWrap(iv, data, "c2FsdA=="))
        val wrap = store().read()
        assertNotNull(wrap)
        assertArrayEquals(iv, wrap!!.iv)
        assertArrayEquals(data, wrap.data)
        assertEquals("c2FsdA==", wrap.salt)
    }

    @Test
    fun `der Wickel enthaelt keinen Klartext`() {
        // Er ist Chiffrat und ein Salt — mehr darf da nicht stehen.
        store().write(BiometricWrap(iv, data, "c2FsdA=="))
        val text = File(folder.root, "vault-wrap.json").readText(Charsets.UTF_8)
        assertEquals(setOf("iv", "data", "salt"), Regex("\"(\\w+)\":").findAll(text)
            .map { it.groupValues[1] }.toSet())
    }

    @Test
    fun `ein Wickel ohne Salt ist keiner`() {
        // Ohne Salt liesse sich nicht erkennen, ob er noch zum gespeicherten
        // Umschlag gehoert — und ein Wickel, der zum falschen Tresor gehoert,
        // scheitert spaeter wortlos.
        File(folder.root, "vault-wrap.json").writeText("{\"iv\":\"AA==\",\"data\":\"AA==\"}", Charsets.UTF_8)
        assertNull(store().read())
    }

    @Test
    fun `kaputtes base64 ist kein Wickel`() {
        File(folder.root, "vault-wrap.json")
            .writeText("{\"iv\":\"!!\",\"data\":\"AA==\",\"salt\":\"AA==\"}", Charsets.UTF_8)
        assertNull(store().read())
    }

    @Test
    fun `loeschen raeumt ihn weg`() {
        store().write(BiometricWrap(iv, data, "c2FsdA=="))
        store().delete()
        assertNull(store().read())
        assertFalse(File(folder.root, "vault-wrap.json").exists())
    }
}
