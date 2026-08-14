package io.github.keco216.clockwork.core

import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

/**
 * Verschluesselter Tresor — strikt opt-in, und BYTE-KOMPATIBEL zur
 * Web-Fassung.
 *
 * ── Die Ausgangslage ───────────────────────────────────────────────────────
 * Ohne Tresor ist diese App zustandslos: App zu, Secret weg. Das ist die
 * einfachste denkbare Sicherheitsaussage und deshalb die Voreinstellung. Wer
 * seine Secrets nicht bei jedem Start neu einfuegen will, gibt genau diese
 * Aussage auf — und bekommt dafuer etwas, das ohne Passphrase wertlos ist.
 *
 * ── Warum byte-kompatibel ──────────────────────────────────────────────────
 * Weil die native Fassung die WebView-Fassung ABLOESEN soll (P8). Ein Nutzer,
 * der aus dem GitHub-Release aktualisiert, muss seinen Tresor mit derselben
 * Passphrase weiter oeffnen koennen. Das Format ist deshalb kein neues, es ist
 * DASSELBE: gleiche Felder, gleiche Reihenfolge, gleiche AAD-Zeichenkette.
 *
 * ── Was gespeichert wird ───────────────────────────────────────────────────
 * Ausschliesslich der Umschlag: Salt, IV, Iterationszahl und Chiffrat. Kein
 * Klartext, keine Passphrase, kein abgeleiteter Schluessel.
 *
 * ── Warum PBKDF2 mit sehr vielen Iterationen ───────────────────────────────
 * Eine Passphrase hat viel weniger Entropie als ein 256-Bit-Schluessel. Wer den
 * Umschlag in die Haende bekommt, kann offline beliebig viele Passphrasen
 * durchprobieren — dagegen hilft nur, jeden einzelnen Versuch teuer zu machen.
 * 600.000 Iterationen sind die OWASP-Empfehlung fuer PBKDF2-SHA-256.
 *
 * Argon2id waere die bessere Wahl (speicherhart, also auch gegen GPUs teuer).
 * Im Web scheitert es an der Web Crypto API; hier scheitert es an derselben
 * Regel eine Ebene tiefer: Die JCE kennt es nicht, und eine mitgelieferte
 * Implementierung waere fremder Krypto-Code. Wir bleiben bei dem, was die
 * Plattform mitbringt — auf beiden Seiten dieselbe Entscheidung.
 *
 * ── Warum AES-GCM ─────────────────────────────────────────────────────────
 * GCM ist "authenticated encryption": Es verschluesselt UND erkennt jede
 * nachtraegliche Veraenderung. Wer ein Byte kippt, bekommt beim Entsperren
 * einen Fehler statt stillschweigend falscher Daten.
 *
 * ── Warum die Kopfdaten mitauthentifiziert werden ──────────────────────────
 * Die AAD bindet Version, Verfahren und Iterationszahl an das Chiffrat, ohne
 * sie zu verschluesseln. Ohne das koennte ein Angreifer die gespeicherte
 * Iterationszahl von 600.000 auf 1 herunterschreiben; die App wuerde beim
 * naechsten Aufsperren mit dieser Zahl ableiten, und das Durchprobieren waere
 * 600.000-mal billiger.
 */

/** OWASP-Empfehlung fuer PBKDF2-SHA-256. */
const val PBKDF2_ITERATIONS = 600_000

/**
 * Obergrenze fuer eine GELESENE Iterationszahl.
 *
 * ── Warum es sie geben muss ───────────────────────────────────────────────
 * Die Zahl kommt aus einer Datei, und `iterations` steht im Umschlag als
 * JSON-Zahl — also als `Double`. `1e20` wird beim Lesen zu `Int.MAX_VALUE`
 * (2 147 483 647), und die einzige Pruefung war bisher „mindestens 1". Ein
 * einziges verrutschtes Byte in `vault.json` liesse die App damit rund
 * 3500-mal so lange ableiten wie vorgesehen — praktisch fuer immer. Das
 * Ergebnis ist kein Fehler, sondern ein haengender Knopf; der Tresor waere
 * ohne „App-Daten loeschen" nicht mehr erreichbar, und mit dem Loeschen
 * waere er weg.
 *
 * Die AAD schuetzt hier NICHT: Sie bindet die Iterationszahl zwar an das
 * Chiffrat, aber gemerkt wird das erst beim Entschluesseln — also NACH der
 * Ableitung. Die Grenze muss davor stehen.
 *
 * ── Warum genau diese Zahl ────────────────────────────────────────────────
 * 10 Millionen ist reichlich sechzehnmal die eigene Vorgabe und liegt weit
 * ueber allem, was ein Werkzeug real schreibt — jeder echte Umschlag oeffnet
 * unveraendert weiter. Sie ist keine Sicherheitsschwelle, sondern eine
 * Plausibilitaetsgrenze: Was darueber steht, ist kaputt und nicht streng.
 *
 * ── Eine bewusste Abweichung von der Web-Fassung ──────────────────────────
 * `src/lib/vault.ts` prueft nur nach unten und ist seit v1 byte-identisch
 * eingefroren — dort aendert sich nichts. Die Abweichung geht in die
 * sichere Richtung: Diese Fassung lehnt einen Umschlag ab, den die
 * Web-Fassung stundenlang zu oeffnen versuchte.
 */
