/**
 * Eine Listbox im Instrument-Stil — als AUFSATZ auf ein echtes `<select>`.
 *
 * ── Warum überhaupt, wenn V3 sich bewusst für das native Feld entschied ────
 * Der damalige Grund war richtig und gilt weiter: Ein selbstgebautes Menü muss
 * man tastaturfähig, scrollbar und bildschirmlesertauglich nachbauen, und das
 * bringt der Browser mit. Nur betrifft das genau die HALBE Wahrheit: Gestalten
 * lässt sich am `<select>` bloß die geschlossene Fläche. Die aufgeklappte Liste
 * gehört dem Betriebssystem — auf Windows ein grauer Kasten mit eckigen Ecken,
 * auf macOS etwas ganz anderes. Bei 37 Sprachen ist das die längste Liste der
 * App und der einzige Ort, an dem sichtbar fremdes Material auftaucht.
 *
 * ── Warum trotzdem kein Ersatz, sondern ein Aufsatz ────────────────────────
 * Das `<select>` bleibt im Dokument und bleibt die Wahrheit. Diese Klasse legt
 * sich darüber und spiegelt jede Auswahl zurück ins Feld, inklusive
 * `change`-Ereignis. Fällt das Skript aus, fällt nur der Aufsatz weg — die
 * Sprachwahl funktioniert weiter, mit der Systemliste. Das ist der Unterschied
 * zwischen progressive enhancement und einem Nachbau, der beim ersten Fehler
 * eine tote Fläche hinterlässt.
 *
 * ── Verhalten ─────────────────────────────────────────────────────────────
 * Nach dem Listbox-Muster der WAI-ARIA Authoring Practices:
 *
 *   ↑ ↓         eine Zeile
 *   Pos1 Ende   Anfang und Ende
 *   Buchstaben  springt zum nächsten Eintrag, der so anfängt (Tippsuche)
 *   Enter Space übernimmt und schließt
 *   Esc         schließt ohne Änderung, Fokus zurück auf den Knopf
 *   Tab / Klick nach außen  schließt
 *
 * Die aktive Zeile wird über `aria-activedescendant` gemeldet und nicht über
 * wandernden Fokus: Der Fokus bleibt dadurch auf einem Element, und das Panel
 * kann scrollen, ohne dass der Fokus ihm hinterherspringt.
 */

import { prefersReducedMotion } from './dom';
import { easingToken, motionToken } from './tokens';

/** Wie lange eine Tippsuche zusammenhängt, bevor sie neu beginnt. */
const TYPEAHEAD_MS = 700;

/**
 * Der Abgang des Popovers — das Gegenstück zu `listbox-in` in panels.css.
 *
 * ── Warum der EINTRITT in CSS steht und der ABGANG hier ────────────────────
 * Ein Eintritt braucht kein JavaScript: Das Element wechselt von `display:
 * none` auf sichtbar, und genau daran hängt eine CSS-Animation von selbst.
 * Ein Abgang kann das nicht — wer `hidden` setzt, nimmt das Element aus dem
 * Layout, bevor irgendetwas laufen könnte. Also läuft er über die Web
 * Animations API, und `hidden` kommt erst danach.
 *
 * Die Werte sind die der Referenz (`select.css`, `[data-exiting="true"]`:
 * `animate-out duration-100 zoom-out-95 fade-out`) — 100 ms sind
 * `--dur-flash`, dessen Kommentar in tokens.css schon „Popover zu" nennt.
 * Die Kurve ist die Hausfeder wie beim Eintritt: Ein Popover, das anders
 * herausfährt als hinein, wirkt wie zwei Bauteile.
 *
 * KEIN Weg zurück: `zoom-out-95` ist die Umkehrung von `zoom-in-95`, aber
 * OHNE den 4-px-Versatz. Die Referenz macht das genauso — beim Eintritt zeigt
 * die Bewegung, woher das Panel kommt; beim Abgang gibt es nichts mehr zu
 * zeigen, es verschwindet an Ort und Stelle.
 */
const LEAVE: Keyframe[] = [
  { opacity: 1, transform: 'none' },
  { opacity: 0, transform: 'scale(0.95)' },
];

export interface ListboxOptions {
  /** Das native Feld, das die Wahrheit hält. */
  select: HTMLSelectElement;
  /** Beschriftung für den Knopf und die Liste (kommt aus dem Katalog). */
  label: string;
}

