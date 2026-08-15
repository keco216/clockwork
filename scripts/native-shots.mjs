/**
 * P9: Die NATIVEN Gegenstuecke zu den Mobil-Bildern der Web-Fassung.
 *
 *   node scripts/native-shots.mjs <zielordner> [--device emulator-5554] [--dp 375]
 *
 * Es entstehen sechs Aufnahmen — hell/dunkel je Leerzustand, 1 Konto und 12
 * Konten — unter genau den Dateinamen, die `scripts/shoot-mobile.mjs` fuer die
 * Web-Fassung vergibt (`0375-hell-leer.png` …). Wer die zwei Ordner
 * nebeneinanderlegt, hat Paare und keine Suchaufgabe.
 *
 * ── Warum dieselbe LOGISCHE Breite und nicht dieselbe Pixelbreite ─────────
 * Die Web-Bilder entstehen in einem 375-px-Viewport, das AVD ist 1080 px breit
 * bei Dichte 420 — also 411 dp. Ein Vergleich zweier verschiedener Breiten
 * misst die Breite und nicht die Fassung. Der Lauf stellt deshalb die Dichte
 * auf **461** (1080 / 461 * 160 = 374,8 dp) und danach wieder zurueck. Beide
 * Seiten zeigen dann dieselbe Menge Oberflaeche; die Bilder sind verschieden
 * gross (750 px hier, 1080 px dort), weil beide in ihrer eigenen vollen
 * Aufloesung entstehen — skaliert wird beim Ansehen, nicht beim Messen.
 *
 * 375 dp liegt unter der Hausschwelle von 420 — beide Fassungen stehen damit
 * im KOMPAKTRASTER, und genau das soll der Vergleich zeigen.
 *
 * ── Warum der Inhalt aus shoot-mobile.mjs kopiert ist ────────────────────
 * Weil es derselbe sein MUSS und die beiden Skripte sonst nichts teilen. Ein
 * gemeinsames Modul fuer zwei Zeichenketten waere mehr Kopplung als Nutzen
 * (dieselbe Abwaegung wie bei der Hoehenleiter in shoot-mobile.mjs) — dafuer
 * prueft der Lauf am Ende, dass beide Listen wortgleich sind, und bricht sonst
 * ab. Eine Kopie, die sich selbst bewacht, ist ehrlicher als ein Import, den
 * niemand mehr liest.
 *
 * ── Die Falle, die diesen Lauf gekostet hat (gemessen, 15.08.2026) ───────
 * `adb shell input text` bringt in dieses Feld GENAU EIN Zeichen. Nicht weil
 * `input` etwas verschluckt, sondern weil die App beim ersten Zeichen die
 * Buehne von „leer" auf „Arbeit" umbaut: Das Feld wird neu aufgebaut, verliert
 * den Fokus, und alles Weitere laeuft ins Leere. Nachgemessen mit reinem ASCII
 * („ABCDEFGH" → Feldinhalt „A"), also keine Escaping-Frage.
 *
 * Das Rezept dagegen steht in [tippeInsFeld]: erst EIN Zeichen, dann die
 * Eingabe-Zone wieder aufklappen, das Feld ueber seine BREITE wiederfinden
 * (das erste Zeichen steht auch in der Fehlerkarte darueber — wer nur nach dem
 * Text sucht, tippt daneben), Cursor ans Ende, Rest in einem Zug. So kommt
 * auch eine otpauth-URI mit `%20`, `&` und `?` byte-identisch an; der Lauf
 * prueft das am FELDINHALT und nicht an der Absicht.
 */

import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG = 'io.github.keco216.clockwork.dev';
const APK = path.join(
  root,
  'android-native',
  'app',
  'build',
  'outputs',
  'apk',
  'debug',
  'app-debug.apk',
);

/** Derselbe feste Zeitpunkt wie in store-shots.mjs — 1786700415 mod 30 = 15. */
const PINNED_EPOCH = 1786700415;

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};

const target = args[0];
if (target === undefined || target.startsWith('--')) {
  throw new Error(
    'Erstes Argument muss der Zielordner sein, z. B. android-native/docs/abnahme/p9-vergleich/nativ\n' +
      '  node scripts/native-shots.mjs <zielordner> [--device …] [--dp 375]',
  );
}
const outDir = path.resolve(target);
const zielDp = Number(flag('dp', '375'));

const befunde = [];

/* ── Der Inhalt: wortgleich mit scripts/shoot-mobile.mjs ─────────────────── */

const DEMO_1 = 'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

