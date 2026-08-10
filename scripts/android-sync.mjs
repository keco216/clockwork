/**
 * Ersetzt `cap sync android` — für dieses Projekt vollständig, aber ohne den
 * Capacitor-CLI.
 *
 * WARUM überhaupt ein Ersatz: Der CLI hat in `bin/capacitor` ein hartes Gate
 * auf Node ≥ 22 (`process.exit(1)`, kein Umweg). Der F-Droid-Buildserver ist
 * Debian trixie, und Debian liefert dort **nur nodejs 20.19.2** — kein
 * Backport, Node 22 gibt es erst in sid. Damit stand die Wahl zwischen einem
 * vorgebauten Node-Tarball von nodejs.org im Bau (genau das, was F-Droid
 * nicht will) und einem Bau, der ohne den CLI auskommt. Dies ist der zweite
 * Weg. Vite selbst läuft auf Node 20 (`^20.19.0 || >=22.12.0`), der Rest der
 * Kette ist gewöhnliches JavaScript.
 *
 * Was `cap sync` für Clockwork tatsächlich tut, ist überschaubar — sechs
 * Dateien, jede davon zur Laufzeit von Capacitor gelesen. Die Fundstellen
 * stehen dabei, damit ein späterer Capacitor-Umbau nachprüfbar bleibt:
 *
 *   assets/public/**                  der Web-Inhalt (WebViewLocalServer)
 *   assets/public/cordova.js          JSExport.java liest die Datei; fehlt
 *   assets/public/cordova_plugins.js  sie, meldet es „Cordova plugins will
 *                                     not work" — beide sind LEER, weil es
 *                                     hier keine Cordova-Plugins gibt
 *   assets/capacitor.config.json      CapConfig.java
 *   assets/capacitor.plugins.json     PluginManager.java
 *   res/xml/config.xml                Bridge.java über Cordovas ConfigXmlParser
 *
 * Alle sechs sind bewusst nicht eingecheckt (Capacitors .gitignore) — sie
 * sind Bauergebnis, nicht Quelltext.
 *
 * Dieses Skript INTERPRETIERT die Konfiguration nicht, es reicht sie durch:
 * `capacitor.config.json` im Wurzelverzeichnis ist die einzige Quelle, und
 * genau deshalb liegt sie seit v1.5.1 als JSON statt als TypeScript vor —
 * Node 20 kann kein TypeScript lesen, und zwei Fassungen derselben Werte
 * wären eine Fehlerquelle mehr. Capacitor kennt JSON als eigene, dritte
 * Config-Form; `npx cap sync` bleibt damit als Gegenprobe benutzbar.
 *
 * Es BAUT NICHT — dieselbe Arbeitsteilung wie bei android-web.mjs und
 * check-bundle.mjs. `npm run android` verkettet Bau, Kopie, Icons und Sync.
 */
import { mkdir, rm, readFile, writeFile, copyFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'android', 'app', 'src', 'main', 'assets');
const resXml = path.join(root, 'android', 'app', 'src', 'main', 'res', 'xml');

/** Liest eine JSON-Datei. Bewusst über readFile statt `import … with`: Die
 *  Import-Attribute haben zwischen Node 20 und 22 ihre Schreibweise gewechselt
 *  (`assert` → `with`), und dieses Skript muss auf beiden laufen. */
async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

/** Kopiert einen Baum. `fs.cp` wäre kürzer, war in Node 20 aber noch
 *  experimentell und meldet sich mit einer Warnung auf stderr — in einem
 *  Bauprotokoll, das Reviewer lesen, ist das Lärm ohne Aussage. */
async function copyTree(from, to) {
  await mkdir(to, { recursive: true });
  let count = 0;
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) count += await copyTree(src, dst);
    else {
      await copyFile(src, dst);
      count += 1;
    }
  }
  return count;
}

// Die drei Werte darin, und warum sie so lauten — JSON kann keine Kommentare
// tragen, also stehen sie hier:
//
//   appId `io.github.keco216.clockwork` folgt dem F-Droid-Muster für
//     GitHub-Projekte: eine real existierende, vom Projektkonto kontrollierte
//     Domäne (github.com/keco216), rückwärts gelesen. Eine erfundene
//     com.-Adresse wäre eine Behauptung.
//   webDir `dist-android` — die Einzeldatei, siehe android-web.mjs.
//   android.minWebViewVersion 111 — die Oberfläche braucht color-mix() in
//     oklab (tokens.css, seit v1.3.0); das kann der System-WebView ab
//     Chromium 111. Ältere WebViews bekämen kaputte Farben ohne
//     Fehlermeldung — Capacitor zeigt unterhalb dieser Grenze stattdessen
//     einen ehrlichen Hinweis auf das WebView-Update.
const config = await readJson(path.join(root, 'capacitor.config.json'));
const webDir = path.join(root, config.webDir);

