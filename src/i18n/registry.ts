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

export function isKnownLocale(code: string): boolean {
  return BY_CODE.has(code.toLowerCase());
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
 * Sucht zu einer Liste von Wunschsprachen die beste vorhandene aus.
 *
 * Die Liste kommt aus `navigator.languages` und ist bereits nach Vorliebe
 * sortiert — wir gehen sie der Reihe nach durch und nehmen den ersten Treffer.
 * Pro Eintrag in dieser Reihenfolge:
 *
 *   1. Volltreffer auf den ganzen Tag        `pt-BR` → `pt-BR`
 *   2. Sonderfälle Chinesisch und Portugiesisch (Schrift bzw. Region)
 *   3. Treffer auf die Basissprache          `de-AT` → `de`
 *
 * Findet sich gar nichts, gilt {@link BASE_LOCALE}. Das ist bewusst Englisch und
 * nicht Deutsch: Wer keine der 37 Sprachen spricht, kommt mit Englisch weiter.
 */
export function resolveLocale(requested: readonly string[]): string {
  for (const raw of requested) {
    const tag = raw.trim().toLowerCase();
    if (tag === '') {
      continue;
    }

    if (BY_CODE.has(tag)) {
      return BY_CODE.get(tag)?.code ?? BASE_LOCALE;
    }

    const parts = tag.split('-');
    const language = LEGACY_ALIASES[parts[0] ?? ''] ?? parts[0] ?? '';

    if (language === 'zh') {
      const script = parts.find((part) => part === 'hans' || part === 'hant');
      if (script === 'hans') return 'zh-Hans';
      if (script === 'hant') return 'zh-Hant';
      const region = parts[parts.length - 1] ?? '';
      return CHINESE_BY_REGION[region] ?? 'zh-Hans';
    }

    if (language === 'pt') {
      return parts.includes('br') ? 'pt-BR' : 'pt-PT';
    }

    if (BY_CODE.has(language)) {
      return BY_CODE.get(language)?.code ?? BASE_LOCALE;
    }
  }

  return BASE_LOCALE;
}
