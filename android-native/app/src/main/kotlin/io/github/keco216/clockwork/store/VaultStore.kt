package io.github.keco216.clockwork.store

import io.github.keco216.clockwork.core.VaultEnvelope
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.nio.file.AtomicMoveNotSupportedException
import java.nio.file.Files
import java.nio.file.StandardCopyOption

/**
 * Der Tresor auf der Platte.
 *
 * ── Wo er liegt und warum genau dort ──────────────────────────────────────
 * `vault.json` im `filesDir` der App — dem privaten Verzeichnis, das nur
 * dieser App gehoert und mit ihr geloescht wird. Kein `SharedPreferences`,
 * kein `DataStore`, keine Datenbank: Der Inhalt ist EIN verschluesselter
 * Umschlag, und der ist eine Datei.
 *
 * Das Format ist das der Web-Fassung, Zeichen fuer Zeichen (siehe
 * `core/Vault.kt`). Das ist die Voraussetzung fuer P8: Wer von der
 * WebView-Fassung aktualisiert, bekommt seinen Umschlag hierher kopiert und
 * oeffnet ihn mit derselben Passphrase.
 *
 * ── `EncryptedSharedPreferences`? Geprueft und verworfen ──────────────────
 * Es waere die naheliegende Wahl und ist die falsche. Erstens ist es seit
 * androidx.security 1.1 als DEPRECATED gekennzeichnet, ohne Nachfolger.
 * Zweitens verschluesselt es mit einem Keystore-Schluessel, den das GERAET
 * haelt — der Tresor haengt dann am Geraet und nicht mehr an der Passphrase.
 * Das ist eine schwaechere Zusage als die, die hier steht, und sie waere von
 * aussen nicht zu unterscheiden.
 *
 * ── Warum das Schreiben umstaendlich aussieht ─────────────────────────────
 * `localStorage.setItem` im Web ist unteilbar: Entweder der neue Wert steht
 * da oder der alte. Eine Datei ist das nicht. Bricht der Schreibvorgang in
 * der Mitte ab — voller Speicher, Absturz, Akku leer —, bleibt eine halbe
 * `vault.json` liegen, und die ist genau so wertlos wie gar keine: Der Tresor
 * waere weg, obwohl niemand ihn geloescht hat.
 *
 * Deshalb der Umweg ueber eine Nebendatei samt `sync()` und einem atomaren
 * Ersetzen. `Files.move` mit `ATOMIC_MOVE` gibt es seit API 26 — genau der
 * Untergrenze dieser App.
 */
class VaultStore(private val dir: File) {

    private val file = File(dir, VAULT_FILE)
    private val temp = File(dir, "$VAULT_FILE.tmp")

    /**
     * Liest den Umschlag.
     *
     * `null` heisst „kein Tresor" — und zwar in jedem Fall, in dem sich kein
     * gueltiger Umschlag lesen laesst: Datei fehlt, Datei kaputt, fremdes
     * Format. Die Web-Fassung macht es genauso (`readEnvelope` faengt alles
     * ab), und der Grund ist derselbe: Der Zustand „off" ist bedienbar, ein
     * halb erkannter Tresor waere es nicht.
     */
    fun read(): VaultEnvelope? {
        val text = try {
            if (!file.exists()) return null
            file.readText(Charsets.UTF_8)
        } catch (_: IOException) {
            return null
        }
        return VaultEnvelope.fromJsonOrNull(text)
    }

    /** Ob ueberhaupt etwas gespeichert ist — ohne den Umschlag zu lesen. */
    fun exists(): Boolean = file.exists()

    /**
     * Schreibt den Umschlag.
     *
     * @return `false`, wenn es nicht geklappt hat. Der Aufrufer zeigt dann
     *   `native.vault.error.storageBlocked` — genau wie die Web-Fassung, bei
     *   der der Grund allerdings ein anderer ist (dort der private Modus,
     *   hier ein voller oder nicht beschreibbarer Speicher).
     */
    fun write(envelope: VaultEnvelope): Boolean = try {
        dir.mkdirs()
        FileOutputStream(temp).use { stream ->
            stream.write(envelope.toJson().toByteArray(Charsets.UTF_8))
            // Erst wenn die Bytes wirklich auf der Platte sind, darf der
            // Tausch passieren. Ohne `sync` haette man den umgekehrten Fall:
            // Das Umbenennen ist durch, der Inhalt aber noch im Cache — und
            // nach einem Stromausfall stuende eine leere Datei am Ziel.
            stream.fd.sync()
        }
        replaceAtomically(temp, file)
        true
    } catch (_: IOException) {
        temp.delete()
        false
    } catch (_: SecurityException) {
        temp.delete()
        false
    }

    /**
     * Loescht den Tresor.
     *
     * Die Nebendatei geht mit: Ein liegen gebliebener Rest waere der einzige
     * Ort, an dem nach „Alles loeschen" noch Chiffrat laege.
     */
    fun delete() {
        file.delete()
        temp.delete()
    }

    private companion object {
        const val VAULT_FILE = "vault.json"

        /**
         * Ersetzt das Ziel unteilbar.
         *
         * `File.renameTo` waere der kuerzere Weg und der falsche: Es
         * ueberschreibt ein vorhandenes Ziel nicht auf jedem Dateisystem und
         * meldet den Fehlschlag nur als `false`. `Files.move` sagt, was los
         * ist — und der Rueckfall darunter ist benannt statt stillschweigend:
         * Wo es kein atomares Umbenennen gibt, ist ein ersetzendes besser als
         * gar keines.
         */
        fun replaceAtomically(from: File, to: File) {
            try {
                Files.move(
                    from.toPath(),
                    to.toPath(),
                    StandardCopyOption.REPLACE_EXISTING,
                    StandardCopyOption.ATOMIC_MOVE,
                )
            } catch (_: AtomicMoveNotSupportedException) {
                Files.move(from.toPath(), to.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }
        }
    }
}
