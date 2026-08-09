/**
 * Das Zifferblatt — die Anzeige eines Codes.
 *
 * ── Warum jede Ziffer ein eigenes Element ist ──────────────────────────────
 * An einer mechanischen Fallblattanzeige klappt beim Wechsel nicht die ganze
 * Tafel um, sondern nur die Blätter, deren Zeichen sich ändert. Genau das macht
 * diese Klasse: Sie vergleicht alten und neuen Code Ziffer für Ziffer und
 * animiert ausschließlich die Stellen, die tatsächlich anders sind.
 *
 * Das ist kein Effekt um des Effekts willen — es ist Information. Wer hinsieht,
 * erkennt sofort, welche Stellen sich geändert haben, und der Wechsel wirkt wie
 * ein Zählwerk statt wie ein Neuzeichnen.
 *
 * ── Warum Web Animations API statt CSS-Klasse ─────────────────────────────
 * Eine laufende CSS-Animation neu zu starten geht nur über einen erzwungenen
 * Reflow. `element.animate()` kann das von Haus aus — und erlaubt zusätzlich den
 * Versatz pro Ziffer, der den Umsprung als Kaskade von links nach rechts laufen
 * lässt.
 */

import { groupDigits } from '../lib/format';
import { prefersReducedMotion } from './dom';
import { easingToken, motionToken } from './tokens';

/**
 * Die Bewegung des Blatts: aus der Mittelachse aufklappen.
 *
 * Der Startwert ist bewusst 0.45 und nicht 0.06. Ein bis auf einen Strich
 * zusammengestauchtes Blatt wäre die genauere Nachbildung — aber die Ziffer ist
 * dann für den Bruchteil einer Sekunde unlesbar, und das ist bei einem Code, den
 * jemand gerade abtippt, ein echter Nutzungsfehler und kein Charme. Angedeutet
 * heißt hier: Man sieht die Mechanik, ohne die Information zu verlieren.
 *
 * ── Was V5 daran geändert hat ──────────────────────────────────────────────
 * Der Umsprung bleibt — er ist der Marken-Moment dieser App und wird nicht
 * durch ein Ein-/Ausblenden ersetzt. Er landet nur weicher: dieselbe Bewegung,
 * aber auf der Federkurve und über 190 statt 110 ms, mit einem
 * Zwischenschritt, der die letzten Prozent auslaufen lässt statt sie
 * anzustoßen.
 *
 * Die Deckkraft startet höher als vorher (0,7 statt 0,55): Bei der längeren
 * Dauer wäre die alte Zahl als Blinzeln sichtbar geworden, und eine Ziffer, die
 * blinzelt, während jemand sie abtippt, ist genau der Nutzungsfehler von oben.
 */
const FLAP: Keyframe[] = [
  { transform: 'scaleY(0.45)', opacity: 0.7 },
  { transform: 'scaleY(1)', opacity: 1 },
];

export class Dial {
  readonly #root: HTMLElement;
  /** Die Ziffern-Elemente in Anzeigereihenfolge (ohne die Lücke). */
  #digits: HTMLElement[] = [];
  /** Was aktuell auf dem Blatt steht — roh, ohne Gruppierung. */
  #shown = '';

  constructor(root: HTMLElement) {
    this.#root = root;
  }

  /**
   * Setzt einen neuen Code.
   *
   * Beim ersten Aufruf und bei geänderter Stellenzahl wird das Blatt neu
   * aufgebaut (ohne Animation — es gibt ja nichts, wovon es umspringen könnte).
   * Danach werden nur einzelne Ziffern ausgetauscht.
   */
  set(code: string): void {
    if (code === this.#shown) {
      return;
    }

    if (code.length !== this.#shown.length) {
      this.#build(code);
      this.#shown = code;
      return;
    }

    const animate = !prefersReducedMotion();
    const duration = motionToken('--dur-snap', 190);
    const stagger = motionToken('--stagger-flap', 20);
    const easing = easingToken('--ease-spring', 'cubic-bezier(0.32, 0.72, 0, 1)');
    let flapped = 0;

    for (const [index, digit] of this.#digits.entries()) {
      const next = code.charAt(index);
      if (digit.textContent === next) {
        continue;
      }
      digit.textContent = next;

      if (animate) {
        // Der Versatz zählt umspringende Ziffern, nicht Positionen: So folgt die
        // Kaskade dem, was sich ändert, statt Lücken zu lassen.
        digit.animate(FLAP, {
          duration,
          delay: flapped * stagger,
          easing,
          fill: 'backwards',
        });
      }
      flapped++;
    }

    this.#shown = code;
  }

  /** Der aktuell angezeigte Code — das ist der, der kopiert wird. */
  get value(): string {
    return this.#shown;
  }

  /**
   * Baut das Blatt neu auf.
   *
   * Die Gruppierung („123 456") kommt aus format.ts. Aus dem Leerzeichen wird
   * hier ein eigenes Element mit fester Breite statt eines echten Leerzeichens:
   * Ein Leerzeichen wäre je nach Schrift unterschiedlich breit, und die Lücke
   * ist ein Gestaltungsmaß, kein Zeichen.
   */
  #build(code: string): void {
    this.#digits = [];
    const parts = document.createDocumentFragment();

    for (const character of groupDigits(code)) {
      if (character === ' ') {
        const gap = document.createElement('span');
        gap.className = 'dial__gap';
        gap.setAttribute('aria-hidden', 'true');
        parts.append(gap);
        continue;
      }
      const digit = document.createElement('span');
      digit.className = 'dial__digit';
      digit.textContent = character;
      this.#digits.push(digit);
      parts.append(digit);
    }

    this.#root.replaceChildren(parts);
  }
}
