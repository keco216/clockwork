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
import { createStrip, type Strip, type StripContext } from './strip';
import { startClock } from './clock';
import { requireElement } from './dom';

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

  const context: StripContext = {
    announce(message: string): void {
      liveRegion.textContent = message;
    },
  };

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
  // eine Wartezeit wäre nur träge.
  input.addEventListener('paste', () => {
    window.clearTimeout(debounceTimer);
    window.setTimeout(reparse, 0);
  });

  requireElement<HTMLButtonElement>(document, '#key-demo').addEventListener('click', insertDemo);
  requireElement<HTMLButtonElement>(document, '#vacant-demo').addEventListener('click', insertDemo);

  requireElement<HTMLButtonElement>(document, '#key-clear').addEventListener('click', () => {
    input.value = '';
    input.focus();
    reparse();
  });

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
