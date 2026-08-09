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
 *
 * ── Und warum hier seit V11 DOCH ein Scroll-Rückruf steht ──────────────────
 * Weil der Einwand oben eine Layout-MESSUNG betrifft, nicht das Ereignis. Was
 * der zweite Teil dieses Moduls braucht, ist die Scrollrichtung, und die steht
 * in `window.scrollY`: ein gepufferter Wert, den der Browser ohnehin führt und
 * dessen Abfrage kein Neuberechnen des Layouts auslöst. Die Kopfhöhe — die
 * einzige echte Messung — wird EINMAL genommen und über einen ResizeObserver
 * frisch gehalten, nicht bei jedem Bild.
 *
 * Der Rückruf ist passiv und wird per `requestAnimationFrame`
 * zusammengefasst; pro Bild läuft er höchstens einmal.
 */

const LIFTED = 'masthead--lifted';
const STOWED = 'masthead--stowed';

/** Genau die Gegenseite von 64rem — die dokumentierte Schwelle des Projekts. */
const MOBIL = '(max-width: 63.9375rem)';

/* ── Die Hysterese ─────────────────────────────────────────────────────────
   Ohne sie flattert der Kopf: Jede Trackpad-Bewegung wechselt ein paarmal die
   Richtung, und der Riegel führe im Takt mit.

   Die drei Beträge sind bewusst UNGLEICH. Verstauen darf teuer sein — wer
   liest, scrollt am Stück, und 24 px sind eine halbe Zeile. Zurückholen muss
   billig sein: Wer nach oben wischt, will etwas vom Kopf (den Zustand, die
   Marke) und soll ihn nicht erst freischaufeln müssen. Und ganz oben gibt es
   nichts zu verstauen, deshalb die dritte Zahl. */
const VERSTAUEN_AB = 24;
const ZURUECK_AB = 12;
const IMMER_SICHTBAR_BIS = 8;

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
  startStowing(masthead);
}

/**
 * Der Kopf weicht beim Runterscrollen — aber nur auf dem Handy.
 *
 * ── Warum überhaupt ────────────────────────────────────────────────────────
 * Unter 46 rem hat der Kopf drei Zeilen (Wortmarke, Untertitel, Zustand). Auf
 * einem 812 px hohen Schirm ist das ein Zehntel der Höhe, dauerhaft belegt von
 * etwas, das man einmal liest. Auf dem Schreibtisch stellt sich die Frage
 * nicht — dort ist er einzeilig und die Höhe im Überfluss vorhanden.
 *
 * ── Das Muster ist geliehen, und zwar von der Browserleiste ────────────────
 * Runter heißt lesen, hoch heißt suchen. Wer nach oben wischt, will meistens
 * etwas, das oben steht; deshalb kommt der Kopf beim ERSTEN Aufwärtsweg
 * zurück und nicht erst am Seitenanfang.
 *
 * ── Was hier ausdrücklich NICHT passiert ───────────────────────────────────
 * Kein `will-change`, keine Höhenänderung, kein Layout. Bewegt wird
 * ausschließlich `transform`, und das läuft auf dem Compositor — die
 * Compositor-Zusage aus V8 (18 Ebenen im Ruhezustand) bleibt damit unberührt,
 * denn eine Transformation, die gerade steht, befördert nichts.
 *
 * `prefers-reduced-motion` braucht keinen Sonderfall: Die globale Klammer in
 * style.css nimmt dem Übergang die Dauer. Der ZUSTAND bleibt — der Kopf ist
 * dann sofort weg und sofort wieder da, ohne Weg dazwischen. Genau richtig:
 * Verstauen ist hier kein Effekt, sondern gewonnener Platz.
 *
 * ── Zwei Fälle, die durchgespielt wurden ───────────────────────────────────
 * Der Kopf enthält kein fokussierbares Element (nachgezählt: null Treffer für
 * `a`, `button`, `input`, `select`, `textarea`, `tabindex` im `<header>`).
 * Damit entfällt der ganze Fokus-Sonderfall, der beim Kamerasucher nötig war:
 * Hier kann nichts verschwinden, worauf der Fokus steht.
 *
 * Sprunglink und `scroll-padding-block-start`: Beide lösen einen Scroll AUS,
 * und jeder Scroll läuft durch diesen Rückruf. Ein Sprung nach unten verstaut
 * den Kopf (richtig — das Ziel bekommt die volle Höhe), ein Tabulator-Sprung
 * nach oben holt ihn zurück. Das Scroll-Polster bleibt in beiden Fällen
 * großzügig; es rechnet mit einem Kopf, der da sein KÖNNTE.
 */
function startStowing(masthead: HTMLElement): void {
  const mobil = window.matchMedia(MOBIL);

  let hoehe = masthead.getBoundingClientRect().height;
  let letztes = 0;
  /** Wo die aktuelle Richtung begonnen hat — der Bezugspunkt der Hysterese. */
  let wende = 0;
  let abwaerts = false;
  let angefordert = false;

  // Die einzige echte Messung, und sie läuft nicht im Scroll: Der Kopf ändert
  // seine Höhe nur, wenn sich Fenster oder Übersetzung ändern.
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => {
      hoehe = masthead.getBoundingClientRect().height;
    }).observe(masthead);
  }

  /** Geklemmt, weil iOS beim Gummiband negative und zu große Werte liefert. */
  function position(): number {
    const grenze = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(Math.max(window.scrollY, 0), grenze);
  }

  function pruefen(): void {
    angefordert = false;
    const y = position();

    if (y <= IMMER_SICHTBAR_BIS) {
      masthead.classList.remove(STOWED);
      letztes = y;
      wende = y;
      return;
    }

    const jetztAbwaerts = y > letztes;
    if (jetztAbwaerts !== abwaerts) {
      abwaerts = jetztAbwaerts;
      wende = letztes;
    }

    const weg = Math.abs(y - wende);
    if (abwaerts) {
      // Erst verstauen, wenn der Kopf ohnehin schon durchgelaufen ist —
      // sonst führe er dem Inhalt entgegen, den er gerade freigibt.
      if (y > hoehe && weg >= VERSTAUEN_AB) {
        masthead.classList.add(STOWED);
      }
    } else if (weg >= ZURUECK_AB) {
      masthead.classList.remove(STOWED);
    }

    letztes = y;
  }

  function beiScroll(): void {
    if (angefordert) {
      return;
    }
    angefordert = true;
    requestAnimationFrame(pruefen);
  }

  function schalten(): void {
    if (mobil.matches) {
      // `passive`: Dieser Zuhörer verändert das Ereignis nicht, und der
      // Browser darf das Scrollen nicht auf ihn warten lassen.
      window.addEventListener('scroll', beiScroll, { passive: true });
      letztes = position();
      wende = letztes;
      return;
    }
    window.removeEventListener('scroll', beiScroll);
    // Auf dem Schreibtisch darf kein verstauter Kopf zurückbleiben.
    masthead.classList.remove(STOWED);
  }

  mobil.addEventListener('change', schalten);
  schalten();
}
