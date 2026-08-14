/**
 * Erzeugt das Launcher-Icon der nativen App — als adaptives Icon aus Vektoren.
 *
 * ── Warum Vektoren und nicht PNGs wie in der 1.x-Fassung ──────────────────
 * Der Wrap braucht PNGs, weil er aus einer Zeit stammt, in der die Icons in
 * fuenf Dichten danebenlagen. Ein adaptives Icon braucht das nicht: Es besteht
 * aus zwei Ebenen, die das System selbst maskiert und skaliert. Als
 * `VectorDrawable` ist jede Ebene eine Textdatei — aufloesungsfrei, ein paar
 * hundert Byte statt zwoelf PNGs, und ohne die Node-zlib-Falle, die den
 * F-Droid-Bau der 1.x-Fassung unreproduzierbar macht (CLAUDE.md, Fallen).
 *
 * ── Warum es trotzdem ein Skript ist ──────────────────────────────────────
 * Weil die Geometrie eine gemessene ist und keine gezeichnete. Sie steht in
 * `android-icons.mjs` und in `icons.mjs`, und sie soll an genau einer Stelle
 * stehen — 21 Hemmungszaehne im 12-Grad-Schritt, Werkbruecke r = 62 mit
 * 84-Grad-Maul, Lager r = 8,5 im Maul. Ein von Hand gemaltes SVG waere eine
 * vierte Wahrheit ueber dieselbe Marke.
 *
 * ── Die drei Ebenen ───────────────────────────────────────────────────────
 *   background   Nacht, flaechig
 *   foreground   das C-Werk in Papier, Lager in Signal-Orange
 *   monochrome   dieselbe Form in EINER Farbe (Themed Icons ab API 33) —
 *                dort faerbt das System selbst ein, ein zweiter Ton waere
 *                schlicht nicht darstellbar
 *
 * ── Aufruf ────────────────────────────────────────────────────────────────
 *   node scripts/native-icons.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const RES_DIR = 'android-native/app/src/main/res';

/* ── Geometrie, normiert auf Aussenradius 100 — dieselbe wie android-icons.mjs */
const TEETH_COUNT = 21;
const TEETH_STEP_DEG = 12;
const TEETH_START_DEG = 60;
const TEETH_INNER = 88 / 100;
const TEETH_OUTER = 100 / 100;
const TEETH_WIDTH = 4.6 / 100;

const BRIDGE_RADIUS = 62 / 100;
const BRIDGE_WIDTH = 30 / 100;
const BRIDGE_GAP_DEG = 42;

const BEARING_RADIUS = 8.5 / 100;

/* ── Farben ─────────────────────────────────────────────────────────────── */
const NIGHT = '#FF131210';
const PAPER = '#FFF5F3EF';
const SIGNAL = '#FFF05A28';
/** Der Monochrom-Layer traegt nur Deckung; die Farbe setzt das System. */
const MONO = '#FF000000';

/**
 * Die zwei Tinten des Start-Zeichens (N15).
 *
 * Das Launcher-Icon steht auf SEINER eigenen Flaeche (Nacht) und ist deshalb in
 * Papier gezeichnet. Der Splash steht auf dem SEITENGRUND der App — hell
 * #f5f5f5, dunkel #060607 —, und dort waere Papier im Hellen unsichtbar. Es
 * traegt deshalb `--ink` des jeweiligen Themes, und die Umschaltung macht der
 * Ressourcen-Qualifier `-night`: dieselbe Mechanik wie `values-night/themes.xml`
 * und dieselbe wie `prefers-color-scheme` im Web.
 *
 * Die zwei Werte stehen hier als Zahl, weil dieses Skript ohnehin die
 * Markenfarben als Zahl haelt. Sie sind die von `--ink` aus tokens.css und
 * stimmen mit Tokens.kt ueberein — nachpruefbar, weil sie in drei Dateien
 * denselben Namen tragen.
 */
const INK_LIGHT = '#FF18181B'; // css: light --ink
const INK_DARK = '#FFFCFCFC'; // css: dark --ink

