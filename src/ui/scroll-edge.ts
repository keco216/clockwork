/**
 * Kantenzeichen an den beiden Scrollflächen des Geräts.
 *
 * Eine Fläche, die weiterläuft, soll das sagen — und nur dann, wenn sie es
 * wirklich tut. Betroffen sind genau zwei Stellen: die Bedienseite (`.rail`,
 * erst ab 64 rem eine Scrollfläche) und das Sprach-Popover (`.listbox`).
 *
 * ── Warum Fühler und kein Scroll-Zuhörer ───────────────────────────────────
 * Dieselbe Begründung wie beim klebenden Kopf (ui/masthead.ts): Ein
 * `scroll`-Zuhörer liefe bei jedem Bild und müsste jedes Mal eine Position
 * abfragen — eine Layout-Messung mitten im Scrollen. Der
 * IntersectionObserver meldet stattdessen zwei Ereignisse pro
 * Richtungswechsel, und die Messung übernimmt der Compositor.
 *
 * ── Warum die beiden Fühler verschieden gebaut sind ───────────────────────
 * Der obere steht ABSOLUT und kostet damit nichts. Das ist in einem Flexkasten
 * mit 24 px Fuge kein Luxus: Ein Kind der Höhe 0 kostet trotzdem eine Fuge —
 * genau die „toten Fugen", die der V8-Abstands-Pass ausgeräumt hat und die
 * `checkNoDeadGaps` seither sucht.
 *
 * Der untere kann das NICHT, und das ist gemessen: Ein absolut positioniertes
 * Kind bezieht sich auf die Polsterbox seines Scrollers, und die ist so hoch
 * wie das SICHTFENSTER, nicht wie der Inhalt. `inset-block-end: 0` markiert
 * damit die Unterkante des Bildes und nicht das Ende der Liste — der Fühler
 * war in der ersten Fassung immer sichtbar, und `data-scroll-end` kam nie.
 *
 * Der untere Fühler steht deshalb im FLUSS, als letztes Kind, und rechnet
 * seine Fuge mit einem negativen Außenabstand wieder auf. Wie groß die ist,
 * liest er selbst aus dem Scroller — dieselbe Mechanik wie in ui/message.ts,
 * und damit kein Wert, den jemand nachziehen müsste.
 *
 * ── Warum eine Maske und kein Verlauf darüber ──────────────────────────────
 * Weil `.rail` keinen eigenen Grund hat. Sie trägt weiße Karten auf hellgrauem
 * Seitengrund; ein Verlauf in `--surface` läge als weißer Streifen über dem
 * Grund, einer in `--ground` als grauer über den Karten. Es gibt keine Farbe,
 * die an beiden Stellen richtig wäre. Eine Maske hat das Problem nicht: Sie
 * blendet aus, was da ist, statt etwas darüberzulegen — und genau deshalb
 * macht die Referenz es auch so (`scroll-shadow.css` arbeitet mit
 * `mask-image`, nicht mit einem Pseudo-Element).
 *
 * Der zweite Grund ist derselbe wie oben: Ein Pseudo-Element an einem
 * Flexkasten wäre ein Flexkind mit eigener Fuge.
 */

const OBSERVED = 'scroll-edge';

/**
 * Hängt die Kantenzeichen an eine Scrollfläche.
 *
 * Setzt `data-scroll-start` bzw. `data-scroll-end` am Scroller, sobald an der
 * jeweiligen Seite Inhalt aus dem Bild läuft. Die Maske selbst steht in CSS
 * (styles/panels.css) — dieses Modul weiß nur, WANN, nicht WIE.
 */
export function enhanceScroller(scroller: HTMLElement): void {
  // Ohne Beobachter bleibt die Fläche unmarkiert. Der richtige Rückfall:
  // lieber kein Kantenzeichen als eines, das nie wieder verschwindet.
  if (typeof IntersectionObserver !== 'function') {
    return;
  }

  scroller.classList.add(OBSERVED);

  const sentinels = (['start', 'end'] as const).map((edge) => {
    const sentinel = document.createElement('div');
    sentinel.className = 'scroll-edge__sentinel';
    sentinel.dataset['edge'] = edge;
    sentinel.setAttribute('aria-hidden', 'true');
    scroller.append(sentinel);
    return sentinel;
  });

  // Die Fuge, die der untere Fühler als Flexkind kostet, rechnet er selbst
  // wieder auf. `rowGap` ist bei einem Blockkasten „normal" — daraus wird
  // hier 0, und das ist richtig: Dort gibt es keine Fuge.
  const gap = Number.parseFloat(getComputedStyle(scroller).rowGap);
  if (Number.isFinite(gap) && gap > 0) {
    sentinels[1]?.style.setProperty('margin-block-start', `${String(-gap)}px`);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const edge = (entry.target as HTMLElement).dataset['edge'];
        // Der Fühler ist DRAUSSEN, also liegt an dieser Seite etwas verborgen.
        scroller.toggleAttribute(
          edge === 'start' ? 'data-scroll-start' : 'data-scroll-end',
          !entry.isIntersecting,
        );
      }
    },
    { root: scroller, threshold: 0 },
  );

  for (const sentinel of sentinels) {
    observer.observe(sentinel);
  }
}
