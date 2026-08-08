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
 * das Skript seinen eigenen Aufbau: Die Gegenprobe (Abschnitt 5) schwächt den
 * Frost absichtlich auf 30 % und verlangt, dass die Probe DURCHFÄLLT. Ein
 * Messgerät, das auch dann noch grün meldet, misst nicht das, was es soll.
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
 *
 * `expectFail` dreht das Urteil um: Dann gilt die Zeile als bestanden, wenn der
 * Wert UNTER dem Maß liegt. Das braucht die Gegenprobe, die nachweist, dass das
 * Skript den Frost überhaupt sieht.
 */
async function measure(
  page,
  { label, selector, scheme, min = AA_TEXT, keepScroll = false, expectFail = false },
) {
  const handle = await page.$(selector);
  if (handle === null) {
    findings.push(`${scheme} · ${label}: Element nicht gefunden (${selector})`);
    return null;
  }

  // Ein Seitenausschnitt zählt vom sichtbaren Bereich aus. Was unterhalb der
  // Falz liegt, hat zwar ein Kastenmaß, aber keinen Platz im Bild — also erst
  // hinscrollen.
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
  const ok = expectFail ? ratio < min : ratio >= min;

  rows.push({
    scheme,
    label,
    ratio: ratio.toFixed(2),
    min: min.toFixed(1),
    expectFail,
    ok,
  });

  if (!ok) {
    findings.push(
      expectFail
        ? `${scheme} · ${label}: ${ratio.toFixed(2)}:1 — mit halb durchsichtigem Kopf MUSS die Probe unter ${min}:1 fallen. Tut sie das nicht, misst das Skript den Frost nicht mit.`
        : `${scheme} · ${label}: ${ratio.toFixed(2)}:1 — verlangt sind ${min}:1`,
    );
  }

  return ratio;
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

  // Die Messregion verifizieren, bevor irgendetwas gemessen wird. Ohne diesen
  // Griff steht in der Ausgabe eine ordentliche Zahl, die eine ganz andere
  // Fläche beschreibt: Trägt der Kopf kein Material, misst „Kopf auf Frost"
  // schlicht den Untergrund — und meldet dafür anstandslos AA. Genau so blieb
  // der Messfehler aus V6 ein halbes Release lang unsichtbar.
  const grip = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    lifted: document.querySelector('.masthead')?.classList.contains('masthead--lifted') ?? false,
  }));
  if (!grip.lifted) {
    findings.push(
      `${scheme} · Messaufbau: Der Kopf traegt bei y=${grip.y} kein Frost-Material — alle Frost-Werte darunter sind wertlos.`,
    );
  }

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

  let orange = null;

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
    if (probe.name === 'Signal-Orange') orange = ratio;
  }

  /* ── 5. Die Gegenprobe: misst dieses Skript den Frost überhaupt? ─────────
     Alles bis hierher ist eine Behauptung über eine Fläche, die es ohne den
     Browser gar nicht gibt. Wenn der Messaufbau kaputtgeht, bricht er nicht
     laut zusammen — er liefert weiter Zahlen, nur eben von der falschen
     Fläche. Genau das ist in V6 passiert, und genau deshalb steht hier eine
     Probe, die durchfallen MUSS.

     Der Frost wird auf 30 % Deckung geschwächt. Eine so dünne Fläche kann
     Signal-Orange nicht mehr tragen; sie muss unter 3:1 rutschen. Tut sie das
     nicht, sieht das Skript den Kopf nicht — dann sind auch alle grünen Zeilen
     darüber wertlos, und diese Zeile ist die einzige, die das merkt.

     ── Warum 30 % und nicht 50 % ─────────────────────────────────────────
     Weil 50 % nachgemessen nicht reichen. Die Kurve über Signal-Orange, hell:

       78 % → 4,81   60 % → 3,81   50 % → 3,37   40 % → 2,98   30 % → 2,65
                                                  0 % → 2,04

     Bei 50 % steht der helle Kopf noch bei 3,37:1 — er BESTEHT die Probe, und
     eine Gegenprobe, die besteht, beweist nichts. Erst unter 40 % fällt sie in
     beiden Themes durch, und 30 % lässt genug Luft, dass eine spätere
     Palettenänderung sie nicht zufällig wieder über die Schwelle hebt.

     Die 0 %-Zeile derselben Reihe ist der Beweis in die andere Richtung: 2,04
     hell und 1,15 dunkel sind exakt die Werte, die das kaputte Skript vorher
     lieferte. Es hat also nicht „ungenau" gemessen — es hat den Kopf gar nicht
     gesehen.

     Der Wert wird auf dem Wurzelelement gesetzt und danach wieder entfernt:
     Das Theme selbst (styles/tokens.css) bleibt unberührt, und die nächste
     Sitzung im selben Browser misst wieder das echte Material. */
  const frost = await page.evaluate(() => {
    const root = document.documentElement;
    // Ein nicht angemeldetes Custom Property kommt so zurück, wie es notiert
    // wurde — hier also `rgb(245 243 239 / 78%)`. Die vierte Zahl ist die
    // Deckung; sie wird nur gelesen, damit der Bericht sagen kann, wovon er
    // ausgeht, statt eine Zahl aus der Doku zu wiederholen.
    const numbers = getComputedStyle(root)
      .getPropertyValue('--frost-surface')
      .match(/[\d.]+/g);
    const [r, g, b, alpha] = numbers ?? ['0', '0', '0', '100'];
    root.style.setProperty('--frost-surface', `rgb(${r} ${g} ${b} / 30%)`);
    return Math.round(Number(alpha) <= 1 ? Number(alpha) * 100 : Number(alpha));
  });
  await setProbe('#f05a28');
  await page.waitForTimeout(300);
  const thin = await measure(page, {
    scheme,
    label: `Gegenprobe: 30 % statt ${frost} % Deckung`,
    selector: '.masthead__spec',
    keepScroll: true,
    min: AA_LARGE,
    expectFail: true,
  });

  // Die zweite Hälfte des Beweises, und die eigentlich tragende: Der Wert muss
  // sich beim Verdünnen ÜBERHAUPT bewegen. Eine feste Schwelle könnte eine
  // Palettenänderung eines Tages von allein unterschreiten; ein Abstand kann
  // das nicht. Bleibt er aus, misst das Skript eine Fläche, an der der Kopf
  // nichts ändert — also nicht den Kopf.
  if (orange !== null && thin !== null && orange - thin < 1) {
    findings.push(
      `${scheme} · Messaufbau: Verduennen des Frostes von ${frost} % auf 30 % aendert den Wert nur um ${(orange - thin).toFixed(2)} — der Kopf geht in diese Messung nicht ein.`,
    );
  }

  await page.evaluate(() => {
    document.documentElement.style.removeProperty('--frost-surface');
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
  // Die Gegenprobe hat das umgekehrte Ziel — sie soll darunter liegen. Stünde
  // dort dasselbe „>=" wie überall, läse sich eine bestandene Zeile wie ein
  // Widerspruch.
  const aim = row.expectFail ? `<  ${row.min}` : `>= ${row.min}`;
  console.log(`  ${mark} ${row.label.padEnd(width)}  ${row.ratio.padStart(6)}:1  (${aim})`);
}

const proofs = rows.filter((row) => row.expectFail).length;

if (findings.length > 0) {
  console.error('\nBefunde:');
  for (const finding of findings) console.error('  ✗ ' + finding);
  process.exitCode = 1;
} else {
  console.log(
    `\n✓ Alle ${rows.length - proofs} gemessenen Paare erfuellen WCAG AA.` +
      `\n✓ ${proofs} Gegenproben zeigen, dass dabei wirklich der Frost gemessen wurde.`,
  );
}
