/**
 * Erzeugt die Android-Ressourcen aus den 37 Locale-Dateien des Web-Projekts.
 *
 * ── Warum generiert und nicht gepflegt ─────────────────────────────────────
 * Weil es sonst zwei Wahrheiten gaebe. Die Texte stehen in
 * `src/i18n/locales/*.ts`, dort prueft der Compiler jeden Schluessel und ein
 * Test jede Mehrzahlform. Eine zweite, von Hand gepflegte Fassung unter
 * `values-…/strings.xml` waere nach dem ersten Tippfehler stumm veraltet — und
 * zwar in 36 Sprachen gleichzeitig, in denen niemand nachsieht.
 *
 * ── Die Ausgabe wird EINGECHECKT ──────────────────────────────────────────
 * Der Generator laeuft auf Zuruf, nicht im Gradle-Bau. Dieselbe Linie wie bei
 * den Icons der 1.x-Fassung: Der F-Droid-Buildserver von morgen soll kein Node
 * brauchen, um die App zu uebersetzen.
 *
 * ── Die drei Uebersetzungsschritte ────────────────────────────────────────
 *
 * 1. **Schluessel.** `vault.action.seal` wird `vault_action_seal`. Android
 *    erlaubt keine Punkte in Ressourcennamen.
 *
 * 2. **Platzhalter.** Der Web-Katalog benutzt BENANNTE Platzhalter (`{name}`),
 *    und ihre Reihenfolge darf je Sprache anders sein — genau dafuer sind sie
 *    benannt. Android kennt nur POSITIONEN (`%1$s`). Der Generator haelt
 *    deshalb je Schluessel fest, welcher Name auf welche Position gehoert,
 *    UND ZWAR AUS `en.ts` — und setzt diese Zuordnung in allen 37 Sprachen
 *    gleich ein. Ohne das stuende in einer Sprache mit umgestellten
 *    Platzhaltern der Kontoname dort, wo die Sekundenzahl hingehoert.
 *
 * 3. **Mehrzahl.** Ein Objekt `{ one, other }` wird zu `<plurals>` mit
 *    `<item quantity="…">`. Die Kategorien sind dieselben CLDR-Namen auf
 *    beiden Seiten; geprueft wird trotzdem gegen `Intl.PluralRules`.
 *
 * ── Warum alle Platzhalter `%1$s` sind und nie `%1$d` ─────────────────────
 * Weil Android eine Zahl mit `%d` in den Ziffern der jeweiligen Sprache
 * setzt — auf Arabisch also ٦٠٠٬٠٠٠. Die Web-Fassung erzwingt ueberall
 * `-u-nu-latn`, und zwar aus einem harten Grund: Die Codes werden in fremde
 * Anmeldefelder getippt und muessen lateinisch sein. Der Generator schreibt
 * deshalb durchgehend `%s`; die App formatiert Zahlen selbst und reicht sie
 * als Text herein. Ein `%d` hier waere ein stiller Bruch mit der Web-Fassung,
 * den man erst auf einem arabischen Geraet saehe.
 *
 * ── Aufruf ────────────────────────────────────────────────────────────────
 *   node scripts/native-strings.mjs
 */

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
// ABWEICHUNG vom Auftrag, gemessen: Der Auftrag nennt esbuild, „liegt via Vite
// schon im Baum". Das stimmt hier nicht mehr — Vite 8 baut auf ROLLDOWN, und
// esbuild kommt im ganzen node_modules nicht vor (geprueft: nur @oxc-project,
// @rolldown und rolldown). Rolldown bringt denselben Dienst mit: Sein
// oxc-Transformer liegt unter `rolldown/experimental`. Die Absicht des
// Auftrags — keine neue Abhaengigkeit — ist damit unveraendert erfuellt.
import { transformSync } from 'rolldown/experimental';

const LOCALES_DIR = 'src/i18n/locales';
const RES_DIR = 'android-native/app/src/main/res';
const BASE_LOCALE = 'en';
const TEMP_DIR = 'android-native/app/build/native-strings';