const val MAX_VAULT_ITERATIONS = 10_000_000

/** 128 Bit Salt — verhindert vorberechnete Tabellen ueber mehrere Tresore. */
private const val SALT_BYTES = 16

/**
 * 96 Bit IV. Das ist fuer GCM nicht irgendeine Laenge, sondern DIE Laenge: Bei
 * genau 96 Bit wird der Zaehlerblock direkt aus dem IV gebildet; bei jeder
 * anderen Laenge hasht GCM ihn erst, was nur Angriffsflaeche schafft.
 */
private const val IV_BYTES = 12

/**
 * 128 Bit Authentifizierungs-Tag.
 *
 * Diese Zahl ist der stillste Kompatibilitaetspunkt des ganzen Ports. Die Web
 * Crypto API hat KEINEN sichtbaren Parameter dafuer — ihr `tagLength` ist per
 * Voreinstellung 128, und das Tag haengt hinten am Chiffrat. Java verlangt die
 * Angabe ausdruecklich in `GCMParameterSpec`. Wer hier 96 oder 120 einsetzt,
 * bekommt zwei Formate, die stumm nicht zusammenpassen: Das Versiegeln laeuft,
 * das Oeffnen der jeweils anderen Fassung scheitert mit "falsche Passphrase" —
 * und man sucht den Fehler dann in der Passphrase. Genau dagegen stehen die
 * Cross-Fixtures.
 */
private const val GCM_TAG_BITS = 128

const val VAULT_VERSION = 1

const val VAULT_KDF = "PBKDF2-SHA-256"

/**
 * Was auf die Platte geht.
 *
 * Bewusst reines JSON mit base64-Feldern statt eines Binaerformats: Man kann es
 * mit einem Texteditor ansehen und nachvollziehen, dass da wirklich nichts
 * Lesbares drinsteht.
 */
data class VaultEnvelope(
    val v: Int,
    val kdf: String,
    val iterations: Int,
    val salt: String,
    val iv: String,
    val data: String,
) {
    /**
     * Serialisiert in exakt der Feldreihenfolge der Web-Fassung.
     *
     * Die Reihenfolge entsteht dort aus `{...header, salt, iv, data}`, also
     * v, kdf, iterations, salt, iv, data. Sie ist fuer die Krypto egal — die
     * AAD wird getrennt gebaut —, aber ein Umschlag, den beide Fassungen
     * gleich schreiben, laesst sich von Hand vergleichen.
     */
    fun toJson(): String = Json.writeObject(
        linkedMapOf(
            "v" to Json.Value.Number(v.toDouble()),
            "kdf" to Json.Value.Text(kdf),
            "iterations" to Json.Value.Number(iterations.toDouble()),
            "salt" to Json.Value.Text(salt),
            "iv" to Json.Value.Text(iv),
            "data" to Json.Value.Text(data),
        ),
    )

    companion object {
        /** Liest einen Umschlag. `null`, wenn der Text keiner ist. */
        fun fromJsonOrNull(text: String): VaultEnvelope? = try {
            val fields = Json.parseObject(text)
            val v = fields.number("v")
            val iterations = fields.number("iterations")
            val kdf = fields.text("kdf")
            val salt = fields.text("salt")
            val iv = fields.text("iv")
            val data = fields.text("data")
            if (v == null || kdf == null || iterations == null ||
                salt == null || iv == null || data == null
            ) {
                null
            } else {
                VaultEnvelope(v.toInt(), kdf, iterations.toInt(), salt, iv, data)
            }
        } catch (_: IllegalArgumentException) {
            null
        }
    }
}

/**
 * Prueft, ob ein Umschlag die erwartete Form hat.
 *
 * Gegenstueck zu `isVaultEnvelope` im Web. Dort prueft es einen `unknown`-Wert;
 * hier erzwingt der Typ die Felder schon, uebrig bleibt die inhaltliche Frage:
 * Ist das Verfahren das, das wir kennen?
 */
