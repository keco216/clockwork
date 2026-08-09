/**
 * Kontraste am laufenden Gerät nachmessen.
 *
 *   node scripts/check-contrast.mjs [url]
 *
 * ── Warum das nicht aus den Tokens zu rechnen ist ──────────────────────────
 * Weil zwei Hex-Werte nicht sagen, was der Browser daraus macht. Halbdeckende
 * Haarlinien, Deckungen, übereinanderliegende Flächen, geerbte Farben — was
 * hinter einem Text liegt, entsteht erst beim Zeichnen.
 *
 * Bis V7 war der klebende Kopf der Grund dafür: halbdurchsichtig und
 * weichgezeichnet, also ein Kontrast, der sich beim Scrollen ändert. Seit V8 ist
 * er deckend, und man könnte meinen, damit sei die Pixelmessung überflüssig.
 * Sie ist es nicht — sie beweist jetzt etwas anderes, nämlich dass er wirklich
 * deckt (Abschnitt 5). Und die halbdeckenden Haarlinien der Flächenleiter
 * (Abschnitt 7) lassen sich ohnehin nur so prüfen.
 *
 * Deshalb misst dieses Skript nicht Tokens, sondern PIXEL:
 *
 *   1. Vordergrundfarbe aus `getComputedStyle(el).color` holen.
 *   2. Denselben Text auf `transparent` stellen und einen Ausschnitt genau
 *      seiner Fläche aufnehmen. Übrig bleibt reiner Hintergrund — inklusive
 *      Weichzeichner, Sättigung und Deckung, fertig gerechnet vom Browser.
 *   3. Mittelwert dieser Pixel gegen die Vordergrundfarbe nach WCAG 2.1.
 *
 * Der Umweg über den unsichtbaren Text ist der Punkt: Ein Mittelwert ÜBER den
 * Glyphen hinweg würde die Schrift mitmessen und käme immer zu gut heraus.
 *
 * ── Warum ein Seitenausschnitt und keine Elementaufnahme ───────────────────
 * Bis V6 stand hier `elementHandle.screenshot()`. Das ist der bequeme Weg und
 * für ein klebendes Element der falsche: Playwright führt vor jeder
 * Elementaufnahme seine Bedienbarkeitsprüfungen aus und scrollt das Element
 * dabei in den Blick. Bei `position: sticky` zielt dieses Scrollen auf die
 * Position im FLUSS — also an den Dokumentanfang. Die Seite sprang damit auf
 * y = 0 zurück, der Fühler am Seitenanfang kam wieder ins Bild, der Kopf
 * verlor sein Frost-Material (siehe ui/masthead.ts), und ab da maß jede
 * weitere Zeile Text auf blankem Untergrund statt auf Frost.
 *
 * Sichtbar wurde das an der Reserveprobe: Sie lieferte exakt die Farbwerte der
 * eingeschobenen Prüffläche — 1,13:1 über Orange —, weil zwischen Text und
 * Prüffläche nichts mehr lag. Die naheliegende Erklärung war ein
 * z-index-Fehler, und sie war falsch: `document.elementsFromPoint` zeigt den
 * Kopf sauber über der Prüffläche. Kaputt war nicht der Stapel, sondern die
 * Scrollposition — also der Messaufbau, nicht das Material.
 *
 * `page.screenshot({ clip })` scrollt nichts. Der Ausschnitt steht in
 * FENSTERKOORDINATEN und wird unmittelbar vor der Aufnahme gelesen; wo nötig,
 * scrollt dieses Skript vorher selbst und weiß danach, dass es gescrollt hat.
 *
 * Damit dieser Fehler nicht ein zweites Mal jahrelang unbemerkt bleibt, prüft
 * das Skript seinen eigenen Aufbau (Abschnitt 5). Die Form dieses Selbsttests
 * hat sich mit V8 geändert, sein Zweck nicht: Bis V7 verdünnte er den Frost auf
 * 30 % und verlangte, dass die Probe DURCHFÄLLT. Einen Frost gibt es nicht mehr,
 * also wird jetzt seine Nachfolge-Eigenschaft geprüft — dass der Kopf über drei
 * extrem verschiedenen Prüfflächen DENSELBEN Wert liefert. Ein Kopf, der deckt,
 * kann keinen anderen zeigen; ein Kopf, den das Skript nicht sieht, zeigt drei
 * verschiedene.
 *
 * ── Warum ein eigener PNG-Leser ────────────────────────────────────────────
 * Aus demselben Grund, aus dem scripts/icons.mjs seine PNGs selbst schreibt:
 * Für ein paar Tausend Pixel lohnt keine native Bildbibliothek mit 50 MB
 * Anhang. Node bringt `zlib` mit, und mehr braucht ein unverschränktes PNG
 * nicht.
 */