/**
 * Die Basissprache landet in `values/` ohne Qualifier — sie ist der Rueckfall
 * fuer jedes Geraet, dessen Sprache nicht dabei ist. Genau wie im Web, wo `t()`
 * auf Englisch zurueckfaellt.
 */
function resourceDir(code) {
  if (code === BASE_LOCALE) return 'values';

  // Durchgehend die BCP-47-Schreibweise mit `b+`, auch bei einfachen Codes.
  //
  // Der Grund sind Sprachen mit Alt-Codes: Hebraeisch hiess frueher `iw`,
  // Indonesisch `in`, Jiddisch `ji`. Die `b+`-Form ist ausdruecklich BCP-47 und
  // damit eindeutig — sie gibt es seit API 21, die App verlangt 26.
  // Einheitlich statt nur dort, wo es noetig waere: Eine Regel mit drei
  // Ausnahmen ist eine Regel, die jemand falsch anwendet.
  //
  // NACHGEMESSEN am gebauten APK (`aapt2 dump resources`): aapt2 normalisiert
  // die Qualifier selbst — aus `b+he` wird `he`, aus `b+id` wird `id`, aus
  // `b+pt+BR` wird `pt-rBR`, und `b+zh+Hans` bleibt stehen. Die Ressourcen
  // liegen danach unter den modernen Codes, und die Laufzeit bildet `iw`/`in`
  // darauf ab. Gezaehlt wurden 37 Konfigurationen fuer `string/zone_input`:
  // eine ohne Qualifier (Englisch) plus 36.
  return `values-b+${code.replace('-', '+')}`;
}

/* ── Die Locale-Dateien lesen ───────────────────────────────────────────── */

/**
 * TypeScript kann Node nicht direkt laden, und die Locale-Dateien tragen
 * echtes TS: ein `import type` am Kopf und ein `satisfies Strings` am Ende.
 * Beides muss weg, bevor Node sie importieren kann.
 *
 * Rolldowns oxc-Transformer liegt ueber Vite ohnehin im Baum — der Umweg
 * kostet also keine neue Abhaengigkeit, nur eine Umwandlung je Datei.
 */
async function loadLocale(code) {
  const file = join(LOCALES_DIR, `${code}.ts`);
  const source = await readFile(file, 'utf8');
  const result = transformSync(`${code}.ts`, source, { lang: 'ts' });

  if (result.errors.length > 0) {
    throw new Error(`${file}: ${result.errors.map((e) => e.message ?? e).join('; ')}`);
  }
  const js = result.code;

  const target = join(TEMP_DIR, `${code}.mjs`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, js, 'utf8');

  const module = await import(pathToFileURL(resolve(target)).href);
  return module.default;
}

/* ── Platzhalter ────────────────────────────────────────────────────────── */

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholderNames(value) {
  const names = [];
  for (const text of typeof value === 'string' ? [value] : Object.values(value)) {
    for (const match of text.matchAll(PLACEHOLDER)) {
      if (!names.includes(match[1])) names.push(match[1]);
    }
  }
  return names;
}

/* ── XML ────────────────────────────────────────────────────────────────── */

/**
 * Maskiert einen Text fuer eine Android-Ressource.
 *
 * Die Liste ist laenger, als man denkt, und jeder Eintrag hat einen Grund:
 * `&`, `<` und `>` sind XML; `'` und `"` beendeten sonst den Ressourcenwert;
 * ein fuehrendes `@` oder `?` deutete Android als Verweis auf eine andere
 * Ressource; ein Zeilenumbruch muss als `\n` dastehen, weil aapt echte
 * Umbrueche zu Leerzeichen faltet.
 */
