/**
 * Die Karten: eine pro Eingabezeile.
 *
 * Zwei Sorten, hinter einer gemeinsamen Schnittstelle:
 *   • CodeCard  — zeigt den laufenden Code samt Countdown.
 *   • ErrorCard — zeigt, was an der Zeile nicht stimmt.
 *
 * Beide bauen ihr Markup aus einem `<template>` in index.html. Alle Werte, die
 * aus der Eingabe stammen, werden ausschließlich über `textContent` gesetzt und
 * können deshalb nie als HTML interpretiert werden.
 */

import type { Account, ParsedEntry } from '../lib/accounts';
import {
  describeIdentity,
  describeParameters,
  groupDigits,
  truncateForDisplay,
} from '../lib/format';
import { generateTotpForCounter } from '../lib/totp';
import { cloneTemplate, copyText, prefersReducedMotion, requireElement } from './dom';

/** Ab wie vielen Restsekunden die Anzeige "läuft gleich ab" signalisiert. */
const EXPIRING_SECONDS = 5;

/** Wie lange die Rückmeldung am Kopieren-Knopf stehen bleibt. */
const COPY_FEEDBACK_MS = 1600;

export interface Card {
  readonly element: HTMLElement;
  /** Wird von der Uhr aufgerufen — pro Frame und zusätzlich jede Sekunde. */
  update(nowMs: number): void;
  /** Aufräumen, bevor die Karte aus dem DOM verschwindet. */
  destroy(): void;
}

export interface CardContext {
  /** Kurze Meldung für Screenreader (z. B. „Code kopiert"). */
  announce(message: string): void;
}

export function createCard(entry: ParsedEntry, index: number, context: CardContext): Card {
  return entry.kind === 'account'
    ? new CodeCard(entry.account, index, context)
    : new ErrorCard(entry.source, entry.message);
}

/* ========================================================================== */

class CodeCard implements Card {
  readonly element: HTMLElement;

  readonly #account: Account;
  readonly #codeElement: HTMLElement;
  readonly #nextElement: HTMLElement;
  readonly #secondsElement: HTMLElement;
  readonly #copyButton: HTMLButtonElement;
  readonly #copyLabel: HTMLElement;
  readonly #context: CardContext;

  /** Für welchen Zählerstand steht gerade ein Code auf der Karte? */
  #renderedCounter = Number.NaN;
  /** Für welchen Zählerstand läuft gerade eine Berechnung? */
  #pendingCounter = Number.NaN;
  /** Der rohe Code — das ist der, der kopiert wird, nicht der gruppierte. */
  #currentCode = '';
  /** Zuletzt geschriebene Sekundenzahl, um unnötige DOM-Schreibzugriffe zu sparen. */
  #renderedSeconds = -1;
  #expiring = false;
  #copyResetTimer = 0;
  #destroyed = false;

  constructor(account: Account, index: number, context: CardContext) {
    this.#account = account;
    this.#context = context;
    this.element = cloneTemplate('tpl-card');

    this.#codeElement = requireElement(this.element, '[data-code]');
    this.#nextElement = requireElement(this.element, '[data-next]');
    this.#secondsElement = requireElement(this.element, '[data-seconds]');
    this.#copyButton = requireElement<HTMLButtonElement>(this.element, '[data-copy]');
    this.#copyLabel = requireElement(this.element, '[data-copy-label]');

    const identity = describeIdentity(account, index);
    requireElement(this.element, '[data-title]').textContent = identity.title;
    requireElement(this.element, '[data-subtitle]').textContent = identity.subtitle ?? '';
    requireElement(this.element, '[data-params]').textContent = describeParameters(account);

    this.#copyButton.addEventListener('click', this.#handleCopy);
  }

