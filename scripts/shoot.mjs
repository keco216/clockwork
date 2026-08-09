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

/**
 * Liegt jeder gerechnete Abstand auf der Skala?
 *
 * ── Warum das zweimal geprüft wird ─────────────────────────────────────────
 * `scripts/check-tokens.mjs` liest den QUELLTEXT und verlangt, dass jeder
 * Abstand aus einem Token kommt. Das ist notwendig und nicht hinreichend: Zwei
 * richtige Tokens ergeben in einem `calc()` einen falschen Wert, ein Rahmen
 * kommt zu einer Zeilenhöhe dazu, und `min-height` ist eine Untergrenze und kein
 * Maß. Was am Ende dasteht, weiß nur der Browser.
 *
 * Gefunden hat diese Prüfung genau solche Fälle: `--scroll-anchor` stand als
 * 5,5 rem da, also 88 px — ein Wert, der auf keiner Sprosse liegt, obwohl er ein
 * Token war. Und der Chip kam auf 26 px, weil sein Rahmen zur Zeilenhöhe
 * dazukam.
 *
 * Die Skala hat acht Sprossen: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.
 *
 * ── Die drei Ausnahmen ─────────────────────────────────────────────────────
 * Alle drei hängen an einer Schriftgröße und nicht am Raster, deshalb stehen sie
 * in `em` und dürfen daneben liegen:
 *   • `.sr-only` — der −1-px-Trick, der ein Element für Augen entfernt.
 *   • `.wordmark__o` — der Ausgleich für die Sperrung des vorigen Buchstabens.
 *   • `abbr` im Zifferblatt — das Einheitszeichen an der Ziffernbreite.
 */
const SPACING_SCALE = [4, 8, 12, 16, 24, 32, 48, 64];

/**
 * Bauteile, deren Abstand an einer SCHRIFTGRÖSSE hängt und nicht am Raster. Sie
 * stehen in `em`, wandern mit der Typo-Skala mit und liegen deshalb zwangsläufig
 * zwischen den Sprossen. Dieselben drei stehen mit derselben Begründung in der
 * ALLOWED-Tabelle von scripts/check-tokens.mjs.
 */
const SCALE_EXEMPT = new Map([
  [
    'sr-only',
    'Der -1-px-Trick, der ein Element fuer Augen entfernt und fuer Screenreader behaelt.',
  ],
  [
    'wordmark__o',
    'Ausgleich fuer die Sperrung des vorigen Buchstabens — derselbe Wert wie die Sperrung.',
  ],
  ['kbd', 'Eine Tastenkappe im Fliesstext waechst mit der Schrift um sie herum.'],
]);

async function checkSpacingScale(page, name) {
  const off = await page.evaluate(
    ([scale, exempt]) => {
      const PROPS = [
        'row-gap',
        'column-gap',
        'padding-top',
        'padding-right',
        'padding-bottom',
        'padding-left',
        'margin-top',
        'margin-right',
        'margin-bottom',
        'margin-left',
      ];
      const found = [];
      const seen = new Set();
      for (const element of document.querySelectorAll('.device, .device *')) {
        // `<option>` und `<abbr>` tragen Vorgaben des Systems, nicht unsere.
        if (element.tagName === 'OPTION' || element.tagName === 'ABBR') continue;
        if (getComputedStyle(element).display === 'none') continue;
        const first =
          (typeof element.className === 'string' && element.className.split(' ')[0]) ||
          element.tagName.toLowerCase();
        if (exempt.includes(first)) continue;

        // Der Typed-OM-Wert und NICHT `getComputedStyle`: Letzteres löst
        // `margin-inline: auto` in den Pixelwert auf, der beim Zentrieren gerade
        // herauskommt — bei 1680 px sind das 40 px, bei 1683 px 41,5. Das ist
        // keine Abstandsentscheidung, sondern das Ergebnis einer. Im Typed OM
        // bleibt `auto` ein Schlüsselwort und fällt damit von selbst heraus.
        const map = element.computedStyleMap();
        for (const prop of PROPS) {
          const value = map.get(prop);
          // Schlüsselwörter (auto, normal) und Prozente sind keine Abstände.
          if (value === undefined || value === null || value.unit !== 'px') continue;
          const px = Math.abs(value.value);
          if (px === 0) continue;
          if (scale.some((rung) => Math.abs(px - rung) < 0.6)) continue;
          const key = `${first}|${prop}|${px}`;
          if (seen.has(key)) continue;
          seen.add(key);
          found.push(`${first} ${prop} = ${value.toString()}`);
        }
      }
      return found;
    },
    [SPACING_SCALE, [...SCALE_EXEMPT.keys()]],
  );
  if (off.length > 0) {
    problems.push(
      `[${name}] Abstand neben der Skala (${SPACING_SCALE.join('/')}): ${off.join(' · ')}`,
    );
  }
}

