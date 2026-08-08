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

/**
 * Bricht in den Hinweisen ein Wortfetzen um?
 *
 * Der V7-Auftrag nennt das ausdrücklich: „nichts darf mehr mitten im Satz
 * umbrechen". Gemeint ist nicht der normale Zeilenumbruch zwischen zwei
 * Wörtern — der ist Satz und kein Fehler —, sondern das Auseinanderreißen
 * eines Dings, das als EIN Ding gelesen werden muss: `otpauth://…` über zwei
 * Zeilen verteilt sind zwei kaputte Zeichenketten.
 *
 * Messbar ist das genau: Ein Inline-Element, das umbricht, belegt mehr als ein
 * Rechteck. `getClientRects()` gibt sie einzeln zurück.
 */
async function checkNoBrokenFragments(page, name) {
  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('.note code, .note kbd, .slot__legend code')]
      .filter((element) => element.getClientRects().length > 1)
      .map((element) => element.textContent ?? '(leer)'),
  );
  if (broken.length > 0) {
    problems.push(`[${name}] Wortfetzen umgebrochen: ${broken.join(' · ')}`);
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

/* ── 11b. Der klebende Kopf als Ebene ─────────────────────────────────────
   Der Kopf bekommt Kante und Schatten erst, wenn etwas unter ihm liegt. Auf
   jedem gewöhnlichen Standbild steht die Seite ganz oben, und dann ist er
   flach: Der interessante Zustand wäre nie zu sehen.

   Bis V7 schaltete die Klasse ein Frost-Material; seit V8 ist der Kopf deckend
   und sie schaltet nur noch die Erhebung (siehe .masthead in src/style.css). Der
   Griff bleibt derselbe und ist genauso nötig: Ein Beobachter, der nie auslöst,
   fällt auf einem Standbild nicht auf — die Seite sieht bloß etwas flacher aus.

   Geprüft wird deshalb beides an einer Stelle: dass die Klasse oben NICHT und
   nach dem Scrollen SCHON gesetzt ist. */
for (const scheme of ['light', 'dark']) {
  await session(`09-kopf-${scheme}`, {
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
        problems.push(`[${name}] Kopf ist schon oben erhoben — Fuehler loest zu frueh aus`);
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

      // Bewusst NICHT fullPage: Der Zustand hängt an der Scrollposition, und ein
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

    // Der Tresor ist seit V7 ein Aufklapper und startet zu. Aufgeklappt wird
    // über die Statuszeile — genau so, wie es jemand mit der Maus täte. Ein
    // `open`-Attribut von Hand zu setzen würde die Prüfung um die einzige
    // Interaktion bringen, die hier neu ist.
    await page.click('#vault-disclosure > summary');
    if (!(await page.evaluate(() => document.querySelector('#vault-disclosure')?.open))) {
      problems.push(`[${name}] Tresor laesst sich ueber die Statuszeile nicht aufklappen`);
    }

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

/* ── 15. Die Responsive-Kette aus V7 ───────────────────────────────────────
   Fünf Breiten, drei Ausführungen. Die Kette ist keine Bilderstrecke, sondern
   die Prüfung, dass die Shell an jeder Schwelle noch aufgeht:

     2560  Gehäuse in der Mitte, Werkbank drumherum, Bühne zweispaltig
     1680  Gehäuse noch mit Luft, Bühne zweispaltig
     1280  Gehäuse randnah, Bühne einspaltig
     1024  die Schwelle: eine Spalte, kein Gehäuse mehr
      375  Handy

   Acht Konten, damit Filterzeile und zweite Spalte überhaupt vorkommen — beide
   hängen an dieser Zahl (ui/app.ts, DENSE_FROM). Die BREITE, ab der zwei Spalten
   erlaubt sind, liegt seit V8 bei 98 rem statt 87,5: Die Karte hat jetzt eine
   feste Geometrie mit einer Mindestbreite. Die Begründung samt Rechnung steht bei
   `.strips--dense` in src/style.css; geprüft wird sie in Abschnitt 16. */
const CHAIN_DEMO = [
  'otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
  'otpauth://totp/Google:kevin@example.com?secret=GEZDGNBVGY3TQOJQ&issuer=Google&algorithm=SHA256&digits=8&period=60',
  'GitHub: jbsw y3dp ehpk 3pxp',
  'otpauth://totp/Fastmail:kevin@example.com?secret=MFRGGZDFMZTWQ2LK&issuer=Fastmail',
  'otpauth://totp/Hetzner%20Cloud:kevin@example.com?secret=NBSWY3DPEB3W64TMMQ&issuer=Hetzner%20Cloud',
  'Bitwarden: MZXW6YTBOI======',
  'otpauth://totp/Deutsche%20Bahn:kevin@example.com?secret=ONSWG4TFOQ&issuer=Deutsche%20Bahn',
  'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
  'JBSW0Y3DPEHPK3PXP',
].join('\n');

const CHAIN = [
  { name: '2560', width: 2560, height: 1440 },
  { name: '1680', width: 1680, height: 1050 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1024', width: 1024, height: 800 },
  { name: '0375', width: 375, height: 812 },
];

const CHAIN_SKINS = [
  { name: 'hell', scheme: 'light', lang: 'de', dir: 'ltr' },
  { name: 'dunkel', scheme: 'dark', lang: 'de', dir: 'ltr' },
  { name: 'ar', scheme: 'light', lang: 'ar', dir: 'rtl' },
];

for (const skin of CHAIN_SKINS) {
  for (const size of CHAIN) {
    await session(`30-kette-${size.name}-${skin.name}`, {
      width: size.width,
      height: size.height,
      scheme: skin.scheme,
      lang: skin.lang,
      steps: async (page, name) => {
        await fillSecrets(page, CHAIN_DEMO);
        await checkDocument(page, name, skin.lang, skin.dir);
        await checkNoOverflow(page, name);
        await checkNoBrokenFragments(page, name);

        // Die Shell muss an der richtigen Schwelle umschalten. Ohne diese
        // Prüfung sieht ein Standbild bei 1024 px genauso aus wie eines bei
        // 1023 — und dass die Rail dort noch klebt statt zu fließen, merkt
        // niemand, bis jemand mit einem 1024er davorsitzt.
        const shell = await page.evaluate(() => {
          const rail = document.querySelector('.rail');
          const main = document.querySelector('main');
          return {
            stage: document.querySelector('.device')?.dataset.stage,
            railSticky: getComputedStyle(rail).position === 'sticky',
            columns: getComputedStyle(main).gridTemplateColumns.split(' ').length,
            cased: getComputedStyle(document.querySelector('.device')).borderTopWidth !== '0px',
          };
        });
        const wide = size.width >= 1024;
        if (shell.stage !== 'working') {
          problems.push(`[${name}] Buehne steht auf »${shell.stage}«, erwartet »working«`);
        }
        if (shell.railSticky !== wide) {
          problems.push(
            `[${name}] Rail klebt ${shell.railSticky ? '' : 'nicht '}— erwartet anders`,
          );
        }
        if (shell.cased !== wide) {
          problems.push(`[${name}] Gehaeuse ${shell.cased ? 'da' : 'weg'} — erwartet anders`);
        }

        /* ── Die Karte muss in ihre Spalte passen ──────────────────────────
           Seit V8 hat der Kanalzug eine feste Geometrie: Zifferblatt links,
           Kopiertaste rechts, beide in eigenen Spalten. Eine feste Geometrie hat
           eine Mindestbreite, und wenn sie fehlt, geht nichts kaputt — es wird
           bloß der Kontoname weggekürzt, bis nur der erste Buchstabe übrig ist.

           Genau das ist beim Bau passiert: Bei 1440 px war die Namensspalte 0 px
           breit, und aus „Google" wurde „G". Kein Überlauf, keine Fehlermeldung,
           auf einem verkleinerten Standbild kaum zu sehen. Deshalb steht die
           Prüfung hier und nicht im Auge.

           Zwei Fragen: Ist ein Name gekürzt, der nicht gekürzt sein müsste? Und
           steht der Code noch in seiner Zelle? */
        const fit = await page.evaluate(() => {
          const clipped = [...document.querySelectorAll('.strip__issuer')]
            .filter((el) => el.scrollWidth > el.clientWidth + 1)
            .map((el) => el.textContent.trim());
          const escaped = [...document.querySelectorAll('.dial')].filter((code) => {
            const box = code.getBoundingClientRect();
            const strip = code.closest('.strip').getBoundingClientRect();
            return box.right > strip.right + 1 || box.left < strip.left - 1;
          }).length;
          const strips = document.querySelector('.strips');
          return {
            clipped,
            escaped,
            dense: getComputedStyle(strips).gridTemplateColumns.split(' ').length === 2,
          };
        });

        // 98 rem sind bei 16 px Grundschrift 1568 px.
        const shouldBeDense = size.width >= 1568;
        if (fit.dense !== shouldBeDense) {
          problems.push(
            `[${name}] Buehne ist ${fit.dense ? 'zwei' : 'ein'}spaltig — bei ${size.width} px erwartet: ${shouldBeDense ? 'zwei' : 'ein'}spaltig`,
          );
        }
        if (fit.clipped.length > 0) {
          problems.push(`[${name}] Kontoname gekuerzt: ${fit.clipped.join(', ')}`);
        }
        if (fit.escaped > 0) {
          problems.push(`[${name}] ${fit.escaped} Code(s) laufen aus ihrer Zelle`);
        }

        await shoot(page, name);
      },
    });
  }
}

/* ── 16. Der Leerzustand als Onboarding-Bühne ──────────────────────────────
   Der zweite Zustand, und der, den jeder zuerst sieht. Geprüft wird nicht nur
   das Bild: Im Leerzustand darf es keine Codes-Zone geben, keinen Tresor und
   keinen sichtbaren „Leeren"-Knopf — und den Testschlüssel sehr wohl. */
for (const size of [
  { name: '2560', width: 2560, height: 1440 },
  { name: '1280', width: 1280, height: 900 },
  { name: '0375', width: 375, height: 812 },
]) {
  await session(`31-leer-${size.name}`, {
    width: size.width,
    height: size.height,
    scheme: 'dark',
    lang: 'de',
    steps: async (page, name) => {
      const state = await page.evaluate(() => {
        const seen = (selector) => {
          const element = document.querySelector(selector);
          return element !== null && element.getClientRects().length > 0;
        };
        return {
          stage: document.querySelector('.device')?.dataset.stage,
          codes: seen('#zone-codes'),
          vault: seen('#zone-vault'),
          clear: seen('#key-clear'),
          demo: seen('#key-demo'),
          emblem: seen('#vacant-dial'),
        };
      });
      if (state.stage !== 'vacant') {
        problems.push(`[${name}] Buehne steht auf »${state.stage}«, erwartet »vacant«`);
      }
      if (state.codes) problems.push(`[${name}] Codes-Zone im Leerzustand sichtbar`);
      if (state.vault) problems.push(`[${name}] Tresor im Leerzustand sichtbar`);
      if (state.clear) problems.push(`[${name}] »Leeren« im Leerzustand sichtbar`);
      if (!state.demo) problems.push(`[${name}] Testschluessel im Leerzustand nicht sichtbar`);
      if (!state.emblem) problems.push(`[${name}] Emblem im Leerzustand nicht sichtbar`);
      await checkNoOverflow(page, name);
      await checkNoBrokenFragments(page, name);
      await shoot(page, name);
    },
  });
}

/* ── 17. Der Filter ────────────────────────────────────────────────────────
   Acht Konten sind die Schwelle. Geprüft wird beides: dass er ab dort da ist,
   dass er filtert, und dass „nichts gefunden" auch so gesagt wird. */
await session('32-filter', {
  width: 1680,
  height: 1050,
  scheme: 'dark',
  lang: 'de',
  steps: async (page, name) => {
    await fillSecrets(page, CHAIN_DEMO);

    const visible = () =>
      page.evaluate(() => [...document.querySelectorAll('.strip')].filter((s) => !s.hidden).length);

    if (await page.isHidden('#stage-filter')) {
      problems.push(`[${name}] Filterzeile fehlt bei acht Konten`);
    }
    const all = await visible();

    await page.fill('#strip-filter', 'goog');
    await page.waitForTimeout(200);
    const hits = await visible();
    if (hits === 0 || hits >= all) {
      problems.push(`[${name}] Filter »goog« zeigt ${hits} von ${all} — erwartet dazwischen`);
    }
    await shoot(page, name);

    await page.fill('#strip-filter', 'zzz-gibt-es-nicht');
    await page.waitForTimeout(200);
    if ((await visible()) !== 0) problems.push(`[${name}] Filter ohne Treffer zeigt noch Zeilen`);
    if (await page.isHidden('#filter-void')) {
      problems.push(`[${name}] Kein-Treffer-Meldung fehlt`);
    }

    // Unter der Schwelle verschwindet die Zeile wieder — samt ihrem Inhalt.
    await fillSecrets(page, 'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    if (await page.isVisible('#stage-filter')) {
      problems.push(`[${name}] Filterzeile bleibt unter der Schwelle stehen`);
    }
    if ((await page.inputValue('#strip-filter')) !== '') {
      problems.push(`[${name}] Filtertext ueberlebt das Ausblenden — Zeilen blieben versteckt`);
    }
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
