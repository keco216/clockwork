/**
 * Dauerpruefung: Bleibt die schwebende Navigationsleiste lesbar, wenn Inhalt
 * durch sie hindurchscheint? (N13)
 *
 * ── Warum es diese Pruefung gibt ───────────────────────────────────────────
 * Bis N12 war die Leiste DECKEND. Ihre Beschriftungen standen damit auf genau
 * einer bekannten Flaeche (`--surface`), und die Kontrastfrage war mit einem
 * einzigen Wert beantwortet — dem, den `check-contrast.mjs` im Web ohnehin
 * misst.
 *
 * Seit N13 ist sie TRANSLUZENT. Damit haengt der Untergrund der Beschriftung
 * davon ab, was gerade darunter durchscrollt: eine weisse Karte, eine
 * Code-Ziffer in `--ink`, ein oranger Zeiger. Der Kontrast ist keine Zahl mehr,
 * sondern eine SCHAR von Zahlen, und die Zusage kann nur lauten: Auch der
 * schlechteste Fall haelt 4,5:1.
 *
 * Genau diesen schlechtesten Fall rechnet dieses Skript aus — und zwar ueber
 * ALLE Inhaltsfarben, die unter der Leiste vorkommen koennen, statt ueber die
 * eine, die man fuer die schlimmste haelt. Der Auftrag nennt als schlechtesten
 * Fall „hellste Karte hell, dunkelste dunkel"; die Rechnung sagt das Gegenteil
 * (siehe WORST_CASE unten), und sie hat recht. Deshalb raet hier nichts.
 *
 * ── Was hier NICHT steht ──────────────────────────────────────────────────
 * Ein neues Token in `tokens.css`. Die Leiste gibt es im Web nicht, und ein
 * Token, das dort niemand liest, waere totes Gewicht in einem Buendel, dessen
 * Byte-Gleichheit dieses Projekt bei jedem Posten nachmisst. Der Frost ist
 * deshalb eine ABLEITUNG aus `--surface` — nach derselben Regel, mit der im
 * Web `--signal-soft` aus `--signal` entsteht:
 *
 *     color-mix(in oklab, var(--surface) 90%, transparent)
 *
 * Diese Mischung ergibt (vormultipliziert, wie CSS Color 5 es vorschreibt)
 * exakt `--surface` mit 90 % Deckkraft — nachzulesen in der Begruendung von
 * `mixOklab` in native-theme-check.mjs. In Compose ist das `surface.copy(alpha
 * = 0.90f)`, und beide zeichnen dasselbe: Gemalt wird in sRGB, nicht in oklab.
 * Die zwei Zahlen stehen deshalb in `BottomNav.kt` und werden von hier gelesen.
 *
 * ── Aufruf ────────────────────────────────────────────────────────────────
 *   node scripts/native-nav-contrast.mjs             prueft
 *   node scripts/native-nav-contrast.mjs --sweep     Deckkraft-Schwelle suchen
 *   node scripts/native-nav-contrast.mjs --gegenprobe  darf NICHT gruen sein
 */

import { readFile } from 'node:fs/promises';

const TOKENS_PATH =
  'android-native/app/src/main/kotlin/io/github/keco216/clockwork/ui/theme/Tokens.kt';
const NAV_PATH = 'android-native/app/src/main/kotlin/io/github/keco216/clockwork/ui/BottomNav.kt';

/** WCAG AA fuer Text. Die Beschriftung ist 12 sp — also nicht „gross". */
const TEXT_MIN = 4.5;

/** WCAG 1.4.11 fuer Grafik: die Zeichen sind 2 dp starke Striche. */
const GLYPH_MIN = 3.0;

/* ── Farbrechnung ───────────────────────────────────────────────────────── */

/** `0xAARRGGBB` → { r, g, b, a } mit a in 0…1. */
function fromArgb(hex) {
  const value = BigInt(`0x${hex}`);
  return {
    a: Number((value >> 24n) & 0xffn) / 255,
    r: Number((value >> 16n) & 0xffn),
    g: Number((value >> 8n) & 0xffn),
    b: Number(value & 0xffn),
  };
}