fun isVaultEnvelope(envelope: VaultEnvelope): Boolean = envelope.kdf == VAULT_KDF

class SealOptions(val iterations: Int = PBKDF2_ITERATIONS)

/**
 * Der abgeleitete Schluessel samt den zwei Angaben, aus denen er entstanden
 * ist.
 *
 * ── Warum es diesen Typ gibt, und warum erst seit P7 ──────────────────────
 * Die Web-Fassung haelt waehrend einer offenen Sitzung die PASSPHRASE im
 * Arbeitsspeicher (`sessionPassphrase` in vault-panel.ts) und leitet bei
 * jedem „Neu speichern" erneut ab. Nativ ist beides schlechter:
 *
 *  1. **Die Passphrase ist das wertvollere Geheimnis.** Sie oeffnet diesen
 *     Tresor UND vermutlich noch anderes; der abgeleitete Schluessel oeffnet
 *     nur diesen einen Umschlag. Was die Sitzung ueberlebt, sollte das
 *     kleinere von beidem sein.
 *  2. **Die Biometrie braucht genau diesen Schluessel.** Der Auftrag sagt
 *     ausdruecklich: eingewickelt wird der ABGELEITETE Schluessel, nie die
 *     Passphrase. Ohne diesen Typ muesste die Oberflaeche die Passphrase
 *     aufheben, um spaeter noch einmal ableiten zu koennen — also genau das
 *     Gegenteil.
 *  3. **600.000 Iterationen kosten Zeit.** Auf dem Geraet ist das rund eine
 *     halbe Sekunde. Ein „Neu speichern", das erneut ableitet, laesst den
 *     Knopf eine halbe Sekunde haengen, ohne dass sich am Schluessel etwas
 *     aendert.
 *
 * ── Was das Salt hier soll ────────────────────────────────────────────────
 * Es gehoert zum Schluessel, nicht zum Umschlag: Derselbe Schluessel entsteht
 * nur aus derselben Passphrase UND demselben Salt. Der Wickel der Biometrie
 * legt es deshalb mit ab — passt das Salt des gespeicherten Umschlags nicht
 * mehr zum Wickel, ist der Wickel veraltet und wird weggeworfen, statt beim
 * Aufsperren wortlos zu scheitern.
 */
class VaultKey(
    /** 32 Byte. Nach [clear] Nullen. */
    val bytes: ByteArray,
    val salt: ByteArray,
    val iterations: Int,
) {
    /**
     * Ueberschreibt den Schluessel mit Nullen.
     *
     * Die Grenze gehoert dazugesagt: Das raeumt GENAU dieses Feld. Kopien, die
     * `SecretKeySpec` oder der JCE-Provider intern angelegt haben, erreicht
     * niemand — die JVM gibt Speicher nicht auf Zuruf frei. Es ist also kein
     * Loeschen, sondern die Verkuerzung eines Zeitfensters; und die ist
     * billig genug, um sie mitzunehmen.
     */
    fun clear() {
        bytes.fill(0)
    }
}

/**
 * Leitet einen NEUEN Schluessel ab — mit frischem Salt.
 *
 * Das ist der Weg beim ersten Versiegeln und bei jedem Passphrasenwechsel.
 */
fun newVaultKey(passphrase: String, options: SealOptions = SealOptions()): VaultKey {
    assertPassphrase(passphrase)
    val salt = randomBytes(SALT_BYTES)
    return VaultKey(deriveKeyBytes(passphrase, salt, options.iterations), salt, options.iterations)
}

/**
 * Leitet den Schluessel eines VORHANDENEN Umschlags ab — mit dessen Salt und
 * dessen Iterationszahl.
 *
 * Ob die Passphrase stimmt, sagt dieser Aufruf NICHT: Zu jeder Passphrase
 * gehoert ein Schluessel, nur eben nicht der richtige. Das faellt erst beim
 * Entschluesseln auf, und genau dort steht die Meldung.
 */
fun deriveVaultKey(envelope: VaultEnvelope, passphrase: String): VaultKey {
    assertPassphrase(passphrase)
    assertEnvelope(envelope)
    val salt = fromBase64(envelope.salt, "salt")
    assertIterations(envelope.iterations)
    return VaultKey(
        deriveKeyBytes(passphrase, salt, envelope.iterations),
        salt,
        envelope.iterations,
    )
}

/**
 * Verschluesselt Klartext zu einem Umschlag.
 *
 * Salt und IV sind bei JEDEM Aufruf frisch. Beim IV ist das nicht Kosmetik:
 * Ein zweimal mit demselben Schluessel und demselben IV verwendetes GCM gibt
 * den XOR beider Klartexte preis und macht die Authentifizierung faelschbar.
 */
