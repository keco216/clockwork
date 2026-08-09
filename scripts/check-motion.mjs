/**
 * Prüft die Bewegungssprache am laufenden Gerät.
 *
 *   npx vite --port 5180 --strictPort &
 *   node scripts/check-motion.mjs
 *
 * ── Warum das eine eigene Prüfung braucht ──────────────────────────────────
 * `check-tokens.mjs` liest den Quelltext und verlangt, dass jede Dauer aus
 * einem Token kommt. Das ist die halbe Miete: Ein Token sagt nichts darüber,
 * ob die Bewegung am Ende auch LÄUFT. Dieselbe Doppelung wie bei den
 * Abständen — die eine Prüfung fragt, woher ein Wert kommt, die andere, was
 * daraus wird.
 *
 * Drei Sorten Fehler, die nur hier auffallen:
 *
 *   1. Eine Übergangszeile, die von einer späteren Regel überschrieben wird.
 *      Genau so ist in V9 ein zweiter Popover-Eintritt entstanden, den vier
 *      Versionen lang niemand gesehen hat — er lief über dem richtigen.
 *   2. Ein WAAPI-Weg, der stillschweigend nichts tut, weil eine Bedingung
 *      davor greift. Im Quelltext steht die Animation trotzdem da.
 *   3. Eine Bewegung, die `prefers-reduced-motion` überlebt. Das ist der
 *      einzige Fehler dieser Liste, der Menschen schadet.
 *
 * Dazu eine vierte Zeile, die keine Bewegung prüft: die Geometrie des
 * Popovers. Sie steht hier, weil ein Bildschirmfoto sie gefunden hat und kein
 * Skript — `.scroll-edge { position: relative }` hatte in V11 das `absolute`
 * der Listbox überschrieben, und das Popover fiel in den Fluss.
 */

import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://localhost:5180';
const EIN_KONTO = 'RFC 4226: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

/* ── Die Soll-Tabelle ───────────────────────────────────────────────────────
   Je Bauteil: welche Eigenschaft in welcher Zeit. Die Werte sind die Token
   aus styles/tokens.css, hier bewusst als ZAHL ausgeschrieben — eine Prüfung,
   die ihre Erwartung aus derselben Quelle liest wie der Prüfling, prüft
   nichts. Ändert jemand ein Token, muss er hier vorbeikommen. */
const UEBERGAENGE = [
  {
    was: 'Chevron am Auswahlfeld',
    sel: '.colophon__lang .pick-shell',
    pseudo: '::after',
    eigenschaft: 'transform',
    ms: 150,
  },
  {
    was: 'Chevron am Tresor',
    sel: '.vault__state',
    pseudo: '::after',
    eigenschaft: 'transform',
    ms: 250,
  },
  {
    was: 'Chevron am Hinweis',
    sel: '#zone-input .reveal__summary',
    pseudo: '::after',
    eigenschaft: 'transform',
    ms: 250,
  },
  { was: 'Taste, Flaeche', sel: '#key-file', eigenschaft: 'background-color', ms: 100 },
  { was: 'Taste, Druckpunkt', sel: '#key-file', eigenschaft: 'transform', ms: 250 },
  { was: 'Feld', sel: '#secrets', eigenschaft: 'background-color', ms: 150 },
  {
    was: 'Schalter-Daumen',
    sel: '#vault-hide-lock',
    pseudo: '::before',
    eigenschaft: 'transform',
    ms: 300,
  },
  { was: 'Scroll-Kante der Rail', sel: '.rail', eigenschaft: '--fade-start', ms: 150 },
];

const ANIMATIONEN = [
  {
    was: 'Wartezeiger',
    sel: '#vault-primary',
    pseudo: '::before',
    name: 'key-spin',
    ms: 750,
    zustand: 'pending',
  },
];

