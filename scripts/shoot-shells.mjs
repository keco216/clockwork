/**
 * PROTOTYP-WERKZEUG für die V7-Variantenwahl.
 *
 *   node scripts/shoot-shells.mjs [url] [ausgabeordner]
 *
 * Fotografiert den ARBEITSZUSTAND (acht Konten plus eine unlesbare Zeile) in
 * jeder Grob-Variante der neuen Shell, bei 2560 und 1440 px, dunkel. Mehr
 * nicht: Der Leerzustand, die Responsive-Kette und RTL kommen erst, wenn die
 * Variante gewählt ist — vorher wäre jede Politur an zwei Dritteln der Arbeit
 * verschwendet.
 *
 * Die Variante steht als `?shell=a|b|c` in der Adresse (siehe src/main.ts).
 * Ohne den Parameter zeigt die Seite den Stand von V6 — das ist die
 * Vergleichsaufnahme.
 *
 * Diese Datei fliegt nach der Entscheidung wieder raus, zusammen mit
 * src/styles/v7-shells.css.
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5180';
const outDir = path.resolve(process.argv[3] ?? 'screenshots/v7-varianten');
await mkdir(outDir, { recursive: true });

/* Acht Konten und eine kaputte Zeile. Acht, weil die Zielbeschreibung genau
   dort die zweite Codes-Spalte und das Filterfeld ansetzt — mit drei Konten
   sähe jede Variante gut aus. */
const DEMO = [
  'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
  'otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
  'otpauth://totp/Google:kevin@example.com?secret=GEZDGNBVGY3TQOJQ&issuer=Google&algorithm=SHA256&digits=8&period=60',
  'GitHub: jbsw y3dp ehpk 3pxp',
  'otpauth://totp/Fastmail:kevin@example.com?secret=MFRGGZDFMZTWQ2LK&issuer=Fastmail',
  'otpauth://totp/Hetzner%20Cloud:kevin@example.com?secret=NBSWY3DPEB3W64TMMQ&issuer=Hetzner%20Cloud',
  'Bitwarden: MZXW6YTBOI======',
  'otpauth://totp/Deutsche%20Bahn:kevin@example.com?secret=ONSWG4TFOQ&issuer=Deutsche%20Bahn',
  'JBSW0Y3DPEHPK3PXP',
].join('\n');

const SIZES = [
  { name: '2560', width: 2560, height: 1440 },
  { name: '1440', width: 1440, height: 900 },
];

const SHELLS = [
  { name: 'vorher', query: '' },
  { name: 'a-sidebar-links', query: '?shell=a' },
  { name: 'b-sidebar-rechts', query: '?shell=b' },
  { name: 'c-werkzeugleiste', query: '?shell=c' },
];

const browser = await chromium.launch();
const problems = [];
const shots = [];

for (const shell of SHELLS) {
  for (const size of SIZES) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      colorScheme: 'dark',
      // 1 statt 2: Bei 2560 px waere ein Bild sonst 5120 px breit, und beurteilt
      // wird hier die Komposition, nicht die Kantenschaerfe.
      deviceScaleFactor: 1,
      locale: 'de-DE',
    });
    const page = await context.newPage();
    const name = `${shell.name}-${size.name}`;
    page.on('pageerror', (error) => problems.push(`[${name}] Seitenfehler: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`[${name}] Konsole: ${message.text()}`);
    });

    await page.goto(`${url}${shell.query}#lang=de`, { waitUntil: 'networkidle' });
    await page.fill('#secrets', DEMO);
    await page.waitForTimeout(600);

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });
    if (overflow > 1) problems.push(`[${name}] waagerechter Ueberlauf um ${overflow} px`);

    const file = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: file });
    shots.push(file);
    await context.close();
  }
}

await browser.close();

console.log('\nAufnahmen:');
for (const shot of shots) console.log('  ' + path.relative(process.cwd(), shot));

if (problems.length > 0) {
  console.error('\nBefunde:');
  for (const problem of problems) console.error('  ✗ ' + problem);
  process.exitCode = 1;
}
