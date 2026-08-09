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
 *
 * ── Sprache ────────────────────────────────────────────────────────────────
 * Der Inhalt eines `<template>` steht nicht im Dokumentbaum; der
 * Übersetzungsdurchlauf über `document` erreicht ihn also nie. Jeder Klon wird
 * deshalb einzeln durch `applyStrings` geschickt. Beim Sprachwechsel baut
 * app.ts alle Kanalzüge neu — das ist billiger und verlässlicher, als in jedem
 * Bauteil einen eigenen Rückruf zu führen.
 */

import { applyStrings } from '../i18n/apply';
import { translateLibMessage } from '../i18n/lib-text';
import { t, tn } from '../i18n/runtime';
import type { Account, ParsedEntry } from '../lib/accounts';
import { groupDigits, truncateForDisplay } from '../lib/format';
import { generateTotpForCounter } from '../lib/totp';
import { Dial } from './dial';
import { cloneTemplate, copyText, prefersReducedMotion, requireElement } from './dom';
import { buildGauge } from './gauge';
import { easingToken, motionToken } from './tokens';

/** Ab wie vielen Restsekunden das Gerät Signalfarbe zeigt. */
const EXPIRING_SECONDS = 5;

/** Wie lange die Rückmeldung an der Kopiertaste stehen bleibt. */
const COPY_FEEDBACK_MS = 1600;

/**
 * Der Wortwechsel an der Kopiertaste — „Kopieren" wird „Kopiert".
 *
 * Die Werte sind der Wert-Eintritt der Referenz (`slot-value-in` in
 * input-otp.css: `translateY(8px) scale(0.8)` aus der Durchsicht, 250 ms,
 * Ursprung unten mittig). Dort erscheint eine frisch getippte Ziffer in ihrer
 * Zelle; hier erscheint das Ergebnis einer Handlung in seiner Taste. Dieselbe
 * Sache: ein Wert, der gerade entstanden ist.
 *
 * ── Was das ausdrücklich NICHT ersetzt ─────────────────────────────────────
 * Die Quittung selbst. Die Tönung der Taste und der Signalpunkt an der Nabe
 * bleiben ZUSTÄNDE (`data-state`, `.strip--copied`) und keine Animation —
 * `prefers-reduced-motion` schaltet in diesem Projekt alle Übergänge ab, und
 * eine Quittung als Keyframe verschwände damit für genau die Leute, die
 * ohnehin weniger visuelle Signale bekommen. Animiert ist nur der WEG, auf dem
 * das neue Wort ankommt.
 */
const LABEL_IN: Keyframe[] = [
  { opacity: 0, transform: 'translateY(8px) scale(0.8)' },
  { opacity: 1, transform: 'none' },
];

/**
 * Der Rückweg nach 1,6 s ist nur ein Ausblenden — bewusst.
 *
 * Der Eintritt meldet ein ERGEBNIS: Jemand hat gedrückt, und das Wort ist die
 * Antwort darauf. Der Rückweg meldet nichts; er räumt auf, weil eine Uhr
 * abgelaufen ist. Dieselbe Bewegung noch einmal zöge den Blick auf ein
 * Ereignis, das keines ist. Ein harter Wechsel wäre die Alternative gewesen und
 * ist es nicht geworden: Das Wort steht in einer Taste, die man womöglich
 * gerade ansieht, und ein Wort, das ohne Übergang umspringt, liest sich als
 * Fehler. 150 ms Deckkraft sind die leiseste Fassung, die beides vermeidet.
 */
const LABEL_OUT: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

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

/**
 * Überschrift und Unterzeile eines Kanalzugs.
 *
 * Entspricht `lib/format.ts:describeIdentity`, nur mit übersetztem Rückfalltext.
 * Die Fassung in `lib/` bleibt unverändert — sie gehört zu den Modulen, die in
 * V3 byte-identisch bleiben.
 */
function identityOf(account: Account, index: number): { title: string; subtitle: string } {
  if (account.issuer && account.accountName) {
    return { title: account.issuer, subtitle: account.accountName };
  }
  const single = account.issuer ?? account.accountName;
  if (single) {
    return { title: single, subtitle: '' };
  }
  return { title: t('strip.accountFallback', { n: index + 1 }), subtitle: '' };
}

/**
 * Die Parameterzeile, z. B. „SHA-1 · 6 Stellen · 30 s".
 *
 * Die Stellenzahl geht über die Mehrzahlregeln — im Polnischen heißt es je nach
 * Zahl „cyfra", „cyfry" oder „cyfr". Algorithmus und Periode bleiben technisch.
 */
function specOf(account: Account): string {
  return t('strip.spec', {
    algorithm: account.algorithm,
    digits: tn('strip.digits', account.digits),
    period: t('strip.period', { n: String(account.period) }),
  });
}

/* ========================================================================== */

class CodeStrip implements Strip {
  readonly element: HTMLElement;

  readonly #account: Account;
  readonly #dial: Dial;
  readonly #hand: SVGGElement;
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
    applyStrings(this.element);

    this.#dial = new Dial(requireElement(this.element, '[data-dial]'));