export function enhanceSelect({ select, label }: ListboxOptions): void {
  const shell = select.closest('.pick-shell');
  if (!(shell instanceof HTMLElement) || select.options.length < 2) {
    return;
  }

  /* ── Aufbau ───────────────────────────────────────────────────────────── */

  const button = document.createElement('button');
  button.type = 'button';
  // Einzeln statt als ein String mit Leerzeichen: `ui-literals.test.ts` sucht
  // nach Zeichenketten, die wie Sätze aussehen, und „pick pick--button" sieht
  // für den Test wie einer aus. Eine Ausnahme in der Liste wäre die bequeme
  // Antwort — aber die Liste soll Ausnahmen enthalten, nicht Umgehungen.
  button.classList.add('pick', 'pick--button');
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', label);

  const value = document.createElement('span');
  value.className = 'pick__value';
  button.append(value);

  const list = document.createElement('div');
  list.className = 'listbox';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', label);
  list.hidden = true;
  list.tabIndex = -1;

  const options: HTMLElement[] = [];
  for (const [index, option] of [...select.options].entries()) {
    const row = document.createElement('div');
    row.setAttribute('role', 'option');
    row.className = 'listbox__option';
    row.id = `${select.id}-opt-${String(index)}`;
    row.dataset['value'] = option.value;
    row.textContent = option.textContent;
    // Wie am <option>: Damit greift für „日本語" und „العربية" schon in der
    // Liste die richtige Systemschrift und die richtige Leserichtung.
    if (option.lang !== '') {
      row.lang = option.lang;
    }
    options.push(row);
    list.append(row);
  }

  shell.append(button, list);
  // Das native Feld bleibt im Dokument und bleibt die Wahrheit — es wird nur
  // unsichtbar und aus der Tastaturreihenfolge genommen, damit nicht zwei
  // Bedienelemente dasselbe tun. `hidden` ginge nicht: Ein verstecktes Feld
  // meldet in manchen Browsern keine `change`-Ereignisse mehr.
  select.classList.add('pick--replaced');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  /* ── Zustand ──────────────────────────────────────────────────────────── */

  let open = false;
  let active = Math.max(0, select.selectedIndex);
  let typed = '';
  let typedAt = 0;
  /** Der laufende Abgang — solange er läuft, ist das Panel noch sichtbar. */
  let leaving: Animation | null = null;

  function paint(): void {
    const current = select.selectedIndex;
    value.textContent = select.options[current]?.textContent ?? '';
    const currentLang = select.options[current]?.lang ?? '';
    if (currentLang !== '') {
      value.lang = currentLang;
    }
    for (const [index, row] of options.entries()) {
      row.setAttribute('aria-selected', String(index === current));
      row.classList.toggle('is-active', open && index === active);
    }
    const activeRow = options[active];
    if (open && activeRow) {
      list.setAttribute('aria-activedescendant', activeRow.id);
      // `nearest`: Die Liste soll nur so weit rollen, wie nötig — ein `center`
      // würde bei jedem Pfeiltastendruck die ganze Liste verschieben.
      activeRow.scrollIntoView({ block: 'nearest' });
    } else {
      list.removeAttribute('aria-activedescendant');
    }
  }

  function setOpen(next: boolean): void {
    if (open === next) {
      return;
    }
    open = next;
    button.setAttribute('aria-expanded', String(open));

    // Ein laufender Abgang wird immer zuerst abgeräumt. Beim Wiederöffnen,
    // weil sein `finished` sonst gleich das frisch geöffnete Panel versteckte;
    // beim Schließen, weil zwei Abgänge übereinander dasselbe wären wie die
    // zwei Eintritte, die dieser Pass gerade aufgelöst hat.
    leaving?.cancel();
    leaving = null;
    delete list.dataset['exiting'];

    if (open) {
      list.hidden = false;
      active = Math.max(0, select.selectedIndex);
      paint();
      list.focus();
      return;
    }

    // Der Fokus wandert sofort zurück (das erledigen die Aufrufer) — nur das
    // BILD bleibt noch 100 ms stehen. Deshalb `data-exiting`: Ein Panel, das
    // man nicht mehr treffen soll, darf den Klick dahinter nicht schlucken.
    paint();

    if (prefersReducedMotion()) {
      list.hidden = true;
      return;
    }

    list.dataset['exiting'] = '';
    const animation = list.animate(LEAVE, {
      duration: motionToken('--dur-flash', 100),
      easing: easingToken('--ease-spring', 'cubic-bezier(0.32, 0.72, 0, 1)'),
      // Sonst blitzte das Panel zwischen dem letzten Bild der Animation und
      // dem Setzen von `hidden` für einen Frame wieder voll auf.
      fill: 'forwards',
    });
    leaving = animation;

    animation.finished
      .then(() => {
        if (leaving !== animation) {
          return;
        }
        list.hidden = true;
        delete list.dataset['exiting'];
        // Den Fill zurücknehmen, solange es niemand sieht: Bliebe er stehen,
        // wäre das Panel beim nächsten Öffnen unsichtbar.
        animation.cancel();
        leaving = null;
      })
      .catch(() => {
        // `finished` lehnt ab, wenn abgebrochen wurde — also wenn jemand das
        // Panel wieder geöffnet hat. Dann ist oben schon alles aufgeräumt.
      });
  }

  function commit(index: number): void {
    const row = options[index];
    if (!row) {
      return;
    }
    select.value = row.dataset['value'] ?? '';
    // Von Hand ausgelöst: Ein programmatisch gesetzter `value` feuert `change`
    // NICHT von selbst. Ohne diese Zeile bliebe die Sprache stehen und niemand
    // wüsste, warum.
    select.dispatchEvent(new Event('change', { bubbles: true }));
    setOpen(false);
    button.focus();
    paint();
  }

  /* ── Tastatur und Zeiger ──────────────────────────────────────────────── */

  function move(to: number): void {
    active = Math.min(options.length - 1, Math.max(0, to));
    paint();
  }

  /** Springt zum nächsten Eintrag, der auf die getippten Zeichen passt. */
  function typeahead(character: string): void {
    const now = performance.now();
    typed = now - typedAt > TYPEAHEAD_MS ? character : typed + character;
    typedAt = now;

    const needle = typed.toLowerCase();
    // Ab dem AKTUELLEN Eintrag suchen und einmal herumlaufen: Wer „d" tippt und
    // schon auf „Dansk" steht, will als Nächstes „Deutsch".
    const start = typed.length === 1 ? active + 1 : active;
    for (let step = 0; step < options.length; step++) {
      const index = (start + step) % options.length;
      const text = options[index]?.textContent?.toLowerCase() ?? '';
      if (text.startsWith(needle)) {
        move(index);
        return;
      }
    }
  }

  button.addEventListener('click', () => {
    setOpen(!open);
  });

  button.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.preventDefault();
      setOpen(true);
    }
  });

  list.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(active + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(active - 1);
        break;
      case 'Home':
        event.preventDefault();
        move(0);
        break;
      case 'End':
        event.preventDefault();
        move(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(active);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        button.focus();
        break;
      case 'Tab':
        // Nicht abfangen: Tab soll weiterwandern dürfen. Nur zumachen.
        setOpen(false);
        break;
      default:
        // Einzelne druckbare Zeichen sind Tippsuche. Modifikatoren nicht —
        // sonst schluckt die Liste Strg+C.
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          typeahead(event.key);
        }
    }
  });

  list.addEventListener('click', (event) => {
    const row = (event.target as HTMLElement | null)?.closest('[role="option"]');
    if (row instanceof HTMLElement) {
      commit(options.indexOf(row));
    }
  });

  // Zeigen statt Auswählen: Die Maus bewegt nur die aktive Zeile, geklickt wird
  // extra. Sonst führt jedes Vorbeifahren zu einer anderen Vorauswahl.
  list.addEventListener('mousemove', (event) => {
    const row = (event.target as HTMLElement | null)?.closest('[role="option"]');
    if (row instanceof HTMLElement) {
      move(options.indexOf(row));
    }
  });

  // Klick nach außen schließt. `pointerdown` statt `click`, damit die Liste weg
  // ist, bevor das Ziel des Klicks reagiert.
  document.addEventListener('pointerdown', (event) => {
    if (open && !shell.contains(event.target as Node)) {
      setOpen(false);
    }
  });

  // Wenn die Sprache von woanders kommt (Hash von Hand, Zurück-Knopf), muss der
  // Knopf mitziehen — er zeigt sonst etwas anderes an als das, was gilt.
  select.addEventListener('change', paint);

  paint();
}
