/**
 * Sprachauswahl zur Bauzeit.
 *
 * ── Wozu ───────────────────────────────────────────────────────────────────
 * Die 37 Kataloge sind der größte Posten im Bündel — rund 320 kB reiner Text.
 * Wer die App nur für sich baut, braucht selten alle. Deshalb nimmt der Build
 * eine Liste entgegen:
 *
 *   CLOCKWORK_LANGS=de,en,fr npm run build
 *
 * Ohne die Variable ändert sich nichts: Es bleibt bei allen 37. Die Auswahl ist
 * eine Zugabe, keine neue Voreinstellung.
 *
 * ── Warum ein Eingriff in den Quelltext und kein Nachladen ─────────────────
 * Weil Nachladen hier verboten ist. Ein `import()` je Sprache wäre eine
 * Netzwerkanfrage, und die Single-File-Datei untersagt sie per CSP
 * (`connect-src 'none'`). Es muss also schon beim Bauen feststehen, was
 * überhaupt in den Modulgraphen gerät — zur Laufzeit ist es dafür zu spät.
 *
 * Der Eingriff ist deshalb der kleinstmögliche: Aus `catalogue.ts` verschwinden
 * die Import-Zeile und der Objekteintrag jeder abgewählten Sprache. Was
 * niemand mehr importiert, kommt auch nicht ins Bündel — den Rest erledigt
 * Rollup von selbst. Die Datei auf der Platte bleibt unberührt; die Änderung
 * lebt nur im Speicher des Bauvorgangs.
 *
 * ── Warum die Zeilen geleert und nicht gelöscht werden ─────────────────────
 * Damit die Zeilennummern stehen bleiben. Eine gelöschte Zeile verschiebt alles
 * darunter, und jede Fehlermeldung aus diesem Modul zeigte danach auf die
 * falsche Stelle.
 *
 * ── Warum das Ganze sich selbst nachprüft ──────────────────────────────────
 * Eine Textoperation auf Quelltext ist nur so gut wie ihre Annahmen über
 * dessen Form. Ändert jemand `catalogue.ts`, sollen die Muster hier nicht
 * stillschweigend ins Leere greifen — dann wären am Ende doch alle 37 Sprachen
 * im Bündel, und niemand hätte es gemerkt. Deshalb wirft jeder Schritt bei
 * Unstimmigkeit, und am Ende steht eine Gegenprobe: Was übrig blieb, muss
 * genau die gewünschte Liste sein.
 */

import type { Plugin } from 'vite';

/** Der Name der Umgebungsvariablen. Steht nur hier. */
export const ENV_KEY = 'CLOCKWORK_LANGS';

/**
 * Die Sprache, die immer mitkommt.
 *
 * `runtime.ts` fällt auf sie zurück, wenn in der eingestellten Sprache ein
 * Schlüssel fehlt, und `resolveLocale()` landet bei ihr, wenn nichts passt. Ein
 * Bündel ohne sie hätte kein Netz unter dem Seil.
 */
export const BASE_CODE = 'en';

export const PLUGIN_NAME = 'clockwork:locale-subset';
export const NATIVE_PLUGIN_NAME = 'clockwork:strip-native-keys';

/** Der Pfad, an dem der Katalog steht — in Vite-Schreibweise mit Schrägstrichen. */
const CATALOGUE_PATH = '/src/i18n/catalogue.ts';

/** Das Verzeichnis der Sprachdateien — ebenfalls in Vite-Schreibweise. */
const LOCALES_PATH = '/src/i18n/locales/';

/**
 * Das Präfix der Schlüssel, die nur die native App braucht.
 *
 * Sie stehen im gemeinsamen Katalog, damit es eine einzige Textquelle gibt und
 * der Compiler sie über `satisfies Strings` in allen 37 Sprachen mitprüft
 * (Begründung ausführlich in `src/i18n/strings.ts`). Ins Web-Bündel gehören sie
 * trotzdem nicht: Dort ist der Text nicht nur ungenutzt, sondern inhaltlich
 * falsch — eine Web-App verlässt keinen „Browser", sie IST einer.
 */
export const NATIVE_PREFIX = 'native.';

