/**
 * Die Verdrahtung: Textfeld → Parser → Kanalzüge → Uhr.
 *
 * Der Datenfluss läuft absichtlich nur in eine Richtung:
 *
 *   Textfeld ändert sich ──► parseEntries() ──► Kanalzüge abgleichen
 *                                                     │
 *   Uhr tickt ────────────────────────────────────────┴──► strip.update(now)
 *
 * Es gibt keinen Zustand außer den Kanalzügen selbst. Nichts landet in
 * `localStorage`, `sessionStorage` oder einem Cookie — schließt man den Tab, ist
 * das Secret weg.
 */

import { applyStaticStrings } from '../i18n/apply';
import { translateLibMessage } from '../i18n/lib-text';
import { onLocaleChange, t, tn } from '../i18n/runtime';
import { parseEntries, type ParsedEntry } from '../lib/accounts';
import { isMigrationUri, MigrationError, parseMigrationUri } from '../lib/google-auth';
import { createStrip, type Strip, type StripContext } from './strip';
import { startClock } from './clock';
import { prefersReducedMotion, requireElement } from './dom';
import { describeForSearch, matchesFilter } from './filter';
import { buildGauge } from './gauge';
import { startLanguageSwitch } from './lang-switch';
import { startMasthead } from './masthead';
import { startScanner } from './scan';
import { easingToken, motionToken } from './tokens';
import { startVaultPanel } from './vault-panel';

/**
 * Wartezeit nach dem letzten Tastendruck, bevor neu ausgewertet wird.
 *
 * Ohne diese Pause blitzt beim Eintippen eines Secrets nach jedem Zeichen eine
 * Fehlerzeile auf — nur um beim nächsten Zeichen wieder zu verschwinden.
 */
const INPUT_DEBOUNCE_MS = 220;

/**
 * Ab wie vielen Konten die Bühne ein Filterfeld bekommt — und zweispaltig
 * werden darf.
 *
 * Beides hängt an derselben Zahl, weil beides dieselbe Frage beantwortet: Ab
 * wann ist die Liste eine Liste und keine Aufzählung mehr? Darunter wäre der
 * Filter ein Bedienelement für ein Problem, das es nicht gibt, und zwei Spalten
 * wären eine angefangene Zeile mit einer Lücke daneben.
 *
 * Die Breite entscheidet CSS (ab 1400 px, siehe style.css) — sie ist eine Frage
 * an das Fenster, nicht an die Daten.
 */
const DENSE_FROM = 8;

