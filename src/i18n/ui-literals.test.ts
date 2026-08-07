/**
 * Steht in `src/ui/` noch irgendwo ein Text, der nicht durch `t()` läuft?
 *
 * ── Warum ein Test und keine Lint-Regel ────────────────────────────────────
 * Eine ESLint-Regel dafür gäbe es nur als eigenes Plugin — für eine einzige
 * Prüfung wäre das mehr Apparat als Nutzen, und sie liefe ohnehin nur über
 * `npm run lint`. Als Test läuft sie bei jedem `npm test` mit, und die
 * Ausnahmen stehen mit Begründung an derselben Stelle wie die Regel.
 *
 * ── Wie erkannt wird, dass ein Literal Sprache ist ─────────────────────────
 * Zwei Verdachtsmomente, beide bewusst grob:
 *
 *   1. Ein Zeichen außerhalb des druckbaren ASCII-Bereichs. Deutsche Umlaute,
 *      Anführungszeichen, Gedankenstriche — davon hat in `src/ui/` nichts mehr
 *      etwas zu suchen.
 *   2. Zwei Wörter, durch Leerraum getrennt. Selektoren, Klassennamen,
 *      Ereignisnamen und Attributwerte enthalten keine Leerzeichen; Sätze schon.
 *
 * Beides fängt eher zu viel als zu wenig. Was übrig bleibt, steht unten in der
 * Ausnahmeliste — jede Zeile mit Grund.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const UI_DIR = fileURLToPath(new URL('../ui', import.meta.url));

/**
 * Erlaubte Literale — exakt der Inhalt zwischen den Anführungszeichen.
 *
 * Die Regel für diese Liste: Ein Eintrag darf nur hier stehen, wenn der Text
 * NIE vor einem Nutzer landet. Alles, was jemand lesen kann, gehört in den
 * Katalog.
 */
const ALLOWED: ReadonlyArray<{ readonly literal: string; readonly reason: string }> = [
  {
    literal: '–',
    reason:
      'Gedankenstrich als Platzhalter im Zifferblatt, solange kein Code berechnet ist. ' +
      'Ein Schriftzeichen, kein Wort — in jeder Sprache dasselbe.',
  },
  {
    literal: ' · ',
    reason:
      'Der Trennpunkt, mit dem dieses Gerät überall Angaben aneinanderreiht — im Kopf, in der ' +
      'Parameterzeile, im Fuß. Ein Gestaltungszeichen, kein Wort: Er sieht in jeder Sprache ' +
      'gleich aus und funktioniert auch rechtsläufig. Wo eine Sprache die Teile UMSTELLEN ' +
      'können muss, steht er dagegen im Katalog (status.line, input.count.join).',
  },
  {
    literal: 'Element »${selector}« fehlt — index.html und Code passen nicht zusammen.',
    reason:
      'Programmierfehler-Diagnose aus dom.ts. Wird geworfen, wenn index.html und Code ' +
      'auseinanderlaufen — das ist ein Baufehler, kein Nutzerfehler, und die Meldung ' +
      'landet in der Konsole der Entwicklerin.',
  },
  {
    literal: '<template id="${id}"> fehlt in index.html.',
    reason:
      'Dieselbe Klasse von Diagnose wie oben: Das Template steht in index.html, fehlt es, ' +
      'ist der Bau kaputt.',
  },
  {
    literal: '<template id="${id}"> enthält kein Element.',
    reason:
      'Dieselbe Klasse von Diagnose wie oben: Ein leeres Template ist ein Fehler in ' +
      'index.html, nicht in der Eingabe.',
  },
  {
    literal: 'Der Browser hat das Kopieren abgelehnt.',
    reason:
      'Wird von dom.ts geworfen und in strip.ts gefangen; angezeigt wird dort ' +
      't("strip.copyFailedHint"). Der Text hier erreicht nie eine Oberfläche.',
  },
];

const ALLOWED_LITERALS = new Set(ALLOWED.map((entry) => entry.literal));

/**
 * Findet String- und Template-Literale und überspringt dabei Kommentare.
 *
 * Ein Durchlauf von links nach rechts mit EINEM Muster für beides: So kann ein
 * `//` innerhalb einer Zeichenkette nicht als Kommentaranfang missverstanden
 * werden und ein Anführungszeichen innerhalb eines Kommentars nicht als
 * Zeichenkette.
 */
function literalsIn(source: string): string[] {
  const token =
    /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
  const found: string[] = [];
  for (let match = token.exec(source); match !== null; match = token.exec(source)) {
    const text = match[0];
    const quote = text.charAt(0);
    if (quote === "'" || quote === '"' || quote === '`') {
      found.push(text.slice(1, -1));
    }
  }
  return found;
}

/** Sieht das nach natürlicher Sprache aus? */
function looksLikeProse(literal: string): boolean {
  const nonAscii = /[^ -~]/u.test(literal);
  const twoWords = /[A-Za-z]{2,}\s+[A-Za-z]{2,}/u.test(literal);
  return nonAscii || twoWords;
}

const FILES = readdirSync(UI_DIR)
  .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
  .sort();

describe('src/ui enthält keine harten Texte', () => {
  it('findet überhaupt Dateien zum Prüfen', () => {
    expect(FILES.length).toBeGreaterThan(5);
  });

  it.each(FILES)('%s', (name) => {
    const source = readFileSync(path.join(UI_DIR, name), 'utf8');
    const suspects = literalsIn(source)
      .filter(looksLikeProse)
      .filter((literal) => !ALLOWED_LITERALS.has(literal));

    expect(suspects, `Nicht übersetzte Texte in ${name}`).toEqual([]);
  });
});

describe('Ausnahmeliste', () => {
  it('begründet jede Ausnahme', () => {
    for (const entry of ALLOWED) {
      expect(entry.reason.length, entry.literal).toBeGreaterThan(30);
    }
  });

  it('führt nichts, was gar nicht mehr vorkommt', () => {
    // Eine Ausnahme, die ins Leere zeigt, ist eine Erlaubnis, die niemand mehr
    // liest — und beim nächsten Mal wird sie zum Vorbild.
    const everything = FILES.flatMap((name) =>
      literalsIn(readFileSync(path.join(UI_DIR, name), 'utf8')),
    );
    for (const entry of ALLOWED) {
      expect(everything, `verwaiste Ausnahme: ${entry.literal}`).toContain(entry.literal);
    }
  });
});
