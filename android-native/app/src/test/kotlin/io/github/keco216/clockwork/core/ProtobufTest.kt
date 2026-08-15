package io.github.keco216.clockwork.core

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

/**
 * Portiert aus dem Abschnitt „protobuf — der Leser selbst" in
 * `src/lib/google-auth.test.ts`.
 */
class ProtobufTest {

    private fun bytes(vararg values: Int) = ByteArray(values.size) { values[it].toByte() }

    @Test
    fun `liest ein einbytiges Varint`() {
        val fields = readMessage(bytes(0x08, 0x01)).toList() // Feld 1, Varint, Wert 1
        assertEquals(listOf(ProtobufField.Varint(1, 1L)), fields)
    }

    @Test
    fun `liest ein mehrbytiges Varint 300 als AC 02`() {
        val fields = readMessage(bytes(0x08, 0xac, 0x02)).toList()
        assertEquals(ProtobufField.Varint(1, 300L), fields[0])
    }

    @Test
    fun `liest 64-Bit-Werte ohne Praezisionsverlust`() {
        // 2^53 + 1 — im Web waere dieser Wert als `number` nicht mehr
        // darstellbar; hier zeigt er, dass der Leser wirklich mit Long rechnet
        // und nicht heimlich ueber einen Double geht.
        val big = 9_007_199_254_740_993L
        val encoded = mutableListOf(0x08)
        var rest = big
        do {
            var byte = (rest and 0x7f).toInt()
            rest = rest ushr 7
            if (rest > 0) byte = byte or 0x80
            encoded += byte
        } while (rest > 0)

        val fields = readMessage(ByteArray(encoded.size) { encoded[it].toByte() }).toList()
        assertEquals(ProtobufField.Varint(1, big), fields[0])
    }

    @Test
    fun `liest ein Laengen-Feld als Bytes`() {
        val fields = readMessage(bytes(0x12, 0x02, 0x41, 0x42)).toList() // Feld 2, "AB"
        val field = fields[0]
        assertEquals(2, field.field)
        assertArrayEquals(bytes(0x41, 0x42), (field as ProtobufField.Bytes).value)
    }

    @Test
    fun `liest mehrere Felder hintereinander`() {
        val fields = readMessage(bytes(0x08, 0x05, 0x10, 0x07)).toList()
        assertEquals(listOf(1, 2), fields.map { it.field })
    }

    @Test
    fun `erkennt abgeschnittene Daten`() {
        assertThrows(ProtobufError::class.java) { readMessage(bytes(0x08)).toList() }
        assertThrows(ProtobufError::class.java) { readMessage(bytes(0x12, 0x05, 0x41)).toList() }
    }

    @Test
    fun `erkennt ein endloses Varint`() {
        val endless = IntArray(13) { if (it == 0) 0x08 else 0xff }
        assertThrows(ProtobufError::class.java) {
            readMessage(ByteArray(endless.size) { endless[it].toByte() }).toList()
        }
    }

    @Test
    fun `lehnt Feldnummer 0 ab`() {
        val error = assertThrows(ProtobufError::class.java) {
            readMessage(bytes(0x00, 0x01)).toList()
        }
        assertEquals("Feldnummer 0 gibt es nicht", error.detail)
    }

    @Test
    fun `ein Protobuf-Fehler traegt die neutrale Auffangmeldung`() {
        // Wie im Web: Diese Fehler haben keinen eigenen Katalogeintrag.
        val error = assertThrows(ProtobufError::class.java) { readMessage(bytes(0x08)).toList() }
        assertEquals(KEY_UNREADABLE, error.key)
    }
}
