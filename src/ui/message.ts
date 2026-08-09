/**
 * Meldungszeilen, die einfahren statt aufzuploppen.
 *
 * Betrifft die beiden Live-Regionen des Geräts: die Import-Rückmeldung im
 * Eingabe-Panel (`role="status"`) und die Fehlerzeile des Tresors
 * (`role="alert"`).
 *
 * ── Die Regel, die hier über allem steht ───────────────────────────────────
 * Eine Live-Region muss IM BAUM sein, bevor Text hineinkommt. Wird sie im
 * selben Moment eingeblendet und gefüllt, meldet ein Screenreader die Änderung
 * nicht zuverlässig — und genau das Melden ist ihr einziger Zweck. `display`
 * ist deshalb tabu; die leere Zeile verlässt den FLUSS und nicht den BAUM
 * (`:empty`-Regel in style.css, seit V8).
 *
 * ── Warum die Fahrt drei Spuren hat ────────────────────────────────────────
 * Höhe allein reicht nicht. Beide Zeilen sind Flexkinder mit `gap` davor
 * (16 px im Eingabe-Panel, 8 px im Tresor-Formular), und diese Fuge fällt an,
 * sobald das Element im Fluss steht — bei Höhe 0 also auch. Ohne Gegenmaßnahme
 * springt die Fuge in dem Moment auf, in dem die Fahrt erst beginnt. Also fährt
 * ein negativer Außenabstand sie mit auf.
 *
 * Das ist NICHT der Fall aus dem V8-Audit, in dem ein negativer Außenabstand
 * nachweislich nichts half: Dort ging es um die `row-gap` einer erzwungenen
 * zweiten FLEXZEILE, und die Höhe einer Flexzeile wird nie kleiner als null.
 * Hier geht es um die Fuge zwischen zwei Geschwistern in einer Spalte, und die
 * lässt sich mit einem Außenabstand aufrechnen. Nachgemessen ist beides.
 *
 * Die dritte Spur ist die Deckkraft, und sie läuft schneller als die Höhe —
 * das Muster der Referenz (`field-error`: opacity 150, height 350). Die Höhe
 * nimmt hier die Hausdauer 250, damit die Zeile im selben Takt fährt wie die
 * Aufklapper daneben.
 */

import { prefersReducedMotion } from './dom';
import { easingToken, motionToken } from './tokens';

/**
 * Setzt den Text einer Meldungszeile und fährt sie dabei ein oder aus.
 *
 * Steht schon derselbe Text da, passiert nichts — `paint()` im Tresor läuft
 * bei jedem Anstrich durch und würde die Zeile sonst bei jeder Kleinigkeit
 * neu fahren lassen.
 */
export function setMessage(element: HTMLElement, text: string): void {
  if (element.textContent === text) {
    return;
  }

  const showing = text !== '';

  if (prefersReducedMotion()) {
    element.textContent = text;
    return;
  }

  // Ein laufender Wechsel wird abgebrochen: Wer schnell zweimal etwas auslöst,
  // meint das Zweite. Ohne das liefen zwei Fahrten übereinander und die
  // Inline-Aufräumarbeit der ersten träfe die zweite.
  for (const animation of element.getAnimations()) {
    animation.cancel();
  }

  const easing = easingToken('--ease-spring', 'cubic-bezier(0.32, 0.72, 0, 1)');
  const gap =
    element.parentElement === null ? '0px' : getComputedStyle(element.parentElement).rowGap;

  if (showing) {
    // Erst der Text: Damit greift `:empty` nicht mehr, das Element steht im
    // Fluss, und die Zielhöhe lässt sich überhaupt messen. Für die Live-Region
    // ist das ohnehin die richtige Reihenfolge.
    element.textContent = text;
    play(element, measure(element), gap, easing, true);
    return;
  }

  // Beim Ausfahren zuerst messen, dann fahren, und den Text erst danach
  // wegnehmen — sonst wäre schon vor dem ersten Bild nichts mehr zu sehen.
  const from = measure(element);
  const animation = play(element, from, gap, easing, false);
  animation.finished
    .then(() => {
      element.textContent = '';
      clear(element);
    })
    .catch(() => {
      // Abgebrochen, weil inzwischen eine neue Meldung kam. Die hat den Text
      // schon gesetzt und räumt selbst auf.
    });
}

interface Box {
  height: string;
  minHeight: string;
}

function measure(element: HTMLElement): Box {
  const style = getComputedStyle(element);
  return {
    // Border-Box (style.css setzt `box-sizing: border-box` global), also
    // einschließlich Innenabstand.
    height: `${String(element.getBoundingClientRect().height)}px`,
    // `.vault__error` hält 1,2 em Mindesthöhe frei. Ohne diese Spur bliebe die
    // Zeile bei ihrem Minimum stehen und die Höhenspur liefe wirkungslos.
    minHeight: style.minHeight,
  };
}

function play(
  element: HTMLElement,
  box: Box,
  gap: string,
  easing: string,
  showing: boolean,
): Animation {
  const shut: Keyframe = {
    height: '0px',
    minHeight: '0px',
    marginBlockStart: `-${gap}`,
  };
  const wide: Keyframe = {
    height: box.height,
    minHeight: box.minHeight,
    marginBlockStart: '0px',
  };

  // Die Höhe ist beschnitten, solange sie kleiner ist als der Inhalt.
  element.style.overflow = 'clip';

  element.animate(showing ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], {
    duration: motionToken('--dur-quick', 150),
    easing,
    fill: 'backwards',
  });

  const animation = element.animate(showing ? [shut, wide] : [wide, shut], {
    duration: motionToken('--dur-calm', 250),
    easing,
  });

  if (showing) {
    animation.finished.then(() => clear(element)).catch(() => clear(element));
  }
  return animation;
}

function clear(element: HTMLElement): void {
  element.style.removeProperty('overflow');
}
