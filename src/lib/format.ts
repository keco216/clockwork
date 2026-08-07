/**
 * Reine Darstellungs-Helfer — bewusst ohne DOM, damit sie testbar bleiben.
 */

import type { Account } from './accounts';

/**
 * Gruppiert einen Code in zwei Blöcke: "123456" → "123 456".
 *
 * WARUM? Sieben plus/minus zwei — Ziffernblöcke von drei bis vier Zeichen kann
 * man auf einen Blick erfassen und fehlerfrei abtippen; sechs Ziffern am Stück
 * muss man zählen. Bei ungerader Länge bekommt der vordere Block die Extraziffer
 * (7 → "1234 567"), weil man von links liest.
 *
 * Achtung: Das ist NUR für die Anzeige. Kopiert wird immer der rohe Code.
 */
export function groupDigits(code: string): string {
  if (code.length <= 4) {
    return code;
  }
  const split = Math.ceil(code.length / 2);
  return `${code.slice(0, split)} ${code.slice(split)}`;
}

/**
 * Kurze Parameter-Zeile für die Karte, z. B. "SHA-1 · 6 Stellen · 30 s".
 * Bewusst immer sichtbar: In einem Lernprojekt will man sehen, mit welchen
 * Werten gerade gerechnet wird.
 */
export function describeParameters(account: Account): string {
  return `${account.algorithm} · ${account.digits} Stellen · ${account.period} s`;
}

/**
 * Überschrift und Unterzeile einer Karte.
 *
 * Regeln, absteigend nach Aussagekraft:
 *   Issuer + Konto  → "GitHub" / "kevin@example.com"
 *   nur Issuer      → "GitHub" / —
 *   nur Konto       → "kevin@example.com" / —
 *   nichts          → "Konto N" / —
 */
export function describeIdentity(
  account: Account,
  fallbackIndex: number,
): { title: string; subtitle: string | undefined } {
  if (account.issuer && account.accountName) {
    return { title: account.issuer, subtitle: account.accountName };
  }
  const single = account.issuer ?? account.accountName;
  if (single) {
    return { title: single, subtitle: undefined };
  }
  return { title: `Konto ${fallbackIndex + 1}`, subtitle: undefined };
}

/**
 * Kürzt eine Eingabezeile für die Anzeige auf einer Fehlerkarte.
 *
 * Bei einem Tippfehler im Secret hilft es, die Zeile zu sehen — aber die ganze
 * Zeile stehen zu lassen wäre unschön (lange URIs) und unnötig: Für die
 * Fehlersuche reichen Anfang und Ende.
 */
export function truncateForDisplay(text: string, maxLength = 48): string {
  if (text.length <= maxLength) {
    return text;
  }
  const head = Math.ceil((maxLength - 1) / 2);
  const tail = Math.floor((maxLength - 1) / 2);
  return `${text.slice(0, head)}…${text.slice(text.length - tail)}`;
}
