/**
 * Dauerpruefung: Stimmt das Compose-Theme der nativen App noch mit
 * `src/styles/tokens.css` ueberein?
 *
 * ── Warum es diese Pruefung gibt ───────────────────────────────────────────
 * Das Design der nativen App ist nicht „an die Web-Fassung angelehnt", es IST
 * ihres: dasselbe HeroUI-3.2.4-Theme, dieselben Zahlen. Quelle der Wahrheit
 * bleibt `tokens.css` — dort steht seit V9 jede Farbe, jeder Abstand, jede
 * Dauer, und dort werden sie auch weiter geaendert.
 *
 * Nur kann Compose kein CSS lesen. Die Werte stehen deshalb ein zweites Mal in
 * `ui/theme/Tokens.kt`, und zwei handgepflegte Kopien derselben Zahl laufen
 * unweigerlich auseinander — genau wie die beiden `theme-color`-Meta-Tags im
 * Web, die drei Versionen lang veraltet waren, bis `check-tokens.mjs` sie
 * gegen `--case` gehalten hat. Dieses Skript ist das Gegenstueck dazu.
 *
 * ── Der schwierige Teil: color-mix(in oklab, …) ───────────────────────────
 * Seit V9 entstehen die abgeleiteten Toene als oklab-Mischung. Ein Browser
 * rechnet sie beim Zeichnen aus; Compose kann das nicht, dort muessen
 * konstante sRGB-Werte stehen. Dieses Skript rechnet die Mischung deshalb
 * SELBST — mit den Ottosson-Matrizen, die auch `check-contrast.mjs` benutzt,
 * nur zusaetzlich in der Gegenrichtung (sRGB → oklab), die es dort nicht
 * braucht.
 *
 * Mitgerechnet werden die drei Feinheiten, an denen eine naive Umsetzung
 * scheitert:
 *   - Prozente, die sich nicht zu 100 addieren (dunkles `--signal-soft-ink`
 *     steht auf 80/30 — CSS skaliert das auf 100 herunter),
 *   - eine ausgelassene zweite Prozentangabe (`--signal-hover` nennt nur 90),
 *   - `transparent` als Mischpartner: Die Interpolation laeuft ueber
 *     VORMULTIPLIZIERTE Werte, weshalb dabei die Ausgangsfarbe mit
 *     reduzierter Deckkraft herauskommt und nicht etwa ein Grauwert.
 *
 * ── Aufruf ────────────────────────────────────────────────────────────────
 *   node scripts/native-theme-check.mjs           prueft
 *   node scripts/native-theme-check.mjs --print   nur rechnen und ausgeben
 *                                                 (fuer den ersten Eintrag in
 *                                                  Tokens.kt)
 */

import { readFile } from 'node:fs/promises';

const CSS_PATH = 'src/styles/tokens.css';
const KOTLIN_PATH =
  'android-native/app/src/main/kotlin/io/github/keco216/clockwork/ui/theme/Tokens.kt';

/* ── Farbraum ───────────────────────────────────────────────────────────── */

/** sRGB-Kanal (0…1) linearisieren. */
function toLinear(value) {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** Linearen Kanal zurueck in sRGB (0…1). */
function toGamma(value) {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}

/** sRGB 0…255 → oklab. Die Gegenrichtung zu check-contrast.mjs. */
function rgbToOklab([r, g, b]) {
  const lr = toLinear(r / 255);
  const lg = toLinear(g / 255);
  const lb = toLinear(b / 255);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** oklab → sRGB 0…255. Zeichengleich mit check-contrast.mjs. */
function oklabToRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((x) => Math.max(0, Math.min(255, Math.round(toGamma(x) * 255))));
}

/* ── Farbwerte lesen ────────────────────────────────────────────────────── */

/** Eine Farbe als { rgb: [r,g,b], a: 0…1 }. */
function parseColour(text) {
  const value = text.trim();

  if (value === 'transparent') {
    return { rgb: [0, 0, 0], a: 0 };
  }

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value);
  if (hex) {
    const digits = hex[1];
    if (digits.length === 3) {
      return {
        rgb: [...digits].map((d) => parseInt(d + d, 16)),
        a: 1,
      };
    }
    const rgb = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
    const a = digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1;
    return { rgb, a };
  }

  // Ein Format, das dieses Skript nicht kennt, ist ein Befund und kein Grund
  // fuer eine stille Ersatzfarbe — dieselbe Lehre wie beim oklab-Parser in
  // check-contrast.mjs, der Zahlen aus einem unbekannten Format las und sie
  // fuer RGB hielt.
  throw new Error(`Farbe nicht lesbar: ${value}`);
}