const DEMO_12 = [
  'otpauth://totp/ACME%20Co:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co',
  'otpauth://totp/Google:kevin@example.com?secret=GEZDGNBVGY3TQOJQ&issuer=Google&algorithm=SHA256&digits=8&period=60',
  'GitHub: jbsw y3dp ehpk 3pxp',
  'otpauth://totp/Fastmail:kevin@example.com?secret=MFRGGZDFMZTWQ2LK&issuer=Fastmail',
  'otpauth://totp/Hetzner%20Cloud:kevin@example.com?secret=NBSWY3DPEB3W64TMMQ&issuer=Hetzner%20Cloud',
  'Bitwarden: MZXW6YTBOI======',
  'otpauth://totp/Deutsche%20Bahn:kevin@example.com?secret=ONSWG4TFOQ&issuer=Deutsche%20Bahn',
  'RFC-Test: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
  'otpauth://totp/Tailscale:kevin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Tailscale',
  'otpauth://totp/Mullvad:kevin@example.com?secret=GEZDGNBVGY3TQOJQ&issuer=Mullvad',
  'otpauth://totp/Porkbun:kevin@example.com?secret=MFRGGZDFMZTWQ2LK&issuer=Porkbun',
  'JBSW0Y3DPEHPK3PXP',
].join('\n');

/**
 * Die Gegenprobe auf die Kopie.
 *
 * Sie liest shoot-mobile.mjs als TEXT und vergleicht die zwei Listen. Ein
 * Import waere kuerzer, aber die beiden Skripte laufen bewusst unabhaengig —
 * und eine Kopie ohne Waechter waere genau die Drift, die N23 fuer die
 * Store-Texte beschreibt.
 */
async function pruefeInhaltsgleichheit() {
  const quelle = await readFile(path.join(root, 'scripts', 'shoot-mobile.mjs'), 'utf8');
  const eins = /const DEMO_1 = '([^']*)'/.exec(quelle)?.[1];
  const zwoelf = /const DEMO_12 = \[([\s\S]*?)\]\.join\('\\n'\)/.exec(quelle)?.[1];
  if (eins === undefined || zwoelf === undefined) {
    throw new Error('shoot-mobile.mjs: DEMO_1/DEMO_12 nicht gefunden — Vergleich unmoeglich');
  }
  const liste = [...zwoelf.matchAll(/'([^']*)'/g)].map((m) => m[1]).join('\n');
  if (eins !== DEMO_1)
    befunde.push(`DEMO_1 weicht von shoot-mobile.mjs ab:\n  hier: ${DEMO_1}\n  dort: ${eins}`);
  if (liste !== DEMO_12) befunde.push('DEMO_12 weicht von shoot-mobile.mjs ab');
  return eins === DEMO_1 && liste === DEMO_12;
}

/* ── Geraet ──────────────────────────────────────────────────────────────── */

const sdk = path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const ADB = path.join(sdk, 'platform-tools', 'adb.exe');

