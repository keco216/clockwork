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

import { parseEntries, type ParsedEntry } from '../lib/accounts';
import { isMigrationUri, MigrationError, parseMigrationUri } from '../lib/google-auth';
import { createStrip, type Strip, type StripContext } from './strip';
import { startClock } from './clock';
import { requireElement } from './dom';
import { buildGauge } from './gauge';
import { startScanner } from './scan';
import { startVaultPanel } from './vault-panel';

/**
 * Wartezeit nach dem letzten Tastendruck, bevor neu ausgewertet wird.
 *
 * Ohne diese Pause blitzt beim Eintippen eines Secrets nach jedem Zeichen eine
 * Fehlerzeile auf — nur um beim nächsten Zeichen wieder zu verschwinden.
 */
const INPUT_DEBOUNCE_MS = 220;

/** Was „Demo einsetzen" einfügt. */
const DEMO_CONTENT = [
  '# Testschlüssel aus RFC 4226 — das Secret ist der Text "12345678901234567890"',
  'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
  'otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
].join('\n');

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

    entries.forEach((entry, index) => {
      // Bestehenden Kanalzug wiederverwenden, wenn die Zeile unverändert ist.
      // Das verhindert vor allem ein Flackern der Codes bei jedem Tastendruck in
      // einer anderen Zeile.
      const strip = strips.get(entry.key) ?? createStrip(entry, index, context);
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
  }

  function tick(nowMs: number): void {
    for (const strip of strips.values()) {
      strip.update(nowMs);
    }
  }

  function reparse(): void {
    render(parseEntries(input.value));
  }

  function insertDemo(): void {
    const existing = input.value.trim();
    input.value = existing === '' ? DEMO_CONTENT : `${existing}\n${DEMO_CONTENT}`;
    input.focus();
    reparse();
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

  requireElement<HTMLButtonElement>(document, '#key-demo').addEventListener('click', insertDemo);
  requireElement<HTMLButtonElement>(document, '#vacant-demo').addEventListener('click', insertDemo);

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
     Verhalten. Ab da laufen die Zeilen durch denselben Parser wie alles andere. */
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
        skipped.push(...result.skipped);
      } catch (error) {
        expanded.push(`# ${error instanceof MigrationError ? error.message : 'Export unlesbar.'}`);
        problems.push(error instanceof MigrationError ? error.message : 'Export unlesbar.');
      }
    }

    input.value = expanded.join('\n');
    reparse();

    const parts: string[] = [];
    if (imported > 0) {
      parts.push(
        imported === 1
          ? '1 Konto aus Google-Authenticator-Export übernommen'
          : `${imported} Konten aus Google-Authenticator-Export übernommen`,
      );
    }
    if (skipped.length > 0) {
      parts.push(`übersprungen: ${skipped.join(', ')}`);
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
        setNote('QR-Code gelesen und eingesetzt.');
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
      // gilt immer; der zweite Teil hängt am Tresor.
      const label = {
        off: 'nichts gespeichert',
        locked: 'Tresor gesperrt',
        open: 'Tresor offen',
      }[state];
      stateText.textContent = `Offline · ${label}`;
      stateLamp.classList.toggle('lamp--signal', state === 'open');
    },
  });

  // Der Leerzustand trägt das Emblem — dieselbe Teilung, die gleich die Codes
  // begleitet. Es steht still: Es gibt noch nichts zu messen.
  buildGauge(requireElement<SVGSVGElement>(document, '#vacant-dial'), 30);

  startClock(tick);
  reparse();
}

/** „2 Konten · 1 Fehler" — die Bilanz unter dem Eingabefeld. */
function summarise(entries: ParsedEntry[]): string {
  if (entries.length === 0) {
    return '';
  }
  const accounts = entries.filter((entry) => entry.kind === 'account').length;
  const faults = entries.length - accounts;

  const parts: string[] = [];
  if (accounts > 0) {
    parts.push(accounts === 1 ? '1 Konto' : `${accounts} Konten`);
  }
  if (faults > 0) {
    parts.push(faults === 1 ? '1 Fehler' : `${faults} Fehler`);
  }
  return parts.join(' · ');
}
