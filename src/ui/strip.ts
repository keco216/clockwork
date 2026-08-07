/**
 * Kanalzug — die Anzeige eines Kontos.
 *
 * „Kanalzug" statt „Karte": Die Konten liegen wie Module in einem Rack
 * untereinander, getrennt nur durch eine Haarlinie. Keine Fläche, kein Rahmen,
 * kein Schatten — die Hierarchie entsteht aus Größe und Schwärze, nicht aus
 * Kästen.
 *
 * Zwei Sorten hinter einer Schnittstelle:
 *   • CodeStrip  — laufender Code, Skala, Vorschau, Kopiertaste.
 *   • FaultStrip — was an der Zeile nicht stimmt.
 *
 * Beide klonen ein `<template>` aus index.html. Alle Werte aus der Eingabe gehen
 * ausschließlich über `textContent` ins DOM und können deshalb nie als HTML
 * interpretiert werden.
 */

import type { Account, ParsedEntry } from '../lib/accounts';
import {
  describeIdentity,
  describeParameters,
  groupDigits,
  truncateForDisplay,
} from '../lib/format';
import { generateTotpForCounter } from '../lib/totp';
import { Dial } from './dial';
import { cloneTemplate, copyText, requireElement } from './dom';
import { buildScale } from './scale';

/** Ab wie vielen Restsekunden das Gerät Signalfarbe zeigt. */
const EXPIRING_SECONDS = 5;

/** Wie lange die Rückmeldung an der Kopiertaste stehen bleibt. */
const COPY_FEEDBACK_MS = 1600;

export interface Strip {
  readonly element: HTMLElement;
  /** Ruft die Uhr auf — pro Frame und zusätzlich jede Sekunde. */
  update(nowMs: number): void;
  destroy(): void;
}

export interface StripContext {
  /** Kurze Meldung für Screenreader. Nur bei Nutzeraktionen, nie beim Codewechsel. */
  announce(message: string): void;
}

export function createStrip(entry: ParsedEntry, index: number, context: StripContext): Strip {
  return entry.kind === 'account'
    ? new CodeStrip(entry.account, index, context)
    : new FaultStrip(entry.source, entry.message);
}

/* ========================================================================== */

class CodeStrip implements Strip {
  readonly element: HTMLElement;

  readonly #account: Account;
  readonly #dial: Dial;
  readonly #scale: HTMLElement;
  readonly #seconds: HTMLElement;
  readonly #next: HTMLElement;
  readonly #copyButton: HTMLButtonElement;
  readonly #copyLabel: HTMLElement;
  readonly #context: StripContext;
  readonly #title: string;

  #renderedCounter = Number.NaN;
  #pendingCounter = Number.NaN;
  #renderedSeconds = -1;
  #expiring = false;
  #copyResetTimer = 0;
  #destroyed = false;

  constructor(account: Account, index: number, context: StripContext) {
    this.#account = account;
    this.#context = context;
    this.element = cloneTemplate('tpl-strip');

    this.#dial = new Dial(requireElement(this.element, '[data-dial]'));
    this.#scale = requireElement(this.element, '[data-scale]');
    this.#seconds = requireElement(this.element, '[data-seconds]');
    this.#next = requireElement(this.element, '[data-next]');
    this.#copyButton = requireElement<HTMLButtonElement>(this.element, '[data-copy]');
    this.#copyLabel = requireElement(this.element, '[data-copy-label]');

    const identity = describeIdentity(account, index);
    this.#title = identity.title;
    requireElement(this.element, '[data-issuer]').textContent = identity.title;
    requireElement(this.element, '[data-account]').textContent = identity.subtitle ?? '';
    requireElement(this.element, '[data-spec]').textContent = describeParameters(account);

    // Die Kopiertaste trägt sichtbar „Kopieren" und zusätzlich den Kontonamen als
    // Beschriftung — sonst hört man bei zehn Konten zehnmal dasselbe Wort.
    this.#copyButton.setAttribute('aria-label', `Code für ${identity.title} kopieren`);

    buildScale(this.#scale, account.period, [
      requireElement(this.element, '[data-ticks-spent]'),
      requireElement(this.element, '[data-ticks-left]'),
    ]);

