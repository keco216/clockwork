/**
 * Die Content-Security-Policy — an EINER Stelle.
 *
 * Sie steht an zwei Orten im Ergebnis: als `<meta>` im gebauten HTML (dort
 * hängt sie an `vite.config.ts`) und als echter HTTP-Header beim Hosting (dort
 * an `vercel.json`). Zwei handgepflegte Kopien derselben Regel laufen
 * unweigerlich auseinander — und zwar unbemerkt, weil eine zu lasche Policy
 * nichts kaputtmacht, sondern nur nichts mehr verhindert. Deshalb wird sie hier
 * einmal gebaut und in `vercel-headers.test.ts` gegen `vercel.json` geprüft.
 *
 * ── Was die Policy sagt ────────────────────────────────────────────────────
 * `default-src 'none'` ist der eigentliche Gewinn: Die Seite darf von sich aus
 * nichts laden und nichts senden. Alles Erlaubte steht danach einzeln da — wer
 * die Policy liest, sieht die vollständige Liste dessen, was diese App tun kann.
 *
 * Zwei Varianten, weil die beiden Build-Ziele unterschiedlich funktionieren:
 *
 *   Normal (PWA)  Skript, Stil, Schriften und Icons liegen als eigene Dateien
 *                 auf demselben Origin. `worker-src` und `manifest-src` sind
 *                 nötig, sonst blockiert `default-src 'none'` den Service Worker
 *                 und das Manifest. `connect-src 'self'` erlaubt dem
 *                 Update-Mechanismus, den Worker nachzuladen — same-origin, mehr
 *                 nicht.
 *
 *   Single-File   Alles steckt inline bzw. als data:-URI in der einen Datei.
 *                 Kein Service Worker, kein Manifest — und deshalb
 *                 `connect-src 'none'`: Diese Datei kann nachweislich keine
 *                 einzige Netzwerkverbindung aufbauen.
 *
 * `'unsafe-inline'` bei Skript und Stil ist für den Single-File-Build
 * unvermeidbar (dort ist alles inline) und hier unkritisch: Es gibt kein `eval`
 * (`'unsafe-eval'` ist bewusst nicht gesetzt), keine fremde Datenquelle, und
 * sämtliche Nutzereingaben landen ausschließlich über `textContent` im DOM.
 */

/**
 * Die Direktive, die es NUR als HTTP-Header gibt.
 *
 * In einem `<meta>`-Tag ignoriert der Browser `frame-ancestors` und schreibt
 * eine Warnung in die Konsole. Sie ist deshalb kein Teil der Meta-Policy,
 * sondern kommt beim Hosting dazu — und ersetzt dort `X-Frame-Options`, das
 * von allen aktuellen Browsern zugunsten dieser Direktive ignoriert wird.
 */
export const HEADER_ONLY_DIRECTIVES = ["frame-ancestors 'none'"] as const;

/** Die Policy für das `<meta>`-Tag im gebauten HTML. */
export function contentSecurityPolicy(singleFile: boolean): string {
  return [
    "default-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    // Im Single-File-Build stecken die woff2-Dateien als data:-URI im CSS.
    singleFile ? "font-src 'self' data:" : "font-src 'self'",
    singleFile ? "connect-src 'none'" : "connect-src 'self'",
    ...(singleFile ? [] : ["worker-src 'self'", "manifest-src 'self'"]),
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

/**
 * Die Policy für den HTTP-Header der gehosteten PWA.
 *
 * Inhaltlich dieselbe wie im Meta-Tag — Browser wenden beide an und bilden die
 * Schnittmenge, eine Abweichung wäre also entweder wirkungslos oder ein
 * schwer auffindbarer Fehler.
 */
export function contentSecurityPolicyHeader(): string {
  return [contentSecurityPolicy(false), ...HEADER_ONLY_DIRECTIVES].join('; ');
}