export function startApp(): void {
  const input = requireElement<HTMLTextAreaElement>(document, '#secrets');
  const device = requireElement(document, '.device');
  const stripHost = requireElement(document, '#strips');
  const vacant = requireElement(document, '#vacant');
  const stage = requireElement(document, '#zone-codes');
  const vaultZone = requireElement(document, '#zone-vault');
  const filterBar = requireElement(document, '#stage-filter');
  const filterField = requireElement<HTMLInputElement>(document, '#strip-filter');
  const filterVoid = requireElement(document, '#filter-void');
  const keyClear = requireElement<HTMLButtonElement>(document, '#key-clear');
  const keyDemo = requireElement<HTMLButtonElement>(document, '#key-demo');
  const meter = requireElement(document, '#entry-count');
  const liveRegion = requireElement(document, '#live-region');
  const importNote = requireElement(document, '#import-note');

  const context: StripContext = {
    announce(message: string): void {
      liveRegion.textContent = message;
    },
  };

  let noteTimer = 0;

  /**
   * Rückmeldung zu Import und Scan.
   *
   * Das Element ist `aria-live="polite"` und damit die einzige Stelle neben dem
   * Kopieren, die Screenreader von sich aus anspricht — beides sind Reaktionen
   * auf eine Nutzeraktion. Die rotierenden Codes bleiben stumm.
   */
  function setNote(message: string): void {
    window.clearTimeout(noteTimer);
    importNote.textContent = message;
    if (message !== '') {
      noteTimer = window.setTimeout(() => {
        importNote.textContent = '';
      }, 12_000);
    }
  }

  /** Kanalzüge nach ihrem Schlüssel — damit beim Tippen nur Geändertes neu entsteht. */
  let strips = new Map<string, Strip>();
  let debounceTimer = 0;

  /**
   * Der Text, gegen den der Filter sucht — je Kanalzug einmal vorbereitet.
   *
   * Ausdrücklich NICHT der gerenderte Inhalt des Elements: Dort stünde auch der
   * Code drin, und dann fände eine Suche nach „123" alle Konten, deren Code
   * gerade zufällig so anfängt — eine Sekunde später andere. Ein Filter, dessen
   * Treffer mit der Uhr wandern, ist kein Filter.
   *
   * Das Secret steht hier ebenfalls nicht drin. Es ist kein Suchbegriff.
   */
  let searchText = new Map<string, string>();
  let visibleCount = 0;

  function render(entries: ParsedEntry[]): void {
    const next = new Map<string, Strip>();
    const nextText = new Map<string, string>();
    const ordered = document.createDocumentFragment();
    const fresh: HTMLElement[] = [];

    entries.forEach((entry, index) => {
      // Bestehenden Kanalzug wiederverwenden, wenn die Zeile unverändert ist.
      // Das verhindert vor allem ein Flackern der Codes bei jedem Tastendruck in
      // einer anderen Zeile.
      const existing = strips.get(entry.key);
      const strip = existing ?? createStrip(entry, index, context);
      // Nur wirklich neue Kanalzüge federn ein. Der Unterschied ist wichtig:
      // `replaceChildren` hängt unten ALLE Elemente neu ein, und eine
      // CSS-Animation würde dadurch bei jedem Tastendruck auf der ganzen Liste
      // neu starten. Deshalb wird hier gemerkt, wer neu ist, und die Bewegung
      // läuft danach gezielt über die Web Animations API.
      if (existing === undefined) {
        fresh.push(strip.element);
      }
      next.set(entry.key, strip);
      nextText.set(entry.key, describeForSearch(entry));
      ordered.append(strip.element);
    });

    for (const [key, strip] of strips) {
      if (!next.has(key)) {
        strip.destroy();
      }
    }

    strips = next;
    searchText = nextText;
    stripHost.replaceChildren(ordered);

    const accounts = entries.filter((entry) => entry.kind === 'account').length;

    /* ── Die Bühne wechseln ────────────────────────────────────────────────
       Ein Attribut, eine Stelle. Alles Weitere — welche Zone verschwindet, wie
       breit `main` wird, ob das Feld atmet — steht in style.css und hängt an
       diesem einen Wert. Zwei Zustände, die an fünf Stellen im JavaScript
       zusammengesetzt werden, laufen früher oder später auseinander. */
    const wanted = entries.length === 0 ? 'vacant' : 'working';
    const changed = device.dataset['stage'] !== wanted;
    device.dataset['stage'] = wanted;

    vacant.hidden = wanted === 'working';
    filterBar.hidden = accounts < DENSE_FROM;
    if (filterBar.hidden && filterField.value !== '') {
      filterField.value = '';
    }

    applyFilter();
    meter.textContent = summarise(entries);
    paintKeys();
    paintVaultZone();

    // Sofort ein Tick, damit frische Kanalzüge nicht bis zum nächsten Frame
    // leer dastehen.
    tick(Date.now());
    revealStrips(fresh);
    if (changed && wanted === 'working') {
      revealStage(stage);
    }
  }

  /* ── Der Filter ──────────────────────────────────────────────────────────
     Er versteckt Kanalzüge, er baut sie nicht neu. Der Unterschied ist mehr als
     Bequemlichkeit: Ein weggefilterter Kanalzug läuft weiter mit der Uhr, und
     wer den Filter leert, bekommt seinen Code sofort und richtig zurück statt
     eines Zifferblatts, das erst wieder anlaufen muss. */
  function applyFilter(): void {
    const needle = filterField.value.trim();
    visibleCount = 0;

    for (const [key, strip] of strips) {
      const hit = matchesFilter(searchText.get(key) ?? '', needle);
      strip.element.hidden = !hit;
      if (hit) visibleCount++;
    }

    const nothing = needle !== '' && visibleCount === 0;
    filterVoid.hidden = !nothing;
    if (nothing) {
      filterVoid.textContent = t('filter.empty', { query: filterField.value.trim() });
    }

    // Zwei Spalten erst, wenn auch nach dem Filtern genug übrig ist. Sonst
    // stünden nach dem Eintippen eines Buchstabens zwei Kanalzüge nebeneinander
    // und daneben eine leere Hälfte.
    stripHost.classList.toggle('strips--dense', visibleCount >= DENSE_FROM);
  }

  filterField.addEventListener('input', applyFilter);

  /* ── Welche Taste wann ───────────────────────────────────────────────────
     Beide hängen am FELDINHALT und nicht an der Bühne. Eine Zeile, die nur ein
     `#`-Kommentar ist, ergibt keinen Eintrag — die Bühne bliebe also leer,
     obwohl sehr wohl etwas im Feld steht, das man leeren kann. Und der
     Testschlüssel darf in genau dem Moment nicht mehr erreichbar sein, in dem
     das Feld nicht mehr leer ist; alles andere wäre eine zweite Definition von
     „leer" neben der im Handler. */
  function paintKeys(): void {
    const empty = input.value.trim() === '';
    keyClear.hidden = input.value === '';
    keyDemo.hidden = !empty;
  }

  /* ── Der Tresor im Leerzustand ───────────────────────────────────────────
     Weg — er ist erst relevant, wenn es etwas zu speichern gibt.

     Mit einer Ausnahme, und die ist keine Feinheit: Ist bereits ein Tresor
     GESPERRT, dann ist das Feld beim Laden der Seite leer — genau deshalb, weil
     der Inhalt im Tresor liegt. Würde die Zone dann verschwinden, wäre das
     Passphrasenfeld unerreichbar und der Tresor faktisch nicht mehr zu öffnen.
     Der Leerzustand versteckt also nur einen Tresor, der aus ist. */
  let vaultState: 'off' | 'locked' | 'open' = 'off';

  function paintVaultZone(): void {
    vaultZone.hidden = device.dataset['stage'] === 'vacant' && vaultState === 'off';
  }

  function tick(nowMs: number): void {
    for (const strip of strips.values()) {
      strip.update(nowMs);
    }
  }

  function reparse(): void {
    render(parseEntries(input.value));
  }

  input.addEventListener('input', () => {
    // Die Tasten hängen am Feldinhalt und dürfen deshalb NICHT auf die
    // Wartezeit warten: „Leeren" soll da sein, sobald das erste Zeichen steht,
    // nicht eine Fünftelsekunde später. Die Bühne wechselt weiter erst nach dem
    // Auswerten — sie hängt an den Einträgen, nicht am Tippen.
    paintKeys();
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(reparse, INPUT_DEBOUNCE_MS);
  });

  // Beim Einfügen sofort reagieren: Da ist die Eingabe in einem Rutsch fertig,
  // eine Wartezeit wäre nur träge. Ein eingefügter Google-Export wird direkt
  // umgewandelt.
  input.addEventListener('paste', () => {
    window.clearTimeout(debounceTimer);
    window.setTimeout(() => {
      expandMigrationLines();
      reparse();
    }, 0);
  });

  keyClear.addEventListener('click', () => {
    input.value = '';
    input.focus();
    reparse();
  });

  /* ── Der Testschlüssel im Leerzustand ────────────────────────────────────
     Der Wert ist der Testvektor aus RFC 4226 Anhang D — Base32 für den ASCII-
     Text „12345678901234567890". Er steht in der Norm, in der Doku und in den
     Tests; er ist das Gegenteil eines Geheimnisses.

     Die Prüfung auf ein leeres Feld ist trotzdem da, und zwar als zweites
     Schloss: Der Knopf lebt im Leerzustand und ist deshalb unerreichbar, sobald
     eine Zeile im Feld steht. Sollte diese Kopplung je brechen — ein
     umgebautes Markup, ein vergessenes `hidden` —, überschreibt er hier
     trotzdem nichts. Bei Schlüsselmaterial ist ein zweites Schloss billiger
     als die Frage, ob das erste noch hält.

     Der Kontoname davor ist eine Normnummer und wird deshalb NICHT übersetzt —
     „RFC 4226" heißt in jeder Sprache so. Genau dafür steht die Zeile in der
     Ausnahmenliste von ui-literals.test.ts. */
  const RFC_TEST_LINE = 'RFC 4226: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  keyDemo.addEventListener('click', () => {
    if (input.value.trim() !== '') {
      return;
    }
    input.value = RFC_TEST_LINE;
    input.focus();
    reparse();
  });

  /* ── Google-Authenticator-Export ─────────────────────────────────────────
     Eine `otpauth-migration://`-Zeile wird an Ort und Stelle durch die
     entsprechenden `otpauth://`-Zeilen ersetzt. Der Nutzer SIEHT damit, was
     importiert wurde, und kann es prüfen oder löschen — ein Import, der
     Schlüsselmaterial still im Hintergrund anlegt, wäre hier das falsche
     Verhalten. Ab da laufen die Zeilen durch denselben Parser wie alles andere.

     Die Meldungen von `parseMigrationUri` entstehen in src/lib und sind dort
     deutsch formuliert; übersetzt wird an dieser Grenze. */
  function expandMigrationLines(): void {
    const lines = input.value.split(/\r?\n/);
    if (!lines.some((line) => isMigrationUri(line))) {
      return;
    }

    const expanded: string[] = [];
    let imported = 0;
    const skipped: string[] = [];
    const problems: string[] = [];

    for (const line of lines) {
      if (!isMigrationUri(line)) {
        expanded.push(line);
        continue;
      }
      try {
        const result = parseMigrationUri(line);
        expanded.push(...result.lines);
        imported += result.imported;
        skipped.push(...result.skipped.map(translateLibMessage));
      } catch (error) {
        const message =
          error instanceof MigrationError
            ? translateLibMessage(error.message)
            : t('import.unreadable');
        expanded.push(`# ${message}`);
        problems.push(message);
      }
    }

    input.value = expanded.join('\n');
    reparse();

    const parts: string[] = [];
    if (imported > 0) {
      parts.push(tn('import.done', imported));
    }
    if (skipped.length > 0) {
      parts.push(t('import.skipped', { list: skipped.join(', ') }));
    }
    parts.push(...problems);
    setNote(parts.join(' · '));
  }

  /* ── QR-Import ───────────────────────────────────────────────────────────
     Kamera, Bilddatei, Ziehen und Einfügen enden alle hier. Der Inhalt eines
     QR-Codes ist Text aus einer fremden Quelle und wird deshalb wie eine
     getippte Zeile behandelt: angehängt, geparst, sichtbar. */
  startScanner({
    onResult(text: string): void {
      const line = text.trim();
      const existing = input.value.trim();
      input.value = existing === '' ? line : `${existing}\n${line}`;
      expandMigrationLines();
      reparse();
      if (!isMigrationUri(line)) {
        setNote(t('scan.done'));
      }
    },
    onProblem(message: string): void {
      setNote(message);
    },
  });

  /* ── Tresor ──────────────────────────────────────────────────────────── */

  const stateText = requireElement(document, '#state-text');
  const stateLamp = requireElement(document, '.lamp');

  startVaultPanel({
    readSecrets: () => input.value,
    writeSecrets(text: string): void {
      input.value = text;
      reparse();
    },
    // Als Pfeilfunktion weitergereicht, nicht als Methodenreferenz: `announce`
    // losgelöst zu übergeben würde `this` verlieren, sobald daraus je eine
    // Methode wird.
    announce: (message) => {
      context.announce(message);
    },
    reportState(state): void {
      vaultState = state;
      paintVaultZone();
      // Die Statuszeile im Kopf sagt, was tatsächlich der Fall ist. „Offline"
      // gilt immer; der zweite Teil hängt am Tresor. Beide Teile stehen als
      // eigene Platzhalter in `status.line`, damit eine Sprache sie umstellen
      // kann.
      const vaultLabel = {
        off: t('status.vault.off'),
        locked: t('status.vault.locked'),
        open: t('status.vault.open'),
      }[state];
      stateText.textContent = t('status.line', {
        connection: t('status.offline'),
        vault: vaultLabel,
      });
      stateLamp.classList.toggle('lamp--signal', state === 'open');
    },
  });

  startLanguageSwitch();
  startMasthead(requireElement(document, '.masthead'));

  // Der Leerzustand trägt das Emblem — dieselbe Teilung, die gleich die Codes
  // begleitet. Es steht still: Es gibt noch nichts zu messen.
  buildGauge(requireElement<SVGSVGElement>(document, '#vacant-dial'), 30);

  /* ── Sprachwechsel ───────────────────────────────────────────────────────
     Die Kanalzüge tragen übersetzte Beschriftungen (Kontoname-Rückfall,
     Parameterzeile, Kopiertaste) und werden deshalb komplett verworfen. Sie
     über einen eigenen Rückruf nachzubessern wäre mehr Code und eine weitere
     Stelle, die man vergessen kann — neu bauen kostet hier nichts. */
  onLocaleChange(() => {
    applyStaticStrings();
    for (const strip of strips.values()) {
      strip.destroy();
    }
    strips = new Map();
    setNote('');
    reparse();
  });

  startClock(tick);
  reparse();
}