/**
 * Mischt zwei Farben in oklab — die Regeln aus CSS Color 5.
 *
 * Vormultipliziert wird ausdruecklich: Mischt man mit `transparent`, kommt
 * sonst ein Farbstich heraus. Mit Vormultiplikation ergibt „X 15 %,
 * transparent" genau X mit 15 % Deckkraft, und das ist auch das, was der
 * Browser zeichnet.
 */
function mixOklab(first, firstPercent, second, secondPercent) {
  let p1 = firstPercent;
  let p2 = secondPercent;

  if (p1 === null && p2 === null) {
    p1 = 50;
    p2 = 50;
  } else if (p1 === null) {
    p1 = 100 - p2;
  } else if (p2 === null) {
    p2 = 100 - p1;
  }

  const sum = p1 + p2;
  let alphaMultiplier = 1;
  if (sum > 100) {
    // Ueber 100 wird proportional heruntergerechnet. Genau dieser Fall steht
    // im dunklen `--signal-soft-ink` (80 % + 30 %).
    p1 = (p1 / sum) * 100;
    p2 = (p2 / sum) * 100;
  } else if (sum < 100) {
    // Unter 100 wird der Rest zu Durchsichtigkeit.
    alphaMultiplier = sum / 100;
    p1 = (p1 / sum) * 100;
    p2 = (p2 / sum) * 100;
  }

  const w1 = p1 / 100;
  const w2 = p2 / 100;

  const lab1 = rgbToOklab(first.rgb);
  const lab2 = rgbToOklab(second.rgb);

  const alpha = first.a * w1 + second.a * w2;
  const mixed = [0, 1, 2].map((i) => {
    const premultiplied = lab1[i] * first.a * w1 + lab2[i] * second.a * w2;
    return alpha === 0 ? 0 : premultiplied / alpha;
  });

  return { rgb: oklabToRgb(mixed), a: alpha * alphaMultiplier };
}

/* ── tokens.css lesen ───────────────────────────────────────────────────── */

/** Zieht die Deklarationen aus einem `{ … }`-Block ab einer Position. */
function readBlock(css, startIndex) {
  const open = css.indexOf('{', startIndex);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = css.slice(open + 1, end);

  const declarations = new Map();
  // Kommentare raus, sonst verschluckt eine Regel in einem Kommentar die
  // echte darunter.
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const line of clean.split(';')) {
    const match = /^\s*(--[\w-]+)\s*:\s*([\s\S]+)$/.exec(line);
    if (match) declarations.set(match[1], match[2].trim());
  }
  return declarations;
}

function loadTokens(css) {
  const light = readBlock(css, css.indexOf(':root'));

  const darkIndex = css.indexOf('@media (prefers-color-scheme: dark)');
  if (darkIndex === -1) throw new Error('Kein Dunkel-Block in tokens.css gefunden');
  const darkRootIndex = css.indexOf(':root', darkIndex);
  const darkOverrides = readBlock(css, darkRootIndex);

  const dark = new Map(light);
  for (const [name, value] of darkOverrides) dark.set(name, value);

  return { light, dark };
}

/* ── Werte aufloesen ────────────────────────────────────────────────────── */

/** Loest `var(--x)` rekursiv auf. */
function resolveVars(value, tokens, seen = new Set()) {
  return value.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_, name) => {
    if (seen.has(name)) throw new Error(`Ringschluss bei ${name}`);
    const inner = tokens.get(name);
    if (inner === undefined) throw new Error(`Unbekanntes Token: ${name}`);
    return resolveVars(inner, tokens, new Set([...seen, name]));
  });
}

/** Zerlegt die Argumente eines color-mix auf oberster Klammerebene. */
function splitArguments(text) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of text) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts;
}

/** Ein Mischpartner: „<farbe> [<prozent>%]" in beliebiger Reihenfolge. */
function parseMixOperand(text) {
  const percent = /(-?[\d.]+)%/.exec(text);
  const colour = text.replace(/(-?[\d.]+)%/, '').trim();
  return {
    colour: parseColour(colour),
    percent: percent ? Number(percent[1]) : null,
  };
}