/**
 * Deckt `over` ueber `under` — in sRGB, ohne Umweg ueber einen linearen Raum.
 *
 * Das ist keine Bequemlichkeit, sondern die Nachbildung dessen, was Android
 * (und jeder Browser) beim Zeichnen tut: Der Compositor mischt die
 * Kanalwerte, wie sie im Puffer stehen. Wer hier linearisierte, bekaeme
 * hellere Mischungen als das Geraet und damit zu gute Werte.
 */
function over(under, layer) {
  const a = layer.a;
  return {
    a: 1,
    r: layer.r * a + under.r * (1 - a),
    g: layer.g * a + under.g * (1 - a),
    b: layer.b * a + under.b * (1 - a),
  };
}

/** WCAG-Leuchtdichte. Zeichengleich mit check-contrast.mjs. */
function luminance({ r, g, b }) {
  const channel = (value) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  const [high, low] = a > b ? [a, b] : [b, a];
  return (high + 0.05) / (low + 0.05);
}

function hex({ r, g, b }) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/* ── Die Werte aus dem Quelltext ────────────────────────────────────────── */

/**
 * Liest die Farben aus `Tokens.kt` ueber dieselbe `// css:`-Marke, an der auch
 * `native-theme-check.mjs` haengt.
 *
 * Bewusst dieselbe Quelle und keine eigene Farbtabelle: Zwei Listen derselben
 * Zahlen laufen auseinander, und diese hier faende den Unterschied nie —
 * sie rechnete einfach mit den alten Werten weiter und meldete gruen.
 */
function readColours(source) {
  const colours = { light: new Map(), dark: new Map() };
  for (const line of source.split('\n')) {
    const match = /Color\(0x([0-9A-Fa-f]{8})\)\s*,?\s*\/\/\s*css:\s*(light|dark)\s+--([\w-]+)/.exec(
      line,
    );
    if (match) colours[match[2]].set(match[3], fromArgb(match[1]));
  }
  return colours;
}

/** Liest die zwei Deckkraft-Werte aus `BottomNav.kt`. */
function readFrost(source) {
  const frost = {};
  for (const line of source.split('\n')) {
    const match = /=\s*([\d.]+)f\s*\/\/\s*nav-frost:\s*(light|dark)/.exec(line);
    if (match) frost[match[2]] = Number(match[1]);
  }
  if (frost.light === undefined || frost.dark === undefined) {
    throw new Error(`Deckkraft der Leiste nicht in ${NAV_PATH} gefunden`);
  }
  return frost;
}

/* ── Was unter der Leiste durchlaeuft ───────────────────────────────────── */

/**
 * Die Inhaltsfarben, die tatsaechlich unter der schwebenden Leiste
 * hindurchscrollen koennen — je Theme, jede mit dem Ort, an dem sie vorkommt.
 *
 * ── Warum die Liste nicht auf „die hellste Karte" verkuerzt ist ───────────
 * Der Auftrag nennt als schlechtesten Fall „hellste Karte hell, dunkelste
 * dunkel". Das ist die Anschauung, und sie stimmt nicht:
 *
 *   Im HELLEN ist die Leiste fast weiss und ihre Beschriftung dunkel. Eine
 *   weisse Karte darunter aendert also NICHTS — sie ist der beste Fall. Wehtut
 *   das Gegenteil: eine Code-Ziffer in `--ink`, die die Leiste abdunkelt und
 *   den Abstand zur dunklen Schrift frisst.
 *
 *   Im DUNKLEN steht es umgekehrt: Die Leiste ist fast schwarz, die Schrift
 *   hell, und die weisse Code-Ziffer hellt den Untergrund auf.
 *
 * Die Regel lautet deshalb nicht „hell/dunkel", sondern: der Inhalt, der die
 * Leiste in Richtung ihrer eigenen SCHRIFTFARBE zieht. Damit man das nicht
 * jedes Mal neu ueberlegen muss, rechnet dieses Skript ueber alle Eintraege
 * und nennt den schlechtesten selbst.
 */
