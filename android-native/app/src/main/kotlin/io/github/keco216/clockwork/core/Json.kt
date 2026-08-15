package io.github.keco216.clockwork.core

/**
 * Ein winziger JSON-Leser und -Schreiber fuer FLACHE Objekte.
 *
 * ── Warum ueberhaupt selbst geschrieben ────────────────────────────────────
 * Zwei Kandidaten scheiden aus, und beide aus einem handfesten Grund:
 *
 * 1. **`org.json`** liegt zwar auf jedem Android-Geraet, ist im Unit-Test aber
 *    nur ein STUB. Jeder Aufruf wirft dort "not mocked" — man kaeme also erst
 *    auf dem Emulator dahinter, dass der Tresor-Leser nie getestet wurde. Es
 *    gibt einen Schalter (`unitTests.isReturnDefaultValues`), der die Stubs
 *    still `null` liefern laesst; der macht die Sache schlimmer, nicht besser.
 * 2. **Eine JSON-Bibliothek** waere eine Abhaengigkeit fuer sechs Felder. Die
 *    Hausregel dagegen ist dieselbe wie beim Protobuf-Leser im Web: Fuer sechs
 *    Felder ist der ganze Apparat unnoetig.
 *
 * ── Was er kann, und was bewusst nicht ────────────────────────────────────
 * Er liest ein Objekt mit Zeichenketten-, Zahlen- und Wahrheitswerten. KEINE
 * verschachtelten Objekte, KEINE Arrays. Das ist kein Mangel, sondern die
 * Zusage: Der Tresor-Umschlag und die Sperr-Einstellungen sind flach, und was
 * dieser Leser nicht kann, kann auch kein Angreifer ueber ihn hineinreichen.
 * Alles Unerwartete wirft.
 *
 * Escapes sind vollstaendig behandelt — auch `\uXXXX` samt Surrogatpaaren.
 * Das ist nicht theoretisch: Der Umschlag aus der WebView-Fassung (P8) kommt
 * aus `JSON.stringify`, und das codiert je nach Inhalt.
 */
internal object Json {

    /** Ein gelesener Wert. Bewusst eng: mehr Formen gibt es hier nicht. */
    sealed class Value {
        data class Text(val value: String) : Value()
        data class Number(val value: Double) : Value()
        data class Bool(val value: Boolean) : Value()
        data object Null : Value()
    }

    /**
     * Liest ein flaches JSON-Objekt.
     *
     * @throws IllegalArgumentException bei allem, was nicht passt.
     */
    fun parseObject(text: String): Map<String, Value> {
        val reader = Reader(text)
        reader.skipWhitespace()
        reader.expect('{')
        val result = LinkedHashMap<String, Value>()

        reader.skipWhitespace()
        if (reader.peek() == '}') {
            reader.next()
            reader.skipWhitespace()
            require(reader.atEnd()) { "Text hinter dem Objekt" }
            return result
        }

        while (true) {
            reader.skipWhitespace()
            val name = reader.readString()
            reader.skipWhitespace()
            reader.expect(':')
            reader.skipWhitespace()
            result[name] = reader.readValue()
            reader.skipWhitespace()
            when (val char = reader.next()) {
                ',' -> Unit
                '}' -> {
                    reader.skipWhitespace()
                    require(reader.atEnd()) { "Text hinter dem Objekt" }
                    return result
                }

                else -> throw IllegalArgumentException("Erwartet wurde , oder }, gefunden: $char")
            }
        }
    }

    /**
     * Liest einen ALLEINSTEHENDEN Wert, der eine Zeichenkette oder `null` ist.
     *
     * ── Wofuer das gebraucht wird ─────────────────────────────────────────
     * `WebView.evaluateJavascript` liefert sein Ergebnis JSON-CODIERT zurueck,
     * auch wenn der Ausdruck bereits eine Zeichenkette ergibt. Aus
     * `localStorage.getItem(...)` wird also nicht `{"v":1,...}`, sondern
     * `"{\"v\":1,...}"` — und wenn nichts gespeichert war, der Vierzeichentext
     * `null`. Genau diese eine Huelle nimmt diese Funktion ab (P8).
     *
     * Sie ist bewusst streng: alles andere — eine Zahl, ein Objekt, Text
     * hinter dem Wert — wirft. Ein stillschweigend falsch gedeuteter
     * Rueckgabewert waere hier besonders teuer, weil die Uebernahme dann
     * „nichts gefunden" meldet, obwohl der Tresor da war.
     *
     * @throws IllegalArgumentException bei allem, was nicht passt.
     */
    fun parseStringOrNull(text: String): String? {
        val reader = Reader(text)
        reader.skipWhitespace()
        val value = reader.readValue()
        reader.skipWhitespace()
        require(reader.atEnd()) { "Text hinter dem Wert" }
        return when (value) {
            is Value.Text -> value.value
            Value.Null -> null
            else -> throw IllegalArgumentException("erwartet wurde eine Zeichenkette oder null")
        }
    }

