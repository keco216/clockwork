/**
 * Die beiden Aufklapper des Geräts fahren, statt zu poppen.
 *
 * ── Warum das nicht in CSS steht ───────────────────────────────────────────
 * Weil ein `<details>` seinen Inhalt beim Zuklappen SOFORT aus dem Layout
 * nimmt. Eine CSS-Animation braucht ein Element, das noch da ist; nach
 * `open = false` gibt es keins mehr. Modernes CSS hat dafür seit Chrome 129/131
 * `interpolate-size: allow-keywords` und `::details-content` — beides ist in
 * V11 gebaut, gemessen und wieder ausgebaut worden. Der Grund steht in
 * `docs/README.de.md` beim Bewegungs-Abschnitt und in einem Satz hier: Die App
 * garantiert WebView 111 (capacitor.config.ts), und zwischen 111 und 130 poppt
 * die CSS-Fassung ersatzlos — auf genau den Geräten, für die die Untergrenze
 * überhaupt dasteht.
 *
 * ── Was dieses Modul dafür übernimmt ───────────────────────────────────────
 * Den Zustand. Der Klick auf die Zusammenfassung wird abgefangen, `open` setzt
 * dieses Modul selbst — vorher fährt der Inhalt, nachher steht er. Damit gibt
 * es genau eine Stelle, die `open` schreibt, und sie ist dieselbe für Maus,
 * Tastatur und Programm (`set()`, benutzt von ui/vault-panel.ts).
 *
 * ── Was sich dadurch NICHT ändert ──────────────────────────────────────────
 * Das Verhalten. `<details>` bleibt `<details>`: Zustand im DOM, Tastatur über
 * die Zusammenfassung, Screenreader-Ansage vom Element selbst. Wer kein
 * JavaScript hat, klappt weiter auf und zu — nur eben ohne Fahrt.
 */

import { prefersReducedMotion, requireElement } from './dom';
import { easingToken, motionToken } from './tokens';

export interface Disclosure {
  /** Öffnet oder schließt mit Fahrt — der Weg für programmatische Wechsel. */
  set(open: boolean): void;
}

/**
 * Hängt die Fahrt an ein `<details>`.
 *
 * Erwartet wird der übliche Aufbau: eine `<summary>` und genau ein Element
 * dahinter, das den Inhalt trägt (`.vault__panel`, `.reveal__body`). Fehlt es,
 * passiert nichts — dann ist der Aufklapper leer, und es gibt nichts zu fahren.
 */
