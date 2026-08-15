/**
 * PNG lesen und schreiben — an EINER Stelle.
 *
 * Der Schreiber stand bis D6 in `store-frames.mjs` und wurde dort gebraucht,
 * um die montierten Rahmen abzulegen. Mit dem Figma-Import (`store-figma.mjs`)
 * braucht ihn ein zweites Skript, und eine zweite Kopie waere genau die
 * Doppelung, die D1b bei der Versionsnummer abgeraeumt hat. Der Code ist
 * unveraendert uebernommen; dass die Bilder danach byte-identisch bleiben, ist
 * gemessen und in der Abnahme-Doku (D6) festgehalten.
 *
 * Der Leser ist neu und kann bewusst WENIG: 8 Bit je Kanal, nicht interlaced,
 * Farbtyp 2 oder 6. Mehr braucht kein Bild, das in diesen Baeumen liegt, und
 * ein Leser, der alles kann, ist ein Leser, den niemand mehr pruefen kann.
 * Alles andere bricht ab, statt zu raten.
 */

import { deflateSync, inflateSync, crc32 } from 'node:zlib';

/* ── Schreiben (Farbtyp 2, deterministisch) ──────────────────────────────── */

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData) >>> 0);
  return Buffer.concat([length, typeAndData, checksum]);
}

/**
 * Zeilenfilter: hier ADAPTIV, anders als in `play-graphics.mjs`.
 *
 * Dort steht Filter 0, und dort ist das richtig — eine Flaeche aus dreissig
 * Strichen auf einfarbigem Grund komprimiert ueber identische Zeilen besser als
 * ueber Differenzen. Hier liegt aber eine SKALIERTE Aufnahme im Bild, also
 * weiche Verlaeufe an jeder Kante; Filter 0 blaeht sie auf das Zwei- bis
 * Dreifache. Gewaehlt wird je Zeile der Filter mit der kleinsten Summe der
 * Betraege — die uebliche Heuristik, deterministisch und ohne Parameter.
 */
function filterZeile(roh, vorige, stride, bpp) {
  const kandidaten = [];
  for (let typ = 0; typ <= 4; typ++) {
    const out = Buffer.alloc(stride);
    let summe = 0;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? roh[i - bpp] : 0;
      const b = vorige[i];
      const c = i >= bpp ? vorige[i - bpp] : 0;
      let wert;
      if (typ === 0) wert = roh[i];
      else if (typ === 1) wert = roh[i] - a;
      else if (typ === 2) wert = roh[i] - b;
      else if (typ === 3) wert = roh[i] - ((a + b) >> 1);
      else {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        wert = roh[i] - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      out[i] = wert & 255;
      summe += out[i] < 128 ? out[i] : 256 - out[i];
    }
    kandidaten.push({ typ, out, summe });
  }
  return kandidaten.reduce((beste, k) => (k.summe < beste.summe ? k : beste));
}

export function encodePng(rgb, width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // Bit-Tiefe
  header[9] = 2; // Farbtyp 2 = RGB ohne Alpha — die Play-Vorgabe
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = width * 3;
  const raw = Buffer.alloc(height * (stride + 1));
  let vorige = Buffer.alloc(stride);
  for (let row = 0; row < height; row++) {
    const zeile = rgb.subarray(row * stride, (row + 1) * stride);
    const beste = filterZeile(zeile, vorige, stride, 3);
    raw[row * (stride + 1)] = beste.typ;
    beste.out.copy(raw, row * (stride + 1) + 1);
    vorige = zeile;
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ── Lesen ───────────────────────────────────────────────────────────────── */

/**
 * Liest ein PNG und gibt `{ breite, hoehe, farbtyp, pixel }` zurueck; `pixel`
 * sind die entfilterten Rohbytes, also 3 oder 4 je Punkt.
 *
 * Bricht ab bei Interlace, anderer Bit-Tiefe oder Palette. Das ist Absicht:
 * Ein Leser, der einen unbekannten Fall irgendwie behandelt, liefert ein Bild,
 * das falsch aussieht statt zu fehlen — und das faellt erst im Store auf.
 */
export function decodePng(datei) {
  if (datei.readUInt32BE(0) !== 0x89504e47) throw new Error('Keine PNG-Datei.');

  let i = 8;
  let breite = 0;
  let hoehe = 0;
  let farbtyp = 0;
  const idat = [];

  while (i < datei.length) {
    const len = datei.readUInt32BE(i);
    const typ = datei.toString('ascii', i + 4, i + 8);
    const d = datei.subarray(i + 8, i + 8 + len);

    if (typ === 'IHDR') {
      breite = d.readUInt32BE(0);
      hoehe = d.readUInt32BE(4);
      farbtyp = d[9];
      if (d[8] !== 8) throw new Error(`Bit-Tiefe ${d[8]} — nur 8 wird gelesen.`);
      if (d[12] !== 0) throw new Error('Interlaced PNG — wird nicht gelesen.');
      if (farbtyp !== 2 && farbtyp !== 6) {
        throw new Error(`Farbtyp ${farbtyp} — nur 2 (RGB) und 6 (RGBA) werden gelesen.`);
      }
    } else if (typ === 'IDAT') {
      idat.push(d);
    } else if (typ === 'IEND') {
      break;
    }
    i += 12 + len;
  }

  const bpp = farbtyp === 6 ? 4 : 3;
  const stride = breite * bpp;
  const roh = inflateSync(Buffer.concat(idat));
  const pixel = Buffer.alloc(hoehe * stride);

  for (let y = 0; y < hoehe; y++) {
    const typ = roh[y * (stride + 1)];
    const zeile = roh.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? pixel[y * stride + x - bpp] : 0;
      const b = y > 0 ? pixel[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? pixel[(y - 1) * stride + x - bpp] : 0;
      let wert = zeile[x];
      if (typ === 1) wert += a;
      else if (typ === 2) wert += b;
      else if (typ === 3) wert += (a + b) >> 1;
      else if (typ === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        wert += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      pixel[y * stride + x] = wert & 255;
    }
  }

  return { breite, hoehe, farbtyp, pixel };
}

/**
 * Nimmt den Alphakanal heraus — und weigert sich, wenn er etwas traegt.
 *
 * Ein Bild mit halbdurchsichtigen Punkten muesste auf IRGENDEINEN Grund
 * gerechnet werden, und welcher das waere, weiss dieses Modul nicht. Lieber
 * abbrechen als eine Farbe erfinden.
 */
export function ohneAlpha({ breite, hoehe, farbtyp, pixel }) {
  if (farbtyp === 2) return pixel;

  const punkte = breite * hoehe;
  for (let k = 3; k < pixel.length; k += 4) {
    if (pixel[k] !== 255) {
      throw new Error(
        'Das Bild hat halbdurchsichtige Punkte — es kann nicht ohne Grundfarbe flachgelegt werden.',
      );
    }
  }

  const rgb = Buffer.alloc(punkte * 3);
  for (let p = 0; p < punkte; p++) {
    rgb[p * 3] = pixel[p * 4];
    rgb[p * 3 + 1] = pixel[p * 4 + 1];
    rgb[p * 3 + 2] = pixel[p * 4 + 2];
  }
  return rgb;
}
