/**
 * Der klebende Kopf und seine Ebene.
 *
 * Seit V5 klebt die Kopfzeile oben. Sie ist damit die einzige Fläche der App,
 * unter der tatsächlich etwas durchläuft.
 *
 * Bis V7 schaltete dieses Modul ein Frost-Material (`backdrop-filter`). Seit V8
 * ist der Kopf deckend — die Begründung steht bei `.masthead` in src/style.css.
 * Geschaltet wird deshalb kein Material mehr, sondern nur noch, was eine Ebene
 * ausmacht: die Kante nach unten und der Schatten.
 *
 * ── Warum das nicht immer da ist ───────────────────────────────────────────
 * Am Seitenanfang liegt unter dem Kopf nichts als das Gehäuse, dessen Ton er
 * selbst trägt. Eine Fläche, die dort schon schwebt, behauptet eine Erhebung,
 * die es nicht gibt: kein verdeckter Inhalt, kein Grund für einen Schatten.
 * Also bekommt der Kopf seine Ebene genau dann, wenn er anfängt, etwas zu
 * verdecken.
 *
 * ── Warum ein Beobachter und kein Scroll-Rückruf ───────────────────────────
 * Ein `scroll`-Listener liefe bei jedem Bild und müsste jedes Mal eine Position
 * abfragen — also eine Layout-Messung mitten im Scrollen, genau die Sorte
 * Fehler, die man später als „ruckelt manchmal" sucht. Der IntersectionObserver
 * meldet stattdessen genau zwei Ereignisse pro Richtungswechsel, und die
 * Messung übernimmt der Compositor.
 *
 * Der Fühler ist ein Pixel am Dokumentanfang. Er entsteht hier und nicht in
 * index.html, weil er reine Darstellung ist: Ohne JavaScript gibt es auch keine
 * Ebene, die er schalten könnte — dann steht der Kopf schlicht flach da, und die
 * Seite funktioniert vollständig.
 */

const LIFTED = 'masthead--lifted';

export function startMasthead(masthead: HTMLElement): void {
  // Ohne Beobachter (sehr alte Stände) bleibt der Kopf flach. Das ist der
  // richtige Rückfall: lieber gar keine Erhebung als eine, die nie wieder
  // verschwindet.
  if (typeof IntersectionObserver !== 'function') {
    return;
  }

  const sentinel = document.createElement('div');
  sentinel.className = 'scroll-sentinel';
  sentinel.setAttribute('aria-hidden', 'true');
  document.body.prepend(sentinel);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        masthead.classList.toggle(LIFTED, !entry.isIntersecting);
      }
    },
    // Der Fühler gilt als draußen, sobald er den oberen Rand verlässt — nicht
    // erst, wenn er ganz weg ist.
    { threshold: 0 },
  );

  observer.observe(sentinel);
}