export interface CatalogueEntry {
  /** Der Sprachcode, wie er im Katalog steht — zugleich der Dateiname. */
  readonly code: string;
  /** Der Bezeichner, unter dem die Sprachdatei importiert wird. */
  readonly binding: string;
  /** Nullbasierte Zeilennummer der Import-Zeile. */
  readonly importLine: number;
  /** Nullbasierte Zeilennummer des Eintrags im Katalog-Objekt. */
  readonly entryLine: number;
}

export interface SubsetResult {
  /** Der veränderte Quelltext. */
  readonly code: string;
  /** Was im Bündel bleibt, in der Reihenfolge des Katalogs. */
  readonly kept: readonly string[];
  /** Was herausfällt. */
  readonly dropped: readonly string[];
}

/* ── Die Form, die catalogue.ts haben muss ─────────────────────────────────
   Bewusst zeilenweise statt über einen echten Parser: Der Katalog ist eine
   Liste, keine Sprache. Ein AST-Werkzeug wäre hier eine zweite Abhängigkeit
   für eine Aufgabe, die drei Muster erledigen. */

const IMPORT_LINE = /^import\s+([A-Za-z_$][\w$]*)\s+from\s+'\.\/locales\/([A-Za-z][\w-]*)';?\s*$/;
const OBJECT_OPEN = /^export const CATALOGUE\b[^{]*\{\s*$/;
const OBJECT_CLOSE = /^\};?\s*$/;
const ENTRY_SHORTHAND = /^\s*([A-Za-z_$][\w$]*),\s*$/;
const ENTRY_QUOTED = /^\s*'([A-Za-z][\w-]*)':\s*([A-Za-z_$][\w$]*),\s*$/;
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/;

/** Vorangestellt, damit man einer Fehlermeldung ansieht, wer sie geworfen hat. */
const WHERE = 'Sprachauswahl (scripts/locale-subset.ts)';

/**
 * Zerlegt den Text der Umgebungsvariablen.
 *
 * `null` heißt „keine Auswahl getroffen" und damit: alle Sprachen. Eine leere
 * oder nur aus Kommas bestehende Angabe wird genauso behandelt — wer
 * `CLOCKWORK_LANGS=` setzt, hat nichts gewählt, und ein Bündel mit null
 * Sprachen wäre keine sinnvolle Auslegung davon.
 */
export function requestedLocales(raw: string | undefined): readonly string[] | null {
  if (raw === undefined) {
    return null;
  }
  const wanted = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');

  return wanted.length === 0 ? null : wanted;
}

/**
 * Liest aus dem Quelltext des Katalogs, welche Sprachen darin stehen und wo.
 *
 * Der Katalog ist die Quelle der Wahrheit — nicht die Registry und nicht das
 * Verzeichnis `locales/`. Wer eine Sprache anlegt, aber nicht einträgt, hat sie
 * auch nicht im Bündel; genau das soll hier abgebildet werden.
 */
export function readCatalogue(source: string): readonly CatalogueEntry[] {
  const lines = source.split('\n');

  // 1. Import-Zeilen einsammeln: Bezeichner → Sprachcode.
  const imports = new Map<string, { readonly code: string; readonly line: number }>();
  lines.forEach((line, index) => {
    const found = IMPORT_LINE.exec(line);
    const binding = found?.[1];
    const code = found?.[2];
    if (binding !== undefined && code !== undefined) {
      imports.set(binding, { code, line: index });
    }
  });

  // 2. Den Objektblock abstecken.
  const open = lines.findIndex((line) => OBJECT_OPEN.test(line));
  if (open === -1) {
    throw new Error(`${WHERE}: »export const CATALOGUE … {« steht nicht mehr in catalogue.ts.`);
  }
  const close = lines.findIndex((line, index) => index > open && OBJECT_CLOSE.test(line));
  if (close === -1) {
    throw new Error(`${WHERE}: Zum Katalog-Objekt fehlt die schließende Klammer.`);
  }

  // 3. Die Einträge dazwischen.
  const entries: CatalogueEntry[] = [];
  for (let index = open + 1; index < close; index += 1) {
    const line = lines[index] ?? '';
    if (line.trim() === '' || COMMENT_LINE.test(line)) {
      continue;
    }

    const quoted = ENTRY_QUOTED.exec(line);
    const shorthand = ENTRY_SHORTHAND.exec(line);
    const binding = quoted?.[2] ?? shorthand?.[1];
    if (binding === undefined) {
      throw new Error(
        `${WHERE}: Zeile ${index + 1} von catalogue.ts ist kein Eintrag, den ich lesen kann: »${line.trim()}«`,
      );
    }

    const imported = imports.get(binding);
    if (imported === undefined) {
      throw new Error(
        `${WHERE}: »${binding}« steht im Katalog, wird aber nicht aus ./locales/ importiert.`,
      );
    }

    // Der Schlüssel im Objekt ist der Sprachcode zur Laufzeit, der Dateiname
    // der Sprachcode auf der Platte. Gehen sie auseinander, lädt die App eine
    // andere Sprache, als sie anzeigt — hier ist die einzige Stelle, an der das
    // überhaupt auffallen kann.
    //
    // Bei der Kurzform `de,` ist der Schlüssel der Bezeichner selbst; genau
    // deshalb wird er hier verglichen und nicht einfach übernommen.
    const code = quoted?.[1] ?? binding;
    if (code !== imported.code) {
      throw new Error(
        `${WHERE}: Der Eintrag »${code}« zeigt auf ./locales/${imported.code}. Schlüssel und Dateiname müssen gleich sein.`,
      );
    }

    entries.push({ code, binding, importLine: imported.line, entryLine: index });
  }

  if (entries.length === 0) {
    throw new Error(`${WHERE}: Im Katalog steht keine einzige Sprache.`);
  }

  return entries;
}

/**
 * Nimmt den Quelltext des Katalogs und die Wunschliste, gibt den verkürzten
 * Quelltext zurück.
 *
 * Ein unbekannter Sprachcode ist ein Abbruch mit Liste, kein stilles
 * Übergehen: Wer sich bei `pt-BR` vertippt, soll das beim Bauen erfahren und
 * nicht dann, wenn die App in der falschen Sprache dasteht.
 */
export function subsetCatalogue(source: string, requested: readonly string[]): SubsetResult {
  const entries = readCatalogue(source);
  const known = new Map(entries.map((entry) => [entry.code.toLowerCase(), entry.code]));

  if (!known.has(BASE_CODE)) {
    throw new Error(`${WHERE}: Die Basissprache »${BASE_CODE}« fehlt im Katalog.`);
  }

  // Die Basissprache kommt immer mit — auch ungefragt.
  const keep = new Set<string>([BASE_CODE]);
  for (const wanted of requested) {
    const found = known.get(wanted.trim().toLowerCase());
    if (found === undefined) {
      throw new Error(
        `${ENV_KEY}: »${wanted}« ist keine Sprache dieses Projekts.\n` +
          `Zur Wahl stehen: ${entries.map((entry) => entry.code).join(', ')}`,
      );
    }
    keep.add(found);
  }

  const lines = source.split('\n');
  const kept: string[] = [];
  const dropped: string[] = [];

  for (const entry of entries) {
    if (keep.has(entry.code)) {
      kept.push(entry.code);
      continue;
    }
    dropped.push(entry.code);
    lines[entry.importLine] = '';
    lines[entry.entryLine] = '';
  }

  const code = lines.join('\n');

  // Gegenprobe mit demselben Leser: Griffe eines der Muster daneben, stünden
  // hier noch Sprachen, die längst weg sein sollten.
  const left = readCatalogue(code).map((entry) => entry.code);
  if (left.join(',') !== kept.join(',')) {
    throw new Error(
      `${WHERE}: Die Auswahl hat nicht gegriffen — übrig sind »${left.join(', ')}«, erwartet waren »${kept.join(', ')}«.`,
    );
  }

  return { code, kept, dropped };
}

/* ── Die native-only-Schlüssel aus dem Web-Bündel nehmen ───────────────────── */

/** Beginn eines Eintrags mit `native.`-Präfix. */
const NATIVE_ENTRY = /^\s*'(native\.[\w.-]+)'\s*:/;

/** Für die Gegenprobe: irgendein `native.`-Eintrag, der übrig blieb. */
const NATIVE_ANY = /'native\.[\w.-]+'\s*:/;

export interface NativeStripResult {
  /** Der veränderte Quelltext. */
  readonly code: string;
  /** Die Schlüssel, die herausgenommen wurden — in Reihenfolge der Datei. */
  readonly removed: readonly string[];
}

interface ScanState {
  /** Das öffnende Anführungszeichen, solange eine Zeichenkette läuft. */
  readonly quote: string | null;
  /** Klammertiefe außerhalb von Zeichenketten. */
  readonly depth: number;
}

/**
 * Liest eine Zeile zeichenweise und sagt, ob der Eintrag hier endet.
 *
 * Zeichenweise und nicht per Muster, weil ein Eintrag über mehrere Zeilen
 * gehen darf: Prettier bricht lange Sätze um (gemessen: 23 der 37
 * Sprachdateien), und ein Mehrzahl-Eintrag ist ohnehin ein Objekt. Ein
 * `{`, `}` oder `,` INNERHALB des Textes darf dabei nicht mitzählen — sonst
 * endete der Eintrag mitten im Satz und die halbe Datei bliebe stehen.
 */
function scanLine(
  line: string,
  state: ScanState,
): { readonly state: ScanState; readonly ends: boolean } {
  let quote = state.quote;
  let depth = state.depth;
  /** Das letzte Zeichen, das kein Leerraum war — außerhalb von Zeichenketten. */
  let last = '';

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] ?? '';

    if (quote !== null) {
      // Ein maskiertes Zeichen kann die Zeichenkette nicht beenden.
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === quote) {
        quote = null;
        last = char;
      }
      continue;
    }

    // Ein Zeilenkommentar beendet die Zeile für unsere Zwecke.
    if (char === '/' && line[index + 1] === '/') {
      break;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      last = char;
      continue;
    }
    if (char === '{' || char === '[') {
      depth += 1;
    } else if (char === '}' || char === ']') {
      depth -= 1;
    }
    if (!/\s/.test(char)) {
      last = char;
    }
  }

  return { state: { quote, depth }, ends: quote === null && depth === 0 && last === ',' };
}

