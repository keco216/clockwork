/**
 * Welche Sprachen es gibt, wie sie heißen und wie sie geschrieben werden.
 *
 * Hier stehen bewusst nur Metadaten — keine Übersetzungen. Die liegen je Sprache
 * in `locales/`.
 *
 * ── Warum die Eigennamen von Hand stehen ───────────────────────────────────
 * `Intl.DisplayNames` könnte sie liefern, hängt aber an den ICU-Daten der
 * jeweiligen Laufzeitumgebung: mal „Deutsch", mal „deutsch", auf abgespeckten
 * Builds gar nichts. Eine App, die offline und überall gleich aussehen soll,
 * darf ihre eigene Sprachliste nicht von der Laune der Umgebung abhängig machen.
 * 37 Zeilen von Hand sind der Preis dafür, dass die Liste überall stimmt.
 */

/**
 * Schriftsystem-Gruppen. Sie entscheiden über den Schrift-Stack (siehe
 * styles/scripts.css) — nicht über die Sprache.
 *
 * `latin` deckt alles ab, was die gebündelte Instrument Sans mit ihren beiden
 * Subsets (latin + latin-ext) darstellen kann. `vietnamese`, `cyrillic` und
 * `greek` sind eigene Gruppen, weil die Markenschrift für sie KEINEN Schnitt
 * mitbringt: Dort würde jedes zweite Zeichen aus einer Systemschrift kommen und
 * der Text sichtbar aus zwei Schriften bestehen. Eine durchgehende Systemschrift
 * ist das kleinere Übel.
 */
export type ScriptGroup =
  | 'latin'
  | 'vietnamese'
  | 'cyrillic'
  | 'greek'
  | 'arabic'
  | 'hebrew'
  | 'devanagari'
  | 'thai'
  | 'japanese'
  | 'korean'
  | 'hans'
  | 'hant';

export interface LocaleMeta {
  /** BCP-47-Tag, exakt so wie der Dateiname unter `locales/`. */
  readonly code: string;
  /** Der Eigenname — wie die Sprache sich selbst nennt. */
  readonly name: string;
  readonly dir: 'ltr' | 'rtl';
  readonly script: ScriptGroup;
}

/**
 * Die Reihenfolge hier ist die Reihenfolge im Auftrag. Der Umschalter sortiert
 * selbst nach Eigennamen — diese Liste bleibt so, wie sie gelesen wurde.
 */