import { chromium } from 'playwright';
import { inflateSync } from 'node:zlib';

const url = process.argv[2] ?? 'http://localhost:5180';

/** WCAG 2.1 verlangt 4,5:1 für Fließtext und 3:1 für Große Schrift und Marken. */
const AA_TEXT = 4.5;
const AA_LARGE = 3;

/* ── PNG lesen ─────────────────────────────────────────────────────────────
   Nur so viel, wie Playwright erzeugt: 8 Bit je Kanal, kein Interlace,
   Farbtyp 2 (RGB) oder 6 (RGBA). Alles andere bricht laut ab, statt still
   falsche Zahlen zu liefern — ein Kontrastwert, dem man nicht trauen kann,
   ist schlimmer als keiner. */
function decodePng(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error('Kein PNG');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const parts = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('latin1');
    const data = buffer.subarray(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const depth = data[8];
      const colorType = data[9];
      const interlace = data[12];
      if (depth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`PNG-Form nicht unterstuetzt: Tiefe ${depth}, Typ ${colorType}`);
      }
      channels = colorType === 6 ? 4 : 3;
    } else if (type === 'IDAT') {
      parts.push(data);
    } else if (type === 'IEND') {
      break;
    }

    offset += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);

  // Defiltern. Jede Zeile trägt vorn ihren Filtertyp; die Bezugswerte sind der
  // linke Nachbar (a), der obere (b) und der links-oben (c) — jeweils in BYTES,
  // nicht in Pixeln, deshalb der Versatz um `channels`.
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const source = y * (stride + 1) + 1;
    const target = y * stride;

    for (let x = 0; x < stride; x++) {
      const value = raw[source + x];
      const a = x >= channels ? pixels[target + x - channels] : 0;
      const b = y > 0 ? pixels[target - stride + x] : 0;
      const c = x >= channels && y > 0 ? pixels[target - stride + x - channels] : 0;
      let restored;

      switch (filter) {
        case 0:
          restored = value;
          break;
        case 1:
          restored = value + a;
          break;
        case 2:
          restored = value + b;
          break;
        case 3:
          restored = value + ((a + b) >> 1);
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          restored = value + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default:
          throw new Error(`Unbekannter PNG-Filter ${filter}`);
      }

      pixels[target + x] = restored & 0xff;
    }
  }

  return { width, height, channels, pixels };
}

/** Der Durchschnitt EINER Bildzeile, als [r, g, b]. */
function rowColour({ width, channels, pixels }, y) {
  let r = 0;
  let g = 0;
  let b = 0;
  for (let x = 0; x < width; x++) {
    const at = (y * width + x) * channels;
    r += pixels[at];
    g += pixels[at + 1];
    b += pixels[at + 2];
  }
  return [r / width, g / width, b / width];
}

/** Der Durchschnitt aller Pixel eines Ausschnitts, als [r, g, b]. */
function averageColour({ width, height, channels, pixels }) {
  let r = 0;
  let g = 0;
  let b = 0;
  const count = width * height;

  for (let index = 0; index < count; index++) {
    const at = index * channels;
    r += pixels[at];
    g += pixels[at + 1];
    b += pixels[at + 2];
  }

  return [r / count, g / count, b / count];
}

/* ── Kontrast nach WCAG 2.1 ────────────────────────────────────────────────
   Die Kanalwerte werden erst linearisiert (sRGB ist eine Gammakurve, und ein
   Mittelwert in Gamma wäre physikalisch falsch), dann nach Augenempfindlichkeit
   gewichtet. */
function luminance([r, g, b]) {
  const channel = (value) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/* ── oklab → sRGB (Ottosson-Matrizen) ──────────────────────────────────────
   Seit V9 stehen abgeleitete Töne als `color-mix(in oklab, …)` in tokens.css,
   und Chromium gibt deren computed value als `oklab(L a b)` zurück — nicht als
   `rgb(…)`. Der alte Parser fischte mit /[\d.]+/ drei Zahlen heraus und hielt
   L, a, b für RGB-Kanäle: Aus einem hellen Orange wurde praktisch Schwarz,
   und die Parameterzeile „bestand" im Hellen mit einer Zahl, die gar nichts
   maß, während sie im Dunkeln mit 1,35 durchfiel. Ein Parser, der das falsche
   Format stillschweigend als Zahlen liest, ist derselbe Fehler wie das `?.`
   im alten shoot.mjs — deshalb wirft er jetzt bei allem, was er nicht kennt. */
function oklabToRgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return linear.map((x) => {
    const gamma = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, gamma * 255));
  });
}

