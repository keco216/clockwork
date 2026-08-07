/**
 * Ein winziger Protobuf-Leser — genau so viel, wie der
 * Google-Authenticator-Export braucht.
 *
 * Keine Bibliothek: Protobuf-Pakete bringen Codegenerator, Schema-Laufzeit und
 * ein paar hundert Kilobyte mit. Für das Lesen von sechs Feldern ist der ganze
 * Apparat unnötig — und für ein Lernprojekt ist das Wire-Format ohnehin
 * interessanter als jede Abstraktion darüber.
 *
 * ── Das Wire-Format in fünf Sätzen ─────────────────────────────────────────
 * Eine Protobuf-Nachricht ist eine Folge von Feldern ohne Rahmen und ohne Ende-
 * Markierung. Jedes Feld beginnt mit einem „Key", selbst ein Varint:
 *
 *     key = (feldnummer << 3) | wire_type
 *
 * Die unteren drei Bit sagen, WIE der Wert codiert ist, der Rest sagt, WELCHES
 * Feld gemeint ist. Danach folgt der Wert in genau der Form, die der Wire-Type
 * angibt. Ein Leser, der einen Wire-Type kennt, kann jedes Feld überspringen —
 * auch eines, das er nicht versteht. Genau deshalb bleibt Protobuf über
 * Versionen hinweg kompatibel.
 *
 * ── Varint ────────────────────────────────────────────────────────────────
 * Kleine Zahlen sollen wenige Bytes kosten. Ein Varint speichert 7 Nutzbits pro
 * Byte; das oberste Bit ist die Fortsetzungsmarke:
 *
 *     0x01              → 1        (ein Byte, MSB = 0, fertig)
 *     0xAC 0x02         → 300      (0x2C = 0101100, 0x02 = 0000010
 *                                   → 0000010_0101100 = 300)
 *
 * Die Reihenfolge ist „little endian nach Gruppen": Die niedrigwertigsten 7 Bit
 * kommen zuerst. Genau das ist die Stelle, an der eigene Implementierungen
 * üblicherweise falsch liegen.
 *
 * Wir lesen Varints als `bigint`. Protobuf erlaubt bis zu 64 Bit, und ein
 * `number` verliert ab 2^53 stillschweigend Präzision — bei einem
 * HOTP-Zählerstand wäre das ein echter Fehler.
 */

import type { Bytes } from './bytes';

/** Die Wire-Types, die im Export vorkommen. 3 und 4 (Gruppen) sind seit 2001 tot. */
export const WIRE_VARINT = 0;
export const WIRE_FIXED64 = 1;
export const WIRE_BYTES = 2;
export const WIRE_FIXED32 = 5;

export class ProtobufError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProtobufError';
  }
}

/**
 * Ein gelesenes Feld. Als unterschiedene Union statt eines Objekts mit lauter
 * optionalen Feldern: So kann der Aufrufer nicht versehentlich `bytes` von einem
 * Varint-Feld lesen.
 */
export type ProtobufField =
  | { readonly field: number; readonly kind: 'varint'; readonly value: bigint }
  | { readonly field: number; readonly kind: 'bytes'; readonly value: Bytes }
  | { readonly field: number; readonly kind: 'fixed32'; readonly value: number }
  | { readonly field: number; readonly kind: 'fixed64'; readonly value: bigint };

/**
 * Liest eine Nachricht Feld für Feld.
 *
 * Ein Generator, kein Array: Verschachtelte Nachrichten liest man damit einfach
 * rekursiv, ohne Zwischenlisten anzulegen.
 *
 * @throws {ProtobufError} bei abgeschnittenen oder unsinnigen Daten.
 */
