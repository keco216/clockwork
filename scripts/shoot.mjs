/**
 * Screenshots und Funktionsprüfung über Playwright.
 *
 * Nicht Teil des Produktivbuilds — ein Werkzeug für die Gestaltungsschleife:
 * umsetzen, ansehen, kritisieren, korrigieren. Deshalb liegt es unter scripts/
 * und nicht unter src/.
 *
 *   node scripts/shoot.mjs [url] [ausgabeordner]
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5180';
const outDir = path.resolve(process.argv[3] ?? 'screenshots');
await mkdir(outDir, { recursive: true });

const DEMO = [
  'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
  'otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
  'otpauth://totp/Google:kevin@gmail.com?secret=GEZDGNBVGY3TQOJQ&issuer=Google&algorithm=SHA256&digits=8&period=60',
  'JBSW0Y3DPEHPK3PXP',
].join('\n');

const browser = await chromium.launch();
const problems = [];
const shots = [];

async function session(name, { width, height, scheme, steps }) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: scheme,
    deviceScaleFactor: 2,
    locale: 'de-DE',
  });
  const page = await context.newPage();

  page.on('pageerror', (error) => problems.push(`[${name}] Seitenfehler: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`[${name}] Konsole: ${message.text()}`);
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await steps(page, name);
  await context.close();
}

async function shoot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  shots.push(file);
}

async function fillSecrets(page, text = DEMO) {
  await page.fill('#secrets', text);
  await page.waitForTimeout(450);
}

/* ── 1. Hell, Desktop ─────────────────────────────────────────────────────── */
await session('01-hell-desktop', {
  width: 1280,
  height: 900,
  scheme: 'light',
  steps: async (page, name) => {
    await fillSecrets(page);
    await shoot(page, name);
  },
});

/* ── 2. Dunkel, Desktop ───────────────────────────────────────────────────── */
await session('02-dunkel-desktop', {
  width: 1280,
  height: 900,
  scheme: 'dark',
  steps: async (page, name) => {
    await fillSecrets(page);
    await shoot(page, name);
  },
});

/* ── 3. Mobil 375 px ──────────────────────────────────────────────────────── */
await session('03-mobil-375', {
  width: 375,
  height: 812,
  scheme: 'dark',
  steps: async (page, name) => {
    await fillSecrets(page);
    await shoot(page, name);
  },
});

/* ── 4. Leerzustand ───────────────────────────────────────────────────────── */
await session('04-leer', {
  width: 1280,
  height: 900,
  scheme: 'light',
  steps: async (page, name) => {
    await shoot(page, name);
  },
});

/* ── 5. Ablaufzustand: die letzten Sekunden ───────────────────────────────── */
await session('05-ablauf', {
  width: 1280,
  height: 700,
  scheme: 'dark',
  steps: async (page, name) => {
    await fillSecrets(page, 'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    // Die Uhr auf 2 Sekunden vor dem Wechsel stellen und einen Tick auslösen.
    await page.evaluate(() => {
      const strip = document.querySelector('.strip');
      const scale = strip?.querySelector('.scale');
      strip?.classList.add('strip--expiring');
      scale?.style.setProperty('--progress', '0.94');
      const seconds = strip?.querySelector('[data-seconds]');
      if (seconds) seconds.textContent = '2';
    });
    await shoot(page, name);
  },
});

/* ── 6. Tresor: offen ─────────────────────────────────────────────────────── */
await session('06-tresor', {
  width: 1280,
  height: 1000,
  scheme: 'dark',
  steps: async (page, name) => {
    await fillSecrets(page, 'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    await page.fill('#vault-pass', 'ein-langes-passwort-42');
    await page.click('#vault-primary');
    await page.waitForFunction(() => document.querySelector('#vault')?.dataset.state === 'open', {
      timeout: 15000,
    });
    await shoot(page, name);

    // Gegenprobe: Zusperren leert das Textfeld, Aufsperren stellt es wieder her.
    await page.click('#vault-lock');
    const afterLock = await page.inputValue('#secrets');
    if (afterLock !== '') problems.push('[tresor] Zusperren hat das Textfeld nicht geleert');

    await page.fill('#vault-pass', 'falsch');
    await page.click('#vault-primary');
    await page.waitForTimeout(1500);
    if ((await page.textContent('#vault-error'))?.trim() === '') {
      problems.push('[tresor] Falsche Passphrase wurde nicht gemeldet');
    }

    await page.fill('#vault-pass', 'ein-langes-passwort-42');
    await page.click('#vault-primary');
    await page.waitForFunction(() => document.querySelector('#vault')?.dataset.state === 'open', {
      timeout: 15000,
    });
    if (!(await page.inputValue('#secrets')).includes('GEZDGNBVGY3TQOJQ')) {
      problems.push('[tresor] Aufsperren hat die Secrets nicht wiederhergestellt');
    }

    // Aufräumen, damit der nächste Lauf sauber startet.
    await page.click('#vault-wipe');
    await page.click('#vault-wipe');
  },
});

/* ── 7. Google-Authenticator-Import ───────────────────────────────────────── */
await session('07-import', {
  width: 1280,
  height: 900,
  scheme: 'light',
  steps: async (page, name) => {
    const EXPORT =
      'otpauth-migration://offline?data=' +
      'CjEKCkhlbGxvId6tvu8SGEV4YW1wbGU6YWxpY2VAZ29vZ2xlLmNvbRoHRXhhbXBsZSABKAEwAhACGAEgAA%3D%3D';
    // Über die Zwischenablage einfügen — genau der Weg, den ein Nutzer geht.
    await page.click('#secrets');
    await page.evaluate(async (text) => {
      const input = document.getElementById('secrets');
      input.value = text;
      input.dispatchEvent(new Event('paste', { bubbles: true }));
    }, EXPORT);
    await page.waitForTimeout(600);

    const value = await page.inputValue('#secrets');
    if (!value.startsWith('otpauth://totp/')) {
      problems.push(`[import] Export wurde nicht umgewandelt: ${value.slice(0, 60)}`);
    }
    if (!value.includes('JBSWY3DPEHPK3PXP')) {
      problems.push('[import] Secret fehlt nach der Umwandlung');
    }
    await shoot(page, name);
  },
});

await browser.close();

console.log('\nScreenshots:');
for (const shot of shots) console.log('  ' + path.relative(process.cwd(), shot));

if (problems.length > 0) {
  console.error('\nBefunde:');
  for (const problem of problems) console.error('  ✗ ' + problem);
  process.exitCode = 1;
} else {
  console.log('\n✓ Keine Konsolenfehler, alle Funktionsprüfungen bestanden.');
}
