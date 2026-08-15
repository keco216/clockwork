/**
 * Stufe 1 der Store-Bild-Pipeline: die ECHTEN Aufnahmen der nativen App.
 *
 *   node scripts/store-shots.mjs [--device emulator-5554] [--locales en-US,de-DE]
 *
 * Sie landen als rohe Geraeteaufnahmen (1080x2400) in `play/shots/<locale>/`
 * und sind eingecheckt. Die Montage (`scripts/store-frames.mjs`) liest sie von
 * dort und braucht danach WEDER Emulator NOCH Android-Kette — nur diese Stufe
 * hier braucht ein Geraet.
 *
 * ── Warum zwei Stufen und nicht eine ──────────────────────────────────────
 * Weil sie verschiedene Eigenschaften haben, und beide sind wertvoll:
 *
 *   Aufnahme  braucht ein laufendes Android, ist also an eine Maschine
 *             gebunden und NICHT byte-genau wiederholbar (siehe unten).
 *   Montage   ist reine Rechnung und liefert bei gleicher Eingabe dieselben
 *             Bytes — der Beweis dafuer steht in `store-frames.mjs`.
 *
 * Wer morgen die Ueberschrift aendert, eine Sprache ergaenzt oder den Rahmen
 * umbaut, faehrt nur Stufe 2. Ein neuer App-Stand faehrt beide.
 *
 * ── Was an dieser Aufnahme wiederholbar ist, und was nicht ────────────────
 * Wiederholbar gemacht (sonst stuende auf jedem Bild eine andere Uhrzeit):
 *
 *   * SystemUI-Demo-Modus — feste Uhr 10:00, volle Batterie, keine
 *     Meldungen, keine Funk-Zeichen. Nebenbei ist das die ehrlichste
 *     Statusleiste, die diese App haben kann: Sie hat kein Netz.
 *   * Systemzeit auf einen FESTEN Zeitpunkt gesetzt (`date @…`, Emulator mit
 *     `adb root`). Damit steht in jedem Lauf derselbe TOTP-Code im Bild.
 *   * Alle Animationsskalen auf 0 — kein Bild mitten in einer Einfeder-Fahrt.
 *   * `pm clear` vor jeder Sprache: dieselbe App aus demselben Nullzustand.
 *
 * Nicht wiederholbar ist EIN Bauteil, und das ist gemessen statt vermutet:
 * der ZEIGER des Zifferblatts. Er laeuft linear mit der Uhr (Hausregel:
 * „Federkurven fuer die Oberflaeche, linear fuer die Anzeige") und steht
 * deshalb bei jeder Aufnahme ein Tausendstel weiter. Zwei Aufnahmen desselben
 * Zustands unterscheiden sich damit in **98 von 2 592 000 Pixeln (0,004 %)**,
 * alle in einem Kasten von 18x39 px auf dem Zifferblatt — Code, Restsekunden
 * und alles andere sind Byte fuer Byte gleich. Das ist kein Fehler, sondern
 * die Anzeige, die diese App verspricht.
 *
 * ── Drei Fallen, die hier eingeplant sind ────────────────────────────────
 * (a) FLAG_SECURE steht auf AN, sobald die App frisch installiert ist —
 *     `screencap` liefert dann Schwarz. Der Lauf schaltet es ueber
 *     `files/lock-settings.json` ab und am Ende WIEDER AN. Geschrieben wird
 *     ueber `adb push` + `run-as cp`, nie ueber `echo`: die Geraete-Shell
 *     zerlegt JSON (Falle aus N11).
 * (b) Inhalt ist ausschliesslich der EINGEBAUTE Testschluessel (RFC 4226
 *     Anhang D, `GEZDG…`). Kein echtes Schluesselmaterial, keine erfundenen
 *     Konten — was im Store-Bild steht, kann jeder mit dem Knopf in der App
 *     nachstellen.
 * (c) Die System-Abfrage von `BiometricPrompt` traegt SELBST FLAG_SECURE.
 *     Gemessen an diesem Lauf: 99,91 % der Pixel sind #000000. Motiv 4 zeigt
 *     deshalb die Stelle der APP, an der die Biometrie angeboten wird (der
 *     gesperrte Tresor mit beiden Wegen), und nicht den Systemdialog. Das ist
 *     keine Notloesung: Der Systemdialog gehoert Android, das Angebot gehoert
 *     Clockwork — und nur dafuer wirbt ein Store-Bild.
 *
 * ── Warum der Emulator und nicht das S24 ─────────────────────────────────
 * Weil dieser Lauf Dinge tut, die man auf Kevins Telefon nicht tut: Er loescht
 * die App-Daten, legt einen Tresor an, schaltet Biometrie ein und braucht
 * einen eingespielten Fingerabdruck. Auf dem S24 waeren das seine echten.
 * Dazu kommt der Sucher: Die Rueckkamera des AVD zeigt die Virtual Scene, also
 * ein festes Motiv — auf einem echten Telefon zeigt sie den Schreibtisch.
 *
 * ── Der Versionsname ─────────────────────────────────────────────────────
 * Gebaut wird mit `-Pclockwork.storeShot` (siehe app/build.gradle.kts): Die
 * Ueber-Karte zeigt damit „2.0.0 (20000)" statt „2.0.0-dev-debug (20000)".
 * Der Lauf PRUEFT das am installierten Paket und bricht sonst ab — ein
 * Store-Bild mit Werkstattmarkierung faellt sonst erst im Store auf.
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

/**
 * Der feste Zeitpunkt der Aufnahme: 14.08.2026, 09:40:15 UTC.
 *
 * Die Sekunde ist nicht beliebig — 1786700415 mod 30 = 15. Der TOTP-Fenster
 * steht damit genau in der Mitte, und die Restzeit im Bild ist „15 s": weder
 * frisch gewechselt (dann sieht der Zeiger aus wie kaputt) noch fast abgelaufen.
 */
