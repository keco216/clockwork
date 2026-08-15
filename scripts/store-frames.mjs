/**
 * Stufe 2 der Store-Bild-Pipeline: die Montage.
 *
 *   node scripts/store-frames.mjs [--locales en-US,de-DE]
 *
 * Aus den rohen Geraeteaufnahmen (`play/shots/<locale>/`, Stufe 1) und den
 * Bildtexten (`play/captions/<locale>.json`) entstehen
 *
 *   play/frames/<locale>/images/phoneScreenshots/1..7.png   1080x1920
 *   play/frames/<locale>/images/featureGraphic.png          1024x500
 *
 * ── ACHTUNG, seit D7: das ist die WERKSTATT, nicht die Auslieferung ──────
 * Bis D6 schrieb dieses Skript direkt in die zwei Store-Baeume. Seit die
 * Motive in Figma ueberarbeitet werden, tut es das NICHT mehr: Was an Play und
 * F-Droid geht, schreibt `store-figma.mjs` aus `play/Figma/`, und zwar als
 * einziger. Zwei Schreiber auf denselben Dateien heisst, dass ein Lauf den
 * anderen stillschweigend ueberschreibt — hier waere das eine verlorene
 * Gestaltungsrunde gewesen.
 *
 * Wer die Montage wieder ausliefern will, kopiert sie bewusst von
 * `play/frames/` nach `play/Figma/` und faehrt `store-figma.mjs`. Ein Schritt
 * von Hand, mit Absicht.
 *
 * ── Warum diese Stufe getrennt laeuft ────────────────────────────────────
 * Weil sie REINE RECHNUNG ist: dieselben Eingaben ergeben dieselben Bytes. Ein
 * neuer Bildtext, eine neue Sprache, ein anderer Rahmen — alles davon faehrt
 * ohne Emulator und ohne Android-Kette. Der Beweis steht in der Ausgabe des
 * Laufs: Jede Datei kommt mit ihrer SHA-256, und ein zweiter Lauf liefert
 * dieselben Pruefsummen.
 *
 * ── Warum Chromium und kein eigener Rasterisierer ────────────────────────
 * Weil hier TEXT gesetzt wird. Die drei anderen Grafik-Werkzeuge dieses
 * Projekts (icons.mjs, og-image.mjs, play-graphics.mjs) zeichnen Kreise und
 * Striche und schreiben ihre PNGs selbst — das geht, weil eine Geometrie aus
 * dreissig Strichen keine Schrift braucht. Inter ist eine VARIABLE Schrift;
 * sie in Node zu rastern hiesse, `glyf`, `gvar` und Hinting nachzubauen. Der
 * Browser liegt ohnehin im Baum (Playwright), er hat dieselbe Schrift aus
 * `src/assets/fonts/`, und er ist der Messstand, mit dem dieses Projekt
 * seine Pixel auch sonst nachmisst.
 *
 * Was NICHT aus dem Browser kommt, ist die PNG-Datei: Gezogen werden die
 * rohen Pixel, geschrieben wird mit dem Hausschreiber unten — Farbtyp 2 (RGB,
 * kein Alphakanal, die Play-Vorgabe fuer die Funktionsgrafik), kein
 * tIME-Chunk, fester Deflate-Grad. So haengt die Datei nicht an der
 * PNG-Fassung des Browsers.
 *
 * ── Die Geometrie, und warum sie von der Vorlage abweicht ────────────────
 * Die abgenommene Vorlage sagt „Geraet ~62 % der Bildbreite, beginnt bei
 * ~50 % Hoehe". Gemessen an den echten Aufnahmen geht das nicht auf: Bei
 * 62 %/50 % zeigt der Rahmen die obersten **1605** Geraetepixel, und die
 * Tresor-Karte der App endet erst bei 1930 (Motiv 3) bzw. 1970 (Motiv 4).
 * Der Knopf „Aufsperren per Fingerabdruck" — also genau das, was die
 * Ueberschrift von Motiv 4 verspricht — waere abgeschnitten. Eine Ueberschrift,
 * die eine PRUEFBARE Zusage sein soll, darf nicht ueber einem Bild stehen, das
 * sie nicht zeigt.
 *
 * Deshalb 60 % Breite und 40 % Hoehe: sichtbar sind damit **2000**
 * Geraetepixel, und alle sieben Motive tragen ihre Aussage im Bild. Die
 * Textzone bleibt 768 px hoch, also reichlich fuer Wortmarke, zwei
 * Ueberschriftszeilen und die Unterzeile. Zwei Konstanten weiter unten
 * (`GERAET_BREITE`, `GERAET_OBEN`) drehen das zurueck, wer es anders will.
 *
 * ── Motiv 7 ist zweigeteilt, und deshalb ist es der Startbildschirm ──────
 * Das geteilte Bild zeigt EIN Geraet, diagonal geschnitten: oben links die
 * helle Aufnahme, unten rechts die dunkle. Das geht nur mit einem Motiv, das
 * in beiden Aufnahmen ZEICHENGLEICH ist — sonst stuenden links und rechts der
 * Naht verschiedene Ziffern. Der Startbildschirm ist der einzige Zustand ohne
 * zeitabhaengigen Inhalt (der Zeiger steht bei progress = 0 auf 12 Uhr);
 * beide Haelften unterscheiden sich also ausschliesslich in der Farbe.
 */

