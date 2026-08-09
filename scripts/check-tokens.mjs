/**
 * Prüft, dass kein Bauteil eigene Werte setzt.
 *
 *   node scripts/check-tokens.mjs
 *
 * ── Warum das eine Prüfung braucht ─────────────────────────────────────────
 * Die erste Regel des Design-Systems steht seit V5 im Kopf von
 * styles/tokens.css: „KEIN Bauteil setzt je eine feste Farbe, einen festen
 * Abstand oder eine feste Schriftgröße." Bis V8 war das eine Absichtserklärung.
 *
 * Ein einzelner Verstoß tut nie weh. Er fällt auch nicht auf: `padding: 12px`
 * sieht genauso aus wie `padding: var(--sp-3)`, bis jemand die Skala ändert und
 * eine Stelle nicht mitkommt. Das ist genau die Sorte Fehler, die dieses Projekt
 * mit Skripten fängt statt mit Aufmerksamkeit — wie den toten Selektor in
 * shoot.mjs oder die wirkungslose Warnfarbe in panels.css.
 *
 * Geprüft wird der Quelltext, nicht das Ergebnis: Anders als beim Kontrast gibt
 * es hier nichts zu zeichnen. Ein Literal ist ein Literal.
 *
 * ── Was als Ausnahme gilt ──────────────────────────────────────────────────
 * Nicht jeder Zahlenwert ist ein Token-Verstoß. Drei Sorten sind keine:
 *
 *   • Formen statt Abstände — `border-radius: 50%` macht einen Kreis, und ein
 *     Kreis ist keine Rundung aus der Radien-Leiter.
 *   • Optische Korrekturen in `em` — sie hängen an der Schriftgröße ihres
 *     Bauteils und wären als globaler Abstand falsch.
 *   • Rücknahmen auf 0 — `border-radius: 0` nimmt etwas weg, statt einen Wert
 *     zu behaupten.
 *
 * Alles andere braucht einen Eintrag in ALLOWED mit einem Grund. Ein
 * Ausnahmenverzeichnis, in das man ohne Begründung schreiben kann, ist keine
 * Ausnahme, sondern eine Umgehung — dieselbe Regel gilt für
 * i18n/ui-literals.test.ts.
 */

import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import path from 'node:path';

/* Eigenschaften, deren Werte aus der Abstandsskala kommen müssen.
   Über den PRÄFIX geprüft und nicht über eine Liste von Namen: Der erste Anlauf
   führte nur die Kurzschreibweisen, und damit liefen `padding-inline`,
   `margin-block-start` und die vier `inset-*` ungeprüft durch — genau die
   Schreibweisen, die dieses Projekt überall benutzt, weil sie die Leserichtung
   mitnehmen. Eine Prüfung mit einem Loch in der Größe ihres Gegenstands. */
const SPACING_PREFIX = ['padding', 'margin', 'inset'];
const SPACING_EXACT = ['gap', 'row-gap', 'column-gap', 'top', 'right', 'bottom', 'left'];

const isSpacing = (property) =>
  SPACING_EXACT.includes(property) ||
  SPACING_PREFIX.some((prefix) => property === prefix || property.startsWith(prefix + '-'));

/* Eigenschaften, deren Werte aus der Motion-Skala kommen müssen.

   Neu in V11, und aus demselben Grund wie die drei Gruppen davor: Ein
   Bauteil, das seine eigene Dauer setzt, sieht genauso aus wie eines, das
   `var(--dur-calm)` benutzt — bis jemand den Takt ändert und eine Stelle
   stehen bleibt. Der V11-Pass hat genau so eine Stelle gefunden: Der
   Tresor-Winkel drehte in 150 ms, der Hinweis-Winkel INNERHALB desselben
   Aufklappers in 250. */
const MOTION = [
  'transition',
  'transition-duration',
  'transition-delay',
  'transition-timing-function',
  'animation',
  'animation-duration',
  'animation-delay',
  'animation-timing-function',
];

/* Eigenschaften, deren Werte aus der Palette kommen müssen. */
const COLOUR = [
  'color',
  'background',
  'background-color',
  'border-color',
  'border-top-color',
  'border-block-start-color',
  'border-block-end-color',
  'outline-color',
  'fill',
  'stroke',
];

/**
 * Ausnahmen. Schlüssel ist `datei:zeile` NICHT — das würde bei jeder
 * Verschiebung brechen. Stattdessen der genaue Deklarationstext, plus der Grund.
 */