/* Was nach dem Auslösen tatsächlich laufen muss (Web Animations API).

   ── Warum hier ein ZIEL steht und nicht nur eine Dauer ────────────────────
   Weil die erste Fassung dieser Prüfung ein Loch hatte, und die Gegenprobe hat
   es gefunden: Sie sammelte alle laufenden Dauern in einen Topf und fragte
   „ist 250 dabei?". War es immer — der Aufklapper läuft ebenfalls 250 ms.
   Ein absichtlich lahmgelegter Meldungsweg blieb damit unbemerkt.

   Zwei Verschärfungen: Geprüft wird je Auslöser einzeln, und jede Animation
   muss am RICHTIGEN Element hängen. Dazu zählen nur script-erzeugte
   Animationen — `document.getAnimations()` liefert auch CSS-Übergänge, und
   deren 150 ms haben die Meldungszeile mitgetragen, ohne dass sie lief. */
const WAAPI = [
  { was: 'Popover-Abgang', ziel: 'listbox', ms: 100 },
  { was: 'Hinweis-Aufklapper', ziel: 'reveal__body', ms: 250 },
  { was: 'Tresor-Aufklapper', ziel: 'vault__panel', ms: 250 },
  { was: 'Meldungszeile, Hoehe', ziel: 'vault-error', ms: 250 },
  { was: 'Meldungszeile, Deckkraft', ziel: 'vault-error', ms: 150 },
  { was: 'Kopier-Beschriftung', ziel: 'data-copy-label', ms: 250 },
];

const befunde = [];
let geprueft = 0;

function pruefe(bedingung, text) {
  geprueft++;
  if (bedingung) {
    console.log(`  ✓ ${text}`);
  } else {
    console.log(`  ✗ ${text}`);
    befunde.push(text);
  }
}

/** Millisekunden aus einem `transition-duration`-Eintrag. */
function msAus(wert) {
  const zahl = Number.parseFloat(wert);
  return wert.trim().endsWith('ms') ? zahl : zahl * 1000;
}

const browser = await chromium.launch();

