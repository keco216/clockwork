# Clockwork — Branding

**Name:** Clockwork · Untertitel: „TOTP Authenticator“
**Begründung:** „Runs like clockwork“ — Präzision und Verlässlichkeit, passt
exakt zur Präzisionsinstrument-Art-Direction. Im Authenticator-/2FA-Umfeld
wurde bei der Websuche (Stand 08/2026) keine App dieses Namens gefunden.

**Palette (verbindlich, genau ein Akzent):**

| Rolle  | Hex       |
| ------ | --------- |
| Tinte  | `#171614` |
| Papier | `#F5F3EF` |
| Nacht  | `#131210` |
| Signal | `#F05A28` |

**Markensystem — alle drei Zeichen im Einsatz** (`logo-preview.html` zeigt
alle in hell/dunkel plus App-Icon-Ableitungen). Die drei teilen dieselbe
Formsprache (Ticks, genau ein Signal-Punkt, gleiche Strichlogik) und bilden
zusammen EIN System mit klaren Rollen:

- **A — Skala** (`clockwork-logo-a-skala.svg`): 30 Ticks = 30 Sekunden,
  Signal-Tick auf 12 Uhr. **Rolle: das Emblem.** Grundlage der
  Countdown-Anzeige in der App, für leere Zustände, Ladezustände und große
  Markenmomente — Marke und Instrument sind dasselbe Element.
- **B — C-Werk** (`clockwork-logo-b-cwerk.svg`): schweres C als Werkbrücke
  mit Hemmungszähnen, orangenes Lager im Maul. **Rolle: App-Icon, Favicon
  und Monogramm** — am kleinsten am stärksten.
- **C — Wortmarke** (`clockwork-logo-c-wortmarke.svg`): reine Typografie,
  beide O als Zifferblätter, Signal-Index auf dem ersten O. **Rolle: die
  Marke im App-Header, im README und überall, wo der Name steht.**

Die Wortmarken nutzen Liberation Sans als **Platzhalter**; in der App ist die
Wortmarke in der UI-Schrift neu gesetzt, mit den O-Zifferblättern und dem
Signal-Index aus der Vorlage.

## Umsetzung in der App

- **C — Wortmarke** steht im App-Kopf. Die Ringe sind echte Elemente in CSS,
  kein Bild: Sie skalieren mit der Schriftgröße. Ringstärke 0,131 des
  Durchmessers, wie in der Vorlage.
- **A — Skala** ist die Countdown-Anzeige neben jedem Code und füllt den
  Leerzustand. Dieselbe Geometrie, nur mit drehendem Zeiger; die Proportionen
  stehen als Tokens in `src/styles/tokens.css`, gezeichnet wird in
  `src/ui/gauge.ts`. Dasselbe Emblem trägt das Vorschaubild
  (`scripts/og-image.mjs`).
- **B — C-Werk** ist App-Icon und Favicon, erzeugt in `scripts/icons.mjs`.
  Beide vom Handbuch geforderten Gründe wurden gebaut und verglichen;
  `public/icon-alt-signal.png` ist die verworfene Variante auf Signal-Orange.
  Gewählt ist Nacht — auf orangem Grund verschwindet das Lager, der einzige
  Signalpunkt der Marke, in der Fläche.

Nichts weichgezeichnet: butt caps, präzise Geometrie, genau ein Akzent.