const CONTENT = {
  light: [
    ['ink', 'Code-Ziffern, Kontonamen, Panel-Ueberschriften'],
    ['ink-2', 'Beschreibungen und die Zustandszeile'],
    ['fault', 'die Meldung einer unlesbaren Zeile'],
    ['signal', 'Zeiger und Nabe des Zifferblatts, gefuellte Tasten'],
    ['surface-fill', 'Felder und neutrale Tasten'],
    ['surface', 'die Karten selbst'],
    ['ground', 'der Grund zwischen den Karten'],
  ],
  dark: [
    ['ink', 'Code-Ziffern, Kontonamen, Panel-Ueberschriften'],
    ['ink-2', 'Beschreibungen und die Zustandszeile'],
    ['signal', 'Zeiger und Nabe des Zifferblatts, gefuellte Tasten'],
    ['signal-text', 'der Zeiger in seiner feinen Ausfuehrung'],
    ['surface-fill', 'Felder und neutrale Tasten'],
    ['surface', 'die Karten selbst'],
    ['ground', 'der Grund zwischen den Karten'],
  ],
};

/**
 * Die vier Messpunkte je Theme.
 *
 * ── Warum die Pille DECKEND ist, und das keine Bequemlichkeit ist ─────────
 * Der erste Entwurf liess auch sie durchscheinen: Inhalt → Leiste (82 %, dem Stand von N13) →
 * `--signal-soft` (15 %) → Schrift in `--signal-text`. Die Rechnung hat ihn
 * verworfen, und zwar deutlich — der AKTIVE Posten war der engste Punkt der
 * ganzen Leiste und hielt in beiden Themes nur bis 90 % Deckung, also genau
 * bis zu dem Grad, bei dem von „frosted" nichts uebrig bleibt.
 *
 * Der Grund liegt in der Auslegung von `--signal-text`: Die Farbe ist so
 * gewaehlt, dass sie auf den vier Hausflaechen GERADE 4,5:1 haelt (hell
 * `#a8360c`, dunkel `#f4825c` — nachzulesen in tokens.css). Sie hat keine
 * Reserve, die man an Transluzenz verfuettern koennte, und die Pille legt
 * ihren Orangeton obendrauf.
 *
 * Die Pille traegt deshalb `--signal-soft` VORGEMISCHT auf `--surface` und
 * wird deckend gemalt. Damit ist der Untergrund des aktiven Postens eine
 * Konstante — dieselbe, auf der ein Chip im Web steht —, und er kann durch
 * nichts, was darunter vorbeiscrollt, unlesbar werden. Das ist zugleich das
 * Verhalten der Referenz: Samsungs „circular highlight" ist eine gedeckte
 * Flaeche, kein Schleier.
 */
function probes(colours, alpha) {
  return [
    { name: 'Beschriftung inaktiv', ink: 'nav-ink', pill: false, min: TEXT_MIN },
    { name: 'Beschriftung aktiv', ink: 'ink', pill: true, min: TEXT_MIN },
    { name: 'Zeichen inaktiv', ink: 'nav-ink', pill: false, min: GLYPH_MIN },
    { name: 'Zeichen aktiv', ink: 'signal-text', pill: true, min: GLYPH_MIN },
  ].map((probe) => ({ ...probe, alpha, colours }));
}

/**
 * Die Pillenfarbe.
 *
 * Seit N14 ist es `--surface-active`, die Sprosse der Flaechenleiter fuer
 * „beruehrt" — Kevins Entscheidung nach dem Vorbild von One UI 8.5, wo die
 * aktive Wahl grau und nicht farbig ist. Vorher (N13) stand hier
 * `--signal-soft` auf `--surface` vorgemischt.
 *
 * Deckend bleibt sie in beiden Faellen: Der Untergrund des aktiven Postens
 * darf nicht davon abhaengen, was gerade darunter scrollt.
 */
export function pillColour(tokens) {
  return tokens.get('surface-active');
}