/** Loest eine Farbangabe auf — hex, transparent oder color-mix. */
function resolveColour(rawValue, tokens) {
  const value = resolveVars(rawValue, tokens).trim();

  if (!value.startsWith('color-mix(')) {
    return parseColour(value);
  }

  const inner = value.slice('color-mix('.length, value.lastIndexOf(')'));
  const args = splitArguments(inner);
  if (args[0].trim() !== 'in oklab') {
    throw new Error(`Nur oklab-Mischungen werden unterstuetzt, gefunden: ${args[0]}`);
  }
  const first = parseMixOperand(args[1]);
  const second = parseMixOperand(args[2]);
  return mixOklab(first.colour, first.percent, second.colour, second.percent);
}

/** Loest eine Laengenangabe in px auf (rem × 16). */
function resolveLength(rawValue, tokens) {
  const value = resolveVars(rawValue, tokens).trim();

  const calc = /^calc\(([\s\S]+)\)$/.exec(value);
  if (calc) {
    // Nur Summen — mehr steht in tokens.css nicht, und mehr soll hier auch
    // nicht stillschweigend durchgehen.
    return calc[1]
      .split('+')
      .map((part) => resolveLength(part.trim(), tokens))
      .reduce((a, b) => a + b, 0);
  }

  const rem = /^(-?[\d.]+)rem$/.exec(value);
  if (rem) return Number(rem[1]) * 16;
  const px = /^(-?[\d.]+)px$/.exec(value);
  if (px) return Number(px[1]);
  const ms = /^(-?[\d.]+)ms$/.exec(value);
  if (ms) return Number(ms[1]);
  const plain = /^(-?[\d.]+)$/.exec(value);
  if (plain) return Number(plain[1]);

  throw new Error(`Laenge nicht lesbar: ${value}`);
}

/* ── Was verglichen wird ────────────────────────────────────────────────── */

/**
 * Die Liste ist ausdruecklich von Hand gepflegt und nicht „alles, was in
 * tokens.css steht": Ein Teil der Tokens beschreibt Dinge, die es nativ nicht
 * gibt (Schriftstapel, Scrollbalken-Breite, die Shell-Masse der
 * Desktop-Ansicht). Was hier steht, MUSS uebereinstimmen; was fehlt, fehlt
 * mit Absicht.
 */
const COLOURS = [
  'ground',
  'surface',
  'surface-fill',
  'surface-active',
  'fill-active',
  'fill-soft',
  'surface-inverted',
  'ink',
  'ink-2',
  'ink-3',
  'ink-on-inverted',
  'rule',
  'rule-strong',
  'signal',
  'signal-ink',
  'signal-hover',
  'signal-text',
  'signal-soft',
  'signal-soft-ink',
  'fault',
  'fault-soft',
  'fault-soft-hover',
  'fault-soft-ink',
  'switch-thumb',
  'scrollbar-thumb',
];

/** Masse und Zeiten gelten in beiden Themes gleich. */
const LENGTHS = [
  'sp-1',
  'sp-2',
  'sp-3',
  'sp-4',
  'sp-5',
  'sp-6',
  'sp-7',
  'sp-8',
  'gap-pair',
  'gap-stack',
  'gap-group',
  'radius-panel',
  'radius-item',
  'radius-field',
  'radius-inset',
  'radius-key',
  'control-h',
  'control-h-lg',
  'control-h-sm',
  'touch-min',
  'chip-h',
  't-micro',
  't-small',
  't-body',
  't-lead',
  't-mark',
  't-dial-min',
  't-dial-max',
  'dial-size',
  'dur-flash',
  'dur-quick',
  'dur-snap',
  'dur-calm',
  'dur-glide',
  'dur-sheet',
  'dur-spin',
  'stagger-flap',
];

/** Verhaeltniszahlen des Zifferblatts — einheitenlos. */
const RATIOS = ['dial-tick-len', 'dial-hand-len', 'dial-tick-w', 'dial-hand-w', 'dial-hub'];

/* ── Tokens.kt lesen ────────────────────────────────────────────────────── */