function adb(...rest) {
  return execFileSync(ADB, ['-s', device, ...rest], {
    encoding: 'utf8',
    maxBuffer: 64 << 20,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}
const shell = (command) => adb('shell', command);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const device =
  flag('device', null) ??
  execFileSync(ADB, ['devices'], { encoding: 'utf8' })
    .split('\n')
    .map((line) => line.split('\t'))
    .find(([name, state]) => name.startsWith('emulator-') && state?.trim() === 'device')?.[0];

if (!device) {
  console.error(
    '  Kein Emulator gefunden. Starten mit:\n' +
      '    emulator -avd clockwork-test -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect\n' +
      '  Ein physisches Geraet ist hier ABSICHTLICH nicht die Voreinstellung: Der Lauf\n' +
      '  loescht App-Daten und dreht an der Bildschirmdichte.',
  );
  process.exit(1);
}

const entities = (value) =>
  (value ?? '')
    .replace(/&#10;/g, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

function dump() {
  shell('uiautomator dump /data/local/tmp/ui.xml');
  const xml = shell('cat /data/local/tmp/ui.xml');
  const nodes = [];
  for (const match of xml.matchAll(/<node[^>]*>/g)) {
    const bounds = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(match[0]);
    if (!bounds) continue;
    const [, x1, y1, x2, y2] = bounds.map(Number);
    nodes.push({
      text: entities(/text="([^"]*)"/.exec(match[0])?.[1]),
      desc: entities(/content-desc="([^"]*)"/.exec(match[0])?.[1]),
      breite: x2 - x1,
      x1,
      y1,
      cx: Math.round((x1 + x2) / 2),
      cy: Math.round((y1 + y2) / 2),
    });
  }
  return nodes;
}

async function warteAuf(pruefer, was, versuche = 14) {
  for (let i = 0; i < versuche; i++) {
    const nodes = dump();
    const treffer = nodes.find(pruefer);
    if (treffer) return treffer;
    await sleep(700);
  }
  const sichtbar = dump()
    .map((n) => n.text || n.desc)
    .filter(Boolean)
    .slice(0, 12);
  throw new Error(`${was}: kam nicht. Auf dem Schirm stand:\n    ${sichtbar.join('\n    ')}`);
}

/* ── Die Oberflaeche ─────────────────────────────────────────────────────── */

/** Leerzeichen sind fuer `input text` `%s`; der Rest wird einfach gequotet. */
function tippe(zeile) {
  if (zeile.includes("'")) {
    throw new Error(`Zeile enthaelt ein Hochkomma und braucht eigenes Escaping: ${zeile}`);
  }
  shell(`input text '${zeile.replace(/ /g, '%s')}'`);
}

/**
 * Die Zusammenfassungszeile der Eingabe-Zone — notfalls herunterscrollen.
 *
 * ── Warum sie nicht ueber „Punkt und Ziffer" zu finden ist ───────────────
 * Der erste Anlauf suchte den ersten Knoten mit einem Mittelpunkt und einer
 * Zahl darin. Getroffen hat er den ALGORITHMUS-CHIP der obersten Karte
 * („SHA-1 · 6 Stellen · 30 s") und daraus „1 Konto / 6 Fehler" gelesen — eine
 * Zahl, die zu nichts passte, aber wie eine Messung aussah. Gesucht wird
 * deshalb ueber den Ressourcentext `zone_input`.
 *
 * Und sie steht nicht immer im Bild: Bei elf Konten liegt sie unter dem
 * Kanalzug und damit unter der Bildkante. `uiautomator dump` sieht nur, was
 * auf dem Schirm ist (P7-Falle) — also erst scrollen, dann behaupten, sie
 * fehle.
 *
 * Gesucht wird ab dem SEITENANFANG abwaerts, und das ist der Kern:
 * Die Zeile ist die KOPFzeile der Eingabe-Zone, steht also ueber dem Feld.
 * Nach dem Tippen steht die Seite am Feld — wer von dort nach unten sucht,
 * laeuft von der Zeile WEG. Der erste Anlauf tat genau das und fand sie im
 * 12-Konten-Fall nach acht Wischern nicht („-1 Konten / 0 Fehler"). Vom
 * Seitenanfang aus ist die Reihenfolge dagegen fest: Kopf, Kanalzug,
 * Eingabe-Zone.
 *
 * Zurueckgescrollt wird NICHT: Der Aufrufer will die Zeile meist antippen,
 * und eine Zeile, die der Sucher gerade wieder aus dem Bild geschoben hat,
 * ist nicht antippbar.
 */
async function findeZusammenfassung() {
  const treffer = () => dump().find((n) => n.text.startsWith(`${text('zone_input')} ·`));
  const schonDa = treffer();
  if (schonDa) return schonDa;

  await nachOben();
  for (let schritt = 0; schritt < 14; schritt++) {
    const gefunden = treffer();
    if (gefunden) return gefunden;
    /* Wenn ein Wisch nichts mehr bewegt, ist die Seite am Anschlag — dann ist
       die Zeile nicht erreichbar und Weitersuchen waere Zeitverschwendung.
       Gemessen wird an einer SIGNATUR aller Knotenpositionen.

       Der erste Anlauf verglich `dump()[0].y1`. Das ist der Wurzelknoten des
       Fensters, und der steht immer auf 0 — die Schleife brach deshalb nach
       drei Wischern ab und meldete die Zeile als „nicht gefunden", obwohl sie
       nur noch nicht im Bild war. Eine Abbruchbedingung, die immer wahr ist,
       sieht aus wie eine Messung und ist keine. */
    const signatur = () =>
      dump()
        .filter((n) => n.text)
        .map((n) => n.y1)
        .join(',');
    const vorher = signatur();
    /* Der Wisch beginnt bei y=1400 und nicht weiter unten, und das ist
       gemessen noetig: Solange die Eingabe offen ist, steht die Tastatur und
       nimmt die untere Haelfte des Schirms ein. Eine Geste gehoert dem, was
       unter ihrem STARTpunkt liegt — ein Wisch ab y=1800 landete auf der
       Tastatur, und die Seite bewegte sich kein Pixel. Der Lauf meldete die
       Zeile daraufhin als „nicht gefunden", obwohl er nie gescrollt hat.
       (`nachOben` war davon nie betroffen: Es startet bei y=700, also auf der
       Seite, und darf ruhig auf der Tastatur enden.) */
    shell('input swipe 540 1400 540 400 600');
    await sleep(800);
    if (schritt > 2 && signatur() === vorher) break;
  }
  return undefined;
}

/** Ganz nach oben — und die Probe aufs Exempel statt blindem Wischen. */
async function nachOben() {
  for (let i = 0; i < 5; i++) {
    shell('input swipe 540 700 540 2100 700');
    await sleep(600);
  }
  await warteAuf((n) => n.text === text('brand_tagline'), 'Seitenanfang');
}

/**
 * Text ins grosse Eingabefeld — mit dem Umweg um den Buehnenwechsel.
 *
 * Siehe Dateikopf: Das erste Zeichen kippt die Buehne und kostet den Fokus.
 * Deshalb erst eins, dann neu greifen, dann der Rest.
 */
async function tippeInsFeld(inhalt, erwartet) {
  const zeilen = inhalt.split('\n');

  // 1) Das Feld im LEERZUSTAND: es traegt seinen Platzhalter als `text`.
  const feld = await warteAuf((n) => n.text.includes('JBSWY3DPEHPK3PXP'), 'Eingabefeld (leer)');
  shell(`input tap ${feld.cx} ${feld.cy}`);
  await sleep(900);
  tippe(inhalt[0]);
  await sleep(1600);

  /* 2) Die Eingabe-Zone ist jetzt eine zugeklappte Zusammenfassung. Sie traegt
        einen Mittelpunkt und eine Zahl („Eingabe · 0 Konten · 1 Fehler") — das
        ist sprachunabhaengig genug, um ohne Ressourcenschluessel auszukommen. */
  const summary = await warteAuf(
    (n) => n.text.startsWith(`${text('zone_input')} ·`),
    'Zusammenfassungszeile der Eingabe',
  );
  shell(`input tap ${summary.cx} ${summary.cy}`);
  await sleep(1300);

  /* 3) Feld ueber die BREITE wiederfinden: Das erste Zeichen steht auch in der
        Fehlerkarte darueber (gemessen: [126,819] statt [158,1180]). */
  const feld2 = await warteAuf(
    (n) => n.text === inhalt[0] && n.breite > 600,
    'Eingabefeld (Arbeitszustand)',
  );
  shell(`input tap ${feld2.cx} ${feld2.cy}`);
  await sleep(900);
  shell('input keyevent 123'); // Cursor ans Ende

  /* 4) Rest der ersten Zeile, dann Zeile fuer Zeile mit Zeilenumbruch davor.
        In STUECKEN zu 32 Zeichen, und das ist gemessen noetig: Ein Lauf mit
        ganzen Zeilen (bis 114 Zeichen) lieferte „10 Konten / 2 Fehler" statt
        „11 / 1" — eine der langen otpauth-Zeilen kam verstuemmelt an. `input
        text` schiebt die Zeichen als Tastenereignisse hinein, und je laenger
        die Kette, desto eher verliert die Oberflaeche eines. Kurze Stuecke mit
        einer Atempause dazwischen kosten ein paar Sekunden und sind der
        Unterschied zwischen einem Beweis und einem Bild. */
  const inStuecken = async (rest) => {
    for (let i = 0; i < rest.length; i += 32) {
      tippe(rest.slice(i, i + 32));
      await sleep(320);
    }
  };

  if (zeilen[0].length > 1) {
    await inStuecken(zeilen[0].slice(1));
    await sleep(500);
  }
  for (const zeile of zeilen.slice(1)) {
    shell('input keyevent 66'); // ENTER — im mehrzeiligen Feld ein Umbruch
    await sleep(350);
    if (zeile.length > 0) await inStuecken(zeile);
    await sleep(500);
  }
  await sleep(1200);

  /* 5) Geprueft wird das ERGEBNIS, nicht die Absicht (CLAUDE.md).

        Der erste Anlauf las den Feldinhalt zurueck und verglich ihn Zeichen
        fuer Zeichen. Das trug bei einer Zeile und scheiterte bei zwoelf:
        `uiautomator` liefert den Text eines gescrollten Mehrzeilenfeldes nicht
        vollstaendig, und die Pruefung meldete „liess sich nicht auslesen" —
        also gar nichts.

        Die Zusammenfassungszeile der App ist der bessere Zeuge: Sie sagt, was
        die App aus dem Text GEMACHT hat. Kommt eine otpauth-URI verstuemmelt
        an, stimmt die Kontozahl nicht — und das ist genau der Fehler, den
        diese Pruefung finden soll. */
  const zusammenfassung = await findeZusammenfassung();
  const zahlen = [...(zusammenfassung?.text ?? '').matchAll(/(\d+)/g)].map((m) => Number(m[1]));
  const konten = zahlen[0] ?? -1;
  const fehler = zahlen[1] ?? 0;
  const stimmt = konten === erwartet.konten && fehler === erwartet.fehler;
  if (!stimmt) {
    console.log(
      `     Eingabe FALSCH: ${konten} Konten / ${fehler} Fehler, ` +
        `erwartet ${erwartet.konten} / ${erwartet.fehler} — „${zusammenfassung?.text ?? '(nicht gefunden)'}"`,
    );
  } else {
    console.log(`     Eingabe geprueft: ${konten} Konten, ${fehler} Fehler — wie erwartet`);
  }

  /* 6) Zuklappen — die Web-Bilder entstehen mit zugeklappter Eingabe (dort
        ueber `blur()`, siehe shoot-mobile.mjs). Der Tipp auf die
        Zusammenfassung nimmt zugleich den Fokus aus dem Feld und die Tastatur
        vom Schirm; `KEYCODE_BACK` waere hier falsch (P7-Falle: bei
        geschlossener Tastatur verlaesst es die App). */
  const summary2 = await findeZusammenfassung();
  if (!summary2) {
    befunde.push('Zusammenfassungszeile zum Zuklappen nicht gefunden — Eingabe bleibt offen');
    return stimmt;
  }
  shell(`input tap ${summary2.cx} ${summary2.cy}`);
  await sleep(1200);
  return stimmt;
}

/**
 * Die Texte der App aus ihren RESSOURCEN, nicht abgetippt.
 *
 * Dieselbe Begruendung wie in store-shots.mjs: Ein hart notierter Satz waere
 * beim naechsten Textfeinschliff still falsch, und der Lauf suchte dann etwas,
 * das es nicht mehr gibt.
 */
async function ladeStrings(resDir) {
  const datei = path.join(
    root,
    'android-native',
    'app',
    'src',
    'main',
    'res',
    resDir,
    'strings.xml',
  );
  const xml = await readFile(datei, 'utf8');
  const map = new Map();
  for (const match of xml.matchAll(/<string name="([^"]+)">([\s\S]*?)<\/string>/g)) {
    map.set(
      match[1],
      entities(match[2]).replace(/\\'/g, "'").replace(/\\n/g, '\n').replace(/\\"/g, '"'),
    );
  }
  return (key) => {
    const value = map.get(key);
    if (value === undefined) throw new Error(`Ressource ${key} fehlt in ${resDir}`);
    return value;
  };
}

