package io.github.keco216.clockwork.scan

import com.google.zxing.BarcodeFormat
import com.google.zxing.common.BitMatrix
import com.google.zxing.qrcode.QRCodeWriter
import io.github.keco216.clockwork.core.parseMigrationUri
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Der Dekodier-Weg, ohne Emulator gemessen.
 *
 * Zwei Beweisarten, mit Absicht beide:
 *
 *  1. **Rundlauf** ueber ZXings eigenen Encoder (QRCodeWriter): prueft die
 *     Verkabelung — Luminanz-Aufbereitung, Hints, die invertierte zweite
 *     Lesart. Encoder und Decoder stammen aus derselben Bibliothek; ein
 *     Fehler, den beide Seiten gleich machen, bliebe hier unsichtbar.
 *  2. **Fremd-Fixtures** unter `src/test/resources/scan/`: erzeugt mit dem
 *     npm-Paket `qrcode` 1.5.4 — einem Encoder, der mit ZXing keine Zeile
 *     teilt. Das ist dieselbe Kreuzproben-Kultur wie bei den
 *     Tresor-Fixtures (Node versiegelt, Kotlin oeffnet). Die PNGs liest
 *     [PngFixture] — ein eigener Mini-Leser, weil android.jar kein
 *     javax.imageio kennt (Begruendung dort).
 *
 * Der otpauth-Fixture traegt den RFC-4226-Testschluessel: Dasselbe Bild dient
 * am Emulator als Virtual-Scene-Poster, und die dort gescannten Codes lassen
 * sich gegen `node -e` nachrechnen.
 */
class QrDecodeTest {
    private val otpauthUri =
        "otpauth://totp/Clockwork:proof?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=Clockwork"

    /* ── Rundlauf ueber den ZXing-Encoder ───────────────────────────────── */

    /** Rastert eine BitMatrix als Leuchtdichte: Schwarz 0, Weiss 255. */
    private fun luminanceOf(matrix: BitMatrix): ByteArray {
        val out = ByteArray(matrix.width * matrix.height)
        for (y in 0 until matrix.height) {
            for (x in 0 until matrix.width) {
                out[y * matrix.width + x] = if (matrix.get(x, y)) 0 else 0xFF.toByte()
            }
        }
        return out
    }

    private fun encoded(content: String, size: Int = 240): BitMatrix =
        QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, size, size)

    @Test
    fun `Kamera-Weg liest eine otpauth-URI aus der Leuchtdichte-Ebene`() {
        val matrix = encoded(otpauthUri)
        val text = decodeQrLuminance(luminanceOf(matrix), matrix.width, matrix.height)
        assertEquals(otpauthUri, text)
    }

    @Test
    fun `die invertierte zweite Lesart findet einen hell-auf-dunkel-Code`() {
        // Dunkelmodus-Bildschirmfoto: das Muster hell, der Grund dunkel.
        val matrix = encoded(otpauthUri)
        val inverted = luminanceOf(matrix).also {
            for (i in it.indices) it[i] = (it[i].toInt() xor 0xFF).toByte()
        }
        val text = decodeQrLuminance(inverted, matrix.width, matrix.height)
        assertEquals(otpauthUri, text)
    }

    @Test
    fun `Bild-Weg liest ARGB-Pixel`() {
        val matrix = encoded(otpauthUri)
        val pixels = IntArray(matrix.width * matrix.height) { index ->
            val x = index % matrix.width
            val y = index / matrix.width
            if (matrix.get(x, y)) 0xFF000000.toInt() else 0xFFFFFFFF.toInt()
        }
        assertEquals(otpauthUri, decodeQrPixels(pixels, matrix.width, matrix.height))
    }

    @Test
    fun `ein Bild ohne QR liefert null statt einer Ausnahme`() {
        val blank = ByteArray(240 * 240) { 0xFF.toByte() }
        assertNull(decodeQrLuminance(blank, 240, 240))
    }

    /* ── Fremd-Fixtures: unabhaengiger Encoder ──────────────────────────── */

    /** Laedt ein PNG-Fixture als ARGB-Pixel — der Weg des Photo Pickers. */
    private fun pixelsOf(resource: String): Triple<IntArray, Int, Int> {
        val stream = checkNotNull(javaClass.getResourceAsStream(resource)) {
            "Fixture $resource fehlt"
        }
        val image = stream.use { PngFixture.read(it) }
        return Triple(image.argb, image.width, image.height)
    }

    @Test
    fun `Fixture eines fremden Encoders wird gelesen (otpauth)`() {
        val (pixels, width, height) = pixelsOf("/scan/otpauth-qr.png")
        assertEquals(otpauthUri, decodeQrPixels(pixels, width, height))
    }

    @Test
    fun `Fixture eines fremden Encoders wird gelesen und expandiert (Migration)`() {
        // Der dokumentierte Beispiel-Export: ein TOTP-Konto
        // Example:alice@google.com mit dem Secret JBSWY3DPEHPK3PXP.
        val (pixels, width, height) = pixelsOf("/scan/migration-qr.png")
        val text = checkNotNull(decodeQrPixels(pixels, width, height))
        assertTrue(text.startsWith("otpauth-migration://offline?data="))

        // Und der gelesene Text laeuft durch DENSELBEN Weg wie im Web: erst
        // expandieren, dann wie getippte Zeilen behandeln.
        val result = parseMigrationUri(text)
        assertEquals(1, result.imported)
        assertTrue(result.lines.single().contains("secret=JBSWY3DPEHPK3PXP"))
    }
}