/**
 * Frisst irgendwo ein leerer Kasten eine Rasterfuge?
 *
 * ── Warum das keine Kleinigkeit ist ────────────────────────────────────────
 * Ein Kind der Höhe 0 ist immer noch ein Kind, und `gap` fällt vor ihm an. In
 * einem Flexkasten mit `gap: 16px` kostet ein leeres Element also 16 px — und
 * zwar an einer Stelle, an der niemand ein Element vermutet.
 *
 * Gefunden wurden damit zwei Stellen, beide unterhalb des letzten
 * Bedienelements ihres Panels: die leere Import-Rückmeldung (16 px) und die
 * Hülle der drei Tresor-Tasten, die alle drei versteckt waren (12 px). Zusammen
 * sah das aus wie ein Panel, das unten nicht schließt.
 *
 * Ein leerer Kasten ist übrigens nicht per se falsch: Wer Platz RESERVIEREN
 * will, tut genau das (`.slot__meter` hält die Chiphöhe frei, damit die
 * Tastenzeile beim ersten Eintrag nicht springt). Gesucht sind deshalb Kinder
 * ohne Höhe UND ohne Inhalt — die reservieren nichts, sie kosten nur.
 */
async function checkNoDeadGaps(page, name) {
  const dead = await page.evaluate(() => {
    const found = [];
    for (const box of document.querySelectorAll('.device *')) {
      const style = getComputedStyle(box);
      if (style.display !== 'flex' && style.display !== 'grid') continue;
      const gap = Number.parseFloat(style.rowGap);
      if (!Number.isFinite(gap) || gap === 0) continue;
      // Ein Kasten, der selbst nicht gezeichnet wird, hat keine Fugen zu
      // verschenken. Ohne diese Zeile meldet die Prüfung den Inhalt des
      // versteckten Kamerasuchers — dessen Kinder sind `display: block` und
      // trotzdem null Pixel hoch, weil ihr Elternteil `hidden` trägt.
      if (box.getBoundingClientRect().height === 0) continue;

      for (const child of box.children) {
        if (child.hidden) continue;
        // Die EINE Ausnahme, und sie ist genau umgekehrt gemeint: `.keys__gap`
        // IST ein leerer Kasten, der eine Fuge kostet — er erzwingt damit den
        // Zeilenumbruch in der Tastenzeile. Siehe styles/panels.css.
        if (child.classList.contains('keys__gap')) continue;
        const childStyle = getComputedStyle(child);
        if (childStyle.display === 'none' || childStyle.position === 'absolute') continue;
        const rect = child.getBoundingClientRect();
        if (rect.height > 0.5) continue;
        // Ein Element, das Platz reserviert, hat eine Mindesthöhe. Eines, das
        // nur kostet, hat nichts.
        if (Number.parseFloat(childStyle.minHeight) > 0) continue;
        found.push(
          `${child.className || child.tagName.toLowerCase()} in .${box.className.split(' ')[0]} (${gap} px)`,
        );
      }
    }
    return found;
  });
  if (dead.length > 0) {
    problems.push(`[${name}] Leerer Kasten frisst eine Fuge: ${dead.join(' · ')}`);
  }
}

