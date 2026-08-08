# V8 — Rasterbilder zum Abstands-Feinpass

Vier Panels, je vorher und nachher, mit einem 8-px-Raster darüber. Das Raster
hängt am Panel und nicht am Fenster: Interessant ist, wie der Inhalt zu seinem
Panel steht, nicht wie das Panel zum Bildschirm. Jede achte Linie ist kräftiger,
also alle 64 px — ohne diese Betonung zählt man auf einem Bild mit vierzig Linien
nicht mehr mit, und das Zählen ist der Zweck.

Aufgenommen bei 1450 px, dunkel, deutsch, mit
`node scripts/shoot-grid.mjs <vorher|nachher>`. Was hier ersetzt wurde und mit
welchen Messwerten, steht in [`../v8-abstands-audit.md`](../v8-abstands-audit.md).

|               | Vorher                               | Nachher                                |
| ------------- | ------------------------------------ | -------------------------------------- |
| Eingabe-Panel | ![vorher](raster-vorher-eingabe.png) | ![nachher](raster-nachher-eingabe.png) |
| Tresor-Panel  | ![vorher](raster-vorher-tresor.png)  | ![nachher](raster-nachher-tresor.png)  |
| Code-Karte    | ![vorher](raster-vorher-karte.png)   | ![nachher](raster-nachher-karte.png)   |
| Kopfzeile     | ![vorher](raster-vorher-kopf.png)    | ![nachher](raster-nachher-kopf.png)    |

## Worauf zu achten ist

**Eingabe-Panel** — unter den Tasten stand eine leere Live-Region und hat 16 px
Fuge gekostet, ohne etwas zu sein. Und der erzwungene Zeilenumbruch der
Tastenzeile kostete 16 px, während zwischen „QR aus Bild" und „Kamera" 8 standen:
dieselbe Gruppe mit zwei verschiedenen Lücken.

**Tresor-Panel** — unterhalb von „Verschlüsselt speichern" lagen 20 px tote Fuge
(die Hülle dreier versteckter Tasten plus die leere Fehlerzeile). Die Statuszeile
brach auf zwei Zeilen, weil ein Satz in gesperrten Versalien stand; Leuchte und
Winkel saßen danach zwischen den Zeilen. Und das Passwortfeld war 51,5 px hoch
neben einem 40-px-Knopf.

**Code-Karte** — Zifferblatt und Kopiertaste lagen 4,5 px neben dem Code, weil sie
über alle drei Zeilen zentriert waren und die drei Zeilen nicht symmetrisch sind.
Der Chip stand 5,75 px neben der Grundlinie des Kontonamens.

**Kopfzeile** — Wortmarke, Markenzeile und Zustand lagen auf drei verschiedenen
Grundlinien (Spanne 8 px), obwohl das CSS sie über `align-items: baseline` auf eine
legte. Ursache war dieselbe wie beim Chip: Ein Flexkasten mit zentrierten Kindern
hat keine Schrift-Grundlinie, sondern eine Ersatzlinie an seiner Unterkante.

Der vollständige Satz (sechs Panels × hell und dunkel) entsteht mit demselben
Befehl und liegt unter `screenshots/` — im Repo stehen nur diese acht, weil
`docs/` ohnehin die Stelle ist, an der dieses Projekt Platz verliert.
