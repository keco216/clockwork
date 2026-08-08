# V8 — Abstands-Feinpass: was ersetzt wurde

Kein Redesign. Farben, Komponenten und Struktur von V8 stehen unverändert; hier
ging es um Rhythmus und Ausrichtung. `src/lib/` unangetastet, 514 Tests grün.

Alle Zahlen sind am laufenden Dokument gemessen (1450 px, dunkel, deutsch), nicht
aus den Tokens gerechnet. Die Rasterbilder je Panel liegen unter
[`v8-vergleich/`](v8-vergleich/); erzeugen lassen sie sich mit

```bash
node scripts/shoot-grid.mjs vorher     # vor der Änderung
node scripts/shoot-grid.mjs nachher    # danach
```

## Die Skala

Erlaubt sind acht Sprossen: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64**.

Der Befund vorweg, weil er ehrlicher ist als die Erwartung: In den Stylesheets
stand **kein einziger Abstand neben der Skala**. Alle Werte kamen schon vor dem
Feinpass aus `--sp-*`. Was fehlte, war etwas anderes — und das ist der eigentliche
Inhalt dieses Passes.

Drei Werte lagen trotzdem daneben, und zwar an Stellen, an denen man sie nicht
sucht:

| Wo                        | Vorher                | Nachher                           | Warum                                                                                        |
| ------------------------- | --------------------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| `--scroll-anchor`         | `5.5rem` = **88 px**  | `calc(var(--sp-8) + var(--sp-5))` | 88 liegt auf keiner Sprosse. Derselbe Betrag, aber als Summe zweier Sprossen nachvollziehbar |
| `.pick` padding-block     | `0.2rem` = **3,2 px** | `0`                               | Ein Wert auf keiner Skala, und die Höhe kam ohnehin aus `min-height`                         |
| `.viewfinder__mark` inset | **18 px** ×8          | `var(--sp-4)` = 16                | Die Zahl stammte aus der Markengröße, nicht aus dem Raster                                   |
| `.chip` Höhe              | **26 px**             | 24 px                             | Der 1-px-Rahmen kam zur Zeilenhöhe dazu; jetzt ein Innenschatten, der keinen Platz belegt    |

Dazu drei Ausnahmen, die bleiben. Alle drei hängen an einer **Schriftgröße** und
nicht am Raster, stehen deshalb in `em` und liegen zwangsläufig zwischen den
Sprossen: der −1-px-Trick von `.sr-only`, der Sperrungsausgleich am Ring der
Wortmarke, und das Einheitszeichen neben der Sekundenzahl. Sie stehen mit
Begründung in `scripts/check-tokens.mjs`.

## Semantische Abstände: je ein Wert überall gleich

Das war der eigentliche Fehler. Jeder Wert lag auf der Skala, jeder war für sich
begründbar — und zusammen ergaben sie keinen Takt. Der **Stapelabstand in einem
Panel** stand an vier Stellen in drei Werten:

| Stelle          | Vorher    | Nachher             |
| --------------- | --------- | ------------------- |
| `.zone__body`   | **16 px** | 16 px `--gap-stack` |
| `.vault`        | **12 px** | 16 px `--gap-stack` |
| `.vault__panel` | **12 px** | 16 px `--gap-stack` |
| `.vault__intro` | **8 px**  | 8 px `--gap-pair`   |

Ein Rhythmus entsteht nicht daraus, dass jeder Abstand erlaubt ist, sondern
daraus, dass gleiche Dinge gleich weit auseinanderstehen. Seit dem Feinpass gibt
es dafür drei Token nach ROLLE, nicht nach Ort:

```
--gap-pair    8 px   was zusammengehört: Beschriftung und ihr Feld, Feld und
                     Knopf, Tasten in einer Zeile, die Zeilen einer Karte,
                     Sektionsgravur über ihrem Panel
--gap-stack  16 px   Geschwister in einem Panel
--gap-group  24 px   zwischen Panels — und der Innenabstand eines Panels, denn
                     der Rand zum Gehäuse ist derselbe Abstand wie der zum
                     Nachbarn
```

`--panel-pad` und `--device-pad` sind jetzt aus `--gap-group` abgeleitet statt
zufällig gleich groß.

### Der Ist-Zustand, nachgemessen