/**
 * Steht jedes Bedienelement auf der Höhenleiter?
 *
 * ── Warum das gemessen werden muss ─────────────────────────────────────────
 * Weil `min-height` eine Untergrenze ist und kein Maß. Das Tresor-Passwortfeld
 * hat seit V5 `min-height: var(--control-h)` getragen und war trotzdem 51,5 px
 * hoch: Die gemeinsame `.field`-Basis bringt 12 px senkrechten Innenabstand mit,
 * und die kommen oben drauf. Der Kommentar an der Stelle behauptete drei
 * Versionen lang, das Feld und der Knopf daneben hätten dieselbe Höhe.
 *
 * Dieselbe Prüfung hätte auch die zweite Hälfte des Fehlers gefunden: `.field`
 * setzt `line-height: 1.7`, und die Zeile `line-height: 1.4` im Passwortfeld war
 * wegen der @import-Reihenfolge ebenfalls wirkungslos.
 *
 * Die Textarea steht nicht in der Liste — sie ist mehrzeilig und in der Höhe
 * verstellbar, also hat sie keine Sprosse.
 *
 * ── Die Sprossen sind seit V9 die der HeroUI-Referenz ──────────────────────
 * Chips 24 · Auswahlfeld 36 (fest) · Tasten und Felder 40, ab 768 px 36 ·
 * lg-Taste 44, ab 768 px 40 · Aufklapper 44. Als MENGE gefuehrt, nicht je
 * Fenster: Die Pruefung fragt „steht die Hoehe auf einer Sprosse", nicht
 * „steht sie auf der richtigen" — Letzteres sieht man auf den Screenshots.
 * 32 und 48 sind mit V8 gegangen (HeroUI kennt im Bestand dieser App beide
 * nicht), 36 ist neu dazugekommen.
 */
const LADDER = [24, 36, 40, 44];

