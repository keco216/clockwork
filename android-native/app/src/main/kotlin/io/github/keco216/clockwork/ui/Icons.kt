package io.github.keco216.clockwork.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import io.github.keco216.clockwork.ui.theme.Motion

/**
 * Die Zeichen der App — EIN Raster, EIN Strichgewicht (N12).
 *
 * ── Warum es diese Datei gibt ─────────────────────────────────────────────
 * Bis N11 zeichnete jedes Bauteil sein Zeichen selbst: der Aufklapper-Winkel
 * 1,5 dp mit stumpfen Enden in einem 16-dp-Kasten, das Haekchen 1,5 dp in
 * einem 10er, die beiden Leisten-Zeichen 1,4 bzw. 1,65 dp (aus einem
 * Radius-Anteil gerechnet) in einem 22er. Vier Kaesten, drei Strichstaerken,
 * zwei Kappenformen — jedes fuer sich vertretbar, zusammen kein System.
 *
 * Seit N12 gilt: **24-dp-Kasten, 2 dp Strich, runde Kappen und Ecken.** Wer
 * ein Zeichen braucht, holt es hier; wer eines aendert, aendert es fuer alle.
 *
 * ── Die eine Ausnahme, und warum sie eine bleibt ──────────────────────────
 * Das Zifferblatt neben dem Code ([Gauge]) und die beiden O der Wortmarke
 * sind KEINE Zeichen, sondern die MARKE in Betrieb. Sie tragen weiter stumpfe
 * Enden und die exakte 30er-Teilung, weil ein abgerundeter Strich auf einer
 * Teilung eine ungenaue Angabe ist. Die Grenze laeuft also nicht zwischen
 * „gross" und „klein", sondern zwischen ABLESEN und BEZEICHNEN.
 *
 * ── Abweichung von der Web-Fassung, benannt statt verschwiegen ────────────
 * Im Web sind die Winkel 1,5 px starke CSS-Kanten (`.vault__state::after`,
 * `.pick-shell::after`, `.listbox__option::after`). Nativ sind sie 2 dp mit
 * runden Kappen. Das ist Kevins Entscheidung aus N12 („EIN Strichgewicht fuer
 * alle Icons") und keine Nachlaessigkeit: Auf einem Telefon steht neben den
 * Winkeln keine Maus, sondern ein Daumen, und ein Haarstrich neben einem
 * 2-dp-Zifferblatt sieht aus wie ein Zeichen aus einem anderen Satz.
 */
object Glyph {
    /** Der Kasten. Jedes Zeichen wird darin gezeichnet — und NUR darin. */
    val box: Dp = 24.dp

    /** Das eine Strichgewicht. */
    val stroke: Dp = 2.dp

    /**
     * Die Betriebsleuchte: 6 dp, also drei Strichbreiten.
     *
     * Sie ist gefuellt und nicht gestrichelt, weil sie keine Form bezeichnet,
     * sondern einen Zustand zeigt — und weil dieselbe Scheibe im Zifferblatt
     * als Nabe sitzt.
     */
    val dot: Dp = 6.dp
}

/**
 * Die Umrechnung: eine Einheit des 24er-Rasters in Pixel.
 *
 * Alle Zahlen unten stehen damit im Raster und nicht in Pixeln — dieselbe
 * Schreibweise wie in einem 24er-SVG, und derselbe Grund: Man kann sie mit der
 * Vorlage vergleichen, ohne zu rechnen.
 */
private fun DrawScope.unit(): Float = size.minDimension / 24f