/** Rechnet einen Messpunkt ueber einer Inhaltsfarbe aus. */
function measure(probe, contentName, theme) {
  const tokens = probe.colours[theme];

  // Auf der Pille spielt der Inhalt keine Rolle mehr — sie deckt ihn ab. Genau
  // das ist ihr Zweck, und deshalb steht hier kein `over(content, …)`.
  const ground = probe.pill
    ? pillColour(tokens)
    : over(tokens.get(contentName), { ...tokens.get('surface'), a: probe.alpha });

  return { ratio: contrast(tokens.get(probe.ink), ground), ground, sealed: probe.pill };
}

/* ── Lauf ───────────────────────────────────────────────────────────────── */

const colours = readColours(await readFile(TOKENS_PATH, 'utf8'));
const navSource = await readFile(NAV_PATH, 'utf8');

/**
 * Die Beschriftung inaktiv traegt `--ink-2` und nicht `--ink-3` (N13).
 *
 * Das ist der Preis der Transluzenz, und er ist ausgerechnet worden statt
 * ausgehandelt: `--ink-3` haelt auf weissem Grund 5,53:1, hat also 1,03
 * Reserve — zu wenig, um Inhalt durchscheinen zu lassen. Bei 82 % Deckung
 * faellt es auf 4,07 und reisst AA. `--ink-2` haelt dort 6,29.
 *
 * Die Regel dahinter ist keine neue: Im Web traegt Text auf dem GEHAEUSE
 * `--ink-2` und nur Text auf einem PANEL `--ink-3` — weil der Gehaeuseton
 * dunkler ist und `--ink-3` darauf reisst. Eine Leiste, durch die beliebiger
 * Inhalt scheint, ist der Gehaeusefall in seiner unangenehmsten Form: Ihr
 * Untergrund steht nicht einmal fest.
 */
for (const theme of ['light', 'dark']) {
  colours[theme].set('nav-ink', colours[theme].get('ink-2'));
}

const mode = process.argv[2] ?? '';

if (mode === '--sweep') {
  // Der Lauf, der die Zahl BESTIMMT hat: Ab welcher Deckung haelt der
  // schlechteste Fall? Ausgegeben wird die Schwelle je Theme, nicht ein
  // Urteil — waehlen soll ein Mensch, und zwar mit Reserve.
  for (const theme of ['light', 'dark']) {
    console.log(`\n── ${theme} ─────────────────────────────────────────────`);
    for (const ink of ['ink-2', 'ink-3']) {
      colours[theme].set('nav-ink', colours[theme].get(ink));
      console.log(`  Beschriftung inaktiv in --${ink}:`);
      // Je MESSPUNKT eine Schwelle, nicht nur eine fuer alle: Sonst sieht man
      // zwar, dass es klemmt, aber nicht woran — und aendert dann die falsche
      // Farbe.
      for (const probe of probes(colours, 1)) {
        let threshold = null;
        for (let alpha = 1.0; alpha >= 0.3; alpha -= 0.01) {
          const worst = Math.min(
            ...CONTENT[theme].map(
              (entry) => measure({ ...probe, alpha }, entry[0], theme).ratio / probe.min,
            ),
          );
          if (worst < 1) break;
          threshold = alpha;
        }
        const value =
          threshold === null ? 'reisst schon bei 100 %' : `${(threshold * 100).toFixed(0)} %`;
        console.log(`    ${probe.name.padEnd(20)} haelt bis ${value}`);
      }
    }
    colours[theme].set('nav-ink', colours[theme].get('ink-2'));
  }
  process.exit(0);
}

