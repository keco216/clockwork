package io.github.keco216.clockwork.scan

import java.io.InputStream
import java.util.zip.Inflater

/**
 * Ein absichtlich kleiner PNG-Leser, NUR fuer die Test-Fixtures.
 *
 * ── Warum nicht javax.imageio ─────────────────────────────────────────────
 * Android-Unit-Tests KOMPILIEREN gegen android.jar, und Android hat kein
 * AWT — `javax.imageio` fehlt dort schon als Stub, obwohl der Test spaeter
 * auf einer Desktop-JVM laeuft, die es haette. Der Ausweg ist derselbe wie
 * im Web, wo `check-contrast.mjs` seine PNGs selbst liest: Fuer den EINEN
 * bekannten Fall (Bittiefe 8, RGBA, nicht verschachtelt — genau das schreibt
 * der Fixture-Encoder) ist das Format ueberschaubar, und `Inflater` liegt in
 * android.jar.
 *
 * Eine eigene Gegenprobe braucht der Leser nicht: Liest er auch nur eine
 * Zeile falsch, findet ZXing das Muster nicht, und der Test faellt sichtbar
 * durch — die Pruefung kann einen Unterschied also sehen.
 */
object PngFixture {
    class Pixels(val argb: IntArray, val width: Int, val height: Int)

    fun read(stream: InputStream): Pixels {
        val bytes = stream.readBytes()
        require(bytes.size > 8 && bytes[1].toInt() == 'P'.code && bytes[2].toInt() == 'N'.code) {
            "kein PNG"
        }

        var width = 0
        var height = 0
        val idat = mutableListOf<ByteArray>()

        var at = 8
        while (at + 8 <= bytes.size) {
            val length = readInt(bytes, at)
            val type = String(bytes, at + 4, 4, Charsets.US_ASCII)
            when (type) {
                "IHDR" -> {
                    width = readInt(bytes, at + 8)
                    height = readInt(bytes, at + 12)
                    require(bytes[at + 16].toInt() == 8) { "nur Bittiefe 8" }
                    require(bytes[at + 17].toInt() == 6) { "nur RGBA (Farbtyp 6)" }
                    require(bytes[at + 20].toInt() == 0) { "kein Interlacing" }
                }
                "IDAT" -> idat += bytes.copyOfRange(at + 8, at + 8 + length)
                "IEND" -> break
            }
            at += 12 + length // Laenge + Typ + Daten + CRC
        }

        require(width > 0 && height > 0) { "IHDR fehlt" }
        val raw = inflate(idat, (width * 4 + 1) * height)
        return Pixels(unfilterRgba(raw, width, height), width, height)
    }

    private fun readInt(bytes: ByteArray, at: Int): Int =
        ((bytes[at].toInt() and 0xFF) shl 24) or
            ((bytes[at + 1].toInt() and 0xFF) shl 16) or
            ((bytes[at + 2].toInt() and 0xFF) shl 8) or
            (bytes[at + 3].toInt() and 0xFF)

    private fun inflate(chunks: List<ByteArray>, expected: Int): ByteArray {
        val all = ByteArray(chunks.sumOf { it.size })
        var offset = 0
        for (chunk in chunks) {
            chunk.copyInto(all, offset)
            offset += chunk.size
        }

        val inflater = Inflater()
        inflater.setInput(all)
        val out = ByteArray(expected)
        var written = 0
        while (written < expected && !inflater.finished()) {
            val step = inflater.inflate(out, written, expected - written)
            if (step == 0 && inflater.needsInput()) break
            written += step
        }
        inflater.end()
        require(written == expected) { "PNG-Daten unvollstaendig: $written von $expected Byte" }
        return out
    }

    /**
     * Macht die fuenf Zeilenfilter rueckgaengig und liefert ARGB-Pixel.
     *
     * `a` ist der schon REKONSTRUIERTE linke Nachbar — die Zeile wird von
     * links nach rechts an Ort und Stelle entfiltert, deshalb stimmt der
     * Rueckgriff auf `current`.
     */
    private fun unfilterRgba(raw: ByteArray, width: Int, height: Int): IntArray {
        val stride = width * 4
        val out = IntArray(width * height)
        val previous = ByteArray(stride)
        val current = ByteArray(stride)

        for (row in 0 until height) {
            val rowStart = row * (stride + 1)
            val filter = raw[rowStart].toInt()
            raw.copyInto(current, 0, rowStart + 1, rowStart + 1 + stride)

            for (i in 0 until stride) {
                val x = current[i].toInt() and 0xFF
                val a = if (i >= 4) current[i - 4].toInt() and 0xFF else 0
                val b = previous[i].toInt() and 0xFF
                val c = if (i >= 4) previous[i - 4].toInt() and 0xFF else 0
                val value = when (filter) {
                    0 -> x
                    1 -> x + a
                    2 -> x + b
                    3 -> x + (a + b) / 2
                    4 -> x + paeth(a, b, c)
                    else -> error("Zeilenfilter $filter unbekannt")
                }
                current[i] = (value and 0xFF).toByte()
            }

            for (px in 0 until width) {
                val o = px * 4
                val r = current[o].toInt() and 0xFF
                val g = current[o + 1].toInt() and 0xFF
                val blue = current[o + 2].toInt() and 0xFF
                val alpha = current[o + 3].toInt() and 0xFF
                out[row * width + px] = (alpha shl 24) or (r shl 16) or (g shl 8) or blue
            }
            current.copyInto(previous)
        }
        return out
    }

    private fun paeth(a: Int, b: Int, c: Int): Int {
        val p = a + b - c
        val pa = kotlin.math.abs(p - a)
        val pb = kotlin.math.abs(p - b)
        val pc = kotlin.math.abs(p - c)
        return if (pa <= pb && pa <= pc) a else if (pb <= pc) b else c
    }
}
