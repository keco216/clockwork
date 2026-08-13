package io.github.keco216.clockwork.scan

/**
 * Holt die Leuchtdichte-Ebene aus einem YUV_420_888-Bild.
 *
 * Ein QR-Code ist ein Schwarz-Weiss-Muster — fuer die Erkennung genuegt die
 * Y-Ebene, die Farb-Ebenen (U/V) werden gar nicht erst angefasst. Genau so
 * arbeitet auch jsQR im Web: Es rechnet jedes Pixel zuerst auf Grau herunter.
 *
 * ── Warum das nicht einfach `buffer.copyOf()` ist ─────────────────────────
 * Die Ebene darf breiter sein als das Bild (`rowStride > width`) — Kameras
 * richten Zeilen gern an 16- oder 64-Byte-Grenzen aus, und am Zeilenende
 * steht dann Fuellwerk, das im Muster wie eine helle Stoerkante laege. Und
 * `pixelStride` ist fuer die Y-Ebene zwar praktisch immer 1, aber die
 * Plattform GARANTIERT das nicht — ein Geraet, das 2 liefert, wuerde mit
 * einer copyOf-Abkuerzung jedes zweite Pixel aus der falschen Spalte lesen.
 * Beides sieht man keinem Standbild an; deshalb steht die Funktion hier
 * androidfrei und hat einen JVM-Test mit genau diesen beiden Faellen.
 */
fun luminanceFromPlane(
    plane: ByteArray,
    rowStride: Int,
    pixelStride: Int,
    width: Int,
    height: Int,
): ByteArray {
    // Der haeufige Fall: Ebene und Bild sind deckungsgleich, die Kopie reicht.
    if (rowStride == width && pixelStride == 1) {
        return plane.copyOf(width * height)
    }

    val out = ByteArray(width * height)
    for (row in 0 until height) {
        val source = row * rowStride
        val target = row * width
        if (pixelStride == 1) {
            plane.copyInto(out, target, source, source + width)
        } else {
            for (column in 0 until width) {
                out[target + column] = plane[source + column * pixelStride]
            }
        }
    }
    return out
}