fun sealVault(
    plaintext: String,
    passphrase: String,
    options: SealOptions = SealOptions(),
): VaultEnvelope = sealVaultWithKey(plaintext, newVaultKey(passphrase, options))

/**
 * Versiegelt mit einem bereits abgeleiteten Schluessel.
 *
 * ── Das ist zugleich das „Neu speichern" der Web-Fassung ──────────────────
 * Wird hier der Schluessel der laufenden Sitzung uebergeben, entsteht ein
 * Umschlag mit DEMSELBEN Salt und derselben Iterationszahl, aber einem
 * frischen IV. Das ist kein Kompromiss, sondern die genaue Beschreibung des
 * Vorgangs: Der Schluessel hat sich nicht geaendert, der Inhalt schon.
 *
 * Das Salt bleiben zu lassen ist unbedenklich — es soll vorberechnete
 * Tabellen ueber MEHRERE Tresore verhindern und ist dafuer weiterhin
 * einmalig. Der IV dagegen MUSS frisch sein, und er ist es: Bei GCM waere
 * eine Wiederverwendung mit demselben Schluessel der eine Fehler, der alles
 * aufgibt.
 */
fun sealVaultWithKey(plaintext: String, key: VaultKey): VaultEnvelope {
    val iv = randomBytes(IV_BYTES)

    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, key.asSecretKey(), GCMParameterSpec(GCM_TAG_BITS, iv))
    cipher.updateAAD(headerBytes(VAULT_VERSION, VAULT_KDF, key.iterations))
    val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))

    return VaultEnvelope(
        v = VAULT_VERSION,
        kdf = VAULT_KDF,
        iterations = key.iterations,
        salt = toBase64(key.salt),
        iv = toBase64(iv),
        data = toBase64(ciphertext),
    )
}

/**
 * Entschluesselt einen Umschlag.
 *
 * @throws VaultError bei falscher Passphrase, veraendertem Chiffrat oder
 *   veraenderten Kopfdaten. Alle drei Faelle sehen von aussen absichtlich
 *   gleich aus: Eine Fehlermeldung, die verraet, WORAN es lag, waere fuer
 *   einen Angreifer ein Hinweis — und fuer den Nutzer ist die Antwort ohnehin
 *   dieselbe.
 */
fun openVault(envelope: VaultEnvelope, passphrase: String): String =
    openVaultWithKey(envelope, deriveVaultKey(envelope, passphrase))

/**
 * Entschluesselt mit einem bereits abgeleiteten Schluessel.
 *
 * Der Weg der Biometrie: Dort kommt der Schluessel aus dem Keystore-Wickel,
 * und eine Passphrase gibt es in diesem Moment gar nicht.
 */
fun openVaultWithKey(envelope: VaultEnvelope, key: VaultKey): String {
    assertEnvelope(envelope)

    val iv = fromBase64(envelope.iv, "iv")
    val data = fromBase64(envelope.data, "data")
    assertIterations(envelope.iterations)

    return try {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key.asSecretKey(), GCMParameterSpec(GCM_TAG_BITS, iv))
        cipher.updateAAD(headerBytes(envelope.v, envelope.kdf, envelope.iterations))
        String(cipher.doFinal(data), Charsets.UTF_8)
    } catch (_: Exception) {
        // Bewusst JEDE Ausnahme: AEADBadTagException bei falscher Passphrase
        // oder gekipptem Bit, IllegalArgumentException bei einem IV falscher
        // Laenge, ShortBufferException bei abgeschnittenem Chiffrat. Sie
        // unterscheiden zu wollen hiesse, dem Angreifer die Unterscheidung zu
        // schenken.
        throw VaultError("err.vault.openFailed")
    }
}

/* ── Innereien ──────────────────────────────────────────────────────────── */

/**
 * Leitet den Schluessel ab.
 *
 * ── Die Falle, die dieser Port beweisen muss ──────────────────────────────
 * Das Web uebergibt PBKDF2 die UTF-8-BYTES der Passphrase
 * (`TextEncoder().encode(passphrase)`). Java nimmt stattdessen ein `char[]`
 * und ueberlaesst dem Provider die Umrechnung. Fuer `PBKDF2WithHmacSHA256`
 * ist das UTF-8 — aber das steht in keiner Zusage, sondern in einer
 * Implementierung. Bei den aelteren `PBEWith...`-Verfahren ist es NICHT UTF-8,
 * sondern eine PKCS-Regel, die die oberen Bits wegwirft.
 *
 * Aus einer Doku laesst sich das nicht sicher ableiten, deshalb steht der
 * Beweis woanders: Die Cross-Fixtures versiegeln in Node und oeffnen hier —
 * mit einer Passphrase aus "Straße" und einem Emoji. Passte die Umrechnung
 * nicht, waere genau dieses Fixture rot und alle ASCII-Fixtures gruen.
 */