try {
  await readdir(webDir);
} catch {
  throw new Error(
    `${config.webDir}/ fehlt — erst \`npm run build\` und \`node scripts/android-web.mjs\`, ` +
      'oder gleich `npm run android`, das verkettet die ganze Kette.',
  );
}

// Ein Plugin brächte eigene Java-Klassen, einen Eintrag in
// capacitor.plugins.json und Gradle-Abhängigkeiten mit. Nichts davon kann
// dieses Skript, und stillschweigend eine leere Liste zu schreiben wäre der
// schlimmste Ausgang: Das APK entstünde, und das Plugin fehlte darin
// wortlos. Erkannt wird ein Plugin wie beim CLI (plugin.js/resolvePlugin) —
// am `capacitor`-Feld seiner package.json, Cordova-Plugins an plugin.xml.
const pkg = await readJson(path.join(root, 'package.json'));
const plugins = [];
for (const name of [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
]) {
  let meta;
  try {
    meta = await readJson(path.join(root, 'node_modules', name, 'package.json'));
  } catch {
    continue; // nicht installiert (etwa ein optionales Werkzeug) — kein Plugin
  }
  if (meta.capacitor) plugins.push(name);
  else {
    try {
      await readFile(path.join(root, 'node_modules', name, 'plugin.xml'));
      plugins.push(name);
    } catch {
      /* kein Cordova-Plugin */
    }
  }
}
if (plugins.length > 0) {
  throw new Error(
    `Capacitor-Plugins gefunden (${plugins.join(', ')}), die dieses Skript nicht verdrahten kann. ` +
      'Entweder den Sync wieder über `npx cap sync android` fahren (braucht Node ≥ 22) ' +
      'oder dieses Skript um die Plugin-Verdrahtung erweitern.',
  );
}

// Der Zielordner wird jedes Mal frisch aufgebaut, aus demselben Grund wie in
// android-web.mjs: Eine Datei aus einem früheren Stand nähme das APK sonst
// wortlos mit.
const publicDir = path.join(assets, 'public');
await rm(publicDir, { recursive: true, force: true });
const copied = await copyTree(webDir, publicDir);

// Leer, aber vorhanden: JSExport.java liest beide Dateien beim Start und
// protokolliert einen Fehler, wenn sie fehlen.
await writeFile(path.join(publicDir, 'cordova.js'), '');
await writeFile(path.join(publicDir, 'cordova_plugins.js'), '');

// Tabulatoren und der Zeilenumbruch am Ende sind nicht Geschmack, sondern das
// Format von fs-extras `writeJSON({ spaces: '\t' })` — so schreibt der CLI die
// Datei. Byte-gleich zu bleiben macht den Vergleich „mit und ohne CLI gebaut"
// zu einer Prüfsummenfrage statt zu einer Ansichtssache.
await writeFile(
  path.join(assets, 'capacitor.config.json'),
  JSON.stringify(config, null, '\t') + '\n',
);
await writeFile(path.join(assets, 'capacitor.plugins.json'), '[]\n');

// Cordovas Konfigurationsgerüst. Ohne Plugins und ohne Preferences bleibt der
// Rumpf übrig, den Bridge.java über den ConfigXmlParser einliest. Die beiden
// eingerückten Leerzeilen stammen aus Capacitors Vorlage und stehen hier
// absichtlich mit drin — sie halten die Datei byte-gleich zur CLI-Fassung.
await mkdir(resXml, { recursive: true });
await writeFile(
  path.join(resXml, 'config.xml'),
  `<?xml version='1.0' encoding='utf-8'?>\n` +
    `<widget version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">\n` +
    `  <access origin="*" />\n  \n  \n</widget>`,
);

console.log(
  `✓ android sync — ${copied} Datei(en) aus ${config.webDir}/ nach assets/public/, ` +
    'Konfiguration und Cordova-Gerüst geschrieben (ohne Capacitor-CLI)',
);