    this.#copyButton.addEventListener('click', this.#handleCopy);
  }

  update(nowMs: number): void {
    const period = this.#account.period;
    const seconds = nowMs / 1000;
    const counter = Math.floor(seconds / period);
    const elapsed = seconds - counter * period;

    // (1) Ein Zahlenwert pro Frame. Skalenbeschnitt, Zeigerposition und Farbe
    //     rechnet der Browser daraus selbst — kein DOM-Update pro Marke.
    this.#scale.style.setProperty('--progress', (elapsed / period).toFixed(4));

    // (2) Text nur bei echter Änderung anfassen: 60-mal pro Sekunde dieselbe
    //     Zahl zu schreiben kostet Layout und bringt nichts.
    const remaining = Math.max(1, Math.ceil(period - elapsed));
    if (remaining !== this.#renderedSeconds) {
      this.#renderedSeconds = remaining;
      this.#seconds.textContent = String(remaining);

      const expiring = remaining <= EXPIRING_SECONDS;
      if (expiring !== this.#expiring) {
        this.#expiring = expiring;
        this.element.classList.toggle('strip--expiring', expiring);
      }
    }

    // (3) Periodengrenze überschritten? Neue Codes rechnen. Der Vergleich mit
    //     `#pendingCounter` verhindert, dass die Frames einer Sekunde dieselbe
    //     Berechnung mehrfach anstoßen.
    if (counter !== this.#renderedCounter && counter !== this.#pendingCounter) {
      this.#pendingCounter = counter;
      void this.#renderCodes(counter);
    }
  }

  destroy(): void {
    this.#destroyed = true;
    this.#copyButton.removeEventListener('click', this.#handleCopy);
    window.clearTimeout(this.#copyResetTimer);
  }

  /**
   * `crypto.subtle` arbeitet asynchron, deshalb kann zwischen Start und Ende
   * bereits die nächste Periode begonnen haben. Der Vergleich mit
   * `#pendingCounter` verwirft ein überholtes Ergebnis, statt einen neueren Code
   * zu überschreiben.
   */
  async #renderCodes(counter: number): Promise<void> {
    const { secret, algorithm, digits } = this.#account;

    try {
      const [current, next] = await Promise.all([
        generateTotpForCounter({ secret, counter, algorithm, digits }),
        generateTotpForCounter({ secret, counter: counter + 1, algorithm, digits }),
      ]);

      if (this.#destroyed || this.#pendingCounter !== counter) {
        return;
      }

      this.#renderedCounter = counter;
      this.#dial.set(current);
      this.#next.textContent = groupDigits(next);
    } catch {
      if (this.#destroyed) {
        return;
      }
      // Praktisch nur erreichbar, wenn die Web Crypto API fehlt.
      this.#renderedCounter = counter;
      this.#dial.set('');
      this.#next.textContent = '';
      this.#seconds.textContent = '–';
    }
  }

  readonly #handleCopy = (): void => {
    if (this.#dial.value === '') {
      return;
    }
    void this.#copyCurrentCode();
  };

  async #copyCurrentCode(): Promise<void> {
    const code = this.#dial.value;
    try {
      await copyText(code);
      this.#showCopyResult('done', 'Kopiert', `Code ${[...code].join(' ')} kopiert`);
    } catch {
      this.#showCopyResult(
        'failed',
        'Fehlgeschlagen',
        'Kopieren fehlgeschlagen. Code bitte von Hand markieren.',
      );
    }
  }

  #showCopyResult(state: 'done' | 'failed', label: string, announcement: string): void {
    if (this.#destroyed) {
      return;
    }
    window.clearTimeout(this.#copyResetTimer);
    this.#copyButton.dataset.state = state;
    this.#copyLabel.textContent = label;
    this.element.classList.toggle('strip--copied', state === 'done');
    this.#context.announce(announcement);

    this.#copyResetTimer = window.setTimeout(() => {
      delete this.#copyButton.dataset.state;
      this.#copyLabel.textContent = 'Kopieren';
      this.element.classList.remove('strip--copied');
      this.#copyButton.setAttribute('aria-label', `Code für ${this.#title} kopieren`);
    }, COPY_FEEDBACK_MS);
  }
}

/* ========================================================================== */

class FaultStrip implements Strip {
  readonly element: HTMLElement;

  constructor(source: string, message: string) {
    this.element = cloneTemplate('tpl-fault');
    requireElement(this.element, '[data-source]').textContent = truncateForDisplay(source);
    requireElement(this.element, '[data-message]').textContent = message;
  }

  update(): void {
    // Eine fehlerhafte Zeile hat nichts, was sich mit der Zeit ändert.
  }

  destroy(): void {
    // Keine Listener, keine Timer.
  }
}