/**
 * Nimmt jeden `native.`-Eintrag aus einer Sprachdatei.
 *
 * Wie bei der Sprachauswahl werden die Zeilen GELEERT und nicht gelöscht: Die
 * Zeilennummern bleiben stehen, und eine Fehlermeldung aus diesem Modul zeigt
 * weiter auf die richtige Stelle.
 */
export function stripNativeKeys(source: string): NativeStripResult {
  const lines = source.split('\n');
  const removed: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const key = NATIVE_ENTRY.exec(lines[index] ?? '')?.[1];
    if (key === undefined) {
      continue;
    }

    let state: ScanState = { quote: null, depth: 0 };
    let end = index;
    let closed = false;
    for (; end < lines.length; end += 1) {
      const step = scanLine(lines[end] ?? '', state);
      state = step.state;
      if (step.ends) {
        closed = true;
        break;
      }
    }
    if (!closed) {
      throw new Error(`${WHERE}: Der Eintrag »${key}« hat kein erkennbares Ende.`);
    }

    for (let line = index; line <= end; line += 1) {
      lines[line] = '';
    }
    removed.push(key);
    index = end;
  }

  const code = lines.join('\n');

  // Gegenprobe: Greift das Muster eines Tages daneben, bliebe ein Schlüssel
  // stehen — und das Web trüge einen Satz mit sich, der dort falsch ist.
  if (NATIVE_ANY.test(code)) {
    throw new Error(`${WHERE}: Nach dem Entfernen steht noch ein »${NATIVE_PREFIX}«-Schlüssel da.`);
  }

  return { code, removed };
}