private fun deriveKeyBytes(passphrase: String, salt: ByteArray, iterations: Int): ByteArray {
    val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
    val spec = PBEKeySpec(passphrase.toCharArray(), salt, iterations, 256)
    return try {
        factory.generateSecret(spec).encoded
    } finally {
        // Raeumt die Kopie der Passphrase im Spec weg, soweit die Plattform es
        // zulaesst. Der `String`, aus dem sie kam, bleibt im Konstantenpool
        // liegen — das ist eine Grenze der JVM und keine, die sich hier
        // schliessen laesst. Ehrlich benannt statt uebergangen.
        spec.clearPassword()
    }
}

/**
 * Die Kopfdaten in genau der Form, in der sie authentifiziert werden.
 *
 * Feste Feldreihenfolge und von Hand zusammengesetzt — kein serialisiertes
 * Objekt: Die AAD muss beim Ver- und Entschluesseln Byte fuer Byte identisch
 * sein, und zwar ueber ZWEI Implementierungen hinweg. Diese eine Zeile ist der
 * Vertrag zwischen ihnen.
 */
private fun headerBytes(v: Int, kdf: String, iterations: Int): ByteArray =
    "v=$v;kdf=$kdf;it=$iterations".toByteArray(Charsets.UTF_8)

private fun assertPassphrase(passphrase: String) {
    if (passphrase.isEmpty()) {
        throw VaultError("vault.error.noPassphrase")
    }
}

private fun assertEnvelope(envelope: VaultEnvelope) {
    if (!isVaultEnvelope(envelope)) {
        throw VaultError("err.vault.badFormat")
    }
    if (envelope.v != VAULT_VERSION) {
        throw VaultError(
            "err.vault.version",
            mapOf("version" to envelope.v.toString(), "expected" to VAULT_VERSION.toString()),
        )
    }
}

/**
 * Eine Iterationszahl ausserhalb von 1 bis [MAX_VAULT_ITERATIONS] ist keine
 * Manipulation, sondern Unsinn — sie bekommt deshalb ihre EIGENE Meldung und
 * nicht die neutrale „Oeffnen fehlgeschlagen".
 *
 * Die Unterscheidung ist kein Widerspruch zur Regel weiter oben: Verschwiegen
 * wird, WORAN eine Entschluesselung gescheitert ist. Dass eine Datei
 * offensichtlich kaputt ist, verraet einem Angreifer nichts, was er nicht
 * ohnehin sieht.
 *
 * Die Reihenfolge ist der Punkt: Diese Pruefung steht in [deriveVaultKey] VOR
 * der Ableitung. Danach waere sie wertlos — die teure Rechnung ist dann
 * bereits gelaufen. Siehe [MAX_VAULT_ITERATIONS].
 */
private fun assertIterations(iterations: Int) {
    if (iterations < 1 || iterations > MAX_VAULT_ITERATIONS) {
        throw VaultError("err.vault.iterations", mapOf("value" to iterations.toString()))
    }
}

/**
 * Der Schluessel in der Form, die die JCE verlangt.
 *
 * Bewusst bei JEDEM Aufruf neu statt einmal im Feld: `SecretKeySpec` KOPIERT
 * die Bytes im Konstruktor. Ein Feld waere eine zweite, dauerhafte Kopie des
 * Schluessels, die [VaultKey.clear] nicht mehr erreicht — die Kopie hier lebt
 * nur bis zum Ende des Aufrufs.
 */
private fun VaultKey.asSecretKey(): SecretKeySpec = SecretKeySpec(bytes, "AES")

private fun randomBytes(length: Int): ByteArray =
    ByteArray(length).also { SecureRandom().nextBytes(it) }

/**
 * Standard-Base64 MIT Padding — so schreibt es `btoa` im Web, und der Umschlag
 * soll auf beiden Seiten gleich aussehen.
 */
private fun toBase64(bytes: ByteArray): String = Base64.getEncoder().encodeToString(bytes)

private fun fromBase64(text: String, field: String): ByteArray = try {
    Base64.getDecoder().decode(text)
} catch (_: IllegalArgumentException) {
    throw VaultError("err.vault.base64", mapOf("field" to field))
}
