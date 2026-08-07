/**
 * Die Uhr der App.
 *
 * ── Warum nicht einfach `setInterval(tick, 1000)`? ─────────────────────────
 * Weil `setInterval` driftet. Der Browser garantiert nur "frühestens nach 1000
 * ms", nie "genau nach 1000 ms": Jeder Tick kommt ein paar Millisekunden zu
 * spät, und diese Verspätungen addieren sich. Nach ein paar Minuten läge der
 * Codewechsel sichtbar neben der echten Sekunde — bei einem 2FA-Code ist das
 * genau das, was nicht passieren darf.
 *
 * ── Die Lösung: nie zählen, immer die Systemuhr fragen ─────────────────────
 * Jeder Tick liest `Date.now()` und rechnet daraus neu aus, was angezeigt
 * werden muss. Ein verspäteter Tick zeigt dann trotzdem den richtigen Wert —
 * er kann sich gar nicht "verzählen", weil er nichts zählt.
 *
 * Dazu zwei Antriebe, die sich gegenseitig absichern:
 *
 *   (a) requestAnimationFrame — für die flüssige Ring-Animation. Läuft mit der
 *       Bildwiederholrate und pausiert automatisch, wenn der Tab unsichtbar
 *       ist. Das ist gewollt: Für nicht sichtbare Pixel Strom zu verbrauchen
 *       wäre Unsinn.
 *
 *   (b) ein selbstkorrigierender setTimeout — feuert kurz nach jeder vollen
 *       Sekunde. Die Wartezeit wird jedes Mal NEU aus `Date.now()` berechnet
 *       (`1000 - (now % 1000)`), statt stur 1000 ms zu nehmen. Damit rückt der
 *       Tick nach einer Verspätung von selbst wieder auf die Sekundengrenze.
 *
 * Und ein Sicherheitsnetz: Beim Zurückkehren auf den Tab (und nach dem
 * Aufwachen aus dem Standby) feuert sofort ein Tick, damit nie ein alter Code
 * stehen bleibt.
 */

/** Kleiner Puffer, damit wir sicher NACH der Sekundengrenze aufwachen. */
const BOUNDARY_OVERSHOOT_MS = 6;

export interface Clock {
  /** Beendet die Uhr und räumt alle Listener ab. */
  stop(): void;
}

export function startClock(onTick: (nowMs: number) => void): Clock {
  let running = true;
  let frameHandle = 0;
  let timeoutHandle = 0;

  const tick = (): void => {
    if (running) {
      onTick(Date.now());
    }
  };

  // (a) Bildrate — flüssiger Ring.
  const frameLoop = (): void => {
    tick();
    frameHandle = requestAnimationFrame(frameLoop);
  };

  // (b) Sekundenraster — driftfrei, auch wenn (a) pausiert.
  const scheduleNextSecond = (): void => {
    const now = Date.now();
    const delay = 1000 - (now % 1000) + BOUNDARY_OVERSHOOT_MS;
    timeoutHandle = window.setTimeout(() => {
      tick();
      if (running) {
        scheduleNextSecond();
      }
    }, delay);
  };

  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      tick();
    }
  };

  tick(); // sofort etwas anzeigen, nicht erst nach dem ersten Frame
  frameHandle = requestAnimationFrame(frameLoop);
  scheduleNextSecond();
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    stop(): void {
      running = false;
      cancelAnimationFrame(frameHandle);
      clearTimeout(timeoutHandle);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
}
