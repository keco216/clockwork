package io.github.keco216.clockwork.core

import java.nio.ByteBuffer
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * HOTP — HMAC-based One-Time Password nach RFC 4226.
 * https://www.rfc-editor.org/rfc/rfc4226
 *
 * ── Die Grundidee in einem Satz ────────────────────────────────────────────
 * Server und Client kennen dasselbe Geheimnis (`secret`) und denselben Zaehler
 * (`counter`). Beide rechnen daraus mit HMAC eine Pruefsumme aus und schneiden
 * daraus 6 Ziffern heraus. Wer dieselben 6 Ziffern nennt, muss dasselbe
 * Geheimnis kennen — ohne es je zu verraten.
 *
 * ── Der Ablauf ─────────────────────────────────────────────────────────────
 *
 *   secret (Bytes)  -+
 *                    +-> HMAC-SHA-1 -> 20 Byte -> Truncation -> 31-Bit-Zahl
 *   counter (8 Byte)-+                                              |
 *                                                 modulo 10^6 ------+
 *                                                        |
 *                                                    "755224"
 *
 * ── Warum HMAC und nicht einfach SHA-1(secret || counter)? ─────────────────
 * Weil ein simples Hash-ueber-alles anfaellig fuer Length-Extension-Angriffe
 * ist: Wer H(secret || x) kennt, kann bei SHA-1 daraus H(secret || x || y)
 * berechnen, ohne das Secret zu kennen. HMAC hasht deshalb zweimal mit zwei
 * aus dem Secret abgeleiteten Padding-Bloecken und schliesst diese Klasse von
 * Angriffen aus.
 *
 * HMAC schreiben wir NICHT selbst — im Web ist es `crypto.subtle`, hier
 * `javax.crypto.Mac`. Das ist dieselbe Regel wie dort: die einzige geliehene
 * Krypto-Primitive, und zwar die des Systems.
 */

/**
 * Die Hash-Funktionen, die in der TOTP-Welt vorkommen.
 *
 * Der Enum traegt BEIDE Schreibweisen, weil beide gebraucht werden und sich
 * um genau einen Bindestrich unterscheiden: [uriName] ist die Form, die im
 * `otpauth://`-Parameter steht und die die Oberflaeche anzeigt (SHA1, SHA256);
 * [jceName] ist die Form, die `javax.crypto.Mac` erwartet. Im Web hiess das
 * Gegenstueck 'SHA-1', weil `crypto.subtle` es so schreibt — die Web Crypto
 * API und die JCE sind sich hier uneinig, und der Enum ist der Ort, an dem
 * diese Uneinigkeit genau einmal aufgeloest wird.
 *
 * MD5 fehlt bewusst: Die JCE kennt HmacMD5 zwar, aber der Google-Export
 * markiert MD5-Konten als Algorithmus 4, und die werden uebersprungen statt
 * falsch importiert — dieselbe Entscheidung wie im Web.
 */
enum class HashAlgorithm(val uriName: String, val jceName: String) {
    SHA1("SHA1", "HmacSHA1"),
    SHA256("SHA256", "HmacSHA256"),
    SHA512("SHA512", "HmacSHA512"),
    ;

    /** Die Schreibweise fuer die Anzeige — wie im Web: "SHA-1", "SHA-256". */
    val displayName: String
        get() = when (this) {
            SHA1 -> "SHA-1"
            SHA256 -> "SHA-256"
            SHA512 -> "SHA-512"
        }
}

/** Kleinste bzw. groesste Stellenzahl, die diese App erlaubt. */
const val MIN_DIGITS = 6
const val MAX_DIGITS = 8

/**
 * Prueft die Stellenzahl. 6-8 deckt alles ab, was real vorkommt.
 *
 * Die Obergrenze hat auch einen technischen Grund: Die Dynamic Truncation
 * liefert eine 31-Bit-Zahl (max. 2 147 483 647). Bei mehr als 9 Stellen waere
 * `zahl % 10^n` schlicht die Zahl selbst — die fuehrenden Stellen waeren dann
 * nicht mehr gleichverteilt, sondern immer klein.
 */
