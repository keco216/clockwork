/**
 * Die Bedienung des Tresors.
 *
 * ── Was hier NICHT passiert ────────────────────────────────────────────────
 * Die Passphrase wird nirgends abgelegt — nicht in `localStorage`, nicht in
 * einer Variablen, die den Zusperr-Vorgang überlebt, und nicht im Eingabefeld:
 * Das Feld wird nach jedem Aufsperren geleert. Der entschlüsselte Klartext geht
 * direkt ins Textfeld der App und wird beim Zusperren dort wieder entfernt.
 *
 * Im Speicher liegt dauerhaft nur der Umschlag aus vault.ts — Salt, IV,
 * Iterationszahl und Chiffrat. Ohne Passphrase ist er wertlos.
 *
 * ── Warum es überhaupt eine Sperre mit Zeitschaltung gibt ──────────────────
 * Ein offener Tresor ist ein Fenster: Wer an den Rechner kommt, sieht alle
 * Codes. Die Zeitschaltung begrenzt das Fenster auf die Zeit, in der man
 * wirklich davorsitzt.
 */

import { translateLibMessage } from '../i18n/lib-text';
import { formatNumber, onLocaleChange, t, tn } from '../i18n/runtime';
import {
  isVaultEnvelope,
  openVault,
  PBKDF2_ITERATIONS,
  sealVault,
  VaultError,
  type VaultEnvelope,
} from '../lib/vault';
import { requireElement } from './dom';

const STORAGE_KEY = '2fa-live.vault.v1';
const SETTINGS_KEY = '2fa-live.lock-settings.v1';

type VaultState = 'off' | 'locked' | 'open';

interface LockSettings {
  timeoutMs: number;
  lockOnHide: boolean;
}

const DEFAULT_SETTINGS: LockSettings = { timeoutMs: 300_000, lockOnHide: true };

export interface VaultPanelHandlers {
  /** Liefert den aktuellen Inhalt des Textfelds — das, was gespeichert wird. */
  readSecrets(): string;
  /** Schreibt entschlüsselte Secrets ins Textfeld (oder leert es beim Zusperren). */
  writeSecrets(text: string): void;
  /** Kurze Meldung für Screenreader. */
  announce(message: string): void;
  /**
   * Meldet den Tresorzustand an die Statuszeile im Kopf.
   *
   * Ohne das stünde dort dauerhaft „nichts gespeichert" — auch dann, wenn längst
   * etwas gespeichert ist. Eine Statusanzeige, die nicht stimmt, ist schlimmer
   * als gar keine.
   */
  reportState(state: 'off' | 'locked' | 'open'): void;
}