function escapeXml(text, placeholderCount) {
  let out = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');

  // Ein literales Prozentzeichen in einem Text MIT Platzhaltern muss verdoppelt
  // werden, sonst haelt String.format es fuer den Anfang einer Formatangabe.
  if (placeholderCount > 0) {
    out = out.replace(/%(?!\d+\$s)/g, '%%');
  }

  if (out.startsWith('@') || out.startsWith('?')) {
    out = `\\${out}`;
  }
  return out;
}

/** Setzt benannte Platzhalter auf die Positionen aus der Basissprache. */
function toPositional(text, order) {
  return text.replace(PLACEHOLDER, (whole, name) => {
    const index = order.indexOf(name);
    if (index === -1) {
      throw new Error(`Platzhalter {${name}} steht nicht in der Basissprache`);
    }
    return `%${index + 1}$s`;
  });
}

/* ── Lauf ───────────────────────────────────────────────────────────────── */

const files = (await readdir(LOCALES_DIR)).filter((name) => name.endsWith('.ts'));
const codes = files.map((name) => name.replace('.ts', '')).sort();

if (!codes.includes(BASE_LOCALE)) {
  throw new Error(`Die Basissprache ${BASE_LOCALE} fehlt`);
}

const base = await loadLocale(BASE_LOCALE);
const baseKeys = Object.keys(base);

// Die Zuordnung Name → Position, EINMAL aus der Basissprache. Sie gilt danach
// fuer alle 37 Sprachen — auch fuer die, die die Teile umstellen.
const order = new Map();
for (const key of baseKeys) {
  order.set(key, placeholderNames(base[key]));
}

// Ressourcennamen muessen eindeutig sein. Zwei Schluessel, die sich nur in
// Punkt gegen Unterstrich unterscheiden, kollidierten sonst stillschweigend.
const resourceNames = new Map();
for (const key of baseKeys) {
  const name = key.replace(/[.-]/g, '_');
  if (resourceNames.has(name)) {
    throw new Error(`Ressourcenname ${name} entsteht aus zwei Schluesseln`);
  }
  resourceNames.set(name, key);
}

/** Die sechs CLDR-Kategorien — dieselbe Liste wie in `src/i18n/strings.ts`. */
const VALID_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

const problems = [];
/** Formen, die eine Sprache mitbringt, aber laut CLDR nie auswaehlt. */
const unusedForms = [];
let stringCount = 0;
let pluralCount = 0;

for (const code of codes) {
  const catalogue = await loadLocale(code);
  const keys = Object.keys(catalogue);

  if (keys.length !== baseKeys.length) {
    problems.push(`${code}: ${keys.length} Schluessel statt ${baseKeys.length}`);
  }

  const rules = new Intl.PluralRules(code);
  const allowed = new Set(rules.resolvedOptions().pluralCategories);

  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!--',
    `  ERZEUGT von scripts/native-strings.mjs aus src/i18n/locales/${code}.ts`,
    '  Nicht von Hand aendern: Der naechste Lauf ueberschreibt jede Aenderung.',
    '  Texte gehoeren in die Locale-Datei, wo der Compiler sie prueft.',
    '-->',
    '<resources>',
  ];

  for (const key of baseKeys) {
    const value = catalogue[key];
    if (value === undefined) {
      problems.push(`${code}: ${key} fehlt`);
      continue;
    }

    const name = key.replace(/[.-]/g, '_');
    const names = order.get(key);
    const count = names.length;

    // Ein Platzhalter, den die Uebersetzung kennt, die Basissprache aber
    // nicht, waere zur Laufzeit eine leere Stelle.
    for (const found of placeholderNames(value)) {
      if (!names.includes(found)) {
        problems.push(`${code}: ${key} hat den unbekannten Platzhalter {${found}}`);
      }
    }

    if (typeof value === 'string') {
      lines.push(
        `    <string name="${name}">${escapeXml(toPositional(value, names), count)}</string>`,
      );
      stringCount++;
    } else {
      lines.push(`    <plurals name="${name}">`);

      // Dieselbe Regel wie `catalogue.test.ts` im Web: Jede Kategorie, die
      // `Intl.PluralRules` fuer diese Sprache NENNT, muss da sein — sonst gibt
      // es einen Satz, den nie jemand zu sehen bekommt. Eine Kategorie
      // ZUVIEL ist dagegen kein Fehler, solange sie eine der sechs
      // CLDR-Kategorien ist.
      //
      // Dass es diesen Fall wirklich gibt, hat der erste Lauf gezeigt:
      // Hebraeisch traegt im Katalog ein "many", das die heutigen CLDR-Daten
      // fuer `he` nicht mehr kennen (erlaubt sind dort one, two, other). Die
      // Form ist damit tot, aber nicht falsch — Android waehlt sie schlicht
      // nie aus, und `many` ist dort ein gueltiges quantity-Schluesselwort.
      for (const category of allowed) {
        if (!(category in value)) {
          problems.push(`${code}: ${key} fehlt die Kategorie "${category}"`);
        }
      }
      for (const [quantity, text] of Object.entries(value)) {
        if (!VALID_CATEGORIES.has(quantity)) {
          problems.push(`${code}: ${key} hat die unbekannte Kategorie "${quantity}"`);
          continue;
        }
        if (!allowed.has(quantity)) {
          unusedForms.push(`${code}/${key}: "${quantity}"`);
        }
        lines.push(
          `        <item quantity="${quantity}">${escapeXml(toPositional(text, names), count)}</item>`,
        );
      }
      lines.push('    </plurals>');
      pluralCount++;
    }
  }

  lines.push('</resources>', '');

  const dir = join(RES_DIR, resourceDir(code));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'strings.xml'), lines.join('\n'), 'utf8');
}

