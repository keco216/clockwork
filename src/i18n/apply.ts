/**
 * Bringt die Übersetzungen ins Dokument.
 *
 * ── Drei Auszeichnungen in index.html ──────────────────────────────────────
 *
 *   data-i18n="key"                  setzt den Textinhalt
 *   data-i18n-attr="title=key,…"     setzt Attribute
 *   data-rich="key"                  Text mit eingebetteten Elementen
 *
 * ── Warum die eingebetteten Elemente in der HTML-Datei stehen ──────────────
 * Ein Satz wie „Base32, `Name: SECRET` oder `otpauth://…` — gemischt." enthält
 * ausgezeichnete Stücke. Man könnte ihn im JavaScript zusammensetzen; dann
 * stünden dort aber wieder Textbausteine, und die Wortstellung läge fest — für
 * eine Sprache, die das Objekt vor das Verb setzt, wäre das Übersetzen dann
 * unmöglich.
 *
 * Deshalb: Die Vorlage ist EIN Satz mit Platzhaltern (`{nameSecret}`), und die
 * Elemente liegen als `[data-slot]`-Kinder daneben in index.html. Beim Anwenden
 * werden sie an die Stelle ihres Platzhalters einsortiert — an welche, bestimmt
 * die Übersetzung. Die Elemente werden dabei VERSCHOBEN, nicht neu gebaut: Sie
 * behalten damit ihre Identität samt allem, was daran hängt — Ereignis-Zuhörer
 * überstehen einen Sprachwechsel.
 *
 * `innerHTML` kommt hier nirgends vor. Alle Texte gehen über `textContent`.
 */

import { localeMeta } from './registry';
import { getLocale, t } from './runtime';
import type { TextKey } from './strings';

/** Merkt sich Vorlage und Einschübe je Reichtext-Element. */
interface RichEntry {
  readonly key: TextKey;
  readonly slots: ReadonlyMap<string, Element>;
}

const richCache = new WeakMap<Element, RichEntry>();

/**
 * Setzt Sprache, Leserichtung und Schriftsystem am Wurzelelement.
 *
 * `lang` ist keine Kosmetik: Davon hängen Silbentrennung, Ligaturen, die
 * Sprachwahl des Screenreaders und bei CJK die Auswahl der richtigen
 * Zeichenvarianten ab. `data-script` steuert den Schrift-Stack (styles/scripts.css).
 */
export function applyDocumentAttributes(): void {
  const meta = localeMeta(getLocale());
  const root = document.documentElement;
  root.lang = meta.code;
  root.dir = meta.dir;
  root.dataset['script'] = meta.script;
}

/**
 * Übersetzt alles, was unterhalb von `root` ausgezeichnet ist.
 *
 * Wird zweimal gebraucht: einmal für das ganze Dokument und einmal für jeden
 * frisch geklonten Kanalzug — der Inhalt eines `<template>` steht nicht im
 * Dokumentbaum und würde von einem Durchlauf über `document` nie erfasst.
 */
export function applyStrings(root: ParentNode): void {
  // Reichtexte zuerst: Sie verschieben Elemente, die anschließend selbst noch
  // übersetzt werden wollen (z. B. das <kbd> mit dem Namen der Steuerungstaste).
  for (const element of root.querySelectorAll('[data-rich]')) {
    applyRich(element);
  }

  for (const element of root.querySelectorAll('[data-i18n]')) {
    const key = element.getAttribute('data-i18n');
    if (key !== null) {
      element.textContent = t(key as TextKey);
    }
  }

  for (const element of root.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of (element.getAttribute('data-i18n-attr') ?? '').split(',')) {
      const [attribute, key] = pair.split('=');
      if (attribute !== undefined && key !== undefined) {
        element.setAttribute(attribute.trim(), t(key.trim() as TextKey));
      }
    }
  }
}

/** Übersetzt das ganze Dokument samt Kopfdaten. */
export function applyStaticStrings(): void {
  applyDocumentAttributes();

  document.title = t('meta.title');
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', t('meta.description'));

  applyStrings(document);
}

/**
 * Baut einen Reichtext neu auf.
 *
 * Beim ersten Aufruf werden die `[data-slot]`-Kinder eingesammelt und gemerkt;
 * danach ist das Element nur noch eine Hülle, die bei jedem Sprachwechsel neu
 * befüllt wird.
 */
function applyRich(element: Element): void {
  let entry = richCache.get(element);
  if (entry === undefined) {
    const slots = new Map<string, Element>();
    for (const slot of element.querySelectorAll('[data-slot]')) {
      const name = slot.getAttribute('data-slot');
      if (name !== null) {
        slots.set(name, slot);
      }
    }
    entry = { key: (element.getAttribute('data-rich') ?? '') as TextKey, slots };
    richCache.set(element, entry);
  }

  const parts: Node[] = [];
  let lastIndex = 0;
  const template = t(entry.key);
  const placeholder = /\{(\w+)\}/g;

  for (let match = placeholder.exec(template); match !== null; match = placeholder.exec(template)) {
    const name = match[1] ?? '';
    const slot = entry.slots.get(name);
    if (slot === undefined) {
      continue; // unbekannter Platzhalter — bleibt als Text stehen und fällt auf
    }
    parts.push(document.createTextNode(template.slice(lastIndex, match.index)));
    parts.push(slot);
    lastIndex = match.index + match[0].length;
  }
  parts.push(document.createTextNode(template.slice(lastIndex)));

  element.replaceChildren(...parts);
}
