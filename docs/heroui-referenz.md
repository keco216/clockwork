# V9 — Referenzlage HeroUI und was daraus übernommen wird

Referenz ist [heroui.com](https://heroui.com) — seit v3 „Beautiful, accessible
React UI components built on React Aria and Tailwind CSS v4". Übernommen werden
**Werte und Optik**, nachgebaut in Vanilla-CSS. Kein React, kein Tailwind, keine
Abhängigkeit.

## Zur Quellenlage, ehrlich

Die Doku-Seiten unter `heroui.com/docs/react/components/*` (Button, TextArea,
Card, Chip, Switch, Select, InputOTP, Disclosure) und die Theming-Doku sind
gelesen — sie liefern Anatomie, Varianten und Zustandsattribute, aber **fast
keine Zahlen**. Die Zahlen stehen im Paket:

```bash
npm pack @heroui/styles          # 3.2.4, in ein Wegwerf-Verzeichnis
# dist/themes/default/variables.css  → alle Farb- und Basistoken
# dist/themes/shared/theme.css       → Radius-Leiter, Kurven
# dist/components/*.css              → echtes CSS je Komponente
```

Das ist eine **bessere** Quelle als bei V8: kein Tailwind-Klassenraten, sondern
ausgeliefertes CSS mit Literalwerten. Beide Pakete sind nicht installiert und
stehen in keiner `package.json`. Die oklch-Werte sind mit den
Standardformeln (Ottosson) nach sRGB-Hex gerechnet; die Formeln liegen im
Arbeitsverzeichnis der Sitzung, jede Zahl unten ist damit nachgerechnet.

**Wortschatz-Brücke:** Der Auftrag spricht das v2-Vokabular (`solid`, `flat`,
`content1`), heroui.com liefert seit v3 andere Namen. Die Abbildung, einmal
festgehalten:

| Auftrag (v2)      | heroui.com heute (v3)                             |
| ----------------- | ------------------------------------------------- |
| `content1`-Fläche | `--surface`                                       |
| solid primary     | Button `primary` (`--accent`)                     |
| solid default     | Button `tertiary` (`--default`, neutrale Füllung) |
| flat („Leeren")   | Button `ghost` (durchsichtig, Hover `--default`)  |
| Chip „getönt"     | Chip `soft` (`*-soft`-Tönungen)                   |
| bordered          | Button `outline` — **kommt in V9 nicht vor**      |

Die v2-Werte von V8 (`@heroui/theme@2.4.26`: Höhen 32/40/48, Radien 8/12/14)
bleiben als Vorgeschichte in [`v8-referenzen.md`](v8-referenzen.md) dokumentiert;
maßgeblich für V9 ist v3.

## Flächen — das Herz des Restyles

v3 kennt keine sichtbaren Panel-Kanten mehr: **Eine Karte ist eine Fläche auf
einem Grund**, hell getrennt durch einen Schatten, dunkel allein durch
Helligkeit (`--surface-shadow` ist dort ausdrücklich `transparent`).

| Token (v3)            | Hell (oklch → Hex)                | Dunkel (oklch → Hex)               |
| --------------------- | --------------------------------- | ---------------------------------- |
| `--background`        | `oklch(.9702 0 0)` → `#f5f5f5`    | `oklch(.12 .005 286)` → `#060607`  |
| `--surface`           | `--white` → `#ffffff`             | `--eclipse` → `#18181b`            |
| `--surface-secondary` | `#efeff0`                         | `#232325`                          |
| `--surface-tertiary`  | `#eaeaeb`                         | `#262728`                          |
| `--overlay` (Popover) | `#ffffff`                         | `#18181b`                          |
| `--default` (Füllung) | `oklch(.94 .001 286)` → `#ebebec` | `oklch(.274 .006 286)` → `#27272a` |
| `--foreground`        | `--eclipse` → `#18181b`           | `--snow` → `#fcfcfc`               |
| `--muted`             | `#71717a`                         | `#9f9fa9`                          |
| `--border`            | `#dedee0` (nur Outline-Knöpfe)    | `#28282c`                          |
| `--separator`         | `#e4e4e7`                         | `#212124`                          |

Das ist wörtlich der Auftrag: **hell Weiß auf Hellgrau, dunkel `#18181b` auf
Schwarz.** Felder haben eigene Token und sind **flat**:
`--field-border-width: 0px`, `--field-background` = Weiß / `#18181b`. Für
Felder **in** einer Surface sieht v3 die Variante `secondary` vor („without
shadow, suitable for use in Surface components"): Fläche `--default`, kein
Schatten, Hover `--default-hover`. Genau das trifft Clockworks Textarea und
Passphrase — sie liegen in Panels.

Abgeleitete Töne entstehen bei v3 per `color-mix`, nicht als eigene Hex-Werte:

```
--surface-hover  = surface 92 % + foreground 8 %
--default-hover  = default 96 % + default-foreground 4 %
--accent-hover   = accent 90 % + accent-foreground 10 %
--accent-soft    = accent 15 % über transparent (dunkel 12 %)
--accent-soft-fg = accent 70 % + foreground 30 % (dunkel 80/30)
--default-soft   = default 50 % über transparent
```

## Schatten

| Token              | Hell                                                                               | Dunkel                              |
| ------------------ | ---------------------------------------------------------------------------------- | ----------------------------------- |
| `--surface-shadow` | `0 2px 4px rgb(0 0 0/.04), 0 1px 2px rgb(0 0 0/.06), 0 0 1px rgb(0 0 0/.06)`       | **keiner** (`transparent`)          |
| `--overlay-shadow` | `0 2px 8px rgb(0 0 0/.06), 0 -6px 12px rgb(0 0 0/.03), 0 14px 28px rgb(0 0 0/.08)` | `0 0 1px rgb(255 255 255/.3) inset` |
| `--field-shadow`   | wie `--surface-shadow`                                                             | **keiner**                          |

Der dunkle Modus trennt Flächen **nur über Helligkeit** — die einzige Ausnahme
ist die 1-px-Innenlichtkante am Overlay. Das ersetzt Clockworks bisherige
Haarlinien und `--edge-lit`-Kanten auf Panels vollständig.

## Radien

Basis `--radius: 0.5rem`, alles andere als Vielfache:

| Rolle                              | Wert                                |
| ---------------------------------- | ----------------------------------- |
| Felder (`--field-radius`)          | `radius × 1.5` = **12 px**          |
| Karte / Popover                    | `min(32px, radius × 3)` = **24 px** |
| Listbox-Eintrag, Chip (`2xl`)      | **16 px**                           |
| Knöpfe (`rounded-3xl` auf ≤ 44 px) | 24 px ⇒ wirkt als **Pille**         |
| Switch-Track (`xl` auf 20 px Höhe) | 12 px ⇒ wirkt als Pille             |

## Fokus-Ring

`--focus: var(--accent)`, Ring **2 px**, Versatzfarbe = `--background`:

- **Knöpfe, Switch, Trigger:** Versatz **2 px** (`--ring-offset-width`).
- **Felder (Input, Textarea, OTP-Zelle):** Versatz **0 px** — der Ring sitzt
  direkt auf der Feldkante.
- Invalid: 1-px-Outline in Danger, im Fokus 2-px-Ring in Danger.

`--disabled-opacity: 0.5`, dazu `pointer-events: none`.

## Höhen (v3 ist responsiv: Touch zuerst, ab `md` kleiner)

| Bauteil             | Mobil                             | Desktop (`≥ 768px`) |
| ------------------- | --------------------------------- | ------------------- |
| Button `sm`         | 36 px                             | 32 px               |
| Button `md` (Basis) | 40 px                             | 36 px               |
| Button `lg`         | 44 px                             | 40 px               |
| Select-Trigger      | min 36 px                         | min 36 px           |
| Textarea            | min 38 px, `rows` 3, `px-3 py-2`  | dito                |
| OTP-Zelle           | **40 × 38 px**                    | dito                |
| Listbox-Eintrag     | min 36 px                         | dito                |
| Chip `md`           | **24 px** (20 px Zeile + 2×2 px)  | dito                |
| Switch-Track `md`   | **40 × 20 px**, Daumen 22 × 16 px | dito                |

## Typografie

Inter (die Hausschrift von heroui.com), Tailwind-Stufen:

| Stufe  | Größe / Zeile | Verwendung                                          |
| ------ | ------------- | --------------------------------------------------- |
| `xs`   | 12 px / 20    | Description, Chip                                   |
| `sm`   | 14 px / 20–24 | Button, Label, Card-Titel, Listbox                  |
| `base` | 16 px / 24    | Feldtext mobil (ab `sm:` 14 px), Switch-Label       |
| `lg`   | 18 px / 24    | OTP-Zellenwert (`font-semibold`, Tracking −0,27 px) |

Gewichte: Label/Buttons/Titel **500** (`font-medium`), OTP-Wert und
Überschriften **600** (`font-semibold`, `tracking-tight`). Card-Titel
`text-sm/leading-6 font-medium`, Card-Description `text-sm/leading-5` in
`--muted`.

## Bewegung

| Was                  | Wert                                                    |
| -------------------- | ------------------------------------------------------- |
| Button-Press         | `scale(.97)` (`sm` .98, `lg` .96), transform 250 ms     |
| Button-Farbe         | 100 ms                                                  |
| Feld-Farben/Schatten | 150 ms                                                  |
| Popover auf          | 150 ms, Fade + `zoom .95` + 4 px Slide aus der Richtung |
| Popover zu           | 100 ms, Fade + `zoom .95`                               |
| Switch-Daumen        | `margin 300ms var(--ease-out-fluid)`                    |
| Disclosure-Inhalt    | `height 200ms ease-out-quad, opacity 200ms`             |
| Disclosure-Chevron   | `rotate 180°`, 250 ms                                   |
| OTP-Ziffer erscheint | 250 ms, `translateY(8px) scale(.8) → 1`, Fuß unten      |
| `--ease-out-fluid`   | `cubic-bezier(0.32, 0.72, 0, 1)`                        |

`--ease-out-fluid` ist **Zeichen für Zeichen Clockworks `--ease-spring`** aus
V5 — die Federkurve bleibt also nicht trotz, sondern wegen der Referenz.
`motion-reduce` schaltet bei v3 jede dieser Bewegungen ab; Clockwork macht das
seit V2 genauso.

## Die Komponenten im Einzelnen

**Button.** Pille, `px-4`, `text-sm font-medium`, Farben als Token-Paar je
Variante: `primary` = `--accent`/`--accent-foreground`, `tertiary` =
`--default`/`--default-foreground`, `ghost` = durchsichtig mit Hover
`--default`, `danger-soft` = rote 15-%-Tönung. Hover tauscht nur die Fläche
(`*-hover`), Press zusätzlich `scale(.97)`.

**TextArea / Input.** `rounded-field`, `px-3 py-2`, kein Rahmen, Platzhalter in
`--field-placeholder` (= `--muted`). In Panels Variante `secondary`: Fläche
`--default`, Hover `--default-hover`, Fokus-Ring ohne Versatz, Fläche bleibt.

**Card.** `p-4`, `gap-3`, Radius 24 px, `bg-surface`, `--surface-shadow`,
**kein Rahmen**. Titelzeile `text-sm font-medium`, Description `--muted`.

**Chip.** `rounded-2xl`, `px-2 py-0.5`, `text-xs font-medium`, 24 px hoch.
Getönt heißt `soft`: Fläche `accent 15 %`, Schrift `accent 70 % + foreground
30 %`. Neutral: `default 50 %` mit `--default-foreground`.

**Switch.** Track 40 × 20 px in `--default`, checked `--accent`; Daumen
22 × 16 px in Weiß mit Feldschatten, Weg als `margin-inline-start` von 2 px auf
`calc(100% − 24px)`, 300 ms Federkurve. Label `font-medium`, Description in
`--muted` unter der Zeile, eingerückt um Trackbreite + 12 px.

**Select.** Trigger = flat Feld (min 36 px, `rounded-field`, `pe-7` für den
Chevron, der bei offen 180° dreht). Popover: `--overlay`, Radius 24 px,
`--overlay-shadow`, Listbox `p-1.5`; Eintrag min 36 px, `rounded-2xl`,
`px-2.5`, Hover `--default`, Auswahl-Häkchen am Ende (10 px, animierter
Strich), Press `scale(.98)`.

**InputOTP.** Zellen **einzeln**, je 40 × 38 px, `rounded-field`, Feldfläche
mit Feldschatten, **8 px Fuge** (`gap-2`), aktive Zelle Feld-Ring + `z-10`,
gefüllte Zelle `--field-focus`, Wert `text-lg font-semibold`, blinkende Caret
2 × 16 px, Trenner 6 × 2 px in `--separator`.

**Disclosure.** Trigger ist ein Button (`ghost`, volle Breite,
`justify-between`), Chevron `size-4` mit 180°-Drehung, Inhalt animiert
`height` + `opacity` über 200 ms, Körper `p-2`.

**Label / Description.** `text-sm font-medium` auf `--foreground` bzw.
`text-xs` auf `--muted` — die Formular-Hierarchie aus dem Auftrag.

## Was übernommen wird — und die drei gemessenen Abweichungen

Übernommen: die komplette Flächenlogik (borderless + Schatten hell / Helligkeit
dunkel), alle Hex-Werte oben, Radien, Höhen, Fokus-Ring-System, Soft-Chips,
Switch-Geometrie, Popover-Bewegung, Feld-Flat-Stil, Typo-Stufen und -Gewichte.

1. **`--accent` ist Signal-Orange `#F05A28`,** nicht HeroUIs Blau
   (`oklch(.6204 .195 253.83)`). Das ist der Auftrag: ein HeroUI-Theme mit
   Orange als Primary — genau der Weg, den die Theming-Doku selbst vorführt
   („Customizing Accent Colors").
2. **`--accent-foreground` ist Eclipse, nicht Snow.** Gemessen: Weiß auf
   `#F05A28` = **3,39:1** — reißt AA für 14-px-Schrift. Eclipse `#18181b` auf
   `#F05A28` = **5,23:1** — hält. HeroUI kennt dieses Muster selbst: Warning
   (Amber) trägt `--warning-foreground: var(--eclipse)`. Der Markenwert bleibt
   dadurch unangetastet auf der Fläche stehen.
3. **Danger bleibt `--fault`,** Clockworks aus dem Signal abgeleiteter
   Fehlerton, nicht HeroUIs Rot-Grün-Gelb-Familie. Genau ein Akzent gilt
   weiter; der „Alles löschen"-Knopf bekommt das `danger-soft`-**Muster**
   (15-%-Tönung + tiefe Textmischung) mit Clockworks Farbe.

Dazu bleibt **Chivo Mono für die Codes**: Ein TOTP-Code wird abgetippt und
braucht dicktengleiche Ziffern; v3 setzt im OTP-Wert nur deshalb keine Mono,
weil seine Zellen je genau ein Zeichen tragen. Für Variante B übernimmt V9
Geometrie und Bewegung der Zellen, für den Wert die Dickengleichheit.