/* ── Statusleiste, Thema, Zeit ───────────────────────────────────────────── */

function demoModus() {
  const demo = (rest) => shell(`am broadcast -a com.android.systemui.demo ${rest}`);
  demo('-e command enter');
  demo('-e command clock -e hhmm 1000');
  demo('-e command battery -e level 100 -e plugged false');
  demo(
    '-e command network -e wifi hide -e mobile hide -e sims 1 -e nosim hide -e airplane hide -e carriernetworkchange hide',
  );
  demo('-e command notifications -e visible false');
  demo(
    '-e command status -e volume hide -e bluetooth hide -e location hide -e alarm hide -e sync hide -e tty hide -e eri hide -e mute hide -e speakerphone hide',
  );
}

/** `cmd uimode night` baut die Statusleiste neu auf — Demo-Modus danach neu. */
const dunkel = async (an) => {
  shell(`cmd uimode night ${an ? 'yes' : 'no'}`);
  await sleep(1400);
  demoModus();
  await sleep(700);
};

const zeitFestnageln = () => shell(`date @${PINNED_EPOCH}`);

/**
 * Der Anteil reiner #000000-Pixel — gemessen am ROHEN Abzug, nicht am PNG.
 *
 * Der Grund steht in [schuss]: Eine schwarze Aufnahme sieht im Ordner aus wie
 * eine Aufnahme. Gezaehlt wird auf `screencap` OHNE `-p` (Kopf 16 Byte, dann
 * RGBA), weil das ohne PNG-Dekoder auskommt — dieselbe Linie wie beim
 * eigenen PNG-Leser im nativen Testbaum.
 */
