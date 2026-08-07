/**
 * Die Verdrahtung: Textfeld → Parser → Karten → Uhr.
 *
 * Der Datenfluss ist absichtlich in eine Richtung:
 *
 *   Textfeld ändert sich ──► parseEntries() ──► Karten abgleichen
 *                                                    │
 *   Uhr tickt ───────────────────────────────────────┴──► card.update(now)
 *
 * Es gibt keinen Zustand ausser den Karten selbst. Insbesondere landet nichts in
 * `localStorage`, `sessionStorage` oder einem Cookie — schließt man den Tab,
 * ist das Secret weg. Das ist der ganze Sinn von Version 1.
 */

import { parseEntries, type ParsedEntry } from '../lib/accounts';
import { createCard, type Card, type CardContext } from './card';
import { startClock } from './clock';
import { requireElement } from './dom';

/**
 * Wartezeit nach dem letzten Tastendruck, bevor neu ausgewertet wird.
 *
 * Ohne diese Pause würde beim Tippen eines Secrets nach jedem einzelnen Zeichen
 * eine Fehlerkarte aufblitzen ("Ungültige Länge", "Ungültige Länge", …) — nur
 * um beim nächsten Zeichen wieder zu verschwinden.
 */
const INPUT_DEBOUNCE_MS = 220;

/** Was der Knopf „Demo einfügen" einsetzt. */
const DEMO_CONTENT = [
  '# Testschlüssel aus RFC 4226 — das Secret ist der Text "12345678901234567890"',
  'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
  'otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
].join('\n');

export function startApp(): void {
  const input = requireElement<HTMLTextAreaElement>(document, '#secrets');
  const results = requireElement(document, '#results');
  const placeholder = requireElement(document, '#placeholder');
  const status = requireElement(document, '#entry-count');
  const liveRegion = requireElement(document, '#live-region');
  const demoButton = requireElement<HTMLButtonElement>(document, '#demo');
  const clearButton = requireElement<HTMLButtonElement>(document, '#clear');

  const context: CardContext = {
    announce(message: string): void {
      liveRegion.textContent = message;
    },
  };

  /** Karten nach ihrem Schlüssel — damit wir beim Tippen nur Geändertes neu bauen. */
  let cards = new Map<string, Card>();
  let debounceTimer = 0;

  function render(entries: ParsedEntry[]): void {
    const next = new Map<string, Card>();
    const ordered = document.createDocumentFragment();

    entries.forEach((entry, index) => {
      // Bestehende Karte wiederverwenden, wenn die Zeile unverändert ist.
      // Das erhält nicht nur den Zustand, sondern verhindert vor allem ein
      // Flackern der Codes bei jedem Tastendruck in einer anderen Zeile.
      const card = cards.get(entry.key) ?? createCard(entry, index, context);
      next.set(entry.key, card);
      ordered.append(card.element);
    });

    for (const [key, card] of cards) {
      if (!next.has(key)) {
        card.destroy();
      }
    }

    cards = next;
    results.replaceChildren(ordered);

    placeholder.hidden = entries.length > 0;
    status.textContent = summarise(entries);

    // Sofort einen Tick, damit frisch erzeugte Karten nicht bis zum nächsten
    // Frame leer dastehen.
    tick(Date.now());
  }

  function tick(nowMs: number): void {
    for (const card of cards.values()) {
      card.update(nowMs);
    }
  }

  function reparse(): void {
    render(parseEntries(input.value));
  }

  input.addEventListener('input', () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(reparse, INPUT_DEBOUNCE_MS);
  });

  // Beim Einfügen aus der Zwischenablage sofort reagieren — da ist die Eingabe
  // in einem Rutsch fertig, eine Wartezeit wäre nur träge.
  input.addEventListener('paste', () => {
    window.clearTimeout(debounceTimer);
    window.setTimeout(reparse, 0);
  });

  demoButton.addEventListener('click', () => {
    const existing = input.value.trim();
    input.value = existing === '' ? DEMO_CONTENT : `${existing}\n${DEMO_CONTENT}`;
    input.focus();
    reparse();
  });

  clearButton.addEventListener('click', () => {
    input.value = '';
    input.focus();
    reparse();
  });

  startClock(tick);
  reparse();
}

/** „2 Konten · 1 Fehler" — kurze Bilanz über dem Textfeld. */
function summarise(entries: ParsedEntry[]): string {
  if (entries.length === 0) {
    return '';
  }
  const accounts = entries.filter((entry) => entry.kind === 'account').length;
  const errors = entries.length - accounts;

  const parts: string[] = [];
  if (accounts > 0) {
    parts.push(accounts === 1 ? '1 Konto' : `${accounts} Konten`);
  }
  if (errors > 0) {
    parts.push(errors === 1 ? '1 Fehler' : `${errors} Fehler`);
  }
  return parts.join(' · ');
}