private fun assertDigits(digits: Int) {
    if (digits < MIN_DIGITS || digits > MAX_DIGITS) {
        throw OtpError(
            "err.otp.digits",
            mapOf(
                "value" to digits.toString(),
                "min" to MIN_DIGITS.toString(),
                "max" to MAX_DIGITS.toString(),
            ),
        )
    }
}

/**
 * Schritt 1 — Der Zaehler wird zu 8 Byte in Big-Endian (RFC 4226 nennt das
 * "the counter value ... 8-byte value").
 *
 * WARUM fest 8 Byte und Big-Endian? Weil HMAC ueber BYTES rechnet: Client und
 * Server muessen die Zahl bitgenau identisch darstellen, sonst kommen zwei
 * verschiedene Codes heraus. Ein Zaehler 1 als 4-Byte-Wert ergaebe eine andere
 * HMAC-Eingabe als derselbe Zaehler als 8-Byte-Wert.
 *
 *   counter = 1   -> 00 00 00 00 00 00 00 01
 *   counter = 256 -> 00 00 00 00 00 00 01 00
 *
 * Die Ueberladung mit [ULong] ist die eigentliche Primitive. Im Web nimmt
 * `counterToBytes` ein `bigint` und prueft von Hand gegen 2^64; in Kotlin
 * macht das der TYP — eine ULong kann gar nicht groesser werden, und ein
 * Zaehler 0xFFFFFFFFFFFFFFFF ist damit einfach darstellbar statt Fehlerfall.
 * `ByteBuffer.putLong` schreibt immer Big-Endian, unabhaengig vom Prozessor.
 */
fun counterToBytes(counter: ULong): ByteArray =
    ByteBuffer.allocate(8).putLong(counter.toLong()).array()

/**
 * Wie oben, aber fuer den Normalfall. Negative Zaehler gibt es nicht — im Web
 * ist das eine Laufzeitpruefung, hier bleibt sie es, weil `Long` das Vorzeichen
 * zulaesst.
 */
fun counterToBytes(counter: Long): ByteArray {
    if (counter < 0) {
        // KEY_UNREADABLE und kein eigener Schluessel: Auch im Web hat dieser
        // Fehler keinen Katalogeintrag — `lib-text.ts` kennt ihn nicht, er
        // landet dort also ebenfalls in der neutralen Auffangmeldung. Das ist
        // kein Versehen, sondern die richtige Stufe: Ein negativer Zaehler
        // entsteht nicht aus einer Nutzereingabe, sondern nur aus einem
        // Programmierfehler, und dafuer gibt es keinen huebschen Satz.
        throw OtpError(KEY_UNREADABLE)
    }
    return counterToBytes(counter.toULong())
}

/**
 * Schritt 2 — HMAC ueber die JCE.
 *
 * Im Web wird der Schluessel mit `extractable: false` importiert, damit selbst
 * der eigene Code ihn nicht mehr auslesen kann. Ein `SecretKeySpec` kann das
 * nicht zusagen — er HAELT die Bytes, und `getEncoded()` gibt sie heraus. Das
 * ist eine ehrliche Einbusse gegenueber der Web-Fassung und keine, die sich
 * hier reparieren liesse: Ein Schluessel im Android-Keystore koennte HMAC
 * zwar unauslesbar rechnen, aber das Secret muss zum Anlegen ohnehin durch den
 * Speicher — und es steht als Klartext im Textfeld, das die App zeigt. Wo der
 * Keystore wirklich etwas beitraegt, benutzt ihn P7 (Biometrie-Wickel).
 */
fun hmac(algorithm: HashAlgorithm, key: ByteArray, message: ByteArray): ByteArray {
    if (key.isEmpty()) {
        throw OtpError("err.otp.emptySecret")
    }
    val mac = Mac.getInstance(algorithm.jceName)
    mac.init(SecretKeySpec(key, algorithm.jceName))
    return mac.doFinal(message)
}

