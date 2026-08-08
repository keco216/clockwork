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
import { bundledLocales } from '../i18n/registry';
import { getLocale, onLocaleChange } from '../i18n/runtime';
import { requireElement } from './dom';

export function startLanguageSwitch(): void {
  const select = requireElement<HTMLSelectElement>(document, '#lang-select');

  // Angeboten wird, was dieses Bündel hat — nicht, was das Projekt kennt. Nach
  // einer Auswahl zur Bauzeit (CLOCKWORK_LANGS) sind das weniger als 37.
  const collator = new Intl.Collator('en', { sensitivity: 'base' });
  const ordered = [...bundledLocales()].sort((a, b) => collator.compare(a.name, b.name));

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

  // Ein Bündel mit nur einer Sprache braucht keine Wahl. Dann verschwindet die
  // ganze Zeile samt Beschriftung: Ein Bedienelement, das nur eine Möglichkeit
  // anbietet, ist ein Knopf, der nichts tut.
  if (ordered.length < 2) {
    const row = select.closest('.colophon__lang');
    if (row instanceof HTMLElement) {
      row.hidden = true;
    }
  }

  select.addEventListener('change', () => {
    chooseLanguage(select.value);
  });

  // Auch wenn die Sprache von woanders kommt (Hash von Hand geändert,
  // Zurück-Knopf), soll das Feld zeigen, was wirklich gilt.
  onLocaleChange(() => {
    select.value = getLocale();
  });
}
