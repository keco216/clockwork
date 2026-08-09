/**
 * Prueft ein gebautes Buendel gegen die Zusagen aus README und SECURITY.md.
 *
 * Laeuft in der CI nach jedem Build — einmal fuer den vollen Bau und einmal mit
 * gesetztem CLOCKWORK_LANGS. Das gehoert bewusst nicht in die Unit-Tests: Die
 * pruefen die Textarbeit am Katalog, hier geht es um das, was am Ende wirklich
 * in der Datei steht. Nur dieser Blick faengt einen Fehler im Zusammenspiel mit
 * Rollup, esbuild oder dem Single-File-Bauteil.
 *
 *   node scripts/check-bundle.mjs           # voller Bau: alle 37 Sprachen
 *   node scripts/check-bundle.mjs de,en     # Teil-Bau: nur diese Sprachen
 */

import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'dist', 'clockwork.html');

const subset = process.argv[2] ? process.argv[2].split(',').map((s) => s.trim()) : null;

/** Netzwerk-APIs, die im Buendel nicht vorkommen duerfen. */
const FORBIDDEN = ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'EventSource'];

/**
 * Ein Wort je Sprache, das NUR im Katalog dieser Sprache vorkommt. Damit
 * laesst sich am fertigen Buendel ablesen, welche Kataloge drinstecken.
 *
 * Der deutsche Marker ist „Zusperren" (vault.action.lock) und ausdruecklich
 * NICHT „Tresor": Das Wort steht auch in den deutschen Original-Saetzen von
 * src/i18n/lib-text.ts — die sind die Erkennungsmuster fuer die eingefrorenen
 * lib-Fehlermeldungen und liegen in JEDEM Buendel. Ein Marker, der immer da
 * ist, misst nichts; aufgefallen ist das beim ersten en-only-Lauf (V10),
 * vorher lief die Pruefung nur mit de im Teil-Bau. Dazu kommt: Die deutschen
 * HTML-Kommentare aus index.html wandern mit in die Einzeldatei — auch ein
 * Wort aus ihnen taugt nicht als Katalog-Marker.
 */
const MARKERS = { de: 'Zusperren', en: 'Vault', fr: 'Coffre', ja: '金庫', ru: 'Сейф', nl: 'Kluis' };

/** Obergrenze fuer einen Teil-Bau, in KiB. Der volle Bau wiegt rund 763 KiB.
 *
 * Bis V8 stand hier 400. V9 hat Inter gebuendelt (+122 KiB als data-URI,
 * siehe fonts.css), und ein de,en-Bau wiegt seither 454 KiB — die Schwelle
 * traegt die Schrift mit und liegt weiter gut 250 KiB unter dem vollen Bau.
 * Ihre Aufgabe ist unveraendert: einen Teil-Bau zu fangen, aus dem die
 * abgewaehlten Kataloge NICHT verschwunden sind. Dieselbe Anpassung mit
 * derselben Begruendung steht in locale-subset.test.ts — beide Schwellen
 * gehoeren zusammen nachgezogen, und genau das ist beim ersten V9-Anlauf
 * schiefgegangen: Die Test-Schwelle war angepasst, diese hier nicht, und
 * die CI hat es gefunden. */
const SUBSET_LIMIT_KIB = 500;

const problems = [];

const raw = await readFile(file, 'utf8');
const { size } = await stat(file);

// Nicht-lateinische Zeichen stehen je nach esbuild-Einstellung roh oder als
// \uXXXX in der Datei; fuer den Vergleich wird beides gleichgemacht.
const text = raw.replace(/\\u([0-9a-fA-F]{4})/g, (_whole, hex) =>
  String.fromCharCode(Number.parseInt(hex, 16)),
);

for (const pattern of FORBIDDEN) {
  const count = text.split(pattern).length - 1;
  console.log(`  ${pattern.padEnd(16)} ${count}`);
  if (count > 0) {
    problems.push(`${pattern} steht ${count}-mal im Buendel — die Offline-Zusage waere gebrochen`);
  }
}

if (!text.includes("connect-src 'none'") && !text.includes('connect-src &#39;none&#39;')) {
  problems.push("Die CSP der Einzeldatei fuehrt kein connect-src 'none' mehr");
}

if (subset !== null) {
  for (const [code, marker] of Object.entries(MARKERS)) {
    const expected = subset.includes(code) || code === 'en';
    const found = text.includes(marker);
    if (found !== expected) {
      problems.push(
        `Sprache ${code}: ${found ? 'ist im Buendel' : 'fehlt im Buendel'}, erwartet war das Gegenteil`,
      );
    }
  }
  if (size > SUBSET_LIMIT_KIB * 1024) {
    problems.push(
      `Teil-Bau ist ${Math.round(size / 1024)} KiB gross — die abgewaehlten Kataloge wurden nicht entfernt`,
    );
  }
}

/* Beide Zaehlweisen, beide beschriftet — und die dezimale zuerst, weil die Doku
   in ihr rechnet.

   Bis V8 stand hier `${Math.round(size / 1024)} kB`: geteilt durch 1024, also
   KiB, beschriftet als kB. Genau dieser Zettel ist zweimal abgeschrieben worden
   und einmal in die Release-Notiz gewandert — V8 galt als „642 kB dezimal",
   obwohl 642 die KiB-Zahl war und der dezimale Wert bei 659 lag. Ein Skript,
   das seine eigene Einheit falsch beschriftet, ist eine Fehlerquelle und keine
   Messung. */
const kB = Math.round(size / 1000);
const kiB = Math.round(size / 1024);
console.log(`  ${'Groesse'.padEnd(16)} ${kB} kB (dezimal) = ${kiB} KiB`);

if (problems.length > 0) {
  console.error('\nBefunde:');
  for (const problem of problems) console.error('  x ' + problem);
  process.exit(1);
}

console.log(subset === null ? '\nVoller Bau in Ordnung.' : '\nTeil-Bau in Ordnung.');
