/**
 * Panels mit 8-px-Raster fotografieren.
 *
 *   node scripts/shoot-grid.mjs <vorher|nachher> [url]
 *
 * ── Warum ein Raster über dem Bild ─────────────────────────────────────────
 * Weil man Abstände nicht ansieht, sondern zählt. Ein Panel kann „aufgeräumt"
 * wirken und trotzdem sieben verschiedene Lücken haben; und zwei Lücken, die
 * gleich aussehen, sind es oft nicht. Mit einem Raster darüber ist beides in
 * einem Blick entschieden: Eine Kante liegt auf einer Linie, oder sie liegt
 * daneben.
 *
 * Das Raster hängt am Panel, nicht am Fenster. Sonst zeigte es, wie das Panel
 * zum Bildschirm steht — interessant ist, wie sein Inhalt zu ihm selbst steht.
 * Nullpunkt ist deshalb die linke obere Ecke des Panels.
 *
 * Jede achte Linie ist kräftiger (also alle 64 px, die größte Sprosse der
 * Skala): Ohne diese Betonung zählt man auf einem Bild mit 40 Linien nicht mehr
 * mit, und genau das Zählen ist der Zweck.
 *
 * ── Warum zwei Läufe und nicht ein Vergleichsbild ──────────────────────────
 * Weil dazwischen der Quelltext geändert wird. Dasselbe Verfahren wie bei
 * scripts/shoot-compare.mjs: einmal vorher aufrufen, dann arbeiten, dann
 * nachher — die Bilder landen im selben Ordner und heißen gleich bis auf das
 * Präfix.
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const side = process.argv[2];
if (side !== 'vorher' && side !== 'nachher') {
  throw new Error('Erstes Argument muss »vorher« oder »nachher« sein');
}
const url = process.argv[3] ?? 'http://localhost:5180';
const outDir = path.resolve('screenshots');
await mkdir(outDir, { recursive: true });

/* Drei Konten: genug für eine Karte mit Nachbarn, wenig genug, dass jedes Panel
   auf ein Bild passt. Das dritte ist achtstellig mit 60-Sekunden-Periode — der
   Fall, an dem die Kartengeometrie am engsten wird. */
const DEMO = [
  'otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
  'GitHub: jbsw y3dp ehpk 3pxp',
  'otpauth://totp/Google:kevin@example.com?secret=GEZDGNBVGY3TQOJQ&issuer=Google&algorithm=SHA256&digits=8&period=60',
].join('\n');

const PANELS = [
  { name: 'eingabe', selector: '#zone-input' },
  { name: 'tresor', selector: '#zone-vault' },
  { name: 'codes', selector: '#zone-codes' },
  { name: 'karte', selector: '.strip' },
  { name: 'kopf', selector: '.masthead' },
  { name: 'fuss', selector: '.colophon' },
];

/** Legt das Raster über ein Element und gibt sein Kastenmaß zurück. */
const OVERLAY = (selector) => {
  const target = document.querySelector(selector);
  if (target === null) return null;

  const box = target.getBoundingClientRect();
  const grid = document.createElement('div');
  grid.id = 'raster';
  grid.style.position = 'fixed';
  grid.style.insetInlineStart = `${box.x}px`;
  grid.style.insetBlockStart = `${box.y}px`;
  grid.style.width = `${box.width}px`;
  grid.style.height = `${box.height}px`;
  grid.style.zIndex = '99999';
  grid.style.pointerEvents = 'none';
  // Zwei Raster übereinander: das feine alle 8 px, das kräftige alle 64.
  // `repeating-linear-gradient` mit harten Stops ist ein Muster, kein Verlauf —
  // dieselbe Technik wie die Tick-Teilung im Fuß.
  grid.style.backgroundImage = [
    'repeating-linear-gradient(to right, rgb(240 90 40 / 55%) 0 1px, transparent 1px 64px)',
    'repeating-linear-gradient(to bottom, rgb(240 90 40 / 55%) 0 1px, transparent 1px 64px)',
    'repeating-linear-gradient(to right, rgb(240 90 40 / 22%) 0 1px, transparent 1px 8px)',
    'repeating-linear-gradient(to bottom, rgb(240 90 40 / 22%) 0 1px, transparent 1px 8px)',
  ].join(',');
  document.body.append(grid);
  return { x: box.x, y: box.y, width: box.width, height: box.height };
};

const browser = await chromium.launch();

for (const scheme of ['light', 'dark']) {
  for (const panel of PANELS) {
    const context = await browser.newContext({
      // 1450 px ist die Breite, bei der der Fehlerbericht entstand: Rail und
      // einspaltige Bühne, also der Alltagsfall.
      viewport: { width: 1450, height: 1200 },
      colorScheme: scheme,
      deviceScaleFactor: 2,
      locale: 'de-DE',
    });
    const page = await context.newPage();
    await page.goto(`${url}#lang=de`, { waitUntil: 'networkidle' });
    await page.fill('#secrets', DEMO);
    await page.waitForTimeout(700);

    // Der Tresor muss auf sein, sonst ist das Panel eine Zeile hoch.
    await page.evaluate(() => {
      const disclosure = document.querySelector('#vault-disclosure');
      if (disclosure !== null) disclosure.open = true;
    });
    await page.waitForTimeout(250);

    const box = await page.evaluate(OVERLAY, panel.selector);
    if (box === null) {
      console.error(`  ✗ ${panel.name}: ${panel.selector} nicht gefunden`);
      await context.close();
      continue;
    }

    // Etwas Luft ringsum, damit die Panelkante selbst im Bild ist.
    const PAD = 12;
    const viewport = page.viewportSize();
    const clip = {
      x: Math.max(0, Math.floor(box.x - PAD)),
      y: Math.max(0, Math.floor(box.y - PAD)),
      width: Math.min(viewport.width, Math.ceil(box.width + PAD * 2)),
      height: Math.min(viewport.height, Math.ceil(box.height + PAD * 2)),
    };

    const file = path.join(outDir, `50-raster-${side}-${panel.name}-${scheme}.png`);
    await page.screenshot({ path: file, clip });
    console.log('  ' + path.relative(process.cwd(), file));
    await context.close();
  }
}

await browser.close();
