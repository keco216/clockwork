/**
 * Die Hosting-Header gegen die Wahrheit im Code.
 *
 * `vercel.json` ist eine Handabschrift: Die CSP steht dort als Zeichenkette,
 * gebaut wird sie aber in `scripts/csp.ts`. Genau solche Doppelungen laufen
 * auseinander — und zwar unbemerkt, denn eine zu lasche Policy macht nichts
 * kaputt, sie verhindert nur nichts mehr. Deshalb dieser Test.
 *
 * Geprüft wird die Abschrift, nicht der laufende Server: Ob Vercel die Header
 * dann auch ausliefert, sieht man erst am Deploy — mit `curl -I` gegen die
 * Adresse, so wie im README beschrieben.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { contentSecurityPolicy, contentSecurityPolicyHeader } from './csp';

interface HeaderRule {
  readonly source: string;
  readonly headers: readonly { readonly key: string; readonly value: string }[];
}

interface VercelConfig {
  readonly outputDirectory?: string;
  readonly buildCommand?: string;
  readonly headers?: readonly HeaderRule[];
}

const config = JSON.parse(
  await readFile(fileURLToPath(new URL('../vercel.json', import.meta.url)), 'utf8'),
) as VercelConfig;

const rules = config.headers ?? [];

/** Der Wert eines Headers in der Regel, die auf `source` passt. */
function headerFor(source: string, key: string): string | undefined {
  return rules.find((rule) => rule.source === source)?.headers.find((h) => h.key === key)?.value;
}

describe('vercel.json', () => {
  it('baut aus demselben dist/ wie der lokale Befehl', () => {
    expect(config.outputDirectory).toBe('dist');
    expect(config.buildCommand).toBe('npm run build');
  });

  it('schickt die CSP als echten Header — wortgleich mit dem Meta-Tag', () => {
    expect(headerFor('/(.*)', 'Content-Security-Policy')).toBe(contentSecurityPolicyHeader());
  });

  it('enthält die Meta-Policy vollständig', () => {
    // Browser wenden Meta und Header beide an und bilden die Schnittmenge. Eine
    // Direktive, die nur im Meta-Tag steht, wäre also nicht etwa strenger,
    // sondern schlicht eine zweite Regel, die niemand mehr überblickt.
    const header = headerFor('/(.*)', 'Content-Security-Policy') ?? '';
    for (const directive of contentSecurityPolicy(false).split('; ')) {
      expect(header, directive).toContain(directive);
    }
  });

  it('verbietet das Einbetten in fremde Seiten', () => {
    // Nur als Header wirksam, deshalb steht das hier und nicht im Meta-Tag.
    expect(headerFor('/(.*)', 'Content-Security-Policy')).toContain("frame-ancestors 'none'");
  });

  it('erzwingt HTTPS für mindestens ein Jahr', () => {
    const hsts = headerFor('/(.*)', 'Strict-Transport-Security') ?? '';
    const maxAge = Number(/max-age=(\d+)/.exec(hsts)?.[1] ?? 0);
    expect(maxAge).toBeGreaterThanOrEqual(31_536_000);
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });

  it('setzt die übrigen Schutzheader', () => {
    expect(headerFor('/(.*)', 'X-Content-Type-Options')).toBe('nosniff');
    expect(headerFor('/(.*)', 'Referrer-Policy')).toBe('no-referrer');
  });

  it('erlaubt die Kamera nur sich selbst und sonst nichts', () => {
    // Der QR-Sucher braucht sie. Alles andere ist abgeschaltet, damit ein
    // eingeschleustes Skript gar nicht erst danach fragen kann.
    const policy = headerFor('/(.*)', 'Permissions-Policy') ?? '';
    expect(policy).toContain('camera=(self)');
    for (const feature of ['microphone', 'geolocation', 'payment', 'usb', 'display-capture']) {
      expect(policy, feature).toContain(`${feature}=()`);
    }
  });

  it('gibt kein Analytics und keine fremde Quelle frei', () => {
    // Die Zusage „null externe Requests" gilt auch gehostet.
    const raw = JSON.stringify(config);
    expect(raw).not.toMatch(/analytics|speed-insights|vitals/i);
    expect(headerFor('/(.*)', 'Content-Security-Policy')).not.toMatch(/https?:\/\//);
  });

  describe('Caching', () => {
    it('lässt gehashte Dateien ewig im Cache', () => {
      const value = headerFor('/assets/(.*)', 'Cache-Control') ?? '';
      expect(value).toContain('immutable');
      expect(value).toContain('max-age=31536000');
    });

    it('lässt alles, was ein Update ankündigt, jedes Mal nachfragen', () => {
      // Wird eine dieser Dateien lange gecacht, bleibt eine installierte PWA
      // auf ihrem alten Stand stehen — genau der Fehler, den ein Service
      // Worker so gut versteckt.
      for (const source of [
        '/',
        '/(.*).html',
        '/sw.js',
        '/registerSW.js',
        '/manifest.webmanifest',
      ]) {
        expect(headerFor(source, 'Cache-Control'), source).toBe(
          'public, max-age=0, must-revalidate',
        );
      }
    });
  });
});
