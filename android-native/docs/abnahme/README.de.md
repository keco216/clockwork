# Abnahmebilder der nativen App

Diese Bilder liegen hier und **nicht** unter `docs/` des Web-Projekts: Die
native App ist unveröffentlicht, und der öffentliche Auftritt des Projekts
soll bis zur bewussten Veröffentlichung unverändert bleiben.

Alle Aufnahmen entstehen am Emulator über `adb shell screencap` + `adb pull` —
**nicht** über `adb exec-out … >`, das zerstört unter PowerShell den
Binärstrom (siehe CLAUDE.md, Fallen).

## P5 — die zwei Raster der Code-Karte

| Datei                         | Profil                               | Was es zeigt                                                                                                             |
| ----------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `p5-raster-kompakt-384dp.png` | 1440 × 3120, Dichte 600 → **384 dp** | Kompaktraster: Blatt neben dem Namen, Chip in eigener Zeile, Code über die volle Kartenbreite, Kopieren 44 dp ganz unten |
| `p5-raster-breit-540dp.png`   | 1080 × 2400, Dichte 320 → **540 dp** | Breites Raster: Blatt, Code und Kopiertaste in einer Zeile, alle drei auf einer Achse                                    |

Das erste Profil ist das des Galaxy S24 Ultra — genau des Geräts, auf dem die
letzte Ziffer hinter der Kopiertaste verschwand. Die Schwelle liegt bei
420 dp; 384 liegt darunter, 540 darüber.

Beide Codes sind **unabhängig in Node gegen die Gerätezeit nachgerechnet**:

| Profil | Gerätezeit | Zähler   | App zeigt                      | Node rechnet    |
| ------ | ---------- | -------- | ------------------------------ | --------------- |
| 384 dp | 1786653750 | 59555125 | 256 698 · folgt 019 019 · 30 s | 256698 / 019019 |
| 540 dp | 1786653820 | 59555127 | 343 393 · folgt 845 963 · 20 s | 343393 / 845963 |

## P5 — `configChanges`, gemessen statt geglaubt

Das Manifest erklärt `uiMode|fontScale|locale|layoutDirection|density` (und
drei weitere) als selbst behandelt. Die Activity wird dabei also **nicht** neu
erstellt — und genau deshalb muss man nachsehen, ob die Änderungen überhaupt
ankommen. Ein Zustand, den niemand neu aufbaut, kann auch stumm veralten.

Gemessen wurde die Identität des `ActivityRecord` vor und nach jedem Schritt:
Bliebe sie nicht gleich, wäre die Activity doch neu erstellt worden und die
Messung wertlos.

| Datei                              | Schritt                              | `ActivityRecord` |
| ---------------------------------- | ------------------------------------ | ---------------- |
| `p5-config-1-hell.png`             | Ausgangslage (hell, 1.0, englisch)   | `214718662`      |
| `p5-config-2-dunkel.png`           | `cmd uimode night yes`               | `214718662`      |
| `p5-config-3-schriftskala-1_5.png` | `settings put system font_scale 1.5` | `214718662`      |
| `p5-config-4-deutsch.png`          | `cmd locale set-app-locales … de`    | `214718662`      |

Alle drei Wege schlagen durch: dunkle Flächen, sichtbar größere Schrift (die
Zeile im Eingabefeld bricht nach 21 statt nach 31 Zeichen um), und die
deutschen Ressourcen (`Konto 1`, `SHA-1 · 6 Stellen · 30 s`, `folgt`,
`Kopieren`, `Eingabe`). `configChanges` bleibt damit, wie es ist — ausdünnen
wäre nur nötig gewesen, wenn einer der drei Wege gehakt hätte.

**Nebenbefund, der fast ein Fehlalarm geworden wäre:** Im Eingabefeld dieser
vier Bilder steht `GZDGNBVGY3TQOJQ…` — dem Testschlüssel fehlt das erste `E`.
Das ist kein Fehler der App, sondern von `adb shell input text`, das beim
Tippen ein Zeichen verschluckt hat. Nachgewiesen durch Nachrechnen: Der
angezeigte Code `195 477` (folgt `604 029`) gehört rechnerisch **exakt zum
verkürzten Secret**, nicht zum vollständigen. Die App rechnet also richtig,
was im Feld steht. Wer am Gerät misst, prüft den Feldinhalt und nicht die
Absicht.
