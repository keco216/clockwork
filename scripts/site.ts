/**
 * Die Adresse der Seite — an EINER Stelle.
 *
 * Dieselbe Begründung wie bei `scripts/csp.ts`: Was mehrfach von Hand gepflegt
 * wird, läuft auseinander. Bei der CSP passiert das unbemerkt, hier laut — ein
 * falsches `og:image` liefert einem geteilten Link ein totes Vorschaubild, und
 * gesehen hat das dann jeder außer dem, der es geändert hat.
 *
 * ── Warum das nachgezogen wurde ────────────────────────────────────────────
 * V4 wollte diese zentrale Stelle ausdrücklich, damit ein Domainwechsel „ein
 * Einzeiler" wird. Gebaut wurde sie damals nicht: Als sich beim Import
 * herausstellte, dass `clockwork.vercel.app` vergeben war und Vercel
 * `clockwork-sage` zuteilte, wurden stattdessen sechs Stellen von Hand
 * nachgezogen. Es hat funktioniert und war genau das, was nicht passieren
 * sollte.
 *
 * Jetzt steht die Adresse hier, und `vite.config.ts` setzt sie beim Bauen in
 * die vier Platzhalter in `index.html` ein. Der Wechsel ist damit tatsächlich
 * eine Zeile — plus die Erwähnungen in README und Langdoku, die Prosa sind und
 * kein Bauteil.
 *
 * Ohne abschließenden Schrägstrich: Alle Verwender hängen ihren eigenen Pfad
 * an, und zwei Schrägstriche hintereinander sind eine andere URL als einer.
 */
export const SITE_URL = 'https://clockwork-sage.vercel.app';

/** Eine absolute Adresse auf dieser Seite. `path` beginnt mit einem Schrägstrich. */
export function siteUrl(path = '/'): string {
  return `${SITE_URL}${path}`;
}