async function checkControlHeights(page, name) {
  const off = await page.evaluate(
    (ladder) =>
      [
        ...document.querySelectorAll(
          '.key, .chip, .pick, .vault__state, .reveal__summary, input.field',
        ),
      ]
        .filter((element) => {
          if (element.hidden || getComputedStyle(element).display === 'none') return false;
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
  if (off.length > 0) {
    problems.push(
      `[${name}] Bedienelement neben der Hoehenleiter (${LADDER.join('/')}): ${off.join(' · ')}`,
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

    // Der Zustand »aus« mit aufgeklapptem Panel ist der Fall, in dem die
    // beiden Fehler steckten, die V8 hier gefunden hat: die Hülle der drei
    // versteckten Tasten und die leere Fehlerzeile — zusammen 20 px tote Fuge
    // unter dem letzten Knopf. Geprüft wird deshalb VOR dem Speichern.
    await checkNoDeadGaps(page, name);
    await checkControlHeights(page, name);

    await page.fill('#vault-pass', 'ein-langes-passwort-42');
    await page.click('#vault-primary');
    await page.waitForFunction(() => document.querySelector('#vault')?.dataset.state === 'open', {
      timeout: 15000,
    });
    // Und im offenen Zustand noch einmal: Jetzt sind alle drei Tasten da, die
    // Fehlerzeile ist leer, und das Formular ist weg.
    await checkNoDeadGaps(page, name);
    await checkControlHeights(page, name);
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
        await checkNoDeadGaps(page, name);
        await checkControlHeights(page, name);
        await checkSpacingScale(page, name);

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
        // Das Gehäuse ist mit V9 entfallen (die Panels liegen als Karten
        // direkt auf dem Grund) — geprüft wird stattdessen die zweite Hälfte
        // der Schwelle: Ab 1024 px hat main zwei Rasterspalten, darunter eine.
        // Genau diese Doppelpruefung hat den 64rem/63.9375rem-Fehler gefunden,
        // und sie funktioniert ohne Gehaeuse genauso.
        if (shell.columns >= 2 !== wide) {
          problems.push(
            `[${name}] main hat ${shell.columns} Rasterspalte(n) — erwartet ${wide ? 'zwei' : 'eine'}`,
          );
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

/* ── 18. Das Statesheet ────────────────────────────────────────────────────
   Alle Bedienelemente in allen Zuständen auf EINEM Bild.

   ── Warum das nicht mit page.hover() geht ─────────────────────────────────
   Weil die Maus an einer Stelle ist. Ein Bild je Zustand je Bauteil wären hier
   vierzig Aufnahmen, und der Vergleich — genau der Zweck der Sache — fände dann
   im Kopf statt auf dem Papier.

   Nachgebaute Zustände wären der andere naheliegende Weg und der schlechtere:
   Eine Klasse `.is-hover`, die dasselbe setzt wie `:hover`, ist eine zweite
   Wahrheit über denselben Zustand. Sie geht genau dann auseinander, wenn jemand
   nur eine von beiden anfasst — und dann fotografiert das Statesheet etwas, das
   es nicht gibt.

   Also die echten Pseudoklassen, erzwungen über `CSS.forcePseudoState` aus dem
   DevTools-Protokoll. Das ist derselbe Schalter, den die Elementleiste von Chrome
   anbietet; er wirkt auf die echte Kaskade, und es gibt nichts zu pflegen.

   Die Bauteile werden dafür GEKLONT und in eine Prüffläche gehängt: Sie tragen
   damit dieselben Klassen wie ihre Vorbilder und liegen trotzdem beieinander.

   ── Was das Blatt schon gefunden hat ──────────────────────────────────────
   `:disabled` hatte keine Gestaltung. Der Tresor-Knopf ist während der
   Schlüsselableitung gesperrt und sah dabei aus wie ein bedienbarer Knopf. Vier
   Zustände nebeneinander zeigen sofort, wenn zwei davon dasselbe Bild sind — auf
   der Seite selbst sieht man es nie, weil man die Zustände nie gleichzeitig hat. */

const STATES = ['ruhend', 'hover', 'aktiv', 'fokus', 'gesperrt'];
const FORCED = {
  ruhend: [],
  hover: ['hover'],
  aktiv: ['hover', 'active'],
  fokus: ['focus-visible'],
};

for (const scheme of ['light', 'dark']) {
  await session(`40-statesheet-${scheme}`, {
    width: 1280,
    height: 900,
    scheme,
    lang: 'de',
    steps: async (page, name) => {
      await fillSecrets(page);
      // Der Tresor muss offen sein, sonst gibt es die beiden Knöpfe nicht, die
      // nur dort vorkommen (Löschen, Zusperren).
      await page.evaluate(() => {
        const disclosure = document.querySelector('#vault-disclosure');
        if (disclosure !== null) disclosure.open = true;
      });
      await page.waitForTimeout(200);

      const built = await page.evaluate(
        ([states]) => {
          const KINDS = [
            ['solid', '#vault-primary'],
            ['bordered', '#key-file'],
            ['quiet', '#key-clear'],
            ['danger', '#vault-wipe'],
            ['kopieren', '[data-copy]'],
            ['feld', '#vault-pass'],
            ['auswahl', '.colophon__lang .pick-shell'],
            ['schalter', '.vault__check'],
            ['chip', '.strip__spec'],
          ];

          const sheet = document.createElement('div');
          sheet.id = 'statesheet';
          sheet.style.position = 'fixed';
          sheet.style.insetInlineStart = '0';
          sheet.style.insetBlockStart = '0';
          sheet.style.zIndex = '9999';
          sheet.style.display = 'grid';
          sheet.style.gridTemplateColumns = `8rem repeat(${states.length}, auto)`;
          sheet.style.gap = 'var(--sp-3)';
          sheet.style.alignItems = 'center';
          sheet.style.padding = 'var(--sp-5)';
          sheet.style.background = 'var(--surface)';
          sheet.style.border = '1px solid var(--rule)';
          sheet.style.borderRadius = 'var(--radius-panel)';
          sheet.style.boxShadow = 'var(--elev-2)';

          const caption = (text) => {
            const cell = document.createElement('span');
            cell.textContent = text;
            cell.style.fontSize = 'var(--t-micro)';
            cell.style.letterSpacing = 'var(--track-caps)';
            cell.style.textTransform = 'uppercase';
            cell.style.color = 'var(--ink-3)';
            return cell;
          };

          sheet.append(caption(''));
          for (const state of states) sheet.append(caption(state));

          const missing = [];
          for (const [kind, selector] of KINDS) {
            const source = document.querySelector(selector);
            if (source === null) {
              missing.push(`${kind} (${selector})`);
              continue;
            }
            sheet.append(caption(kind));
            for (const state of states) {
              const holder = document.createElement('span');
              holder.dataset['cell'] = `${kind}-${state}`;
              const clone = source.cloneNode(true);
              clone.removeAttribute('hidden');
              clone.removeAttribute('id');
              for (const node of clone.querySelectorAll('[id]')) node.removeAttribute('id');
              if (state === 'gesperrt') {
                if ('disabled' in clone) clone.disabled = true;
                else clone.setAttribute('aria-disabled', 'true');
              }
              holder.append(clone);
              sheet.append(holder);
            }
          }

          document.body.append(sheet);
          return { missing };
        },
        [STATES],
      );

      if (built.missing.length > 0) {
        problems.push(
          `[${name}] Bauteile fuers Statesheet nicht gefunden: ${built.missing.join(', ')}`,
        );
      }

      /* Die Zustände erzwingen. `CSS.forcePseudoState` will Knoten-IDs, also
         erst das Dokument holen — und zwar NACH dem Bauen, sonst kennt das
         Protokoll die neuen Knoten nicht. */
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });

      for (const state of STATES) {
        const forced = FORCED[state];
        if (forced === undefined || forced.length === 0) continue;
        const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
          nodeId: root.nodeId,
          selector: `[data-cell$="-${state}"] > *`,
        });
        if (nodeIds.length === 0) {
          problems.push(`[${name}] Keine Knoten fuer Zustand »${state}« gefunden`);
        }
        for (const nodeId of nodeIds) {
          try {
            await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: forced });
          } catch {
            // `focus-visible` kennt nicht jede Chrome-Fassung. Dann eben `focus`
            // — und der Befund sagt, dass das Blatt an dieser Stelle weniger
            // zeigt, als es soll.
            try {
              await cdp.send('CSS.forcePseudoState', {
                nodeId,
                forcedPseudoClasses: forced.map((name) =>
                  name === 'focus-visible' ? 'focus' : name,
                ),
              });
              problems.push(`[${name}] »focus-visible« nicht erzwingbar, auf »focus« ausgewichen`);
            } catch (error) {
              problems.push(`[${name}] Zustand »${state}« nicht erzwingbar: ${error.message}`);
            }
          }
        }
      }

      await page.waitForTimeout(300);

      /* Ausschnitt in Fensterkoordinaten, nicht `elementHandle.screenshot()` —
         dieselbe Lehre wie in check-contrast.mjs: Eine Elementaufnahme scrollt,
         und eine feste Fläche wandert dabei aus dem Bild. */
      const box = await page.evaluate(() => {
        const rect = document.getElementById('statesheet').getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      });
      const file = path.join(outDir, `${name}.png`);
      await page.screenshot({
        path: file,
        clip: {
          x: Math.max(0, Math.floor(box.x)),
          y: Math.max(0, Math.floor(box.y)),
          width: Math.min(1280, Math.ceil(box.width)),
          height: Math.min(900, Math.ceil(box.height)),
        },
      });
      shots.push(file);
    },
  });
}

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