const PINNED_EPOCH = 1786700415;

/* Die Zuordnung Sprache → Ressourcenordner. Mehr als diese zwei gibt es im
   Store nicht (N21, Stufe 1); der Rest der 37 App-Sprachen bleibt im Katalog. */
const LOCALES = {
  'en-US': { tag: 'en-US', res: 'values' },
  'de-DE': { tag: 'de-DE', res: 'values-b+de' },
};

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};

const localeList = flag('locales', 'en-US,de-DE').split(',');
const befunde = [];

/* ── Geraet ──────────────────────────────────────────────────────────────── */

const sdk = path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const ADB = path.join(sdk, 'platform-tools', 'adb.exe');
const AAPT = path.join(sdk, 'build-tools', '36.0.0', 'aapt2.exe');

function adb(...rest) {
  // stderr wird verworfen: `monkey` schreibt seine Argumentliste dorthin, und
  // die stuende sonst zwischen den Messwerten dieses Laufs.
  return execFileSync(ADB, ['-s', device, ...rest], {
    encoding: 'utf8',
    maxBuffer: 64 << 20,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}
function shell(command) {
  return adb('shell', command);
}
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
      '    emulator -avd clockwork-test -no-window -no-audio -no-boot-anim -no-snapshot -gpu swiftshader_indirect\n' +
      '  Ein physisches Geraet ist hier ABSICHTLICH nicht die Voreinstellung — siehe Kopf dieser Datei.',
  );
  process.exit(1);
}

/* ── Die Oberflaeche antreiben ───────────────────────────────────────────── */

/**
 * Der Baum der sichtbaren Bauteile.
 *
 * `uiautomator dump` sieht NUR, was auf dem Schirm ist (P7-Falle). Wer etwas
 * nicht findet, hat es vielleicht bloss nicht heraufgescrollt — deshalb sagt
 * [warteAuf] beim Fehlschlag, was es STATTDESSEN gesehen hat.
 */