  update(nowMs: number): void {
    const period = this.#account.period;
    const seconds = nowMs / 1000;
    const counter = Math.floor(seconds / period);
    const elapsed = seconds - counter * period;

    // (1) Fortschritt an CSS reichen. Ein Zahlenwert pro Frame ist billig; den
    //     Rest (Ring-Winkel, Farbverlauf, Helligkeit der Vorschau) rechnet der
    //     Browser daraus selbst aus.
    this.element.style.setProperty('--progress', (elapsed / period).toFixed(4));

    // (2) Sekundenanzeige nur bei echter Änderung anfassen — Textänderungen
    //     kosten Layout, und 60-mal pro Sekunde dieselbe Zahl zu schreiben wäre
    //     reine Verschwendung.
    const remaining = Math.max(1, Math.ceil(period - elapsed));
    if (remaining !== this.#renderedSeconds) {
      this.#renderedSeconds = remaining;
      this.#secondsElement.textContent = String(remaining);

      const expiring = remaining <= EXPIRING_SECONDS;
      if (expiring !== this.#expiring) {
        this.#expiring = expiring;
        this.element.classList.toggle('is-expiring', expiring);
      }
    }

    // (3) Periodengrenze überschritten? Dann neue Codes rechnen. Die Abfrage auf
    //     `#pendingCounter` verhindert, dass die 60 Frames einer Sekunde 60-mal
    //     dieselbe Berechnung anstoßen.
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
   * Rechnet aktuellen und nächsten Code.
   *
   * `crypto.subtle` arbeitet asynchron, deshalb kann zwischen Start und Ende
   * bereits die nächste Periode begonnen haben. Der Vergleich mit
   * `#pendingCounter` sorgt dafür, dass ein überholtes Ergebnis verworfen wird
   * und nicht einen neueren Code überschreibt.
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
      this.#currentCode = current;
      this.#codeElement.textContent = groupDigits(current);
      this.#nextElement.textContent = groupDigits(next);
      this.#playArrival();
    } catch {
      if (this.#destroyed) {
        return;
      }
      // Kann eigentlich nur passieren, wenn die Web Crypto API fehlt (etwa auf
      // einer unverschlüsselten Verbindung zu einem fremden Host).
      this.#renderedCounter = counter;
      this.#codeElement.textContent = 'Fehler';
      this.#nextElement.textContent = '';
    }
  }

  /**
   * Kurzes Aufblenden beim Codewechsel.
   *
   * Über die Web Animations API statt über eine CSS-Klasse: Eine laufende
   * CSS-Animation neu zu starten geht nur über einen erzwungenen Reflow, hier
   * genügt ein Aufruf.
   */
  #playArrival(): void {
    if (prefersReducedMotion()) {
      return;
    }
    this.#codeElement.animate(
      [
        { opacity: 0, transform: 'translateY(0.16em)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  }

  readonly #handleCopy = (): void => {
    if (this.#currentCode === '') {
      return;
    }
    void this.#copyCurrentCode();
  };

  async #copyCurrentCode(): Promise<void> {
    const code = this.#currentCode;
    try {
      await copyText(code);
      this.#showCopyResult('is-done', 'Kopiert', `Code ${code.split('').join(' ')} kopiert`);
    } catch {
      this.#showCopyResult(
        'is-failed',
        'Fehlgeschlagen',
        'Kopieren fehlgeschlagen — Code bitte von Hand markieren',
      );
    }
  }

  #showCopyResult(className: string, label: string, announcement: string): void {
    if (this.#destroyed) {
      return;
    }
    window.clearTimeout(this.#copyResetTimer);
    this.#copyButton.classList.remove('is-done', 'is-failed');
    this.#copyButton.classList.add(className);
    this.#copyLabel.textContent = label;
    this.#context.announce(announcement);

    this.#copyResetTimer = window.setTimeout(() => {
      this.#copyButton.classList.remove('is-done', 'is-failed');
      this.#copyLabel.textContent = 'Kopieren';
    }, COPY_FEEDBACK_MS);
  }
}

/* ========================================================================== */

class ErrorCard implements Card {
  readonly element: HTMLElement;

  constructor(source: string, message: string) {
    this.element = cloneTemplate('tpl-error');
    requireElement(this.element, '[data-source]').textContent = truncateForDisplay(source);
    requireElement(this.element, '[data-message]').textContent = message;
  }

  update(): void {
    // Eine Fehlerkarte hat nichts, was sich mit der Zeit ändert.
  }

  destroy(): void {
    // Keine Listener, keine Timer — nichts aufzuräumen.
  }
}