async function schwarzanteil() {
  shell('screencap /data/local/tmp/roh.dat');
  const tmp = path.join(root, 'node_modules', '.cache', 'p9-roh.dat');
  await mkdir(path.dirname(tmp), { recursive: true });
  adb('pull', '/data/local/tmp/roh.dat', tmp);
  const roh = await readFile(tmp);
  const breite = roh.readUInt32LE(0);
  const hoehe = roh.readUInt32LE(4);
  let schwarz = 0;
  for (let i = 0; i < breite * hoehe; i++) {
    const o = 16 + i * 4;
    if (roh[o] === 0 && roh[o + 1] === 0 && roh[o + 2] === 0) schwarz++;
  }
  await rm(tmp, { force: true });
  return (schwarz / (breite * hoehe)) * 100;
}

/**
 * Eine Aufnahme — und die Probe, dass ueberhaupt etwas darauf steht.
 *
 * ── Warum diese Probe sein muss (gemessen, 15.08.2026) ────────────────────
 * Der erste Lauf hat zwei komplett SCHWARZE Bilder in den Beweisordner
 * gelegt, und sie sahen dort aus wie Beweise: richtiger Name, plausible
 * Groesse, kein Fehler im Protokoll. Aufgefallen ist es erst daran, dass
 * zwei Dateien auf dasselbe Byte gleich gross waren (15.580).
 *
 * Die Ursache war eine haengende `starting_reveal`-Leash des Splash-Fensters:
 * Startet die App EINMAL mit FLAG_SECURE (das ist die Voreinstellung nach
 * `pm clear`) und wird danach umgestellt, liefert `screencap` weiter Schwarz —
 * und zwar den GANZEN Schirm, nicht nur das App-Fenster. Das Fenster meldet
 * dabei kein SECURE mehr (`fl=` ohne den Eintrag), `uiautomator dump` zeigt
 * den vollstaendigen Baum, `dumpsys display` sagt `mState=ON`. Jede einzelne
 * Auskunft sagt „alles gut"; nur das Bild ist schwarz.
 *
 * Der Lauf umgeht die Ursache (die Einstellungen stehen VOR dem ersten Start,
 * siehe [vorbereiten]) — aber die Probe bleibt trotzdem. Eine Messung, die
 * ihren eigenen Fehlschlag nicht sehen kann, ist keine.
 */
