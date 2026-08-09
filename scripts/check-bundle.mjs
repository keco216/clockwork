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
 * Ein Wort je Sprache, das nur in dieser Sprache vorkommt (zone.vault).
 * Damit laesst sich am fertigen Buendel ablesen, welche Kataloge drinstecken.
 */
const MARKERS = { de: 'Tresor', en: 'Vault', fr: 'Coffre', ja: '金庫', ru: 'Сейф', nl: 'Kluis' };

/** Obergrenze fuer einen Teil-Bau, in KiB. Der volle Bau wiegt rund 643 KiB. */
const SUBSET_LIMIT_KIB = 400;

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