/**
 * Wie ein neuer Kanalzug ins Gehäuse kommt.
 *
 * Sechs Pixel von unten und aus der Durchsicht heraus, auf der Federkurve —
 * gerade genug, dass das Auge die Stelle findet, an der etwas dazugekommen ist.
 * Ein Aufklappen der Höhe wäre die naheliegende Alternative und wäre falsch:
 * Das animiert Layout statt Compositor und schiebt bei jedem Bild alles
 * darunter neu.
 *
 * Der Versatz je Kanal ist bei sechs gedeckelt. Wer einen Google-Export mit
 * dreißig Konten einfügt, soll nicht eine Sekunde lang beim Aufbauen zusehen.
 */
const ENTER: Keyframe[] = [
  { opacity: 0, transform: 'translateY(6px)' },
  { opacity: 1, transform: 'none' },
];

const MAX_STAGGERED = 6;

/**
 * Der Wechsel von der Onboarding-Bühne in den Arbeitszustand.
 *
 * Nur die Bühne, die DAZUKOMMT, bewegt sich — und auch die nur einmal, beim
 * Wechsel. Ein Ausblenden des Leerzustands gibt es bewusst nicht: Es würde das
 * Umschalten des Layouts hinauszögern, und ein Feld, in das man gerade tippt,
 * darf nicht auf eine Animation warten.
 *
 * Dieselbe Feder wie überall, und `prefers-reduced-motion` schaltet sie ab —
 * hier ist das unkritisch, weil die Bewegung nichts MITTEILT: Was sie zeigt,
 * steht danach ohnehin da. Genau darin unterscheidet sie sich von der
 * Kopier-Quittung, die deshalb ein Zustand ist und keine Animation.
 */