/**
 * Das Vite-Bauteil dazu — es läuft immer, nicht nur bei einer Sprachauswahl.
 *
 * Am Ende des Baus vergleicht es, was die einzelnen Sprachdateien geliefert
 * haben. Der Compiler garantiert über `satisfies Strings`, dass alle dieselben
 * Schlüssel tragen; kommen hier verschiedene Mengen heraus, hat nicht der
 * Katalog ein Loch, sondern dieses Bauteil hat in einer Datei danebengegriffen.
 */
export function stripNativeKeysPlugin(): Plugin {
  const seen = new Map<string, readonly string[]>();

  return {
    name: NATIVE_PLUGIN_NAME,

    // Nur beim Bauen — Dev-Server und Testlauf sehen den vollen Katalog, sonst
    // prüfte `catalogue.test.ts` die native-Schlüssel je nach Umgebung mal mit
    // und mal nicht. Dieselbe Begründung wie bei der Sprachauswahl.
    apply: 'build',

    // Vor Vites eigenem Durchlauf, aus demselben Grund wie oben: Danach ist der
    // Quelltext neu gesetzt und die zeilenweise Suche griffe ins Leere.
    enforce: 'pre',

    transform(code, id) {
      const path = id.replace(/\\/g, '/');
      if (!path.includes(LOCALES_PATH) || !path.endsWith('.ts')) {
        return null;
      }

      const result = stripNativeKeys(code);
      seen.set(path, result.removed);
      return { code: result.code, map: null };
    },

    buildEnd(error) {
      // Bricht der Bau ohnehin schon, ist diese Meldung nur Lärm über der
      // eigentlichen Ursache.
      if (error !== undefined) {
        return;
      }

      // Kein einziger Treffer heißt NICHT „alles in Ordnung", sondern: Das
      // Bauteil hat gar nicht gearbeitet — Pfadmuster daneben, Datei
      // umbenannt, `enforce` verstellt. Genau dieser Fall ist die Falle, die
      // dieses Projekt schon einmal teuer bezahlt hat: Eine Prüfung, deren
      // Vergleichsfeld leer bleibt, meldet Gleichheit. In jedem Bau dieser App
      // steht mindestens die Basissprache im Modulgraphen.
      if (seen.size === 0) {
        throw new Error(
          `${WHERE}: Keine einzige Sprachdatei gesehen — das Entfernen der ` +
            `»${NATIVE_PREFIX}«-Schlüssel hat nicht stattgefunden.`,
        );
      }

      const [first, ...rest] = [...seen.entries()];
      if (first === undefined) {
        return;
      }
      const expected = [...first[1]].sort().join(',');
      for (const [path, keys] of rest) {
        const found = [...keys].sort().join(',');
        if (found !== expected) {
          throw new Error(
            `${WHERE}: ${path} liefert »${found}«, ${first[0]} aber »${expected}«. ` +
              'Alle Sprachdateien tragen dieselben Schlüssel — hier hat das Entfernen danebengegriffen.',
          );
        }
      }
    },
  };
}

