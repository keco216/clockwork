/**
 * Die vier Screenshots fuer den Play-Store-Eintrag.
 *
 *   node scripts/shoot-play.mjs [url]
 *
 * Sie landen in `play/listing/en-US/images/phoneScreenshots/` — nur dort, und
 * das ist Absicht: Play erbt Grafiken aus der Standardsprache, de-DE bekommt
 * ausschliesslich eigene Texte. Dieselbe Aufteilung wie bei den
 * fastlane-Metadaten fuer F-Droid.
 *
 * ── Warum 360x640 bei dreifacher Skalierung ────────────────────────────────
 * Play nimmt Screenshots zwischen 320 und 3840 px an, mit einer Bedingung, an
 * der die vorhandenen F-Droid-Bilder scheitern: Die laengste Seite darf
 * hoechstens doppelt so lang sein wie die kuerzeste. Die Emulator-Aufnahmen
 * sind 1080x2400, Verhaeltnis 2,222 — fuer Play zu lang.
 *
 * 1080x1920 ist Googles empfohlenes Hochformat (16:9, Verhaeltnis 1,778).
 * Erzeugt wird es aus einem Fenster von 360x640 CSS-Pixeln bei
 * `deviceScaleFactor: 3` — genau so rechnet ein echtes Handy mit 1080 Punkten
 * Breite. Das Fenster liegt damit unter 420 px, also zeigt jede Aufnahme das
 * Kompaktraster der Karte: 44-px-Blatt neben dem Namen, Code in voller
 * Kartenbreite, Kopiertaste in der Daumenzone.
 *
 * ── Warum nicht aus dem Emulator wie bei F-Droid ───────────────────────────
 * Weil die Android-Werkzeugkette auf dieser Maschine nicht vorhanden ist (kein
 * SDK, kein JDK, kein AVD). Inhaltlich ist der Unterschied klein: Die App IST
 * dieselbe Einzeldatei in einem System-WebView, das Bild also dasselbe bis auf
 * die Android-Statusleiste. Play verlangt keine Geraeteaufnahme, sondern eine
 * Abbildung der App. Wer die Kette wieder hat, nimmt sie im Emulator neu auf —
 * dieselben vier Motive, dann mit Statusleiste.
 *
 * ── Die vier Motive, in Reihenfolge des Store-Eintrags ─────────────────────
 * Play zeigt sie in der hochgeladenen Reihenfolge, und sie erzaehlen der Reihe
 * nach: was die App tut, wie sie im Dunkeln aussieht, dass sie verschluesselt
 * speichert, und wie man anfaengt.
 */

import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5180';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'play', 'listing', 'en-US', 'images', 'phoneScreenshots');
await mkdir(outDir, { recursive: true });

/* Fuenf Konten, alle aus dokumentierten Testvektoren und erfundenen Namen —
   in einem Store-Bild darf kein echtes Schluesselmaterial stehen, und hier
   steht auch keines, das echt AUSSIEHT. */
const KONTEN = [
  'otpauth://totp/ACME%20Co:you@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
  'otpauth://totp/Fastmail:you@example.com?secret=MFRGGZDFMZTWQ2LK&issuer=Fastmail',
  'GitHub: jbsw y3dp ehpk 3pxp',
  'otpauth://totp/Tailscale:you@example.com?secret=NBSWY3DPEB3W64TMMQ&issuer=Tailscale',
  'RFC 4226: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
].join('\n');

const MOTIVE = [
  { datei: '1.png', scheme: 'light', konten: KONTEN, tresor: false, was: 'Codes, hell' },
  { datei: '2.png', scheme: 'dark', konten: KONTEN, tresor: false, was: 'Codes, dunkel' },
  { datei: '3.png', scheme: 'light', konten: KONTEN, tresor: true, was: 'Tresor, hell' },
  { datei: '4.png', scheme: 'light', konten: null, tresor: false, was: 'Leerzustand, hell' },
];

const browser = await chromium.launch();
const befunde = [];
const bilder = [];