export function enhanceDisclosure(details: HTMLDetailsElement): Disclosure {
  const summary = requireElement<HTMLElement>(details, 'summary');
  const body = summary.nextElementSibling;

  if (!(body instanceof HTMLElement)) {
    return { set: (open) => (details.open = open) };
  }

  // Eigener Name für den verengten Typ: Die Verengung von `body` aus der Wache
  // oben reicht nicht in die Funktionen darunter hinein.
  const content: HTMLElement = body;
  let running: Animation | null = null;
  /**
   * Der GEMEINTE Zustand — und nicht `details.open`.
   *
   * Der Unterschied ist keine Feinheit, sondern ein gemessener Fehler: Während
   * einer Schließfahrt bleibt `open` auf `true` stehen (sonst nähme der
   * Browser den Inhalt sofort aus dem Layout). Wer in dieser Zeitspanne noch
   * einmal tippt, liest an `open` also „offen" und schlösse ein zweites Mal.
   * Drei schnelle Klicks aus dem zugeklappten Zustand endeten damit
   * zugeklappt statt offen — nachgemessen, bevor diese Zeile hier stand.
   */
  let intended = details.open;

  function play(opening: boolean): void {
    intended = opening;

    if (prefersReducedMotion()) {
      running?.cancel();
      running = null;
      details.open = opening;
      return;
    }

    /* Der Ausgangspunkt wird VOR dem Abbruch gemessen. `cancel()` nimmt die
       Animationswerte zurück, und das Element schnappt auf seine natürliche
       Höhe — würde man danach messen, begänne die neue Fahrt mit genau dem
       Sprung, den sie vermeiden soll. */
    const from: Keyframe | null =
      running === null
        ? null
        : {
            height: `${String(content.getBoundingClientRect().height)}px`,
            paddingBlockStart: getComputedStyle(content).paddingBlockStart,
            opacity: getComputedStyle(content).opacity,
          };

    running?.cancel();
    running = null;

    // Für die MESSUNG muss der Inhalt sichtbar sein — auch beim Zuklappen, wo
    // er es ohnehin noch ist.
    details.open = true;

    const style = getComputedStyle(content);
    const padding = style.paddingBlockStart;
    // Border-Box, weil `*` in style.css `box-sizing: border-box` setzt: Die
    // gemessene Höhe enthält den Innenabstand, den die zweite Spur mitfährt.
    const height = content.getBoundingClientRect().height;

    /* Der Innenabstand fährt MIT. Ohne das bliebe beim zugeklappten Zustand
       genau der Betrag stehen, den die Fuge zur Zusammenfassungszeile ausmacht
       (8 px an beiden Aufklappern) — sichtbar als Streifen unter einer Zeile,
       die zu ist. Dieselbe Lösung wie an der V10-Schublade, die
       `grid-template-rows` und `padding-block-start` ebenfalls gemeinsam
       fährt. */
    const shut: Keyframe = { height: '0px', paddingBlockStart: '0px', opacity: 0 };
    const wide: Keyframe = {
      height: `${String(height)}px`,
      paddingBlockStart: padding,
      opacity: 1,
    };

    // Während der Fahrt ist die Höhe kleiner als der Inhalt. Ohne Beschnitt
    // stünde er über die Kante hinaus; der Rand lässt dem Fokus-Ring Luft,
    // der an Tasten 4 px über die Kante ragt (2 px Ring, 2 px Versatz) —
    // dieselbe Überlegung wie an der V10-Schublade.
    content.style.overflow = 'clip';
    content.style.overflowClipMargin = 'var(--sp-2)';
    // Der einzige `will-change` des Projekts, und zwar nach dem Muster der
    // Referenz: nur, solange etwas fährt. Die V8-Messung (66 statt 18
    // Compositor-Ebenen durch ein flächiges `will-change` auf jeder Ziffer)
    // ist der Grund, warum das hier eine Zeile Aufräumen wert ist.
    content.style.willChange = 'height, opacity';

    const animation = content.animate([from ?? (opening ? shut : wide), opening ? wide : shut], {
      duration: motionToken('--dur-calm', 250),
      easing: easingToken('--ease-spring', 'cubic-bezier(0.32, 0.72, 0, 1)'),
    });
    running = animation;

    animation.finished
      .then(() => {
        if (running !== animation) {
          return;
        }
        running = null;
        content.style.removeProperty('overflow');
        content.style.removeProperty('overflow-clip-margin');
        content.style.removeProperty('will-change');
        details.open = opening;
      })
      .catch(() => {
        // Abgebrochen — der nächste Lauf hat die Aufräumarbeit schon
        // übernommen, und `open` setzt er selbst.
      });
  }

  summary.addEventListener('click', (event) => {
    // Der Browser würde `open` sofort umlegen und den Inhalt damit noch vor
    // dem ersten Bild verschwinden lassen. Diese eine Zeile ist der Grund,
    // warum das Modul überhaupt existiert.
    event.preventDefault();
    play(!intended);
  });

  return {
    set(open: boolean): void {
      if (open === intended) {
        return;
      }
      play(open);
    },
  };
}

/** Hängt die Fahrt an alle Hinweis-Aufklapper des Dokuments. */
export function enhanceReveals(root: ParentNode = document): void {
  for (const details of root.querySelectorAll<HTMLDetailsElement>('details.reveal')) {
    enhanceDisclosure(details);
  }
}
