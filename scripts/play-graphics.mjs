/**
 * Erzeugt die Funktionsgrafik fuer den Play-Store-Eintrag (1024x500).
 *
 * ── Motiv ──────────────────────────────────────────────────────────────────
 * Dasselbe wie beim Vorschaubild: `branding/clockwork-logo-a-skala.svg`,
 * Zeichen A, laut Markenhandbuch das Emblem — 30 Marken fuer 30 Sekunden, die
 * Signalmarke auf 12 Uhr. Auf Nacht, weil die Grafik im Store zwischen lauter
 * bunten Kacheln steht und eine dunkle Flaeche dort ruhiger wirkt.
 *
 * Der Aussenradius ist mit 160 px etwas kleiner gehalten als beim
 * Vorschaubild (dort 200 bei 630 Hoehe, also 0,317 der Hoehe; hier 0,32 —
 * praktisch dasselbe Verhaeltnis). Zentriert steht es aus einem zweiten
 * Grund: Play beschneidet die Funktionsgrafik je nach Platzierung an den
 * Raendern, und was in der Mitte liegt, ueberlebt jeden Zuschnitt.
 *
 * ── Warum ein eigener PNG-Schreiber, und warum Farbtyp 2 ───────────────────
 * Play verlangt fuer die Funktionsgrafik ausdruecklich JPEG oder ein
 * **24-Bit-PNG ohne Alphakanal**. Die drei bestehenden Generatoren dieses
 * Projekts (icons.mjs, og-image.mjs, android-icons.mjs) schreiben alle
 * Farbtyp 6 = RGBA, weil ein Icon Transparenz braucht. Hier waere sie nicht
 * nur unnoetig, sondern regelwidrig — also Farbtyp 2 = RGB, drei Byte je
 * Pixel. Das ist der inhaltliche Grund, warum dieses Skript eigenstaendig
 * neben den anderen steht und nicht aus ihnen importiert; die drei tun es
 * untereinander aus demselben Grund nicht.
 *
 * Alles andere ist wie dort: Punkt-in-Form-Test je Strich direkt in einen
 * Puffer, 3x3-Ueberabtastung gegen Treppen an den Schraegen, PNG ueber Nodes
 * eingebautes `zlib`. Keine native Bildbibliothek fuer ein Bild aus 30
 * Strichen und einem Punkt.
 *
 * ── Deterministisch ────────────────────────────────────────────────────────
 * Kein tIME-Chunk, kein Zufall, Zeilenfilter 0 — derselbe Quellstand erzeugt
 * dieselben Bytes. Zeilenfilter 0 ist dabei kein Versaeumnis, sondern
 * gemessen der beste: Auf grossen einfarbigen Flaechen findet zlib ueber
 * identische Zeilen laengere Rueckverweise, als die Nullen eines Up-Filters
 * einbringen.
 *
 * Aufruf: `npm run play:graphics`
 */

import { deflateSync, crc32 } from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetDir = path.join(root, 'play', 'listing', 'en-US', 'images');
const target = path.join(targetDir, 'featureGraphic.png');

/* ── Markenpalette ───────────────────────────────────────────────────────── */
const NACHT = [0x13, 0x12, 0x10];
const PAPIER = [0xf5, 0xf3, 0xef];
const SIGNAL = [0xf0, 0x5a, 0x28];

/* ── Format und Geometrie ────────────────────────────────────────────────── */
const WIDTH = 1024;
const HEIGHT = 500;

/** Aussenradius des Emblems. 160 laesst oben und unten je 90 px Luft. */
const R = 160;

const MARK_COUNT = 30;
const MARK_STEP_DEG = 360 / MARK_COUNT;
const MARK_INNER = 0.8;
const MARK_OUTER = 1.0;
const MARK_WIDTH = 0.048;

const SIGNAL_INNER = 0.7;
const SIGNAL_WIDTH = 0.073;

const HUB_RADIUS = 0.052;

const SUPERSAMPLE = 3;

/**
 * Ein Strich von 12 Uhr aus im Uhrzeigersinn.
 *
 * Index 0 steht oben und ist die Signalmarke — so wie in der Vorlage. Das
 * Bildschirm-Koordinatensystem waechst nach unten, deshalb das Minus beim y.
 */