/**
 * Das Zifferblatt — Zeichen A des Markensystems, auf Icon-Groesse GESCHNITTEN
 * und nicht verkleinert.
 *
 * ── Der Befund, der dazu gefuehrt hat ─────────────────────────────────────
 * Die N11-Fassung nahm sechs lange Striche und einen kurzen Zeiger. Bei 24 dp
 * las sich das als STERN, nicht als Uhr — Kevins Befund am S24, am Bild
 * bestaetigt. Der Grund ist nicht die Anzahl, sondern die LAENGE: Ein Strich,
 * der ein Drittel des Radius einnimmt, ist eine Zacke; erst viele kurze
 * Marken schliessen sich im Auge zu einem Kreis.
 *
 * ── Zwei Anlaeufe, und warum erst der dritte trifft ───────────────────────
 * **v1 (N11)** nahm sechs lange Striche: ein Asterisk.
 * **v2 (N12)** ging auf zwoelf kurze Marken in der Proportion des Emblems
 * (0,2 R). Besser, aber Kevins Urteil am S24 blieb: liest sich weiter
 * sternartig.
 *
 * Der Grund ist nicht die ANZAHL, sondern die NATUR eines Markenkranzes: Ein
 * Ring aus einzelnen Strichen IST ein Stern, solange das Auge die Luecken
 * sieht — und bei 24 dp sind die Luecken groesser als die Marken. Man kann
 * das nicht durch Zaehlen loesen.
 *
 * **v3 (N14)** gibt die Markenlogik ganz auf und nimmt die Geometrie von
 * **Material Symbols `schedule`**: geschlossener Ring, ZWEI Zeiger
 * verschiedener Laenge auf 12 und 4, keine Teilstriche. Das ist Kevins
 * Ansage — er will die Icons „von Google Design, also Material 3".
 *
 * ── Warum das die Marke nicht verraet ─────────────────────────────────────
 * Weil ein Zeichen in einer Navigationsleiste kein Logo ist. Das Emblem mit
 * seiner 30er-Teilung steht weiterhin gross neben jedem Code ([Gauge]) und in
 * der Wortmarke; dort ist es die Marke IN BETRIEB und darf Eigenheiten haben.
 * Ein 24-dp-Zeichen dagegen hat genau eine Aufgabe: in einem Sechzigstel
 * Sekunde sagen, wohin man tippt. Was das leistet, ist keine Geschmacksfrage,
 * sondern seit Jahrzehnten ausprobiert — zwei Zeiger in einem Kreis.
 *
 * ── Und warum die Icon-Bibliothek TROTZDEM nicht dazugehoert ──────────────
 * `androidx.compose.material:material-icons-*` zoege `androidx.compose.
 * material` in den Klassenpfad, und `gradlew checkNoMaterial` verbietet das —
 * die Regel ist aelter als dieser Posten und hat einen eigenen Dauertest.
 * Uebernommen ist deshalb die FORM (Apache-2.0, frei), gezeichnet mit den
 * Mitteln dieses Hauses: 24er-Raster, 2 dp, runde Kappen.
 */
@Composable
fun DialGlyph(tint: Color, modifier: Modifier = Modifier, turn: Float = 0f) {
    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        val stroke = Glyph.stroke.toPx()

        /* ── Schnitt v3 (N14): der Ring ist GESCHLOSSEN ────────────────────
           Die Marken sind weg. Zwoelf davon (v2) lasen sich weiterhin als
           Stern, und der Grund ist nicht ihre Zahl, sondern ihre Natur: Ein
           Kranz aus einzelnen Strichen IST ein Stern, solange das Auge die
           Luecken sieht. Erst eine durchgezogene Linie liest sich als
           Zifferblatt.

           Radius 9,0 statt 10,0 Einheiten: Der Ring traegt seine
           Strichbreite nach aussen, endet also bei 10,0 — genau dort, wo
           vorher die Markenspitzen sassen. Der Aussendurchmesser des Zeichens
           bleibt damit derselbe wie in v2, und das Zahnrad daneben muss nicht
           nachgezogen werden. */
        drawCircle(color = tint, radius = 9.0f * u, style = Stroke(width = stroke))

        /* ZWEI Zeiger, keine Marken — die Geometrie von Material Symbols
           `schedule`.

           Marken sind ersatzlos weg. Sie waren der Rest der Markenlogik, und
           genau sie haben das Zeichen dreimal zum Stern gemacht. Was ein
           Mensch als Uhr liest, sind nicht Teilstriche, sondern ZWEI Zeiger
           verschiedener Laenge in einem Kreis — deshalb steht in jedem
           Icon-Satz der Welt dasselbe da.

           Stellung 12:20 wie in der Vorlage: Der kurze steht auf zwoelf, der
           lange auf vier. Zwei Zeiger auf einer Achse (etwa 6:00) laesen sich
           als Strich, zwei im rechten Winkel als Kreuz; ein spitzer Winkel
           ist die Stellung, die am eindeutigsten Uhr sagt. */
        /* ── Die Zeiger LAUFEN, wenn man tippt (N14) ────────────────────
           Und zwar mit dem Uebersetzungsverhaeltnis einer echten Uhr: Der
           lange Zeiger macht eine volle Umdrehung, der kurze dabei genau eine
           Stunde — also ein Zwoelftel, 30 Grad. Das ist keine Zierde, sondern
           die Mechanik, die dieses Produkt im Namen traegt.

           Wer beide gleich schnell drehte, haette ein Rad mit zwei Speichen
           gezeichnet und keine Uhr. */
        rotate(degrees = 30f * turn) {
            drawLine(
                color = tint,
                start = center,
                end = Offset(center.x, center.y - 4.8f * u),
                strokeWidth = stroke,
                cap = StrokeCap.Round,
            )
        }
        rotate(degrees = 120f + 360f * turn) {
            drawLine(
                color = tint,
                start = center,
                end = Offset(center.x, center.y - 6.2f * u),
                strokeWidth = stroke,
                cap = StrokeCap.Round,
            )
        }
    }
}

