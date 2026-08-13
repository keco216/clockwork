/**
 * Woerter, die in einer NATIVEN App nicht wahr sind.
 *
 * ── Warum es diese Datei gibt ─────────────────────────────────────────────
 * `vacant.text` war kein Einzelfall. Der gemeinsame Katalog ist fuer eine
 * Web-App geschrieben, und einige Saetze sagen das auch: „verlaesst diesen
 * Browser", „HMAC ueber die Web Crypto API", „bei `file://` sperren die
 * meisten Browser die Kamera", „Berechtigung im Browser zuruecksetzen". In
 * der nativen App ist davon kein Wort richtig — und das faellt niemandem auf,
 * weil der Satz ja uebersetzt und grammatisch einwandfrei dasteht.
 *
 * Ein falscher Satz an dieser Stelle ist teurer als ein fehlender: Er
 * behauptet etwas ueber die Sicherheitseigenschaften der App, und genau
 * dafuer liest ihn jemand.
 *
 * ── Warum nur Englisch geprueft wird ──────────────────────────────────────
 * Englisch ist die Quelle der Wahrheit; die 36 anderen sind daraus
 * uebersetzt. Ein Browser-Satz, der auf Englisch nicht mehr dasteht, kann in
 * einer Uebersetzung nur noch als Altlast auftauchen — und die faende diese
 * Liste ohnehin nicht, weil „Browser" auf Thai anders heisst. Die Pruefung
 * haengt deshalb bewusst an der einen Sprache, in der sie greifen KANN.
 *
 * ── Ausnahmen ────────────────────────────────────────────────────────────
 * `ALLOWED` traegt Schluessel, bei denen ein Treffer richtig ist — mit
 * Begruendung. Die Liste ist absichtlich leer, solange niemand eine braucht:
 * Eine Ausnahmeliste, die man ohne Begruendung fuellen darf, ist keine.
 */

/**
 * Die Muster. Wortgrenzen, damit „tab" nicht in „table" oder „establish"
 * anschlaegt — genau diese Falle nennt der Auftrag ausdruecklich.
 */
export const WEB_WORDS = [
  { name: 'browser', pattern: /\bbrowsers?\b/i },
  { name: 'file://', pattern: /file:\/\// },
  { name: 'Web Crypto', pattern: /\bweb crypto\b/i },
  { name: 'tab', pattern: /\btabs?\b/i },
];

/**
 * Schluessel, die einen Treffer vorerst tragen duerfen — mit Begruendung und
 * mit dem Posten, der sie aufloest.
 *
 * ── Warum es diese Liste ueberhaupt gibt ──────────────────────────────────
 * Die Web-Woerter sind in EINEM Durchgang gefunden worden, werden aber in
 * dreien beseitigt: Der Fusszeilen-Satz gehoert zu P5, die Kamera-Saetze zu
 * P6, die Tresor-Saetze zu P7. Ohne diese Liste blockierte der erste Befund
 * den Generator, bis alle drei Posten fertig sind — und dann liefe die
 * Pruefung monatelang gar nicht.
 *
 * ── Warum sie trotzdem keine Hintertuer ist ──────────────────────────────
 * Erstens steht in jeder Zeile, WER sie aufloest. Zweitens raeumt sie sich
 * selbst ab: Ein Eintrag, dessen Schluessel gar nicht mehr ausgespielt wird
 * (weil eine `native.`-Variante ihn verdeckt), ist ein FEHLER und keine
 * harmlose Altlast — dieselbe Regel wie bei F-Droids „Unused scandelete
 * path". Wer P6 fertig macht, kann den Eintrag also nicht vergessen.
 * Drittens deckt sie nur die GENANNTEN Woerter je Schluessel: Kommt ein
 * neues dazu, schlaegt die Pruefung trotzdem an.
 */
export const ALLOWED = new Map([
  [
    'vault.error.storageBlocked',
    {
      words: ['browser'],
      reason: 'P7 — erst pruefen, welcher Fehlerfall nativ existiert (voller Speicher?)',
    },
  ],
  [
    'vault.lockOnHide',
    { words: ['tab'], reason: 'P7 — nativ heisst das „beim Verlassen der App"' },
  ],
  [
    'vault.locked.hidden',
    { words: ['tab'], reason: 'P7 — nativ heisst das „beim Verlassen der App"' },
  ],
]);

/**
 * Findet die Web-Woerter in einem Text.
 *
 * Gibt die Namen der Treffer zurueck, nicht nur `true`/`false`: Eine Meldung,
 * die sagt WAS sie gefunden hat, spart das Nachsehen.
 */
export function findWebWords(text) {
  return WEB_WORDS.filter((word) => word.pattern.test(text)).map((word) => word.name);
}

/**
 * Prueft eine ganze Schluessel-Wert-Tabelle und gibt die Beanstandungen
 * zurueck. Ein Wert darf ein String oder ein Mehrzahl-Objekt sein.
 */
export function checkWebWords(entries) {
  const problems = [];
  /** Welche Ausnahmen wirklich gebraucht wurden. */
  const used = new Set();

  for (const [key, value] of Object.entries(entries)) {
    const texts = typeof value === 'string' ? [value] : Object.values(value);
    const exception = ALLOWED.get(key);

    for (const text of texts) {
      for (const found of findWebWords(text)) {
        if (exception?.words.includes(found) === true) {
          used.add(key);
          continue;
        }
        problems.push(`${key}: "${found}" — ${text}`);
      }
    }
  }

  // Eine Ausnahme, die nichts mehr deckt, ist erledigte Arbeit, die niemand
  // ausgetragen hat — und beim naechsten Mal glaubt ihr jemand. Sie zu
  // melden ist der Unterschied zwischen einer Liste, die schrumpft, und
  // einer, die waechst.
  for (const [key, exception] of ALLOWED) {
    if (!used.has(key)) {
      problems.push(
        `${key}: Ausnahme wird nicht mehr gebraucht (${exception.reason}) — bitte austragen`,
      );
    }
  }

  return problems;
}