/**
 * Die Liste fuer die per-App-Sprachwahl. Ab API 33 liest das System sie und
 * bietet die Sprachen in den Einstellungen an; darunter benutzt AppCompat
 * dieselbe Datei.
 */
const localeConfig = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<!-- ERZEUGT von scripts/native-strings.mjs. Nicht von Hand aendern. -->',
  '<locale-config xmlns:android="http://schemas.android.com/apk/res/android">',
  ...codes.map((code) => `    <locale android:name="${code}" />`),
  '</locale-config>',
  '',
].join('\n');

await mkdir(join(RES_DIR, 'xml'), { recursive: true });
await writeFile(join(RES_DIR, 'xml', 'locales_config.xml'), localeConfig, 'utf8');

// Die umgewandelten Zwischendateien werden nicht gebraucht.
await rm(TEMP_DIR, { recursive: true, force: true });

if (problems.length > 0) {
  process.stderr.write(`native-strings: ${problems.length} Problem(e)\n\n`);
  for (const problem of problems.slice(0, 40)) process.stderr.write(`  ${problem}\n`);
  if (problems.length > 40) process.stderr.write(`  … und ${problems.length - 40} weitere\n`);
  process.exit(1);
}

if (unusedForms.length > 0) {
  process.stdout.write(
    `Hinweis: ${unusedForms.length} Mehrzahlform(en) werden von CLDR nie ausgewaehlt ` +
      '— uebernommen, aber tot:\n',
  );
  for (const form of unusedForms) process.stdout.write(`  ${form}\n`);
  process.stdout.write('\n');
}

const perLocale = stringCount / codes.length + pluralCount / codes.length;
process.stdout.write(
  `native-strings: ${codes.length} Sprachen geschrieben.\n` +
    `  ${baseKeys.length} Schluessel je Sprache ` +
    `(${stringCount / codes.length} Texte, ${pluralCount / codes.length} Mehrzahl-Eintraege)\n` +
    `  ${stringCount + pluralCount} Eintraege insgesamt, erwartet ${baseKeys.length * codes.length}\n` +
    `  locales_config.xml mit ${codes.length} Eintraegen\n`,
);

if (perLocale !== baseKeys.length) {
  process.stderr.write('Die Zahl je Sprache passt nicht zur Schluesselzahl.\n');
  process.exit(1);
}