/**
 * Das Zahnrad — eine geschlossene SILHOUETTE, kein Ring mit Strahlen (N14).
 *
 * ── Der Befund ────────────────────────────────────────────────────────────
 * Bis N14 bestand es aus einem gestrichelten Kreis und acht radialen Strichen
 * darum. Kevins Urteil am Geraet: „sieht ueberhaupt nicht gut aus." Der Fehler
 * ist derselbe, der das Zifferblatt dreimal zum Stern gemacht hat — einzelne
 * Striche um einen Kreis lesen sich als Strahlenkranz, nicht als Koerper. Ein
 * Zahnrad hat aber einen UMRISS: Die Zaehne sind Teil derselben Kontur wie der
 * Rumpf, nicht Anhaengsel daran.
 *
 * ── Wie es jetzt gezeichnet wird ──────────────────────────────────────────
 * Als EIN geschlossener Pfad, der zwischen zwei Radien wechselt: acht Zaehne
 * auf 9,0 Einheiten, dazwischen der Rumpf auf 6,4. Der Uebergang laeuft
 * schraeg (die Flanke), und die Ecken sind rund gefuegt — damit traegt das
 * Zeichen dieselbe Kappenform wie der ganze Satz.
 *
 * Der Rumpfbogen wird in kleinen Schritten abgetastet statt mit `arcTo`
 * gezogen: Ein Pfad aus lauter Liniensegmenten laesst sich mit
 * `StrokeJoin.Round` gleichmaessig runden, ein gemischter aus Boegen und
 * Linien nicht.
 *
 * Das Loch in der Mitte ist ein RING (3,0 Einheiten) und keine gefuellte
 * Scheibe mehr: Ein Zahnrad ohne Loch ist ein Saegeblatt. Damit weicht es
 * bewusst von der Nabe des Zifferblatts ab — dort bezeichnet die Scheibe eine
 * Achse, hier eine Bohrung.
 */
@Composable
fun GearGlyph(tint: Color, modifier: Modifier = Modifier, turn: Float = 0f) {
    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        val stroke = Glyph.stroke.toPx()

        val teeth = 8
        val outer = 9.0f * u
        val inner = 6.4f * u
        val step = 360f / teeth

        // Halbe Winkelbreite: Zahnkopf schmaler als die Luecke, sonst
        // verschmelzen die Zaehne bei 20 dp zu einem Kreis.
        val head = step * 0.16f
        val flank = step * 0.09f

        fun point(degrees: Float, radius: Float): Offset {
            val radians = Math.toRadians((degrees - 90f).toDouble())
            return Offset(
                center.x + radius * kotlin.math.cos(radians).toFloat(),
                center.y + radius * kotlin.math.sin(radians).toFloat(),
            )
        }

        /* ── Es rastet um GENAU EINEN ZAHN weiter (N14) ─────────────────
           360 / 8 = 45 Grad. Nicht irgendeine Drehung, sondern die kleinste,
           die ein Zahnrad ueberhaupt machen kann, ohne dass sich das Bild
           aendert — am Ende steht wieder Zahn auf Zahn.

           Genau das macht die Bewegung „physikalisch": Man sieht nicht, dass
           sich etwas dreht, sondern dass etwas GREIFT. */
        val spin = 45f * turn

        val path = Path()
        for (index in 0 until teeth) {
            val mid = index * step + spin
            val riseAt = mid - head - flank
            val fallAt = mid + head + flank

            if (index == 0) path.moveTo(point(riseAt, inner)) else path.lineTo(point(riseAt, inner))
            path.lineTo(point(mid - head, outer))
            path.lineTo(point(mid + head, outer))
            path.lineTo(point(fallAt, inner))

            // Der Rumpf bis zum naechsten Zahn, in 4-Grad-Schritten.
            var angle = fallAt + 4f
            while (angle < mid + step - head - flank) {
                path.lineTo(point(angle, inner))
                angle += 4f
            }
        }
        path.close()

        drawPath(
            path = path,
            color = tint,
            style = Stroke(width = stroke, join = StrokeJoin.Round, cap = StrokeCap.Round),
        )

        drawCircle(color = tint, radius = 3.0f * u, style = Stroke(width = stroke))
    }
}

