/**
 * Ein Typ-Alias, der eine überraschend feine Unterscheidung sichtbar macht.
 *
 * `Uint8Array` ist seit TypeScript 5.7 generisch: `Uint8Array<ArrayBufferLike>`.
 * "ArrayBufferLike" ist entweder ein normaler `ArrayBuffer` ODER ein
 * `SharedArrayBuffer` — also Speicher, den mehrere Web Worker gleichzeitig sehen
 * und jederzeit unter uns verändern könnten.
 *
 * Genau das lässt die Web Crypto API nicht zu: `crypto.subtle` verlangt einen
 * nicht geteilten Puffer. Der Grund ist einleuchtend — würde jemand den Speicher
 * mitten in der HMAC-Berechnung ändern, wäre das Ergebnis undefiniert (in der
 * Krypto-Literatur als "TOCTOU", time-of-check to time-of-use, bekannt).
 *
 * Deshalb tragen alle Funktionen, die Schlüsselmaterial anfassen, diesen Typ:
 * Der Compiler weist geteilten Speicher dann schon beim Übersetzen ab, statt ihn
 * zur Laufzeit scheitern zu lassen.
 */
export type Bytes = Uint8Array<ArrayBuffer>;
