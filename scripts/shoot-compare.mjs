/**
 * Vorher/Nachher für den Versionsvergleich in docs/.
 *
 *   node scripts/shoot-compare.mjs <vorher|nachher> <zielordner> [url]
 *
 * Getrennt von scripts/shoot.mjs, weil dieses Werkzeug ZWEIMAL läuft — einmal
 * mit ausgechecktem alten Stand, einmal mit dem neuen — und die Bilder in
 * denselben Ordner legt. Es prüft nichts; die Prüfungen stehen in shoot.mjs.
 *
 * ── Warum der Zielordner ein Argument ist ─────────────────────────────────
 * Er stand bis V8 fest im Skript (`docs/v7-vergleich`). Das ist genau einmal
 * gutgegangen: Beim nächsten Vergleich hätte der Lauf die Bilder der vorigen
 * Version überschrieben, und zwar unbemerkt — die Dateinamen sind ja dieselben.
 * Ein Werkzeug, das je Version läuft, darf sein Ziel nicht kennen.
 *
 * ── Warum deviceScaleFactor 1 ─────────────────────────────────────────────
 * Weil diese Bilder ins Repo wandern. Ein Vergleichsordner wiegt in doppelter
 * Auflösung 2,7 MB für acht Bilder — für einen Vergleich, den man einmal
 * ansieht, ist das viel Platz für wenig Erkenntnis. Beurteilt wird hier
 * Komposition, nicht Kantenschärfe.
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const side = process.argv[2];
if (side !== 'vorher' && side !== 'nachher') {
  throw new Error('Erstes Argument muss »vorher« oder »nachher« sein');
}
const target = process.argv[3];
if (target === undefined || target.startsWith('http')) {
  throw new Error(
    'Zweites Argument muss der Zielordner sein, z. B. docs/v8-vergleich\n' +
      '  node scripts/shoot-compare.mjs <vorher|nachher> <zielordner> [url]',
  );
}
const url = process.argv[4] ?? 'http://localhost:5180';
const outDir = path.resolve(target);
await mkdir(outDir, { recursive: true });

/* Acht Konten: Erst ab dieser Zahl zeigt V7 Filterzeile und zweite Spalte, und
   nur mit ihr ist der Vergleich ehrlich — mit dreien sieht auch V6 ordentlich
   aus. */
const DEMO = [
  'otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
  'otpauth://totp/Google:kevin@example.com?secret=GEZDGNBVGY3TQOJQ&issuer=Google&algorithm=SHA256&digits=8&period=60',
  'GitHub: jbsw y3dp ehpk 3pxp',
  'otpauth://totp/Fastmail:kevin@example.com?secret=MFRGGZDFMZTWQ2LK&issuer=Fastmail',
  'otpauth://totp/Hetzner%20Cloud:kevin@example.com?secret=NBSWY3DPEB3W64TMMQ&issuer=Hetzner%20Cloud',
  'Bitwarden: MZXW6YTBOI======',
  'otpauth://totp/Deutsche%20Bahn:kevin@example.com?secret=ONSWG4TFOQ&issuer=Deutsche%20Bahn',
  'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
].join('\n');

const SHOTS = [
  { name: 'weit-dunkel', width: 2560, height: 1440, scheme: 'dark', fill: true },
  { name: 'desktop-hell', width: 1440, height: 900, scheme: 'light', fill: true },
  { name: 'leer-hell', width: 1440, height: 900, scheme: 'light', fill: false },
  { name: 'mobil-dunkel', width: 375, height: 812, scheme: 'dark', fill: true },
];

const browser = await chromium.launch();

for (const shot of SHOTS) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    colorScheme: shot.scheme,
    deviceScaleFactor: 1,
    locale: 'de-DE',
  });
  const page = await context.newPage();
  await page.goto(`${url}#lang=de`, { waitUntil: 'networkidle' });
  if (shot.fill) {
    await page.fill('#secrets', DEMO);
    await page.waitForTimeout(700);
  }
  const file = path.join(outDir, `${side}-${shot.name}.png`);
  // Mobil als Ganzseitenbild, sonst sieht man von acht Konten zwei.
  await page.screenshot({ path: file, fullPage: shot.width < 700 });
  console.log('  ' + path.relative(process.cwd(), file));
  await context.close();
}

await browser.close();
