package io.github.keco216.clockwork.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.util.Base64

/**
 * Portiert aus `src/lib/vault.test.ts`.
 *
 * Die Cross-Fixtures stehen in [VaultCrossFixtureTest] — hier laufen die
 * Faelle, die die Web-Fassung fuer sich selbst prueft.
 */
class VaultTest {

    /**
     * Fast alle Tests laufen mit stark herabgesetzter Iterationszahl: 600.000
     * kosten pro Aufruf rund eine halbe Sekunde, und ein Test, der eine Minute
     * laeuft, wird irgendwann uebersprungen. Dass die App den richtigen Wert
     * benutzt, prueft der letzte Block gesondert.
     */
    private val fast = SealOptions(iterations = 1000)

    private val secrets = listOf(
        "GitHub: JBSWY3DPEHPK3PXP",
        "otpauth://totp/A?secret=JBSWY3DPEHPK3PXP",
    ).joinToString("\n")

    /* ── Roundtrip ────────────────────────────────────────────────────── */

    @Test
    fun `gibt denselben Klartext zurueck`() {
        val envelope = sealVault(secrets, "richtige passphrase", fast)
        assertEquals(secrets, openVault(envelope, "richtige passphrase"))
    }

    @Test
    fun `ueberlebt Umlaute Emoji und Zeilenumbrueche`() {
        val text = "Grüße 🔐\nzweite Zeile\tmit Tab\r\nund CRLF"
        val envelope = sealVault(text, "pass", fast)
        assertEquals(text, openVault(envelope, "pass"))
    }

    @Test
    fun `kommt mit leerem Klartext klar`() {
        val envelope = sealVault("", "pass", fast)
        assertEquals("", openVault(envelope, "pass"))
    }

    @Test
    fun `ueberlebt den Weg durch JSON`() {
        // So liegt der Umschlag auf der Platte — und so kommt er in P8 aus dem
        // localStorage der WebView-Fassung.
        val envelope = sealVault(secrets, "pass", fast)
        val roundTripped = VaultEnvelope.fromJsonOrNull(envelope.toJson())
        assertEquals(envelope, roundTripped)
        assertEquals(secrets, openVault(roundTripped!!, "pass"))
    }

    /* ── Der Umschlag verraet nichts ──────────────────────────────────── */

    @Test
    fun `enthaelt den Klartext nirgends`() {
        val json = sealVault("GitHub: JBSWY3DPEHPK3PXP", "pass", fast).toJson()
        assertFalse(json.contains("JBSWY3DPEHPK3PXP"))
        assertFalse(json.contains("GitHub"))
    }

    @Test
    fun `enthaelt die Passphrase nirgends`() {
        val json = sealVault(secrets, "streng-geheim-42", fast).toJson()
        assertFalse(json.contains("streng-geheim-42"))
    }

    @Test
    fun `benennt Verfahren und Version offen`() {
        // Das ist kein Geheimnis — im Gegenteil: Wer den Umschlag ansieht,
        // soll nachvollziehen koennen, womit er verschluesselt wurde.
        val envelope = sealVault(secrets, "pass", fast)
        assertEquals("PBKDF2-SHA-256", envelope.kdf)
        assertEquals(VAULT_VERSION, envelope.v)
    }

    /* ── Salt und IV sind bei jedem Speichervorgang frisch ────────────── */

    @Test
    fun `erzeugt fuer gleichen Inhalt zwei verschiedene Umschlaege`() {
        val a = sealVault(secrets, "pass", fast)
        val b = sealVault(secrets, "pass", fast)

        assertNotEquals(a.salt, b.salt)
        assertNotEquals(a.iv, b.iv)
        // Der entscheidende Punkt: Auch das Chiffrat unterscheidet sich. Waeren
        // IV oder Salt wiederverwendet, saehe man hier zweimal dasselbe — und
        // bei GCM ist eine IV-Wiederverwendung ein katastrophaler Fehler.
        assertNotEquals(a.data, b.data)
    }

    @Test
    fun `benutzt 16 Byte Salt und 12 Byte IV`() {
        val envelope = sealVault(secrets, "pass", fast)
        assertEquals(16, Base64.getDecoder().decode(envelope.salt).size)
        assertEquals(12, Base64.getDecoder().decode(envelope.iv).size)
    }

    /* ── Falsche Passphrase ───────────────────────────────────────────── */

    @Test
    fun `weist eine falsche Passphrase ab`() {
        val envelope = sealVault(secrets, "richtig", fast)
        assertKey("err.vault.openFailed") { openVault(envelope, "falsch") }
    }

    @Test
    fun `weist auch ein einziges falsches Zeichen ab`() {
        val envelope = sealVault(secrets, "passphrase", fast)
        assertKey("err.vault.openFailed") { openVault(envelope, "passphrasE") }
    }

    @Test
    fun `lehnt eine leere Passphrase ab`() {
        assertKey("vault.error.noPassphrase") { sealVault(secrets, "", fast) }
    }

    /* ── Manipulierter Umschlag: die GCM-Authentifizierung muss anschlagen ── */