function dump() {
  shell('uiautomator dump /data/local/tmp/ui.xml');
  const xml = shell('cat /data/local/tmp/ui.xml');
  const nodes = [];
  for (const match of xml.matchAll(/<node[^>]*>/g)) {
    const bounds = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(match[0]);
    if (!bounds) continue;
    const [, x1, y1, x2, y2] = bounds.map(Number);
    nodes.push({
      text: entities(/text="([^"]*)"/.exec(match[0])?.[1] ?? ''),
      desc: entities(/content-desc="([^"]*)"/.exec(match[0])?.[1] ?? ''),
      x1,
      y1,
      x2,
      y2,
      cx: Math.round((x1 + x2) / 2),
      cy: Math.round((y1 + y2) / 2),
    });
  }
  return nodes;
}
const entities = (value) =>
  value
    .replace(/&#10;/g, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

function find(nodes, needle) {
  return (
    nodes.find((node) => node.text === needle || node.desc === needle) ??
    nodes.find((node) => node.text.startsWith(needle) || node.desc.startsWith(needle))
  );
}

/** Wartet, bis ein Text auf dem Schirm steht — und sagt sonst, was da war. */
async function warteAuf(needle, was, versuche = 12) {
  for (let i = 0; i < versuche; i++) {
    const nodes = dump();
    const treffer = find(nodes, needle);
    if (treffer) return { nodes, treffer };
    await sleep(700);
  }
  const sichtbar = dump()
    .map((node) => node.text || node.desc)
    .filter(Boolean)
    .slice(0, 12);
  throw new Error(
    `${was}: „${needle}" kam nicht. Auf dem Schirm stand:\n    ${sichtbar.join('\n    ')}`,
  );
}

async function tippe(needle, was) {
  const { treffer } = await warteAuf(needle, was);
  shell(`input tap ${treffer.cx} ${treffer.cy}`);
  await sleep(900);
}

/**
 * Ein EINGABEFELD statt seiner Beschriftung.
 *
 * Beide tragen denselben Satz — die Beschriftung als `text`, das Feld als
 * `content-desc`. Wer nur nach dem Satz sucht, tippt auf die Beschriftung und
 * wundert sich, dass nichts ankommt.
 */
async function tippeFeld(needle, was) {
  for (let i = 0; i < 12; i++) {
    const feld = dump().find((node) => node.desc === needle && node.text === '');
    if (feld) {
      shell(`input tap ${feld.cx} ${feld.cy}`);
      await sleep(900);
      return;
    }
    await sleep(700);
  }
  throw new Error(`${was}: Feld „${needle}" nicht gefunden`);
}

/** Ganz nach oben — drei lange Wische, dann die Probe aufs Exempel. */
async function nachOben(anker, was) {
  for (let i = 0; i < 4; i++) {
    shell('input swipe 540 700 540 2100 700');
    await sleep(700);
  }
  await warteAuf(anker, was);
}

/**
 * Scrollt, bis die Oberkante eines Bauteils auf `zielY` liegt.
 *
 * Ueber eine RUECKKOPPLUNG und nicht ueber eine gerechnete Wischlaenge: Ein
 * Wisch hat eine Wurfgeschwindigkeit, und wie weit die Seite danach noch
 * laeuft, haengt am Inhalt. Gemessen wird deshalb nach jedem Schritt neu — die
 * Regel „vor jedem Tipp neu messen" (N12) gilt fuers Scrollen genauso.
 *
 * Der Wisch ist bewusst LANGSAM (700 ms): Ein schneller Wisch wirft, ein
 * langsamer schiebt. Zu werfen waere hier das Gegenteil von Steuern.
 */
async function scrolleZu(needle, zielY, was, toleranz = 24) {
  let vorher = null;
  for (let schritt = 0; schritt < 8; schritt++) {
    const nodes = dump();
    const treffer = find(nodes, needle);
    if (!treffer) {
      // Noch nicht im Bild: eine halbe Seite weiter und erneut sehen.
      shell('input swipe 540 1700 540 900 700');
      await sleep(900);
      continue;
    }
    const abstand = treffer.y1 - zielY;
    if (Math.abs(abstand) <= toleranz) return treffer;
    /* Wenn sich nach einem Wisch NICHTS bewegt hat, ist die Seite am
       Anschlag — dann ist das Ziel nicht erreichbar und kein Fehler. Genau so
       sind die Karten dieser App gebaut: Die Tresor-Zone steht am Ende einer
       Seite, die kaum laenger ist als der Schirm. Der Rahmen rechnet damit
       (siehe `store-frames.mjs`, Kommentar zur Fenstergroesse). */
    if (vorher !== null && Math.abs(treffer.y1 - vorher) < 3) return treffer;
    vorher = treffer.y1;
    // Nach unten scrollen heisst: Inhalt nach oben wischen.
    const von = 1500;
    const bis = Math.max(300, Math.min(2100, von - abstand));
    shell(`input swipe 540 ${von} 540 ${bis} 700`);
    await sleep(900);
  }
  befunde.push(`${was}: „${needle}" liess sich nicht auf y=${zielY} bringen`);
  return find(dump(), needle);
}

/** Eine Aufnahme; der Rueckgabewert ist die Datei samt Pruefsumme. */
async function schuss(ziel) {
  shell('screencap -p /data/local/tmp/shot.png');
  await mkdir(path.dirname(ziel), { recursive: true });
  adb('pull', '/data/local/tmp/shot.png', ziel);
  const png = await readFile(ziel);
  const breite = png.readUInt32BE(16);
  const hoehe = png.readUInt32BE(20);
  if (breite !== 1080 || hoehe !== 2400) {
    befunde.push(`${path.basename(ziel)}: ${breite}x${hoehe} — erwartet 1080x2400`);
  }
  return {
    datei: path.relative(root, ziel).replace(/\\/g, '/'),
    breite,
    hoehe,
    kb: png.length / 1024,
    sha: createHash('sha256').update(png).digest('hex'),
  };
}

const dunkel = async (an) => {
  shell(`cmd uimode night ${an ? 'yes' : 'no'}`);
  await sleep(1200);
  demoModus();
  await sleep(600);
};

/**
 * Der SystemUI-Demo-Modus: feste Uhr, volle Batterie, keine Meldungen.
 *
 * Er wird nach JEDEM Themenwechsel neu gesetzt, und das ist gemessen noetig:
 * `cmd uimode night` baut die Statusleiste neu auf, und dabei kommen die
 * ECHTEN Zeichen zurueck. Auf den dunklen Aufnahmen stand danach wieder das
 * durchgestrichene SIM-Kaertchen des Emulators, waehrend Uhr und Batterie aus
 * dem Demo-Modus blieben — ein halb gesetzter Zustand, der wie ein gesetzter
 * aussieht. Aufgefallen ist es an den Pruefsummen: Die hellen Aufnahmen
 * aenderten sich nach der Korrektur, die dunklen nicht.
 *
 * `airplane hide` gehoert dazu, obwohl kein Flugmodus an ist: Ohne den
 * Schalter bleibt genau jenes SIM-Zeichen stehen. Uebrig bleiben Uhr und
 * Batterie — die ehrlichste Statusleiste, die diese App haben kann.
 */
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
const zeitFestnageln = () => shell(`date @${PINNED_EPOCH}`);

/* ── Die Texte der App, sprachrichtig ────────────────────────────────────── */

/**
 * Die Oberflaeche wird ueber RESSOURCENSCHLUESSEL angetrieben, nicht ueber
 * abgetippte Saetze: `strings('vacant_demo')` ist auf Deutsch wie auf Englisch
 * derselbe Knopf. Ein hart notierter Satz waere beim naechsten Textfeinschliff
 * still falsch — und der Lauf wuerde eine Sprache lang ins Leere tippen.
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

/* ── Vorbereitung des Geraets ────────────────────────────────────────────── */

async function geraetVorbereiten() {
  const badging = execFileSync(AAPT, ['dump', 'badging', APK], { encoding: 'utf8' }).split('\n')[0];
  const versionName = /versionName='([^']*)'/.exec(badging)?.[1];
  if (versionName !== '2.0.0') {
    throw new Error(
      `Das gebaute APK traegt versionName='${versionName}'. Store-Bilder brauchen den Auslieferungsstand:\n` +
        "    cd android-native; .\\gradlew.bat assembleDebug '-Pclockwork.storeShot'\n" +
        '  Die Anfuehrungszeichen sind noetig: PowerShell zerlegt -Pclockwork.storeShot am\n' +
        "  Punkt, und Gradle sucht dann einen Task namens '.storeShot'.",
    );
  }

  execFileSync(ADB, ['-s', device, 'install', '-r', APK], { encoding: 'utf8' });

  // Root brauchen wir fuer genau eine Sache: die Systemzeit festzunageln.
  execFileSync(ADB, ['-s', device, 'root'], { encoding: 'utf8' });
  await sleep(2500);
  execFileSync(ADB, ['-s', device, 'wait-for-device'], { encoding: 'utf8' });

  const fingerprints = shell('dumpsys fingerprint');
  if (!/"count":\s*[1-9]/.test(fingerprints)) {
    throw new Error(
      'Auf diesem Emulator ist kein Fingerabdruck eingespielt — Motiv 4 (Biometrie) braucht einen.\n' +
        '    adb shell locksettings set-pin 1234\n' +
        '    adb shell am start -a android.settings.FINGERPRINT_ENROLL\n' +
        '    (PIN tippen, MORE → I AGREE, dann mehrfach: adb emu finger touch 1)',
    );
  }

  for (const skala of [
    'window_animation_scale',
    'transition_animation_scale',
    'animator_duration_scale',
  ]) {
    shell(`settings put global ${skala} 0`);
  }
  shell('settings put global auto_time 0');

  shell('settings put global sysui_demo_allowed 1');
  demoModus();
  await sleep(800);
}

