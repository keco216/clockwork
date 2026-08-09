/**
 * Der Beweis für den Mobil-Struktur-Pass (V10).
 *
 *   node scripts/shoot-mobile.mjs <zielordner> [url]
 *
 * 27 Aufnahmen: 375, 414 und 502 px, je hell, dunkel und Arabisch (RTL), je
 * Leerzustand, 1 Konto und 12 Konten. Der Zielordner ist Pflicht — aus
 * demselben Grund wie bei shoot-compare.mjs: Die Dateinamen sind je Stand
 * dieselben, ein festverdrahtetes Ziel überschriebe den vorigen Satz.
 *
 * Neben den Bildern prüft jeder Durchgang, was ein Standbild nicht zeigt:
 *
 *   • Läuft die Seite waagerecht über?
 *   • Stehen die Codes im Arbeitszustand ÜBER der Eingabe?
 *   • Ist die Eingabe eine zugeklappte Zusammenfassungszeile (Schublade 0 px),
 *     der Tresor eine zugeklappte Statuszeile?
 *   • Steht jedes Bedienelement auf der Höhenleiter?
 *   • Unter 420 px: Trägt die Karte das Kompaktraster — Blatt 44 px neben dem
 *     Namen, Code und Kopiertaste in voller Kartenbreite?
 *
 * Die volle Prüfkette (Abstands-Skala, tote Fugen, Schwellen) läuft weiter in
 * scripts/shoot.mjs — dieses Skript ist der Beweis für die MOBIL-Zusagen,
 * nicht ihr Ersatz.
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const target = process.argv[2];
if (target === undefined || target.startsWith('http')) {
  throw new Error(
    'Erstes Argument muss der Zielordner sein, z. B. docs/v10-vergleich/mobil\n' +
      '  node scripts/shoot-mobile.mjs <zielordner> [url]',
  );
}
const url = process.argv[3] ?? 'http://localhost:5180';
const outDir = path.resolve(target);
await mkdir(outDir, { recursive: true });

const DEMO_1 = 'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

/* Zwölf Zeilen: elf Konten und eine unlesbare — der Fehlerfall gehört zum
   Beweis, seine Karte läuft im selben Raster. */
const DEMO_12 = [
  'otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
  'otpauth://totp/Google:kevin@example.com?secret=GEZDGNBVGY3TQOJQ&issuer=Google&algorithm=SHA256&digits=8&period=60',
  'GitHub: jbsw y3dp ehpk 3pxp',
  'otpauth://totp/Fastmail:kevin@example.com?secret=MFRGGZDFMZTWQ2LK&issuer=Fastmail',
  'otpauth://totp/Hetzner%20Cloud:kevin@example.com?secret=NBSWY3DPEB3W64TMMQ&issuer=Hetzner%20Cloud',
  'Bitwarden: MZXW6YTBOI======',
  'otpauth://totp/Deutsche%20Bahn:kevin@example.com?secret=ONSWG4TFOQ&issuer=Deutsche%20Bahn',
  'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
  'otpauth://totp/Tailscale:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Tailscale',
  'otpauth://totp/Mullvad:kevin@example.com?secret=GEZDGNBVGY3TQOJQ&issuer=Mullvad',
  'otpauth://totp/Porkbun:kevin@example.com?secret=MFRGGZDFMZTWQ2LK&issuer=Porkbun',
  'JBSW0Y3DPEHPK3PXP',
].join('\n');

/* Dieselben Sprossen wie in shoot.mjs — als Kopie, nicht als Import: Die
   beiden Skripte laufen unabhängig, und eine geteilte Datei nur für vier
   Zahlen wäre mehr Kopplung als Nutzen. Ändert sich die Leiter, sagt es der
   Lauf hier genauso wie dort. */
const LADDER = [24, 36, 40, 44];

const WIDTHS = [375, 414, 502];

const SKINS = [
  { name: 'hell', scheme: 'light', lang: 'de', dir: 'ltr' },
  { name: 'dunkel', scheme: 'dark', lang: 'de', dir: 'ltr' },
  { name: 'ar', scheme: 'light', lang: 'ar', dir: 'rtl' },
];

const FILLS = [
  { name: 'leer', text: null },
  { name: '1konto', text: DEMO_1 },
  { name: '12konten', text: DEMO_12 },
];

