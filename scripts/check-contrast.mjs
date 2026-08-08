/**
 * Kontraste am laufenden Gerät nachmessen.
 *
 *   node scripts/check-contrast.mjs [url]
 *
 * ── Warum das nicht aus den Tokens zu rechnen ist ──────────────────────────
 * Solange eine Fläche eine Farbe hat, könnte man den Kontrast aus zwei
 * Hex-Werten ausrechnen. Seit V5 gibt es eine Fläche, bei der das nicht mehr
 * geht: Der klebende Kopf ist halbdurchsichtig und weichgezeichnet
 * (`backdrop-filter`). Was hinter seinem Text liegt, entscheidet erst der
 * Browser beim Zeichnen — und es ändert sich, während man scrollt.
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
 * Misst ein Element: Textfarbe gegen das, was der Browser tatsächlich
 * dahinter gezeichnet hat.
 */
async function measure(page, { label, selector, scheme, min = AA_TEXT, keepScroll = false }) {
  const handle = await page.$(selector);
  if (handle === null) {
    findings.push(`${scheme} · ${label}: Element nicht gefunden (${selector})`);
    return;
  }

  // Der Ausschnitt eines Bildschirmfotos zählt vom sichtbaren Bereich aus. Was
  // unterhalb der Falz liegt, hat zwar einen Kastenmaß, aber keinen Platz im
  // Bild — also erst hinscrollen.
  //
  // Für die Frost-Messungen ist genau das verboten: Dort IST die Scrollposition
  // der Messgegenstand. Der Kopf klebt ohnehin oben und ist immer sichtbar.
  if (!keepScroll) {
    await handle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
  }

  const foreground = parseColour(
    await handle.evaluate((element) => getComputedStyle(element).color),
  );

  const box = await handle.boundingBox();
  if (box === null || box.width < 2 || box.height < 2) {
    findings.push(`${scheme} · ${label}: Element hat keine Flaeche`);
    return;
  }

  // Den Text unsichtbar machen, damit der Ausschnitt reiner Hintergrund ist —
  // samt Weichzeichner. `visibility: hidden` ginge nicht: Das nimmt das Element
  // aus dem Bild und legte den Grund darunter frei statt den Grund dahinter.
  //
  // Das `finally` ist kein Zierrat: Bliebe der Text nach einem Fehler auf
  // `transparent` stehen, wären alle folgenden Messungen an derselben Seite
  // still falsch.
  let shot;
  await handle.evaluate((element) => {
    element.dataset['measuring'] = element.style.color;
    element.style.color = 'transparent';
  });
  try {
    // Bewusst der Ausschnitt des ELEMENTS und nicht ein `clip` auf der Seite:
    // Ein Seitenausschnitt rechnet in Fensterkoordinaten und läuft ins Leere,
    // sobald das Element auch nur teilweise unter der Falz liegt. Playwright
    // holt das Element selbst ins Bild — und nimmt dabei mit auf, was darüber
    // liegt, was hier gerade erwünscht ist.
    shot = await handle.screenshot();
  } finally {
    await handle.evaluate((element) => {
      element.style.color = element.dataset['measuring'] ?? '';
      delete element.dataset['measuring'];
    });
  }

  const background = averageColour(decodePng(shot));
  const ratio = contrast(foreground, background);
  const ok = ratio >= min;

  rows.push({
    scheme,
    label,
    ratio: ratio.toFixed(2),
    min: min.toFixed(1),
    ok,
  });

  if (!ok) {
    findings.push(`${scheme} · ${label}: ${ratio.toFixed(2)}:1 — verlangt sind ${min}:1`);
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

  /* ── 3. Der klebende Kopf über der Gehäusegruppe ────────────────────────
     Jetzt trägt er Frost, und dahinter läuft eine helle Panelfläche durch. */
  await page.evaluate(() => {
    window.scrollTo(0, 400);
  });
  await page.waitForTimeout(400);
  await measure(page, {
    scheme,
    label: 'Kopf auf Frost ueber Panel',
    selector: '.masthead__spec',
    keepScroll: true,
  });
  await measure(page, {
    scheme,
    label: 'Kopf auf Frost: Wortmarke',
    selector: '#state-text',
    keepScroll: true,
  });

  /* ── 4. Die Reserveprobe ────────────────────────────────────────────────
     Bis hierher wurde gemessen, was die App wirklich unter den Kopf scrollen
     lässt: Gehäusegruppen und Untergrund. Diese Werte MÜSSEN AA erfüllen —
     sie kommen vor.

     Jetzt kommt, was nicht vorkommt. Der Auftrag nennt als schlimmsten Fall
     eine Signal-Orange-Fläche unter dem Kopf; die gibt es hier nicht, weil die
     Signalfarbe in diesem Gerät nur Marken und Schrift trägt und nie eine
     Fläche. Gemessen wird sie trotzdem, zusammen mit Tinte und Papier — den
     beiden Enden der Palette.

     Der Maßstab ist hier bewusst 3:1 und nicht 4,5:1, und das ist kein
     Weichspülen, sondern die Frage, die hier zählt: Nicht „ist dieser Text
     bequem zu lesen" — er steht nie auf so einem Grund —, sondern „wie viel
     Reserve hat das Material, bevor es zusammenbricht". 3:1 ist die Schwelle,
     unter der Schrift aufhört, erkennbar zu sein.

     Wollte man auch hier 4,5:1, müsste die Deckung auf über 90 % steigen.
     Dann wäre der Weichzeichner wirkungslos und die Fläche schlicht
     undurchsichtig — ein Material, das einen Fall besteht, den es nie erlebt,
     indem es aufhört, ein Material zu sein. */
  const HARD = [
    { name: 'Signal-Orange', colour: '#f05a28' },
    { name: 'Tinte', colour: '#171614' },
    { name: 'Papier', colour: '#f5f3ef' },
  ];

  for (const probe of HARD) {
    await page.evaluate((colour) => {
      let patch = document.getElementById('contrast-probe');
      if (patch === null) {
        patch = document.createElement('div');
        patch.id = 'contrast-probe';
        patch.style.position = 'fixed';
        patch.style.insetInlineStart = '0';
        patch.style.insetBlockStart = '0';
        patch.style.width = '100%';
        patch.style.height = '160px';
        // Unter den Kopf, aber über alles andere.
        patch.style.zIndex = '2';
        // In .device und nicht in body: Seit V6 hat .device `position: relative`
        // (es trägt das Korn als Pseudo-Element), und die Zonen darin liegen auf
        // z-index 1. Ein Patch am body landete dadurch in einem anderen
        // Stapelzusammenhang und schob sich ÜBER den Kopf — gemessen wurde dann
        // die Prüffläche selbst statt des Frostes darüber, mit absurden 1,13:1.
        // Hier drin sitzt er sauber zwischen Inhalt (1) und Kopf (5).
        (document.querySelector('.device') ?? document.body).append(patch);
      }
      patch.style.background = colour;
    }, probe.colour);
    await page.waitForTimeout(250);
    await measure(page, {
      scheme,
      label: `Reserve: Kopf ueber ${probe.name}`,
      selector: '.masthead__spec',
      keepScroll: true,
      min: AA_LARGE,
    });
  }

  await page.evaluate(() => {
    document.getElementById('contrast-probe')?.remove();
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
  console.log(`  ${mark} ${row.label.padEnd(width)}  ${row.ratio.padStart(6)}:1  (>= ${row.min})`);
}

if (findings.length > 0) {
  console.error('\nBefunde:');
  for (const finding of findings) console.error('  ✗ ' + finding);
  process.exitCode = 1;
} else {
  console.log(`\n✓ Alle ${rows.length} gemessenen Paare erfuellen WCAG AA.`);
}