if (mode === '--abblendung') {
  /**
   * Die Grenze der LESBAREN Zone (N14).
   *
   * Seit N14 blendet der Inhalt zur Leiste hin nach `--ground` ab. Ein
   * Schleier liegt dabei ueber Text UND Grund — beide wandern also auf
   * `--ground` zu, und ihr Abstand schrumpft. Bei voller Deckung ist er 1,00:1,
   * und das ist kein Fehler, sondern der Zweck: Der Text ist dort am
   * Auslaufen, so wie ein Wort am unteren Bildrand.
   *
   * Zu beweisen ist deshalb nicht, dass in der Abblendung noch AA gilt,
   * sondern WO sie anfaengt zu wirken. Diese Rechnung nennt fuer jede
   * Textstufe den Punkt, an dem sie unter 4,5:1 faellt — als Schleier-Anteil
   * und als Strecke in dp vom Anfang des Anlaufs.
   *
   * Der Anlauf ist `--gap-group` = 24 dp (`FADE_RUN` in ClockworkApp.kt).
   */
  const RUN_DP = 24;
  const TEXT = [
    ['ink', 'Code-Ziffern und Kontonamen'],
    ['ink-2', 'Beschreibungen, Fusszeile'],
    ['ink-3', 'die leiseste Stufe: Platzhalter, Meta'],
  ];

  for (const theme of ['light', 'dark']) {
    const tokens = colours[theme];
    const ground = tokens.get('ground');
    const surface = tokens.get('surface');
    console.log(`\n── ${theme}: Abblendung nach --ground, Anlauf ${RUN_DP} dp ──`);

    for (const [name, where] of TEXT) {
      const ink = tokens.get(name);
      let limit = 0;
      for (let veil = 0; veil <= 1.001; veil += 0.005) {
        const layer = { ...ground, a: veil };
        if (contrast(over(ink, layer), over(surface, layer)) < TEXT_MIN) break;
        limit = veil;
      }
      const dp = (limit * RUN_DP).toFixed(1);
      console.log(
        `  --${name.padEnd(6)} lesbar bis Schleier ${(limit * 100).toFixed(0).padStart(3)} % ` +
          `= ${dp} dp im Anlauf — ${where}`,
      );
    }
  }

  console.log(
    '\nDie strengste Stufe gibt die Grenze vor. Darunter ist der Inhalt\n' +
      'ABSICHTLICH am Auslaufen; darueber gilt AA unveraendert.',
  );
  process.exit(0);
}

/**
 * Die Gegenprobe. Eine Messung, die nicht durchfallen KANN, misst nichts —
 * dieselbe Lehre, die dieses Projekt beim APK-Vergleich teuer bezahlt hat
 * (ein Feld, das immer `null` war, meldete Gleichheit).
 */
const frost = mode === '--gegenprobe' ? { light: 0.5, dark: 0.5 } : readFrost(navSource);

let failed = 0;
let lines = 0;

for (const theme of ['light', 'dark']) {
  console.log(
    `\n── ${theme}: Leiste auf --surface mit ${(frost[theme] * 100).toFixed(0)} % Deckung ──`,
  );

  for (const probe of probes(colours, frost[theme])) {
    let worst = null;
    for (const [name, where] of CONTENT[theme]) {
      const result = measure(probe, name, theme);
      if (worst === null || result.ratio < worst.ratio) {
        worst = { ...result, name, where };
      }
    }

    lines++;
    const ok = worst.ratio >= probe.min;
    if (!ok) failed++;
    const source = worst.sealed
      ? `auf der deckenden Pille ${hex(worst.ground)} — vom Inhalt unabhaengig`
      : `schlechtester Inhalt: --${worst.name} ${hex(worst.ground)}, ${worst.where}`;
    console.log(
      `  ${ok ? '✔' : '✘'} ${probe.name.padEnd(20)} ${worst.ratio.toFixed(2)}:1 ` +
        `(min ${probe.min}) — ${source}`,
    );
  }
}

if (mode === '--gegenprobe') {
  if (failed === 0) {
    console.error(
      '\n✘ Gegenprobe: Bei 50 % Deckung haette die Pruefung durchfallen muessen.\n' +
        '  Sie misst also nicht, was sie zu messen behauptet.',
    );
    process.exit(1);
  }
  console.log(`\n✔ Gegenprobe bestanden: ${failed} von ${lines} Messpunkten reissen bei 50 %.`);
  process.exit(0);
}

if (failed > 0) {
  console.error(`\n✘ ${failed} von ${lines} Messpunkten reissen AA.`);
  process.exit(1);
}

console.log(`\n✔ ${lines} Messpunkte, alle ueber ihrer Schwelle.`);
