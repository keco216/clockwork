package io.github.keco216.clockwork.core

/**
 * Base32-Codec nach RFC 4648, Abschnitt 6.
 * https://www.rfc-editor.org/rfc/rfc4648#section-6
 *
 * ── WARUM ueberhaupt Base32? ───────────────────────────────────────────────
 * Ein TOTP-Secret ist in Wahrheit eine Folge roher Bytes (typisch 10 oder 20).
 * Damit man es abtippen, vorlesen oder in einen QR-Code packen kann, wird es
 * als Text codiert. Base64 waere kuerzer, benutzt aber Gross- UND
 * Kleinschreibung sowie "+" und "/" — beim Abtippen eine Fehlerquelle. Base32
 * benutzt nur A-Z und 2-7:
 *   - Gross-/Kleinschreibung ist egal (es gibt nur eine Variante),
 *   - die Ziffern 0, 1 und 8 fehlen bewusst, weil sie mit O, I/l und B
 *     verwechselt werden.
 *
 * ── WIE funktioniert es? ───────────────────────────────────────────────────
 * Das Alphabet hat 32 = 2^5 Zeichen, jedes traegt also genau 5 Bit.
 * Byte-Grenzen (8 Bit) und Zeichen-Grenzen (5 Bit) treffen sich erst beim
 * kleinsten gemeinsamen Vielfachen: 40 Bit = 5 Byte = 8 Zeichen. Dieser
 * 40-Bit-Block heisst "Quantum" und ist die Einheit, in der Base32 arbeitet.
 *
 *   Bytes    | 0 0 1 1 0 0 0 1 | 0 0 1 1 0 0 1 0 | ...   (je 8 Bit)
 *   Zeichen  | 0 0 1 1 0 | 0 0 1 0 0 | 1 1 0 0 1 | ...   (je 5 Bit)
 *                = 6         = 4        = 25
 *                -> 'G'      -> 'E'     -> 'Z'
 *
 * Ein unvollstaendiger Block wird beim Codieren mit "=" auf 8 Zeichen
 * aufgefuellt. Das "=" traegt keine Information — es sagt dem Decoder nur, wie
 * viele Bytes im letzten Block echt sind. Genau deshalb duerfen wir es beim
 * Decodieren ignorieren, und genau deshalb funktionieren Secrets ohne Padding.
 */

/** Das Alphabet aus RFC 4648 Tabelle 3. Der Index IST der 5-Bit-Wert. */
private const val ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

/** Umkehrung des Alphabets: Zeichen -> 5-Bit-Wert. Einmalig aufgebaut. */
private val CHAR_TO_VALUE: Map<Char, Int> =
    ALPHABET.withIndex().associate { (value, char) -> char to value }

/**
 * Laengen, die (mod 8) niemals ein gueltiges Base32-Quantum ergeben koennen.
 * Aus n Zeichen entstehen floor(n*5/8) Bytes; fuer Rest 1, 3 und 6 bliebe mehr
 * als ein volles Byte an "Restbits" uebrig — das waere nie so codiert worden.
 * Gueltige Reste sind also nur 0, 2, 4, 5 und 7.
 */
private val IMPOSSIBLE_LENGTH_REMAINDERS = setOf(1, 3, 6)

/**
 * Decodiert einen Base32-String zu Bytes.
 *
 * Bewusst tolerant, weil echte Anbieter ihre Secrets sehr unterschiedlich
 * ausliefern: Kleinbuchstaben, Leerzeichen und Bindestriche als Lesehilfe,
 * fehlendes "="-Padding. Bewusst streng bei allem, was auf einen echten
 * Tippfehler hindeutet.
 *
 * @throws Base32Error
 */
