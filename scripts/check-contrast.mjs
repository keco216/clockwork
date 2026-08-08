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

/** `rgb(23, 22, 20)` bzw. `rgba(…)` in [r, g, b]. */
function parseColour(value) {
  const numbers = value.match(/[\d.]+/g);
  if (!numbers || numbers.length < 3) {
    throw new Error(`Farbe nicht lesbar: ${value}`);
  }
  return numbers.slice(0, 3).map(Number);
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
 * ── Warum das nicht der Abstand zweier Flächenfarben ist ───────────────────
 * Weil er im dunklen Modus gar nicht existieren kann. Nacht (#131210) liegt bei
 * einer relativen Leuchtdichte von 0,0074; selbst gegen reines Schwarz wären
 * daraus höchstens 1,15:1. Ein Panel im Dunkeln über seinen TON von seinem
 * Grund abzuheben ist physikalisch nicht möglich — und genau deshalb tragen
 * dort Haarlinie und Lichtkante die Erhebung (siehe --edge-lit in tokens.css).
 *
 * Gemessen wird deshalb, was das Auge tatsächlich benutzt, um eine Kante zu
 * finden: der STÄRKSTE SPRUNG über sie hinweg. Ein schmaler senkrechter
 * Streifen quer über die Oberkante, Zeile für Zeile gemittelt, dann der größte
 * Kontrast zwischen zwei benachbarten Zeilen. Was ihn erzeugt — Tonunterschied,
 * Haarlinie oder Lichtkante —, ist der Messung gleichgültig; sie fragt nur, ob
 * es ihn gibt.
 *
 * Der Streifen ist absichtlich schmal und sitzt in der Mitte der Kante: An den
 * gerundeten Ecken läuft die Kante schräg durch die Zeilen und verschmiert.
 */
async function measureEdge(page, { label, selector, scheme, min = 1.25 }) {
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

  const clip = visibleClip(
    { x: rect.x + rect.width / 2 - 20, y: rect.y - BAND, width: 40, height: BAND * 2 },
    page.viewportSize(),
  );
  if (clip === null) {
    findings.push(`${scheme} · ${label}: Kante liegt nicht im Fenster`);
    return;
  }

  const image = decodePng(await page.screenshot({ clip }));
  let best = 1;
  for (let y = 1; y < image.height; y++) {
    best = Math.max(best, contrast(rowColour(image, y - 1), rowColour(image, y)));
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
  const HARD = [
    { name: 'Signal-Orange', colour: '#f05a28' },
    { name: 'Tinte', colour: '#171614' },
    { name: 'Papier', colour: '#f5f3ef' },
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

  /* ── 6. Die Kanten des Geräts ───────────────────────────────────────────
     Bis V6 gab es zwei Flächenebenen, und der Abstand zwischen ihnen war 1,11:1
     — das ist kein Tonunterschied mehr, das ist ein Verdacht. V7 hat daraus
     drei gemacht (Werkbank, Gehäuse, Panels), und hier steht die Zusage dazu:

       Panel  auf  Gehäuse    das Bedienfeld hebt sich vom Gerät ab
       Gehäuse auf Werkbank   das Gerät hebt sich vom Tisch ab

     1,25 ist keine WCAG-Schwelle — für zwei aneinandergrenzende Flächen gibt es
     keine. Es ist die Zahl, die dieses Projekt sich gibt, und sie ist von unten
     begründet: 1,11 war nachweislich zu wenig, denn genau daran hat sich der
     V7-Auftrag gestört. */
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  await measureEdge(page, {
    scheme,
    label: 'Kante: Panel auf Gehaeuse',
    selector: '#zone-codes .zone__body',
  });
  await measureEdge(page, {
    scheme,
    label: 'Kante: Gehaeuse auf Werkbank',
    selector: '.device',
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
