/**
 * Die Sekundenskala — das Signaturelement der App.
 *
 * ── Was sie ist ────────────────────────────────────────────────────────────
 * Eine geteilte Skala, wie sie auf einem Messgerät eingraviert wäre: eine Marke
 * pro Sekunde, jede fünfte länger. Kein Ring, kein Balken, der sich füllt.
 *
 * Der Unterschied ist nicht kosmetisch. Ein Ring zeigt einen Anteil („noch etwa
 * die Hälfte"). Eine geteilte Skala zeigt eine ABLESBARE MENGE — man kann die
 * verbleibenden Marken zählen. Genau darum geht es bei einem Code, der in einer
 * bestimmten Anzahl Sekunden ungültig wird.
 *
 * ── Wie sie funktioniert ───────────────────────────────────────────────────
 * Zwei identische Markenreihen liegen übereinander:
 *
 *   Reihe „spent"  hell   ────────────────────────────  (die ganze Skala)
 *   Reihe „left"   dunkel        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  (per clip-path beschnitten)
 *   Indexmarke                   ┃
 *
 * Der gesamte Zustand hängt an einer einzigen CSS-Variablen `--progress`, die die
 * Uhr pro Frame setzt. Es gibt kein DOM-Update pro Marke und keine Schleife pro
 * Frame — der Browser rechnet Beschnitt und Position selbst aus.
 *
 * ── Warum die Marken einzelne Elemente sind ────────────────────────────────
 * Ein `repeating-linear-gradient` wäre kürzer, rastert aber bei krummen
 * Abständen unsauber: Die Marken flimmern dann in der Breite. Einzelne 1-px-
 * Elemente mit derselben `calc()`-Abbildung wie die Indexmarke sitzen exakt
 * aufeinander — und der Zeiger steht damit garantiert auf einer Teilung und
 * nicht einen halben Pixel daneben.
 */

/**
 * Höchstzahl gezeichneter Marken. Bei Perioden über 60 s (der Parser erlaubt bis
 * 3600) wird ausgedünnt — 3600 Elemente pro Kanal wären unsinnig, und eine Skala
 * mit 3600 Strichen könnte ohnehin niemand ablesen.
 */
const MAX_TICKS = 60;

/** Jede wievielte gezeichnete Marke ist eine lange. */
const MAJOR_EVERY = 5;

/**
 * Baut die Skala für eine Periode auf. Einmal pro Kanalzug, nicht pro Tick.
 */
export function buildScale(scale: HTMLElement, period: number, rows: HTMLElement[]): void {
  // Die Abbildung Sekunde → Position rechnet CSS; hier steht nur der Nenner.
  scale.style.setProperty('--n', String(period));

  const step = Math.max(1, Math.ceil(period / MAX_TICKS));
  for (const row of rows) {
    row.replaceChildren(createTicks(period, step));
  }
}

function createTicks(period: number, step: number): DocumentFragment {
  const ticks = document.createDocumentFragment();

  // `k <= period`: Eine Skala von 0 bis 30 hat 31 Marken — an beiden Enden eine.
  // Genau wie ein Lineal, das bei 0 anfängt und bei 30 aufhört.
  for (let k = 0, drawn = 0; k <= period; k += step, drawn++) {
    const tick = document.createElement('i');
    tick.style.setProperty('--k', String(k));
    if (drawn % MAJOR_EVERY === 0) {
      tick.dataset.major = '';
    }
    ticks.append(tick);
  }

  return ticks;
}