/**
 * Der Vertrag zwischen beiden Dateien ist eine Kommentar-Marke:
 *
 *     val ground = Color(0xFFF5F5F5) // css: light --ground
 *     val radiusPanel = 24.dp        // css: --radius-panel
 *
 * Bewusst eine Marke und kein Namensraten: Ein Skript, das aus `radiusPanel`
 * auf `--radius-panel` schliesst, findet einen umbenannten Token nicht mehr
 * und meldet dann „alles gruen".
 */
function readKotlin(source) {
  const colours = new Map();
  const lengths = new Map();

  for (const line of source.split('\n')) {
    const colour =
      /Color\(0x([0-9A-Fa-f]{8})\)\s*,?\s*\/\/\s*css:\s*(light|dark)\s+--([\w-]+)/.exec(line);
    if (colour) {
      colours.set(`${colour[2]} --${colour[3]}`, colour[1].toUpperCase());
      continue;
    }

    const length = /=\s*(-?[\d.]+)(?:\.dp|\.sp|f|L)?\s*,?\s*\/\/\s*css:\s*--([\w-]+)/.exec(line);
    if (length) {
      lengths.set(`--${length[2]}`, Number(length[1]));
    }
  }

  return { colours, lengths };
}

/** Compose schreibt ARGB, CSS denkt in RGBA. */
function toArgb({ rgb, a }) {
  const alpha = Math.round(a * 255);
  return [alpha, ...rgb].map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

/* ── Lauf ───────────────────────────────────────────────────────────────── */

const css = await readFile(CSS_PATH, 'utf8');
const { light, dark } = loadTokens(css);

const expectedColours = new Map();
for (const name of COLOURS) {
  for (const [theme, tokens] of [
    ['light', light],
    ['dark', dark],
  ]) {
    const raw = tokens.get(`--${name}`);
    if (raw === undefined) throw new Error(`--${name} steht nicht in ${CSS_PATH}`);
    expectedColours.set(`${theme} --${name}`, toArgb(resolveColour(raw, tokens)));
  }
}

const expectedLengths = new Map();
for (const name of [...LENGTHS, ...RATIOS]) {
  const raw = light.get(`--${name}`);
  if (raw === undefined) throw new Error(`--${name} steht nicht in ${CSS_PATH}`);
  expectedLengths.set(`--${name}`, resolveLength(raw, light));
}

if (process.argv.includes('--print')) {
  process.stdout.write('Farben (ARGB, wie Compose sie schreibt):\n');
  for (const [key, value] of expectedColours) {
    process.stdout.write(`  ${key.padEnd(28)} 0x${value}\n`);
  }
  process.stdout.write('\nMasse und Zeiten:\n');
  for (const [key, value] of expectedLengths) {
    process.stdout.write(`  ${key.padEnd(20)} ${value}\n`);
  }
  process.exit(0);
}

const kotlin = await readFile(KOTLIN_PATH, 'utf8');
const actual = readKotlin(kotlin);

const findings = [];

for (const [key, expected] of expectedColours) {
  const found = actual.colours.get(key);
  if (found === undefined) {
    findings.push(`${key}: fehlt in Tokens.kt (Marke "// css: ${key}")`);
  } else if (found !== expected) {
    findings.push(`${key}: Tokens.kt hat 0x${found}, tokens.css ergibt 0x${expected}`);
  }
}

for (const [key, expected] of expectedLengths) {
  const found = actual.lengths.get(key);
  if (found === undefined) {
    findings.push(`${key}: fehlt in Tokens.kt (Marke "// css: ${key}")`);
  } else if (Math.abs(found - expected) > 1e-6) {
    findings.push(`${key}: Tokens.kt hat ${found}, tokens.css ergibt ${expected}`);
  }
}

const checked = expectedColours.size + expectedLengths.size;

if (findings.length > 0) {
  process.stderr.write(`native-theme-check: ${findings.length} Abweichung(en)\n\n`);
  for (const finding of findings) process.stderr.write(`  ${finding}\n`);
  process.stderr.write(
    `\nQuelle der Wahrheit ist ${CSS_PATH}. Werte neu ausrechnen mit:\n` +
      '  node scripts/native-theme-check.mjs --print\n',
  );
  process.exit(1);
}

process.stdout.write(
  `native-theme-check: ${checked} Werte geprueft ` +
    `(${expectedColours.size} Farben, ${expectedLengths.size} Masse) — ` +
    'Compose-Theme deckungsgleich mit tokens.css.\n',
);