export const LOCALES: readonly LocaleMeta[] = [
  { code: 'de', name: 'Deutsch', dir: 'ltr', script: 'latin' },
  { code: 'en', name: 'English', dir: 'ltr', script: 'latin' },
  { code: 'fr', name: 'Français', dir: 'ltr', script: 'latin' },
  { code: 'it', name: 'Italiano', dir: 'ltr', script: 'latin' },
  { code: 'es', name: 'Español', dir: 'ltr', script: 'latin' },
  { code: 'pt-PT', name: 'Português (Portugal)', dir: 'ltr', script: 'latin' },
  { code: 'pt-BR', name: 'Português (Brasil)', dir: 'ltr', script: 'latin' },
  { code: 'nl', name: 'Nederlands', dir: 'ltr', script: 'latin' },
  { code: 'pl', name: 'Polski', dir: 'ltr', script: 'latin' },
  { code: 'cs', name: 'Čeština', dir: 'ltr', script: 'latin' },
  { code: 'sk', name: 'Slovenčina', dir: 'ltr', script: 'latin' },
  { code: 'hu', name: 'Magyar', dir: 'ltr', script: 'latin' },
  { code: 'sl', name: 'Slovenščina', dir: 'ltr', script: 'latin' },
  { code: 'hr', name: 'Hrvatski', dir: 'ltr', script: 'latin' },
  { code: 'ro', name: 'Română', dir: 'ltr', script: 'latin' },
  { code: 'bg', name: 'Български', dir: 'ltr', script: 'cyrillic' },
  { code: 'el', name: 'Ελληνικά', dir: 'ltr', script: 'greek' },
  { code: 'sv', name: 'Svenska', dir: 'ltr', script: 'latin' },
  { code: 'da', name: 'Dansk', dir: 'ltr', script: 'latin' },
  { code: 'nb', name: 'Norsk bokmål', dir: 'ltr', script: 'latin' },
  { code: 'fi', name: 'Suomi', dir: 'ltr', script: 'latin' },
  { code: 'et', name: 'Eesti', dir: 'ltr', script: 'latin' },
  { code: 'lv', name: 'Latviešu', dir: 'ltr', script: 'latin' },
  { code: 'lt', name: 'Lietuvių', dir: 'ltr', script: 'latin' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr', script: 'latin' },
  { code: 'ru', name: 'Русский', dir: 'ltr', script: 'cyrillic' },
  { code: 'uk', name: 'Українська', dir: 'ltr', script: 'cyrillic' },
  { code: 'ar', name: 'العربية', dir: 'rtl', script: 'arabic' },
  { code: 'he', name: 'עברית', dir: 'rtl', script: 'hebrew' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr', script: 'devanagari' },
  { code: 'id', name: 'Bahasa Indonesia', dir: 'ltr', script: 'latin' },
  { code: 'vi', name: 'Tiếng Việt', dir: 'ltr', script: 'vietnamese' },
  { code: 'th', name: 'ไทย', dir: 'ltr', script: 'thai' },
  { code: 'ja', name: '日本語', dir: 'ltr', script: 'japanese' },
  { code: 'ko', name: '한국어', dir: 'ltr', script: 'korean' },
  { code: 'zh-Hans', name: '简体中文', dir: 'ltr', script: 'hans' },
  { code: 'zh-Hant', name: '繁體中文', dir: 'ltr', script: 'hant' },
];

/** Die Sprache, in der die Quelle geschrieben ist und auf die alles zurückfällt. */
export const BASE_LOCALE = 'en';

const BY_CODE: ReadonlyMap<string, LocaleMeta> = new Map(
  LOCALES.map((locale) => [locale.code.toLowerCase(), locale]),
);

export function localeMeta(code: string): LocaleMeta {
  const found = BY_CODE.get(code.toLowerCase());
  if (found === undefined) {
    throw new Error(`Unbekannte Locale »${code}«.`);
  }
  return found;
}

/* ── Was in DIESEM Bündel steckt ───────────────────────────────────────────
   Die Tabelle oben beschreibt alle Sprachen, die das Projekt kennt. Wie viele
   davon ein einzelner Build wirklich mitbringt, entscheidet die Auswahl zur
   Bauzeit (`CLOCKWORK_LANGS`, siehe scripts/locale-subset.ts) — und das weiß
   allein der Katalog. `installCatalogue()` meldet es hier an; solange niemand
   etwas meldet, gilt: alles.

   Warum die Tabelle trotzdem vollständig bleibt, auch wenn nur drei Sprachen
   gebaut wurden: Sie wiegt fast nichts (Name, Richtung, Schriftsystem), und
   `resolveLocale()` braucht sie ganz. Nur wer weiß, dass `pt-BR` und `pt-PT`
   Geschwister sind, kann jemanden mit brasilianischem Browser bei einem Bündel
   ohne `pt-BR` auf europäisches Portugiesisch schicken statt auf Englisch. */

let bundled: ReadonlySet<string> = new Set(BY_CODE.keys());

/** Meldet, welche Sprachen dieser Build tatsächlich enthält. */
export function restrictToBundled(codes: readonly string[]): void {
  bundled = new Set(codes.map((code) => code.toLowerCase()));
}

/** Die Sprachen, die dieser Build anbieten kann — in der Reihenfolge der Tabelle. */
export function bundledLocales(): readonly LocaleMeta[] {
  return LOCALES.filter((locale) => bundled.has(locale.code.toLowerCase()));
}

/**
 * Ist diese Sprache hier wählbar?
 *
 * Bewusst nicht „kennt das Projekt sie", sondern „ist sie mitgekommen": Ein
 * `#lang=ja` in einem Bündel ohne Japanisch darf nicht zu einer Oberfläche
 * führen, die sich für japanisch hält und englisch dasteht.
 */
export function isBundledLocale(code: string): boolean {
  return bundled.has(code.toLowerCase());
}

/**
 * Veraltete Sprachcodes, die manche Systeme immer noch senden.
 * `iw`, `in` und `ji` sind die ISO-639-Codes von vor 1989; Java und ältere
 * Android-Versionen liefern sie bis heute.
 */
const LEGACY_ALIASES: Readonly<Record<string, string>> = {
  iw: 'he',
  in: 'id',
  no: 'nb',
  nn: 'nb',
};

/**
 * Chinesisch nach Region auf eine Schriftform abbilden.
 *
 * Es gibt kein „einfach zh": Wer `zh-TW` schickt, will traditionelle Zeichen,
 * wer `zh-CN` schickt, vereinfachte. Ohne Region ist vereinfacht die
 * verbreitetere Annahme.
 */
const CHINESE_BY_REGION: Readonly<Record<string, string>> = {
  tw: 'zh-Hant',
  hk: 'zh-Hant',
  mo: 'zh-Hant',
  cn: 'zh-Hans',
  sg: 'zh-Hans',
  my: 'zh-Hans',
};

/**
 * Was für einen einzelnen Wunsch-Tag in Frage kommt — die beste Wahl zuerst.
 *
 *   1. Volltreffer auf den ganzen Tag        `pt-BR` → `pt-BR`
 *   2. Sonderfälle Chinesisch und Portugiesisch (Schrift bzw. Region)
 *   3. die jeweils andere Variante davon
 *   4. Treffer auf die Basissprache          `de-AT` → `de`
 *
 * Schritt 3 ist nur für Teil-Bündel da. Sind alle 37 Sprachen dabei, greift
 * immer schon Schritt 1 oder 2, und die Liste ist einen Eintrag lang. Fehlt
 * aber `pt-BR`, dann ist europäisches Portugiesisch für einen brasilianischen
 * Browser die deutlich bessere Antwort als Englisch — dasselbe gilt für die
 * beiden chinesischen Schriftformen.
 */
function candidatesFor(tag: string): readonly string[] {
  const found: string[] = [];
  const add = (code: string | undefined): void => {
    if (code !== undefined && !found.includes(code)) {
      found.push(code);
    }
  };

  add(BY_CODE.get(tag)?.code);

  const parts = tag.split('-');
  const language = LEGACY_ALIASES[parts[0] ?? ''] ?? parts[0] ?? '';

  if (language === 'zh') {
    const script = parts.find((part) => part === 'hans' || part === 'hant');
    const region = parts[parts.length - 1] ?? '';
    let wanted = CHINESE_BY_REGION[region] ?? 'zh-Hans';
    if (script === 'hans') wanted = 'zh-Hans';
    if (script === 'hant') wanted = 'zh-Hant';
    add(wanted);
    add(wanted === 'zh-Hans' ? 'zh-Hant' : 'zh-Hans');
  } else if (language === 'pt') {
    const wanted = parts.includes('br') ? 'pt-BR' : 'pt-PT';
    add(wanted);
    add(wanted === 'pt-BR' ? 'pt-PT' : 'pt-BR');
  } else {
    add(BY_CODE.get(language)?.code);
  }

  return found;
}

/**
 * Sucht zu einer Liste von Wunschsprachen die beste vorhandene aus.
 *
 * Die Liste kommt aus `navigator.languages` und ist bereits nach Vorliebe
 * sortiert — wir gehen sie der Reihe nach durch und nehmen den ersten Treffer,
 * der in diesem Bündel auch wirklich steckt.
 *
 * Findet sich gar nichts, gilt {@link BASE_LOCALE}. Das ist bewusst Englisch und
 * nicht Deutsch: Wer keine der gebauten Sprachen spricht, kommt mit Englisch
 * weiter.
 */
export function resolveLocale(requested: readonly string[]): string {
  for (const raw of requested) {
    const tag = raw.trim().toLowerCase();
    if (tag === '') {
      continue;
    }
    for (const candidate of candidatesFor(tag)) {
      if (bundled.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
  }

  return BASE_LOCALE;
}
