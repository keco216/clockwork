/**
 * Screenshots und Funktionsprüfung über Playwright.
 *
 * Nicht Teil des Produktivbuilds — ein Werkzeug für die Gestaltungsschleife:
 * umsetzen, ansehen, kritisieren, korrigieren. Deshalb liegt es unter scripts/
 * und nicht unter src/.
 *
 *   node scripts/shoot.mjs [url] [ausgabeordner]
 *
 * Seit V3 prüft es zusätzlich, was man auf einem Standbild NICHT sieht:
 *   • steht `lang` und `dir` richtig am Dokument,
 *   • läuft die Seite waagerecht über (der klassische RTL- und Langwort-Fehler),
 *   • bleibt das Zifferblatt ungespiegelt,
 *   • bleiben Codes und Secrets lateinisch und linksläufig.
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
  'otpauth://totp/Google:kevin@example.com?secret=GEZDGNBVGY3TQOJQ&issuer=Google&algorithm=SHA256&digits=8&period=60',
  'JBSW0Y3DPEHPK3PXP',
].join('\n');

const browser = await chromium.launch();
const problems = [];
const shots = [];

async function session(name, { width, height, scheme, lang, steps }) {
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

  // Die Sprache kommt über den Hash — genau den Weg geht auch ein Nutzer, der
  // sich einen Link schicken lässt.
  const target = lang === undefined ? url : `${url}#lang=${lang}`;
  await page.goto(target, { waitUntil: 'networkidle' });
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

/**
 * Läuft irgendetwas waagerecht über den Rand?
 *
 * Der Klassiker bei einer Übersetzung: Ein deutsches oder finnisches Wort
 * sprengt eine Taste, oder eine rechtsläufige Sprache schiebt ein Element aus
 * dem Gehäuse. Auf einem Standbild sieht man das oft nicht, weil die Seite
 * einfach scrollbar wird.
 */
async function checkNoOverflow(page, name) {
  const report = await page.evaluate(() => {
    const root = document.documentElement;
    const slack = root.scrollWidth - root.clientWidth;
    const limit = root.clientWidth + 1;
    const guilty = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && (box.right > limit || box.left < -1);
      })
      .map((element) => `${element.tagName.toLowerCase()}.${element.className || '(ohne Klasse)'}`);
    return { slack, guilty: [...new Set(guilty)].slice(0, 4) };
  });
  if (report.slack > 1) {
    problems.push(
      `[${name}] waagerechter Überlauf um ${report.slack} px — ${report.guilty.join(', ')}`,
    );
  }
}

/** Steht die Sprache wirklich am Dokument? Davon hängen Trennung und Schrift ab. */
async function checkDocument(page, name, expectedLang, expectedDir) {
  const actual = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    script: document.documentElement.dataset.script,
    title: document.title,
  }));
  if (actual.lang !== expectedLang) {
    problems.push(`[${name}] lang ist »${actual.lang}«, erwartet »${expectedLang}«`);
  }
  if (actual.dir !== expectedDir) {
    problems.push(`[${name}] dir ist »${actual.dir}«, erwartet »${expectedDir}«`);
  }
  if (!actual.script) {
    problems.push(`[${name}] data-script fehlt — der Schrift-Stack greift nicht`);
  }
  if (!actual.title.includes('Clockwork')) {
    problems.push(`[${name}] Titel ohne Marke: ${actual.title}`);
  }
}

/* ── 1.–8. Vier Sprachen, je Desktop und mobil ────────────────────────────── */

const LANGUAGES = [
  { code: 'de', dir: 'ltr', scheme: 'light' },
  { code: 'en', dir: 'ltr', scheme: 'light' },
  { code: 'ar', dir: 'rtl', scheme: 'light' },
  { code: 'ja', dir: 'ltr', scheme: 'dark' },
];

for (const language of LANGUAGES) {
  await session(`10-${language.code}-desktop`, {
    width: 1280,
    height: 900,
    scheme: language.scheme,
    lang: language.code,
    steps: async (page, name) => {
      await fillSecrets(page);
      await checkDocument(page, name, language.code, language.dir);
      await checkNoOverflow(page, name);
      await shoot(page, name);
    },
  });

  await session(`11-${language.code}-mobil`, {
    width: 375,
    height: 812,
    scheme: language.scheme,
    lang: language.code,
    steps: async (page, name) => {
      await fillSecrets(page);
      await checkNoOverflow(page, name);
      await shoot(page, name);
    },
  });
}

/* ── 9. Dunkel, Desktop (deutsch) ─────────────────────────────────────────── */
await session('02-dunkel-desktop', {
  width: 1280,
  height: 900,
  scheme: 'dark',
  lang: 'de',
  steps: async (page, name) => {
    await fillSecrets(page);
    await shoot(page, name);
  },
});

/* ── 10. Leerzustand ──────────────────────────────────────────────────────── */
await session('04-leer', {
  width: 1280,
  height: 900,
  scheme: 'light',
  lang: 'de',
  steps: async (page, name) => {
    await shoot(page, name);
  },
});