const ALLOWED = new Map([
  [
    'padding: 0.05em 0.35em',
    'kbd: eine Tastenkappe im Fließtext waechst mit der Schrift um sie herum, nicht mit dem Raster.',
  ],
  [
    'margin-inline-start: 0.1em',
    'Das Einheitszeichen neben der Sekundenzahl: eine optische Korrektur an der Ziffernbreite.',
  ],
  [
    'margin-left: var(--track-mark)',
    'Wortmarke: der Ausgleich fuer die Sperrung des letzten Buchstabens, also derselbe Wert wie die Sperrung.',
  ],
  [
    'margin: -1px',
    'sr-only: Teil des Verfahrens, das ein Element fuer Augen entfernt und fuer Screenreader behaelt. Kein Abstand, ein Trick.',
  ],
  [
    'top: -0.1em',
    'Der Signal-Index auf dem O der Wortmarke sitzt an der Glyphe, nicht am Raster — deshalb em und nicht rem.',
  ],
  [
    'inset-block-start: calc(50% - 0.22em)',
    'Der Auswahl-Winkel wird an seiner EIGENEN Groesse zentriert (0,42em), 0,22em ist die Haelfte davon.',
  ],
  [
    'inset-block-start: 2px',
    'Der Switch-Daumen sitzt 2 px in seiner Bahn — die Geometrie der Referenz (Bahn 20, Daumen 16, Rand 2). Bauteilmass, kein Rasterabstand.',
  ],
  ['inset-inline-start: 2px', 'Wie oben: der Daumenrand der Referenzgeometrie.'],
  [
    'transition: background-color 9999s ease-in-out 0s',
    'Autofill-Entschaerfung am Passphrasenfeld (Griff der Referenz): Die Zahl ist keine Dauer, sondern ein NIE — sie soll den Anstrich des Browsers gar nicht erst durchblitzen lassen.',
  ],
  [
    'animation-duration: 0.001ms !important',
    'Der reduced-motion-Rundumschlag. Kein Takt, sondern seine Abschaffung — 0 waere hier ein anderer Fall (manche Engines feuern dann kein animationend).',
  ],
  [
    'transition-duration: 0.001ms !important',
    'Wie oben: die Rücknahme aller Uebergaenge, nicht die Dauer eines Bauteils.',
  ],
]);

/** Prüft eine Deklaration und gibt einen Befund zurück, oder null. */
function inspect(property, value, declaration) {
  if (ALLOWED.has(declaration)) return null;

  const bare = value.replace(/var\([^()]*(\([^()]*\))?[^()]*\)/g, '').replace(/env\([^)]*\)/g, '');

  if (isSpacing(property)) {
    // Was nach dem Entfernen aller Tokens noch eine Länge ist, ist ein Literal.
    if (/-?[0-9.]+\s*(px|rem|em|ch|ex|vw|vh|vmin|vmax)/.test(bare)) {
      return `Abstand mit festem Wert: ${declaration}`;
    }
    return null;
  }

  if (COLOUR.includes(property)) {
    if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklab\(|\boklch\(/.test(bare)) {
      return `Farbe mit festem Wert: ${declaration}`;
    }
    return null;
  }

  if (property === 'border-radius') {
    // 50 % ist ein Kreis, 0 eine Rücknahme — beides keine Rundung aus der Leiter.
    if (/-?[0-9.]+\s*(px|rem|em)/.test(bare)) {
      return `Radius mit festem Wert: ${declaration}`;
    }
    return null;
  }

  if (MOTION.includes(property)) {
    /* `0s` ist eine Rücknahme wie `border-radius: 0` und keine Dauer: Es sagt
       „sofort", nicht „so lange". Alles andere mit einer Zeiteinheit ist ein
       Literal. */
    const times = bare.match(/-?[0-9.]+\s*m?s\b/g) ?? [];
    const real = times.filter((time) => Number.parseFloat(time) !== 0);
    if (real.length > 0) {
      return `Dauer mit festem Wert: ${declaration}`;
    }
    /* Kurven: Die benannten Schlüsselwörter sind erlaubt, wo sie etwas
       BEDEUTEN — `linear` an einer Umdrehung, `steps()` an einem Zählwerk.
       Eine ausgeschriebene `cubic-bezier(…)` dagegen ist immer eine zweite
       Wahrheit neben --ease-spring und --ease-snap. */
    if (/cubic-bezier\(/.test(bare)) {
      return `Kurve mit festem Wert: ${declaration}`;
    }
    return null;
  }

  return null;
}

const files = globSync('src/**/*.css').filter((file) => !file.endsWith('tokens.css'));
if (files.length === 0) throw new Error('Keine Stylesheets gefunden');

const findings = [];
let checked = 0;

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let inComment = false;

  lines.forEach((line, index) => {
    // Kommentare überspringen. Grob, aber ausreichend: In dieser Mappe steht
    // kein `/*` innerhalb einer Deklaration.
    if (inComment) {
      if (line.includes('*/')) inComment = false;
      return;
    }
    if (line.trimStart().startsWith('/*')) {
      if (!line.includes('*/')) inComment = true;
      return;
    }

    const match = /^\s*([a-z-]+)\s*:\s*([^;]+);/.exec(line);
    if (match === null) return;

    const [, property, value] = match;
    const declaration = `${property}: ${value.trim()}`;
    checked++;

    const finding = inspect(property, value, declaration);
    if (finding !== null) {
      findings.push(`${path.relative(process.cwd(), file)}:${index + 1}  ${finding}`);
    }
  });
}