    /**
     * Schreibt ein flaches Objekt.
     *
     * Die Reihenfolge ist die der uebergebenen Map — bei einem `LinkedHashMap`
     * also die Einfuegereihenfolge. Das ist wichtiger, als es aussieht: Der
     * Umschlag soll zwischen zwei Fassungen dieser App vergleichbar bleiben.
     */
    fun writeObject(fields: Map<String, Value>): String = buildString {
        append('{')
        var first = true
        for ((name, value) in fields) {
            if (!first) append(',')
            first = false
            appendQuoted(name)
            append(':')
            when (value) {
                is Value.Text -> appendQuoted(value.value)
                is Value.Number -> append(formatNumber(value.value))
                is Value.Bool -> append(if (value.value) "true" else "false")
                Value.Null -> append("null")
            }
        }
        append('}')
    }

    /**
     * Ganze Zahlen ohne `.0` schreiben.
     *
     * `JSON.stringify(600000)` liefert im Browser "600000", nicht "600000.0" —
     * und der Umschlag soll fuer beide Fassungen gleich aussehen. Nicht wegen
     * der Krypto (die Iterationszahl geht als TEXT in die AAD, dazu unten in
     * Vault.kt mehr), sondern damit ein Mensch die zwei Dateien nebeneinander
     * legen kann.
     */
    private fun formatNumber(value: Double): String =
        if (value == value.toLong().toDouble()) value.toLong().toString() else value.toString()

    private fun StringBuilder.appendQuoted(text: String) {
        append('"')
        for (char in text) {
            when {
                char == '"' -> append("\\\"")
                char == '\\' -> append("\\\\")
                char == '\n' -> append("\\n")
                char == '\r' -> append("\\r")
                char == '\t' -> append("\\t")
                char < ' ' -> append("\\u%04x".format(char.code))
                else -> append(char)
            }
        }
        append('"')
    }

    private class Reader(private val text: String) {
        private var index = 0

        fun atEnd() = index >= text.length

        fun peek(): Char {
            require(index < text.length) { "Text endet zu frueh" }
            return text[index]
        }

        fun next(): Char {
            require(index < text.length) { "Text endet zu frueh" }
            return text[index++]
        }

        fun expect(char: Char) {
            val found = next()
            require(found == char) { "Erwartet wurde $char, gefunden: $found" }
        }

        fun skipWhitespace() {
            while (index < text.length && text[index].isWhitespace()) index++
        }

        fun readString(): String {
            expect('"')
            val out = StringBuilder()
            while (true) {
                when (val char = next()) {
                    '"' -> return out.toString()
                    '\\' -> out.append(readEscape())
                    else -> {
                        require(char >= ' ') { "Steuerzeichen in einer Zeichenkette" }
                        out.append(char)
                    }
                }
            }
        }

        /** Genau vier lateinische Hex-Ziffern. `null`, wenn es keine sind. */
        private fun hexQuad(hex: String): Int? {
            var value = 0
            for (char in hex) {
                val digit = when (char) {
                    in '0'..'9' -> char - '0'
                    in 'a'..'f' -> char - 'a' + 10
                    in 'A'..'F' -> char - 'A' + 10
                    else -> return null
                }
                value = value * 16 + digit
            }
            return value
        }

        private fun readEscape(): Char = when (val char = next()) {
            '"' -> '"'
            '\\' -> '\\'
            '/' -> '/'
            'b' -> '\b'
            'f' -> '\u000C'
            'n' -> '\n'
            'r' -> '\r'
            't' -> '\t'
            'u' -> {
                require(index + 4 <= text.length) { "abgeschnittene \\u-Folge" }
                val hex = text.substring(index, index + 4)
                index += 4
                // Ein Surrogat bleibt hier ein einzelner Char und paart sich
                // von selbst mit dem naechsten — genau so, wie ein String in
                // der JVM ohnehin aufgebaut ist.
                //
                // Von Hand statt `toIntOrNull(16)` (F7b, N20): Kotlins Parser
                // nimmt ein fuehrendes Vorzeichen an, `\u-123` waere damit ein
                // gueltiges Escape geworden — und `toIntOrNull` akzeptiert
                // ausserdem nicht-lateinische Ziffern. JSON kennt an dieser
                // Stelle vier Zeichen aus `0-9A-Fa-f`, sonst nichts.
                hexQuad(hex)?.toChar()
                    ?: throw IllegalArgumentException("keine Hex-Folge: $hex")
            }

            else -> throw IllegalArgumentException("unbekanntes Escape: \\$char")
        }

        fun readValue(): Value = when (peek()) {
            '"' -> Value.Text(readString())
            't' -> { expectWord("true"); Value.Bool(true) }
            'f' -> { expectWord("false"); Value.Bool(false) }
            'n' -> { expectWord("null"); Value.Null }
            else -> readNumber()
        }

        private fun expectWord(word: String) {
            require(text.startsWith(word, index)) { "erwartet wurde $word" }
            index += word.length
        }

        private fun readNumber(): Value {
            val start = index
            if (!atEnd() && peek() == '-') index++
            while (!atEnd() && (peek().isDigit() || peek() in ".eE+-")) index++
            val raw = text.substring(start, index)
            val value = raw.toDoubleOrNull()
                ?: throw IllegalArgumentException("keine Zahl: $raw")
            return Value.Number(value)
        }
    }
}

/* ── Bequemlichkeiten ───────────────────────────────────────────────────── */

internal fun Map<String, Json.Value>.text(name: String): String? =
    (this[name] as? Json.Value.Text)?.value

internal fun Map<String, Json.Value>.number(name: String): Double? =
    (this[name] as? Json.Value.Number)?.value

internal fun Map<String, Json.Value>.bool(name: String): Boolean? =
    (this[name] as? Json.Value.Bool)?.value