for (const motiv of MOTIVE) {
  const context = await browser.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    colorScheme: motiv.scheme,
    locale: 'en-US',
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => befunde.push(`[${motiv.datei}] Seitenfehler: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') befunde.push(`[${motiv.datei}] Konsole: ${message.text()}`);
  });

  await page.goto(`${url}#lang=en`, { waitUntil: 'networkidle' });

  if (motiv.konten !== null) {
    await page.fill('#secrets', motiv.konten);
    /* Fokus raus, BEVOR der Zustandswechsel laeuft: So klappt die Eingabe zu
       und die Codes stehen oben — der Zustand, den ein Store-Bild zeigen
       soll. Dieselbe Mechanik wie in shoot-mobile.mjs. */
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    // Die Einfeder-Animation der Kanalzuege ausklingen lassen, sonst stehen
    // halb durchsichtige Codes im Bild.
    await page.waitForTimeout(900);
  }

  if (motiv.tresor) {
    /* Die Tresor-Statuszeile aufklappen. Gewartet wird auf das ERGEBNIS und
       nicht auf eine Zahl: Ein <details> in Fahrt haelt `open` auf true, die
       Klappfahrt selbst dauert 250 ms plus Feder. */
    await page.click('.vault__state');
    await page.waitForTimeout(600);

    const offen = await page.evaluate(() => {
      const details = document.querySelector('#zone-vault details, details.vault');
      return details instanceof HTMLDetailsElement ? details.open : null;
    });
    if (offen !== true) {
      befunde.push(`[${motiv.datei}] Tresor liess sich nicht aufklappen (open=${offen})`);
    }

    /* Den Tresor buendig an den oberen Rand holen. Der Klick allein scrollt
       ihn zwar in den Blick, aber an eine beliebige Stelle — im ersten Anlauf
       stand oben ein angeschnittener Kanalzug, und ein Store-Bild, das mitten
       in einem Bauteil beginnt, sieht nach Versehen aus. `block: 'start'`
       setzt die Zone an die Oberkante; der mobile Kopf hat sich beim
       Runterscrollen ohnehin verstaut (die M1-Zusage), oben bleibt also
       nichts halb stehen. */
    await page.evaluate(() => {
      document.querySelector('#zone-vault')?.scrollIntoView({ block: 'start' });
    });
    await page.waitForTimeout(400);
  }

  /* Waagerechter Ueberlauf faellt auf einem Standbild nicht auf — die Seite
     wird einfach seitlich scrollbar. Genau so ist der Kanalzug in V3
     unbemerkt 60 px ueber den Rand gelaufen. */
  const ueberlauf = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (ueberlauf > 1) befunde.push(`[${motiv.datei}] waagerechter Ueberlauf um ${ueberlauf} px`);

  const ziel = path.join(outDir, motiv.datei);
  await page.screenshot({ path: ziel });
  await context.close();

  /* Nachmessen statt annehmen: Play prueft Kantenlaenge und Verhaeltnis beim
     Hochladen, und ein falscher deviceScaleFactor faellt sonst erst dort auf. */
  const png = await readFile(ziel);
  const breite = png.readUInt32BE(16);
  const hoehe = png.readUInt32BE(20);
  const farbtyp = png[25];
  const verhaeltnis = Math.max(breite, hoehe) / Math.min(breite, hoehe);

  if (breite !== 1080 || hoehe !== 1920) {
    befunde.push(`[${motiv.datei}] ${breite}x${hoehe} statt 1080x1920`);
  }
  if (verhaeltnis > 2) {
    befunde.push(
      `[${motiv.datei}] Verhaeltnis ${verhaeltnis.toFixed(3)} — Play laesst hoechstens 2,0`,
    );
  }

  bilder.push({ ...motiv, breite, hoehe, farbtyp, kb: png.length / 1024 });
}

await browser.close();

console.log('\n  Play-Screenshots\n');
for (const bild of bilder) {
  console.log(
    `  ${bild.datei}  ${bild.breite}x${bild.hoehe}  Farbtyp ${bild.farbtyp}  ` +
      `${bild.kb.toFixed(0).padStart(4)} kB  ${bild.was}`,
  );
}

if (befunde.length > 0) {
  console.error(`\n  ${befunde.length} Befund(e):`);
  for (const befund of befunde) console.error(`  • ${befund}`);
  process.exitCode = 1;
} else {
  console.log('\n  Alle vier tragen Play-Masse (1080x1920, Verhaeltnis 1,778).\n');
}