/**
 * Das Vite-Bauteil dazu.
 *
 * `requested === null` schaltet es still ab — dann bleibt der Katalog, wie er
 * ist. Das Bauteil hängt trotzdem in der Kette, damit es nur eine Stelle gibt,
 * an der über die Auswahl entschieden wird.
 */
export function subsetLocalePlugin(requested: readonly string[] | null): Plugin {
  let quiet = false;

  return {
    name: PLUGIN_NAME,

    // Nur beim Bauen. Im Dev-Server und vor allem im Testlauf bleibt der
    // Katalog vollständig — sonst prüfte `catalogue.test.ts` je nach Umgebung
    // mal 37 und mal 3 Sprachen, und eine Vollständigkeitsprüfung, die von
    // einer Umgebungsvariablen abhängt, prüft keine Vollständigkeit.
    apply: 'build',

    // Vor Vites eigenem esbuild-Durchlauf. Danach ist der Quelltext neu
    // gesetzt, und die zeilenweise Suche nach Import und Eintrag ginge ins
    // Leere — ohne dass es auffiele, denn übrig bliebe ein gültiges Bündel mit
    // allen 37 Sprachen.
    enforce: 'pre',

    configResolved(config) {
      quiet = config.logLevel === 'silent';
    },

    transform(code, id) {
      if (requested === null) {
        return null;
      }
      // Unter Windows kommen Rückstriche an; Vite normalisiert nicht überall.
      if (!id.replace(/\\/g, '/').endsWith(CATALOGUE_PATH)) {
        return null;
      }

      const result = subsetCatalogue(code, requested);
      if (!quiet) {
        const total = result.kept.length + result.dropped.length;
        console.log(
          `\n▸ Sprachauswahl: ${result.kept.join(', ')} — ${result.dropped.length} von ${total} Katalogen entfallen`,
        );
      }

      // `map: null`: Die abgewählten Zeilen werden geleert, nicht gelöscht.
      // Alle übrigen Zeilen stehen damit an ihrer alten Nummer, und eine eigene
      // Quellkarte wäre Zierrat.
      return { code: result.code, map: null };
    },
  };
}