/**
 * Schritt 3 — "Dynamic Truncation" (RFC 4226, Abschnitt 5.3).
 *
 * Wir haben 20 Byte HMAC und brauchen 6 Ziffern. Man koennte die ersten 4 Byte
 * nehmen — aber dann laege die verwendete Stelle fuer immer fest. Deshalb
 * bestimmt der HMAC SELBST, welche 4 Byte gelten:
 *
 *   1. Die letzten 4 Bit des HMAC ergeben einen Offset 0-15.
 *   2. Ab diesem Offset werden 4 Byte als Big-Endian-Zahl gelesen.
 *   3. Das oberste Bit wird ausmaskiert (and 0x7FFFFFFF).
 *
 * Schritt 3 ist die Stelle, an der dieser Port eine Fussnote der RFC zum
 * eigenen Werkzeug macht: Das Bit wird ausmaskiert, WEIL es 1998 Sprachen ohne
 * vorzeichenlose 32-Bit-Zahlen gab — namentlich Java. Waere das oberste Bit
 * gesetzt, laese die eine Implementierung eine negative Zahl und die andere
 * eine positive, und `modulo` lieferte unterschiedliche Codes. Kotlin hat
 * genau diese signed Ints; hier steht also die Sprache, um derentwillen die
 * Regel existiert. Sie kostet uns dadurch nichts: `and 0x7fffffff` raeumt das
 * Vorzeichen weg, egal wie die vier Bytes aussahen.
 *
 * Der Offset ist maximal 15, gelesen werden 4 Byte -> es braucht mindestens
 * 20 Byte. Genau die Laenge von SHA-1. Bei SHA-256 (32 B) und SHA-512 (64 B)
 * fliessen die hinteren Bytes gar nicht ein — so will es RFC 6238.
 */
fun dynamicTruncate(hmacResult: ByteArray): Int {
    if (hmacResult.size < 20) {
        // Wie beim negativen Zaehler: kein Katalogeintrag im Web, also auch
        // hier keiner. Erreichbar ist der Fall ohnehin nur mit einem Hash,
        // den der Enum gar nicht anbietet.
        throw OtpError(KEY_UNREADABLE)
    }

    val offset = hmacResult[hmacResult.size - 1].toInt() and 0x0f
    val fourBytes =
        ((hmacResult[offset].toInt() and 0xff) shl 24) or
            ((hmacResult[offset + 1].toInt() and 0xff) shl 16) or
            ((hmacResult[offset + 2].toInt() and 0xff) shl 8) or
            (hmacResult[offset + 3].toInt() and 0xff)

    return fourBytes and 0x7fffffff
}

/**
 * Erzeugt einen HOTP-Code — die drei Schritte oben in Reihe.
 *
 * Rueckgabe ist bewusst ein String, kein Int: Fuehrende Nullen gehoeren zum
 * Code. Aus 42 wird "000042", und `42` waere schlicht falsch.
 */
fun generateHotp(
    secret: ByteArray,
    counter: Long,
    digits: Int = DEFAULT_DIGITS,
    algorithm: HashAlgorithm = DEFAULT_ALGORITHM,
): String {
    assertDigits(digits)

    val counterBytes = counterToBytes(counter)
    val mac = hmac(algorithm, secret, counterBytes)
    val truncated = dynamicTruncate(mac)

    // 10^digits als Long ausrechnen statt ueber Double-Potenzen: Bei 8 Stellen
    // waere `10.0.pow(8)` zwar exakt, aber eine Fliesskommazahl in einer
    // Rechnung, die ganzzahlig ist — und genau solche Uebergaenge erzeugen die
    // Rundungsfehler, die man in einem Code nie bemerkt, weil er nur falsch
    // aussieht und nicht kaputt.
    var modulus = 1L
    repeat(digits) { modulus *= 10 }

    return (truncated % modulus).toString().padStart(digits, '0')
}