/* ── 11. Ablaufzustand: die letzten Sekunden ──────────────────────────────── */
await session('05-ablauf', {
  width: 1280,
  height: 700,
  scheme: 'dark',
  lang: 'de',
  steps: async (page, name) => {
    await fillSecrets(page, 'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    // Den Zeiger auf zwei Sekunden vor dem Wechsel stellen. Der Zeiger sitzt in
    // der Gruppe `.dialface__hand`; bis V2 stand hier `.scale` — eine Klasse,
    // die es seit der Umbenennung auf Clockwork nicht mehr gab. Das `?.` hat den
    // Fehler stillschweigend geschluckt, und das Bild zeigte den Zeiger an
    // seiner echten Position statt an der gewünschten.
    const moved = await page.evaluate(() => {
      const strip = document.querySelector('.strip');
      const hand = strip?.querySelector('.dialface__hand');
      const seconds = strip?.querySelector('[data-seconds]');
      if (!strip || !hand || !seconds) return false;
      strip.classList.add('strip--expiring');
      hand.style.setProperty('--progress', '0.94');
      seconds.textContent = '2';
      return true;
    });
    if (!moved) problems.push('[05-ablauf] Zeiger oder Sekundenanzeige nicht gefunden');
    await shoot(page, name);
  },
});

/* ── 11b. Der klebende Kopf mit Material ──────────────────────────────────
   Seit V5 trägt der Kopf Frost — aber erst, wenn etwas unter ihm liegt. Auf
   jedem gewöhnlichen Standbild steht die Seite ganz oben, und dann ist er
   flach: Der interessante Zustand wäre nie zu sehen.

   Geprüft wird deshalb beides an einer Stelle: dass die Klasse oben NICHT und
   nach dem Scrollen SCHON gesetzt ist. Ein Beobachter, der nie auslöst, fällt
   sonst nicht auf — die Seite sieht ja bloß etwas flacher aus. */
for (const scheme of ['light', 'dark']) {
  await session(`09-frost-${scheme}`, {
    width: 1280,
    height: 720,
    scheme,
    lang: 'de',
    steps: async (page, name) => {
      await fillSecrets(page);

      const flatAtTop = await page.evaluate(
        () => !document.querySelector('.masthead')?.classList.contains('masthead--lifted'),
      );
      if (!flatAtTop) {
        problems.push(`[${name}] Kopf traegt schon oben Material — Fuehler loest zu frueh aus`);
      }

      await page.evaluate(() => {
        window.scrollTo(0, 420);
      });
      await page.waitForTimeout(400);

      const lifted = await page.evaluate(() =>
        document.querySelector('.masthead')?.classList.contains('masthead--lifted'),
      );
      if (!lifted) {
        problems.push(`[${name}] Kopf bleibt beim Scrollen flach — Fuehler loest nicht aus`);
      }

      // Bewusst NICHT fullPage: Der Frost lebt von der Scrollposition, und ein
      // Ganzseitenbild scrollt sie weg.
      const file = path.join(outDir, `${name}.png`);
      await page.screenshot({ path: file });
      shots.push(file);
    },
  });
}

/* ── 12. Tresor: offen ────────────────────────────────────────────────────── */
await session('06-tresor', {
  width: 1280,
  height: 1000,
  scheme: 'dark',
  lang: 'de',
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

/* ── 13. Google-Authenticator-Import ──────────────────────────────────────── */
await session('07-import', {
  width: 1280,
  height: 900,
  scheme: 'light',
  lang: 'de',
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

/* ── 14. Sprachwechsel zur Laufzeit ───────────────────────────────────────── */
await session('08-sprachwechsel', {
  width: 1280,
  height: 900,
  scheme: 'light',
  lang: 'de',
  steps: async (page, name) => {
    await fillSecrets(page, 'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');

    const before = await page.textContent('#zone-vault-label');
    await page.selectOption('#lang-select', 'ar');
    await page.waitForTimeout(300);

    const after = await page.evaluate(() => ({
      label: document.querySelector('#zone-vault-label')?.textContent,
      dir: document.documentElement.dir,
      hash: window.location.hash,
      // Der Code muss lateinisch und linksläufig bleiben — er wird kopiert.
      codeDir: document.querySelector('.dial')?.getAttribute('dir'),
      code: document.querySelector('.dial')?.textContent?.trim(),
      // Das Zifferblatt darf nicht spiegeln.
      dialDirection: getComputedStyle(document.querySelector('.dialface')).direction,
    }));

    if (after.label === before) problems.push('[sprachwechsel] Beschriftung blieb stehen');
    if (after.dir !== 'rtl') problems.push('[sprachwechsel] dir wurde nicht auf rtl gesetzt');
    if (!after.hash.includes('lang=ar')) problems.push('[sprachwechsel] Hash nicht geschrieben');
    if (after.codeDir !== 'ltr') problems.push('[sprachwechsel] Code ist nicht mehr linksläufig');
    if (!/^[\d\s]+$/.test(after.code ?? '')) {
      problems.push(`[sprachwechsel] Code nicht mehr lateinisch: ${after.code}`);
    }
    if (after.dialDirection !== 'ltr') {
      problems.push('[sprachwechsel] Zifferblatt wurde gespiegelt');
    }

    await checkNoOverflow(page, name);
    await shoot(page, name);
  },
});

/* ── 9. Aufnahmen fuers README ─────────────────────────────────────────────
   Englisch, hell und dunkel, gleicher Ausschnitt. Diese beiden landen als
   einzige Bilder im Repo (docs/), deshalb bekommen sie eine eigene Sitzung
   statt aus der Sprachmatrix ausgeliehen zu werden: Was im README steht, soll
   sich nicht aendern, nur weil dort jemand eine Sprache umsortiert. */

for (const scheme of ['light', 'dark']) {
  await session(`20-readme-${scheme}`, {
    width: 1280,
    height: 900,
    scheme,
    lang: 'en',
    steps: async (page, name) => {
      await fillSecrets(page);
      await shoot(page, name);
    },
  });
}

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
