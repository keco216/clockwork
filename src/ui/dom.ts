/**
 * Kleine DOM-Helfer. Bewusst winzig gehalten — hier soll kein Mini-Framework
 * entstehen, sondern nur der immer gleiche Kleinkram an einer Stelle stehen.
 */

/**
 * Holt ein Element und wirft, wenn es fehlt.
 *
 * `querySelector` liefert `Element | null`. Statt an 20 Stellen `?.` oder `!`
 * zu schreiben, prüfen wir einmal hier: Fehlt ein Element, passen index.html und
 * Code nicht zusammen — das ist ein Programmierfehler und soll laut scheitern,
 * nicht still zu einem halb funktionierenden UI führen.
 */
export function requireElement<T extends Element = HTMLElement>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<Element>(selector);
  if (element === null) {
    throw new Error(`Element »${selector}« fehlt — index.html und Code passen nicht zusammen.`);
  }
  return element as T;
}

/** Klont den Inhalt eines `<template>`-Tags aus index.html. */
export function cloneTemplate(id: string): HTMLElement {
  const template = document.getElementById(id);
  if (!(template instanceof HTMLTemplateElement)) {
    throw new Error(`<template id="${id}"> fehlt in index.html.`);
  }
  const clone = template.content.firstElementChild?.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    throw new Error(`<template id="${id}"> enthält kein Element.`);
  }
  return clone;
}

/** Möchte die Person, die hier sitzt, weniger Bewegung sehen? */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Kopiert Text in die Zwischenablage.
 *
 * Zwei Wege, weil ein Weg allein nicht reicht:
 *   1. `navigator.clipboard` ist der moderne Weg, braucht aber einen "secure
 *      context". Beim Doppelklick auf die Single-File-HTML (file://) ist der je
 *      nach Browser nicht gegeben.
 *   2. `document.execCommand('copy')` ist offiziell veraltet, funktioniert aber
 *      überall — genau der Fall, für den ein Fallback da ist.
 *
 * Kein Netzwerk, kein Framework, keine Berechtigungsabfrage.
 */
export async function copyText(text: string): Promise<void> {
  if (typeof navigator.clipboard?.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fällt unten auf den klassischen Weg zurück.
    }
  }

  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  // Ausserhalb des Sichtfelds, aber nicht `display:none` — sonst gibt es keine
  // Auswahl, die kopiert werden könnte.
  helper.style.position = 'fixed';
  helper.style.top = '-100vh';
  helper.style.opacity = '0';
  document.body.append(helper);

  try {
    helper.select();
    if (!document.execCommand('copy')) {
      throw new Error('Der Browser hat das Kopieren abgelehnt.');
    }
  } finally {
    helper.remove();
  }
}