    /** Kippt ein einzelnes Bit in einem base64-codierten Feld. */
    private fun flipBit(base64: String, byteIndex: Int): String {
        val bytes = Base64.getDecoder().decode(base64)
        val index = if (byteIndex < 0) bytes.size + byteIndex else byteIndex
        bytes[index] = (bytes[index].toInt() xor 0b0000_0001).toByte()
        return Base64.getEncoder().encodeToString(bytes)
    }

    @Test
    fun `erkennt ein gekipptes Bit im Chiffrat`() {
        val envelope = sealVault(secrets, "pass", fast)
        val tampered = envelope.copy(data = flipBit(envelope.data, 0))
        assertKey("err.vault.openFailed") { openVault(tampered, "pass") }
    }

    @Test
    fun `erkennt ein gekipptes Bit im Authentifizierungs-Tag am Ende`() {
        val envelope = sealVault(secrets, "pass", fast)
        val tampered = envelope.copy(data = flipBit(envelope.data, -1))
        assertKey("err.vault.openFailed") { openVault(tampered, "pass") }
    }

    @Test
    fun `erkennt einen veraenderten IV`() {
        val envelope = sealVault(secrets, "pass", fast)
        assertKey("err.vault.openFailed") {
            openVault(envelope.copy(iv = flipBit(envelope.iv, 0)), "pass")
        }
    }

    @Test
    fun `erkennt ein veraendertes Salt`() {
        val envelope = sealVault(secrets, "pass", fast)
        assertKey("err.vault.openFailed") {
            openVault(envelope.copy(salt = flipBit(envelope.salt, 0)), "pass")
        }
    }

    @Test
    fun `erkennt eine heruntergeschriebene Iterationszahl`() {
        // Der eigentliche Zweck der AAD: Ohne sie koennte ein Angreifer die
        // gespeicherten 600.000 auf 1 setzen und danach 600.000-mal billiger
        // raten. Mit AAD schlaegt die Entschluesselung fehl.
        val envelope = sealVault(secrets, "pass", fast)
        assertKey("err.vault.openFailed") { openVault(envelope.copy(iterations = 1), "pass") }
    }

    @Test
    fun `erkennt ein abgeschnittenes Chiffrat`() {
        val envelope = sealVault(secrets, "pass", fast)
        val bytes = Base64.getDecoder().decode(envelope.data).dropLast(4).toByteArray()
        val tampered = envelope.copy(data = Base64.getEncoder().encodeToString(bytes))
        assertKey("err.vault.openFailed") { openVault(tampered, "pass") }
    }

    /* ── Kaputte Eingaben ─────────────────────────────────────────────── */

    @Test
    fun `weist eine unbekannte Version zurueck`() {
        val envelope = sealVault(secrets, "pass", fast)
        val error = capture { openVault(envelope.copy(v = 99), "pass") }
        assertEquals("err.vault.version", error.key)
        assertEquals("99", error.args["version"])
        assertEquals("1", error.args["expected"])
    }

    @Test
    fun `weist ungueltiges Base64 zurueck`() {
        val envelope = sealVault(secrets, "pass", fast)
        val error = capture { openVault(envelope.copy(salt = "kein base64 !!"), "pass") }
        assertEquals("err.vault.base64", error.key)
        assertEquals("salt", error.args["field"])
    }

    @Test
    fun `erkennt ein fremdes Verfahren nicht als Umschlag`() {
        assertFalse(isVaultEnvelope(VaultEnvelope(1, "scrypt", 1, "", "", "")))
        assertTrue(isVaultEnvelope(VaultEnvelope(1, "PBKDF2-SHA-256", 1, "", "", "")))
    }

    @Test
    fun `erkennt Fremdtexte nicht als Umschlag`() {
        // Gegenstueck zu `isVaultEnvelope(null / 'text' / {})` im Web: Dort
        // kommt ein `unknown` herein, hier ein Text aus dem localStorage.
        for (text in listOf("", "text", "{}", "[]", "{\"v\":1}", "nicht mal JSON")) {
            assertEquals("\"$text\"", null, VaultEnvelope.fromJsonOrNull(text))
        }
    }

    /* ── Parameterstaerke ─────────────────────────────────────────────── */

    @Test
    fun `benutzt in der App 600000 PBKDF2-Iterationen`() {
        // OWASP-Empfehlung fuer PBKDF2-SHA-256. Dieser Test ist eine Sperre
        // gegen ein spaeteres „mach das mal schneller".
        assertEquals(600_000, PBKDF2_ITERATIONS)
    }

    @Test
    fun `schreibt ohne Option die vollen Iterationen in den Umschlag`() {
        // Der einzige Test mit voller Staerke — er dauert entsprechend.
        val envelope = sealVault("x", "pass")
        assertEquals(PBKDF2_ITERATIONS, envelope.iterations)
        assertEquals("x", openVault(envelope, "pass"))
    }
}

