/**
 * Der Sprachumschalter.
 *
 * ── Warum ein <select> und kein eigenes Menü ───────────────────────────────
 * Weil 37 Einträge in einer selbstgebauten Liste ein Bedienelement wären, das
 * man tastaturfähig, scrollbar und bildschirmlesertauglich nachbauen müsste —
 * und das der Browser bereits mitbringt, in der Darstellung des jeweiligen
 * Systems. Das Gerät bekommt hier keinen Sonderweg, sondern dasselbe `.pick`,
 * das schon die Tresor-Zeitschaltung benutzt.
 *
 * ── Warum nach Eigennamen sortiert ─────────────────────────────────────────
 * Wer seine Sprache sucht, sucht nach ihrem Namen — nicht nach dem englischen
 * Namen und nicht nach dem Sprachcode. Sortiert wird mit einem festen
 * Collator (`en`), damit die Reihenfolge auf jedem Rechner dieselbe ist.
 */

import { chooseLanguage } from '../i18n/language';
import { LOCALES } from '../i18n/registry';
import { getLocale, onLocaleChange } from '../i18n/runtime';
import { requireElement } from './dom';

export function startLanguageSwitch(): void {
  const select = requireElement<HTMLSelectElement>(document, '#lang-select');

  const collator = new Intl.Collator('en', { sensitivity: 'base' });
  const ordered = [...LOCALES].sort((a, b) => collator.compare(a.name, b.name));

  for (const locale of ordered) {
    const option = document.createElement('option');
    option.value = locale.code;
    option.textContent = locale.name;
    // `lang` je Eintrag: Damit wählt der Browser für „日本語" und „العربية"
    // schon in der aufgeklappten Liste die richtige Systemschrift.
    option.lang = locale.code;
    select.append(option);
  }

  select.value = getLocale();

  select.addEventListener('change', () => {
    chooseLanguage(select.value);
  });

  // Auch wenn die Sprache von woanders kommt (Hash von Hand geändert,
  // Zurück-Knopf), soll das Feld zeigen, was wirklich gilt.
  onLocaleChange(() => {
    select.value = getLocale();
  });
}