/* ── Die Browserleiste ──────────────────────────────────────────────────────
   Zwei Farbwerte stehen zwangsläufig ausserhalb der Token-Datei: Ein
   <meta name="theme-color"> ist HTML und kann kein var() lesen. Damit sind sie
   die einzige Stelle im Projekt, an der eine Palettenfarbe abgeschrieben werden
   MUSS — und abgeschriebene Werte wandern nicht mit.

   Genau das ist passiert: Die Werte wurden in V5 gesetzt, V8 hat die
   Flaechenleiter umgebaut, und drei Versionen lang zeigte die Leiste auf dem
   Handy einen Ton, den es auf der Seite nicht mehr gab. Aufgefallen ist es
   niemandem, weil man die Leiste nur auf einem echten Geraet sieht und dort
   nichts danebenliegt, womit man sie vergleichen koennte.

   Seit V9 wird gegen --ground verglichen: Den Gehaeuseton --case gibt es
   nicht mehr, `body` traegt in jedem Layout den Seitengrund — die Leiste
   grenzt also an genau diese Flaeche. */
const html = readFileSync('index.html', 'utf8');
const tokens = readFileSync('src/styles/tokens.css', 'utf8');

const caseTones = [...tokens.matchAll(/^\s*--ground:\s*(#[0-9a-fA-F]{3,8})\s*;/gm)].map(
  (m) => m[1],
);
const metaTones = new Map(
  [
    ...html.matchAll(
      /<meta\s+name="theme-color"\s+content="(#[0-9a-fA-F]{3,8})"\s+media="\(prefers-color-scheme:\s*(light|dark)\)"/g,
    ),
  ].map((m) => [m[2], m[1]]),
);

/* Ohne diese beiden Zeilen wuerde eine umbenannte Variable oder ein
   umgeschriebenes Meta-Tag als „bestanden" durchlaufen — die Suche faende dann
   einfach nichts. Ein `?.`, das einen Tippfehler verschluckt, ist in einem
   Pruefskript schlimmer als gar keine Pruefung. */
if (caseTones.length !== 2) {
  findings.push(
    `tokens.css  --ground nicht zweimal gefunden (hell/dunkel), sondern ${caseTones.length}x`,
  );
}
if (metaTones.size !== 2) {
  findings.push(
    `index.html  theme-color nicht zweimal gefunden (hell/dunkel), sondern ${metaTones.size}x`,
  );
}

if (caseTones.length === 2 && metaTones.size === 2) {
  const pairs = [
    ['light', caseTones[0]],
    ['dark', caseTones[1]],
  ];
  for (const [scheme, tone] of pairs) {
    const meta = metaTones.get(scheme);
    if (meta.toLowerCase() !== tone.toLowerCase()) {
      findings.push(
        `index.html  theme-color (${scheme}) ist ${meta}, --ground ist ${tone} — die Browserleiste passt nicht zum Seitengrund`,
      );
    }
  }
}

console.log(`Geprueft: ${checked} Deklarationen in ${files.length} Stylesheets.`);
console.log(`Ausnahmen mit Begruendung: ${ALLOWED.size}.`);
console.log(`theme-color gegen --ground: ${caseTones.join(' / ')}.`);

if (findings.length > 0) {
  console.error('\nBefunde:');
  for (const finding of findings) console.error('  ✗ ' + finding);
  console.error(
    '\nJeder Wert kommt aus styles/tokens.css. Wenn ein Bauteil wirklich einen' +
      '\neigenen braucht, gehoert er mit Grund in die ALLOWED-Tabelle dieses Skripts.',
  );
  process.exitCode = 1;
} else {
  console.log('\n✓ Kein Bauteil setzt eigene Abstaende, Farben, Radien, Dauern oder Kurven.');
}