/**
 * Die Cross-Fixtures — der eigentliche Beweis, dass das Format ueber die
 * Sprachgrenze traegt.
 *
 * Richtung (a) laeuft hier: Node hat versiegelt (`scripts/native-vault-fixture.mjs
 * generate`), Kotlin oeffnet. Richtung (b) beginnt hier und endet in Node: Der
 * letzte Test versiegelt in Kotlin und legt die Umschlaege unter `build/` ab;
 * `native-vault-fixture.mjs verify` macht sie danach auf.
 *
 * Beide Richtungen zusammen sind der Beweis. Eine allein waere keiner — ein
 * gemeinsamer Denkfehler faellt nur auf, wenn jede Seite einmal Schreiber und
 * einmal Leser ist.
 */
class VaultCrossFixtureTest {

    private data class Fixture(
        val name: String,
        val passphrase: String,
        val plaintext: String,
        val envelope: VaultEnvelope,
    )

    /**
     * Liest die Fixtures mit `core/Json.kt` — also mit genau dem Leser, der
     * spaeter auch den echten Umschlag liest. Deshalb ist die Datei JSONL mit
     * FLACHEN Objekten: Ein verschachteltes Fixture haette einen zweiten Leser
     * gebraucht, der nie im Einsatz ist und darum nichts beweist.
     */
    private fun readFixtures(): List<Fixture> {
        val stream = javaClass.classLoader?.getResourceAsStream("vault-fixtures.jsonl")
        requireNotNull(stream) {
            "vault-fixtures.jsonl fehlt. Erzeugen mit: " +
                "node scripts/native-vault-fixture.mjs generate"
        }
        return stream.bufferedReader(Charsets.UTF_8).useLines { lines ->
            lines.filter { it.isNotBlank() }.map { line ->
                val row = Json.parseObject(line)
                Fixture(
                    name = row.text("name")!!,
                    passphrase = row.text("passphrase")!!,
                    plaintext = row.text("plaintext")!!,
                    envelope = VaultEnvelope(
                        v = row.number("v")!!.toInt(),
                        kdf = row.text("kdf")!!,
                        iterations = row.number("iterations")!!.toInt(),
                        salt = row.text("salt")!!,
                        iv = row.text("iv")!!,
                        data = row.text("data")!!,
                    ),
                )
            }.toList()
        }
    }

    @Test
    fun `die Fixture-Datei enthaelt die erwarteten Faelle`() {
        // Ohne diese Zeile liefe eine leere oder halbe Datei gruen durch — der
        // Beweis waere dann keiner. Dieselbe Vorsichtsmassnahme wie bei den
        // RFC-Vektortabellen.
        val names = readFixtures().map { it.name }
        assertEquals(
            listOf("ascii", "nicht-ascii", "leerer-klartext", "volle-iterationen"),
            names,
        )
    }

    @Test
    fun `Richtung a — Node versiegelt, Kotlin oeffnet`() {
        var checked = 0
        for (fixture in readFixtures()) {
            assertEquals(
                "Fixture ${fixture.name}",
                fixture.plaintext,
                openVault(fixture.envelope, fixture.passphrase),
            )
            checked++
        }
        assertEquals(4, checked)
    }

    @Test
    fun `Richtung a — eine falsche Passphrase oeffnet ein Node-Fixture nicht`() {
        // Gegenprobe: Wuerde `openVault` in Wahrheit gar nicht entschluesseln,
        // sondern etwas durchreichen, liefe der Test oben ebenfalls gruen.
        val fixture = readFixtures().first()
        assertKey("err.vault.openFailed") {
            openVault(fixture.envelope, fixture.passphrase + "x")
        }
    }

    @Test
    fun `Richtung b — Kotlin versiegelt fuer Node`() {
        // Die Datei landet unter build/ und ist damit nicht eingecheckt: Sie
        // ist ein Zwischenergebnis, kein Quelltext. Geprueft wird sie im
        // Anschluss mit `node scripts/native-vault-fixture.mjs verify`.
        val fixtures = readFixtures()
        val target = File("build/native-vault-kotlin.jsonl")
        target.parentFile?.mkdirs()

        target.bufferedWriter(Charsets.UTF_8).use { writer ->
            for (fixture in fixtures) {
                // Bewusst NICHT der Umschlag aus dem Fixture, sondern ein
                // frisch in Kotlin versiegelter — mit demselben Klartext und
                // derselben Passphrase. Nur so schreibt wirklich Kotlin.
                val sealed = sealVault(
                    fixture.plaintext,
                    fixture.passphrase,
                    SealOptions(iterations = fixture.envelope.iterations),
                )
                writer.write(
                    Json.writeObject(
                        linkedMapOf(
                            "name" to Json.Value.Text(fixture.name),
                            "passphrase" to Json.Value.Text(fixture.passphrase),
                            "plaintext" to Json.Value.Text(fixture.plaintext),
                            "v" to Json.Value.Number(sealed.v.toDouble()),
                            "kdf" to Json.Value.Text(sealed.kdf),
                            "iterations" to Json.Value.Number(sealed.iterations.toDouble()),
                            "salt" to Json.Value.Text(sealed.salt),
                            "iv" to Json.Value.Text(sealed.iv),
                            "data" to Json.Value.Text(sealed.data),
                        ),
                    ),
                )
                writer.write("\n")
            }
        }

        assertTrue("Die Datei fuer Node muss entstanden sein", target.length() > 0)
    }
}