function revealStage(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    return;
  }
  element.animate(ENTER, {
    duration: motionToken('--dur-sheet', 350),
    easing: easingToken('--ease-spring', 'cubic-bezier(0.32, 0.72, 0, 1)'),
    fill: 'backwards',
  });
}

function revealStrips(elements: HTMLElement[]): void {
  if (elements.length === 0 || prefersReducedMotion()) {
    return;
  }

  const duration = motionToken('--dur-sheet', 350);
  const stagger = motionToken('--stagger-flap', 16);
  const easing = easingToken('--ease-spring', 'cubic-bezier(0.32, 0.72, 0, 1)');

  elements.forEach((element, index) => {
    element.animate(ENTER, {
      duration,
      delay: Math.min(index, MAX_STAGGERED) * stagger * 2,
      easing,
      fill: 'backwards',
    });
  });
}

/** „2 Konten · 1 Fehler" — die Bilanz unter dem Eingabefeld. */
function summarise(entries: ParsedEntry[]): string {
  if (entries.length === 0) {
    return '';
  }
  const accounts = entries.filter((entry) => entry.kind === 'account').length;
  const faults = entries.length - accounts;

  if (accounts > 0 && faults > 0) {
    return t('input.count.join', {
      accounts: tn('input.count.accounts', accounts),
      errors: tn('input.count.errors', faults),
    });
  }
  if (accounts > 0) {
    return tn('input.count.accounts', accounts);
  }
  return tn('input.count.errors', faults);
}