import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Der PNG-Schreiber stand bis D6 hier; seit dem Figma-Import braucht ihn ein
// zweites Skript, und zwei Kopien waeren zwei Wahrheiten.
import { encodePng } from './png.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flagAt = args.indexOf('--locales');
const localeList = (flagAt >= 0 ? args[flagAt + 1] : 'en-US,de-DE').split(',');
const RUECKFALL = 'en-US';

const befunde = [];

/* ── Format ──────────────────────────────────────────────────────────────── */

const BREITE = 1080;
const HOEHE = 1920;
const FEATURE_BREITE = 1024;
const FEATURE_HOEHE = 500;

/** Play beschneidet die Raender je nach Platzierung. Nichts Wichtiges darunter. */
const SICHER = 64;
/** Der Textrand ist groesszuegiger als die Sicherheitszone — Luft ist Gestaltung. */
const RAND = 96;
/** Der Signalpunkt vor der Unterzeile. */
const PUNKT = 16;

const GERAET_BREITE = Math.round(BREITE * 0.6);
const GERAET_OBEN = Math.round(HOEHE * 0.4);
const RAHMEN = 18; // Steg zwischen Geraetekante und Schirm
/* Konzentrisch: aussen minus Steg. 96/78 waeren die Zahlen der Vorlage — sie
   sind auf 88/70 zurueckgenommen, und zwar gemessen: Die Statusleiste des
   Emulators rechnet mit einer RECHTECKIGEN Flaeche (kein Corner-Radius im
   AVD), ihre Uhr beginnt bei x = 40 von 1080. Bei Radius 78 schneidet die
   Ecke davon das erste Zeichen ab — aus „10:00" wurde „0:00". Bei 70 bleiben
   rund 10 px Luft. Wer die Vorlage zurueckholt, aendert vorher die
   Aufnahme. */
const RADIUS_KOERPER = 88;
const RADIUS_SCHIRM = 70;

/* ── Marke (aus src/styles/tokens.css, nicht geschaetzt) ─────────────────── */

const THEMEN = {
  hell: {
    grund: '#f5f5f5', // --ground
    ink: '#18181b', // --ink
    ink2: '#52525c', // --ink-2
    koerper: '#060607', // Geraetekoerper: --ground des dunklen Themes
    schatten: 'rgba(6, 6, 7, 0.20)',
    kante: null,
  },
  dunkel: {
    grund: '#060607',
    ink: '#fcfcfc',
    ink2: '#c2c2c9',
    koerper: '#18181b', // --surface des dunklen Themes
    schatten: null,
    kante: 'rgba(252, 252, 252, 0.12)',
  },
};
const SIGNAL = '#f05a28'; // --signal

/* ── Die sieben Motive ───────────────────────────────────────────────────── */

const MOTIVE = [
  { nr: 1, thema: 'hell', shot: '1-codes' },
  { nr: 2, thema: 'dunkel', shot: '2-ueber' },
  { nr: 3, thema: 'hell', shot: '3-tresor' },
  { nr: 4, thema: 'dunkel', shot: '4-biometrie' },
  { nr: 5, thema: 'dunkel', shot: '5-sucher' },
  { nr: 6, thema: 'hell', shot: '6-sprachen' },
  { nr: 7, thema: 'hell', shot: '7-start-hell', shot2: '7-start-dunkel' },
];

