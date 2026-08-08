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

export function startApp(): void {
  const input = requireElement<HTMLTextAreaElement>(document, '#secrets');
  const stripHost = requireElement(document, '#strips');
  const vacant = requireElement(document, '#vacant');
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

  function render(entries: ParsedEntry[]): void {
    const next = new Map<string, Strip>();
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
      ordered.append(strip.element);
    });

    for (const [key, strip] of strips) {
      if (!next.has(key)) {
        strip.destroy();
      }
    }

    strips = next;
    stripHost.replaceChildren(ordered);

    vacant.hidden = entries.length > 0;
    meter.textContent = summarise(entries);

    // Sofort ein Tick, damit frische Kanalzüge nicht bis zum nächsten Frame
    // leer dastehen.
    tick(Date.now());
    revealStrips(fresh);
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

  requireElement<HTMLButtonElement>(document, '#key-clear').addEventListener('click', () => {
    input.value = '';
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
