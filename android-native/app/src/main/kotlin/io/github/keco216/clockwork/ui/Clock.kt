package io.github.keco216.clockwork.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.withFrameNanos
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle

/**
 * Die driftfreie Uhr — das Gegenstueck zu `src/ui/clock.ts`.
 *
 * ── Warum nicht einfach jede Sekunde hochzaehlen ──────────────────────────
 * Ein `delay(1000)` in einer Schleife waere der naheliegende Weg und waere
 * falsch. Die Zusage lautet „fruehestens nach 1000 ms": Jeder Durchlauf kommt
 * ein paar Millisekunden zu spaet, und diese Verspaetungen SUMMIEREN sich. Nach
 * einer Stunde zeigt so eine Uhr sichtbar daneben — bei einem Code, der alle
 * 30 Sekunden wechselt, ist das ein abgelaufener Code auf dem Schirm.
 *
 * Diese Uhr zaehlt deshalb gar nicht, sondern FRAGT bei jedem Bild die
 * Systemuhr neu. Ein verspaetetes Bild zeigt trotzdem den richtigen Wert — es
 * KANN sich nicht verzaehlen.
 *
 * ── Warum `withFrameNanos` ────────────────────────────────────────────────
 * Es haengt am Zeichentakt des Systems: Der Zeiger bewegt sich genau dann, wenn
 * ohnehin gezeichnet wird, und keinen Deut oefter. Im Web machen das
 * `requestAnimationFrame` und ein selbst nachjustierendes `setTimeout`
 * gemeinsam; hier genuegt der eine Mechanismus, weil er im Hintergrund von
 * selbst aussetzt.
 *
 * ── Und im Hintergrund rechnet nichts ─────────────────────────────────────
 * `repeatOnLifecycle(STARTED)` beendet die Schleife, sobald die App nicht mehr
 * sichtbar ist, und startet sie beim Zurueckkommen neu. Da die Zeit aus der
 * Systemuhr kommt und nicht aus einem Zaehler, ist der erste Wert nach dem
 * Zurueckkommen sofort richtig — es gibt nichts nachzuholen.
 */
@Composable
fun rememberUnixSeconds(): State<Double> {
    val seconds = remember { mutableDoubleStateOf(System.currentTimeMillis() / 1000.0) }
    val lifecycleOwner = LocalLifecycleOwner.current

    LaunchedEffect(lifecycleOwner) {
        lifecycleOwner.lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            while (true) {
                withFrameNanos {
                    // Bewusst NICHT die Bildzeit aus dem Parameter: Die zaehlt
                    // seit dem Systemstart und haette mit der Uhrzeit nichts zu
                    // tun. Gebraucht wird die Wanduhr, denn TOTP rechnet mit
                    // ihr — und mit sonst nichts.
                    seconds.doubleValue = System.currentTimeMillis() / 1000.0
                }
            }
        }
    }

    return seconds
}
