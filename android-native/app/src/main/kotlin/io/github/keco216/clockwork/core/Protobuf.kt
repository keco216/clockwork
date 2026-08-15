package io.github.keco216.clockwork.core

/**
 * Ein winziger Protobuf-Leser — genau so viel, wie der
 * Google-Authenticator-Export braucht.
 *
 * Keine Bibliothek: Protobuf-Pakete bringen Codegenerator, Schema-Laufzeit und
 * ein paar hundert Kilobyte mit. Fuer das Lesen von sechs Feldern ist der ganze
 * Apparat unnoetig — und fuer ein Lernprojekt ist das Wire-Format ohnehin
 * interessanter als jede Abstraktion darueber.
 *
 * ── Das Wire-Format in fuenf Saetzen ───────────────────────────────────────
 * Eine Protobuf-Nachricht ist eine Folge von Feldern ohne Rahmen und ohne
 * Ende-Markierung. Jedes Feld beginnt mit einem "Key", selbst ein Varint:
 *
 *     key = (feldnummer shl 3) or wire_type
 *
 * Die unteren drei Bit sagen, WIE der Wert codiert ist, der Rest sagt, WELCHES
 * Feld gemeint ist. Ein Leser, der einen Wire-Type kennt, kann jedes Feld
 * ueberspringen — auch eines, das er nicht versteht. Genau deshalb bleibt
 * Protobuf ueber Versionen hinweg kompatibel.
 *
 * ── Varint ────────────────────────────────────────────────────────────────
 * Kleine Zahlen sollen wenige Bytes kosten. Ein Varint speichert 7 Nutzbits
 * pro Byte; das oberste Bit ist die Fortsetzungsmarke:
 *
 *     0x01       -> 1     (ein Byte, MSB = 0, fertig)
 *     0xAC 0x02  -> 300   (0x2C = 0101100, 0x02 = 0000010
 *                          -> 0000010_0101100 = 300)
 *
 * Die Reihenfolge ist "little endian nach Gruppen": Die niedrigwertigsten
 * 7 Bit kommen zuerst. Genau das ist die Stelle, an der eigene
 * Implementierungen ueblicherweise falsch liegen.
 *
 * ── Warum `Long` und nicht `Int` ──────────────────────────────────────────
 * Protobuf erlaubt bis zu 64 Bit. Im Web steht hier `bigint`, weil ein
 * `number` ab 2^53 stillschweigend Praezision verliert. In Kotlin ist `Long`
 * die passende Groesse — aber SIGNED, und das ist beim Zusammensetzen die
 * Falle: `byte and 0x7f` muss VOR dem `toLong()` stehen, sonst schleppt ein
 * Byte ueber 0x7F sein Vorzeichen als 56 gesetzte Bits mit.
 */

/** Die Wire-Types, die im Export vorkommen. 3 und 4 (Gruppen) sind seit 2001 tot. */
const val WIRE_VARINT = 0
const val WIRE_FIXED64 = 1
const val WIRE_BYTES = 2
const val WIRE_FIXED32 = 5

/**
 * Ein gelesenes Feld. Als versiegelte Hierarchie statt eines Objekts mit
 * lauter optionalen Feldern: So kann der Aufrufer nicht versehentlich `bytes`
 * von einem Varint-Feld lesen.
 */
sealed class ProtobufField {
    abstract val field: Int

    data class Varint(override val field: Int, val value: Long) : ProtobufField()
    data class Bytes(override val field: Int, val value: ByteArray) : ProtobufField() {
        // ByteArray in einer data class braucht beides von Hand — sonst
        // vergleicht `equals` Referenzen und `hashCode` passt nicht dazu.
        override fun equals(other: Any?): Boolean =
            this === other ||
                (other is Bytes && field == other.field && value.contentEquals(other.value))

        override fun hashCode(): Int = 31 * field + value.contentHashCode()
    }

    data class Fixed32(override val field: Int, val value: Int) : ProtobufField()
    data class Fixed64(override val field: Int, val value: Long) : ProtobufField()
}

/**
 * Liest eine Nachricht Feld fuer Feld.
 *
 * Eine `Sequence`, keine Liste: Verschachtelte Nachrichten liest man damit
 * einfach rekursiv, ohne Zwischenlisten anzulegen — dasselbe, was im Web der
 * Generator tut.
 *
 * @throws ProtobufError bei abgeschnittenen oder unsinnigen Daten.
 */
