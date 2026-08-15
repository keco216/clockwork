package io.github.keco216.clockwork.core

import java.io.ByteArrayOutputStream

/**
 * Prozent-Codierung mit `decodeURIComponent`-Semantik — selbst geschrieben,
 * und zwar aus einem gemessenen Grund.
 *
 * ── Warum nicht `URLDecoder.decode`? ───────────────────────────────────────
 * Weil es `+` als Leerzeichen liest. Das ist die
 * `application/x-www-form-urlencoded`-Regel fuer FORMULARE, und sie ist in
 * einer URI schlicht falsch. Im Web hat genau dieser Fehler zugeschlagen:
 * `URLSearchParams` zerstoert das `data`-Feld eines Google-Exports, weil
 * Standard-Base64 `+`-Zeichen enthaelt — aus einem gueltigen Export wird
 * stillschweigend Muell. `google-auth.ts` schneidet den Rohwert deshalb von
 * Hand heraus.
 *
 * Auf Android gibt es dieselbe Falle gleich zweimal: `URLDecoder.decode` und
 * `android.net.Uri.getQueryParameter` deuten beide `+` als Leerzeichen. Also
 * wird hier decodiert, nicht dort.
 *
 * ── Ein bewusster Unterschied zur Web-Fassung ──────────────────────────────
 * Das Web liest die otpauth-PARAMETER ueber `URLSearchParams` — dort wird ein
 * `+` im issuer also zum Leerzeichen. Hier nicht: Es bleibt ein `+`. Das ist
 * eine Abweichung, und sie ist die richtige Richtung — ein Anbieter, der
 * "AT+T" heisst, hiess im Web bisher "AT T". Base32-Secrets sind davon nie
 * betroffen (das Alphabet kennt kein `+`), der Fall ist also selten und die
 * Aenderung ungefaehrlich. Festgehalten, damit sie niemand fuer einen Fehler
 * haelt.
 *
 * ── Warum ueber Bytes und nicht ueber Zeichen ──────────────────────────────
 * `%C3%A4` ist EIN Zeichen (ae-Umlaut) in ZWEI Prozent-Gruppen. Wer jede
 * Gruppe einzeln in einen Char verwandelt, bekommt zwei Ersatzzeichen. Also
 * erst alle Bytes sammeln, dann einmal als UTF-8 lesen.
 */
internal object PercentCodec {

    /**
     * Decodiert wie `decodeURIComponent`.
     *
     * @throws IllegalArgumentException bei kaputter Codierung (einzelnes `%`,
     *   `%ZZ`) — genau wie `decodeURIComponent` einen `URIError` wirft. Der
     *   Aufrufer uebersetzt das in seinen eigenen Fehler, weil die Meldung je
     *   nach Ort eine andere ist (Label oder data-Parameter).
     */
    fun decode(input: String): String {
        val out = ByteArrayOutputStream(input.length)
        var i = 0
        while (i < input.length) {
            val char = input[i]
            if (char == '%') {
                require(i + 2 < input.length) { "abgeschnittene Prozent-Gruppe" }
                val high = hexValue(input[i + 1])
                val low = hexValue(input[i + 2])
                out.write((high shl 4) or low)
                i += 3
            } else {
                // Alles andere geht als UTF-8 durch. Ein bereits decodiertes
                // Zeichen (etwa ein direkt geschriebenes "ä") ueberlebt damit
                // unveraendert — dieselbe Nachsicht wie im Browser.
                out.write(char.toString().toByteArray(Charsets.UTF_8))
                i++
            }
        }
        return String(out.toByteArray(), Charsets.UTF_8)
    }

    /**
     * Eine Hex-Ziffer — und zwar eine LATEINISCHE (F7b, N20).
     *
     * Hier stand `Character.digit(char, 16)`, und das ist Unicode-bewusst:
     * Es nimmt auch ٣ (arabisch-indisch), ３ (Vollbreite) und ein Dutzend
     * weiterer Ziffernsysteme an. `decodeURIComponent` im Browser tut das
     * nicht — es kennt nur `0-9A-Fa-f` und wirft sonst. Aus `%٣٤` wurde hier
     * also ein Byte und im Web ein Fehler.
     *
     * Folgen hatte das keine (dahinter stehen strenge Pruefungen), aber es
     * war eine Abweichung von der Fassung, zu der dieser Port sich verpflichtet
     * hat — und die stillste Sorte: eine, die nur bei fremdsprachigen Eingaben
     * auffaellt. Von Hand gerechnet ist es ausserdem kuerzer als die Erklaerung.
     */
    private fun hexValue(char: Char): Int {
        val value = when (char) {
            in '0'..'9' -> char - '0'
            in 'a'..'f' -> char - 'a' + 10
            in 'A'..'F' -> char - 'A' + 10
            else -> -1
        }
        require(value >= 0) { "keine Hex-Ziffer: $char" }
        return value
    }
}
