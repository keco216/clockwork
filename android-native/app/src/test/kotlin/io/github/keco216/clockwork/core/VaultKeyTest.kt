package io.github.keco216.clockwork.core

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Base64

/**
 * Der abgeleitete Schluessel als Sitzungsgeheimnis (P7).
 *
 * Diese Faelle haben im Web KEIN Gegenstueck — dort gibt es den Typ nicht, weil
 * dort die Passphrase im Speicher bleibt. Geprueft wird deshalb gegen die
 * bestehenden Zusagen des Formats: Was ueber den neuen Weg entsteht, muss der
 * alte Weg oeffnen koennen und umgekehrt.
 */
class VaultKeyTest {

    /** Wie in VaultTest: 600.000 Iterationen kosten je Aufruf eine halbe Sekunde. */
    private val fast = SealOptions(iterations = 1000)

    private val secrets = "GitHub: JBSWY3DPEHPK3PXP"

    /* ── Der neue Weg trifft den alten ────────────────────────────────── */

    @Test
    fun `ein per Schluessel versiegelter Umschlag laesst sich per Passphrase oeffnen`() {
        val key = newVaultKey("pass", fast)
        val envelope = sealVaultWithKey(secrets, key)
        assertEquals(secrets, openVault(envelope, "pass"))
    }

    @Test
    fun `ein per Passphrase versiegelter Umschlag laesst sich per Schluessel oeffnen`() {
        val envelope = sealVault(secrets, "pass", fast)
        val key = deriveVaultKey(envelope, "pass")
        assertEquals(secrets, openVaultWithKey(envelope, key))
    }

    @Test
    fun `derselbe Umschlag und dieselbe Passphrase geben denselben Schluessel`() {
        // Der Kern der Sache: Der Schluessel haengt an Passphrase UND Salt.
        // Waere das nicht so, koennte der Biometrie-Wickel nicht funktionieren.
        val envelope = sealVault(secrets, "pass", fast)
        assertArrayEquals(
            deriveVaultKey(envelope, "pass").bytes,
            deriveVaultKey(envelope, "pass").bytes,
        )
    }

    @Test
    fun `eine andere Passphrase gibt einen anderen Schluessel`() {
        val envelope = sealVault(secrets, "pass", fast)
        assertNotEquals(
            Base64.getEncoder().encodeToString(deriveVaultKey(envelope, "pass").bytes),
            Base64.getEncoder().encodeToString(deriveVaultKey(envelope, "passX").bytes),
        )
    }

    @Test
    fun `ein Schluessel ist 32 Byte lang`() {
        // 256 Bit — AES-256 verlangt genau das, und ein zu kurzer Schluessel
        // faellt sonst erst beim Verschluesseln auf.
        assertEquals(32, newVaultKey("pass", fast).bytes.size)
    }

    @Test
    fun `ein fremder Schluessel oeffnet den Umschlag nicht`() {
        val envelope = sealVault(secrets, "richtig", fast)
        val fremd = deriveVaultKey(envelope, "falsch")
        assertKey("err.vault.openFailed") { openVaultWithKey(envelope, fremd) }
    }

    /* ── „Neu speichern": derselbe Schluessel, frischer IV ───────────────── */

    @Test
    fun `neu versiegeln behaelt Salt und Iterationszahl, wechselt aber den IV`() {
        val key = newVaultKey("pass", fast)
        val erst = sealVaultWithKey("eins", key)
        val dann = sealVaultWithKey("zwei", key)

        assertEquals("Das Salt gehoert zum Schluessel", erst.salt, dann.salt)
        assertEquals(erst.iterations, dann.iterations)
        // Der eine Punkt, an dem eine Wiederholung katastrophal waere: Ein
        // zweimal mit demselben Schluessel benutzter GCM-IV gibt den XOR
        // beider Klartexte preis.
        assertNotEquals("Der IV MUSS frisch sein", erst.iv, dann.iv)
        assertEquals("zwei", openVault(dann, "pass"))
    }

    @Test
    fun `der alte Umschlag bleibt mit derselben Passphrase lesbar`() {
        // Wichtig fuer den Fall, dass das Schreiben scheitert: Dann liegt noch
        // der alte Umschlag auf der Platte, und der muss aufgehen.
        val key = newVaultKey("pass", fast)
        val erst = sealVaultWithKey("eins", key)
        sealVaultWithKey("zwei", key)
        assertEquals("eins", openVault(erst, "pass"))
    }

    /* ── Aufraeumen ──────────────────────────────────────────────────────── */

    @Test
    fun `clear ueberschreibt den Schluessel mit Nullen`() {
        val key = newVaultKey("pass", fast)
        assertTrue("Vorher darf er nicht schon leer sein", key.bytes.any { it != 0.toByte() })
        key.clear()
        assertTrue(key.bytes.all { it == 0.toByte() })
    }

    @Test
    fun `ein geleerter Schluessel oeffnet nichts mehr`() {
        // Die Gegenprobe zu oben: `clear` soll nicht nur ein Feld fuellen,
        // sondern den Schluessel wirklich unbrauchbar machen.
        val envelope = sealVault(secrets, "pass", fast)
        val key = deriveVaultKey(envelope, "pass")
        key.clear()
        assertKey("err.vault.openFailed") { openVaultWithKey(envelope, key) }
    }

    /* ── Die Vorpruefungen gelten auf beiden Wegen ───────────────────────── */

    @Test
    fun `eine leere Passphrase leitet keinen Schluessel ab`() {
        val envelope = sealVault(secrets, "pass", fast)
        assertKey("vault.error.noPassphrase") { deriveVaultKey(envelope, "") }
        assertKey("vault.error.noPassphrase") { newVaultKey("") }
    }

    @Test
    fun `ein fremdes Verfahren wird auch auf dem Schluesselweg abgewiesen`() {
        val envelope = sealVault(secrets, "pass", fast).copy(kdf = "scrypt")
        assertKey("err.vault.badFormat") { deriveVaultKey(envelope, "pass") }
    }

    @Test
    fun `eine unmoegliche Iterationszahl wird benannt und nicht verschwiegen`() {
        // Nicht „Oeffnen fehlgeschlagen": Dass eine Datei offensichtlich
        // kaputt ist, verraet einem Angreifer nichts, was er nicht sieht.
        val envelope = sealVault(secrets, "pass", fast).copy(iterations = 0)
        val error = capture { deriveVaultKey(envelope, "pass") }
        assertEquals("err.vault.iterations", error.key)
        assertEquals("0", error.args["value"])
    }
}
