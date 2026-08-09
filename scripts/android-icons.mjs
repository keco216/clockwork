/**
 * Erzeugt die Android-Ressourcen des Capacitor-Wraps aus dem C-Werk:
 * Launcher-Icons (eckig, rund, adaptive Vordergrund-Ebene) und die
 * Splash-Flächen. Ersetzt die Capacitor-Platzhalter unter
 * `android/app/src/main/res/` — das Ergebnis ist eingecheckt, das Skript
 * läuft in `npm run android` trotzdem jedes Mal mit: Es schreibt
 * deterministisch dieselben Bytes, und so kann der Stand nicht veralten.
 *
 * Die Geometrie ist dieselbe wie in `scripts/icons.mjs` — vermessen aus
 * `branding/clockwork-logo-b-cwerk.svg`, dort im Kopfkommentar hergeleitet.
 * Beide Skripte sind absichtlich selbstständig statt über ein gemeinsames
 * Modul verbunden, wie auch og-image.mjs seinen PNG-Schreiber selbst trägt:
 * Jedes Skript bleibt allein lesbar, und die Quelle der Wahrheit ist die
 * vermessene SVG-Vorlage, nicht ein drittes Modul.
 *
 * Zwei Android-Eigenheiten, die die Größen erklären:
 *
 *   - Adaptive Icons (API 26+) sind zwei EBENEN: eine Grundfarbe (steht als
 *     `@color/ic_launcher_background` in values/) und ein Vordergrund-PNG von
 *     108 dp, von dem Launcher bis zu 20 % ringsum abschneiden. Das Werk
 *     bekommt darum 60 % der Kante — dieselbe Schutzzone wie beim maskierbaren
 *     PWA-Icon in icons.mjs.
 *   - Die eckigen und runden Legacy-Icons (48 dp) sieht nur, wer älter als
 *     API 26 ist; sie tragen das Werk in 78 % wie die PWA-Icons.
 */

import { deflateSync, crc32 } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res');

/* ── Markenpalette ───────────────────────────────────────────────────────── */
const PAPIER = [0xf5, 0xf3, 0xef];
const NACHT = [0x13, 0x12, 0x10];
const SIGNAL = [0xf0, 0x5a, 0x28];

/* ── Geometrie, normiert auf Außenradius 100 (wie icons.mjs) ─────────────── */
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

const SUPERSAMPLE = 3;

function angleDelta(a, b) {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

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

function hits(shape, x, y, centre) {
  const dx = x - centre;
  const dy = y - centre;

  switch (shape.kind) {
    case 'tooth': {
      const radians = (shape.angle * Math.PI) / 180;
      const along = dx * Math.cos(radians) + dy * Math.sin(radians);
      const across = -dx * Math.sin(radians) + dy * Math.cos(radians);
      return along >= shape.inner && along <= shape.outer && Math.abs(across) <= shape.halfWidth;
    }
    case 'bridge': {
      const distance = Math.hypot(dx, dy);
      if (Math.abs(distance - shape.radius) > shape.halfWidth) return false;
      const degrees = (Math.atan2(dy, dx) * 180) / Math.PI;
      return Math.abs(angleDelta(degrees, 0)) > shape.gap;
    }
    case 'bearing':
      return Math.hypot(x - shape.x, y - shape.y) <= shape.radius;
    default:
      return false;
  }
}

/**
 * Zeichnet das Motiv in einen RGBA-Puffer — anders als in icons.mjs mit
 * echtem Alphakanal, denn zwei der drei Icon-Sorten brauchen Durchsicht:
 * die adaptive Vordergrund-Ebene (Grund kommt als eigene Ebene vom System)
 * und das runde Legacy-Icon (außerhalb der Scheibe liegt nichts).
 *
 * @param size      Kantenlänge in Pixeln
 * @param safeZone  Anteil der Kante, den das Werk einnimmt
 * @param ground    Grundfarbe oder null für durchsichtig
 * @param disc      true = Grund ist die einbeschriebene Scheibe, kein Quadrat
 */
function render(size, { safeZone, ground = null, disc = false }) {
  const { shapes, centre } = buildShapes(size, safeZone, PAPIER);
  const pixels = Buffer.alloc(size * size * 4);
  const step = 1 / SUPERSAMPLE;
  const samples = SUPERSAMPLE * SUPERSAMPLE;
  const discRadius = size / 2;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      if (ground) {
        // Deckung des Grunds: volle Fläche oder — beim runden Icon — die
        // überabgetastete Scheibenkante.
        let inside = samples;
        if (disc) {
          inside = 0;
          for (let sy = 0; sy < SUPERSAMPLE; sy++) {
            for (let sx = 0; sx < SUPERSAMPLE; sx++) {
              const dx = px + (sx + 0.5) * step - centre;
              const dy = py + (sy + 0.5) * step - centre;
              if (Math.hypot(dx, dy) <= discRadius) inside++;
            }
          }
        }
        [r, g, b] = ground;
        a = inside / samples;
      }

      for (const shape of shapes) {
        let inside = 0;
        for (let sy = 0; sy < SUPERSAMPLE; sy++) {
          for (let sx = 0; sx < SUPERSAMPLE; sx++) {
            if (hits(shape, px + (sx + 0.5) * step, py + (sy + 0.5) * step, centre)) inside++;
          }
        }
        if (inside === 0) continue;
        // source-over: die Form liegt über dem bisher Gemalten.
        const cover = inside / samples;
        const outA = cover + a * (1 - cover);
        r = (shape.colour[0] * cover + r * a * (1 - cover)) / outA;
        g = (shape.colour[1] * cover + g * a * (1 - cover)) / outA;
        b = (shape.colour[2] * cover + b * a * (1 - cover)) / outA;
        a = outA;
      }

      const offset = (py * size + px) * 4;
      pixels[offset] = Math.round(r);
      pixels[offset + 1] = Math.round(g);
      pixels[offset + 2] = Math.round(b);
      pixels[offset + 3] = Math.round(a * 0xff);
    }
  }

  return pixels;
}

