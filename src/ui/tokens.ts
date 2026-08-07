/**
 * Zugriff auf Design-Tokens aus dem JavaScript.
 *
 * Zeitwerte für Animationen stehen in styles/tokens.css und NICHT hier als
 * Konstante. Sonst gäbe es zwei Wahrheiten: eine im Stylesheet und eine im Code,
 * und irgendwann laufen sie auseinander. Die Web Animations API braucht die
 * Dauer aber als Zahl — also wird sie einmal ausgelesen.
 *
 * Einmal, nicht pro Aufruf: `getComputedStyle` erzwingt ein Style-Recalc, und
 * das während einer Animation 60-mal pro Sekunde zu tun wäre genau der Fehler,
 * den man später als „ruckelt manchmal" sucht.
 */

const cache = new Map<string, number>();

/**
 * Liest ein Zeit-Token (`120ms` oder `0.12s`) als Millisekunden-Zahl.
 * Fehlt oder verunglückt das Token, gilt der Rückfallwert — eine fehlende
 * Custom Property darf nie eine `NaN`-Dauer erzeugen.
 */
export function motionToken(name: string, fallbackMs: number): number {
  const cached = cache.get(name);
  if (cached !== undefined) {
    return cached;
  }

  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  let value = fallbackMs;

  if (raw.endsWith('ms')) {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed)) value = parsed;
  } else if (raw.endsWith('s')) {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed)) value = parsed * 1000;
  }

  cache.set(name, value);
  return value;
}
