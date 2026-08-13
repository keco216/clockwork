package io.github.keco216.clockwork.scan

import com.google.zxing.BinaryBitmap
import com.google.zxing.DecodeHintType
import com.google.zxing.LuminanceSource
import com.google.zxing.PlanarYUVLuminanceSource
import com.google.zxing.RGBLuminanceSource
import com.google.zxing.ReaderException
import com.google.zxing.common.HybridBinarizer
import com.google.zxing.qrcode.QRCodeReader

/**
 * QR-Dekodierung ueber ZXing — das native Gegenstueck zu `ui/qr-decode.ts`.
 *
 * ── Warum `QRCodeReader` und nicht `MultiFormatReader` ────────────────────
 * Die App liest GENAU EINE Symbologie. Der MultiFormatReader probierte je
 * Bild auch EAN, Code128 und ein Dutzend weitere Formate durch — Arbeit fuer
 * Faelle, die es hier nicht gibt, und jede zusaetzliche Symbologie ist eine
 * zusaetzliche Fehldeutungs-Chance. Das ist die „nur QR"-Entscheidung aus dem
 * Auftrag, im Typ festgehalten statt in einem Hint.
 *
 * ── Warum beide Funktionen androidfrei sind ───────────────────────────────
 * ZXing core ist pures Java. Ohne einen einzigen Android-Import laesst sich
 * der komplette Dekodier-Weg als JVM-Test pruefen — inklusive der Fixtures,
 * die ein UNABHAENGIGER Encoder erzeugt hat (siehe QrDecodeTest). Die
 * Android-Seite (ImageProxy, Bitmap) liefert nur noch Rohdaten an.
 */

/**
 * Liest einen QR-Code aus einer Leuchtdichte-Ebene (der Kamera-Weg).
 *
 * Kein `TRY_HARDER`: Der Sucher bekommt ~8 Bilder je Sekunde, und ein
 * verpasstes Bild kostet nichts — das naechste kommt in 125 ms. Die teure
 * Suche lohnt erst bei einem Standbild, das es nur einmal gibt.
 */
fun decodeQrLuminance(luminance: ByteArray, width: Int, height: Int): String? =
    decode(
        PlanarYUVLuminanceSource(luminance, width, height, 0, 0, width, height, false),
        thorough = false,
    )

/**
 * Liest einen QR-Code aus ARGB-Pixeln (der „QR aus Bild"-Weg).
 *
 * Hier ist `TRY_HARDER` an: Ein gewaehltes Bild gibt es genau einmal, und
 * die Zehntelsekunde Mehrarbeit ist billiger als ein „kein QR erkennbar"
 * fuer einen Code, der nur schief im Bild haengt.
 */
fun decodeQrPixels(pixels: IntArray, width: Int, height: Int): String? =
    decode(RGBLuminanceSource(width, height, pixels), thorough = true)

/**
 * Der gemeinsame Kern: erst normal lesen, dann invertiert.
 *
 * Die zweite Lesart ist kein Luxus: Eine Einrichtungsseite im Dunkelmodus
 * zeigt den QR-Code hell auf dunkel, und ein Bildschirmfoto davon ist der
 * Normalfall des „QR aus Bild"-Wegs. jsQR probiert im Web beide Polaritaeten
 * von sich aus (`inversionAttempts: 'attemptBoth'` ist dort Voreinstellung);
 * ZXing braucht dafuer die ausdrueckliche zweite Runde. Sie laeuft nur, wenn
 * die erste nichts fand — im Trefferfall kostet sie nichts.
 */
private fun decode(source: LuminanceSource, thorough: Boolean): String? {
    val hints = if (thorough) mapOf(DecodeHintType.TRY_HARDER to true) else null

    for (candidate in listOf(source, source.invert())) {
        try {
            return QRCodeReader().decode(BinaryBitmap(HybridBinarizer(candidate)), hints).text
        } catch (_: ReaderException) {
            // Kein QR in dieser Lesart — die Ausnahme IST hier die normale
            // Antwort. ReaderException deckt NotFound, Checksum und Format ab;
            // alles davon heisst nur „in diesem Bild steht kein lesbarer QR".
        }
    }
    return null
}