/** Eine einfarbige Fläche — für die Splash-Bilder reicht Farbe und Maß. */
function solid(width, height, colour) {
  const pixels = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4] = colour[0];
    pixels[i * 4 + 1] = colour[1];
    pixels[i * 4 + 2] = colour[2];
    pixels[i * 4 + 3] = 0xff;
  }
  return pixels;
}

/* ── PNG schreiben (wie icons.mjs, nur mit Breite ≠ Höhe) ────────────────── */

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData) >>> 0);
  return Buffer.concat([length, typeAndData, checksum]);
}

function encodePng(pixels, width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let row = 0; row < height; row++) {
    const target = row * (width * 4 + 1);
    raw[target] = 0;
    pixels.copy(raw, target + 1, row * width * 4, (row + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ── Ziele ───────────────────────────────────────────────────────────────── */

// Dichteklassen: mdpi ist der 1×-Maßstab (48 dp Legacy-Icon, 108 dp adaptive
// Ebene), die übrigen sind feste Vielfache davon.
const DENSITIES = [
  ['mdpi', 1],
  ['hdpi', 1.5],
  ['xhdpi', 2],
  ['xxhdpi', 3],
  ['xxxhdpi', 4],
];

// Die Splash-Maße sind die des Capacitor-Templates — die Fläche ist einfarbig
// Nacht, das Maß entscheidet also nichts, aber ein 1:1-Ersatz bleibt prüfbar.
const SPLASHES = [
  ['drawable', 480, 320],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280],
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
];

let written = 0;

for (const [density, factor] of DENSITIES) {
  const legacy = Math.round(48 * factor);
  const adaptive = Math.round(108 * factor);
  const dir = path.join(resDir, `mipmap-${density}`);

  const files = [
    ['ic_launcher.png', render(legacy, { safeZone: 0.78, ground: NACHT }), legacy],
    [
      'ic_launcher_round.png',
      render(legacy, { safeZone: 0.78, ground: NACHT, disc: true }),
      legacy,
    ],
    ['ic_launcher_foreground.png', render(adaptive, { safeZone: 0.6 }), adaptive],
  ];
  for (const [file, pixels, size] of files) {
    await writeFile(path.join(dir, file), encodePng(pixels, size, size));
    written++;
  }
  console.log(`  mipmap-${density.padEnd(7)} ${legacy}/${legacy}/${adaptive} px`);
}

for (const [dir, width, height] of SPLASHES) {
  await writeFile(
    path.join(resDir, dir, 'splash.png'),
    encodePng(solid(width, height, NACHT), width, height),
  );
  written++;
}
console.log(`  splash ×${SPLASHES.length} — einfarbig Nacht`);
console.log(`✓ ${written} Android-Ressourcen geschrieben`);
