/**
 * Sprachwahl: erkennen, merken, wechseln.
 *
 * ── Warum die Wahl im URL-Hash steht und nicht im localStorage ─────────────
 * Weil im Fuß dieser App „kein Speicher" steht und dieser Satz wörtlich wahr
 * bleiben soll. Ein Sprachcode ist harmlos — aber sobald die App anfängt,
 * „harmlose" Dinge abzulegen, ist die Aussage nicht mehr prüfbar, sondern eine
 * Ermessensfrage. Der Hash kostet nichts und ist prüfbar: Er steht sichtbar in
 * der Adresszeile.
 *
 * Zwei Eigenschaften, die dabei herausfallen und wirklich nützlich sind:
 *
 *   • Ein Fragment wird NIE an einen Server geschickt. Selbst wenn jemand die
 *     PWA hostet, erfährt der Server die Sprachwahl nicht.
 *   • `…/clockwork.html#lang=fr` ist weitergebbar — man kann jemandem die App
 *     in seiner Sprache schicken.
 *
 * Der Preis: Wer die PWA vom Startbildschirm öffnet, startet ohne Hash und
 * bekommt wieder die automatisch erkannte Sprache. Das ist verkraftbar, weil
 * die Erkennung in aller Regel richtig liegt — sie liest dieselbe Liste, die
 * auch der Browser für seine eigene Oberfläche benutzt.
 */

import { CATALOGUE } from './catalogue';
import { BASE_LOCALE, isBundledLocale, resolveLocale } from './registry';
import { getLocale, installCatalogue, setLocale } from './runtime';

const HASH_KEY = 'lang';

/** Liest `#lang=xx` — und lässt andere Hash-Angaben unangetastet. */
function localeFromHash(): string | null {
  const raw = window.location.hash.replace(/^#/, '');
  if (raw === '') {
    return null;
  }
  const requested = new URLSearchParams(raw).get(HASH_KEY);
  if (requested === null || !isBundledLocale(requested)) {
    return null;
  }
  // Über den Registry-Weg, damit die Schreibweise stimmt: `#lang=zh-hans` soll
  // dieselbe Sprache treffen wie `#lang=zh-Hans`.
  return resolveLocale([requested]);
}

/** Was der Browser über die Wunschsprachen weiß. */
function localeFromBrowser(): string {
  const wanted = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  return resolveLocale(wanted);
}

function writeHash(code: string): void {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  params.set(HASH_KEY, code);
  const hash = `#${params.toString()}`;

  // `replaceState` statt `location.hash`: Der Sprachwechsel soll den
  // Zurück-Knopf nicht mit Zwischenständen füllen. Auf `file://` verweigern
  // manche Browser den Aufruf — dann eben der einfache Weg.
  try {
    window.history.replaceState(null, '', hash);
  } catch {
    window.location.hash = hash;
  }
}

/**
 * Ermittelt die Startsprache und schaltet sie ein.
 * Muss vor dem ersten Zeichnen laufen.
 */
export function initLanguage(): void {
  installCatalogue(CATALOGUE);
  const initial = localeFromHash() ?? localeFromBrowser();
  // `setLocale` tut nichts, wenn die Sprache schon eingestellt ist — beim Start
  // ist das Englisch. Deshalb hier immer über den Umweg der Zuweisung.
  if (initial !== getLocale()) {
    setLocale(initial);
  }

  // Wer den Hash von Hand ändert oder zurückblättert, soll das auch sehen.
  window.addEventListener('hashchange', () => {
    setLocale(localeFromHash() ?? localeFromBrowser());
  });
}

/** Der Nutzer hat im Umschalter etwas gewählt. */
export function chooseLanguage(code: string): void {
  if (!isBundledLocale(code)) {
    return;
  }
  writeHash(code);
  setLocale(code);
}

export { BASE_LOCALE };