/** `rgb(23, 22, 20)`, `rgba(…)`, `oklab(…)` oder `oklch(…)` in [r, g, b]. */
function parseColour(value) {
  const numbers = value.match(/-?[\d.]+(?:e-?\d+)?/g)?.map(Number);
  if (!numbers || numbers.length < 3) {
    throw new Error(`Farbe nicht lesbar: ${value}`);
  }
  if (value.startsWith('oklab(')) {
    return oklabToRgb(numbers[0], numbers[1], numbers[2]);
  }
  if (value.startsWith('oklch(')) {
    const [L, C, H] = numbers;
    const rad = (H * Math.PI) / 180;
    return oklabToRgb(L, C * Math.cos(rad), C * Math.sin(rad));
  }
  if (value.startsWith('rgb')) {
    return numbers.slice(0, 3);
  }
  throw new Error(`Farbformat nicht unterstuetzt: ${value}`);
}

/* ── Die Messung selbst ────────────────────────────────────────────────────── */

const findings = [];
const rows = [];

/**
 * Ein Kastenmaß in Fensterkoordinaten auf den sichtbaren Bereich beschneiden.
 * `page.screenshot({ clip })` weist einen Ausschnitt zurück, der auch nur einen
 * Pixel über den Fensterrand ragt — und ein Element, das an der Falz hängt, ist
 * genau so einer.
 */
function visibleClip(rect, viewport) {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const width = Math.min(viewport.width, Math.ceil(rect.x + rect.width)) - x;
  const height = Math.min(viewport.height, Math.ceil(rect.y + rect.height)) - y;
  return width >= 2 && height >= 2 ? { x, y, width, height } : null;
}

/**
 * Misst ein Element: Textfarbe gegen das, was der Browser tatsächlich
 * dahinter gezeichnet hat. Gibt das Verhältnis zurück (oder `null`, wenn nicht
 * gemessen werden konnte).
 */
async function measure(page, { label, selector, scheme, min = AA_TEXT, keepScroll = false }) {
  const handle = await page.$(selector);
  if (handle === null) {
    findings.push(`${scheme} · ${label}: Element nicht gefunden (${selector})`);
    return null;
  }

  // Ein Seitenausschnitt zählt vom sichtbaren Bereich aus. Was unterhalb der
  // Falz liegt, hat zwar ein Kastenmaß, aber keinen Platz im Bild — also erst
  // hinscrollen.
  //
  // Für die Messungen am klebenden Kopf ist genau das verboten: Dort IST die
  // Scrollposition der Messgegenstand. Der Kopf klebt ohnehin oben und ist immer
  // sichtbar.
  if (!keepScroll) {
    await handle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
  }

  const foreground = parseColour(
    await handle.evaluate((element) => getComputedStyle(element).color),
  );

  // Erst JETZT das Kastenmaß lesen, in Fensterkoordinaten und im selben Zug,
  // in dem der Text unsichtbar wird: Zwischen Messen und Aufnehmen darf nichts
  // mehr scrollen, sonst zeigt der Ausschnitt eine andere Stelle der Seite.
  //
  // `visibility: hidden` ginge für den Text nicht: Das nimmt das Element aus
  // dem Bild und legte den Grund DARUNTER frei statt den Grund DAHINTER.
  //
  // Das `finally` ist kein Zierrat: Bliebe der Text nach einem Fehler auf
  // `transparent` stehen, wären alle folgenden Messungen an derselben Seite
  // still falsch.
  let shot;
  const rect = await handle.evaluate((element) => {
    element.dataset['measuring'] = element.style.color;
    element.style.color = 'transparent';
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  });
  try {
    const clip = visibleClip(rect, page.viewportSize());
    if (clip === null) {
      findings.push(`${scheme} · ${label}: Element hat im Fenster keine Flaeche`);
      return null;
    }
    shot = await page.screenshot({ clip });
  } finally {
    await handle.evaluate((element) => {
      element.style.color = element.dataset['measuring'] ?? '';
      delete element.dataset['measuring'];
    });
  }

  const background = averageColour(decodePng(shot));
  const ratio = contrast(foreground, background);
  const ok = ratio >= min;

  rows.push({ scheme, label, ratio: ratio.toFixed(2), min: min.toFixed(1), ok });

  if (!ok) {
    findings.push(`${scheme} · ${label}: ${ratio.toFixed(2)}:1 — verlangt sind ${min}:1`);
  }

  return ratio;
}

/**
 * Wie deutlich hebt sich eine Fläche von der ab, auf der sie liegt?
 *
 * Gemessen wird, was das Auge tatsächlich benutzt, um eine Grenze zu finden:
 * der STÄRKSTE SPRUNG über sie hinweg. Ein schmaler senkrechter Streifen quer
 * über die Oberkante, Zeile für Zeile gemittelt, dann der größte Kontrast
 * zwischen zwei benachbarten Zeilen. Was ihn erzeugt — Flächenstufe, Schatten
 * oder (bis V8) eine Haarlinie —, ist der Messung gleichgültig; sie fragt nur,
 * ob es ihn gibt. Genau deshalb überlebt sie jeden Umbau der Trennmittel:
 * V9 hat Kanten durch Flächenkontrast ersetzt, die Messung blieb dieselbe,
 * nur ihre Sollwerte gehören jetzt dem neuen Design (siehe Abschnitt 6).
 *
 * Der Streifen ist absichtlich schmal und sitzt in der Mitte der Kante: An den
 * gerundeten Ecken läuft die Kante schräg durch die Zeilen und verschmiert.
 */
