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

## P5 Teil 2 — Bühnen, Fold-Zeilen, Filter

| Datei                   | Was es zeigt                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `p5-leerzustand.png`    | Emblem, der **native** Satz („… none of it leaves this device"), Feld mit übersetztem Platzhalter, Testschlüssel-Knopf in voller Breite |
| `p5-fold-zu.png`        | Arbeitszustand nach dem Testschlüssel: **Codes zuerst**, darunter „Input · 1 account" zugeklappt                                        |
| `p5-fold-auf.png`       | Dieselbe Zeile aufgetippt: Winkel gedreht, Editor in der Schublade                                                                      |
| `p5-filter-treffer.png` | Filterzeile ab 8 Einträgen; „CLOUD" findet `Hetzner_Cloud`, Zähler steht auf „7 accounts · 1 error"                                     |

Der Testschlüssel-Knopf trägt wirklich den RFC-4226-Vektor: Gerätezeit
1786654651, Zähler 59555155, App `722 841 · folgt 858 842 · 29 s`, Node
`722841 / 858842`. Treffer.

Der Fehlerstreifen in `p5-filter-treffer.png` ist **kein Fehler der App**:
`adb shell input text` hat beim Anlegen der Testzeilen wieder ein Zeichen
verschluckt, die Zeile ist 30 Zeichen lang statt 32. Er zeigt dafür nebenbei,
dass die übersetzte Fehlerkarte samt Begründungstext funktioniert.

## P5 — Bewegung reduzieren, mit Gegenprobe

Compose koppelt seine Fahrten an die Animator-Skala des Systems
(`MotionDurationScale`) — die App enthält dafür keine einzige eigene Zeile.
Ob das wirklich greift, kann man nur messen.

Gemessen wurde mit derselben Bildfolge, nur mit verschiedener Skala:
Fold-Zeile zuklappen, aufklappen, **sofort** aufnehmen.

| Datei                         | Animator-Skala | Was im Bild steht                                                            |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------- |
| `p5-motion-skala1-faehrt.png` | `1.0`          | Schublade **halb offen**, Text unten beschnitten, Winkel in Zwischenstellung |
| `p5-motion-skala0-sofort.png` | `0`            | Schublade **ganz offen**, alle acht Zeilen da, Winkel oben                   |

Das erste Bild ist die Gegenprobe und der eigentliche Beweis: Es zeigt, dass
die Messung eine laufende Fahrt überhaupt sehen KANN. Ohne sie hieße „bei
Skala 0 ist alles fertig" nur, dass zu spät aufgenommen wurde.

Ergebnis: **Keine Fahrt läuft, der Zustand stimmt trotzdem.**

## P5 — Meldungszeile und das breite Raster (N6)

| Datei                       | Was es zeigt                                                                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `n6-raster-breit-540dp.png` | Das echte Raster: Kopfzeile, Code und folgt-Zeile beginnen an derselben Stelle, Chip rechts in der Code-Spalte, Blatt und Taste nur in der Code-Zeile |
| `p5-meldungszeile.png`      | Die Live-Region: „Nothing matches …" fährt unter der Filterzeile ein                                                                                  |

Der Code im breiten Raster ist nachgerechnet: Gerätezeit 1786656220, Zähler
59555207, App `964 441 · folgt 767 305 · 20 s`, Node `964441 / 767305`.
Treffer.

Die Meldungszeile bleibt **immer** in der Komposition und fährt nur auf Höhe 0
zusammen. Eine Live-Region, die erst mit ihrem Text entsteht, meldet ihn nicht
zuverlässig — das ist im Web die `:empty`-Regel, die den Fluss verlässt und
nicht den Baum.

## P5 — Listbox-Popover und Launcher-Icon (P5 damit fertig)

| Datei                    | Was es zeigt                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `p5-fuss-englisch.png`   | Der Fuß: „No network · no storage · HMAC via javax.crypto" und der Umschalter                  |
| `p5-listbox-offen.png`   | Das Popover, nach Eigennamen sortiert, orangenes Häkchen an der Auswahl                        |
| `p5-fuss-deutsch.png`    | Nach der Wahl: alles deutsch, Fuß auf „Kein Netzwerk · kein Speicher · HMAC über javax.crypto" |
| `p5-launcher-hell.png`   | Das Launcher-Icon zwischen den Systemsymbolen                                                  |
| `p5-launcher-dunkel.png` | Dasselbe im Dunkelmodus                                                                        |

**Die Eigennamen kommen aus dem Katalog, nicht von der Plattform.** Die
Reihenfolge im Bild ist die des Web-Umschalters — Bahasa Indonesia, Čeština,
Dansk, Deutsch, Eesti, English, Español, Français, Hrvatski —, also nach
Eigennamen mit festem `en`-Collator sortiert. Der Beschluss hängt an einer
gemessenen Abweichung: Für `zh-Hans` liefert Android „中文 (简体)", der
Katalog sagt „简体中文".

**Der Sprachwechsel ist am System nachgemessen**, nicht nur am Bild:
`cmd locale get-app-locales io.github.keco216.clockwork.dev` meldet danach
`[de]`. Die Activity wird dabei nicht neu erstellt — `locale` steht in
`configChanges`.

**Das Icon ist erzeugt, nicht gemalt.** `scripts/native-icons.mjs` schreibt
drei Vektor-Ebenen aus derselben Markengeometrie wie `android-icons.mjs`
(21 Hemmungszähne im 12°-Schritt, Werkbrücke r = 62 mit 84°-Maul, Lager
r = 8,5). Zwei Läufe hintereinander liefern byte-identische Dateien
(SHA-256 `296a8ce6…`). Im APK nachgewiesen: `drawable/ic_launcher_background`,
`…_foreground`, `…_monochrome` und `mipmap-anydpi-v26/ic_launcher.xml` als
Manifest-Icon.

**Was NICHT visuell geprüft ist:** die Themed-Icon-Darstellung. Der Schalter
dafür ist eine Einstellung des Launchers (Pixel: „Themed icons"), keine
System-Einstellung — er lässt sich über `adb` nicht zuverlässig setzen. Die
Monochrom-Ebene liegt gemessen im APK und ist formgleich zur
Vordergrund-Ebene; ihre Darstellung im Launcher bleibt ungeprüft und ist
hiermit benannt statt behauptet.

## P6 — Kamera und QR: der echte Scan, zweimal bewiesen

### Der Kamera-Weg, am Emulator mit Virtual Scene

Die Beweisidee aus dem Auftrag: Die Virtual-Scene-Kamera des Emulators zeigt
ein Posterbild an der Bildwand — tauscht man `emulator/resources/poster.png`
gegen einen QR-Code, scannt die App ein ECHTES Kamerabild, ohne dass ein
Gerät auf ein Blatt Papier zielen muss. Den Weg zur Wand fährt das
mitgelieferte Makro (`adb emu automation play <resources>/macros/Walk_to_image_room`
— der Name allein wird abgelehnt, es braucht den vollen Pfad); zurück geht es
mit `Reset_position`. Das AVD steht dafür seit P6 auf
`hw.camera.back=virtualscene` (das Startflag `-camera-back virtualscene`
übersteuert die config.ini NICHT — gemessen, es kam weiter das alte
Testmuster).

| Datei                        | Was es zeigt                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `p6-leerzustand-tasten.png`  | Leerbühne mit dem V10-Zweiergitter „QR aus Bild" / „Kamera" unter dem Testschlüssel                                         |
| `p6-berechtigung-dialog.png` | Der System-Berechtigungsdialog nach dem ersten Kamera-Tipp                                                                  |
| `p6-kamera-abgelehnt.png`    | Nach „Don't allow": die Meldungszeile mit dem NATIVEN Satz — Wegweiser auf die App-Einstellungen, kein Browser-Text         |
| `p6-sucher-virtualscene.png` | Der Sucher: vier Signal-Winkel (18 dp, 2 dp Strich, 16 dp Einzug) über dem echten Kamerabild des Virtual-Scene-Zimmers      |
| `p6-scan-treffer.png`        | Nach dem Makro-Gang zur Posterwand: Scan ausgelöst, Kanalzug „Clockwork / proof", Meldung „QR-Code gelesen und eingesetzt." |
| `p6-scan-uri-im-feld.png`    | Die Schublade danach: die gescannte otpauth-URI steht WÖRTLICH im Textfeld — kein stilles Konten-Anlegen                    |

Der gescannte Code ist unabhängig nachgerechnet (RFC-4226-Testschlüssel im
Poster-QR, Gerätezeit per `adb shell date +%s`):

| Gerätezeit | Zähler   | App zeigt                      | `node -e` rechnet      |
| ---------- | -------- | ------------------------------ | ---------------------- |
| 1786660874 | 59555362 | 862 376 · folgt 403 346 · 16 s | 862376 / 403346 / 16 s |

### Der Bild-Weg: Photo Picker und Migration

| Datei                      | Was es zeigt                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `p6-photo-picker.png`      | Der System-Picker über der App: „Clockwork will only have access to the photos you select" — keine Speicher-Berechtigung             |
| `p6-import-expandiert.png` | Nach der Wahl des Migrations-QR: Kanalzug „Example / alice@google.com", Meldung „1 Konto aus Google-Authenticator-Export übernommen" |

Das gewählte Bild ist der dokumentierte Google-Authenticator-Beispiel-Export
als QR (dasselbe PNG liegt als Test-Fixture unter `app/src/test/resources/scan/`,
erzeugt vom npm-Encoder `qrcode` 1.5.4 — ein Encoder, der mit ZXing keine
Zeile teilt). Auch hier ist der Code nachgerechnet:

| Gerätezeit | Zähler   | App zeigt                     | `node -e` rechnet     |
| ---------- | -------- | ----------------------------- | --------------------- |
| 1786661454 | 59555381 | 854 808 · folgt 653 848 · 6 s | 854808 / 653848 / 6 s |

### Das S24, nebenbei: Dunkelmodus und eine Sprachstichprobe

| Datei                            | Was es zeigt                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `p6-s24-leerzustand-dunkel.png`  | Die Leerbühne auf dem Galaxy S24 Ultra: Dunkelmodus, Deutsch, das Zweiergitter — der echte Prüfstand                         |
| `p6-s24-daenische-ableitung.png` | Die Listbox nach einem Fehltipp auf „Dansk": der abgeleitete dänische Leersatz („… intet af det forlader denne enhed") sitzt |

### Was benannt bleibt statt behauptet

- **Die Fokus-Rückgabe bei „Kamera aus"** ist wörtlich nach der Web-Regel
  gebaut (nur wenn der Fokus im Sucher lag, kehrt er zum Kamera-Knopf
  zurück) — ein sauberer Tastatur-Beweis am Emulator ist an der Fragilität
  des Messaufbaus gescheitert (TAB landet als Zeichen im mehrzeiligen Feld;
  die Sitzung riss dabei zweimal System-UI auf). Der Weg steht in
  `ui/Scan.kt` samt Begründung; nachgeholt wird die Sichtprobe, sobald ein
  Lauf mit Hardware-Tastatur ansteht.
- **Bewegung reduzieren:** P6 bringt keine einzige neue Eigenbewegung mit —
  der Sucher erscheint ohne Fahrt (wie im Web, wo er ein `hidden`-Umschalter
  ist), und die Meldungszeilen benutzen den in P5 mit Gegenprobe gemessenen
  Live-Region-Mechanismus. Es gibt hier nichts Neues zu messen.

## P7 — Tresor, Biometrie, FLAG_SECURE und der Kopf (N10)

Alle Werte auf dem AVD `clockwork-test` gemessen: Android 16 (API 36),
1080 × 2400 bei Dichte 420, also **411 dp** Fensterbreite — unter der
420-dp-Schwelle, die Karte trägt also das Kompaktraster.

### Der Kopf (N10) — er war nie da, jetzt ist er es

| Datei                  | Was es zeigt                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `p7-kopf-oben.png`     | Am Seitenanfang: Wortmarke mit Signal-Index auf dem ersten O, `brand.tagline`, Zustandszeile samt Leuchte          |
| `p7-kopf-verstaut.png` | Nach dem Runterscrollen: Der Kopf ist weg, unten steht die volle Tresor-Zone samt Sperrmeldung                     |
| `p7-arbeit-hell.png`   | Arbeitszustand mit offenem Tresor — die Leuchte im Kopf ist **Signal-Orange**, die Zustandszeile sagt „vault open" |
| `p7-arbeit-dunkel.png` | Dasselbe im Dunkelmodus                                                                                            |

**Das M1-Stauverhalten ist gemessen, nicht behauptet.** Gemessen wurde die
Oberkante der Wortmarke (`content-desc="Clockwork"`) gegen einen Fühler im
Inhalt (der Testschlüssel-Knopf); der Abstand zweier Fühlerstände ist der
gescrollte Weg. Dichte 420 heißt 1 dp = 2,625 px.

| Schritt                    | Scroll-Weg         | Kopf                 |
| -------------------------- | ------------------ | -------------------- |
| ganz oben                  | —                  | sichtbar (y = 105)   |
| 627 px abwärts (239 dp)    | weit über Kopfhöhe | **verstaut**         |
| 93 px aufwärts (35 dp)     | > 12 dp            | **zurück** (y = 105) |
| 37 px abwärts (14 dp)      | **< 24 dp**        | **bleibt** (y = 105) |
| weitere 56 px (zus. 35 dp) | > 24 dp            | **verstaut**         |

Die vierte Zeile ist der eigentliche Beweis: Ein kleiner Weg nach unten
verstaut den Kopf NICHT. Die drei Hysterese-Beträge aus `ui/masthead.ts`
(24 / 12 / 8 dp) sind wörtlich übernommen und wirken hier gemessen
unterschiedlich — verstauen ist teuer, zurückholen billig.

Die Kopfhöhe ist keine Annahme: Der Riegel misst laut Knotenbaum
`[0,63][1080,346]`, also 283 px = **108 dp**.

### Der Tresor — der Rundlauf

| Schritt                     | Ergebnis                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| Versiegeln                  | „Open — secrets are in the text field", Meldung „Vault stored encrypted."                 |
| Kopf danach                 | „Offline · **vault open**", Leuchte in Signal-Orange                                      |
| Aufklapper nach dem Vorgang | fällt zu — die `paintedState`-Regel aus `vault-panel.ts`                                  |
| Zusperren                   | Feld geleert, Leerbühne zurück, Tresor-Zone bleibt sichtbar, Aufklapper öffnet von selbst |
| Falsche Passphrase          | „The vault would not open. Wrong passphrase — or the stored data was altered."            |
| Markierung danach           | Feld ist blau markiert; der nächste Tastendruck ERSETZT es (7 Zeichen → 6 nach „geheim")  |
| Verlassen der App           | „Locked — passphrase required", Meldung „**Locked on leaving the app.**"                  |
| Zeitschaltung (1 min)       | 12:05:50 offen → 12:07:03 gesperrt, Meldung „**Locked after 1 minute without input.**"    |
| Zweistufiges Löschen        | 1. Tipp: Knopf sagt „Really delete?", **nichts gelöscht**. 2. Tipp: `vault.json` weg      |
| Kopf danach                 | „Offline · **nothing stored**", Tresor-Zone im Leerzustand wieder unsichtbar              |

**Der stärkste Beweis ist der über die Datei, nicht über den Bildschirm.**
Die App hat versiegelt, die Datei wurde vom Gerät geholt und mit **Nodes Web
Crypto API** geöffnet — also mit genau dem Code-Pfad der Web-Fassung:

```
{"v":1,"kdf":"PBKDF2-SHA-256","iterations":600000,
 "salt":"53CyD2fo+KW7ZTBTw6/efw==","iv":"0nHL2r/WhLHSpV00","data":"PaBv9BNO…"}

Iterationen: 600000
Klartext:    GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ
```

Damit ist dreierlei belegt: Der Weg über die Oberfläche versiegelt richtig,
die Passphrase kam unverstümmelt an (die `input text`-Falle aus P5), und das
Format ist byte-kompatibel zum Web — die Voraussetzung für P8.

Der angezeigte Code ist wie immer gegengerechnet: Gerätezeit 1786702220,
Zähler 59556740, App `156 836 · folgt 266 795 · 9 s`, Node
`156836 / 266795 / 10 s`. Nebenbei ein zweiter Beweis derselben Sache: Das
„folgt 156 836" aus dem Bild eine Minute davor war dann der laufende Code.

### Biometrie — Komfortweg, und was passiert, wenn er wegfällt

| Datei                              | Was es zeigt                                                                                                   |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `p7-tresor-gesperrt-biometrie.png` | Gesperrter Tresor mit dem Knopf „Unlock with biometrics" — er steht nur da, wenn wirklich ein Wickel existiert |
| `p7-biometrie-invalidiert.png`     | Nach einer NEUEN Fingerabdruck-Registrierung: der Wickel ist weg, die Meldung erklärt warum                    |

**Ohne Biometrie am Gerät** trägt der Schalter den Satz „This device has no
strong biometrics set up." und ist gesperrt. Nach dem Registrieren eines
Fingerabdrucks wechselt er auf „A shortcut, not a second key: the passphrase
stays the only way back." — die Abfrage `BiometricManager.canAuthenticate
(BIOMETRIC_STRONG)` arbeitet also.

**Einschalten** öffnet die System-Abfrage (Titel „Unlock with biometrics",
Abbruchknopf „Use passphrase"). Nach `adb -e emu finger touch 1` liegt der
Wickel auf der Platte:

```
vault-wrap.json  {"iv":"jhlf3ZxYhdyVgnJe","data":"UkGN5Xyh…","salt":"53CyD2fo+KW7ZTBTw6/efw=="}
lock-settings.json  {"timeoutMs":300000,"lockOnHide":true,"biometric":true,…}
```

Das `salt` ist dasselbe wie in `vault.json` — daran erkennt die App einen
veralteten Wickel, bevor sie ihn benutzt.

**Aufsperren per Biometrie** (ohne jede Passphrase): Knopf → Abfrage →
`finger touch 1` → „Open — secrets are in the text field", „Vault unlocked.",
Kopf auf „vault open", Konto wieder da.

**Die Invalidierung ist einmal wirklich durchgespielt worden**, und das ist
der Punkt, an dem `setInvalidatedByBiometricEnrollment(true)` seinen Wert
zeigt: Ein ZWEITER Fingerabdruck wurde in den Systemeinstellungen
registriert. Danach:

| Vorher                                  | Nachher                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `vault-wrap.json` liegt da              | **gelöscht**                                                                                                |
| `"biometric":true`                      | **`"biometric":false`**                                                                                     |
| Knopf „Unlock with biometrics" sichtbar | **weg**                                                                                                     |
| —                                       | „New biometrics were enrolled, so the shortcut is gone. Unlock with the passphrase and switch it on again." |

Wer sich einen Finger auf ein fremdes entsperrtes Gerät legt, öffnet damit
also KEINEN fremden Tresor. Der Tresor selbst ist unberührt — er hängt am
Umschlag und an der Passphrase, und genau das sagt der Satz neben dem
Schalter.

### FLAG_SECURE — mit Gegenprobe

| Datei                   | Einstellung  | Aufnahme                                      | Fensterflagge |
| ----------------------- | ------------ | --------------------------------------------- | ------------- |
| `p7-flagsecure-an.png`  | an (Vorgabe) | **1 Farbe**: rgb(0,0,0), 53.165/53.165 Punkte | `SECURE`      |
| `p7-flagsecure-aus.png` | aus          | **313 Farben**, dominant rgb(245,245,245)     | keine         |

Die Gegenprobe ist der eigentliche Beweis: Sie zeigt, dass die Messung einen
Unterschied überhaupt SEHEN kann — dieselbe Vorsichtsmaßnahme, mit der
`check-contrast.mjs` seit V7 arbeitet. Ausgelöst wurde der Wechsel über den
Schalter in der App, nicht über eine handgeschriebene Datei: Danach steht
`"blockScreenshots":false` in `lock-settings.json`, die Flagge ist aus dem
Fenster verschwunden, und die Aufnahme zeigt wieder Inhalt.

Deshalb gibt es den Abschalter überhaupt: **FLAG_SECURE sperrt auch
`adb shell screencap`** — ohne ihn gäbe es keine Abnahmebilder.

### Zwei Befunde, die dieser Posten nebenbei gefunden hat

**1. Das Textfeld überlebte den Prozesstod.** `rememberSaveable` legt seinen
Wert in den Instanzzustand der Activity, und den hält das System über einen
Speichermangel-Kill hinweg. Gemessen, mit Gegenprobe:

| Ablauf                                             | vorher (`rememberSaveable`) | nachher (`remember`)  |
| -------------------------------------------------- | --------------------------- | --------------------- |
| Testschlüssel → HOME → `am kill` (pidof = 0) → App | **„Input · 1 account"**     | **„Insert test key"** |

Das verletzte die Zusage „ohne Tresor wird nichts gespeichert" — nicht durch
eine Datei, die die App schreibt, sondern durch eine, die das System für sie
aufhebt. Der Preis des Fixes ist null: `configChanges` deckt Drehung,
Schriftskala, Sprache, Dunkelmodus und Dichte ab, die Activity wird dafür gar
nicht neu erstellt.

**2. Die Biometrie-Bibliothek bringt zwei Berechtigungen mit.**
`androidx.biometric` mischt `USE_BIOMETRIC` und `USE_FINGERPRINT` über den
Manifest-Merge ins Paket. Beide stehen jetzt AUSGESCHRIEBEN im eigenen
Manifest, `USE_FINGERPRINT` mit `maxSdkVersion="27"` — sonst hätte eine
Abhängigkeit still eine Zusage geändert, die im Kopf der Datei stand. Am APK
nachgemessen:

```
uses-permission: android.permission.CAMERA
uses-permission: android.permission.USE_BIOMETRIC
uses-permission: android.permission.USE_FINGERPRINT maxSdkVersion='27'
uses-feature-not-required: android.hardware.camera
uses-feature-not-required: android.hardware.camera.any
INTERNET-Treffer: 0
```
