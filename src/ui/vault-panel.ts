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

import {
  isVaultEnvelope,
  openVault,
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
  const stateText = requireElement(document, '#vault-state-text');
  const explain = requireElement(document, '#vault-explain');
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

  function paint(message = ''): void {
    const state = currentState();
    panel.dataset.state = state;
    errorText.textContent = message;
    handlers.reportState(state);

    const hasEnvelope = state !== 'off';
    lockButton.hidden = state !== 'open';
    updateButton.hidden = state !== 'open';
    wipeButton.hidden = !hasEnvelope;
    form.hidden = state === 'open';

    switch (state) {
      case 'off':
        stateText.textContent = 'Aus — es wird nichts gespeichert';
        passLabel.textContent = 'Neue Passphrase';
        passField.autocomplete = 'new-password';
        primary.textContent = 'Verschlüsselt speichern';
        explain.hidden = false;
        break;
      case 'locked':
        stateText.textContent = 'Gesperrt — Passphrase nötig';
        passLabel.textContent = 'Passphrase';
        passField.autocomplete = 'current-password';
        primary.textContent = 'Aufsperren';
        explain.hidden = true;
        break;
      case 'open':
        stateText.textContent = 'Offen — Secrets liegen im Textfeld';
        explain.hidden = true;
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
      paint('Es gibt nichts zu speichern — das Textfeld ist leer.');
      return;
    }

    primary.disabled = true;
    stateText.textContent = 'Schlüssel wird abgeleitet …';
    try {
      const envelope = await sealVault(secrets, passphrase);
      if (!writeEnvelope(envelope)) {
        paint('Der Browser lässt kein Speichern zu (privater Modus?).');
        return;
      }
      sessionPassphrase = passphrase;
      passField.value = '';
      resetIdleTimer();
      paint();
      if (!quiet) {
        handlers.announce('Tresor verschlüsselt gespeichert.');
      }
    } catch (error) {
      paint(error instanceof VaultError ? error.message : 'Speichern fehlgeschlagen.');
    } finally {
      primary.disabled = false;
    }
  }

  async function unseal(passphrase: string): Promise<void> {
    const envelope = readEnvelope();
    if (envelope === null) {
      paint('Es ist kein Tresor gespeichert.');
      return;
    }

    primary.disabled = true;
    stateText.textContent = 'Schlüssel wird abgeleitet …';
    try {
      const secrets = await openVault(envelope, passphrase);
      sessionPassphrase = passphrase;
      passField.value = '';
      handlers.writeSecrets(secrets);
      resetIdleTimer();
      paint();
      handlers.announce('Tresor aufgesperrt.');
    } catch (error) {
      // Der Cursor bleibt im Feld, der falsche Versuch wird markiert — man tippt
      // sich in aller Regel nur einmal falsch.
      passField.select();
      paint(error instanceof VaultError ? error.message : 'Aufsperren fehlgeschlagen.');
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
    handlers.announce('Tresor zugesperrt.');
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
    paint('Gelöscht. Es liegt nichts mehr im Speicher.');
    handlers.announce('Tresor gelöscht.');
  }

  /* ── Zeitschaltung ──────────────────────────────────────────────────────── */

  function resetIdleTimer(): void {
    window.clearTimeout(idleTimer);
    if (sessionPassphrase === null) {
      return;
    }
    idleTimer = window.setTimeout(() => {
      lock(`Nach ${Math.round(settings.timeoutMs / 60_000)} Minuten ohne Eingabe zugesperrt.`);
    }, settings.timeoutMs);
  }

  // `passive: true`: Diese Zuhörer verändern nichts am Ereignis, und der Browser
  // darf das Scrollen deshalb nicht auf sie warten lassen.
  for (const type of ['pointerdown', 'keydown', 'focusin'] as const) {
    document.addEventListener(type, resetIdleTimer, { passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' && settings.lockOnHide) {
      lock('Beim Verlassen des Tabs zugesperrt.');
    }
  });

  /* ── Verdrahtung ────────────────────────────────────────────────────────── */

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const passphrase = passField.value;
    if (passphrase === '') {
      paint('Ohne Passphrase gibt es keinen Schlüssel.');
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
      handlers.announce('Tresor neu verschlüsselt.');
    }
  });

  wipeButton.addEventListener('click', () => {
    // Zweistufig statt `confirm()`: Ein Dialog blockiert den Thread und sieht
    // auf jedem System anders aus. Der zweite Klick auf denselben Knopf ist
    // ebenso eindeutig und bleibt im Gerät.
    if (wipeButton.dataset.armed === undefined) {
      wipeButton.dataset.armed = '';
      wipeButton.textContent = 'Wirklich löschen?';
      window.setTimeout(() => {
        delete wipeButton.dataset.armed;
        wipeButton.textContent = 'Alles löschen';
      }, 4000);
      return;
    }
    delete wipeButton.dataset.armed;
    wipeButton.textContent = 'Alles löschen';
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

  paint();
}