async function measureEdge(page, { label, selector, scheme, min = 1.25, at = 0.5 }) {
  const handle = await page.$(selector);
  if (handle === null) {
    findings.push(`${scheme} · ${label}: Element nicht gefunden (${selector})`);
    return;
  }

  await handle.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);

  const BAND = 10; // Pixel ober- und unterhalb der Kante
  const rect = await handle.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width };
  });

  // `at` verschiebt den Streifen entlang der Oberkante (0 = Anfang, 1 = Ende).
  // Der Normalfall ist die Mitte; das Eingabefeld braucht eine Stelle weiter
  // rechts, weil seine Beschriftung 8 px über der Kante endet und ihre
  // Glyphen sonst im oberen Messband liegen — gemessen drückte das den
  // hellen Sprung von 1,19 auf 1,09, und zwar durch TEXT, nicht durch die
  // Fläche, um die es geht.
  const clip = visibleClip(
    { x: rect.x + rect.width * at - 20, y: rect.y - BAND, width: 40, height: BAND * 2 },
    page.viewportSize(),
  );
  if (clip === null) {
    findings.push(`${scheme} · ${label}: Kante liegt nicht im Fenster`);
    return;
  }

  const image = decodePng(await page.screenshot({ clip }));
  // Zeilen im Abstand von 3 vergleichen, nicht Nachbarzeilen: Die
  // Kantenglättung verschmiert eine Kante über zwei bis drei Zeilen, und zwei
  // halbe Spruenge sind je kleiner als der ganze. Gemessen: Die helle
  // Feldkante (Soll 1,17) kam zeilenweise nur auf 1,09 — mit dem Abstand
  // springt sie sauber ueber die Verschmierung hinweg.
  const STRIDE = 3;
  let best = 1;
  for (let y = STRIDE; y < image.height; y++) {
    best = Math.max(best, contrast(rowColour(image, y - STRIDE), rowColour(image, y)));
  }

  const ok = best >= min;
  rows.push({ scheme, label, ratio: best.toFixed(2), min: min.toFixed(2), ok });
  if (!ok) {
    findings.push(
      `${scheme} · ${label}: staerkster Sprung ueber die Kante ${best.toFixed(2)}:1 — verlangt sind ${min}:1`,
    );
  }
}

const DEMO = [
  'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
  'otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
  'JBSW0Y3DPEHPK3PXP',
].join('\n');

const browser = await chromium.launch();