fun decodeBase32(input: String): ByteArray {
    // ── Schritt 1: normalisieren ──────────────────────────────────────────
    // Whitespace (auch Zeilenumbrueche aus Copy&Paste) und Bindestriche raus,
    // alles auf Grossbuchstaben.
    //
    // `uppercase()` ohne Locale ist in Kotlin seit 1.5 SPRACHUNABHAENGIG, und
    // das ist hier keine Nebensache: Mit tuerkischem Locale wuerde 'i' zu 'İ'
    // (I mit Punkt) und jedes Secret mit einem i waere ploetzlich kaputt —
    // genau die Falle, die im Web `toLocaleLowerCase()` ohne Sprachangabe
    // beim Filter geschlagen hat, nur andersherum.
    val cleaned = buildString(input.length) {
        for (char in input) {
            if (!char.isWhitespace() && char != '-') append(char)
        }
    }.uppercase()

    // ── Schritt 2: Padding abschneiden und pruefen ────────────────────────
    // Bewusst eine Schleife statt eines Regex `=+$`. Im Web hatte genau dieser
    // Ausdruck quadratische Laufzeit (80 000 Zeichen ~ 1,8 s, ein
    // eingefrorener Tab durch einen unbedachten Copy&Paste). Javas
    // Regex-Maschine hat dasselbe Rueckzugsverhalten — die Schleife ist linear
    // und obendrein leichter zu lesen. Der Laufzeit-Test aus base32.test.ts
    // ist mit portiert.
    var end = cleaned.length
    while (end > 0 && cleaned[end - 1] == '=') {
        end--
    }
    val data = cleaned.substring(0, end)

    if (data.contains('=')) {
        throw Base32Error("err.base32.paddingInside")
    }
    if (data.isEmpty()) {
        throw Base32Error("err.base32.empty")
    }

    // ── Schritt 3: Zeichen pruefen ────────────────────────────────────────
    // Bewusst VOR der Laengenpruefung: Ein Tippfehler-Zeichen macht meist auch
    // die Laenge kaputt, aber "ungueltiges Zeichen >>0<< an Stelle 5" hilft
    // beim Suchen ungleich mehr als "ungueltige Laenge".
    for (i in data.indices) {
        val char = data[i]
        if (!CHAR_TO_VALUE.containsKey(char)) {
            throw Base32Error(
                "err.base32.badChar",
                mapOf("char" to char.toString(), "position" to (i + 1).toString()),
            )
        }
    }

    if (data.length % 8 in IMPOSSIBLE_LENGTH_REMAINDERS) {
        throw Base32Error("err.base32.badLength", mapOf("length" to data.length.toString()))
    }

    // ── Schritt 4: Bit-Eimer ──────────────────────────────────────────────
    // Pro Zeichen 5 Bit in einen Zwischenspeicher schaufeln und immer dann ein
    // ganzes Byte herausholen, wenn mindestens 8 Bit drin liegen.
    //
    // `Int` genuegt: Im Eimer liegen nie mehr als 12 Bit, das Vorzeichenbit
    // ist also nie in Gefahr. An den Stellen, an denen Kotlins signed Ints
    // wirklich beissen — Truncation und Protobuf-Varints —, steht dafuer
    // ausdruecklich `Long`.
    val bytes = ByteArray((data.length * 5) / 8)
    var bitBuffer = 0
    var bitCount = 0
    var byteIndex = 0

    for (char in data) {
        val value = CHAR_TO_VALUE.getValue(char)
        bitBuffer = (bitBuffer shl 5) or value
        bitCount += 5

        if (bitCount >= 8) {
            bitCount -= 8
            bytes[byteIndex++] = ((bitBuffer ushr bitCount) and 0xff).toByte()
        }
    }

    // Uebrig bleiben 0-7 Bit. Laut RFC muessten sie alle 0 sein. Wir verwerfen
    // sie stillschweigend, statt zu meckern: Manche Anbieter erzeugen Secrets
    // mit "krummen" Laengen, und jede etablierte Authenticator-App akzeptiert
    // die. Ein harter Fehler wuerde hier nur funktionierende Secrets kaputt
    // machen.
    return bytes
}

/**
 * Codiert Bytes als Base32. Gegenstueck zu [decodeBase32].
 *
 * Die App braucht das an genau einer Stelle — der Google-Import muss rohe
 * Secret-Bytes in eine `otpauth://`-URI schreiben — und die Tests brauchen es
 * fuer Round-trips. Hier laeuft der Bit-Eimer andersherum: 8 Bit rein, 5 raus.
 */
fun encodeBase32(bytes: ByteArray, padding: Boolean = true): String {
    val output = StringBuilder()
    var bitBuffer = 0
    var bitCount = 0

    for (byte in bytes) {
        // `and 0xff` ist Pflicht: Kotlins Byte ist SIGNED, aus 0xDE wuerde
        // sonst -34 und der Bit-Eimer liefe mit gesetzten oberen Bits voll.
        bitBuffer = (bitBuffer shl 8) or (byte.toInt() and 0xff)
        bitCount += 8
        while (bitCount >= 5) {
            bitCount -= 5
            output.append(ALPHABET[(bitBuffer ushr bitCount) and 0b11111])
        }
    }

    // Restbits (1-4 Stueck) mit Nullen nach links auf 5 Bit auffuellen.
    if (bitCount > 0) {
        output.append(ALPHABET[(bitBuffer shl (5 - bitCount)) and 0b11111])
    }

    if (padding) {
        while (output.length % 8 != 0) {
            output.append('=')
        }
    }

    return output.toString()
}