/* ── Was im Browser gezeichnet wird ──────────────────────────────────────── */

/**
 * Der ganze Rahmen in EINER Funktion im Browser.
 *
 * Sie bekommt alles als Wert uebergeben (Bilder als data:-URL, Texte, Masse)
 * und gibt die rohen RGB-Bytes als base64 zurueck. Absichtlich keine
 * DOM-Struktur: Ein Canvas ist hier die kuerzere Beschreibung, und er macht
 * die Reihenfolge des Zeichnens (Schatten, Maske, Naht) ausdruecklich.
 */
async function zeichne(page, auftrag) {
  return page.evaluate(async (a) => {
    const canvas = document.createElement('canvas');
    canvas.width = a.breite;
    canvas.height = a.hoehe;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

    const laden = (url) =>
      new Promise((fertig, fehler) => {
        const bild = new Image();
        bild.onload = () => fertig(bild);
        bild.onerror = fehler;
        bild.src = url;
      });

    /* ── Grundlagen ─────────────────────────────────────────────────────── */
    ctx.fillStyle = a.thema.grund;
    ctx.fillRect(0, 0, a.breite, a.hoehe);

    const rundesRechteck = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const setzeSchrift = (gewicht, groesse, sperrung) => {
      ctx.font = `${gewicht} ${groesse}px "Inter Variable"`;
      ctx.letterSpacing = `${sperrung}px`;
    };

    /* ── Die Wortmarke, beide O als Zifferblaetter ───────────────────────
       Die Masse kommen woertlich aus `src/styles/mark.css` und aus
       `ui/Masthead.kt`: Ring 0,7 em Durchmesser bei 0,092 em Strich, Sperrung
       0,16 em, und der Signal-Index auf dem ERSTEN O — 0,092 em breit,
       0,3 em hoch, beginnend 0,1 em ueber dem Ring. So traegt das Store-Bild
       dieselbe Marke wie der Kopf der App und nicht eine Nachzeichnung. */
    const wortmarke = (mitte, grundlinie, groesse, farbe) => {
      const sperrung = 0.16 * groesse;
      const ring = 0.7 * groesse;
      const strich = 0.092 * groesse;
      setzeSchrift(600, groesse, sperrung);
      const teile = ['CL', 'CKW', 'RK'];
      const breiten = teile.map((t) => ctx.measureText(t).width);
      const gesamt = breiten[0] + breiten[1] + breiten[2] + 2 * (ring + sperrung);
      let x = mitte - gesamt / 2;

      const zeichneRing = (mitIndex) => {
        x += sperrung;
        ctx.strokeStyle = farbe;
        ctx.lineWidth = strich;
        ctx.beginPath();
        ctx.arc(x + ring / 2, grundlinie - ring / 2, (ring - strich) / 2, 0, Math.PI * 2);
        ctx.stroke();
        if (mitIndex) {
          ctx.fillStyle = a.signal;
          ctx.fillRect(
            x + ring / 2 - strich / 2,
            grundlinie - ring - 0.1 * groesse,
            strich,
            0.3 * groesse,
          );
        }
        x += ring;
      };

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = farbe;
      ctx.fillText(teile[0], x, grundlinie);
      x += breiten[0];
      zeichneRing(true);
      ctx.fillStyle = farbe;
      ctx.fillText(teile[1], x, grundlinie);
      x += breiten[1];
      zeichneRing(false);
      ctx.fillStyle = farbe;
      ctx.fillText(teile[2], x, grundlinie);
    };

    /* ── Zeilenumbruch: hoechstens zwei Zeilen, Groesse kommt von aussen ── */
    const umbrechen = (satz, groesse, sperrung, maxBreite) => {
      setzeSchrift(700, groesse, sperrung);
      const woerter = satz.split(' ');
      const zeilen = [];
      let zeile = '';
      for (const wort of woerter) {
        const probe = zeile ? `${zeile} ${wort}` : wort;
        if (ctx.measureText(probe).width <= maxBreite || !zeile) zeile = probe;
        else {
          zeilen.push(zeile);
          zeile = wort;
        }
      }
      zeilen.push(zeile);
      return zeilen;
    };

    if (a.nurMessen) {
      /* Der Vorlauf. Er beantwortet zwei Fragen fuer die ganze Sprache:
         welche Ueberschriftsgroesse jeden der sieben Saetze in HOECHSTENS
         zwei Zeilen bringt, und wie breit die laengste Unterzeile bei einer
         Bezugsgroesse ist. Beides einmal je Sprache und nicht je Bild — der
         Satz wird nebeneinander gezeigt, und drei verschiedene
         Schriftgroessen darin saehen aus wie drei verschiedene Absender. */
      const zeilen = {};
      for (const [schluessel, satz] of Object.entries(a.nurMessen.ueberschriften)) {
        zeilen[schluessel] = {};
        for (const groesse of a.groessen) {
          zeilen[schluessel][groesse] = umbrechen(
            satz,
            groesse,
            -0.02 * groesse,
            a.textBreite,
          ).length;
        }
      }
      const unterBreiten = {};
      setzeSchrift(500, 100, 0);
      for (const [schluessel, satz] of Object.entries(a.nurMessen.unterzeilen)) {
        unterBreiten[schluessel] = satz ? ctx.measureText(satz).width : 0;
      }
      return { zeilen, unterBreiten };
    }

    /* ── Textblock: Ueberschrift und Unterzeile, senkrecht mittig ───────── */
    const sperrungUeber = -0.02 * a.ueberGroesse;
    const zeilen = umbrechen(a.headline, a.ueberGroesse, sperrungUeber, a.textBreite);
    const zeilenhoehe = a.ueberGroesse * 1.16;
    const unterHoehe = a.subline ? a.unterGroesse * 1.2 + a.unterAbstand : 0;
    const blockHoehe = zeilen.length * zeilenhoehe + unterHoehe;
    const zoneOben = a.wortmarkeUnten;
    const zoneUnten = a.geraetOben;
    let y = zoneOben + (zoneUnten - zoneOben - blockHoehe) / 2;

    setzeSchrift(700, a.ueberGroesse, sperrungUeber);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = a.thema.ink;
    for (const zeile of zeilen) {
      // Die Grundlinie liegt bei rund 0,8 der Zeilenhoehe — Inters
      // Versalhoehe (0,727 em) plus Unterlaenge in der Zeile.
      ctx.fillText(zeile, a.breite / 2, y + a.ueberGroesse * 0.82);
      y += zeilenhoehe;
    }

    if (a.subline) {
      y += a.unterAbstand;
      setzeSchrift(500, a.unterGroesse, 0);
      const textBreite = ctx.measureText(a.subline).width;
      const punkt = a.punktGroesse;
      const abstand = punkt * 0.75;
      const gesamt = punkt + abstand + textBreite;
      const links = a.breite / 2 - gesamt / 2;
      const grundlinie = y + a.unterGroesse * 0.82;
      ctx.fillStyle = a.signal;
      ctx.beginPath();
      ctx.arc(links + punkt / 2, grundlinie - a.unterGroesse * 0.3, punkt / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = a.thema.ink2;
      ctx.textAlign = 'left';
      ctx.fillText(a.subline, links + punkt + abstand, grundlinie);
    }

    /* ── Die Wortmarke oben ─────────────────────────────────────────────── */
    wortmarke(a.breite / 2, a.wortmarkeGrundlinie, a.wortmarkeGroesse, a.thema.ink);

    /* ── Das Geraet ─────────────────────────────────────────────────────── */
    const gx = (a.breite - a.geraetBreite) / 2;
    const gy = a.geraetOben;
    const gh = a.hoehe - gy + a.radiusKoerper; // laeuft unten aus dem Bild

    if (a.thema.schatten) {
      ctx.save();
      ctx.shadowColor = a.thema.schatten;
      ctx.shadowBlur = 90;
      ctx.shadowOffsetY = 44;
      ctx.fillStyle = a.thema.koerper;
      rundesRechteck(gx, gy, a.geraetBreite, gh, a.radiusKoerper);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = a.thema.koerper;
      rundesRechteck(gx, gy, a.geraetBreite, gh, a.radiusKoerper);
      ctx.fill();
    }
    if (a.thema.kante) {
      ctx.strokeStyle = a.thema.kante;
      ctx.lineWidth = 2;
      rundesRechteck(gx + 1, gy + 1, a.geraetBreite - 2, gh - 2, a.radiusKoerper - 1);
      ctx.stroke();
    }

    const sx = gx + a.rahmen;
    const sy = gy + a.rahmen;
    const sw = a.geraetBreite - 2 * a.rahmen;
    const sh = a.hoehe - sy + 4;

    ctx.save();
    rundesRechteck(sx, sy, sw, sh, a.radiusSchirm);
    ctx.clip();
    const bild = await laden(a.shot);
    const massstab = sw / bild.width;
    ctx.drawImage(bild, sx, sy, sw, bild.height * massstab);

    if (a.shot2) {
      /* Die Naht: Alles unterhalb der Diagonalen bekommt die zweite Aufnahme.
         Die Diagonale laeuft von der oberen rechten Ecke des SICHTBAREN
         Schirmausschnitts zu seiner unteren linken — so liegt die helle
         Haelfte oben links, wie in der Vorlage. */
      const bild2 = await laden(a.shot2);
      ctx.beginPath();
      ctx.moveTo(sx + sw, sy);
      ctx.lineTo(sx + sw, sy + sh);
      ctx.lineTo(sx, sy + sh);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(bild2, sx, sy, sw, bild2.height * massstab);
    }
    ctx.restore();

    const daten = ctx.getImageData(0, 0, a.breite, a.hoehe).data;
    let roh = '';
    const stueck = 8192;
    const bytes = new Uint8Array((daten.length / 4) * 3);
    for (let i = 0, j = 0; i < daten.length; i += 4, j += 3) {
      bytes[j] = daten[i];
      bytes[j + 1] = daten[i + 1];
      bytes[j + 2] = daten[i + 2];
    }
    for (let i = 0; i < bytes.length; i += stueck) {
      roh += String.fromCharCode.apply(null, bytes.subarray(i, i + stueck));
    }
    return btoa(roh);
  }, auftrag);
}

/**
 * Die Funktionsgrafik: Emblem links, Wortmarke und Zeile rechts.
 *
 * Das Emblem ist dasselbe wie in `play-graphics.mjs` und im OG-Bild — Zeichen A
 * des Markenhandbuchs, 30 Marken fuer 30 Sekunden, die Signalmarke auf 12 Uhr.
 * Neu ist nur der Grund: Bis 1.x stand es auf Nacht, jetzt auf `--ground` hell
 * wie die uebrigen Bilder des Satzes. Ein Store-Auftritt, dessen Kachel eine
 * andere Sprache spricht als seine Bilder, wirkt zusammengesucht.
 */
async function zeichneFeature(page, auftrag) {
  return page.evaluate(async (a) => {
    const canvas = document.createElement('canvas');
    canvas.width = a.breite;
    canvas.height = a.hoehe;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    ctx.fillStyle = a.thema.grund;
    ctx.fillRect(0, 0, a.breite, a.hoehe);

    /* Emblem */
    const cx = a.emblemX;
    const cy = a.hoehe / 2;
    const r = a.emblemR;
    for (let i = 0; i < 30; i++) {
      const signal = i === 0;
      const rad = ((i * 12 - 90) * Math.PI) / 180;
      const innen = (signal ? 0.7 : 0.8) * r;
      ctx.strokeStyle = signal ? a.signal : a.thema.ink;
      ctx.lineWidth = (signal ? 0.073 : 0.048) * r;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * innen, cy + Math.sin(rad) * innen);
      ctx.lineTo(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r);
      ctx.stroke();
    }
    ctx.fillStyle = a.thema.ink;
    ctx.beginPath();
    ctx.arc(cx, cy, 0.052 * r, 0, Math.PI * 2);
    ctx.fill();

    /* Wortmarke und Zeile */
    const setzeSchrift = (gewicht, groesse, sperrung) => {
      ctx.font = `${gewicht} ${groesse}px "Inter Variable"`;
      ctx.letterSpacing = `${sperrung}px`;
    };
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const marke = (x, grundlinie, groesse) => {
      const sperrung = 0.16 * groesse;
      const ring = 0.7 * groesse;
      const strich = 0.092 * groesse;
      setzeSchrift(600, groesse, sperrung);
      const teile = ['CL', 'CKW', 'RK'];
      const breiten = teile.map((t) => ctx.measureText(t).width);
      let px = x;
      const zeichneRing = (mitIndex) => {
        px += sperrung;
        ctx.strokeStyle = a.thema.ink;
        ctx.lineWidth = strich;
        ctx.beginPath();
        ctx.arc(px + ring / 2, grundlinie - ring / 2, (ring - strich) / 2, 0, Math.PI * 2);
        ctx.stroke();
        if (mitIndex) {
          ctx.fillStyle = a.signal;
          ctx.fillRect(
            px + ring / 2 - strich / 2,
            grundlinie - ring - 0.1 * groesse,
            strich,
            0.3 * groesse,
          );
        }
        px += ring;
      };
      ctx.fillStyle = a.thema.ink;
      ctx.fillText(teile[0], px, grundlinie);
      px += breiten[0];
      zeichneRing(true);
      ctx.fillStyle = a.thema.ink;
      ctx.fillText(teile[1], px, grundlinie);
      px += breiten[1];
      zeichneRing(false);
      ctx.fillStyle = a.thema.ink;
      ctx.fillText(teile[2], px, grundlinie);
      return breiten[0] + breiten[1] + breiten[2] + 2 * (ring + sperrung);
    };

    /* Erst messen, dann setzen: Die Zeile darf die Sicherheitszone rechts
       nicht anfassen, und sie ist in jeder Sprache verschieden lang. */
    let markeGroesse = a.markeGroesse;
    let zeileGroesse = a.zeileGroesse;
    const platz = a.breite - a.textX - a.sicher;
    for (;;) {
      setzeSchrift(600, markeGroesse, 0.16 * markeGroesse);
      const markeBreite =
        ctx.measureText('CLCKWRK').width + 2 * (0.7 * markeGroesse + 0.16 * markeGroesse);
      setzeSchrift(500, zeileGroesse, 0);
      const zeileBreite = ctx.measureText(a.subline).width;
      if (Math.max(markeBreite, zeileBreite) <= platz || zeileGroesse <= 14) break;
      markeGroesse -= 1;
      zeileGroesse -= 1;
    }

    const markeGrundlinie = a.hoehe / 2 - 8;
    marke(a.textX, markeGrundlinie, markeGroesse);
    setzeSchrift(500, zeileGroesse, 0);
    ctx.fillStyle = a.thema.ink2;
    ctx.fillText(a.subline, a.textX, markeGrundlinie + zeileGroesse * 2.0);

    const daten = ctx.getImageData(0, 0, a.breite, a.hoehe).data;
    const bytes = new Uint8Array((daten.length / 4) * 3);
    for (let i = 0, j = 0; i < daten.length; i += 4, j += 3) {
      bytes[j] = daten[i];
      bytes[j + 1] = daten[i + 1];
      bytes[j + 2] = daten[i + 2];
    }
    let roh = '';
    for (let i = 0; i < bytes.length; i += 8192) {
      roh += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    return btoa(roh);
  }, auftrag);
}

/* ── Lauf ────────────────────────────────────────────────────────────────── */

const dataUrl = async (datei) =>
  `data:image/png;base64,${(await readFile(datei)).toString('base64')}`;

async function ladeTexte(locale) {
  const eigen = path.join(root, 'play', 'captions', `${locale}.json`);
  try {
    return { texte: JSON.parse(await readFile(eigen, 'utf8')), quelle: locale };
  } catch {
    /* N22: Ein Rueckfall auf Englisch ist erlaubt — aber er wird GESAGT. Ein
       stilles englisches Bild in einem spanischen Eintrag faellt sonst erst
       dem Nutzer auf. */
    const zurueck = JSON.parse(
      await readFile(path.join(root, 'play', 'captions', `${RUECKFALL}.json`), 'utf8'),
    );
    console.log(`     ! ${locale}: keine Bildtexte — Rueckfall auf ${RUECKFALL}`);
    befunde.push(`${locale}: Bildtexte fehlen, es wurde ${RUECKFALL} gesetzt`);
    return { texte: zurueck, quelle: RUECKFALL };
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();

/* Die Schriften kommen aus dem Projekt und nicht vom System: Es sind dieselben
   Dateien, die die App und die Web-Fassung ausliefern. */
const schriften = [
  [
    'latin',
    'inter-latin-wght-normal.woff2',
    'U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122, U+2212',
  ],
  [
    'ext',
    'inter-latin-ext-wght-normal.woff2',
    'U+0100-02BA, U+1E00-1E9F, U+2020, U+20A0-20AB, U+2C60-2C7F, U+A720-A7FF',
  ],
];
await page.goto('about:blank');
for (const [, datei, bereich] of schriften) {
  const url = `data:font/woff2;base64,${(await readFile(path.join(root, 'src', 'assets', 'fonts', datei))).toString('base64')}`;
  await page.evaluate(
    async ([quelle, unicodeRange]) => {
      const face = new FontFace('Inter Variable', `url(${quelle})`, {
        weight: '100 900',
        unicodeRange,
      });
      await face.load();
      document.fonts.add(face);
    },
    [url, bereich],
  );
}

const dateien = [];

for (const locale of localeList) {
  console.log(`  ── ${locale} ──`);
  const { texte } = await ladeTexte(locale);
  const shotDir = path.join(root, 'play', 'shots', locale);

  /* Eine Schriftgroesse fuer den ganzen Satz: Der groesste Wert, bei dem JEDE
     Ueberschrift dieser Sprache in zwei Zeilen passt. Je Bild eine eigene
     Groesse zu nehmen waere bequemer und saehe zusammengewuerfelt aus — der
     Satz wird nebeneinander gezeigt. */
  const groessen = [88, 84, 80, 76, 72, 68, 64];
  const messung = await zeichne(page, {
    breite: 10,
    hoehe: 10,
    thema: THEMEN.hell,
    nurMessen: {
      ueberschriften: Object.fromEntries(MOTIVE.map((m) => [m.nr, texte[m.nr].headline])),
      unterzeilen: Object.fromEntries(MOTIVE.map((m) => [m.nr, texte[m.nr].subline])),
    },
    groessen,
    textBreite: BREITE - 2 * RAND,
  });
  const ueberGroesse =
    groessen.find((g) => MOTIVE.every((m) => messung.zeilen[m.nr][g] <= 2)) ?? groessen.at(-1);

  /* Die Unterzeile ist EINE Zeile — das ist die Vorgabe, und sie ist auch
     inhaltlich richtig: Was zwei Zeilen braucht, ist keine Unterzeile mehr,
     sondern ein zweiter Satz. Also wird die Groesse so gewaehlt, dass die
     LAENGSTE dieser Sprache samt Signalpunkt in die Textbreite passt. Die
     Breite waechst linear mit der Schriftgroesse, deshalb reicht eine Messung
     bei 100 px. */
  const platzUnten = BREITE - 2 * RAND - PUNKT - PUNKT * 0.75;
  const laengste = Math.max(...MOTIVE.map((m) => messung.unterBreiten[m.nr]));
  const unterGroesse = Math.max(26, Math.min(38, Math.floor((platzUnten / laengste) * 100)));
  console.log(
    `     Ueberschrift ${ueberGroesse} px (groesste Groesse, bei der alle sieben in zwei Zeilen passen), ` +
      `Unterzeile ${unterGroesse} px`,
  );

  for (const motiv of MOTIVE) {
    const thema = THEMEN[motiv.thema];
    const base64 = await zeichne(page, {
      breite: BREITE,
      hoehe: HOEHE,
      thema,
      signal: SIGNAL,
      headline: texte[motiv.nr].headline,
      subline: texte[motiv.nr].subline,
      ueberGroesse,
      unterGroesse,
      unterAbstand: 40,
      punktGroesse: PUNKT,
      textBreite: BREITE - 2 * RAND,
      wortmarkeGroesse: 40,
      wortmarkeGrundlinie: 140,
      wortmarkeUnten: 200,
      geraetBreite: GERAET_BREITE,
      geraetOben: GERAET_OBEN,
      rahmen: RAHMEN,
      radiusKoerper: RADIUS_KOERPER,
      radiusSchirm: RADIUS_SCHIRM,
      shot: await dataUrl(path.join(shotDir, `${motiv.shot}.png`)),
      shot2: motiv.shot2 ? await dataUrl(path.join(shotDir, `${motiv.shot2}.png`)) : null,
    });
    const png = encodePng(Buffer.from(base64, 'base64'), BREITE, HOEHE);
    dateien.push(
      ...(await schreibe(locale, `images/phoneScreenshots/${motiv.nr}.png`, png, BREITE, HOEHE)),
    );
  }

  const feature = await zeichneFeature(page, {
    breite: FEATURE_BREITE,
    hoehe: FEATURE_HOEHE,
    thema: THEMEN.hell,
    signal: SIGNAL,
    subline: texte.feature.subline,
    emblemX: 236,
    emblemR: 146,
    textX: 452,
    sicher: SICHER + 16,
    markeGroesse: 62,
    zeileGroesse: 24,
  });
  const featurePng = encodePng(Buffer.from(feature, 'base64'), FEATURE_BREITE, FEATURE_HOEHE);
  dateien.push(
    ...(await schreibe(
      locale,
      'images/featureGraphic.png',
      featurePng,
      FEATURE_BREITE,
      FEATURE_HOEHE,
    )),
  );
}

await browser.close();

/** Schreibt EINE Datei in BEIDE Baeume (N23) und misst sie nach. */
/**
 * Geschrieben wird in die WERKSTATT, nicht in die Auslieferung (D7).
 *
 * Bis D6 schrieb dieses Skript direkt nach `play/listing/` und
 * `fastlane/metadata/android/`. Seit die Motive aus Figma kommen
 * (`store-figma.mjs`), haetten zwei Skripte dieselben Dateien geschrieben —
 * und der zweite Lauf haette den ersten stillschweigend ueberschrieben. Genau
 * so verliert man eine Gestaltungsrunde, ohne es zu merken.
 *
 * Jetzt gilt: EIN Gegenstand, EIN Schreiber. Die ausgelieferten Bilder gehoeren
 * `store-figma.mjs`; dieses Skript legt seine Montage unter `play/frames/` ab.
 * Von dort kann man sie ansehen, vergleichen und — wenn die Montage wieder die
 * bessere ist — nach `play/Figma/` uebernehmen. Nichts davon passiert
 * automatisch.
 */
async function schreibe(locale, relativ, png, breite, hoehe) {
  const ziele = [path.join(root, 'play', 'frames', locale, relativ)];
  const sha = createHash('sha256').update(png).digest('hex');
  const gemessen = { breite: png.readUInt32BE(16), hoehe: png.readUInt32BE(20), farbtyp: png[25] };
  if (gemessen.breite !== breite || gemessen.hoehe !== hoehe) {
    befunde.push(`${relativ}: ${gemessen.breite}x${gemessen.hoehe} statt ${breite}x${hoehe}`);
  }
  if (gemessen.farbtyp !== 2)
    befunde.push(`${relativ}: Farbtyp ${gemessen.farbtyp}, Play will 2 (RGB)`);
  const verhaeltnis = Math.max(breite, hoehe) / Math.min(breite, hoehe);
  if (breite === BREITE && verhaeltnis > 2)
    befunde.push(`${relativ}: Verhaeltnis ${verhaeltnis.toFixed(3)} > 2`);

  const eintraege = [];
  for (const ziel of ziele) {
    await mkdir(path.dirname(ziel), { recursive: true });
    await writeFile(ziel, png);
    eintraege.push({
      datei: path.relative(root, ziel).replace(/\\/g, '/'),
      kb: png.length / 1024,
      sha,
    });
  }
  console.log(
    `     ${locale}/${relativ.padEnd(34)} ${breite}x${hoehe}  ${(png.length / 1024).toFixed(0).padStart(4)} kB  ${sha.slice(0, 16)}`,
  );
  return eintraege;
}

console.log(`\n  ${dateien.length} Bilder in der Werkstatt (play/frames/).`);
console.log('  Ausgeliefert wird daraus NICHTS — das tut scripts/store-figma.mjs.');
if (befunde.length > 0) {
  console.error(`\n  ${befunde.length} Befund(e):`);
  for (const befund of befunde) console.error(`  • ${befund}`);
  process.exitCode = 1;
} else {
  console.log('  Masse, Farbtyp und Seitenverhaeltnis geprueft.\n');
}