function mark(index) {
  const isSignal = index === 0;
  const rad = ((index * MARK_STEP_DEG - 90) * Math.PI) / 180;
  const inner = (isSignal ? SIGNAL_INNER : MARK_INNER) * R;
  const outer = MARK_OUTER * R;

  return {
    ax: Math.cos(rad) * inner,
    ay: Math.sin(rad) * inner,
    bx: Math.cos(rad) * outer,
    by: Math.sin(rad) * outer,
    half: ((isSignal ? SIGNAL_WIDTH : MARK_WIDTH) * R) / 2,
    colour: isSignal ? SIGNAL : PAPIER,
  };
}

const MARKS = Array.from({ length: MARK_COUNT }, (_unused, index) => mark(index));

/**
 * Liegt der Punkt auf dem Strich?
 *
 * Abstand Punkt zu Strecke, mit auf [0,1] begrenztem Lotfusspunkt. Die
 * Begrenzung ist genau das, was stumpfe Strichenden ausmacht: Ohne sie waere
 * jedes Ende halbrund, und das Markenhandbuch verlangt butt caps.
 */
function onMark(m, x, y) {
  const dx = m.bx - m.ax;
  const dy = m.by - m.ay;
  const lengthSquared = dx * dx + dy * dy;
  let t = ((x - m.ax) * dx + (y - m.ay) * dy) / lengthSquared;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const px = m.ax + t * dx - x;
  const py = m.ay + t * dy - y;
  return px * px + py * py <= m.half * m.half;
}

/** Die Farbe an einem Abtastpunkt — Emblemkoordinaten, Mittelpunkt bei 0/0. */
function sample(x, y) {
  if (x * x + y * y <= (HUB_RADIUS * R) ** 2) {
    return PAPIER;
  }
  // Aussen zuerst abschneiden: Der weit ueberwiegende Teil der Flaeche liegt
  // ausserhalb des Emblems, und dort muessen keine 30 Striche geprueft werden.
  const distanceSquared = x * x + y * y;
  if (distanceSquared > (R * 1.02) ** 2 || distanceSquared < (SIGNAL_INNER * R * 0.98) ** 2) {
    return null;
  }
  for (const m of MARKS) {
    if (onMark(m, x, y)) {
      return m.colour;
    }
  }
  return null;
}

/* ── Zeichnen ────────────────────────────────────────────────────────────── */

// Drei Byte je Pixel: Farbtyp 2 traegt keinen Alphakanal.
const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);
const centreX = WIDTH / 2;
const centreY = HEIGHT / 2;
const step = 1 / SUPERSAMPLE;

for (let row = 0; row < HEIGHT; row++) {
  for (let column = 0; column < WIDTH; column++) {
    let red = 0;
    let green = 0;
    let blue = 0;

    for (let sy = 0; sy < SUPERSAMPLE; sy++) {
      for (let sx = 0; sx < SUPERSAMPLE; sx++) {
        const x = column + (sx + 0.5) * step - centreX;
        const y = row + (sy + 0.5) * step - centreY;
        const colour = sample(x, y) ?? NACHT;
        red += colour[0];
        green += colour[1];
        blue += colour[2];
      }
    }

    const samples = SUPERSAMPLE * SUPERSAMPLE;
    const at = (row * WIDTH + column) * 3;
    pixels[at] = Math.round(red / samples);
    pixels[at + 1] = Math.round(green / samples);
    pixels[at + 2] = Math.round(blue / samples);
  }
}

/* ── PNG schreiben ───────────────────────────────────────────────────────── */

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData) >>> 0);
  return Buffer.concat([length, typeAndData, checksum]);
}

function encodePng(rgb, width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // Bit-Tiefe
  header[9] = 2; // Farbtyp 2 = RGB ohne Alpha — die Play-Vorgabe
  header[10] = 0; // Kompression (immer 0)
  header[11] = 0; // Filterverfahren (immer 0)
  header[12] = 0; // kein Interlacing

  // Jede Bildzeile bekommt ein Filter-Byte vorangestellt; 0 heisst „unveraendert".
  const stride = width * 3;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let row = 0; row < height; row++) {
    const start = row * (stride + 1);
    raw[start] = 0;
    rgb.copy(raw, start + 1, row * stride, (row + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const png = encodePng(pixels, WIDTH, HEIGHT);
await mkdir(targetDir, { recursive: true });
await writeFile(target, png);
console.log(`  featureGraphic.png  ${WIDTH}x${HEIGHT}  ${(png.length / 1024).toFixed(1)} kB`);