for (const scheme of ['light', 'dark']) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: scheme,
    // Ein Pixel im Bild soll ein Pixel im Layout sein — sonst stimmen die
    // Ausschnittkoordinaten nicht mit den Kastenmassen ueberein.
    deviceScaleFactor: 1,
    locale: 'de-DE',
  });
  const page = await context.newPage();
  await page.goto(`${url}#lang=de`, { waitUntil: 'networkidle' });
  await page.fill('#secrets', DEMO);
  await page.waitForTimeout(450);

  // Der Tresor ist seit V7 ein Aufklapper und startet zu. Ein zugeklappter
  // `<details>`-Inhalt hat kein Rechteck — die Messung darunter bekäme dann
  // einen Ausschnitt der Fläche, auf der der Absatz LÄGE, und meldete eine
  // Zahl, die nichts beschreibt.
  await page.evaluate(() => {
    const disclosure = document.querySelector('#vault-disclosure');
    if (disclosure !== null) disclosure.open = true;
  });
  await page.waitForTimeout(200);

  /* ── 1. Die festen Flächen ──────────────────────────────────────────────
     Alles, was auf einer Gehäusegruppe steht. Neu an V5 ist der Untergrund
     darunter, also wird hier gegengeprüft, dass die Panels selbst nichts
     verloren haben. */
  await measure(page, {
    scheme,
    label: 'Gravur der Zone auf Untergrund',
    selector: '#zone-input-label',
  });
  await measure(page, {
    scheme,
    label: 'Gravur im Panel (Feldbeschriftung)',
    selector: '.slot__legend',
  });
  await measure(page, { scheme, label: 'Fliesstext im Panel', selector: '#vault-explain' });
  // Ausdrücklich der ausgefüllte Hinweis und nicht `.note`: Die erste `.note`
  // im Dokument ist die Import-Meldung, und die ist im Ruhezustand leer — ein
  // Element ohne Fläche hat auch keinen messbaren Hintergrund.
  await measure(page, {
    scheme,
    label: 'Nebentext im Panel',
    selector: '[data-rich="input.help.formats"]',
  });
  await measure(page, { scheme, label: 'Bilanzzeile unter dem Feld', selector: '#entry-count' });
  await measure(page, { scheme, label: 'Tastenbeschriftung', selector: '#key-clear' });
  await measure(page, { scheme, label: 'Eingabetext im versenkten Feld', selector: '#secrets' });
  await measure(page, { scheme, label: 'Auswahlfeld (Sprache)', selector: '#lang-select' });
  await measure(page, {
    scheme,
    label: 'Code auf dem Zifferblatt',
    selector: '.strip .dial',
    min: AA_LARGE,
  });
  await measure(page, { scheme, label: 'Kontoname', selector: '.strip__issuer' });
  await measure(page, { scheme, label: 'Parameterzeile', selector: '.strip__spec' });
  await measure(page, {
    scheme,
    label: 'Vorschau auf den naechsten Code',
    selector: '.strip__nextCode',
  });
  await measure(page, {
    scheme,
    label: 'Fehlerzeile: Ueberschrift',
    selector: '.strip--fault .strip__issuer',
  });
  await measure(page, { scheme, label: 'Fehlerzeile: Meldung', selector: '.fault__text' });
  await measure(page, { scheme, label: 'Fusszeile auf Untergrund', selector: '.colophon__note' });

  /* ── 2. Der klebende Kopf, ungescrollt ──────────────────────────────────
     Hier ist er noch flach und liegt auf dem blanken Untergrund. */
  await measure(page, { scheme, label: 'Kopf: Marke, ungescrollt', selector: '.masthead__spec' });

  /* ── 3. Der klebende Kopf, gescrollt ────────────────────────────────────
     Jetzt liegt eine Panelfläche unter ihm. Seit V8 ändert das an seinem Grund
     nichts mehr — er ist deckend. Gemessen wird es trotzdem, denn „ändert
     nichts" ist genau die Zusage, die hier geprüft wird. */
  await page.evaluate(() => {
    window.scrollTo(0, 400);
  });
  await page.waitForTimeout(400);

  // Die Messregion verifizieren, bevor irgendetwas gemessen wird. Ohne diesen
  // Griff steht in der Ausgabe eine ordentliche Zahl, die eine ganz andere
  // Fläche beschreibt — genau so blieb der Messfehler aus V6 ein halbes Release
  // lang unsichtbar. Die Klasse schaltet seit V8 kein Material mehr, sondern
  // Kante und Schatten; als Nachweis, DASS gescrollt wurde und der Kopf über
  // etwas liegt, taugt sie unverändert.
  const grip = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    lifted: document.querySelector('.masthead')?.classList.contains('masthead--lifted') ?? false,
  }));
  if (!grip.lifted) {
    findings.push(
      `${scheme} · Messaufbau: Der Kopf liegt bei y=${grip.y} ueber nichts — er klebt nicht, oder die Seite ist nicht gescrollt.`,
    );
  }

  await measure(page, {
    scheme,
    label: 'Kopf ueber Panel: Marke',
    selector: '.masthead__spec',
    keepScroll: true,
  });
  await measure(page, {
    scheme,
    label: 'Kopf ueber Panel: Zustand',
    selector: '#state-text',
    keepScroll: true,
  });

  /* ── 4. Die Reserveprobe ────────────────────────────────────────────────
     Bis hierher wurde gemessen, was die App wirklich unter den Kopf scrollen
     lässt: Gehäusegruppen und Untergrund. Diese Werte MÜSSEN AA erfüllen —
     sie kommen vor.

     Jetzt kommt, was nicht vorkommt: Signal-Orange, Tinte und Papier unter dem
     Kopf, also die Enden der Palette.

     ── Warum die Probe bleibt, obwohl der Kopf jetzt deckt ────────────────
     Weil sie mit V5 einen echten Fehler gefunden hat (2,78:1 bei 72 % Deckung),
     und weil „der Kopf ist deckend" eine Behauptung über Code ist, die ein
     Token, ein Rückfall oder ein `@supports` jederzeit wieder umdrehen kann.
     Ein deckender Kopf besteht diese Probe mühelos — genau das ist der Punkt.
     Der Wächter kostet drei Messungen und meldet sich, sobald irgendwer die
     Fläche wieder durchsichtig macht.

     Der Maßstab bleibt 3:1 und nicht 4,5:1: Gefragt ist nicht „ist dieser Text
     bequem zu lesen" — er steht nie auf so einem Grund —, sondern „wie viel
     Reserve hat die Fläche, bevor sie zusammenbricht". */
  /* Die drei Prüfflächen sind die Enden der V9-Palette: der Akzent, die
     dunkelste und die hellste Fläche, die es gibt. */
  const HARD = [
    { name: 'Signal-Orange', colour: '#f05a28' },
    { name: 'Eclipse', colour: '#18181b' },
    { name: 'Weiss', colour: '#ffffff' },
  ];

  const setProbe = (colour) =>
    page.evaluate((value) => {
      let patch = document.getElementById('contrast-probe');
      if (patch === null) {
        patch = document.createElement('div');
        patch.id = 'contrast-probe';
        patch.style.position = 'fixed';
        patch.style.insetInlineStart = '0';
        patch.style.insetBlockStart = '0';
        patch.style.width = '100%';
        patch.style.height = '160px';
        // Unter den Kopf (z-index 5), aber über den Inhalt (z-index 1).
        patch.style.zIndex = '2';
        // In .device und nicht am body, damit die Prüffläche im selben
        // Stapelzusammenhang liegt wie der Kopf, den sie unterlegen soll.
        (document.querySelector('.device') ?? document.body).append(patch);
      }
      patch.style.background = value;
    }, colour);

  const reserve = [];

  for (const probe of HARD) {
    await setProbe(probe.colour);
    await page.waitForTimeout(250);
    const ratio = await measure(page, {
      scheme,
      label: `Reserve: Kopf ueber ${probe.name}`,
      selector: '.masthead__spec',
      keepScroll: true,
      min: AA_LARGE,
    });
    if (ratio !== null) reserve.push({ name: probe.name, ratio });
  }

  /* ── 5. Der Selbsttest: deckt der Kopf wirklich? ─────────────────────────
     Alles bis hierher ist eine Behauptung über eine Fläche, die es ohne den
     Browser gar nicht gibt. Wenn der Messaufbau kaputtgeht, bricht er nicht
     laut zusammen — er liefert weiter Zahlen, nur eben von der falschen Fläche.
     Genau das ist in V6 passiert.

     Bis V7 stand hier eine Gegenprobe, die durchfallen MUSSTE: Frost auf 30 %
     verdünnt, und wenn die Probe dann noch bestand, sah das Skript den Kopf
     nicht. Mit einem deckenden Kopf gibt es nichts mehr zu verdünnen — aber
     einen Beweis derselben Art, und zwar einen strengeren.

     Ein deckender Kopf muss über Signal-Orange, Tinte und Papier DENSELBEN Wert
     liefern. Drei Prüfflächen, die weiter auseinander liegen könnten es nicht,
     und trotzdem ein Wert: Das kann nur herauskommen, wenn zwischen Text und
     Prüffläche wirklich eine deckende Fläche liegt.

     Der Test ist strenger als die alte Gegenprobe, weil er beide Fehlerarten
     zugleich fängt:

       • Der Kopf ist versehentlich durchsichtig geworden → die drei Werte gehen
         auseinander, denn die Prüfflächen schlagen durch.
       • Das Skript sieht den Kopf gar nicht (der V6-Fehler) → die drei Werte
         gehen ebenfalls auseinander, denn dann MISST es die Prüfflächen.

     Ein einziger Grenzwert würde nur den ersten Fall fangen, und auch den nur,
     solange die Palette sich nicht bewegt. Eine Streuung braucht keine
     Palettenannahme.

     0,15 ist die zugelassene Streuung. Sie ist nicht Null, weil der Kopf eine
     Haarlinie, einen Schatten und gerundete Ecken hat: Der Ausschnitt liegt an
     der Textzeile, nicht am Rand, aber die Kantenglättung der Glyphenfläche
     lässt ein paar Zehntelpixel Rest. Gemessen liegt die Streuung bei 0,00 —
     0,15 ist Luft, nicht Toleranz für ein bekanntes Problem. */
  const spread =
    reserve.length < 2
      ? 0
      : Math.max(...reserve.map((r) => r.ratio)) - Math.min(...reserve.map((r) => r.ratio));

  const SPREAD_MAX = 0.15;
  rows.push({
    scheme,
    label: 'Selbsttest: Streuung der drei Reserveproben',
    ratio: spread.toFixed(2),
    min: SPREAD_MAX.toFixed(2),
    ok: spread <= SPREAD_MAX,
    isSpread: true,
  });

  if (spread > SPREAD_MAX) {
    findings.push(
      `${scheme} · Messaufbau: Die drei Reserveproben streuen um ${spread.toFixed(2)} ` +
        `(${reserve.map((r) => `${r.name} ${r.ratio.toFixed(2)}`).join(', ')}). ` +
        `Ein deckender Kopf kann das nicht — entweder ist er durchsichtig geworden, ` +
        `oder das Skript misst die Pruefflaeche statt den Kopf.`,
    );
  }

  await page.evaluate(() => {
    document.getElementById('contrast-probe')?.remove();
  });

  /* ── 6. Die Flächentrennung ─────────────────────────────────────────────
     Bis V8 stand hier eine KANTEN-Zusage (stärkster Sprung ≥ 1,25), und sie
     gehörte dem Gehäuse-Design: Haarlinie plus Lichtkante plus Schatten. V9
     trennt wie die Referenz — hell Schatten und Flächenstufe, dunkel NUR die
     Flächenstufe („--surface-shadow: transparent" steht wörtlich im Paket).

     Die Referenzstufen selbst sind kleiner als 1,25 (hell 1,09, dunkel 1,14 —
     nahe Schwarz staucht die WCAG-Formel, der oklch-Schritt 12 % → 21 % ist
     trotzdem deutlich). Eine Schwelle DARÜBER würde also das Design
     durchfallen lassen, das sie schützen soll. Geprüft wird deshalb, was
     kaputtgehen kann: dass die Stufe ÜBERHAUPT da ist. 1,05 fängt den Tag,
     an dem ein Panel versehentlich im Grundton steht — mehr behauptet die
     Zahl nicht, und mehr gibt es hier nicht zu behaupten. */
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  await measureEdge(page, {
    scheme,
    label: 'Stufe: Panel auf Grund',
    selector: '#zone-codes .zone__body',
    min: 1.05,
  });

  /* ── 7. Die Füllung der Bauteile ────────────────────────────────────────
     Umrisse gibt es seit V9 nicht mehr — Feld und neutrale Taste sind
     GEFÜLLTE Flächen auf dem Panel (HeroUIs Flat-Stil). Was ihnen ihre
     Sichtbarkeit gibt, ist die Füllstufe Panel → Füllung (Sollwert 1,19 in
     beiden Themes, aus tokens.css). Gemessen wird der Sprung über die
     Oberkante; 1,12 lässt der Kantenglättung Luft und fängt trotzdem den
     Fall, dass ein Feld seine Füllung verliert und unsichtbar auf dem Panel
     liegt.

     Der Chip steht nicht mehr in dieser Liste: Seine Tönung (15 % Signal)
     ist bewusst leiser als eine Feldfüllung, und seine Sichtbarkeit trägt
     die SCHRIFT auf der Tönung — die misst Abschnitt 1 als „Parameterzeile"
     gegen 4,5:1.

     ── Erst zurück an den Seitenanfang, und zwar ausdrücklich ─────────────
     Die Panel-Messung darüber hat gescrollt (das Codes-Panel ist höher als
     das Fenster, `scrollIntoViewIfNeeded` holt so viel davon ins Bild wie
     möglich). Das Feld blieb dabei trotzdem sichtbar — die Rail KLEBT — und
     sein oberer Rand stand damit direkt unter dem klebenden Kopf. Die zehn
     Bandzeilen über der Feldkante gehörten dann dem Kopf im Grundton, und
     gemessen wurde Grund gegen Füllung (1,09) statt Panel gegen Füllung
     (1,17). Eine Messung an einem klebenden Layout muss ihre Scrollposition
     selbst herstellen — dieselbe Lehre wie beim V6-Blocker, nur eine Ebene
     tiefer.

     Und zwar BEIDE Scrollpositionen: Die Rail ist seit V7 eine eigene
     Scrollfläche, und die Elementaufnahmen weiter oben haben ihren scrollTop
     verstellt, während das Fenster längst wieder bei 0 stand. `window.scrollTo`
     allein ließ das Feld deshalb weiter unter dem Kopf hängen — gemessen an
     clip.y = 75 statt 157. */
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector('.rail')?.scrollTo(0, 0);
    // Der Fokus liegt seit page.fill() im Feld, und sein Ring liegt genau auf
    // der Kante, die hier gemessen wird. Mit Ring bestuende die Pruefung auch
    // bei fehlender Fuellung — gemessen wuerde dann der Ring, nicht die
    // Flaeche, um die es geht.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.waitForTimeout(300);
  await measureEdge(page, {
    scheme,
    label: 'Fuellung: Eingabefeld',
    selector: '#secrets',
    min: 1.12,
    at: 0.85,
  });
  await measureEdge(page, {
    scheme,
    label: 'Fuellung: neutrale Taste',
    selector: '#key-file',
    min: 1.12,
  });

  /* ── 8. Die Matrix: jede Textstufe auf jeder Fläche ──────────────────────
     Abschnitt 1 misst, was die App WIRKLICH zeigt — dort steht jede Zeile für
     ein Bauteil, das es gibt. Das ist die wichtigere Hälfte und bleibt vorn.

     Hier steht die andere: die ZUSAGE. styles/tokens.css behauptet, dass alle
     drei Textstufen auf jeder Fläche der Leiter mindestens 4,5:1 halten, und
     genau darauf beruht die Aufräumarbeit von V8 — zwei Sonderregeln aus V7
     („auf dem Gehäuse eine Stufe kräftiger", „im Kopf noch eine") sind
     gestrichen worden, weil die Zusage gilt. Eine gestrichene Ausnahme ist nur
     so viel wert wie die Regel, die sie ersetzt.

     Geprüft wird deshalb das ganze Kreuz, auch die Paare, die heute nirgends
     vorkommen: vier Flächen × fünf Farben. Wer morgen einen Hinweistext auf die
     berührte Fläche legt, soll das tun können, ohne nachzumessen.

     Die Prüffläche steht dafür im Dokument und trägt echte Tokens — gerechnet
     wird auch hier an gezeichneten Pixeln, nicht an Hex-Werten. Der Unterschied
     ist nicht Pedanterie: `--rule` und `--edge-*` sind halbdeckend, und was
     daraus auf einer Fläche wird, weiß nur der Browser. */
  const SURFACES = [
    ['Werkbank', '--ground'],
    ['Panel', '--surface'],
    ['Fuellung', '--surface-fill'],
    ['beruehrt', '--surface-active'],
  ];
  const INKS = [
    ['ink', '--ink', AA_TEXT],
    ['ink-2', '--ink-2', AA_TEXT],
    ['ink-3', '--ink-3', AA_TEXT],
    // Der Akzent für Schrift und feine Marken. Derselbe Maßstab wie Text: Er
    // trägt den ablaufenden Code und die Tresor-Statuszeile.
    ['signal-text', '--signal-text', AA_TEXT],
    ['fault', '--fault', AA_TEXT],
  ];

  await page.evaluate(
    ([surfaces, inks]) => {
      const grid = document.createElement('div');
      grid.id = 'token-matrix';
      grid.style.position = 'fixed';
      grid.style.insetInlineStart = '0';
      grid.style.insetBlockStart = '0';
      // Über allem, damit nichts anderes in den Ausschnitt gerät.
      grid.style.zIndex = '9999';
      grid.style.display = 'flex';
      grid.style.flexWrap = 'wrap';

      for (const [surfaceName, surfaceToken] of surfaces) {
        for (const [inkName, inkToken] of inks) {
          const cell = document.createElement('span');
          cell.dataset['probe'] = `${surfaceName}/${inkName}`;
          cell.style.background = `var(${surfaceToken})`;
          cell.style.color = `var(${inkToken})`;
          // Gross genug, dass der Ausschnitt sicher Pixel hat, und ohne Rand:
          // Ein Rahmen käme in den Mittelwert und würde das Ergebnis verfälschen.
          cell.style.padding = '10px 14px';
          cell.style.fontSize = '14px';
          cell.textContent = 'Agmw 0123';
          grid.append(cell);
        }
      }
      document.body.append(grid);
    },
    [SURFACES, INKS],
  );
  await page.waitForTimeout(200);

  for (const [surfaceName] of SURFACES) {
    for (const [inkName, , min] of INKS) {
      await measure(page, {
        scheme,
        label: `Matrix: ${inkName} auf ${surfaceName}`,
        selector: `[data-probe="${surfaceName}/${inkName}"]`,
        min,
        keepScroll: true,
      });
    }
  }

  await page.evaluate(() => {
    document.getElementById('token-matrix')?.remove();
  });

  await context.close();
}