fun readMessage(bytes: ByteArray): Sequence<ProtobufField> = sequence {
    var offset = 0

    while (offset < bytes.size) {
        val key = readVarint(bytes, offset)
        offset = key.offset

        val field = (key.value ushr 3).toInt()
        val wireType = (key.value and 0b111L).toInt()

        if (field == 0) {
            throw ProtobufError("Feldnummer 0 gibt es nicht")
        }

        when (wireType) {
            WIRE_VARINT -> {
                val varint = readVarint(bytes, offset)
                offset = varint.offset
                yield(ProtobufField.Varint(field, varint.value))
            }

            WIRE_BYTES -> {
                val length = readVarint(bytes, offset)
                offset = length.offset
                val size = length.value
                // `size` kommt aus den Daten und darf alles sein. Erst gegen
                // die Restlaenge pruefen, DANN in einen Int wandeln — sonst
                // faltet ein Wert jenseits von 2^31 stillschweigend um.
                if (size < 0 || size > bytes.size - offset) {
                    throw ProtobufError("Feld $field gibt $size Byte an, es sind weniger da")
                }
                val end = offset + size.toInt()
                yield(ProtobufField.Bytes(field, bytes.copyOfRange(offset, end)))
                offset = end
            }

            WIRE_FIXED32 -> {
                requireBytes(bytes, offset, 4, field)
                // Fixed-Felder sind LITTLE-Endian — anders als der HOTP-Zaehler.
                var value = 0
                for (i in 3 downTo 0) {
                    value = (value shl 8) or (bytes[offset + i].toInt() and 0xff)
                }
                yield(ProtobufField.Fixed32(field, value))
                offset += 4
            }

            WIRE_FIXED64 -> {
                requireBytes(bytes, offset, 8, field)
                var value = 0L
                for (i in 7 downTo 0) {
                    value = (value shl 8) or (bytes[offset + i].toLong() and 0xffL)
                }
                yield(ProtobufField.Fixed64(field, value))
                offset += 8
            }

            else -> throw ProtobufError("Unbekannter Wire-Type $wireType in Feld $field")
        }
    }
}

private class VarintResult(val value: Long, val offset: Int)

/**
 * Liest ein Varint ab `start` und liefert Wert und neue Position.
 *
 * Die Obergrenze von 10 Byte ist keine Willkuer: 64 Bit brauchen bei 7
 * Nutzbits pro Byte aufgerundet 10 Byte. Ohne diese Grenze wuerde eine Datei
 * aus lauter 0xFF-Bytes den Leser bis zum Dateiende weiterlaufen lassen.
 */
private fun readVarint(bytes: ByteArray, start: Int): VarintResult {
    var value = 0L
    var shift = 0
    var offset = start

    for (byteCount in 0 until 10) {
        if (offset >= bytes.size) {
            throw ProtobufError("Die Daten hoeren mitten in einer Zahl auf")
        }
        val byte = bytes[offset].toInt() and 0xff
        offset++

        // Die unteren 7 Bit sind Nutzlast. `.toLong()` erst NACH dem Maskieren
        // — siehe Kopfkommentar.
        value = value or ((byte and 0x7f).toLong() shl shift)

        if ((byte and 0x80) == 0) {
            return VarintResult(value, offset)
        }
        shift += 7
    }

    throw ProtobufError("Eine Zahl ist laenger als 10 Byte")
}

private fun requireBytes(bytes: ByteArray, offset: Int, count: Int, field: Int) {
    if (offset + count > bytes.size) {
        throw ProtobufError("Feld $field braucht $count Byte, es sind weniger da")
    }
}

/* ── Bequemlichkeiten fuer den Aufrufer ─────────────────────────────────── */

/** Ein `bytes`-Feld als UTF-8-Text. */
fun ProtobufField.asText(): String {
    if (this !is ProtobufField.Bytes) throw ProtobufError("Feld $field ist kein Text")
    return String(value, Charsets.UTF_8)
}

/** Ein Varint als `Int`. Fuer Enums und kleine Zahlen. */
fun ProtobufField.asNumber(): Int {
    if (this !is ProtobufField.Varint) throw ProtobufError("Feld $field ist keine Zahl")
    return value.toInt()
}