| Rolle                                                                   | Gemessen                |
| ----------------------------------------------------------------------- | ----------------------- |
| Panel-Innenabstand, alle vier Seiten                                    | `24 24 24 24`           |
| Sektionslabel → Panel (Eingabe/Tresor/Codes)                            | `8 / 8 / 8` — identisch |
| Stapel (`.zone__body`, `.vault`, `.vault__panel`)                       | `16 / 16 / 16`          |
| Paar (`.slot`, `.vault__form`, `.vault__row`, `.keys`, `.vault__intro`) | `8` durchgehend         |
| Gruppe (`.rail`, Shell-Raster)                                          | `24 / 24`               |

### Weitere ersetzte Werte

| Stelle                              | Vorher  | Nachher | Grund                                                                                                  |
| ----------------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `.vault__panel` padding-block-start | 12      | 8       | Mit dem Innenabstand der Statuszeile darüber ergibt das eine Stapelfuge                                |
| `.stage__filter` padding-bottom     | 12      | 8       | Mit der Stapelfuge ergab 12 einen Abstand von 28 zum ersten Kanalzug — jetzt 24, also eine Gruppenfuge |
| `.viewfinder__bar` gap              | 12      | 8       | Ein Hinweis und ein Knopf in einer Zeile sind ein Paar                                                 |
| `.colophon__specs` gap und Trenner  | 12 / 12 | 8 / 8   | Derselbe Trenner wie in der Metazeile der Karte                                                        |
| `.strip__head` column-gap           | 12      | 8       | Kontoname und Chip sind ein Paar                                                                       |

## Ausrichtung: was vorher nicht auf einer Linie lag

| Was                                        | Vorher                                                  | Nachher                     |
| ------------------------------------------ | ------------------------------------------------------- | --------------------------- |
| Karte: Zifferblatt / Code / Kopieren-Knopf | 219 / 223,5 / 219 — **4,5 px auseinander**              | 237 / 237 / 237 — **0**     |
| Chip gegen Kontoname, Grundlinie           | **5,75 px** auseinander                                 | **0**                       |
| Seitenkopf: Wortmarke / Marke / Zustand    | 60 / 67 / 68 — Spanne **8 px**                          | 67 / 67 / 67 — Spanne **0** |
| Tastengruppe: senkrecht / waagerecht       | **16 / 8**                                              | **8 / 8**                   |
| Trenner der „folgt"-Zeile                  | 8 vor, 8 + ein Leerzeichen aus dem HTML-Einzug dahinter | 8 / 8                       |
| Karte: Innenabstand links / rechts         | 12 / 12                                                 | 12 / 12 (war schon richtig) |

Drei dieser Befunde hatten eine gemeinsame Ursache, und sie ist lehrreich:

**Ein Flexkasten mit `align-items: center` hat keine Schrift-Grundlinie.** Der
Browser setzt dafür eine Ersatzlinie an die Unterkante des Kastens. Wortmarke,
Statuszeile im Kopf und Chip waren alle drei solche Kästen — und alle drei wurden
von einem Elternteil über `align-items: baseline` ausgerichtet. Das CSS legte sie
also auf eine Linie, die es in den Zeichen nicht gibt.

Die Lösung ist in allen drei Fällen dieselbe und macht das CSS kürzer, nicht
länger: gewöhnlicher Inline-Text statt eines Flexkastens. Die Ringe der Wortmarke
brauchen ihn nicht — ein `inline-block` sitzt von sich aus mit der Unterkante auf
der Grundlinie und reicht bei 0,7 em genau bis zur Versalhöhe, also in genau die
Stellung, die der Flexkasten mühsam nachgebaut hat.

Bei der **Karte** war es die dritte Zeile: Zifferblatt und Kopiertaste liefen über
alle drei Zeilen und waren darin zentriert — also auf der Mitte von Kopfzeile,
Code und Metazeile zusammen. Die drei Zeilen sind aber nicht symmetrisch
(28,5 + 8 über dem Code, 8 + 21 darunter), und damit lag der Code 4,5 px unter der
Achse der beiden anderen. Jetzt stehen alle drei in der Code-Zeile, die so hoch
wird wie ihr größtes Element — kein Ausgleichswert, den man beim nächsten
Schriftwechsel nachrechnen müsste.

## Tote Fugen: was Platz gekostet hat, ohne etwas zu sein

Ein Kind der Höhe 0 ist immer noch ein Kind, und `gap` fällt vor ihm an. Drei
Stellen, alle unterhalb des letzten Bedienelements ihres Panels — also genau dort,
wo eine Lücke wie ein Fehler aussieht:

| Was                                          | Kostete      | Nachher                                       |
| -------------------------------------------- | ------------ | --------------------------------------------- |
| `#vault-actions` mit drei versteckten Tasten | **12 px**    | Hülle wird mitversteckt (`ui/vault-panel.ts`) |
| Leere Tresor-Fehlerzeile                     | **8 px**     | Verlässt den Fluss, bleibt im Baum            |
| Leere Import-Rückmeldung                     | **16 px**    | Ebenso                                        |
| Erzwungener Umbruch in der Tastenzeile       | 8 px doppelt | Der Platzhalter trägt die Fuge selbst         |

Die beiden Meldungsfelder sind Live-Regionen (`role="status"` bzw. `role="alert"`).
`display: none` wäre der naheliegende Griff und der falsche: Eine Live-Region muss
DA sein, bevor Text hineinkommt, sonst meldet ein Screenreader die Änderung nicht
zuverlässig. Sie verlassen deshalb den **Fluss** und nicht den **Baum** — dasselbe
Verfahren wie bei `.sr-only`.

## Höhen: die Leiter hält jetzt wirklich

| Bauteil             | Vorher                  | Nachher | Sprosse |
| ------------------- | ----------------------- | ------- | ------- |
| Tresor-Passwortfeld | **51,5 px**             | 40 px   | md      |
| Filterfeld          | ~51 px                  | 40 px   | md      |
| Tasten              | 40 px                   | 40 px   | md      |
| Auswahlfeld         | 36 px                   | 32 px   | sm      |
| Tresor-Statuszeile  | **52 px** (zwei Zeilen) | 44 px   | touch   |
| Aufklapper          | 44 px                   | 44 px   | touch   |
| Chips               | **26 px**               | 24 px   | chip    |

Das Passwortfeld ist der interessante Fall, weil er **zum dritten Mal** dieselbe
Falle war: `.field` (in `src/style.css`) und `.vault__pass` (in
`styles/panels.css`) haben dieselbe Spezifität, und `@import`-Regeln stehen immer
VOR den eigenen Regeln der importierenden Datei. Also gewann `.field` — mit
`padding: 12px` und `line-height: 1.7`. Zwei der drei Zeilen im Passwortfeld haben
seit V5 nie gewirkt, und der Kommentar daneben behauptete drei Versionen lang,
Feld und Knopf hätten dieselbe Höhe, „weil beide dieselbe Höhe HABEN". Sie hatten
sie nicht. Behoben mit der doppelten Klasse `.field.vault__pass`, wie schon bei
`.key.key--danger`.

## Was NICHT geändert wurde, obwohl es danach aussah

- **„1 Konto"** ist in Ordnung. Der Zähler enthält ein gewöhnliches Leerzeichen
  (Codepoint 32) — nachgeprüft am gerenderten Text und zusätzlich in allen 37
  Locale-Dateien: An keiner Stelle klebt `{n}` an seinem Wort. Was im Bild eng
  aussieht, ist die schmale Wortlücke der Oberflächenschrift bei 12 px.
- **Der Hinweistext im Eingabe-Panel** ist nicht falsch eingerückt. Er beginnt wie
  Beschriftung, Feld, Chip und Tasten bei 74 px — gemessen, nicht geschätzt.
- **Der Innenabstand der Karte** war schon links = rechts (12 / 12).
- **Die Spaltenfuge des Zweispalters** bleibt 32 px. Sie trennt zwei
  Kartenspalten und nicht zwei Geschwister; 32 liegt auf der Skala.

## Prüfungen, die das festhalten

Drei sind neu, und jede hat in diesem Pass mindestens einen Fehler gefunden:

| Prüfung                         | Wo                  | Fängt                                                                                                |
| ------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `node scripts/check-tokens.mjs` | Quelltext           | Ein Bauteil, das eigene Abstände, Farben oder Radien setzt                                           |
| `checkSpacingScale`             | `scripts/shoot.mjs` | Einen gerechneten Abstand neben der Skala — auch einen, der aus zwei richtigen Tokens entstanden ist |
| `checkControlHeights`           | `scripts/shoot.mjs` | Ein Bedienelement neben der Höhenleiter                                                              |
| `checkNoDeadGaps`               | `scripts/shoot.mjs` | Einen leeren Kasten, der eine Fuge frisst                                                            |

Die Quelltextprüfung und die Messung im Browser sind nicht redundant: Die erste
verlangt, dass ein Wert aus einem Token kommt; die zweite, dass am Ende auch das
Richtige dasteht. `--scroll-anchor` war ein Token und lag daneben. Der Chip kam
aus Tokens und wurde 26 px hoch.

Dazu unverändert: `node scripts/check-contrast.mjs` (92 Paare, 2 Selbsttests),
`node scripts/check-bundle.mjs`, `npm run shots` und `npm test`.