async function schuss(name) {
  zeitFestnageln();
  await sleep(1300);
  const schwarz = await schwarzanteil();
  if (schwarz > 99) {
    befunde.push(
      `${name}: ${schwarz.toFixed(2)} % der Pixel sind #000000 — die Aufnahme ist leer. ` +
        'Vermutlich haengt die starting_reveal-Leash (siehe Kommentar an schuss()).',
    );
  }
  shell('screencap -p /data/local/tmp/shot.png');
  await mkdir(outDir, { recursive: true });
  const ziel = path.join(outDir, `${name}.png`);
  adb('pull', '/data/local/tmp/shot.png', ziel);
  const png = await readFile(ziel);
  return {
    datei: path.relative(root, ziel).replace(/\\/g, '/'),
    breite: png.readUInt32BE(16),
    hoehe: png.readUInt32BE(20),
    kb: png.length / 1024,
    schwarz,
    sha: createHash('sha256').update(png).digest('hex'),
  };
}

/**
 * Die Tastatur vom Schirm nehmen — und das am ERGEBNIS pruefen.
 *
 * ── Warum nicht `mInputShown` (gemessen, 15.08.2026) ─────────────────────
 * Weil es die falsche Frage beantwortet. Eine Tastatur, die aus einer
 * FRUEHEREN Sitzung stehengeblieben ist, gilt dem System nicht als „gezeigt":
 * Gemessen wurde `mInputShown=false` und `mImeWindowVis=0`, waehrend auf dem
 * Bild die halbe untere Haelfte Tastatur war. `pm clear` und ein Neustart der
 * App raeumen sie nicht weg — sie gehoert der IME, nicht der App.
 *
 * Geprueft wird deshalb, was das BILD zeigen soll: Steht die untere
 * Navigationsleiste der App im unteren Sechstel des Schirms? Liegt die
 * Tastatur davor, ist die Leiste weggeschoben oder gar nicht im Baum — und
 * genau dann ist das Bild unbrauchbar.
 *
 * `KEYCODE_BACK` schliesst eine offene Tastatur; bei geschlossener verlaesst
 * es die App (P7-Falle). Deshalb wird nach jedem Druck neu gemessen und nicht
 * blind zweimal gedrueckt.
 */
async function tastaturZu(text, hoehe) {
  const leisteSteht = () => {
    const leiste = dump().find((n) => n.text === text('nav_home'));
    return leiste !== undefined && leiste.y1 > hoehe * 0.82;
  };
  for (let i = 0; i < 6; i++) {
    if (leisteSteht()) return;
    shell('input keyevent 4');
    await sleep(1000);
  }
  befunde.push(
    'Die untere Navigationsleiste kam nicht ins untere Sechstel — ' +
      'vermutlich steht noch die Tastatur davor.',
  );
}

/**
 * Schreibt `files/lock-settings.json` — ueber push + run-as, nie ueber echo
 * (die Geraete-Shell zerlegt JSON, Falle aus N11).
 *
 * ── Warum das VOR dem ersten Start passieren muss ────────────────────────
 * `blockScreenshots` steht nach `pm clear` auf der Voreinstellung, und die
 * ist AN. Wer die App erst startet und dann umstellt, hat eine Sitzung lang
 * ein FLAG_SECURE-Fenster gehabt — und danach liefert `screencap` weiter
 * Schwarz, auch wenn das Fenster die Flagge laengst nicht mehr traegt
 * (gemessen, siehe Kommentar an schuss()). `files/` gibt es nach `pm clear`
 * noch nicht; `run-as mkdir -p` legt es mit den richtigen Rechten an.
 */
