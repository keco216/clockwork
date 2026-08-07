/**
 * Erzeugt App-Icons und Favicon aus dem C-Werk.
 *
 * ── Motiv ──────────────────────────────────────────────────────────────────
 * `branding/clockwork-logo-b-cwerk.svg`, Rolle laut Markenhandbuch: App-Icon,
 * Favicon und Monogramm — am kleinsten am stärksten. Die Vorlage besteht aus
 * drei Bauteilen mit exakt vermessener Geometrie (Mittelpunkt 240/158):
 *
 *   Hemmungszähne  21 Striche, 12° Schritt, Radius 88 → 100, Stärke 4,6.
 *                  Sie stehen von 60° bis 300°; rechts bleibt eine Lücke von
 *                  120° — dort ist das Maul.
 *   Werkbrücke     Kreisbogen, Radius 62, Stärke 30, Lücke von −42° bis +42°.
 *   Lager          Kreis r = 8,5 auf Radius 62 bei 0° — mitten im Maul.
 *
 * Alle Maße unten sind auf den Außenradius 100 normiert und werden mit der
 * Icon-Größe skaliert. Nichts ist neu erfunden.
 *
 * ── Warum von Hand und nicht mit sharp/resvg ───────────────────────────────
 * Beide wären native Pakete mit zusammen über 50 MB — für vier Bilder aus einem
 * Bogen, ein paar Strichen und einem Punkt. Diese drei Formen lassen sich mit je
 * einem Punkt-in-Form-Test direkt in einen RGBA-Puffer schreiben, und PNG kann
 * Node mit seinem eingebauten `zlib` selbst schreiben.
 *
 * Kantenglättung über 3×3-Überabtastung: Ein Bogen ohne sie sähe an den Rändern
 * aus wie eine Treppe, und „nichts weichzeichnen" meint präzise Geometrie, nicht
 * harte Pixelkanten.
 */

import { deflateSync, crc32 } from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public');

/* ── Markenpalette ───────────────────────────────────────────────────────── */
const TINTE = [0x17, 0x16, 0x14];
const PAPIER = [0xf5, 0xf3, 0xef];
const NACHT = [0x13, 0x12, 0x10];
const SIGNAL = [0xf0, 0x5a, 0x28];

/* ── Geometrie, normiert auf Außenradius 100 ─────────────────────────────── */
const TEETH_COUNT = 21;
const TEETH_STEP_DEG = 12;
const TEETH_START_DEG = 60; // von hier gegen den Uhrzeigersinn bis 300°
const TEETH_INNER = 88 / 100;
const TEETH_OUTER = 100 / 100;
const TEETH_WIDTH = 4.6 / 100;

const BRIDGE_RADIUS = 62 / 100;
const BRIDGE_WIDTH = 30 / 100;
const BRIDGE_GAP_DEG = 42; // Maul: −42° … +42°

const BEARING_RADIUS = 8.5 / 100;

const SUPERSAMPLE = 3;

/** Winkeldifferenz in Grad, normiert auf −180 … +180. */
function angleDelta(a, b) {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

/**
 * Baut die Formliste für eine Icon-Größe.
 *
 * @param size      Kantenlänge in Pixeln
 * @param safeZone  Anteil der Fläche, den der Inhalt einnehmen darf. Maskierbare
 *                  Icons werden von Android-Launchern bis zu 20 % ringsum
 *                  beschnitten — dort deutlich kleiner.
 * @param inkColor  Farbe von Zähnen und Brücke
 */
function buildShapes(size, safeZone, inkColor) {
  const centre = size / 2;
  const scale = (size / 2) * safeZone;
  const shapes = [];

  for (let i = 0; i < TEETH_COUNT; i++) {
    shapes.push({
      kind: 'tooth',
      angle: TEETH_START_DEG + i * TEETH_STEP_DEG,
      inner: TEETH_INNER * scale,
      outer: TEETH_OUTER * scale,
      halfWidth: (TEETH_WIDTH * scale) / 2,
      colour: inkColor,
    });
  }

  shapes.push({
    kind: 'bridge',
    radius: BRIDGE_RADIUS * scale,
    halfWidth: (BRIDGE_WIDTH * scale) / 2,
    gap: BRIDGE_GAP_DEG,
    colour: inkColor,
  });

  shapes.push({
    kind: 'bearing',
    x: centre + BRIDGE_RADIUS * scale,
    y: centre,
    radius: BEARING_RADIUS * scale,
    colour: SIGNAL,
  });

  return { shapes, centre };
}

/** Liegt (x, y) in der Form? */
function hits(shape, x, y, centre) {
  const dx = x - centre;
  const dy = y - centre;

  switch (shape.kind) {
    case 'tooth': {
      // In das lokale System des Strichs drehen: entlang der Achse muss der
      // Punkt zwischen Innen- und Außenradius liegen, quer dazu innerhalb der
      // halben Strichstärke. Das ergibt automatisch stumpfe Enden.
      const radians = (shape.angle * Math.PI) / 180;
      const along = dx * Math.cos(radians) + dy * Math.sin(radians);
      const across = -dx * Math.sin(radians) + dy * Math.cos(radians);
      return along >= shape.inner && along <= shape.outer && Math.abs(across) <= shape.halfWidth;
    }
    case 'bridge': {
      const distance = Math.hypot(dx, dy);
      if (Math.abs(distance - shape.radius) > shape.halfWidth) return false;
      // Das Maul ist ein Winkelbereich um 0°. Der Test schneidet den Bogen exakt
      // an der Winkelkante ab — ebenfalls stumpf, keine runde Kappe.
      const degrees = (Math.atan2(dy, dx) * 180) / Math.PI;
      return Math.abs(angleDelta(degrees, 0)) > shape.gap;
    }
    case 'bearing':
      return Math.hypot(x - shape.x, y - shape.y) <= shape.radius;
    default:
      return false;
  }
}

/** Zeichnet das Motiv in einen RGBA-Puffer. */
function render(size, safeZone, ground, inkColor) {
  const { shapes, centre } = buildShapes(size, safeZone, inkColor);
  const pixels = Buffer.alloc(size * size * 4);
  const step = 1 / SUPERSAMPLE;
  const samples = SUPERSAMPLE * SUPERSAMPLE;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      // Pro Form zählen, wie viele Teilproben getroffen werden — daraus ergibt
      // sich die Deckung und damit die Kantenglättung.
      let r = ground[0];
      let g = ground[1];
      let b = ground[2];

      for (const shape of shapes) {
        let inside = 0;
        for (let sy = 0; sy < SUPERSAMPLE; sy++) {
          for (let sx = 0; sx < SUPERSAMPLE; sx++) {
            if (hits(shape, px + (sx + 0.5) * step, py + (sy + 0.5) * step, centre)) inside++;
          }
        }
        if (inside === 0) continue;
        const alpha = inside / samples;
        r = Math.round(r * (1 - alpha) + shape.colour[0] * alpha);
        g = Math.round(g * (1 - alpha) + shape.colour[1] * alpha);
        b = Math.round(b * (1 - alpha) + shape.colour[2] * alpha);
      }

      const offset = (py * size + px) * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 0xff;
    }
  }

  return pixels;
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