const browser = await chromium.launch();
const problems = [];
const shots = [];

for (const skin of SKINS) {
  for (const width of WIDTHS) {
    for (const fill of FILLS) {
      const name = `${String(width).padStart(4, '0')}-${skin.name}-${fill.name}`;
      const context = await browser.newContext({
        viewport: { width, height: 860 },
        colorScheme: skin.scheme,
        deviceScaleFactor: 2,
        locale: skin.lang === 'ar' ? 'ar' : 'de-DE',
      });
      const page = await context.newPage();
      page.on('pageerror', (error) => problems.push(`[${name}] Seitenfehler: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') problems.push(`[${name}] Konsole: ${message.text()}`);
      });
      await page.goto(`${url}#lang=${skin.lang}`, { waitUntil: 'networkidle' });

      if (fill.text !== null) {
        await page.fill('#secrets', fill.text);
        // Der Fokus verlässt das Feld, BEVOR die Auswertung läuft: So landet
        // der Zustandswechsel im „Standard geschlossen"-Zweig — derselbe Weg
        // wie nach dem Aufsperren des Tresors. Der Gegenfall (offen, weil der
        // Fokus beim Tippen im Feld liegt) ist in shoot.mjs zu sehen, dessen
        // fillSecrets den Fokus im Feld lässt.
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        });
        // Die Einfeder-Animation der Kanalzüge ausläuten lassen (350 ms plus
        // gedeckelter Versatz), sonst zeigt das Bild halb durchsichtige Codes.
        await page.waitForTimeout(900);
      }

      /* ── Dokument und Überlauf ── */
      const doc = await page.evaluate(() => ({
        dir: document.documentElement.dir,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      if (doc.dir !== skin.dir) {
        problems.push(`[${name}] dir ist »${doc.dir}«, erwartet »${skin.dir}«`);
      }
      if (doc.overflow > 1) {
        problems.push(`[${name}] waagerechter Überlauf um ${doc.overflow} px`);
      }

      /* ── Höhenleiter ── */
      const offLadder = await page.evaluate(
        (ladder) =>
          [
            ...document.querySelectorAll(
              '.key, .chip, .pick, .vault__state, .reveal__summary, .zone__fold, input.field',
            ),
          ]
            .filter((element) => {
              if (element.hidden || getComputedStyle(element).display === 'none') return false;
              if (getComputedStyle(element).visibility === 'hidden') return false;
              const height = element.getBoundingClientRect().height;
              if (height === 0) return false;
              return !ladder.some((rung) => Math.abs(height - rung) < 1.5);
            })
            .map(
              (element) =>
                `${element.className.split(' ')[0] || element.tagName.toLowerCase()} = ${Math.round(element.getBoundingClientRect().height * 10) / 10} px`,
            ),
        LADDER,
      );
      if (offLadder.length > 0) {
        problems.push(`[${name}] neben der Höhenleiter: ${offLadder.join(' · ')}`);
      }

      /* ── Die Struktur des jeweiligen Zustands ── */
      if (fill.text === null) {
        const vacant = await page.evaluate(() => {
          const seen = (selector) => {
            const element = document.querySelector(selector);
            return element !== null && element.getClientRects().length > 0;
          };
          const demo = document.querySelector('#key-demo')?.getBoundingClientRect();
          const file = document.querySelector('#key-file')?.getBoundingClientRect();
          const camera = document.querySelector('#key-camera')?.getBoundingClientRect();
          // Gemessen wird gegen das Tasten-Gitter, nicht gegen den Editor:
          // Der ist im Leerzustand `display: contents` und hat kein Rechteck.
          const keys = document.querySelector('#zone-input .keys')?.getBoundingClientRect();
          return {
            stage: document.querySelector('.device')?.dataset.stage,
            vault: seen('#zone-vault'),
            labels: seen('.zone__label'),
            fold: seen('#input-fold'),
            demoSpansEditor: demo && keys ? Math.abs(demo.width - keys.width) < 2 : false,
            pairEqual: file && camera ? Math.abs(file.width - camera.width) < 1 : false,
          };
        });
        if (vacant.stage !== 'vacant') problems.push(`[${name}] Bühne »${vacant.stage}«`);
        if (vacant.vault) problems.push(`[${name}] Tresor im Leerzustand sichtbar`);
        if (vacant.labels) problems.push(`[${name}] Sektionsbeschriftung im Leerzustand`);
        if (vacant.fold) problems.push(`[${name}] Zusammenfassungszeile im Leerzustand`);
        if (!vacant.demoSpansEditor)
          problems.push(`[${name}] Testschlüssel nicht in voller Breite`);
        if (!vacant.pairEqual) problems.push(`[${name}] QR/Kamera nicht gleich breit`);
      } else {
        const working = await page.evaluate(() => {
          const box = (selector) => document.querySelector(selector)?.getBoundingClientRect();
          const codes = box('#zone-codes');
          const input = box('#zone-input');
          const drawer = box('#zone-input .zone__drawer');
          const fold = box('#input-fold');
          return {
            stage: document.querySelector('.device')?.dataset.stage,
            codesFirst: codes && input ? codes.bottom <= input.top + 1 : false,
            drawerShut: drawer ? drawer.height < 1 : false,
            foldSeen: fold ? fold.height >= 43 : false,
            vaultOpen: document.querySelector('#vault-disclosure')?.open ?? false,
            // „Sichtbar" heißt: mit echter Fläche. Die Beschriftungen sind im
            // Arbeitszustand per sr-only-Griff versteckt — 1×1 px, damit
            // Screenreader ihre Überschriftenliste behalten. Ein bloßes
            // getClientRects() zählte diese Pixel als Sichtbarkeit.
            labels:
              [...document.querySelectorAll('.zone__label')].filter((h) => {
                const box = h.getBoundingClientRect();
                return box.width > 2 && box.height > 2;
              }).length > 0,
          };
        });
        if (working.stage !== 'working') problems.push(`[${name}] Bühne »${working.stage}«`);
        if (!working.codesFirst) problems.push(`[${name}] Codes stehen nicht über der Eingabe`);
        if (!working.drawerShut) problems.push(`[${name}] Editor-Schublade steht offen`);
        if (!working.foldSeen) problems.push(`[${name}] Zusammenfassungszeile fehlt oder zu flach`);
        if (working.vaultOpen) problems.push(`[${name}] Tresor-Aufklapper steht offen`);
        if (working.labels) problems.push(`[${name}] Sektionsbeschriftung im Arbeitszustand`);

        /* Die Karte: unter 420 das Kompaktraster, darüber das 34-rem-Raster. */
        const card = await page.evaluate(() => {
          const strip = document.querySelector('.strip:not(.strip--fault)');
          if (strip === null) return null;
          const stripBox = strip.getBoundingClientRect();
          const dial = strip.querySelector('.dialface')?.getBoundingClientRect();
          const code = strip.querySelector('.dial')?.getBoundingClientRect();
          const copy = strip.querySelector('.key--copy')?.getBoundingClientRect();
          return {
            strip: stripBox.width,
            dial: dial ? Math.round(dial.height) : 0,
            codeSpan: code ? code.width / stripBox.width : 0,
            copySpan: copy ? copy.width / stripBox.width : 0,
            copyLast: copy && code ? copy.top > code.bottom : false,
          };
        });
        if (card !== null) {
          const compact = width < 420;
          if (compact) {
            if (Math.abs(card.dial - 44) > 1) {
              problems.push(`[${name}] Zifferblatt ${card.dial} px statt 44`);
            }
            if (card.codeSpan < 0.9) {
              problems.push(`[${name}] Code nur ${Math.round(card.codeSpan * 100)} % der Karte`);
            }
            if (card.copySpan < 0.9 || !card.copyLast) {
              problems.push(`[${name}] Kopiertaste nicht in voller Breite am Kartenende`);
            }
          } else if (Math.abs(card.dial - 80) > 1) {
            problems.push(`[${name}] Zifferblatt ${card.dial} px statt 80 (34-rem-Raster)`);
          }
        }
      }

      const file = path.join(outDir, `${name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      shots.push(file);
      await context.close();
    }
  }
}

/* ══ Der Kopf weicht beim Runterscrollen (V11) ═══════════════════════════════
   Eigener Durchgang, weil er als Einziger SCROLLT — die Aufnahmen oben zeigen
   alle den Startzustand, und der muss unberührt bleiben (der V10-Beweis
   „erster Code bei y = 206" hängt daran).

   Geprüft wird das Verhalten, nicht die Optik: verstaut nach einem Abwärtsweg,
   zurück nach 12 px aufwärts, oben immer da — und auf dem Schreibtisch nie.
   Der reduced-motion-Durchgang verlangt DIESELBEN Endzustände: Verstauen ist
   kein Effekt, sondern gewonnener Platz. */
console.log('\nKopf beim Scrollen:');

for (const [breite, hoeheFenster, bewegung, erwartetVerstaut] of [
  [375, 812, 'reduce', true],
  [375, 812, 'no-preference', true],
  [1024, 900, 'no-preference', false],
]) {
  const context = await browser.newContext({
    viewport: { width: breite, height: hoeheFenster },
    reducedMotion: bewegung,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.fill('#secrets', DEMO_12);
  // Fokus abgeben: Liegt er in der Eingabezone, hält V10 die Schublade
  // absichtlich offen — das ist ein anderer Startzustand.
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.waitForTimeout(700);

  const lesen = () =>
    page.evaluate(() => {
      const m = document.querySelector('.masthead');
      return {
        verstaut: m.classList.contains('masthead--stowed'),
        erhoben: m.classList.contains('masthead--lifted'),
        unten: Math.round(m.getBoundingClientRect().bottom),
        hoehe: Math.round(m.getBoundingClientRect().height),
      };
    });

  const marke = `${String(breite)} px${bewegung === 'reduce' ? ', reduced-motion' : ''}`;
  const start = await lesen();
  if (start.verstaut) {
    problems.push(`[Kopf ${marke}] am Seitenanfang verstaut`);
  }

  // Zweimal Kopfhöhe abwärts, in Schritten — eine Richtungserkennung mit
  // Hysterese braucht mehr als einen Sprung.
  for (let schritt = 0; schritt < 4; schritt++) {
    await page.evaluate((d) => {
      window.scrollBy(0, d);
    }, start.hoehe);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(450);
  const abwaerts = await lesen();

  if (erwartetVerstaut) {
    if (!abwaerts.verstaut || abwaerts.unten > 0) {
      problems.push(
        `[Kopf ${marke}] nach ${String(4 * start.hoehe)} px abwaerts nicht verstaut (Unterkante ${String(abwaerts.unten)})`,
      );
    }
  } else if (abwaerts.verstaut) {
    problems.push(`[Kopf ${marke}] auf dem Schreibtisch verstaut`);
  }

  await page.evaluate(() => {
    window.scrollBy(0, -12);
  });
  await page.waitForTimeout(450);
  const aufwaerts = await lesen();
  if (aufwaerts.verstaut || aufwaerts.unten <= 0) {
    problems.push(
      `[Kopf ${marke}] nach 12 px aufwaerts nicht zurueck (Unterkante ${String(aufwaerts.unten)})`,
    );
  }
  // Mitten in der Seite gehört er MIT Ebene zurück — sonst schwebte er ohne
  // Kante über dem Inhalt, den er verdeckt.
  if (!aufwaerts.erhoben) {
    problems.push(`[Kopf ${marke}] kehrt ohne Ebene zurueck`);
  }

  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(450);
  const wiederOben = await lesen();
  if (wiederOben.verstaut || wiederOben.erhoben) {
    problems.push(`[Kopf ${marke}] am Seitenanfang nicht flach und sichtbar`);
  }

  console.log(
    `  ${marke.padEnd(24)} oben ${String(start.unten)} · abwaerts ${String(abwaerts.unten)}` +
      ` · +12 ${String(aufwaerts.unten)} · zurueck ${String(wiederOben.unten)}`,
  );
  await context.close();
}

await browser.close();

console.log('\nAufnahmen:');
for (const shot of shots) console.log('  ' + path.relative(process.cwd(), shot));

if (problems.length > 0) {
  console.error('\nBefunde:');
  for (const problem of problems) console.error('  ✗ ' + problem);
  process.exitCode = 1;
} else {
  console.log(`\n✓ ${shots.length} Aufnahmen, alle Strukturprüfungen bestanden.`);
}