/* ══ Durchgang 1: die Uebergaenge stehen so da, wie sie sollen ═════════════ */

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.fill('#secrets', EIN_KONTO);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.waitForTimeout(600);
  // Der Tresor muss offen sein, damit Passwortfeld und Schalter ein Rechteck
  // haben — ein zugeklappter `<details>`-Inhalt hat keins (die Falle aus V8).
  await page.click('#vault-disclosure > summary');
  await page.waitForTimeout(500);

  console.log('\nUebergaenge (getComputedStyle):');
  for (const eintrag of UEBERGAENGE) {
    const gemessen = await page.evaluate(
      ({ sel, pseudo, eigenschaft }) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const stil = getComputedStyle(el, pseudo ?? undefined);
        const namen = stil.transitionProperty.split(',').map((s) => s.trim());
        const zeiten = stil.transitionDuration.split(',').map((s) => s.trim());
        const index = namen.indexOf(eigenschaft);
        // Eine einzelne Dauer gilt für alle Eigenschaften der Liste.
        return index === -1 ? null : (zeiten[index] ?? zeiten[0] ?? null);
      },
      { sel: eintrag.sel, pseudo: eintrag.pseudo ?? null, eigenschaft: eintrag.eigenschaft },
    );

    pruefe(
      gemessen !== null && Math.abs(msAus(gemessen) - eintrag.ms) < 1,
      `${eintrag.was}: ${eintrag.eigenschaft} = ${gemessen ?? 'FEHLT'} (soll ${String(eintrag.ms)}ms)`,
    );
  }

  console.log('\nAnimationen (getComputedStyle):');
  for (const eintrag of ANIMATIONEN) {
    // Der Wartezeiger lebt nur waehrend der Ableitung. Statt sie abzuwarten
    // wird das Attribut gesetzt — geprueft wird die REGEL, nicht der Ablauf.
    await page.evaluate((sel) => {
      document.querySelector(sel)?.setAttribute('data-pending', '');
    }, eintrag.sel);
    const gemessen = await page.evaluate(
      ({ sel, pseudo }) => {
        const stil = getComputedStyle(document.querySelector(sel), pseudo);
        return {
          name: stil.animationName,
          dauer: stil.animationDuration,
          takt: stil.animationTimingFunction,
        };
      },
      { sel: eintrag.sel, pseudo: eintrag.pseudo },
    );
    pruefe(
      gemessen.name === eintrag.name && Math.abs(msAus(gemessen.dauer) - eintrag.ms) < 1,
      `${eintrag.was}: ${gemessen.name} ${gemessen.dauer} ${gemessen.takt} (soll ${eintrag.name} ${String(eintrag.ms)}ms)`,
    );
    await page.evaluate((sel) => {
      document.querySelector(sel)?.removeAttribute('data-pending');
    }, eintrag.sel);
  }

  /* ── Die Geometrie des Popovers ────────────────────────────────────────── */
  console.log('\nGeometrie des Sprach-Popovers:');
  await page.click('.colophon__lang .pick--button');
  await page.waitForTimeout(350);
  const geo = await page.evaluate(() => {
    const shell = document.querySelector('.colophon__lang .pick-shell');
    const list = document.querySelector('.colophon__lang .listbox');
    const s = shell.getBoundingClientRect();
    const l = list.getBoundingClientRect();
    const zuEng = [...list.querySelectorAll('.listbox__option')].filter(
      (row) => row.scrollWidth > row.clientWidth + 1,
    ).length;
    return {
      position: getComputedStyle(list).position,
      breiteGleich: Math.round(l.width) === Math.round(s.width),
      nachOben: Math.round(l.bottom) <= Math.round(s.top),
      zuEng,
    };
  });
  pruefe(geo.position === 'absolute', `Popover ist absolut positioniert (${geo.position})`);
  pruefe(geo.breiteGleich, 'Popover ist so breit wie sein Ausloeser');
  pruefe(geo.nachOben, 'Popover klappt nach oben');
  pruefe(geo.zuEng === 0, `kein Sprachname laeuft aus seiner Zeile (${String(geo.zuEng)} zu eng)`);

  await page.close();
}

/* ══ Durchgang 2: die WAAPI-Wege laufen wirklich ═══════════════════════════ */

/**
 * Löst eine Bewegung aus und meldet, WAS danach WO läuft.
 *
 * Gemessen wird über `document.getAnimations()` und nicht am Element: Bei den
 * Aufklappern läuft die Animation auf dem INHALT, bei der Kopiertaste auf der
 * Beschriftung — wer am ausgelösten Element misst, misst am falschen.
 *
 * Gefiltert auf script-erzeugte Animationen: `getAnimations()` liefert auch
 * `CSSTransition` und `CSSAnimation`, und die haben die WAAPI-Prüfung in der
 * ersten Fassung stillschweigend bestanden lassen.
 */
async function laeuft(page, ausloeser) {
  await ausloeser();
  return page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.constructor.name === 'Animation' && a.playState === 'running')
      .map((a) => {
        const ziel = a.effect?.target ?? null;
        const name =
          ziel === null
            ? '?'
            : ziel.id ||
              ziel.className.split(' ')[0] ||
              [...ziel.attributes].map((x) => x.name).find((x) => x.startsWith('data-')) ||
              ziel.tagName.toLowerCase();
        return `${name}@${String(Math.round(a.effect?.getComputedTiming?.().duration ?? -1))}`;
      }),
  );
}