async function geraetAufraeumen() {
  shell('am broadcast -a com.android.systemui.demo -e command exit');
  for (const skala of [
    'window_animation_scale',
    'transition_animation_scale',
    'animator_duration_scale',
  ]) {
    shell(`settings put global ${skala} 1`);
  }
  shell('settings put global auto_time 1');
  // FLAG_SECURE gehoert wieder AN: Der Ausnahmezustand dieses Laufs darf nicht
  // der Zustand bleiben, in dem das Geraet stehenbleibt.
  await schreibeEinstellungen({ blockScreenshots: true });
  shell(`am force-stop ${PKG}`);
}

/** Schreibt `files/lock-settings.json` — ueber push + run-as, nie ueber echo. */
async function schreibeEinstellungen(werte) {
  const inhalt = JSON.stringify({
    timeoutMs: 300000,
    lockOnHide: true,
    biometric: false,
    blockScreenshots: false,
    ...werte,
  });
  const tmp = path.join(root, 'node_modules', '.cache', 'lock-settings.json');
  await mkdir(path.dirname(tmp), { recursive: true });
  await writeFile(tmp, inhalt);
  adb('push', tmp, '/data/local/tmp/lock-settings.json');
  shell(`run-as ${PKG} cp /data/local/tmp/lock-settings.json files/lock-settings.json`);
  const zurueck = shell(`run-as ${PKG} cat files/lock-settings.json`).trim();
  if (zurueck !== inhalt) befunde.push(`lock-settings.json kam anders zurueck: ${zurueck}`);
  await rm(tmp, { force: true });
}

