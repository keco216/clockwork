/**
 * Das Zifferblatt der App — und zugleich die Marke.
 *
 * ── Herkunft ───────────────────────────────────────────────────────────────
 * Die Form ist nicht erfunden, sondern aus dem Emblem übernommen:
 * `branding/clockwork-logo-a-skala.svg`. Dort steht eine Teilung aus 30 Marken
 * (12° Schritt = 30 Sekunden), ein längerer und dickerer Signalzeiger auf
 * 12 Uhr und eine Nabe in der Mitte. Genau diese Geometrie liegt als
 * Verhältniszahlen in styles/tokens.css und wird hier gezeichnet:
 *
 *     Marke     0,20 · R lang,  0,048 · R stark
 *     Zeiger    0,30 · R lang,  0,073 · R stark
 *     Nabe      0,052 · R
 *
 * Marke und Instrument sind damit dasselbe Element — das Logo ist die Anzeige,
 * nur dass sich der Signalzeiger dreht.
 *
 * ── Was sich bewegt ────────────────────────────────────────────────────────
 * Die Teilung ist eingraviert und ändert sich nie. Der Signalzeiger wandert
 * einmal pro Periode im Uhrzeigersinn herum, angetrieben von einer einzigen
 * CSS-Variablen `--progress`. Kein DOM-Update pro Marke, kein Neuzeichnen —
 * der Browser dreht eine Gruppe.
 *
 * Das ist bewusst kein Balken, der sich füllt: Ein Zeiger auf einer Teilung
 * zeigt eine ABLESBARE Position („noch acht Marken"), und darum geht es bei
 * einem Code, der in einer zählbaren Anzahl Sekunden ungültig wird.
 *
 * ── Kein Donut-Ring ────────────────────────────────────────────────────────
 * Es gibt keinen gestrichelten Kreisbogen, der sich leert. 30 einzelne Striche
 * mit stumpfen Enden, ein Zeiger, eine Nabe. Nichts davon ist rund gezeichnet.
 */

/** Zeichenfläche des Zifferblatts. Alles darin ist auf R = 44 bezogen. */
const VIEW = 100;
const CENTRE = VIEW / 2;
const RADIUS = 44;

/**
 * Höchstzahl gezeichneter Marken. Perioden über 60 s (der Parser erlaubt bis
 * 3600) werden ausgedünnt — 3600 Striche könnte ohnehin niemand ablesen, und
 * die Teilung würde zur Fläche.
 */
const MAX_TICKS = 60;

interface Proportions {
  tickLength: number;
  handLength: number;
  tickWidth: number;
  handWidth: number;
  hub: number;
}

/**
 * Liest die Emblem-Verhältnisse aus den Design-Tokens.
 *
 * Bewusst nicht als Zahlen hier im Modul: Die Proportionen sind eine
 * Gestaltungsentscheidung und gehören zum Token-System. Zwei Wahrheiten wären
 * eine zu viel.
 */
function readProportions(): Proportions {
  const style = getComputedStyle(document.documentElement);
  const ratio = (name: string, fallback: number): number => {
    const value = Number.parseFloat(style.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };
  return {
    tickLength: ratio('--dial-tick-len', 0.2),
    handLength: ratio('--dial-hand-len', 0.3),
    tickWidth: ratio('--dial-tick-w', 0.048),
    handWidth: ratio('--dial-hand-w', 0.073),
    hub: ratio('--dial-hub', 0.052),
  };
}

let proportions: Proportions | null = null;

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Baut das Zifferblatt für eine Periode. Einmal pro Kanalzug, nicht pro Tick.
 *
 * @returns Die Gruppe, die den Signalzeiger trägt — sie wird gedreht.
 */
export function buildGauge(host: SVGSVGElement, period: number): SVGGElement {
  proportions ??= readProportions();
  const { tickLength, handLength, tickWidth, handWidth, hub } = proportions;

  host.setAttribute('viewBox', `0 0 ${VIEW} ${VIEW}`);

  const step = Math.max(1, Math.ceil(period / MAX_TICKS));
  const ticks = document.createElementNS(SVG_NS, 'g');
  ticks.setAttribute('class', 'dialface__ticks');

  for (let second = 0; second < period; second += step) {
    // 0 s zeigt nach oben; von dort im Uhrzeigersinn. −90°, weil 0° in
    // Bildschirmkoordinaten nach rechts zeigt.
    const angle = (second / period) * 360 - 90;
    ticks.append(
      line(RADIUS * (1 - tickLength), RADIUS, angle, RADIUS * tickWidth, 'dialface__tick'),
    );
  }

  // Der Zeiger steht in einer eigenen Gruppe auf 12 Uhr; gedreht wird die
  // Gruppe, nicht der Strich. So bleibt die Geometrie unangetastet.
  const hand = document.createElementNS(SVG_NS, 'g');
  hand.setAttribute('class', 'dialface__hand');
  hand.append(
    line(RADIUS * (1 - handLength), RADIUS, -90, RADIUS * handWidth, 'dialface__handMark'),
  );

  const hubDot = document.createElementNS(SVG_NS, 'circle');
  hubDot.setAttribute('cx', String(CENTRE));
  hubDot.setAttribute('cy', String(CENTRE));
  hubDot.setAttribute('r', (RADIUS * hub).toFixed(2));
  hubDot.setAttribute('class', 'dialface__hub');

  host.replaceChildren(ticks, hand, hubDot);
  return hand;
}

/** Ein Strich vom Radius `from` bis `to`, unter `angleDeg`, mit stumpfen Enden. */
function line(from: number, to: number, angleDeg: number, width: number, className: string) {
  const radians = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const element = document.createElementNS(SVG_NS, 'line');
  element.setAttribute('x1', (CENTRE + cos * from).toFixed(2));
  element.setAttribute('y1', (CENTRE + sin * from).toFixed(2));
  element.setAttribute('x2', (CENTRE + cos * to).toFixed(2));
  element.setAttribute('y2', (CENTRE + sin * to).toFixed(2));
  element.setAttribute('stroke-width', width.toFixed(2));
  element.setAttribute('class', className);
  return element;
}