await browser.close();

/* ── Bericht ───────────────────────────────────────────────────────────────── */

const width = Math.max(...rows.map((row) => row.label.length));
let last = '';

for (const row of rows) {
  if (row.scheme !== last) {
    console.log(`\n${row.scheme === 'light' ? 'HELL' : 'DUNKEL'}`);
    last = row.scheme;
  }
  const mark = row.ok ? '✓' : '✗';
  // Der Selbsttest hat das umgekehrte Ziel — seine Streuung soll KLEIN sein.
  // Stünde dort dasselbe „>=" wie überall, läse sich eine bestandene Zeile wie
  // ein Widerspruch. Und er ist kein Kontrastverhältnis, also kein „:1".
  if (row.isSpread) {
    console.log(`  ${mark} ${row.label.padEnd(width)}  ${row.ratio.padStart(6)}   (<= ${row.min})`);
  } else {
    console.log(
      `  ${mark} ${row.label.padEnd(width)}  ${row.ratio.padStart(6)}:1  (>= ${row.min})`,
    );
  }
}

const proofs = rows.filter((row) => row.isSpread).length;

if (findings.length > 0) {
  console.error('\nBefunde:');
  for (const finding of findings) console.error('  ✗ ' + finding);
  process.exitCode = 1;
} else {
  console.log(
    `\n✓ Alle ${rows.length - proofs} gemessenen Paare erfuellen ihr Maß.` +
      `\n✓ ${proofs} Selbsttests zeigen, dass dabei wirklich der Kopf gemessen wurde.`,
  );
}