{
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-write'],
  });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.fill('#secrets', EIN_KONTO);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.waitForTimeout(700);

  console.log('\nWAAPI-Wege (getAnimations nach dem Ausloesen):');

  /** Was ein Auslöser gestartet hat — je Posten getrennt geprüft. */
  const gesehen = new Map();
  const merken = (posten, liste) => {
    gesehen.set(posten, liste);
  };

  // Popover auf und wieder zu — der Abgang ist der WAAPI-Weg.
  await page.click('.colophon__lang .pick--button');
  await page.waitForTimeout(350);
  merken('Popover-Abgang', await laeuft(page, () => page.keyboard.press('Escape')));
  await page.waitForTimeout(300);

  merken(
    'Hinweis-Aufklapper',
    await laeuft(page, () => page.click('#zone-input .reveal__summary')),
  );
  await page.waitForTimeout(500);

  merken('Tresor-Aufklapper', await laeuft(page, () => page.click('#vault-disclosure > summary')));
  await page.waitForTimeout(500);

  // Die Meldungszeile: ein leeres Passwort abschicken.
  const meldung = await laeuft(page, () => page.click('#vault-primary'));
  merken('Meldungszeile, Hoehe', meldung);
  merken('Meldungszeile, Deckkraft', meldung);
  await page.waitForTimeout(500);

  // Die Kopier-Beschriftung wechselt erst, wenn die Zwischenablage
  // geantwortet hat — auf den Text warten, nicht auf eine Zahl raten.
  const vorher = await page.evaluate(
    () => document.querySelector('[data-copy-label]')?.textContent ?? '',
  );
  merken(
    'Kopier-Beschriftung',
    await laeuft(page, async () => {
      await page.click('[data-copy]');
      await page.waitForFunction(
        (alt) => (document.querySelector('[data-copy-label]')?.textContent ?? '') !== alt,
        vorher,
        { timeout: 5000 },
      );
    }),
  );

  for (const eintrag of WAAPI) {
    const liste = gesehen.get(eintrag.was) ?? [];
    pruefe(
      liste.includes(`${eintrag.ziel}@${String(eintrag.ms)}`),
      `${eintrag.was}: ${eintrag.ziel}@${String(eintrag.ms)}ms gelaufen (gesehen: ${liste.join(', ') || 'nichts'})`,
    );
  }

  await page.close();
}

/* ══ Durchgang 3: unter reduced-motion laeuft NICHTS ═══════════════════════ */

{
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    permissions: ['clipboard-write'],
  });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.fill('#secrets', EIN_KONTO);
  await page.waitForTimeout(700);

  console.log('\nreduced-motion:');
  const schritte = [
    ['Popover auf', () => page.click('.colophon__lang .pick--button')],
    ['Popover zu', () => page.keyboard.press('Escape')],
    ['Hinweis-Aufklapper', () => page.click('#zone-input .reveal__summary')],
    ['Tresor-Aufklapper', () => page.click('#vault-disclosure > summary')],
    ['Meldungszeile', () => page.click('#vault-primary')],
    ['Kopieren', () => page.click('[data-copy]')],
  ];

  for (const [name, tun] of schritte) {
    await tun();
    // Zwei Bilder abwarten: Eine CSS-Animation mit 0,001 ms ist im selben
    // Tick noch „running", und das waere ein Fehlalarm.
    await page.evaluate(
      () =>
        new Promise((fertig) => {
          requestAnimationFrame(() => requestAnimationFrame(() => fertig()));
        }),
    );
    const laufend = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.playState === 'running')
        .map(
          (a) =>
            a.animationName ??
            `WAAPI ${String(Math.round(a.effect?.getComputedTiming?.().duration ?? -1))}ms`,
        ),
    );
    pruefe(laufend.length === 0, `${name}: nichts laeuft (${laufend.join(', ') || 'leer'})`);
    await page.waitForTimeout(250);
  }

  await page.close();
}

await browser.close();

console.log(`\nGeprueft: ${String(geprueft)} Zusagen.`);
if (befunde.length > 0) {
  console.error('\nBefunde:');
  for (const b of befunde) console.error('  ✗ ' + b);
  process.exitCode = 1;
} else {
  console.log('\n✓ Jede Bewegung laeuft so, wie sie soll — und unter reduced-motion keine.');
}