const starte = async (ms = 3000) => {
  shell(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`);
  await sleep(ms);
};

/* ── Die sieben Motive ───────────────────────────────────────────────────── */

/**
 * Reihenfolge des LAUFS, nicht des Store-Eintrags.
 *
 * Sie folgt dem Zustand der App und nicht der Nummerierung: erst der
 * Leerzustand (7), dann der Sucher (5), dann die Codes (1), dann der Tresor
 * (3), dann der Tresor MIT Biometrie (4), zuletzt die zwei Seiten der
 * Einstellungen (2, 6). Jede andere Reihenfolge muesste Zustaende
 * zurueckbauen, und jeder Rueckbau ist eine Fehlerquelle.
 */
async function motive(locale, text, outDir) {
  const bilder = [];
  /* Vor JEDER Aufnahme die Uhr neu festnageln. Nicht nur vor dem Code-Bild:
     Auch die Tresor-Seite zeigt oben einen Kanalzug, und ohne den festen
     Zeitpunkt stuende dort in jedem Lauf ein anderer Code. Die Wartezeit
     danach ist die Zeit, die die Oberflaeche fuer ihren Sekundentakt braucht. */
  const nimm = async (name) => {
    zeitFestnageln();
    await sleep(1400);
    bilder.push(await schuss(path.join(outDir, `${name}.png`)));
  };

  /* 7 — Leerzustand, hell und dunkel. Das geteilte Bild braucht ZWEI
     Aufnahmen desselben Zustands; genommen wird der Startbildschirm, weil er
     als einziger nichts Zeitabhaengiges zeigt (der Zeiger steht bei
     progress = 0 auf 12 Uhr). Die zwei Haelften unterscheiden sich damit
     ausschliesslich in der Farbe — bei einem Code-Bild stuenden links und
     rechts verschiedene Ziffern. */
  await dunkel(false);
  await warteAuf(text('vacant_demo'), 'Leerzustand hell');
  await nimm('7-start-hell');

  await dunkel(true);
  await warteAuf(text('vacant_demo'), 'Leerzustand dunkel');
  await nimm('7-start-dunkel');

  /* 5 — Der Sucher. Er oeffnet sich UNTER der Tastenzeile, steht also erst
     nach dem Scrollen im oberen Drittel, das der Rahmen zeigt. Unter
     swiftshader braucht das erste Kamerabild rund zehn Sekunden; solange ist
     die Vorschau schwarz, und das ist kein Fehler. */
  shell(`pm grant ${PKG} android.permission.CAMERA`);
  await tippe(text('key_camera'), 'Kamera oeffnen');
  await sleep(12000);
  /* Auf „Kamera aus" zu WARTEN waere hier falsch: Der Knopf steht unter dem
     Sucher, also ausserhalb des Schirms — und was nicht auf dem Schirm steht,
     sieht `uiautomator dump` nicht (P7-Falle). Gescrollt wird deshalb zuerst;
     `scrolleZu` sucht selbst weiter, solange es den Anker nicht sieht. */
  await scrolleZu(text('key_cameraStop'), 1600, 'Sucher ins Bild');
  await nimm('5-sucher');
  await tippe(text('key_cameraStop'), 'Kamera schliessen');

  /* 1 — Der Arbeitszustand. Inhalt ist der eingebaute Testschluessel, sonst
     nichts. Die Zeit wird unmittelbar davor festgenagelt, damit in jedem Lauf
     derselbe Code steht. */
  await dunkel(false);
  await nachOben(text('brand_tagline'), 'Startbildschirm zurueck');
  await tippe(text('vacant_demo'), 'Testschluessel');
  await warteAuf(text('key_copy'), 'Kanalzug');
  zeitFestnageln();
  await sleep(1500);
  await nimm('1-codes');

  /* 3 — Die Tresor-Zone im Zustand „aus": Sie traegt beide Zusagen als Text
     (PBKDF2 und AES-256-GCM) und darunter das Feld fuer die Passphrase. Genau
     das behauptet die Ueberschrift des Bildes. */
  await tippe(text('vault_state_off'), 'Tresor aufklappen');
  await scrolleZu(text('vault_state_off'), 330, 'Tresor ins Bild');
  await nimm('3-tresor');

  /* 4 — Biometrie. Der Weg dahin ist der einzige lange dieses Laufs:
     versiegeln, Biometrie einschalten (mit echter System-Abfrage und
     eingespieltem Abdruck), App verlassen (das sperrt), zurueck. Erst dann
     steht der Knopf da, den das Bild zeigt. */
  await dunkel(true);
  await tippeFeld(text('vault_pass_new'), 'Passphrasenfeld');
  shell('input text clockwork');
  await sleep(700);
  // Absenden ueber die IME-Aktion: `KEYCODE_BACK` wuerde bei geschlossener
  // Tastatur die App verlassen (P7-Falle), der Knopf liegt hinter der Tastatur.
  shell('input keyevent 66');
  await warteAuf(text('vault_state_open'), 'Tresor versiegelt');

  await tippe(text('nav_settings'), 'Einstellungen');
  await tippe(text('vault_biometric_label'), 'Biometrie einschalten');
  await sleep(2500);
  adb('emu', 'finger', 'touch', '1');
  await sleep(1500);
  adb('emu', 'finger', 'remove');
  await sleep(2500);
  const wrap = shell(`run-as ${PKG} ls files/`);
  if (!wrap.includes('vault-wrap.json')) {
    throw new Error(
      'Biometrie wurde nicht eingeschaltet — kein vault-wrap.json. Fingerabdruck eingespielt?',
    );
  }

  shell('input keyevent 3'); // HOME — `lockOnHide` sperrt den Tresor
  await sleep(1500);
  await starte();
  await tippe(text('nav_home'), 'Startseite');
  await scrolleZu(text('vault_state_locked'), 330, 'Gesperrter Tresor ins Bild');
  await nimm('4-biometrie');

  /* 2 — Die Ueber-Karte. Sie traegt die Zusage, mit der dieses Bild wirbt
     („keine Netzwerk-Berechtigung"), und die Version. */
  await tippe(text('nav_settings'), 'Einstellungen');
  await scrolleZu(text('about_title'), 330, 'Ueber-Karte ins Bild');
  await nimm('2-ueber');

  /* 6 — Die Sprachliste. Sie steht ganz oben auf der Seite, also erst wieder
     hinaufscrollen — sonst oeffnet sich das Popover ausserhalb des
     Bildausschnitts. */
  await dunkel(false);
  /* Zurueck an den Anfang der Seite und nicht „zur Sprachzeile scrollen":
     Die Zeile steht ueber dem aktuellen Ausschnitt, und `scrolleZu` sucht
     einen Anker, den es nicht sieht, immer nach UNTEN. Wer nach oben will,
     sagt das. */
  await nachOben(text('lang_label'), 'Sprachzeile ins Bild');
  await tippe(text('lang_label'), 'Sprachliste');
  await warteAuf('English', 'Sprachliste offen');
  await nimm('6-sprachen');

  return bilder;
}

/* ── Lauf ────────────────────────────────────────────────────────────────── */

console.log(`\n  Store-Aufnahmen — Geraet ${device}\n`);
await geraetVorbereiten();

const alle = [];
for (const code of localeList) {
  const locale = LOCALES[code];
  if (!locale)
    throw new Error(`Unbekannte Sprache ${code} — bekannt sind ${Object.keys(LOCALES).join(', ')}`);
  console.log(`  ── ${code} ──`);

  shell(`pm clear ${PKG}`);
  shell(`cmd locale set-app-locales ${PKG} --locales ${locale.tag}`);
  shell(`pm grant ${PKG} android.permission.CAMERA`);
  zeitFestnageln();
  await starte(4000);
  await schreibeEinstellungen({});
  shell(`am force-stop ${PKG}`);
  await starte(4000);

  const text = await ladeStrings(locale.res);
  const bilder = await motive(code, text, path.join(root, 'play', 'shots', code));
  for (const bild of bilder) {
    console.log(
      `     ${bild.datei.padEnd(40)} ${bild.breite}x${bild.hoehe}  ${bild.kb.toFixed(0).padStart(4)} kB  ${bild.sha.slice(0, 16)}`,
    );
    alle.push(bild);
  }
}

await geraetAufraeumen();

console.log(`\n  ${alle.length} Aufnahmen in play/shots/.`);
if (befunde.length > 0) {
  console.error(`\n  ${befunde.length} Befund(e):`);
  for (const befund of befunde) console.error(`  • ${befund}`);
  process.exitCode = 1;
} else {
  console.log('  Keine Befunde. Weiter mit: node scripts/store-frames.mjs\n');
}