/**
 * Die Leinwand des adaptiven Icons ist 108 dp; sichtbar bleibt nur der innere
 * Bereich, weil jeder Launcher seine eigene Maske darueberlegt. Die Marke sitzt
 * deshalb in 60 % des Halbmessers — dieselbe Schutzzone wie in der
 * 1.x-Fassung, und mit 64,8 dp Durchmesser sicher innerhalb der 72 dp, die
 * Google als garantiert sichtbar nennt.
 */
const CANVAS = 108;
const SAFE_ZONE = 0.6;

const CENTRE = CANVAS / 2;
const SCALE = (CANVAS / 2) * SAFE_ZONE;

const round = (n) => Number(n.toFixed(3));
const rad = (deg) => (deg * Math.PI) / 180;
const at = (angle, radius) => [
  round(CENTRE + radius * Math.cos(rad(angle))),
  round(CENTRE + radius * Math.sin(rad(angle))),
];

/** Ein Hemmungszahn: ein Balken vom Innen- zum Aussenradius, quer gedickt. */
function toothPath(angle) {
  const inner = TEETH_INNER * SCALE;
  const outer = TEETH_OUTER * SCALE;
  const half = (TEETH_WIDTH * SCALE) / 2;
  const ux = Math.cos(rad(angle));
  const uy = Math.sin(rad(angle));
  // Quer zur Achse — dieselbe Zerlegung wie der Punkt-in-Form-Test von
  // android-icons.mjs, nur andersherum gelesen.
  const vx = -uy;
  const vy = ux;

  const corner = (along, across) =>
    `${round(CENTRE + ux * along + vx * across)},${round(CENTRE + uy * along + vy * across)}`;

  return (
    `M${corner(inner, -half)}L${corner(outer, -half)}` +
    `L${corner(outer, half)}L${corner(inner, half)}Z`
  );
}

/**
 * Die Werkbruecke: ein Ring mit Maul.
 *
 * Das Maul liegt um 0 Grad (rechts), also genau dort, wo das Lager sitzt —
 * das ist die Form des C. Der Ring laeuft deshalb von +42 nach +318 Grad,
 * 276 Grad weit; darum steht die Grossbogen-Flagge auf 1.
 */
function bridgePath() {
  const outer = (BRIDGE_RADIUS + BRIDGE_WIDTH / 2) * SCALE;
  const inner = (BRIDGE_RADIUS - BRIDGE_WIDTH / 2) * SCALE;
  const from = BRIDGE_GAP_DEG;
  const to = 360 - BRIDGE_GAP_DEG;

  const [ox0, oy0] = at(from, outer);
  const [ox1, oy1] = at(to, outer);
  const [ix1, iy1] = at(to, inner);
  const [ix0, iy0] = at(from, inner);

  return (
    `M${ox0},${oy0}A${round(outer)},${round(outer)} 0 1 1 ${ox1},${oy1}` +
    `L${ix1},${iy1}A${round(inner)},${round(inner)} 0 1 0 ${ix0},${iy0}Z`
  );
}

/** Das Lager im Maul — der einzige Signalpunkt der Marke. */
function bearingPath() {
  const cx = CENTRE + BRIDGE_RADIUS * SCALE;
  const cy = CENTRE;
  const r = BEARING_RADIUS * SCALE;

  // Ein Kreis aus zwei Halbbogen: `A` kann keinen Vollkreis in einem Zug.
  return (
    `M${round(cx - r)},${round(cy)}` +
    `A${round(r)},${round(r)} 0 1 0 ${round(cx + r)},${round(cy)}` +
    `A${round(r)},${round(r)} 0 1 0 ${round(cx - r)},${round(cy)}Z`
  );
}

const werkPaths = [
  ...Array.from({ length: TEETH_COUNT }, (_, i) => toothPath(TEETH_START_DEG + i * TEETH_STEP_DEG)),
  bridgePath(),
];

function vector(body) {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!-- ERZEUGT von scripts/native-icons.mjs. Nicht von Hand aendern. -->',
    '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
    `    android:width="${CANVAS}dp"`,
    `    android:height="${CANVAS}dp"`,
    `    android:viewportWidth="${CANVAS}"`,
    `    android:viewportHeight="${CANVAS}">`,
    ...body,
    '</vector>',
    '',
  ].join('\n');
}