private fun Path.moveTo(offset: Offset) = moveTo(offset.x, offset.y)

private fun Path.lineTo(offset: Offset) = lineTo(offset.x, offset.y)

/**
 * Der Winkel — Aufklapper, Auswahlfeld, Listbox.
 *
 * Die Spanne ist 12 × 6 Einheiten, mittig im Kasten: die kanonische Geometrie
 * eines 24er-Rasters. Gedreht wird um die Kastenmitte, und die ist zugleich
 * die Mitte des Winkels — deshalb kippt er beim Aufklappen um seinen eigenen
 * Scheitel und nicht um einen Punkt daneben.
 *
 * @param turn Drehung in Grad. Der AUFRUFER bestimmt sie, weil die Dauer je
 *   Bauteil verschieden ist: 250 ms am Aufklapper, 150 ms am Auswahlfeld —
 *   zwei Bauteile der Referenz, zwei Zeiten.
 */
@Composable
fun ChevronGlyph(tint: Color, turn: Float, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        rotate(turn) {
            val path = Path().apply {
                moveTo(6f * u, 9f * u)
                lineTo(12f * u, 15f * u)
                lineTo(18f * u, 9f * u)
            }
            drawPath(
                path = path,
                color = tint,
                style = Stroke(
                    width = Glyph.stroke.toPx(),
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round,
                ),
            )
        }
    }
}

/**
 * Das Haekchen der gewaehlten Zeile.
 *
 * Es TRITT EIN — 250 ms aus `scale(.7)`, das Muster der Referenz. Ein
 * Haekchen, das einfach dasteht, sagt „ist ausgewaehlt"; eines, das eintritt,
 * sagt „wurde gerade ausgewaehlt".
 *
 * Die Bewegung steht hier und nicht beim Aufrufer, weil sie zum Zeichen
 * gehoert: Es gibt keinen Ort, an dem ein Haekchen anders erscheinen soll.
 */
@Composable
fun CheckGlyph(tint: Color, modifier: Modifier = Modifier) {
    /* `Animatable` und nicht `animateFloatAsState`: Letzteres startet BEIM
       Zielwert, es gaebe also gar keine Fahrt. Hier soll das Zeichen aus 0,7
       eintreten, und der Anfangswert ist deshalb Teil des Zustands. Dieselbe
       Bauart wie im Web, wo dafuer `@keyframes` steht und kein `transition` —
       aus demselben Grund: Das Zeichen ENTSTEHT mit dem Zustand. */
    val grow = remember { Animatable(0.7f) }
    LaunchedEffect(Unit) {
        grow.animateTo(1f, tween(Motion.calm, easing = Motion.spring))
    }

    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        // Um die eigene Mitte, deshalb `scale` im Zeichnen und nicht als
        // Modifier: Ein Modifier skalierte den ganzen Kasten samt
        // Trefferflaeche.
        scale(scale = grow.value) {
            val path = Path().apply {
                moveTo(6f * u, 12.5f * u)
                lineTo(10f * u, 16.5f * u)
                lineTo(18f * u, 7.5f * u)
            }
            drawPath(
                path = path,
                color = tint,
                style = Stroke(
                    width = Glyph.stroke.toPx(),
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round,
                ),
            )
        }
    }
}

/**
 * Die Betriebsleuchte.
 *
 * Sie steht im Kopf (Zustandszeile) und an der Fold-Zeile des Tresors. Bis N12
 * war sie an beiden Stellen ein eigener 6-dp-Kasten mit derselben Zahl — zwei
 * Kopien, die beim naechsten Mal auseinanderlaufen.
 */
@Composable
fun Lamp(colour: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(Glyph.dot)
            .clip(CircleShape)
            .background(colour),
    )
}