export function startVaultPanel(handlers: VaultPanelHandlers): void {
  const panel = requireElement(document, '#vault');
  const disclosure = requireElement<HTMLDetailsElement>(document, '#vault-disclosure');
  const stateText = requireElement(document, '#vault-state-text');
  // Erklärung samt Aufklapper in einer Hülle: Beide gelten nur, solange der
  // Tresor aus ist. Ein Zustand, der an zwei Stellen geschaltet wird, läuft
  // irgendwann auseinander.
  const intro = requireElement(document, '#vault-intro');
  const explain = requireElement(document, '#vault-explain');
  const cryptoNote = requireElement(document, '#vault-crypto');
  const form = requireElement<HTMLFormElement>(document, '#vault-form');
  const passField = requireElement<HTMLInputElement>(document, '#vault-pass');
  const passLabel = requireElement(document, '#vault-pass-label');
  const primary = requireElement<HTMLButtonElement>(document, '#vault-primary');
  const errorText = requireElement(document, '#vault-error');
  const lockButton = requireElement<HTMLButtonElement>(document, '#vault-lock');
  const updateButton = requireElement<HTMLButtonElement>(document, '#vault-update');
  const wipeButton = requireElement<HTMLButtonElement>(document, '#vault-wipe');
  const timeoutSelect = requireElement<HTMLSelectElement>(document, '#vault-timeout');
  const hideLockBox = requireElement<HTMLInputElement>(document, '#vault-hide-lock');

  /** Die Passphrase der laufenden Sitzung. Nur hier, nur im RAM. */
  let sessionPassphrase: string | null = null;
  let settings = loadSettings();
  let idleTimer = 0;

  timeoutSelect.value = String(settings.timeoutMs);
  hideLockBox.checked = settings.lockOnHide;

  /* ── Zustand ────────────────────────────────────────────────────────────── */

  function currentState(): VaultState {
    if (sessionPassphrase !== null) return 'open';
    return readEnvelope() === null ? 'off' : 'locked';
  }

  /**
   * Beschriftungen, die sich mit der Sprache ändern, aber nicht mit dem
   * Zustand. Die Zeitangaben laufen über die Mehrzahlregeln — „1 Minute",
   * „5 Minuten", auf Polnisch „5 minutach".
   */
  function paintLabels(): void {
    // Seit V8 zwei Absätze: Der erste sagt, was der Tresor für einen tut, der
    // zweite womit. Die Iterationszahl steht im zweiten — sie ist die Sorte
    // Auskunft, für die es den Aufklapper gibt.
    explain.textContent = t('vault.explain');
    cryptoNote.textContent = t('vault.explain.crypto', {
      iterations: formatNumber(PBKDF2_ITERATIONS),
    });
    for (const option of timeoutSelect.options) {
      option.textContent = tn('vault.timeout.minutes', Number(option.value) / 60_000);
    }
    if (wipeButton.dataset['armed'] === undefined) {
      wipeButton.textContent = t('vault.action.wipe');
    }
  }

  function paint(message = ''): void {
    const state = currentState();
    panel.dataset['state'] = state;
    errorText.textContent = message;
    handlers.reportState(state);

    const hasEnvelope = state !== 'off';
    lockButton.hidden = state !== 'open';
    updateButton.hidden = state !== 'open';
    wipeButton.hidden = !hasEnvelope;
    form.hidden = state === 'open';

    switch (state) {
      case 'off':
        stateText.textContent = t('vault.state.off');
        passLabel.textContent = t('vault.pass.new');
        passField.autocomplete = 'new-password';
        primary.textContent = t('vault.action.seal');
        intro.hidden = false;
        break;
      case 'locked':
        stateText.textContent = t('vault.state.locked');
        passLabel.textContent = t('vault.pass.existing');
        passField.autocomplete = 'current-password';
        primary.textContent = t('vault.action.unseal');
        intro.hidden = true;
        // Ein gesperrter Tresor ist der einzige Zustand, in dem der Aufklapper
        // von selbst aufgeht — und zwar der wichtigste Fall überhaupt: Beim
        // Laden der Seite ist das Textfeld leer, weil der Inhalt hier drin
        // liegt. Läge das Passphrasenfeld dann hinter einem Klick, müsste man
        // erst suchen, wo die eigenen Codes geblieben sind.
        disclosure.open = true;
        break;
      case 'open':
        stateText.textContent = t('vault.state.open');
        intro.hidden = true;
        break;
    }
  }

  /* ── Speicher ───────────────────────────────────────────────────────────── */

  function readEnvelope(): VaultEnvelope | null {
    let raw: string | null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return null; // Speicher gesperrt (privater Modus, Richtlinie)
    }
    if (raw === null) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return isVaultEnvelope(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeEnvelope(envelope: VaultEnvelope): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
      return true;
    } catch {
      return false;
    }
  }

  function loadSettings(): LockSettings {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
      if (typeof parsed === 'object' && parsed !== null) {
        const candidate = parsed as Record<string, unknown>;
        return {
          timeoutMs:
            typeof candidate['timeoutMs'] === 'number'
              ? candidate['timeoutMs']
              : DEFAULT_SETTINGS.timeoutMs,
          lockOnHide:
            typeof candidate['lockOnHide'] === 'boolean'
              ? candidate['lockOnHide']
              : DEFAULT_SETTINGS.lockOnHide,
        };
      }
    } catch {
      // fällt auf die Voreinstellung zurück
    }
    return { ...DEFAULT_SETTINGS };
  }

  function saveSettings(): void {
    // Hier stehen nur zwei Zahlen zur Bedienung — kein Geheimnis, kein Secret.
    // Die Sprachwahl steht bewusst NICHT hier, sondern im URL-Hash: siehe
    // i18n/language.ts.
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ohne Speicher gilt die Einstellung eben nur für diese Sitzung.
    }
  }

  /* ── Aktionen ───────────────────────────────────────────────────────────── */

  async function seal(passphrase: string, quiet = false): Promise<void> {
    const secrets = handlers.readSecrets().trim();
    if (secrets === '') {
      paint(t('vault.error.nothingToStore'));
      return;
    }

    primary.disabled = true;
    stateText.textContent = t('vault.action.deriving');
    try {
      const envelope = await sealVault(secrets, passphrase);
      if (!writeEnvelope(envelope)) {
        paint(t('vault.error.storageBlocked'));
        return;
      }
      sessionPassphrase = passphrase;
      passField.value = '';
      resetIdleTimer();
      paint();
      if (!quiet) {
        handlers.announce(t('vault.msg.sealed'));
      }
    } catch (error) {
      paint(
        error instanceof VaultError
          ? translateLibMessage(error.message)
          : t('vault.error.sealFailed'),
      );
    } finally {
      primary.disabled = false;
    }
  }

  async function unseal(passphrase: string): Promise<void> {
    const envelope = readEnvelope();
    if (envelope === null) {
      paint(t('vault.error.noVault'));
      return;
    }

    primary.disabled = true;
    stateText.textContent = t('vault.action.deriving');
    try {
      const secrets = await openVault(envelope, passphrase);
      sessionPassphrase = passphrase;
      passField.value = '';
      handlers.writeSecrets(secrets);
      resetIdleTimer();
      paint();
      handlers.announce(t('vault.msg.unsealed'));
    } catch (error) {
      // Der Cursor bleibt im Feld, der falsche Versuch wird markiert — man tippt
      // sich in aller Regel nur einmal falsch.
      passField.select();
      paint(
        error instanceof VaultError
          ? translateLibMessage(error.message)
          : t('vault.error.unsealFailed'),
      );
    } finally {
      primary.disabled = false;
    }
  }

  function lock(reason?: string): void {
    if (sessionPassphrase === null) {
      return;
    }
    sessionPassphrase = null;
    window.clearTimeout(idleTimer);
    passField.value = '';
    // Der wichtigste Schritt: Der Klartext verschwindet aus dem Textfeld.
    handlers.writeSecrets('');
    paint(reason ?? '');
    handlers.announce(t('vault.msg.locked'));
  }

  function wipe(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // dann war ohnehin nichts da
    }
    sessionPassphrase = null;
    window.clearTimeout(idleTimer);
    passField.value = '';
    handlers.writeSecrets('');
    paint(t('vault.msg.wipedNote'));
    handlers.announce(t('vault.msg.wiped'));
  }

  /* ── Zeitschaltung ──────────────────────────────────────────────────────── */

  function resetIdleTimer(): void {
    window.clearTimeout(idleTimer);
    if (sessionPassphrase === null) {
      return;
    }
    idleTimer = window.setTimeout(() => {
      lock(tn('vault.locked.idle', Math.round(settings.timeoutMs / 60_000)));
    }, settings.timeoutMs);
  }

  // `passive: true`: Diese Zuhörer verändern nichts am Ereignis, und der Browser
  // darf das Scrollen deshalb nicht auf sie warten lassen.
  for (const type of ['pointerdown', 'keydown', 'focusin'] as const) {
    document.addEventListener(type, resetIdleTimer, { passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' && settings.lockOnHide) {
      lock(t('vault.locked.hidden'));
    }
  });

  /* ── Verdrahtung ────────────────────────────────────────────────────────── */

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const passphrase = passField.value;
    if (passphrase === '') {
      paint(t('vault.error.noPassphrase'));
      return;
    }
    void (currentState() === 'off' ? seal(passphrase) : unseal(passphrase));
  });

  lockButton.addEventListener('click', () => {
    lock();
  });

  updateButton.addEventListener('click', () => {
    if (sessionPassphrase !== null) {
      void seal(sessionPassphrase);
      handlers.announce(t('vault.msg.resealed'));
    }
  });

  wipeButton.addEventListener('click', () => {
    // Zweistufig statt `confirm()`: Ein Dialog blockiert den Thread und sieht
    // auf jedem System anders aus. Der zweite Klick auf denselben Knopf ist
    // ebenso eindeutig und bleibt im Gerät.
    if (wipeButton.dataset['armed'] === undefined) {
      wipeButton.dataset['armed'] = '';
      wipeButton.textContent = t('vault.action.wipeConfirm');
      window.setTimeout(() => {
        delete wipeButton.dataset['armed'];
        wipeButton.textContent = t('vault.action.wipe');
      }, 4000);
      return;
    }
    delete wipeButton.dataset['armed'];
    wipeButton.textContent = t('vault.action.wipe');
    wipe();
  });

  timeoutSelect.addEventListener('change', () => {
    settings = { ...settings, timeoutMs: Number(timeoutSelect.value) };
    saveSettings();
    resetIdleTimer();
  });

  hideLockBox.addEventListener('change', () => {
    settings = { ...settings, lockOnHide: hideLockBox.checked };
    saveSettings();
  });

  // Beim Sprachwechsel alles neu beschriften. Eine stehen gebliebene
  // Fehlermeldung wird dabei verworfen — sie wäre sonst die einzige Stelle im
  // Gerät, die noch in der alten Sprache steht.
  onLocaleChange(() => {
    paintLabels();
    paint();
  });

  paintLabels();
  paint();
}
