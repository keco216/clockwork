package io.github.keco216.clockwork.scan

import org.junit.Assert.assertArrayEquals
import org.junit.Test

/**
 * Die zwei Faelle, die man keinem Standbild ansieht: Zeilen-Fuellwerk
 * (`rowStride > width`) und ein Pixelabstand ungleich 1. Beide Layouts sind
 * hier synthetisch gebaut, damit der Test nicht davon abhaengt, was ein
 * bestimmter Emulator gerade liefert.
 */
class LuminanceTest {
    @Test
    fun `deckungsgleiche Ebene wird unveraendert kopiert`() {
        val plane = byteArrayOf(1, 2, 3, 4, 5, 6)
        assertArrayEquals(plane, luminanceFromPlane(plane, rowStride = 3, pixelStride = 1, width = 3, height = 2))
    }

    @Test
    fun `Zeilen-Fuellwerk wird abgeschnitten`() {
        // rowStride 5 bei Breite 3: je Zeile zwei Byte Fuellwerk (99).
        val plane = byteArrayOf(
            1, 2, 3, 99, 99,
            4, 5, 6, 99, 99,
        )
        val expected = byteArrayOf(1, 2, 3, 4, 5, 6)
        assertArrayEquals(expected, luminanceFromPlane(plane, rowStride = 5, pixelStride = 1, width = 3, height = 2))
    }

    @Test
    fun `Pixelabstand 2 liest jede zweite Spalte`() {
        // Y-Werte auf den geraden Positionen, dazwischen Fremdbytes (77).
        val plane = byteArrayOf(
            1, 77, 2, 77, 3, 77,
            4, 77, 5, 77, 6, 77,
        )
        val expected = byteArrayOf(1, 2, 3, 4, 5, 6)
        assertArrayEquals(expected, luminanceFromPlane(plane, rowStride = 6, pixelStride = 2, width = 3, height = 2))
    }
}