/**
 * Ein Eckwinkel des Suchers.
 *
 * Kein Zierrat: Die vier zeigen, wohin der QR-Code gehoert. Sie liegen
 * ausserhalb des 24er-Kastens (ihre Schenkel sind 18 dp lang), tragen aber
 * dasselbe Strichgewicht und dieselbe Rundung — auch die ECKE, die seit N12
 * ein echter Bogen ist statt zweier stumpf aneinanderstossender Striche.
 *
 * @param x,y der Punkt der Ecke, [toRight]/[toBottom] die Richtung der beiden
 *   Schenkel von dort aus.
 */
internal fun DrawScope.drawViewfinderCorner(
    x: Float,
    y: Float,
    toRight: Boolean,
    toBottom: Boolean,
    leg: Float,
    colour: Color,
) {
    val stroke = Glyph.stroke.toPx()
    val half = stroke / 2f
    val dx = if (toRight) 1f else -1f
    val dy = if (toBottom) 1f else -1f
    // Der Bogen hat den Radius einer Strichbreite — dieselbe Rundung, die die
    // runde Kappe an jedem anderen Zeichen erzeugt.
    val radius = stroke

    // Auf der Mitte des Strichs verankert, damit die AUSSENkante genau auf dem
    // Einzug liegt: Ein Strich waechst in beide Richtungen um seine halbe
    // Breite.
    val cx = x + dx * half
    val cy = y + dy * half

    val path = Path().apply {
        moveTo(cx, cy + dy * leg)
        lineTo(cx, cy + dy * radius)
        quadraticTo(cx, cy, cx + dx * radius, cy)
        lineTo(cx + dx * leg, cy)
    }
    drawPath(
        path = path,
        color = colour,
        style = Stroke(width = stroke, cap = StrokeCap.Round, join = StrokeJoin.Round),
    )
}

/* ── Die Zeichen der Tasten (N14) ───────────────────────────────────────────
   Kevins Wunsch aus der Spiegelung: „bei den Buttons haette ich gerne Icons."

   Vier Stueck, alle im selben 24er-Raster und mit demselben Strichgewicht wie
   der Rest des Satzes. Sie sind bewusst KNAPP gehalten — eine Taste traegt
   ihre Beschriftung daneben, das Zeichen muss die Handlung also nicht allein
   erklaeren, sondern nur schneller wiederfinden lassen.

   Wo KEINES steht, ist das eine Entscheidung: „Zusperren" und „Neu speichern"
   bleiben ohne. Jedes Schloss-Zeichen liesse dort raten, welcher der beiden
   Zustaende gemeint ist — und ein Zeichen, das man deuten muss, ist langsamer
   als das Wort daneben. */

/**
 * Kopieren — zwei Blaetter, versetzt.
 *
 * Das hintere ist nur als Winkel angedeutet und nicht als ganzer Rahmen: Zwei
 * geschlossene Rechtecke uebereinander werden bei 20 dp zu einem Gitter. So
 * bleibt die Silhouette lesbar, und sie ist die international eingefuehrte.
 */
@Composable
fun CopyGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        val stroke = Glyph.stroke.toPx()

        // Das vordere Blatt: 10 x 12 Einheiten, unten rechts.
        drawRoundRect(
            color = tint,
            topLeft = Offset(center.x - 2.0f * u, center.y - 3.0f * u),
            size = Size(11.0f * u, 12.0f * u),
            cornerRadius = CornerRadius(2.0f * u, 2.0f * u),
            style = Stroke(width = stroke),
        )

        // Das hintere als Winkel — oben und links, dort endet es am vorderen.
        val path = Path().apply {
            moveTo(center.x - 4.5f * u, center.y + 3.5f * u)
            lineTo(center.x - 7.0f * u, center.y + 3.5f * u)
            lineTo(center.x - 7.0f * u, center.y - 7.5f * u)
            lineTo(center.x + 4.0f * u, center.y - 7.5f * u)
            lineTo(center.x + 4.0f * u, center.y - 5.5f * u)
        }
        drawPath(
            path = path,
            color = tint,
            style = Stroke(width = stroke, cap = StrokeCap.Round, join = StrokeJoin.Round),
        )
    }
}