const path = (d, colour) => `    <path android:fillColor="${colour}" android:pathData="${d}" />`;

const foreground = vector([...werkPaths.map((d) => path(d, PAPER)), path(bearingPath(), SIGNAL)]);

const background = vector([path(`M0,0H${CANVAS}V${CANVAS}H0Z`, NIGHT)]);

// Themed Icons faerbt das System selbst ein — hier zaehlt nur die FORM. Das
// Lager gehoert deshalb mit hinein und nicht als zweiter Ton daneben.
const monochrome = vector([...werkPaths, bearingPath()].map((d) => path(d, MONO)));

const adaptive = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<!-- ERZEUGT von scripts/native-icons.mjs. Nicht von Hand aendern. -->',
  '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">',
  '    <background android:drawable="@drawable/ic_launcher_background" />',
  '    <foreground android:drawable="@drawable/ic_launcher_foreground" />',
  '    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />',
  '</adaptive-icon>',
  '',
].join('\n');

/**
 * Das Zeichen des Start-Bildschirms (N15).
 *
 * ── Warum dieselbe Datei-Geometrie wie das Launcher-Icon ──────────────────
 * Weil es dieselbe Marke ist. Der Splash zeigt genau das Zeichen, das man
 * gerade angetippt hat — das ist der ganze Zweck der Uebung: Der Start
 * schliesst die Luecke zwischen Icon und App, statt sie mit einem weissen
 * Fenster zu fuellen.
 *
 * Es liegt auf derselben 108er-Leinwand mit derselben Schutzzone. Die Plattform
 * skaliert das Zeichen in ihr eigenes Feld (240 dp Fenster, Zeichen im inneren
 * Drittel) und erwartet dabei genau die Proportion eines adaptiven
 * Icon-Vordergrunds — also die hier.
 *
 * Das Lager bleibt SIGNAL: Der einzige Farbpunkt der Marke ist auch beim Start
 * der einzige Farbpunkt.
 */
const splash = (ink) =>
  vector([...werkPaths.map((d) => path(d, ink)), path(bearingPath(), SIGNAL)]);

await mkdir(join(RES_DIR, 'drawable'), { recursive: true });
await mkdir(join(RES_DIR, 'drawable-night'), { recursive: true });
await mkdir(join(RES_DIR, 'mipmap-anydpi-v26'), { recursive: true });

await writeFile(join(RES_DIR, 'drawable', 'ic_launcher_foreground.xml'), foreground, 'utf8');
await writeFile(join(RES_DIR, 'drawable', 'ic_launcher_background.xml'), background, 'utf8');
await writeFile(join(RES_DIR, 'drawable', 'ic_launcher_monochrome.xml'), monochrome, 'utf8');
await writeFile(join(RES_DIR, 'mipmap-anydpi-v26', 'ic_launcher.xml'), adaptive, 'utf8');
// Runde Launcher bekommen dieselbe Datei: Die Maske macht ohnehin das System,
// und zwei Fassungen derselben Form waeren zwei Wahrheiten.
await writeFile(join(RES_DIR, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'), adaptive, 'utf8');

await writeFile(join(RES_DIR, 'drawable', 'splash_mark.xml'), splash(INK_LIGHT), 'utf8');
await writeFile(join(RES_DIR, 'drawable-night', 'splash_mark.xml'), splash(INK_DARK), 'utf8');

process.stdout.write(
  `native-icons: adaptives Icon und Start-Zeichen geschrieben.\n` +
    `  ${werkPaths.length} Pfade im Werk (${TEETH_COUNT} Zaehne + Bruecke) plus Lager\n` +
    `  Leinwand ${CANVAS} dp, Schutzzone ${SAFE_ZONE * 100} % = ` +
    `${round(SCALE * 2)} dp Durchmesser\n` +
    `  drawable/ic_launcher_{foreground,background,monochrome}.xml\n` +
    `  mipmap-anydpi-v26/ic_launcher{,_round}.xml\n` +
    `  drawable{,-night}/splash_mark.xml (Tinte ${INK_LIGHT} / ${INK_DARK})\n`,
);
