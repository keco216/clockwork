package io.github.keco216.clockwork.core

import kotlin.math.ceil
import kotlin.math.floor

/**
 * TOTP — Time-based One-Time Password nach RFC 6238.
 * https://www.rfc-editor.org/rfc/rfc6238
 *
 * ── Was TOTP zu HOTP hinzufuegt: nichts ausser einer Uhr ───────────────────
 * TOTP ist HOTP mit einem Zaehler, den beide Seiten aus der Uhrzeit ableiten
 * statt hochzuzaehlen:
 *
 *     counter = floor(unixZeit / periode)
 *
 * Bei der ueblichen Periode von 30 Sekunden erhoeht sich dieser Zaehler alle
 * 30 Sekunden um genau 1 — bei jedem, ueberall auf der Welt, ohne dass jemand
 * etwas synchronisieren muesste. Das ist der ganze Trick.
 *
 *   Unix-Zeit  0 ... 29  ->  counter 0  ->  Code A
 *             30 ... 59  ->  counter 1  ->  Code B
 *             60 ... 89  ->  counter 2  ->  Code C
 *
 * Wichtig: Der Wechsel passiert an ABSOLUTEN 30-Sekunden-Grenzen der Unix-Zeit
 * (also bei :00 und :30 jeder Minute), nicht 30 Sekunden nachdem man die App
 * geoeffnet hat. Deshalb ist die erste angezeigte Restzeit oft kuerzer als 30 s.
 *
 * ── Ein Parameter, den wir NICHT anbieten: T0 ──────────────────────────────
 * RFC 6238 erlaubt einen Startzeitpunkt T0 != 0. Kein Anbieter benutzt das,
 * das `otpauth://`-Format sieht kein Feld dafuer vor, und die RFC-Testvektoren
 * gehen alle von T0 = 0 aus. T0 ist fest 0.
 *
 * ── Warum die Zeit hier `Double` ist ───────────────────────────────────────
 * Weil das Zifferblatt Nachkommastellen braucht: Der Zeiger dreht sich flüssig
 * ueber die Periode, und [periodProgress] liefert dafuer den Bruchteil. Der
 * ZAEHLER dagegen ist ein `Long` — eine ganze Zahl, die in 8 Byte muss.
 */

val DEFAULT_ALGORITHM: HashAlgorithm = HashAlgorithm.SHA1
const val DEFAULT_DIGITS = 6
const val DEFAULT_PERIOD = 30

/**
 * Wandelt eine Unix-Zeit (Sekunden) in den TOTP-Zaehlerstand um.
 * Das ist die einzige Zeile, die TOTP von HOTP unterscheidet.
 */
fun timeCounter(unixSeconds: Double, period: Int = DEFAULT_PERIOD): Long {
    assertPeriod(period)
    if (!unixSeconds.isFinite()) {
        throw OtpError(KEY_UNREADABLE)
    }
    if (unixSeconds < 0) {
        throw OtpError(KEY_UNREADABLE)
    }
    return floor(unixSeconds / period).toLong()
}

/**
 * Wie lange gilt der aktuelle Code noch? Ergebnis liegt in (0, periode].
 *
 * Beispiel bei Periode 30: bei Sekunde :00 sind es 30, bei :29 genau 1.
 * Bewusst bis 1 herunter und nicht bis 0 — eine Anzeige, die eine Sekunde lang
 * auf "0" stehen bleibt, wirkt eingefroren.
 */
fun secondsUntilNextCode(unixSeconds: Double, period: Int = DEFAULT_PERIOD): Int {
    assertPeriod(period)
    val elapsed = unixSeconds - timeCounter(unixSeconds, period) * period
    val remaining = ceil(period - elapsed).toInt()
    return if (remaining == 0) period else remaining
}

/**
 * Anteil der bereits verstrichenen Periode, 0 ... 1 — fuer den Countdown.
 * Nimmt absichtlich Nachkommastellen entgegen, damit der Zeiger fluessig laeuft.
 */
fun periodProgress(unixSeconds: Double, period: Int = DEFAULT_PERIOD): Double {
    assertPeriod(period)
    val elapsed = unixSeconds - floor(unixSeconds / period) * period
    return elapsed / period
}

/** Erzeugt den TOTP-Code fuer einen Zeitpunkt. */
fun generateTotp(
    secret: ByteArray,
    unixSeconds: Double,
    algorithm: HashAlgorithm = DEFAULT_ALGORITHM,
    digits: Int = DEFAULT_DIGITS,
    period: Int = DEFAULT_PERIOD,
): String = generateHotp(
    secret = secret,
    counter = timeCounter(unixSeconds, period),
    digits = digits,
    algorithm = algorithm,
)

/**
 * Erzeugt den Code fuer einen bereits ausgerechneten Zaehlerstand.
 *
 * Die Oberflaeche benutzt das, weil sie zwei Codes gleichzeitig braucht: den
 * aktuellen und die Vorschau auf den naechsten (`counter + 1`). Ueber den
 * Zaehler zu gehen ist dabei ehrlicher als "rechne mit Zeit + 30 s" — es zeigt
 * direkt, dass der naechste Code jetzt schon feststeht.
 */
fun generateTotpForCounter(
    secret: ByteArray,
    counter: Long,
    algorithm: HashAlgorithm = DEFAULT_ALGORITHM,
    digits: Int = DEFAULT_DIGITS,
): String = generateHotp(secret = secret, counter = counter, digits = digits, algorithm = algorithm)

private fun assertPeriod(period: Int) {
    if (period <= 0) {
        throw OtpError(KEY_UNREADABLE)
    }
}