export function* readMessage(bytes: Bytes): Generator<ProtobufField> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  while (offset < bytes.byteLength) {
    const key = readVarint(view, offset);
    offset = key.offset;

    const field = Number(key.value >> 3n);
    const wireType = Number(key.value & 0b111n);

    if (field === 0) {
      throw new ProtobufError('Feldnummer 0 gibt es nicht — die Daten sind kaputt.');
    }

    switch (wireType) {
      case WIRE_VARINT: {
        const varint = readVarint(view, offset);
        offset = varint.offset;
        yield { field, kind: 'varint', value: varint.value };
        break;
      }
      case WIRE_BYTES: {
        const length = readVarint(view, offset);
        offset = length.offset;
        const size = Number(length.value);
        const end = offset + size;
        if (size < 0 || end > bytes.byteLength) {
          throw new ProtobufError(
            `Feld ${field} gibt ${size} Byte an, es sind aber nur ${bytes.byteLength - offset} da.`,
          );
        }
        // `subarray` statt `slice`: kein Kopieren, nur ein Fenster auf dieselben
        // Bytes. Bei Schlüsselmaterial ist jede zusätzliche Kopie im Speicher
        // eine Kopie zu viel.
        yield { field, kind: 'bytes', value: bytes.subarray(offset, end) };
        offset = end;
        break;
      }
      case WIRE_FIXED32: {
        requireBytes(view, offset, 4, field);
        yield { field, kind: 'fixed32', value: view.getUint32(offset, true) };
        offset += 4;
        break;
      }
      case WIRE_FIXED64: {
        requireBytes(view, offset, 8, field);
        yield { field, kind: 'fixed64', value: view.getBigUint64(offset, true) };
        offset += 8;
        break;
      }
      default:
        throw new ProtobufError(
          `Unbekannter Wire-Type ${wireType} in Feld ${field}. Die Daten sind vermutlich ` +
            'kein Protobuf.',
        );
    }
  }
}

/**
 * Liest ein Varint ab `offset` und liefert Wert und neue Position.
 *
 * Die Obergrenze von 10 Byte ist keine Willkür: 64 Bit brauchen bei 7 Nutzbits
 * pro Byte aufgerundet 10 Byte. Ohne diese Grenze würde eine Datei aus lauter
 * 0xFF-Bytes den Leser bis zum Dateiende weiterlaufen lassen.
 */
function readVarint(view: DataView, start: number): { value: bigint; offset: number } {
  let value = 0n;
  let shift = 0n;
  let offset = start;

  for (let byteCount = 0; byteCount < 10; byteCount++) {
    if (offset >= view.byteLength) {
      throw new ProtobufError('Die Daten hören mitten in einer Zahl auf.');
    }
    const byte = view.getUint8(offset);
    offset++;

    // Die unteren 7 Bit sind Nutzlast und werden nach links an die bereits
    // gelesenen angehängt.
    value |= BigInt(byte & 0b0111_1111) << shift;

    // Oberstes Bit gesetzt heißt „es folgt noch ein Byte".
    if ((byte & 0b1000_0000) === 0) {
      return { value, offset };
    }
    shift += 7n;
  }

  throw new ProtobufError('Eine Zahl ist länger als 10 Byte — das kann kein 64-Bit-Wert sein.');
}

function requireBytes(view: DataView, offset: number, count: number, field: number): void {
  if (offset + count > view.byteLength) {
    throw new ProtobufError(`Feld ${field} braucht ${count} Byte, es sind aber weniger da.`);
  }
}

/* ── Bequemlichkeiten für den Aufrufer ───────────────────────────────────── */

/** Ein `bytes`-Feld als UTF-8-Text. */
export function asText(field: ProtobufField): string {
  if (field.kind !== 'bytes') {
    throw new ProtobufError(`Feld ${field.field} ist kein Text.`);
  }
  return new TextDecoder().decode(field.value);
}

/** Ein Varint als `number`. Für Enums und kleine Zahlen. */
export function asNumber(field: ProtobufField): number {
  if (field.kind !== 'varint') {
    throw new ProtobufError(`Feld ${field.field} ist keine Zahl.`);
  }
  return Number(field.value);
}
