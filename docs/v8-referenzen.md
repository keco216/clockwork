# V8 — Referenzlage HeroUI und was daraus übernommen wurde

Referenzquelle ist [HeroUI](https://v2.heroui.com) (React/Tailwind). Übernommen
wird **das System**: Werte, Abstände, Höhenleiter, Zustandslogik — nachgebaut in
Vanilla-CSS. **Kein Code**, keine Abhängigkeit, kein Tailwind, kein React.

## Zur Quellenlage, ehrlich

Die Doku-Seiten `customization/theme` und `customization/colors` nennen die
Zahlen **nicht**: Die Farbfelder werden clientseitig aus CSS-Variablen gerendert,
im ausgelieferten Text stehen nur die Namen. Beide Seiten habe ich abgerufen und
nichts Verwertbares bekommen.

Gelesen ist deshalb das Paket selbst — der Weg, den `PROMPT-V8.md` als Rückfall
nennt:

```bash
npm pack @heroui/theme          # 2.4.26, in ein Wegwerf-Verzeichnis
node -e "require('./package/dist/colors/semantic.js')"
node -e "require('./package/dist/default-layout.js')"
```

Das Paket ist **nicht** installiert und steht in keiner `package.json`. Alle
Zahlen unten sind aus `@heroui/theme@2.4.26` ausgelesen, nicht aus einem Blogpost
abgeschrieben.

## Was der Auftrag erwartet hat — und was wirklich dasteht

`PROMPT-V8.md` nennt Größenordnungen und sagt „verifizieren, nicht glauben". Das
war berechtigt: zwei davon stimmen nicht.

| Erwartung im Auftrag              | Tatsächlich                                    | Urteil                     |
| --------------------------------- | ---------------------------------------------- | -------------------------- |
| background „nahe Schwarz"         | `#000000` dunkel, `#FFFFFF` hell               | **falsch — pures Schwarz** |
| content1 ≈ `#18181b`              | `#18181b`                                      | genau                      |
| content2 ≈ `#27272a`              | `#27272a`                                      | genau                      |
| content3 ≈ `#3f3f46`              | `#3f3f46`                                      | genau                      |
| Divider ≈ `rgba(255,255,255,.15)` | dunkel genau so; **hell `rgba(17,17,17,.15)`** | hell **nicht** Schwarz     |
| Radius 8/12/14 px                 | `small 8` · `medium 12` · `large 14`           | genau                      |
| Border 1/2/3 px                   | `small 1` · `medium 2` · `large 3`             | genau                      |
| Fokus-Ring 2 px mit Offset        | `outline-2` + `outline-offset-2`               | genau                      |

Dazu, was der Auftrag nicht nannte: `content4` dunkel `#52525b` / hell `#d4d4d8`,
`dividerWeight: 1px`, `disabledOpacity: .5`, `hoverOpacity` **.9 dunkel / .8
hell** (nicht symmetrisch).

## Die gemessene Flächenleiter — der eigentliche Befund

Die Hex-Werte allein sagen nichts. Interessant ist ihr **Abstand**, und der ist
rechenbar. Alle Werte unten sind WCAG-Kontrastverhältnisse zwischen zwei
benachbarten Flächen:

| HeroUI dunkel                   | Abstand     |
| ------------------------------- | ----------- |
| `#000000` → `content1 #18181b`  | **1,185:1** |
| `content1` → `content2 #27272a` | **1,189:1** |
| `content2` → `content3 #3f3f46` | 1,426:1     |
| `content3` → `content4 #52525b` | 1,351:1     |

| HeroUI hell                     | Abstand |
| ------------------------------- | ------- |
| `#FFFFFF` → `content2 #f4f4f5`  | 1,099:1 |
| `content2` → `content3 #e4e4e7` | 1,154:1 |
| `content3` → `content4 #d4d4d8` | 1,165:1 |

Und derselbe Maßstab an Clockwork V7:

| Clockwork V7                                   | Abstand     | gegen HeroUI    |
| ---------------------------------------------- | ----------- | --------------- |
| hell: Werkbank `#c9c3b6` → Gehäuse `#ded9cf`   | 1,248:1     | **weiter**      |
| hell: Gehäuse → Panel `#f5f3ef`                | 1,269:1     | **weiter**      |
| dunkel: Werkbank `#030302` → Gehäuse `#0a0908` | **1,037:1** | **ein Drittel** |
| dunkel: Gehäuse → Panel `#131210`              | **1,063:1** | **ein Drittel** |

**Das ist die Diagnose in Zahlen.** Der Auftrag sagt „alles versinkt im Nebel"
und meint beide Modi. Gemessen gilt das nur für einen: Im **hellen** Modus sind
die Stufen von Clockwork sogar weiter als bei HeroUI (1,25 und 1,27 gegen 1,10
und 1,15) — dort liegt das Problem nicht an der Leiter, sondern an Textstufen und
Kanten. Im **dunklen** Modus fehlt der Leiter zwei Drittel ihres Wegs.

### Warum die dunkle Leiter nicht einfach zu spreizen ist

Weil die Richtung falsch ist, nicht der Betrag. V7 legt Nacht `#131210` auf die
Panels und leitet Gehäuse und Werkbank **nach unten** daraus ab. Nacht liegt bei
einer relativen Leuchtdichte von 0,0074; **selbst gegen pures Schwarz sind daraus
höchstens 1,15:1** — und dieses eine Zehntel muss sich in V7 auf zwei Stufen
aufteilen. Mehr ist nach unten physikalisch nicht zu holen, egal welche Hex-Werte
man einsetzt.

HeroUI macht es andersherum: Der **Grund** ist der dunkelste Punkt (`#000000`),
und die Flächen steigen von dort auf. Der gesamte Weg `#000000` → `content3`
ist 2,01:1 — also das Vierzehnfache des Spielraums, den V7 sich selbst gelassen
hat.

**Übernommen wird deshalb die Richtung:** Im dunklen Modus wird das PANEL heller
als Nacht, nicht dunkler. Nacht rutscht auf die Ebene, deren Name es ohnehin
trägt — `branding/README-BRANDING.md` nennt Papier und Nacht die
**Gehäuseflächen**, und das Gehäuse ist genau die Ebene, auf der die Panels
liegen. Das ist keine Abweichung vom Markenhandbuch, sondern eine wörtlichere
Lesart als die von V7.

Im hellen Modus bleibt alles, wie es ist: Dort ist Papier schon der hellste
Punkt und das Panel schon die oberste Fläche — dieselbe Richtung wie bei HeroUI,
nur von oben gelesen.

## Die übernommenen Techniken

### 1. Flächenleiter statt zweier Töne

**Woher:** `semanticColors.dark.content1…content4`, `background`.

**Prinzip:** Vier benannte Flächenstufen mit Abständen um 1,19:1 im unteren
Bereich, weiter werdend nach oben. Jede Stufe hat eine Rolle, keine ist
Dekoration.

**Warum es hierher passt:** Clockwork hat seit V7 drei Ebenen (Werkbank,
Gehäuse, Panel) und braucht zwei weitere, die es bisher als Sonderfälle löste:
die eingelassene Fläche (Eingabefeld) und den Hover-Ton des Kanalzugs. Beide
griffen auf `--surface-recessed` zurück — dieselbe Farbe für „tiefer" und für
„hervorgehoben", also für das Gegenteil. Mit einer echten Leiter hat jede Rolle
ihren eigenen Wert.

### 2. Kanten auf Divider-Niveau

**Woher:** `divider: rgba(255,255,255,0.15)` dunkel, `rgba(17,17,17,0.15)` hell,
`dividerWeight: 1px`.

**Prinzip:** Eine Kante ist eine halbtransparente Aufhellung bzw. Abdunklung von
15 % auf 1 px — sichtbar, aber ohne eigene Farbe.

**Warum es hierher passt:** Clockwork liegt mit `--rule` bei 18 % hell und 16 %
dunkel und damit bereits auf diesem Niveau. Der Auftrag nennt die Borders „fast
unsichtbar" — die Ursache ist nicht ihre Deckung, sondern die Fläche darunter:
Auf einer Leiter mit 1,04er Stufen hat eine 16-%-Linie nichts, wovon sie
abstechen könnte. Übernommen wird deshalb der Wert (bestätigt, nicht geändert)
und die Konsequenz: Die Kante wird erst mit der Leiter sichtbar.

Neu übernommen wird dagegen die **abgestufte Stärke**: `borderWidth` 1/2/3 px.

### 3. Bordered-Knöpfe tragen 2 px, nicht 1 px

**Woher:** `button.variants.variant.bordered = "border-medium bg-transparent"`,
und `border-medium` ist `borderWidth.medium = 2px`.

**Prinzip:** Ein Umriss-Knopf bekommt die doppelte Kantenstärke einer Fuge.

**Warum es hierher passt:** Genau das ist der Grund, warum Clockwork-Pillen
„blass" wirken (Diagnose Punkt 3). Sie tragen 1 px in derselben Farbe wie eine
Panelfuge — ein Bedienelement, gezeichnet wie eine Trennlinie. 2 px machen aus
dem Umriss ein Objekt, ohne ihm eine Fläche zu geben.

### 4. Drei Knopfvarianten mit fester Höhenleiter

**Woher:** `button.variants.size` — `sm: h-8 px-3 text-tiny rounded-small`,
`md: h-10 px-4 text-small rounded-medium`, `lg: h-12 px-6 text-medium
rounded-large`. Varianten `solid` · `bordered` · `light` (dazu `flat`, `faded`,
`shadow`, `ghost`, die hier nicht gebraucht werden).

**Prinzip:** 32 / 40 / 48 px, und die Innenabstände, Schriftgrade und Radien
wachsen mit — nicht nur die Höhe.

**Warum es hierher passt:** Clockwork kennt genau eine Knopfhöhe (44 px,
`--control-h`) und drückt Rangordnung nur über die Kante aus. „Leeren" wurde
dadurch zum nackten Text — leise, aber nicht mehr als Knopf erkennbar. Drei
Varianten geben Rang, drei Höhen geben Gewicht.

**Abwandlung, die hier zwingend ist:** Die Leiter beginnt bei 32 px, die
Fingerzielgröße der WCAG liegt bei 44. Übernommen wird die Leiter für die
GEOMETRIE, nicht für die Trefferfläche: Ein 32-px-Chip-Knopf behält 44 px
Trefferfläche über ein Pseudo-Element. Dieselbe Trennung, die Clockwork seit V7
für die beiden Aufklapper macht.

### 5. Chips für Metadaten

**Woher:** `chip.variants.size` — `sm: h-6 text-tiny`, `md: h-7 text-small`,
`lg: h-8 text-medium`.

**Prinzip:** Eine abgegrenzte Fläche mit eigener Höhe für eine Angabe, die zu
einem Objekt gehört, aber nicht sein Titel ist.

**Warum es hierher passt:** „SHA-1 · 6 Stellen · 30 s" stand als Streutext in
der Ecke des Kanalzugs, in der leisesten Graustufe, in 11 px. Als Chip ist es
eine Angabe mit Ort und Rahmen statt Kleingedrucktes am Rand. 24 px Höhe passen
unter die 44-px-Zeile, ohne sie zu sprengen.

### 6. Fokus-Ring: 2 px mit 2 px Offset

**Woher:** `focusVisibleClasses` — `outline-2`, `outline-offset-2`,
`outline-focus`.

**Prinzip:** Ein Ring außerhalb der Kante, nicht auf ihr.

**Warum es hierher passt:** Clockwork macht das seit V2 exakt so
(`:focus-visible { outline: 2px solid var(--signal); outline-offset: 2px }`).
Übernommen wird hier nichts — die Referenz **bestätigt** eine bestehende
Entscheidung, und das gehört genauso dokumentiert wie eine Änderung.

Die Fokus-FARBE wird nicht übernommen: HeroUI setzt `#006FEE`. Clockwork hat
genau einen Akzent, und der ist Signal-Orange.

### 7. `hoverOpacity` ist nicht symmetrisch

**Woher:** `lightLayout.hoverOpacity: ".8"`, `darkLayout.hoverOpacity: ".9"`.

**Prinzip:** Im Dunkeln fällt eine Abdunklung weniger auf als im Hellen, also
wird dort weniger abgedunkelt.

**Warum es hierher passt:** Dieselbe Asymmetrie hat Clockwork schon beim Korn
(2,2 % hell, 5 % dunkel) und bei der Erhebung. Es ist die dritte unabhängige
Bestätigung derselben Regel: Ein dunkles Theme ist kein invertiertes helles.

## Was ausdrücklich NICHT übernommen wurde

- **Pures Schwarz und pures Weiß** als Grund. Clockwork ist ein Gerät aus Papier
  und mattem Lack, kein Bildschirm; `#FFFFFF` ist seit V2 verboten und `#000000`
  wäre sein Gegenstück.
- **Die Primärfarbe `#006FEE`** und mit ihr der Fokus-Ring in Blau. Genau ein
  Akzent, und der steht fest.
- **Die semantische Farbfamilie** `success #17c964` / `warning #f5a524` /
  `danger #f31260`. Vier Statusfarben sind vier Akzente. Clockwork hat für
  Fehler `--fault`, abgeleitet aus dem Signal-Ton, und sonst nichts.
- **Radius `large` 14 px.** Clockwork hat `--radius-panel` 18 px, und die
  Gehäusegruppe ist ein größeres Bauteil als eine HeroUI-Card. Die beiden
  kleineren Radien (8 und 12) sind ohnehin schon identisch — die Leiter stimmt,
  nur ihr oberes Ende gehört diesem Gerät.
- **`shadow`-Variante für Knöpfe.** Ein Schatten in Akzentfarbe ist ein Glow,
  und der ist seit V2 gebannt.
- **Die vier `content`-Namen.** Übernommen wird die Leiter, nicht ihre
  Benennung: `--case`, `--surface`, `--surface-recessed` sagen, was die Fläche
  IST. `content2` sagt nur, dass es eine zweite gibt.