/**
 * Bild — Rahmen, Sonne, Horizontlinie.
 *
 * Die Linie laeuft als Knick von der linken Kante bis zur rechten und nicht
 * als zwei Berge: Ein Knick bleibt bei 20 dp eine Landschaft, zwei Berge
 * werden ein Zickzack.
 */
@Composable
fun ImageGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        val stroke = Glyph.stroke.toPx()

        drawRoundRect(
            color = tint,
            topLeft = Offset(center.x - 9.0f * u, center.y - 8.0f * u),
            size = Size(18.0f * u, 16.0f * u),
            cornerRadius = CornerRadius(2.5f * u, 2.5f * u),
            style = Stroke(width = stroke),
        )

        drawCircle(color = tint, radius = 1.4f * u, center = Offset(center.x - 3.5f * u, center.y - 3.5f * u))

        val path = Path().apply {
            moveTo(center.x - 8.0f * u, center.y + 6.0f * u)
            lineTo(center.x - 1.0f * u, center.y - 0.5f * u)
            lineTo(center.x + 8.0f * u, center.y + 6.0f * u)
        }
        drawPath(
            path = path,
            color = tint,
            style = Stroke(width = stroke, cap = StrokeCap.Round, join = StrokeJoin.Round),
        )
    }
}

/**
 * Kamera — Gehaeuse, Sucherbuckel, Objektiv.
 *
 * Das Objektiv ist ein Ring von 3,2 Einheiten Radius und damit derselbe
 * Kreis, den auch der Zahnradkern beschreibt: Ein Zeichensatz hat nicht nur
 * ein Strichgewicht, sondern auch eine Handvoll wiederkehrender Radien.
 */
@Composable
fun CameraGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        val stroke = Glyph.stroke.toPx()

        // Der Buckel sitzt AUF dem Gehaeuse und wird von ihm ueberzeichnet —
        // deshalb zuerst.
        val bump = Path().apply {
            moveTo(center.x - 3.5f * u, center.y - 6.5f * u)
            lineTo(center.x - 2.5f * u, center.y - 8.5f * u)
            lineTo(center.x + 2.5f * u, center.y - 8.5f * u)
            lineTo(center.x + 3.5f * u, center.y - 6.5f * u)
        }
        drawPath(
            path = bump,
            color = tint,
            style = Stroke(width = stroke, cap = StrokeCap.Round, join = StrokeJoin.Round),
        )

        drawRoundRect(
            color = tint,
            topLeft = Offset(center.x - 9.0f * u, center.y - 6.5f * u),
            size = Size(18.0f * u, 14.5f * u),
            cornerRadius = CornerRadius(2.5f * u, 2.5f * u),
            style = Stroke(width = stroke),
        )

        drawCircle(color = tint, radius = 3.2f * u, center = Offset(center.x, center.y + 0.8f * u), style = Stroke(width = stroke))
    }
}

/**
 * Schluessel — fuer den Testschluessel.
 *
 * Ring links, Bart rechts, zwei Zaehne. Die Schraegstellung des Emblems wird
 * NICHT nachgeahmt: Ein waagerechter Schluessel ist bei 20 dp eindeutiger, und
 * schraege Zeichen im Satz haette sonst nur dieses eine.
 */
@Composable
fun KeyGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(Glyph.box)) {
        val u = unit()
        val stroke = Glyph.stroke.toPx()

        drawCircle(
            color = tint,
            radius = 3.6f * u,
            center = Offset(center.x - 5.0f * u, center.y),
            style = Stroke(width = stroke),
        )

        val shaft = Path().apply {
            moveTo(center.x - 1.4f * u, center.y)
            lineTo(center.x + 9.0f * u, center.y)
        }
        drawPath(
            path = shaft,
            color = tint,
            style = Stroke(width = stroke, cap = StrokeCap.Round),
        )

        // Zwei Zaehne nach unten, verschieden lang — ein Schluessel mit zwei
        // gleichen Zaehnen sieht aus wie eine Gabel.
        drawLine(
            color = tint,
            start = Offset(center.x + 4.5f * u, center.y),
            end = Offset(center.x + 4.5f * u, center.y + 3.4f * u),
            strokeWidth = stroke,
            cap = StrokeCap.Round,
        )
        drawLine(
            color = tint,
            start = Offset(center.x + 8.0f * u, center.y),
            end = Offset(center.x + 8.0f * u, center.y + 2.2f * u),
            strokeWidth = stroke,
            cap = StrokeCap.Round,
        )
    }
}