function encodePng(pixels, size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // Bit-Tiefe
  header[9] = 6; // Farbtyp 6 = RGBA
  header[10] = 0; // Kompression (immer 0)
  header[11] = 0; // Filterverfahren (immer 0)
  header[12] = 0; // kein Interlacing

  // Jede Bildzeile bekommt ein Filter-Byte vorangestellt; 0 heißt „unverändert".
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let row = 0; row < size; row++) {
    const target = row * (size * 4 + 1);
    raw[target] = 0;
    pixels.copy(raw, target + 1, row * size * 4, (row + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Dasselbe Motiv als SVG — beliebig skalierbar, für Manifest und Vorschau. */
function buildSvg(ground, ink) {
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  const centre = 50;
  const scale = 50 * 0.78;
  const teeth = [];
  for (let i = 0; i < TEETH_COUNT; i++) {
    const a = ((TEETH_START_DEG + i * TEETH_STEP_DEG) * Math.PI) / 180;
    const x1 = centre + Math.cos(a) * TEETH_INNER * scale;
    const y1 = centre + Math.sin(a) * TEETH_INNER * scale;
    const x2 = centre + Math.cos(a) * TEETH_OUTER * scale;
    const y2 = centre + Math.sin(a) * TEETH_OUTER * scale;
    teeth.push(
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke-width="${(TEETH_WIDTH * scale).toFixed(2)}"/>`,
    );
  }
  const r = BRIDGE_RADIUS * scale;
  const gapRad = (BRIDGE_GAP_DEG * Math.PI) / 180;
  const sx = centre + Math.cos(gapRad) * r;
  const sy = centre + Math.sin(gapRad) * r;
  const ex = centre + Math.cos(-gapRad) * r;
  const ey = centre + Math.sin(-gapRad) * r;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<rect width="100" height="100" fill="${hex(ground)}"/>` +
    `<g stroke="${hex(ink)}" fill="none">${teeth.join('')}` +
    `<path d="M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}" stroke-width="${(BRIDGE_WIDTH * scale).toFixed(2)}"/>` +
    `</g>` +
    `<circle cx="${(centre + r).toFixed(2)}" cy="${centre}" r="${(BEARING_RADIUS * scale).toFixed(2)}" fill="${hex(SIGNAL)}"/>` +
    `</svg>\n`
  );
}

await mkdir(outDir, { recursive: true });

/*
 * Grundfarbe: Das Markenhandbuch verlangt, dunklen Grund und Signal-Grund zu
 * testen und die bessere Variante zu nehmen. Ergebnis: Nacht.
 *
 * Auf Signal-Orange müsste das Werk in Tinte stehen — dann konkurriert die
 * Fläche mit jedem anderen bunten Icon auf dem Homescreen, und das Lager, der
 * einzige Signalpunkt der Marke, verschwindet im Grund. Auf Nacht bleibt die
 * Regel „genau ein Akzent" sichtbar: ein orangener Punkt auf ruhigem Grund.
 * Beide Varianten liegen unter public/ — icon-alt-signal.png ist die verworfene.
 */
const targets = [
  { file: 'icon-192.png', size: 192, safeZone: 0.78, ground: NACHT, ink: PAPIER },
  { file: 'icon-512.png', size: 512, safeZone: 0.78, ground: NACHT, ink: PAPIER },
  { file: 'icon-maskable-512.png', size: 512, safeZone: 0.6, ground: NACHT, ink: PAPIER },
  { file: 'icon-alt-signal.png', size: 256, safeZone: 0.78, ground: SIGNAL, ink: TINTE },
];

for (const { file, size, safeZone, ground, ink } of targets) {
  const png = encodePng(render(size, safeZone, ground, ink), size);
  await writeFile(path.join(outDir, file), png);
  console.log(`  ${file.padEnd(24)} ${size}×${size}  ${(png.length / 1024).toFixed(1)} kB`);
}

await writeFile(path.join(outDir, 'icon.svg'), buildSvg(NACHT, PAPIER), 'utf8');
console.log('  icon.svg');