    this.#seconds = requireElement(this.element, '[data-seconds]');
    this.#next = requireElement(this.element, '[data-next]');
    this.#copyButton = requireElement<HTMLButtonElement>(this.element, '[data-copy]');
    this.#copyLabel = requireElement(this.element, '[data-copy-label]');

    const identity = identityOf(account, index);
    this.#title = identity.title;
    requireElement(this.element, '[data-issuer]').textContent = identity.title;
    requireElement(this.element, '[data-account]').textContent = identity.subtitle;
    requireElement(this.element, '[data-spec]').textContent = specOf(account);

    // Die Kopiertaste trägt sichtbar „Kopieren" und zusätzlich den Kontonamen als
    // Beschriftung — sonst hört man bei zehn Konten zehnmal dasselbe Wort.
    this.#copyButton.setAttribute('aria-label', t('strip.copyAria', { name: identity.title }));

    this.#hand = buildGauge(
      requireElement<SVGSVGElement>(this.element, '[data-gauge]'),
      account.period,
    );

    this.#copyButton.addEventListener('click', this.#handleCopy);
  }

  update(nowMs: number): void {
    const period = this.#account.period;
    const seconds = nowMs / 1000;
    const counter = Math.floor(seconds / period);
    const elapsed = seconds - counter * period;

    // (1) Ein Zahlenwert pro Frame. Skalenbeschnitt, Zeigerposition und Farbe
    //     rechnet der Browser daraus selbst — kein DOM-Update pro Marke.
    this.#hand.style.setProperty('--progress', (elapsed / period).toFixed(4));

    // (2) Text nur bei echter Änderung anfassen: 60-mal pro Sekunde dieselbe
    //     Zahl zu schreiben kostet Layout und bringt nichts.
    const remaining = Math.max(1, Math.ceil(period - elapsed));
    if (remaining !== this.#renderedSeconds) {
      this.#renderedSeconds = remaining;
      // Bewusst `String()` und nicht die lokalisierte Zahlenformatierung: Diese
      // Ziffer sitzt im Zifferblatt, und das trägt in jeder Sprache lateinische
      // Ziffern (siehe i18n/runtime.ts).
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
      this.#showCopyResult(
        'done',
        t('key.copyDone'),
        t('strip.copyAnnounce', { digits: [...code].join(' ') }),
      );
    } catch {
      this.#showCopyResult('failed', t('key.copyFailed'), t('strip.copyFailedHint'));
    }
  }

  #showCopyResult(state: 'done' | 'failed', label: string, announcement: string): void {
    if (this.#destroyed) {
      return;
    }
    window.clearTimeout(this.#copyResetTimer);
    this.#copyButton.dataset['state'] = state;
    this.#copyLabel.textContent = label;
    this.#playLabel(LABEL_IN, motionToken('--dur-calm', 250));
    this.element.classList.toggle('strip--copied', state === 'done');
    this.#context.announce(announcement);

    this.#copyResetTimer = window.setTimeout(() => {
      delete this.#copyButton.dataset['state'];
      this.#copyLabel.textContent = t('key.copy');
      this.#playLabel(LABEL_OUT, motionToken('--dur-quick', 150));
      this.element.classList.remove('strip--copied');
      this.#copyButton.setAttribute('aria-label', t('strip.copyAria', { name: this.#title }));
    }, COPY_FEEDBACK_MS);
  }

  /**
   * Spielt eine Bewegung an der Beschriftung.
   *
   * `fill: 'backwards'` ist der Grund, warum der Text schon vor dem Aufruf
   * gesetzt werden darf: Das erste Bild gilt rückwirkend ab dem Setzen, das
   * neue Wort steht also nie ungetarnt da, bevor die Fahrt beginnt.
   *
   * Ein laufender Wechsel wird abgebrochen — wer zweimal hintereinander
   * kopiert, soll den zweiten Eintritt sehen und nicht die Überlagerung
   * beider.
   */
  #playLabel(frames: Keyframe[], duration: number): void {
    if (prefersReducedMotion()) {
      return;
    }
    for (const animation of this.#copyLabel.getAnimations()) {
      animation.cancel();
    }
    this.#copyLabel.animate(frames, {
      duration,
      easing: easingToken('--ease-spring', 'cubic-bezier(0.32, 0.72, 0, 1)'),
      fill: 'backwards',
    });
  }
}

/* ========================================================================== */

class FaultStrip implements Strip {
  readonly element: HTMLElement;

  constructor(source: string, message: string) {
    this.element = cloneTemplate('tpl-fault');
    applyStrings(this.element);
    requireElement(this.element, '[data-source]').textContent = truncateForDisplay(source);
    // Die Meldung entsteht in src/lib und ist dort auf Deutsch formuliert; die
    // Module bleiben byte-identisch. Übersetzt wird deshalb erst hier, an der
    // Grenze zur Oberfläche.
    requireElement(this.element, '[data-message]').textContent = translateLibMessage(message);
  }

  update(): void {
    // Eine fehlerhafte Zeile hat nichts, was sich mit der Zeit ändert.
  }

  destroy(): void {
    // Keine Listener, keine Timer.
  }
}