async function schreibeEinstellungen(werte) {
  const inhalt = JSON.stringify({
    timeoutMs: 300000,
    lockOnHide: true,
    biometric: false,
    blockScreenshots: false,
    ...werte,
  });
  const tmp = path.join(root, 'node_modules', '.cache', 'p9-lock-settings.json');
  await mkdir(path.dirname(tmp), { recursive: true });
  await writeFile(tmp, inhalt);
  shell(`run-as ${PKG} mkdir -p files`);
  adb('push', tmp, '/data/local/tmp/p9-lock-settings.json');
  shell(`run-as ${PKG} cp /data/local/tmp/p9-lock-settings.json files/lock-settings.json`);
  const zurueck = shell(`run-as ${PKG} cat files/lock-settings.json`).trim();
  if (zurueck !== inhalt) befunde.push(`lock-settings.json kam anders zurueck: ${zurueck}`);
  await rm(tmp, { force: true });
}

const starte = async (ms = 4000) => {
  shell(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`);
  await sleep(ms);
};

/* ── Lauf ────────────────────────────────────────────────────────────────── */

console.log(`\n  P9-Vergleichsbilder (nativ) — Geraet ${device}\n`);

const gleich = await pruefeInhaltsgleichheit();
console.log(`  Inhalt wortgleich mit shoot-mobile.mjs: ${gleich ? 'ja' : 'NEIN'}`);

/* Die Dichte, die 1080 px auf die Zielbreite bringt. Gerundet, und die
   erreichte Breite wird ausgegeben — eine Zahl, die man nachrechnen kann. */
const groesse = /Physical size: (\d+)x(\d+)/.exec(shell('wm size'));
const breitePx = Number(groesse?.[1] ?? 1080);
const hoehePx = Number(groesse?.[2] ?? 2400);
const dichte = Math.round((breitePx * 160) / zielDp);
const erreichteDp = ((breitePx * 160) / dichte).toFixed(1);
console.log(`  Dichte ${dichte} → ${erreichteDp} dp bei ${breitePx} px (Ziel ${zielDp} dp)\n`);

/* Die Bilder entstehen auf Deutsch — die Web-Fassung wird in shoot-mobile.mjs
   mit `lang=de` aufgenommen, und ein Vergleich zweier Sprachen waere keiner. */
const text = await ladeStrings('values-b+de');

execFileSync(ADB, ['-s', device, 'install', '-r', APK], { encoding: 'utf8' });
execFileSync(ADB, ['-s', device, 'root'], { encoding: 'utf8' });
await sleep(2500);
execFileSync(ADB, ['-s', device, 'wait-for-device'], { encoding: 'utf8' });

for (const skala of [
  'window_animation_scale',
  'transition_animation_scale',
  'animator_duration_scale',
]) {
  shell(`settings put global ${skala} 0`);
}
shell('settings put global auto_time 0');
shell('settings put global sysui_demo_allowed 1');
shell(`wm density ${dichte}`);
await sleep(2500);
demoModus();
await sleep(800);

/* ── Die Bildschirmtastatur wird fuer den Lauf ABGESCHALTET ───────────────
   Nicht aus Bequemlichkeit, sondern weil sie sich sonst nicht zuverlaessig
   wegbekommen laesst: Das Textfeld behaelt nach dem Tippen den Fokus, und
   jeder Themenwechsel baut die Activity neu auf — die Tastatur kam danach
   binnen zwei Sekunden von selbst zurueck, also genau zwischen „zugemacht"
   und „ausgeloest". Gemessen an drei Laeufen.

   `input text` braucht sie nicht: Es spritzt Tastenereignisse ein und geht
   nicht durch die IME. Nachgemessen mit abgeschalteter Tastatur — die
   otpauth-Zeile kam an, die Karte „ACME Co" stand da, und die
   Navigationsleiste stand wieder bei y=2246 statt hinter der Tastatur.

   Sie wird am Ende wieder eingeschaltet; ein abgeschaltetes Eingabefeld ist
   kein Zustand, in dem ein Geraet stehenbleiben darf. */
const imes = shell('ime list -s')
  .split('\n')
  .map((zeile) => zeile.trim())
  .filter((zeile) => zeile.includes('/') && !zeile.includes('voiceime'));
for (const ime of imes) shell(`ime disable ${ime}`);
console.log(`  Bildschirmtastatur abgeschaltet: ${imes.join(', ') || '(keine gefunden)'}\n`);

/**
 * Die drei Fuellungen samt dem, was die App daraus machen MUSS.
 *
 * `12konten` traegt zwoelf Zeilen und ergibt ELF Konten und EINEN Fehler:
 * Die letzte Zeile `JBSW0Y3DPEHPK3PXP` enthaelt eine Null, und die gibt es im
 * Base32-Alphabet nicht. Der Fehlerfall gehoert zum Beweis — seine Karte
 * laeuft im selben Raster (so steht es auch in shoot-mobile.mjs).
 */
const FUELLUNGEN = [
  { name: 'leer', inhalt: null, erwartet: null },
  { name: '1konto', inhalt: DEMO_1, erwartet: { konten: 1, fehler: 0 } },
  { name: '12konten', inhalt: DEMO_12, erwartet: { konten: 11, fehler: 1 } },
];

const bilder = [];
for (const fuellung of FUELLUNGEN) {
  /* Jede Fuellung faengt im Nullzustand an — nicht aufeinander aufbauend.
     Anhaengen waere schneller, aber ein Zustand, der aus dem vorigen entsteht,
     traegt dessen Fehler mit.

     Reihenfolge: leeren, EINSTELLEN, dann erst starten. Siehe
     schreibeEinstellungen() — ein einziger Start mit FLAG_SECURE macht alle
     folgenden Aufnahmen schwarz. */
  /* Bis zu drei Anlaeufe je Fuellung.
     `input text` ist nicht zuverlaessig: In einem Lauf kam eine der langen
     otpauth-Zeilen verstuemmelt an, und die App zeigte „10 Konten / 2 Fehler"
     statt „11 / 1". Das Bild waere trotzdem entstanden und haette im
     Beweisordner gelegen — mit einem Konto weniger als das Web-Gegenstueck.
     Ein neuer Anlauf kostet eine Minute; ein falsches Vergleichsbild kostet
     die Abnahme. */
  let versuch = 0;
  let stimmt = true;
  do {
    versuch++;
    shell(`am force-stop ${PKG}`);
    shell(`pm clear ${PKG}`);
    await schreibeEinstellungen({});
    shell(`cmd locale set-app-locales ${PKG} --locales de-DE`);
    await dunkel(false);
    zeitFestnageln();
    await starte();

    if (fuellung.inhalt === null) break;

    stimmt = await tippeInsFeld(fuellung.inhalt, fuellung.erwartet);
    if (!stimmt && versuch < 3) console.log(`     → neuer Anlauf (${versuch + 1}/3)`);
  } while (!stimmt && versuch < 3);

  if (!stimmt) {
    befunde.push(
      `${fuellung.name}: Die Eingabe kam auch nach drei Anlaeufen nicht vollstaendig an. ` +
        'Die Bilder dieser Fuellung zeigen weniger Konten als die Web-Fassung.',
    );
  }

  if (fuellung.inhalt !== null) {
    /* Ganz nach oben: Das Bild soll den Seitenanfang zeigen, und nach dem
       Tippen, Pruefen und Zuklappen steht die Seite irgendwo. */
    await nachOben();
  }
  await tastaturZu(text, hoehePx);

  for (const thema of [
    { name: 'hell', an: false },
    { name: 'dunkel', an: true },
  ]) {
    await dunkel(thema.an);
    // Der Themenwechsel baut die Activity neu auf; die Tastatur kann dabei
    // zurueckkommen (sie haengt am Feld, nicht am Fenster).
    await tastaturZu(text, hoehePx);
    await sleep(900);
    const name = `${String(zielDp).padStart(4, '0')}-${thema.name}-${fuellung.name}`;
    const bild = await schuss(name);
    console.log(
      `     ${bild.datei.padEnd(52)} ${bild.breite}x${bild.hoehe}  ` +
        `${bild.kb.toFixed(0).padStart(4)} kB  schwarz ${bild.schwarz.toFixed(1).padStart(5)} %  ${bild.sha.slice(0, 12)}`,
    );
    bilder.push(bild);
  }
}

/* ── Aufraeumen ──────────────────────────────────────────────────────────── */

shell('am broadcast -a com.android.systemui.demo -e command exit');
shell('wm density reset');
for (const ime of imes) shell(`ime enable ${ime}`);
for (const skala of [
  'window_animation_scale',
  'transition_animation_scale',
  'animator_duration_scale',
]) {
  shell(`settings put global ${skala} 1`);
}
shell('settings put global auto_time 1');
// FLAG_SECURE gehoert wieder AN — der Ausnahmezustand dieses Laufs darf nicht
// der Zustand bleiben, in dem das Geraet stehenbleibt.
await schreibeEinstellungen({ blockScreenshots: true });
shell(`am force-stop ${PKG}`);

console.log(
  `\n  ${bilder.length} Aufnahmen in ${path.relative(root, outDir).replace(/\\/g, '/')}/.`,
);
if (befunde.length > 0) {
  console.error(`\n  ${befunde.length} Befund(e):`);
  for (const befund of befunde) console.error(`  • ${befund}`);
  process.exitCode = 1;
} else {
  console.log('  Keine Befunde.\n');
}
