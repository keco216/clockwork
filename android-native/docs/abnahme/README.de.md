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

## P8 — die Übernahme aus der WebView-Fassung

Der Posten, für den das Format-Kapitel aus P2 gemacht war: Wer von der
1.x-Fassung aktualisiert, soll seinen Tresor wiederfinden.

### Der Aufbau — und warum er einen Release-Build braucht

| Rolle         | Datei                                        | Größe       | versionCode | Zertifikat      |
| ------------- | -------------------------------------------- | ----------- | ----------- | --------------- |
| Ausgangsstand | `android/…/release/app-release.apk` (v1.5.4) | 1.235.807 B | 10504       | `d31e10a4…cf3f` |
| Update        | `android-native/…/release/app-release.apk`   | 3.228.931 B | 20000       | `d31e10a4…cf3f` |

Beide tragen **dasselbe** Zertifikat — sonst nähme Android das Update gar nicht
an (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`, in v1.4.0 schon einmal gemessen). Der
Debug-Build kann diesen Beweis grundsätzlich nicht führen: Sein
`applicationIdSuffix .dev` macht ihn zu einer anderen App.

Installiert wurde mit `adb install -r`, also **ohne** Deinstallation. Die
Antwort war `Success`; das allein belegt die Signaturgleichheit.

Das APK ist mit 3,23 MB rund zweieinhalbmal so groß wie die 1,24-MB-WebView-
Hülle. Das ist der Preis von Compose und war zu erwarten — die Zahl steht hier
ungeschönt, weil sie in P9 ohnehin fällig ist.

### Vorher: was wirklich in der WebView lag

Gemessen am Gerät, nicht angenommen (`adb root`, dann die LevelDB der 1.5.4
gelesen):

```
$ strings -n 6 …/app_webview/Default/Local Storage/leveldb/000003.log
META:https://localhost
2fa-live.vault.v1
{"v":1,"kdf":"PBKDF2-SHA-256","iterations":600000,"salt":"ts/c2XBRdnFRAp4PPFlcMg==",
 "iv":"thrshUByzB0gGnBp","data":"hXYyCIuWlMnnCEaGa8tszkepVq4MSVRgW+mU1TATYKq+…"}
2fa-live.lock-settings.v1
{"timeoutMs":900000,"lockOnHide":false}
```

**Die erste Zeile ist der eigentliche Fund.** Der Auftrag sagt, Scheme und Host
seien „aus `capacitor.config.json` abzulesen" — dort steht nichts davon. Die
Datei hat keinen `server`-Block, weder im Repo noch in der ausgelieferten 1.5.4
(deren `assets/capacitor.config.json` nachgesehen). `https://localhost` ist
Capacitors **Vorgabe** aus `CapConfig.java` (`hostname = "localhost"`,
`androidScheme = CAPACITOR_HTTPS_SCHEME`). Hier steht sie jetzt gemessen da.

Warum das mehr ist als eine Fußnote: Ein falscher Origin wirft keinen Fehler.
`localStorage.getItem` liefert dann still `null`, die Übernahme meldete „nichts
gefunden", und der Tresor wäre beim Löschen der Altdaten weg. Das ist dieselbe
Falle wie beim APK-Vergleich, dessen leeres Vergleichsfeld „identisch" meldete.

Der Ausgangsstand war absichtlich **nicht** auf den Voreinstellungen:
15 Minuten statt 5, und „beim Verlassen zusperren" AUS. Sonst bewiese eine
übernommene Einstellung nichts.

### Nachher: was die native Fassung vorfand

Nach dem ersten Start der 2.0.0 liegen im `filesDir` drei Dateien:

```
vault.json          {"v":1,"kdf":"PBKDF2-SHA-256","iterations":600000,
                     "salt":"ts/c2XBRdnFRAp4PPFlcMg==","iv":"thrshUByzB0gGnBp","data":"hXYyCIuW…"}
lock-settings.json  {"timeoutMs":900000,"lockOnHide":false,"biometric":false,"blockScreenshots":true}
webview-import.json {"imported":true}
```

Der Umschlag ist **Zeichen für Zeichen** derselbe wie in der LevelDB. Die zwei
Werte, die es im Web überhaupt gibt, sind mitgewandert; die zwei nativen
(`biometric`, `blockScreenshots`) stehen auf ihrer Voreinstellung — es gibt im
Web kein Gegenstück, aus dem sie kommen könnten.

### Und sind die Altdaten weg?

```
$ grep -rl '2fa-live' /data/data/io.github.keco216.clockwork/
(kein Treffer)
```

Über das **ganze** Datenverzeichnis, nicht nur über die eine Datei. Die LevelDB
ist von 635 auf 30 Byte geschrumpft — übrig ist der Kopfsatz, kein Eintrag.

Das Verzeichnis `app_webview` ist trotzdem wieder da: Unsere **eigene** WebView
legt es beim Lesen an. Genau deshalb gibt es den Merker; ohne ihn träfe die
Vorprüfung „gibt es WebView-Daten?" bei jedem Start wieder zu.

### Zwei Gegenproben zum Merker

| Ablauf                    | `vault.json` | Merker danach        |
| ------------------------- | ------------ | -------------------- |
| Neustart (Merker liegt)   | unverändert  | `{"imported":true}`  |
| Merker gelöscht, Neustart | unverändert  | `{"imported":false}` |

Die zweite Zeile prüft den Verteidigungszweig: Ein nativer Tresor ist da, also
wird **nicht** gelesen und **nichts** gelöscht — der Merker wird nur neu
gesetzt, damit der nächste Start nicht wieder eine WebView hochzieht. Ohne
diesen Zweig hätte ein gelöschter Merker den Tresor überschreiben können.

### Der Beweis, der zählt: die Passphrase öffnet

Die in der 1.5.4 gesetzte Passphrase („geheim", im Feld als sechs Punkte
gegengeprüft) sperrt die native Fassung auf: „Open — secrets are in the text
field", Kopf auf „Offline · vault open", Konto zurück.

Der Code ist zweimal gegen Node gerechnet, und der Zähler-Wechsel zwischen den
beiden Ablesungen ist selbst ein Beweis:

| Gerätezeit | Zähler   | App zeigt                      | `node -e` rechnet |
| ---------- | -------- | ------------------------------ | ----------------- |
| 1786707041 | 59556901 | 203 820 · folgt 550 709 · 18 s | 203820 / 550709   |

Die Restsekunden rechnet Node auf 19, die App zeigt 18 — das ist die
Verzögerung des Auslesens, kein Gangunterschied.

### Der Beweis ist zweimal gelaufen

Der erste Durchgang lief gegen einen Build, dem noch ein Zweig fehlte: Lag
unter dem Tresor-Schlüssel etwas, das **kein bekannter Umschlag** ist, hätte
die Übernahme es beim Aufräumen mitgelöscht. Das ist der Fall, der eintritt,
wenn die 1.x-Fassung je ein zweites Umschlag-Format bekäme — ein alter
Importeur, der ein neueres Format wegräumt, ist genau der Datenverlust, gegen
den die ganze Reihenfolge in dieser Klasse gebaut ist.

Der Zweig ist nachgetragen (`ImportOutcome.Unreadable`: nichts lesen, nichts
löschen, nur den Merker setzen) und mit zwei Tests belegt. **Damit passte das
gemessene APK nicht mehr zum Quelltext, also ist der ganze Beweisgang neu
gelaufen** — Emulator zurückgesetzt, 1.5.4 neu installiert, Tresor neu
angelegt, Update eingespielt. Alle Zahlen oben stammen aus diesem zweiten
Durchgang und damit aus genau dem Stand, der committet ist.

### Die Bilder

| Datei                         | Was es zeigt                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `p8-uebernommen-gesperrt.png` | Was ein 1.x-Nutzer nach dem Update zuerst sieht: Kopf „Offline · vault locked", Leerbühne, Tresor-Zone mit Passphrasenfeld            |
| `p8-uebernommen-offen.png`    | Nach dem Aufsperren: **15 Minuten** und „and when the app is left" AUS — die übernommenen Werte —, dazu der Biometrie-Schalter aus P7 |

**Damit ist auch der letzte offene Punkt aus P7 erledigt.** Dort fehlte ein Bild
des OFFENEN Tresors mit dem Biometrie-Schalter; das zweite Bild trägt ihn samt
seinem Satz „A shortcut, not a second key: the passphrase stays the only way
back." Dass der Tresor darin aus einer Übernahme stammt, ändert am Schalter
nichts — er hängt am Zustand „offen", nicht an der Herkunft des Umschlags.

Für beide Aufnahmen musste `blockScreenshots` über den Schalter in der App aus:
FLAG_SECURE sperrt auch `adb shell screencap`. Die Datei bestätigt den Weg über
die Oberfläche (`"blockScreenshots":false`), und die übernommenen Werte stehen
unverändert daneben.

Beide Bilder stammen aus dem ERSTEN Durchgang. Sie zeigen die Oberfläche, und
an der hat der nachgetragene Zweig nichts geändert — er greift nur bei einem
Umschlag, den diese Fassung nicht kennt. Wer sie neu schießen will, setzt den
Emulator nach dem Rezept oben zurück.

### Was dabei nicht passiert ist

Am APK nachgemessen, nach dem Einbau des WebView-Pfads:

```
uses-permission: android.permission.CAMERA
uses-permission: android.permission.USE_BIOMETRIC
uses-permission: android.permission.USE_FINGERPRINT maxSdkVersion='27'
INTERNET-Treffer: 0
```

Die eine Seite, die geladen wird, kommt über `shouldInterceptRequest` aus dem
Programm selbst. Es gibt keine Netzanfrage, und es gibt weiterhin keine
Berechtigung, eine zu stellen.

### Ein Befund für P9, nicht für hier

Im Kompaktraster (411 dp) stehen die drei Tresor-Tasten in EINER Zeile und
werden dabei gekürzt: „Store ag…", „Delete e…". Die Web-Fassung bricht an
derselben Stelle auf zwei Zeilen um. Sichtbare Abweichung, also nach der
Auftragsregel ein Fehler — er gehört in den Paritätsdurchgang P9 und nicht in
diesen Posten.

## N11 — die zwei Seiten: Bottom-Navigation

Kevins Struktur-Entscheidung nach dem Blick auf die P7-Builds: Das 1:1
übernommene Seitenende der Web-Fassung — Fuß, Sprachwähler und
Tresor-Konfiguration im Fluss — fühlt sich nach Webseite an, nicht nach App.
Die **Struktur** darf nativ abweichen, die **Designsprache** nicht.

### Der Schnitt

| Startseite                                                                  | Einstellungen                                                   |
| --------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Kopf (N10), Codes, Eingabe-Fold, Filter                                     | Sprache                                                         |
| **Tresor-Zustand samt Kernaktionen** — aufsperren, zusperren, neu speichern | Zeitschaltung, „beim Verlassen sperren", Biometrie, FLAG_SECURE |
| die einzeilige Zusagen-Zeile                                                | Gefahrenzone „Alles löschen", Über-Seite                        |

Die Trennlinie ist nicht „selten gebraucht", sondern **„einmal entschieden"**.
Deshalb bleibt der Tresor-Zustand vorn, obwohl er technisch derselbe Gegenstand
ist wie seine Konfiguration: Wer die App öffnet, landet genau davor, und die
Codes hängen daran.

**Die Zusagen-Zeile steht fest statt am Ende des Scrollbereichs** — eine
bewusste Abweichung von der Web-Fassung. Eine Vertrauenszeile, die man erst
erscrollen muss, wirkt genau dann nicht, wenn sie gebraucht wird: beim ersten
Blick. Auf der Einstellungen-Seite fehlt sie, weil die Über-Seite dort dasselbe
ausführlich sagt.

### Die Bilder

| Datei                         | Was es zeigt                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `n11-home-dunkel.png`         | Startseite, dunkel: Kopf, Leerbühne, Zusagen-Zeile, Leiste mit Zifferblatt und Zahnrad |
| `n11-settings-dunkel.png`     | Einstellungen, dunkel: Sprache, Tresor, Über — der Kopf gilt auch hier                 |
| `n11-about-dunkel.png`        | Die Über-Seite ausgescrollt: Zusagen, **Lizenzen**, Quelltext                          |
| `n11-home-hell.png`           | Startseite, hell: Balken auf `--surface` mit Fuge, Cursor hinter „Start"               |
| `n11-settings-hell.png`       | Einstellungen, hell                                                                    |
| `n11-rtl-einstellungen.png`   | Arabisch: alles gespiegelt, Leiste ebenso — „الإعدادات" links, „الرئيسية" rechts       |
| `n11-indikator-unterwegs.png` | **Der Beweis für „Tippen darf nicht warten"** — siehe unten                            |

### Der wandernde Indikator, gemessen

Der Wert **250 ms** ist nicht am Gerät gemessen, sondern durch
`native-theme-check.mjs` belegt: `Motion.calm` ist deckungsgleich mit
`--dur-calm` aus `tokens.css` (92 Werte geprüft). Am Gerät zu prüfen war das
**Verhalten**.

Gemessen wurde die Lage des Cursors in der Aufnahme, mit einem eigenen
PNG-Leser (dieselbe Technik wie `check-contrast.mjs`): eine Zeile im oberen
Polster des Cursors, dort liegt weder Zeichen noch Beschriftung.

| Lauf | `animator_duration_scale` | Tipp                       | sofort gemessen | Befund                      |
| ---- | ------------------------- | -------------------------- | --------------- | --------------------------- |
| m1   | **0**                     | 270 → 810                  | **810**         | sofort am Ziel — er springt |
| m2   | **10**                    | 810 → 270                  | **810**         | noch am Start — er fährt    |
| m3   | 10                        | dieselbe Fahrt, 7 s später | **270**         | angekommen                  |

Gleiche Abtastung, gegenteiliges Ergebnis. Bei gestreckter Skala steht der
Cursor 1 s nach dem Tipp bei **301** — also unterwegs zwischen 810 und 270.
`animator_duration_scale = 0` ist die Systemeinstellung „Animationen entfernen";
dass der Cursor ihr folgt, ist die native Entsprechung von
`prefers-reduced-motion`, und sie kostet keine eigene Abfrage (dieselbe
Mechanik wie der Tastendruck seit P5).

**`n11-indikator-unterwegs.png` zeigt beides in einem Bild:** Der Inhalt ist
schon die Startseite (Konto 1, Code 045 401), die Beschriftung „Start" ist
schon orange — und der Cursor steht noch unter „Einstellungen". Inhalt sofort,
nur der Indikator fährt.

### Der Tresor-Fluss auf der Startseite

Einmal komplett durchgespielt, alles auf der Startseite:

| Schritt       | Ergebnis                                                                  |
| ------------- | ------------------------------------------------------------------------- |
| Versiegeln    | `vault.json` angelegt                                                     |
| App verlassen | „Gesperrt — Passphrase nötig", Kopf „Offline · Tresor gesperrt"           |
| Aufsperren    | „Offen — Secrets liegen im Textfeld", „Tresor aufgesperrt.", Konto zurück |

Die Zone trägt dabei **nur noch** Zustand und Kernaktionen — Zeitschaltung und
Schalter sind weg, sie stehen auf der zweiten Seite.

### Die Einstellungen-Seite ändert dieselben Werte

**FLAG_SECURE**, über den Schalter auf der neuen Seite, mit Gegenprobe:

| Schalter | `lock-settings.json`       | `adb shell screencap`     |
| -------- | -------------------------- | ------------------------- |
| an       | `"blockScreenshots":true`  | **19.193 Byte** (schwarz) |
| aus      | `"blockScreenshots":false` | **167.846 Byte** (Inhalt) |

**Die Zeitschaltung**, ebenfalls über die neue Seite: um 12:45:07 im
Auswahlfeld auf „1 Minute" gestellt (`"timeoutMs":60000` in der Datei), um
**12:46:44** steht der Kopf auf „Offline · **Tresor gesperrt**" und der
Biometrie-Schalter ist verschwunden. Beides sichtbar, während man auf der
Einstellungen-Seite steht — die Zustandszeile des Kopfes gilt also auf beiden
Seiten.

**Die Voreinstellung ist 5 Minuten**, auf frischer Installation gemessen. Die
15 Minuten auf den P8-Builds waren der Testwert aus dem Migrationsbeweis, nicht
die Vorgabe.

### Zwei Fehler, die dieser Posten gefunden hat

**1. Ein Absturz, der seit P5 im Code lag.** `focusRing` legte den Ring mit
einem NEGATIVEN Polster (`padding(-offset)`) — in Compose verboten, es wirft
`IllegalArgumentException: Padding must be non-negative`. Aufgefallen ist es
nie, weil ein Finger keinen Fokus vergibt; die neuen Navigationsposten sind
fokussierbar, und die IME-Aktion beim Aufsperren schob den Fokus dorthin. Die
App stürzte zweimal reproduzierbar ab („Clockwork keeps stopping").

Der Ring wird jetzt GEZEICHNET statt gelegt (`drawWithContent` + `drawOutline`
auf einer um den Versatz vergrößerten Kontur) — das ist die wörtliche
Entsprechung von `outline` + `outline-offset` im Web: kein Platzbedarf, kein
Layout-Sprung. Gegenprobe: dieselbe Sequenz, die zweimal abstürzte, läuft
jetzt durch (0 FATAL-Zeilen im Protokoll) und sperrt den Tresor auf.

**2. Der Cursor stand auf Arabisch unter dem falschen Posten.** Gemessen wird
mit `positionInParent().x` — einer PHYSISCHEN Koordinate. Gesetzt wurde sie mit
`Modifier.offset` und `Alignment.CenterStart`, und die sind LOGISCH: Auf
Arabisch zählen sie von rechts. Die Leiste spiegelte korrekt, der Cursor blieb
links liegen.

Jetzt `absoluteOffset` und `AbsoluteAlignment.CenterLeft`. Gemessen vorher und
nachher:

| Zustand                             | Cursor vorher | Cursor nachher |
| ----------------------------------- | ------------- | -------------- |
| Arabisch, „الرئيسية" (rechts) aktiv | 270 (falsch)  | **810**        |
| Arabisch, „الإعدادات" (links) aktiv | 270           | **270**        |

Dazu ein dritter, kleinerer Befund: Die Versionszeile las sich auf Arabisch als
„dev-debug (20000)-2.0.0" — der Bidi-Algorithmus hatte die Teile umgestellt.
Sie steht jetzt in Bidi-Isolation (U+2068/U+2069) und liest sich wieder als
`2.0.0-dev-debug (20000)`.

### Was beim Messen selbst schiefging

Zwei Stunden dieses Postens gingen an Messfehler, nicht an Code — beide sind
in CLAUDE.md als Fallen notiert:

- **`Select-Object -First N` beendet den Node-Prozess vorzeitig.** Der
  String-Generator wurde mitten im Lauf abgeschnitten und schrieb die neuen
  Ressourcen nie. Die App zeigte daraufhin den Rückfalltext „This line could
  not be read." in der Leiste — und das APK war frisch gebaut. Gefunden hat es
  der Emulator, nicht der Bau.
- **FLAG_SECURE macht jede Aufnahme schwarz**, und wer dann blind weitertippt,
  landet in der Benachrichtigungsleiste und deutet den Unsinn als App-Fehler.
  Erst Sicht herstellen, dann treiben.

## N12 — Feinschliff 1: Die Leiste schwebt, die Icons tragen die Marke

Kevins Urteil zur N11-Fassung, am Bild bestätigt: Die Leiste wirkt billig, und
das Start-Icon liest sich als Stern. Beides ist in einem Lauf behoben. Alle
Zahlen unten sind an den Pixeln der Aufnahmen gemessen (Emulator
`clockwork-test`, 1080 × 2400, **Dichte 420 — 1 dp = 2,625 px**), nicht aus dem
Quelltext abgeschrieben.

### Die schwebende Karte, nachgemessen

| Was                            | Soll                      | Gemessen (px)                      | dp        |
| ------------------------------ | ------------------------- | ---------------------------------- | --------- |
| Abstand links                  | `--sp-4` = 16             | Karte beginnt bei x = 42           | **16,0**  |
| Abstand rechts                 | `--sp-4` = 16             | Karte endet bei x = 1037           | **16,0**  |
| Abstand unten                  | `--sp-3` = 12 + Safe-Area | 2304 → 2400, davon 63 Gestenleiste | **12,2**  |
| Kartenhöhe                     | 48 + 2 × 8 = 64           | 2137 … 2304 = 168                  | **64,0**  |
| Segmenthöhe (Pille)            | 48                        | 2158 … 2283 = 126                  | **48,0**  |
| Polster der Karte              | `--sp-2` = 8              | 2137 → 2158 = 21                   | **8,0**   |
| Segmentbreite, beide           | exakt gleich              | je 477                             | **181,7** |
| Pille über dem aktiven Segment | deckt es GENAU            | 63 … 539 = 477                     | **181,7** |

Die letzte Zeile ist der Punkt, an dem die N11-Fassung scheiterte: Dort war die
Aktiv-Fläche schmaler als ihr Posten und saß nicht mittig darin. Jetzt sind
Segment und Pille dieselbe Strecke — gemessen, nicht gerechnet.

**Die Radien sind konzentrisch.** Karte und Pille tragen beide `--radius-key`,
und der klemmt auf die halbe Höhe: außen 64 / 2 = 32, innen 48 / 2 = 24. Die
Differenz ist genau das Polster (8).

`n12-start-hell.png` · `n12-start-dunkel.png` · `n12-einstellungen-hell.png` ·
`n12-einstellungen-dunkel.png` — beide Seiten, beide Themes. Hell trägt die
Karte den Overlay-Schatten, dunkel die 1-px-Innenlichtkante; die Fuge nach oben
ist ersatzlos entfallen.

### Der Inhalt läuft unter der Leiste durch

`n12-einstellungen-hell.png` zeigt es am deutlichsten: Der Text der Über-Karte
verschwindet unter der Karte, statt an ihr zu enden.

Damit trotzdem alles erreichbar bleibt, tragen die Bühnen unten ein Polster von
`navOverlayHeight` (64 + 12 = 76 dp) **plus** einer Gruppenfuge. Am Scrollende
gemessen (`n12-unterlauf-hell.png`):

| Strecke                                    | Gemessen (px)     | dp       |
| ------------------------------------------ | ----------------- | -------- |
| Unterkante der letzten Karte → Leistenkopf | 1962 → 2137 = 175 | **66,7** |
| Unterkante der Fußzeile → Leistenkopf      | 2074 → 2137 = 63  | **24,0** |

Die 24,0 dp sind `--gap-group` — der „sichtbare Abstand zur Leiste", den N12
verlangt. Die Fußzeile SCROLLT dafür wieder mit, statt fest über der Leiste zu
stehen; die Begründung dieser Rücknahme steht im Quelltext bei `ColophonLine`.

### Die Pille fährt — und der Inhalt wartet nicht

Gemessen wurde die linke Kante der Pille (63 = linkes Segment, 540 = rechtes),
mit derselben Abtastung wie bei N11:

| Lauf  | `animator_duration_scale` | Tipp                       | sofort gemessen     | Befund                       |
| ----- | ------------------------- | -------------------------- | ------------------- | ---------------------------- |
| m1    | **0**                     | → Einstellungen            | **540**             | sofort am Ziel — sie springt |
| m2    | **10**                    | → Start                    | **540**             | noch am Start — sie fährt    |
| m3    | 10                        | dieselbe Fahrt, 7 s später | **63**              | angekommen                   |
| s1–s3 | 10                        | drei Proben in Folge       | **540 → 422 → 250** | unterwegs                    |

Gleiche Abtastung, gegenteiliges Ergebnis: `animator_duration_scale = 0` ist die
Systemeinstellung „Animationen entfernen", und dass die Pille ihr folgt, ist die
native Entsprechung von `prefers-reduced-motion` — ohne eine eigene Abfrage.

**`n12-pille-unterwegs.png` zeigt die Hausregel „Tippen darf nicht warten" in
einem Bild:** Der Inhalt ist schon die Startseite (Code-Karte mit „Kopieren"),
Zeichen und Beschriftung „Start" sind schon in `--signal-text` — und die Pille
steht noch zwischen den Segmenten.

### Die Icon-Inventur

Ein Raster (24 dp), ein Strichgewicht (2 dp), runde Kappen und Ecken. Alle
Zeichen stehen seit N12 in `ui/Icons.kt`; die Aufrufer bestimmen nur noch Farbe
und Zeitverhalten.

| Zeichen                 | Vorher                        | Jetzt (Raster-Soll)              | Gemessene Tinte                 |
| ----------------------- | ----------------------------- | -------------------------------- | ------------------------------- |
| Zifferblatt (Leiste)    | 6 lange Striche, 1,4 dp, 22er | 12 Marken, Zeiger, Nabe; Ø 22 dp | **59 × 59 px = 22,5 dp**        |
| Zahnrad (Leiste)        | 8 Zähne, 1,65 dp, 22er        | 8 Zähne, Ring, Nabe; Ø 20,8 dp   | **55 × 55 px = 21,0 dp**        |
| Winkel (Fold-Zeile)     | 1,5 dp, stumpf, 16er          | 12 × 6 dp + Strich = 14 × 8 dp   | **37 × 21 px = 14,1 × 8,0 dp**  |
| Winkel (Auswahlfeld)    | 1,5 dp, stumpf, 16er          | dasselbe Zeichen                 | **39 × 22 px = 14,9 × 8,4 dp**  |
| Häkchen (Listbox)       | 1,5 dp, stumpf, 10er          | 12 × 9 dp + Strich = 14 × 11 dp  | **37 × 29 px = 14,1 × 11,0 dp** |
| Statuspunkt (2 Stellen) | zweimal 6 dp von Hand         | `Glyph.dot` = 6 dp, eine Stelle  | **16 × 16 px = 6,1 dp**         |
| Sucherwinkel            | 2 dp, stumpf, harte Ecke      | 2 dp, rund, Ecke als Bogen       | Schenkel 18 dp (unverändert)    |
| Zifferblatt am Code     | Marke, 30er-Teilung, stumpf   | **unverändert**                  | —                               |
| Wortmarke (beide O)     | Marke, exakte Geometrie       | **unverändert**                  | —                               |

Die letzten zwei Zeilen sind die Grenze des Systems: Das Zifferblatt neben dem
Code und die Wortmarke sind keine Zeichen, sondern die MARKE in Betrieb. Sie
behalten stumpfe Enden und die exakte Teilung — ein abgerundeter Strich auf
einer Skala ist eine ungenaue Angabe. Die Grenze läuft also zwischen ABLESEN
und BEZEICHNEN, nicht zwischen groß und klein.

**`n12-icons-100prozent.png`** zeigt jedes Zeichen bei 100 % und vierfach.

#### Warum das Start-Icon neu geschnitten werden musste

Vor dem Bauen sind acht Entwürfe bei 63 px (24 dp bei Dichte 420) und 90 px
(Dichte 600) gerendert und ANGESEHEN worden — die Frage „liest sich das als
Uhr?" beantwortet kein Quelltext. Der Befund war eindeutig:

- Lange radiale Striche werden klein IMMER zum Stern. Das war der Fehler der
  N11-Fassung (Strichlänge ein Drittel des Radius) und blieb es auch bei zwölf
  statt sechs Strichen.
- Ein blanker Ring liest sich als Uhr, verliert aber die Teilung der Marke.
- Zwölf KURZE Marken schließen sich im Auge zum Kreis und behalten die Teilung.

Geändert ist deshalb die ANZAHL (30 → 12), nicht die Proportion: Die Tinte
eines Strichs misst weiter 0,2 R wie `Dial.TICK_LENGTH` am großen Blatt. Dass
die gezeichnete Linie dabei nur 0,2 Raster-Einheiten lang ist, liegt an der
runden Kappe — sie trägt an jedem Ende eine halbe Strichbreite bei.

#### Warum das Zahnrad kleiner ist als das Zifferblatt

Weil es sonst größer WIRKT. Gemessen an der gedeckten Fläche des 24-dp-Kastens:
**Zifferblatt 10,1 %, Zahnrad 22,1 %** — ein Ring plus acht Zähne tragen doppelt
so viel Tinte wie zwölf Marken plus Zeiger. Der Außenkreis der Zähne endet
deshalb bei 10,4 statt 11,0 Einheiten, also 5 % enger. Am Gerät bestätigt sich
die Absicht: 22,5 dp gegen 21,0 dp.

Die Innengeometrie des Zahnrads ist ebenfalls nachgemessen (Spalte durch die
Mitte, x = 778): 15 px Zahn und Ring am Stück — die Zähne SITZEN auf dem Rand,
wie bei einem Zahnrad —, 9 px Luft, 7 px Nabe. Soll: 5,4 dp / 9,9 px / 2,4 dp.

### RTL

`n12-rtl-einstellungen.png`: Die Leiste spiegelt (Startseite rechts,
Einstellungen links), und die Pille steht unter dem RICHTIGEN Posten — die
N11-Lehre („physisch messen, physisch setzen") trägt auch die neue Geometrie.
Die Versionszeile steht weiter in Bidi-Isolation und liest sich als
`2.0.0-dev-debug (20000)`.

### Ketten

| Kette                                            | Ergebnis                                                   |
| ------------------------------------------------ | ---------------------------------------------------------- |
| `gradlew testDebugUnitTest`                      | **221 Tests, 0 Fehler** (unverändert)                      |
| `gradlew checkNoMaterial`                        | grün                                                       |
| Web: typecheck · Tests · Lint · Prettier · Build | grün, **560 Tests**                                        |
| `dist/clockwork.html`                            | **801.401 Byte, SHA-256 `175f4a8e…584e`** — byte-identisch |

**N12 bringt keine neuen Unit-Tests, und das ist keine Auslassung.** Was dieser
Posten ändert, ist Zeichengeometrie und Layout; beides prüft man am gezeichneten
Pixel, nicht auf der JVM (eine Compose-UI-Testkette gibt es in diesem Projekt
bewusst nicht). Der Beweis sind die gemessenen Aufnahmen oben.

Die Bündel-Prüfsumme ist trotzdem gelaufen, obwohl N12 keinen einzigen String
anfasst: Eine Zusage, die man nur prüft, wenn man mit einer Änderung rechnet,
ist keine.

### Ein Befund, der offen bleibt

Während des blinden Antreibens über `adb` ist die Tresordatei der **dev**-App
verschwunden (`files/vault.json`, zwischen zwei Starts). Nicht reproduziert und
nicht erklärt:

- Die einzige Löschstelle im Code ist `VaultController.wipe()`, und die hängt
  allein an der Gefahrenzone der Einstellungen-Seite — die zu diesem Zeitpunkt
  nicht offen war. Laden und Übernahme löschen nie.
- Der Lauf hat nachweislich Fehltreffer produziert: Im Protokoll steht ein
  Kamera-Client, den niemand geöffnet hat.

Hier steht deshalb keine Erklärung, sondern die Beobachtung. **Vor P9 gehört das
nachgestellt** — mit einem echten Tresor, kontrollierten Tipps und einem Blick
auf `files/` nach jedem Schritt.

---

## N13 — Feinschliff 2: die Leiste wird durchscheinend, die Pille eng

Kevins Vorgabe war die Tab-Leiste aus One UI 8.5: milchige Fläche, Inhalt
sichtbar darunter, Zeichen mit Beschriftung, und die aktive Wahl als kompakte
Hervorhebung eng um ihren Posten statt als segmentbreiter Block. Samsungs
starre Umschaltung ist ausdrücklich NICHT übernommen — die gleitende Pille
bleibt bei 250 ms auf der Federkurve des Hauses.

### Der Transluzenzgrad ist ausgerechnet, nicht gewählt

Dafür gibt es seit N13 `scripts/native-nav-contrast.mjs`. Es ist die Antwort
auf ein Problem, das N12 noch nicht hatte: Solange die Leiste deckte, stand
ihre Beschriftung auf genau einer bekannten Fläche. Seit sie durchscheint,
hängt ihr Untergrund davon ab, was gerade darunter scrollt — der Kontrast ist
keine Zahl mehr, sondern eine Schar von Zahlen.

Das Skript rechnet deshalb über ALLE Inhaltsfarben, die unter der Leiste
vorkommen können, statt über die eine, die man für die schlimmste hält.

**Dabei fällt die erste Annahme des Auftrags.** Dort steht als schlechtester
Fall „hellste Karte hell, dunkelste dunkel". Gemessen ist es umgekehrt: Im
Hellen ist die Leiste fast weiß und ihre Schrift dunkel — eine weiße Karte
darunter ändert also nichts, sie ist der BESTE Fall. Weh tut die Code-Ziffer
in `--ink`, die die Leiste abdunkelt. Im Dunkeln steht es spiegelbildlich. Die
Regel lautet nicht „hell/dunkel", sondern: der Inhalt, der die Leiste in
Richtung ihrer eigenen Schriftfarbe zieht.

**Der zweite Befund war unbequemer.** Der erste Entwurf ließ auch die
Aktiv-Pille durchscheinen. Die Schwellenrechnung (`--sweep`) hat ihn verworfen:

| Messpunkt                             | hält bis … Deckung, hell | dunkel     |
| ------------------------------------- | ------------------------ | ---------- |
| Beschriftung inaktiv, `--ink-3`       | 90 %                     | 87 %       |
| Beschriftung inaktiv, `--ink-2`       | **76 %**                 | **76 %**   |
| Beschriftung aktiv, Pille transluzent | 90 %                     | 90 %       |
| Beschriftung aktiv, Pille deckend     | unbegrenzt               | unbegrenzt |

Der aktive Posten war der engste Punkt der ganzen Leiste — und zwar bei genau
dem Grad, bei dem von „frosted" nichts übrig bleibt. Der Grund liegt in der
Auslegung von `--signal-text`: Die Farbe hält auf den vier Hausflächen GERADE
4,5:1 und hat keine Reserve, die man an Transluzenz verfüttern könnte.

Daraus zwei Entscheidungen, beide ausgerechnet:

1. **Die Pille ist deckend** — `--signal-soft` auf `--surface` vorgemischt.
   Damit ist der Untergrund des aktiven Postens eine Konstante, und er kann
   durch nichts unlesbar werden, was darunter vorbeiläuft. Das ist zugleich
   das Verhalten der Referenz: Samsungs „circular highlight" ist eine gedeckte
   Fläche, kein Schleier.
2. **Die inaktive Beschriftung steigt von `--ink-3` auf `--ink-2`.** `--ink-3`
   hält auf `--surface` 5,53:1, hat also 1,03 Reserve — zu wenig. Die Regel
   dahinter ist alt: Im Web trägt Text auf dem GEHÄUSE `--ink-2` und nur Text
   auf einem PANEL `--ink-3`. Eine Leiste, durch die beliebiger Inhalt
   scheint, ist der Gehäusefall in seiner unangenehmsten Form — ihr Untergrund
   steht nicht einmal fest.

Genommen sind **82 %**: sechs Punkte über der Schwelle. Die Prüfung mit
diesem Wert:

| Messpunkt            | hell       | dunkel     | schlechtester Fall                |
| -------------------- | ---------- | ---------- | --------------------------------- |
| Beschriftung inaktiv | **5,28:1** | **5,74:1** | `--ink` unter der Leiste          |
| Beschriftung aktiv   | **5,50:1** | **6,02:1** | deckende Pille, inhaltsunabhängig |
| Zeichen inaktiv      | 5,28:1     | 5,74:1     | (Mindestmaß 3:1)                  |
| Zeichen aktiv        | 5,50:1     | 6,02:1     | (Mindestmaß 3:1)                  |

**Gegenprobe gelaufen:** `--gegenprobe` rechnet dieselben acht Punkte mit 50 %
Deckung; vier davon reißen, bis hinunter auf 1,95:1. Eine Messung, die nicht
durchfallen kann, misst nichts — dieselbe Lehre, die dieses Projekt beim
APK-Vergleich teuer bezahlt hat.

### Am Pixel nachgemessen (S24 Ultra, Dichte 600, 1 dp = 3,75 px, dunkel)

| Was                   | gemessen               | in dp    | Soll        |
| --------------------- | ---------------------- | -------- | ----------- |
| Karte, Höhe           | y 2786 … 3018 = 233 px | **62,1** | 62          |
| Karte, Rand seitlich  | x 60 … 1379            | **16,0** | `--sp-4`    |
| Pille, Höhe           | y 2816 … 2988 = 173 px | **46,1** | 46 (Inhalt) |
| Polster Karte → Pille | 30 px, oben wie unten  | **8,0**  | `--sp-2`    |
| Haarlinie             | 4 px                   | **1,07** | 1           |

**Die Transluzenz ist am Pixel belegt, nicht behauptet:** Die Kartenfläche
über dem Grund misst **#151517**. Eine deckende Leiste wäre `--surface`, also
#18181b. Der Rechenwert für `--surface` mit 82 % über `--ground` ist
#151517 — auf den Kanalwert genau. Ebenso die Pille: gemessen **#32201d**,
gerechnet #32201d.

**Die Radien sind konzentrisch, und zwar durch den Bau statt durch zwei
ausgerechnete Zahlen:** Kartenradius 31,05 dp, Pillenradius 23,05 dp,
Differenz 8,0 dp = das Polster. Die Kartenhöhe IST die Pillenhöhe plus zweimal
Polster.

**Die Pille sitzt auf ihrem Segment:** Segmentmitten bei x = 405 und 1035,
Pillenmitte 404,5.

### Die Pillen sind gleich groß — Kevins Befund, und er hat recht

Der erste N13-Entwurf ließ jede Pille genau ihren eigenen Inhalt umschließen.
Das ist die wörtliche Lesart von „eng um Icon und Beschriftung", und am Gerät
war sie falsch: Die Beschriftungen messen **27,2 dp** („Start") gegen
**76,5 dp** („Einstellungen"), die Pillen also 51,2 gegen 100,5 dp. Kevins
Urteil aus der Spiegelung: „warum sind da Größenunterschiede, muss gleich
sein."

Zwei gleich breite Posten mit zwei verschieden großen Hervorhebungen sehen aus
wie ein Fehler, nicht wie ein System. Das Maß gibt seither der **breiteste**
Inhalt vor, und alle tragen es — abgeleitet aus derselben Messung:
76,5 + 2 × 12 = **100,5 dp** für beide. Die Pille bleibt damit kompakt (sie
umschließt die längste Beschriftung eng), ohne dass ihre Größe davon erzählt,
wie lang ein Wort zufällig ist; in einer anderen Sprache verschiebt sich das
Maß mit, weil gemessen und nicht gerechnet wird.

Nebenwirkung, und eine gute: Die Fahrt hat nur noch EINE Spur. Der Cursor
fährt im Ort, seine Breite steht fest.

### Was die Leiste nicht mehr aus einer Konstanten holt

`navOverlayHeight` ist weg. Die Höhe der Leiste kommt seit N13 aus ihrem
Inhalt — Zeichen, Beschriftung, Vorschub —, und bei Schriftskala 1,5 wächst
sie mit. Eine Konstante hätte dann zu wenig freigehalten, und die letzte Karte
wäre unter der Leiste steckengeblieben: genau der Fehler, den N12 für die
Normalgröße behoben hat. Die Bühnen messen ihr unteres Polster jetzt mit
`onSizeChanged` — dasselbe Werkzeug, mit dem der Kopf oben schon gemessen
wird, und aus demselben Grund.

### Zwei Fehler, die dieser Posten gefunden hat

**1. Die Tastatur legte sich über die Bühne.** Kevins zweiter Befund aus der
Spiegelung, und der ältere von beiden — er steckt seit P5 im Code. Beim Tippen
verschwindet das Feld unter der Tastatur, und die Tastenzeile darunter ist gar
nicht mehr zu erreichen.

Die Ursache ist eine Kombination, die einzeln jeweils richtig aussieht:
`MainActivity` ruft `enableEdgeToEdge()`, und damit hört das Fenster auf, sich
bei geöffneter Tastatur zu VERKLEINERN — das `adjustResize` im Manifest greift
nur, solange das Fenster die Systemleisten selbst einrechnet. Stattdessen
meldet die Plattform den Einzug, und die App muss ihn anwenden. Sie tat es
nirgends: `imePadding` kam im ganzen Quelltext nicht vor.

Zwei Dinge gehören dazu, und keines allein reicht — die Bühne bekommt
`imePadding()`, damit ihr Sichtfenster wirklich kürzer wird (nur dann kann
Compose ein fokussiertes Textfeld in den Blick scrollen), und das untere
Polster fällt weg, solange die Tastatur steht: Die schwebende Leiste liegt dann
hinter ihr, und Platz für etwas freizuhalten, das man nicht sieht, ergäbe eine
Lücke von 74 dp über der Tastatur.

**2. Der Fokusring umschloss das ganze Segment.** Bis N13 war das richtig, weil
die Hervorhebung ebenso breit war. Mit der kompakten Pille sah es am Gerät aus
wie ein Defekt: ein orangefarbener Ring um die halbe Leiste, in dem eine
kleine Pille sitzt. Er hängt jetzt am Pilleninhalt.

Aufgelöst nach derselben Trennung, die auch die Pille begründet: Was man
TRIFFT, bleibt das ganze Segment — die `selectable`-Zone ist unverändert. Was
man SIEHT, ist genau. Ein Fokusring ist etwas, das man sieht.

### Geprüft und verworfen

Zwei Punkte aus dem Auftrag sind bewusst NICHT gebaut. Beide stehen mit
Begründung und Messwerten in
[`../geprueft-und-verworfen.md`](../geprueft-und-verworfen.md):

- **echter Backdrop-Blur** — Abhängigkeitsregel, falsche Ebene (der
  Fenster-Weichzeichner meint das, was hinter dem FENSTER liegt), und im
  Eigenbau ein Doppel-Rendering des ganzen Scrollinhalts in jedem Bild;
- **Verlaufsabblendung zur Unterkante** — an der Kontrastmessung gescheitert.
  Schon ein Viertel Schleier drückt `--ink-3` auf 3,34:1 (hell), die Hälfte
  drückt den Code selbst auf 3,46:1. Es gibt keinen Grad, der gleichzeitig
  wirkt und AA hält.

### Ketten

| Kette                                     | Ergebnis                                                   |
| ----------------------------------------- | ---------------------------------------------------------- |
| `gradlew testDebugUnitTest --rerun-tasks` | **221 Tests, 0 Fehler** (unverändert)                      |
| `gradlew checkNoMaterial`                 | grün                                                       |
| `node scripts/native-nav-contrast.mjs`    | **8 Messpunkte grün**, Gegenprobe fällt durch              |
| Web: typecheck · Tests · Build            | grün, **560 Tests**                                        |
| `dist/clockwork.html`                     | **801.401 Byte, SHA-256 `175f4a8e…584e`** — byte-identisch |

Keine neuen Unit-Tests, wie schon bei N12: Was dieser Posten ändert, ist
Geometrie und Farbmischung. Geprüft wird beides — nur eben von einem Skript,
das rechnet, und am Pixel, nicht auf der JVM.

### Was an Beweisen offen bleibt

Der Auftrag verlangt zusätzlich Bilder in hell UND dunkel mit buntem Inhalt
sichtbar unter der Leiste, die Pillenfahrt am Gerät gemessen und den
Compositor-Ruhezustand. **Kevin hat den Lauf am Gerät abgebrochen** („brauchst
keine Tests machen") und sieht sich den Build selbst an — seit diesem Posten
über eine Bildschirmspiegelung am Desktop. Die Bilder fehlen deshalb. Was oben
steht, ist gemessen und gilt; es ist nur nicht alles, was der Auftrag
aufzählt.

---

## N14 — Feinschliff 3: der Detail-Pass

Der Auftrag nannte fünf Blöcke. Was daraus wurde, ist mehr: Kevin hat den Build
während des Laufs live in einer **Bildschirmspiegelung** mitgesehen und Punkt
für Punkt nachgereicht. Die Reihenfolge unten ist die des Auftrags; was aus der
Sichtung dazukam, steht am Ende jedes Blocks.

### 1. Systemleisten-Schutz

**Reproduziert, und die Ursache war nicht die vermutete.** `systemBarsPadding()`
stand längst im Code, die Bühne begann also unter der Statusleiste, und
gescrollter Inhalt konnte gar nicht dorthin. Der Fehler saß woanders:

Der Kopf wird beim Verstauen (M1) mit `Modifier.offset` nach oben GESCHOBEN —
und ein Versatz clippt nichts. Er zeichnet weiter, auch über der Polsterkante.
Am S24 nachgemessen: Die Zustandszeile („Offline · nichts gespeichert") stand
neben der Systemuhr.

**Behoben nach dem Edge-to-Edge-Muster der Plattform**, also nicht durch
Beschneiden der Bewegung, sondern durch Abdecken der Systemzone: Ein deckender
Streifen in `--ground`, genau so hoch wie der Statusleisten-Einzug
(`windowInsetsTopHeight`), liegt als LETZTES Kind über allem. Der Kopf fährt
dahinter und ist weg, ohne dass seine Fahrt eine Sonderregel braucht.

Dafür trägt die äußere Box kein Polster mehr; das sitzt jetzt an einer inneren.
Unten bleibt es beim Gesten-Inset, das `systemBarsPadding()` ohnehin abzieht —
gemessen in N13: 101 px unter der Karte = 12 dp Rand plus 56 px Systemleiste.

### 2. Die Abblendung ist Pflicht geworden

N13 hatte sie an der Kontrastmessung verworfen. N14 dreht das um, und die
Begründung samt der Rechnung, die weiterhin gilt, steht in
[`../geprueft-und-verworfen.md`](../geprueft-und-verworfen.md).

Gebaut ist sie als Verlauf über der Bühne und unter der Leiste: Anlauf
`--gap-group` (24 dp), deckend ab der Leistenoberkante. Die Höhe kommt aus der
GEMESSENEN Leistenhöhe, nicht aus einer Konstanten — sonst stimmte sie bei
Schriftskala 1,5 nicht mehr.

**Die Deckung der Leiste steigt auf 90 %** (N13: 82 %). Nicht wegen der
Rechnung — die erlaubt 76 % —, sondern wegen des Auges: Kevins Befund lautet,
dass Transluzenz ohne Weichzeichner nicht milchig wirkt, sondern kaputt.

Die strenge Prüfung bleibt trotzdem auf der ganzen Inhaltsliste stehen und
wird nicht auf „ist ja abgeblendet" verkürzt. Fällt die Abblendung irgendwann
weg, soll die Leiste immer noch lesbar sein — und die Prüfung es merken.

| Messpunkt bei 90 %   | hell        | dunkel      |
| -------------------- | ----------- | ----------- |
| Beschriftung inaktiv | **6,30:1**  | **7,56:1**  |
| Beschriftung aktiv   | **14,73:1** | **14,52:1** |
| Zeichen inaktiv      | 6,30:1      | 7,56:1      |
| Zeichen aktiv        | 5,46:1      | 5,81:1      |

Gegenprobe unverändert: Bei 50 % Deckung reißen vier der acht Punkte.

### 3. Das Start-Zeichen, Schnitt v3 — und v4

Der Auftrag verlangte „geschlossener Ring, kräftiger Zeiger, höchstens vier
Ticks". Gebaut wurde zuerst genau das. Kevins nächste Ansage in der Spiegelung
war weitergehend: **„die Icons würde ich von Google Design nehmen, aus der
Library, also das Material 3."**

Also die Geometrie von **Material Symbols `schedule`**: geschlossener Ring,
ZWEI Zeiger verschiedener Länge auf 12 und 4, **keine Teilstriche**. Das ist
der eigentliche Fix — der Grund, warum das Zeichen dreimal als Stern gelesen
wurde, ist nicht die ANZAHL der Marken, sondern ihre Natur: Ein Ring aus
einzelnen Strichen IST ein Stern, solange das Auge die Lücken sieht.

**Die Bibliothek gehört trotzdem nicht dazu.**
`androidx.compose.material:material-icons-*` zöge `androidx.compose.material`
in den Klassenpfad, und `gradlew checkNoMaterial` verbietet das seit P0 mit
einem eigenen Dauertest. Übernommen ist die FORM (Apache-2.0, frei),
gezeichnet mit den Mitteln des Hauses: 24er-Raster, 2 dp, runde Kappen.

**Das Zahnrad war danach der schlechtere Nachbar** („sieht überhaupt nicht gut
aus"). Es bestand aus einem gestrichelten Kreis und acht radialen Strichen —
derselbe Fehler wie beim Zifferblatt. Jetzt ist es EIN geschlossener Pfad, der
zwischen zwei Radien wechselt: acht Zähne auf 9,0 Einheiten, Rumpf auf 6,4,
schräge Flanken, runde Fügung, und ein RING als Bohrung statt einer gefüllten
Nabe. Ein Zahnrad ohne Loch ist ein Sägeblatt.

### 4. Die Passphrase-Zeile ist gestapelt

Feld und Taste standen in EINER Zeile; auf dem S24 ergab das ein gestauchtes
Feld neben einer breiten Taste. Jetzt das Mobil-Muster der Web-Fassung:
Beschriftung, Feld in voller Breite, Haupthandlung in voller Breite darunter
mit `--control-h-lg` (44 dp). Gilt für beide Zustände.

Der Grund ist nicht Geschmack, sondern die Zeichenzahl: Eine Passphrase ist
länger als ein Tastenwort, und ein Feld, das die Hälfte davon zeigt, lässt
einen Tippfehler nicht finden.

### 5. Was aus der Spiegelung dazukam

**a. Die zwei Fold-Karten waren zu hoch.** 24 + 44 + 24 = **92 dp für eine
einzige Textzeile.** Das liest sich nicht als Zeile, sondern als leerer Kasten
mit Beschriftung. Die 44 dp sind nicht verhandelbar (Trefferfläche), das
Polster schon: `--sp-2` oben und unten ergibt **60 dp**. Seitlich bleibt es
beim Gruppenmaß, damit die Zeile mit den Nachbarkarten fluchtet.

**b. Tasten tragen Zeichen.** Kopieren, QR aus Bild, Kamera, Testschlüssel —
vier neue Glyphen im 24er-Raster, in der Taste auf 20 dp. Wo KEINES steht, ist
das eine Entscheidung: „Zusperren" und „Neu speichern" bleiben ohne, weil jedes
Schloss-Zeichen dort raten ließe, welcher der beiden Zustände gemeint ist.

**c. Alles reagiert auf Berührung**, auf `--dur-quick` (150 ms) mit der
Federkurve:

| Bauteil                    | Ruhe             | berührt                                         |
| -------------------------- | ---------------- | ----------------------------------------------- |
| Navigationsposten, inaktiv | durchsichtig     | `--surface-active`                              |
| Navigationsposten, aktiv   | Pille            | `--fill-active`                                 |
| Textfelder                 | `--surface-fill` | `--fill-active` — am FOKUS                      |
| Fold-Zeilen                | durchsichtig     | `--surface-active`                              |
| Code-Ziffern               | durchsichtig     | `--surface-active`                              |
| Tasten                     | Füllung          | gedrückte Tönung, jetzt fahrend statt springend |

Bei den Feldern hängt es am Fokus und nicht am Druck: Ein Feld wird nicht
gedrückt, sondern beschrieben — und die ganze Zeit soll man sehen, wohin die
Tastatur tippt. Das ist auch die Web-Regel (`:focus-within`).

**d. Die Leiste nach Samsung-Vorbild, zweiter Durchgang.** Kevin hat drei
Aufnahmen aus Telefon und Kontakte geschickt. Daraus übernommen:

- **Die Aktiv-Pille ist NEUTRAL** (`--surface-active`), die Beschriftung steht
  in `--ink`. Vom Akzent bleibt das ZEICHEN des aktiven Postens. Das war
  Kevins Wahl aus drei vorgelegten Varianten.
- **Keine Umrandung mehr.** N13 hatte eine Haarlinie, weil die Leiste bei 82 %
  über einer weißen Karte verschwand. Mit der Abblendung ist ihr Untergrund
  verlässlich `--ground`, der Anlass also entfallen — und Samsungs Leiste hat
  gar keine Kante, sie trennt sich allein durch ihre Fläche.
- **Die Leiste umschließt ihre Posten** statt randbreit zu laufen. In Kevins
  Bildern misst sie rund 60 % der Fensterbreite. Die seitlichen 16 dp sind
  seither ein Mindestabstand und kein Rand an einem Balken.
- **Kartenpolster von `--sp-2` auf `--sp-1`** — die Pille füllt die Karte fast
  aus, wie im Vorbild.

**e. Die Kopier-Quittung war eine Paritätslücke.** `key.copyDone` liegt seit
V11 in allen 37 Sprachen im Katalog, die Ressourcen lagen fertig im Baum, und
`strip.ts` fährt den Wortwechsel — nativ fehlte er schlicht. Jetzt steht
**1,6 s lang „Kopiert"** in der Taste (Eintritt 250 ms aus 8 dp und 80 %
Größe, Rückweg nur ein Ausblenden über 150 ms — alle drei Zahlen aus
`strip.ts`), und die **Nabe des Zifferblatts** trägt so lange den Akzent,
wörtlich nach `.strip--copied .dialface__hub` in `mark.css`.

Dazu eine bewusste ABWEICHUNG von der Web-Fassung: **Die Ziffern kopieren
selbst.** Dort steht die Maus vor einer Taste; hier geht der Daumen zuerst auf
die größte Fläche der Karte. Die Taste bleibt trotzdem — sie ist die
BESCHRIFTETE Handlung, und ein Screenreader liest „Kopieren, Schaltfläche"
statt „988 925".

**f. Die Zeichen bewegen sich nach ihrer eigenen Mechanik.** Kevins Ansage:
„eine physikalische Logik, wenn man drauf klickt."

| Zeichen | beim Tippen                        | warum genau das                                                                       |
| ------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| Uhr     | langer Zeiger 360°, kurzer **30°** | das Übersetzungsverhältnis einer echten Uhr: eine Stunde je Umlauf des Minutenzeigers |
| Zahnrad | **45°**                            | 360 / 8 Zähne — die kleinste Drehung, nach der wieder Zahn auf Zahn steht             |

Beide laufen **dieselbe Zeit**, obwohl das eine 360° zurücklegt und das andere
45: So verhalten sich gekoppelte Räder. Gleiche Winkelgeschwindigkeit wäre die
unphysikalische Variante.

Die Dauer ist **`--dur-spin` (750 ms)**, und das ist keine beliebige größere
Zahl: Es ist die Dauer, die dieses Projekt für genau eine Umdrehung schon
kennt — der Wartezeiger dreht sich in ihr einmal herum. Der erste Anlauf nahm
`--dur-sheet` (350 ms); Kevins Urteil am Gerät: zu schnell. Eine volle
Umdrehung in 350 ms ist ein Schnappen, keine Bewegung, die man verfolgen kann.

Ausgelöst wird sie bei JEDEM Tipp, auch auf den schon gewählten Posten — ein
Uhrwerk läuft auch dann weiter, wenn man es zweimal anstößt. Der generische
Größensprung aus dem ersten Entwurf ist dafür entfallen: Zwei Bewegungen
übereinander wären Lärm, und die mechanische ist die bessere.

### Ein Fehler, der seit P5 im Code lag

**Die Tastatur legte sich über die Bühne.** `MainActivity` ruft
`enableEdgeToEdge()`, und damit hört das Fenster auf, sich bei geöffneter
Tastatur zu VERKLEINERN — das `adjustResize` im Manifest greift nur, solange
das Fenster die Systemleisten selbst einrechnet. Stattdessen meldet die
Plattform den Einzug, und die App muss ihn anwenden. `imePadding` kam im ganzen
Quelltext nicht vor; das Textfeld verschwand unter der Tastatur, und die
Tastenzeile darunter war gar nicht erreichbar.

Zwei Dinge gehören dazu, und keines allein reicht: Die Bühne bekommt
`imePadding()` (nur dann kann Compose ein fokussiertes Feld in den Blick
scrollen), und das untere Polster fällt weg, solange die Tastatur steht — die
schwebende Leiste liegt dann hinter ihr, und Platz für etwas freizuhalten, das
man nicht sieht, ergäbe eine Lücke von 74 dp über der Tastatur.

Gefunden hat es Kevin an der Spiegelung, nicht der Bau.

### Was NICHT gemacht wurde, und warum

Aus Block 5 des Auftrags sind **a, b, c, e, g offen**: Leerzustand-Ausrichtung
gegen die Web-Mobil-Fassung, Kopf-Abstände, Karten-Titel der
Einstellungen-Seite, Chevron-Drehung verifizieren, Chip- und
„folgt"-Zeilen-Maße gegen die Token. Der Lauf ist stattdessen Kevins
Live-Liste gefolgt — seine Punkte kamen während der Arbeit herein und waren
durchweg gewichtiger als die Restpunkte.

**Punkt d ist beantwortet, aber anders als gedacht:** `versionName` steht auf
`"2.0.0-dev"`. Das `-dev` steckt NICHT im Debug-Suffix, sondern im Namen
selbst; ein Release-Build zeigte damit „2.0.0-dev (20000)". Für v2.0.0 muss
das raus — eingetragen in die Release-Checkliste, nicht eigenmächtig geändert.

**Punkt f** (dunkler Label-Kontrast über durchscheinendem Inhalt) ist von
`native-nav-contrast.mjs` erledigt: 7,56:1 im schlechtesten Fall.

### Ketten

| Kette                                  | Ergebnis                                                   |
| -------------------------------------- | ---------------------------------------------------------- |
| `gradlew testDebugUnitTest`            | **221 Tests, 0 Fehler** (unverändert)                      |
| `gradlew checkNoMaterial`              | grün                                                       |
| `node scripts/native-theme-check.mjs`  | **92 Werte** deckungsgleich                                |
| `node scripts/native-nav-contrast.mjs` | 8 Messpunkte grün, Gegenprobe fällt durch                  |
| Web: typecheck · Tests · Build         | grün, **560 Tests**                                        |
| `dist/clockwork.html`                  | **801.401 Byte, SHA-256 `175f4a8e…584e`** — byte-identisch |

Keine neuen Unit-Tests, wie schon in N12 und N13: Was diese Posten ändern, ist
Geometrie, Farbmischung und Bewegung. Geprüft wird das von Skripten, die
rechnen, und am Pixel — nicht auf der JVM.

### Was an Bildbeweisen fehlt

Der Auftrag verlangt je Punkt ein Bild in `docs/abnahme/`. Sie fehlen: Kevin
hat den Build während des ganzen Laufs selbst in der Spiegelung geprüft und
seine Befunde direkt genannt, und ab dem Punkt, an dem er das Gerät mitbedient
hat, sind meine eigenen Messungen dort unbrauchbar geworden — zwei Hände auf
demselben Telefon ergeben keinen reproduzierbaren Messaufbau. **P9 fotografiert
den Endstand ohnehin; die Bilder gehören dorthin.**

Was in diesem Abschnitt an Zahlen steht, ist gemessen: am Pixel (N13-Geometrie,
unverändert gültig), im Kontrastskript und in den Ketten.

---

## N15 — Der Niveau-Pass

Zehn Punkte in der Reihenfolge des Auftrags. Zwei Dinge vorweg, weil sie das
ganze Kapitel prägen:

**Der Auftrag lag nicht in `PROMPT-KOTLIN.md`.** Die Datei endet mit N14; der
Nachtrag 4 ist nur als Nachricht gekommen. Gebaut ist deshalb nach Kevins
Aufzählung — zehn Punkte, in seiner Reihenfolge. Standen dort gemessene
Sollwerte, die die Nachricht nicht nennt, fehlen sie hier.

**Ab Punkt 5 hat Kevin das Gerät selbst bedient** („testen musst du nicht das
mache ich selber"). Die Messungen bis dahin sind meine, die danach fehlen — und
das ist keine Auslassung, sondern die N14-Lehre: Zwei Hände auf demselben
Telefon ergeben keinen reproduzierbaren Messaufbau. Was fehlt, steht am Ende
dieses Abschnitts.

### 1. Die Popover-Baustelle

Vier Fehler, alle an derselben Wurzel: Das Popover war ein freistehender Kasten
mit geratenen Zahlen statt eines Aufsatzes auf seinem Auslöser.

| Was           | Vorher                         | Jetzt                                                             |
| ------------- | ------------------------------ | ----------------------------------------------------------------- |
| Verankerung   | Geschwister der Spalte im Baum | im Trigger selbst, eigener Positionsgeber mit Umklappen nach oben |
| Breite        | Konstante 240 dp / 200 dp      | die GEMESSENE Triggerbreite (`inset-inline: 0`)                   |
| Höhe          | Konstante 320 dp / 200 dp      | `min(60 vh, 22 rem)`                                              |
| Kante         | keine                          | hell `--elev-2`-Schatten, dunkel eine Sprosse heller              |
| Kantenzeichen | keines                         | Maske wie `mask-image` im Web, und nur wo etwas verborgen liegt   |

**Am Pixel, S24 Ultra, Dichte 600 (1 dp = 3,75 px), dunkel:**

- **Breite 1260 px = 336 dp** — und die Karte, in der die Zeile sitzt, ist
  1440 − 2 × 90 = 1260 px breit. Nicht „ungefähr gleich", sondern dieselbe Zahl.
  Im hellen Modus dasselbe Maß, unabhängig gemessen.
- **Höhe 1380 px = 368 dp** = 352 dp Deckel + 2 × 8 dp Polster. Der
  60-%-Deckel greift auf diesem Gerät nicht (832 dp × 0,6 = 468 dp), der
  22-rem-Deckel greift — genau so ist `min()` gemeint.
- **Zeitschaltung: 555 px = 148 dp** = 3 Zeilen × 44 dp + 2 × 8 dp. Ein Popover
  mit drei Einträgen ist so hoch wie drei Einträge; der Deckel ist eine Grenze
  und kein Maß.
- **Die Maske steht nur da, wo sie etwas tut.** Im Sprach-Popover (37 Zeilen) ist
  die letzte Zeile abgeblendet, die erste nicht: „Español" misst am Stamm volle
  Tinte `#fcfcfc`, „Français" 120 px weiter unten nur noch `#b7b7b8` — hell
  dasselbe Bild, dort `#18181b` gegen `#6e6e70`. Im Zeitschaltungs-Popover ist
  die letzte Zeile volle Tinte: Es liegt nichts verborgen, also gibt es keine
  Kante.
- **Die Kante hell** ist der Schatten: unter der Unterkante messbar als
  `#fcfcfc` → `#fdfdfd` → `#fefefe` über 65 px Auslauf.

**Die Optionen der Zeitschaltung sind gegen das Web gemessen**, nicht gegen die
Erinnerung: `index.html` hat drei `<option>` (60000, 300000 mit `selected`,
900000), `LockSettings.TIMEOUT_CHOICES` hat dieselben drei Werte, und am Gerät
steht „1 Minute · 5 Minuten · 15 Minuten" — die Mehrzahlformen kommen aus dem
Katalog und stimmen im Singular wie im Plural. **Keine Abweichung.**

Bilder: `n15-1-popover-dunkel.png`, `n15-1-popover-hell.png`,
`n15-1-zeitschaltung-dunkel.png`, `n15-1-zeitschaltung-hell.png`.

#### Die dunkle Kante ist noch im Lauf zurückgenommen worden

Der erste Anlauf setzte `--elev-2` wörtlich um: dunkel `inset 0 0 1px rgb(255
255 255 / 30%)`. Gemessen waren das **4 px in `#5e5e60`** — die Rechnung für Weiß
30 % auf `#18181b` gibt `#5d5d5f`, also auf zwei Stellen genau.

Kevins Urteil an der Spiegelung: „die fette Umrandung brauche ich nicht beim
Darkmode." Er hat recht, und die Zahl sagt warum: 1 dp sind auf diesem Gerät
vier Pixel in einem Ton zwischen Fläche und Text. Das liest sich als Rahmen, und
Rahmen hat dieses Gerät seit V9 keine mehr.

Die Aufgabe blieb — ein Popover auf `--surface` über einer Karte auf `--surface`
hat gar keine Kante. Gelöst ist sie jetzt mit dem Mittel, das dieses Haus im
Dunkeln ohnehin benutzt: **die nächste Sprosse der Flächenleiter**
(`--surface-fill`, #27272a auf #18181b). Am Panel steht die Regel wörtlich —
„dunkel NICHTS, dort trennt allein die Helligkeit" —, und die Leiste unten macht
es seit N14 genauso: Kante weg, Fläche trägt.

Das Bild `n15-1-popover-dunkel.png` zeigt noch die verworfene Fassung. Es bleibt
liegen, weil es die Messung belegt, aus der die Entscheidung folgt.

### 2. Die Einstellungen sind Listenzeilen

Vorher gestapelte Web-Struktur: ein Auswahlfeld mit Beschriftung darüber,
darunter drei Schalter mit der Bahn VOR dem Wort. Das ist die Anordnung eines
Formulars. Eine Einstellungsseite wird aber nicht ausgefüllt, sondern
durchsucht — man will EINEN Posten finden, seinen Wert sehen und ihn ändern.

Neu ist ein Bauteil, `ListRow`: Beschriftung links, Wert und Bedienelement
rechts, Trefferfläche über die ganze Kartenbreite, Haarlinie zwischen den
Zeilen. Die Karte trägt dafür kein waagerechtes Polster mehr — das bringen die
Zeilen mit, damit ihre Berührungsfläche bis zur Kartenkante reicht.

**Kein neues Maß und keine neue Farbe:** 44 dp Trefferfläche (`--touch-min`),
`--gap-group` Einrückung, `--t-small` in `--ink`, Beschreibung `--t-micro` in
`--ink-3`, Wert in `--ink-2`, Berührung `--surface-active` in 150 ms.

**Am Gerät nachgemessen** (aus dem Ansichtsbaum, nicht geschätzt): Der Text jeder
Zeile beginnt bei x = 180 px = 48 dp — 24 dp Seitenrand der Seite plus 24 dp
Einrückung der Zeile. Die Werte stehen rechts davon („Sprache · Deutsch",
„Sperrt automatisch nach · 5 Minuten"), der Winkel schließt die Zeile ab. Die
Haarlinie misst **4 px in `#212124`** (dunkel) beziehungsweise `#e4e4e7` (hell) —
beides `--rule` auf den Kanalwert.

**Der Schalter steht jetzt am Zeilenende.** Das ist eine STRUKTUR-Abweichung und
von N11a gedeckt; am Bauteil ändert sich nichts (40 × 20, Daumen 22 × 16, Weg
14, 250/300 ms, Bahn im Akzent).

Bilder: `n15-2-listenzeilen-dunkel.png`, `n15-2-listenzeilen-hell.png`.

### 3. Das Haptik-Konzept

Neu ist `ui/Haptics.kt` — eine Stelle, eine Regel:

> **Haptik quittiert einen ZUSTANDSWECHSEL, nicht eine Berührung.**

Das ist die haptische Fassung von „genau ein Akzent, nur für Zustände mit
Bedeutung". Eine App, die bei jedem Tipp brummt, hat ihr lautestes Mittel an das
häufigste Ereignis verschwendet. Wer eine Taste drückt, SIEHT die Fläche
umkehren und das Nachgeben (N14) — das ist die Rückmeldung für die Berührung.

| Wo                             | Wirkung                    | Warum                                                |
| ------------------------------ | -------------------------- | ---------------------------------------------------- |
| Code kopiert                   | `CONFIRM`                  | der Blick liegt danach im fremden Anmeldefeld        |
| QR erkannt                     | `CONFIRM`                  | der Blick liegt auf dem Motiv, nicht am Schirm       |
| Tresor auf / versiegelt        | `CONFIRM`                  | ein Vorgang mit Wartezeit endet                      |
| Passphrase falsch              | `REJECT`                   | die einzige ertastbare Fehlermeldung                 |
| Tresor zugesperrt              | Rastung                    | Zustandswechsel ohne Ergebnis                        |
| Schalter an / aus              | `TOGGLE_ON` / `TOGGLE_OFF` | zwei Richtungen, zwei Signale                        |
| Seitenwechsel, Wahl im Popover | Rastung                    | dieselbe Metapher wie das Zahnrad                    |
| „Alles löschen" scharf         | Schwellen-Wirkung          | die Schärfung ist der eigentliche Moment             |
| „Alles löschen" ausgeführt     | `REJECT`                   | unwiderruflich — darf sich nicht wie ein OK anfühlen |

Stumm bleiben Fold-Zeilen, Textfelder, „QR aus Bild" und der
Testschlüssel-Knopf.

**Zwei Entscheidungen, die dazugehören:** Der Weg läuft über
`View.performHapticFeedback` mit den Konstanten der Plattform und nicht über
`Vibrator` mit eigenen Millisekunden — eine Zahl, die auf genau einem Gerät
passt, wäre keine. Und er **gehorcht der Systemeinstellung**: Das Flag, mit dem
man sie übergehen könnte (`FLAG_IGNORE_GLOBAL_SETTING`), kommt nicht vor; es
wäre das haptische Gegenstück zum Ignorieren von `prefers-reduced-motion`.

Die feinen Wirkungen sind jung (`CONFIRM`/`REJECT` ab API 30,
`TOGGLE_*`/`SEGMENT_TICK` ab 34, minSdk ist 26). Die Abfrage steht deshalb nicht
gegen einen Absturz — die Konstanten sind `static final int` und werden beim
Kompilieren eingesetzt —, sondern damit auf Android 8 bis 13 überhaupt etwas zu
spüren ist.

**Kein Bildbeweis, und das ist keine Lücke, sondern die Natur der Sache:**
Haptik lässt sich nicht fotografieren. Nachprüfbar ist sie am Gerät über
`dumpsys vibrator_manager` (Wirkungs-Historie); diese Messung steht offen.

### 4. Der Marken-Splash

`androidx.core:core-splashscreen 1.2.0` — am 14.08. gegen die maven-metadata.xml
gemessen: `<release>` ist 1.2.0, alles darüber gibt es nur als alpha/rc. Sie
zieht `appcompat-resources` und `annotation` mit, kein Material —
**`gradlew checkNoMaterial` bleibt grün, nachgemessen.**

Das Zeichen ist NICHT neu gezeichnet: `scripts/native-icons.mjs` schreibt es aus
derselben Geometrie wie das Launcher-Icon (21 Hemmungszähne, Werkbrücke, Lager)
in zwei Fassungen — `drawable/splash_mark.xml` in `--ink` hell und
`drawable-night/splash_mark.xml` in `--ink` dunkel. Der Splash steht auf dem
SEITENGRUND und nicht auf der Icon-Fläche; Papier wäre im Hellen unsichtbar.

**Am Gerät belegt** (`n15-4-splash-dunkel.png`):

- Die Plattform führt für unser Paket ein eigenes Fenster:
  `Window{… Splash Screen io.github.keco216.clockwork.dev}` mit
  `ty=APPLICATION_STARTING`.
- Grund gemessen **`#060607`** — `--ground` dunkel, auf den Kanalwert.
- Das Zeichen ist **602 px = 160,5 dp** hoch. Das ist die Icon-Größe, die die
  Plattform für einen Splash ohne Icon-Hintergrund vorsieht — die Vorlage sitzt
  also richtig in ihrem Feld und wird nicht verzerrt. Die Breite ist kleiner,
  weil das C-Werk auf der rechten Seite sein Maul hat.

**Was am Bild zu erklären ist:** Der Splash ist kürzer als ein `screencap`.
Gehalten wurde er mit `am start -D` (Warten auf den Debugger) — deshalb steht der
Systemdialog „Waiting For Debugger" darin. Er ist ein Artefakt der MESSUNG und
nicht der App, und er dimmt das Fenster um etwa 4 % (Marke gemessen `#f1f1f1`
statt `#fcfcfc`, Lager `#e65626` statt `#f05a28`).

**Was ausdrücklich NICHT gebaut ist:** `setKeepOnScreenCondition`. Damit ließe
sich der Splash halten, bis die App „fertig" ist — und diese App hat nichts zu
laden. Einen Startbildschirm länger stehen zu lassen, als der Start dauert, wäre
eine erfundene Wartezeit; „Tippen darf nicht warten" gilt auch für den ersten
Tipp. Ebenso kein eigener Abgang: Den fährt die Plattform, und zwar so wie in
jeder anderen App des Geräts.

### 5. Die Kopier-Quittung ist ein Zustand

Bis N14 wechselte nur das WORT (und die Nabe des Zifferblatts). Das war die halbe
Web-Fassung: Dort ist `.strip--copied` eine KLASSE, also ein Zustand, an dem
mehrere Bauteile hängen — und ein Zustand hält, während eine Bewegung vergeht.

Drei Dinge halten jetzt die 1,6 Sekunden lang: das Wort, die **Haltefarbe** der
Taste und das **Häkchen** anstelle des Kopier-Zeichens. Das Häkchen ist dasselbe
Bauteil, das im Popover die gewählte Zeile markiert; es bringt seinen
250-ms-Eintritt aus `scale(.7)` selbst mit, weil es mit dem Zustand ENTSTEHT.

**Am Pixel (`n15-5-kopiert.png`):** Beschriftung und Häkchen messen `#f98b6a` =
`--signal-soft-ink` dunkel, auf den Kanalwert. Die Nabe des Zifferblatts misst
`#f4825c` = `--signal-text` dunkel, ebenfalls exakt. Die Tastenfläche misst
`#43261f`; die Rechnung für `--signal-soft` (12,2 % Orange auf `#18181b`) gibt
`#32201d` — die Aufnahme fiel in die noch laufende 150-ms-Farbfahrt, sie war bei
etwa 92 % der Strecke. Ein zweiter Anlauf auf den Endwert steht offen.

Das Tonpaar ist keines aus dem Nichts: `--signal-soft` auf `--signal-soft-ink`
ist genau der Akzent-Chip, den dieselbe Karte im Kopf schon trägt.

### 6. Die Karten treten ein

250 ms, 8 dp Weg, 20 ms Versatz je Karte — alle drei Zahlen sind schon im Haus
(`--dur-calm`, der Weg von `slot-value-in`, `--stagger-flap` von der
Fallblattanzeige). Die Web-Fassung hat keine Karten-Eintritte, und das ist kein
Versehen: Eine Seite im Browser ist einfach da. Nativ ENTSTEHT sie — hinter dem
Splash und bei jedem Seitenwechsel.

**Am Pixel, ein Bild mitten in der Fahrt (`n15-6-karten-unterwegs.png`):**

| Karte       | Füllung gemessen | daraus Deckkraft | Versatz              |
| ----------- | ---------------- | ---------------- | -------------------- |
| 1 (Sprache) | `#101011`        | 0,56             | 14 px unter Ruhelage |
| 2 (Tresor)  | `#09090a`        | 0,17             | —                    |
| 3 (Über)    | noch nichts      | 0                | —                    |

Die Rechnung dazu: `--surface` #18181b über `--ground` #060607 ergibt bei
Deckkraft a den Wert a · 24 + (1 − a) · 6; aus 16 folgt a = 0,56. Der Versatz
muss dann 8 dp × (1 − 0,56) = 3,55 dp = **13,3 px** sein — gemessen sind es 14.
Zwei unabhängige Größen, EIN Fortschrittswert: Das ist der Beweis, dass Deckkraft
und Weg an derselben Fahrt hängen.

Nebenbei zeigt dasselbe Bild die **Pille der Leiste unterwegs** samt Farbfahrt
der Zeichen — der Bildbeweis, der N13 und N14 gefehlt hat.

### 7. Die Tasten-Zeichen sitzen im Raster

**Der Befund war ein Widerspruch zwischen Kommentar und Code.** An `Key` stand:
„Das Raster bleibt dasselbe — `Glyph` rechnet in Anteilen der Kastenseite, also
skaliert der Strich mit." Der Code tat das nicht: Jedes Zeichen nahm
`Glyph.stroke.toPx()`, also 2 dp ABSOLUT. In einem 24-dp-Kasten ist das ein
Zwölftel der Seite, in den 20 dp einer Taste ein Zehntel — **20 % mehr Gewicht**
an demselben Zeichen.

Behoben mit `gridStroke()`: zwei von vierundzwanzig Einheiten. Bei 24 dp kommt
derselbe Wert heraus wie vorher, nur die kleineren Zeichen ändern sich.

**Am Pixel, dieselbe Aufnahme, zwei Kästen (`n15-7-tastenzeichen.png`):**

| Zeichen                       | Kasten | Strich gemessen        | Soll    |
| ----------------------------- | ------ | ---------------------- | ------- |
| „QR aus Bild" (Bild-Zeichen)  | 20 dp  | 7 px Spanne, 5 px Kern | 6,25 px |
| „Start" (Zifferblatt, Leiste) | 24 dp  | 9 px Spanne, 7 px Kern | 7,5 px  |

Das Verhältnis der beiden Striche ist 6,25 / 7,5 = **20 / 24** — genau das
Verhältnis der Kästen. Vor N15 hätten beide 7,5 px gemessen.

Die Ecken des Suchers bleiben absolut bei 2 dp: Sie werden nicht in einem
24-dp-Kasten gezeichnet, sondern auf der Fläche des Suchers, und ein
Vierundzwanzigstel davon wäre ein Balken. Die zwei Regeln widersprechen sich
nicht — bei 24 dp liefern sie denselben Wert.

### 8. IME-Politur

Das Secret-Feld enthält Schlüsselmaterial, und die Tastatur darf dort nichts
mitreden:

- **`autoCorrectEnabled = false`** — der wichtigere der beiden Schalter. Eine
  Autokorrektur, die einen 32-Zeichen-Schlüssel für ein verschriebenes Wort
  hält, ändert ihn STILL: Der Code rechnet sich weiter aus, er stimmt nur nicht
  mehr. Genau dieser Fehler hat dem Projekt schon eine Dreiviertelstunde
  gekostet, damals mit `adb shell input text` als Verursacher.
- **`KeyboardCapitalization.None`** — aus `otpauth://` wird sonst `Otpauth://`.
- **`KeyboardType.Ascii`** (`IME_FLAG_FORCE_ASCII`) — auf einem Gerät mit
  kyrillischem oder arabischem Layout stünde sonst eine Tastatur da, mit der man
  kein Base32 tippen kann.
- **KEIN `imeAction`**: Das Feld ist mehrzeilig, eine Zeile ist ein Konto. Die
  Eingabetaste bleibt ein Zeilenumbruch.

Die Filterzeile bekommt `ImeAction.Search`; auf Search hin gehen Tastatur und
Fokus weg. Gefiltert wird bei jedem Zeichen, das Absenden ist also schon
passiert — was der Nutzer meint, ist „zeig mir die Treffer", und dafür muss die
Tastatur aus dem Weg.

**Was hier NICHT erreichbar ist, und das gehört gesagt:**
`IME_FLAG_NO_PERSONALIZED_LEARNING`, also die Bitte, das Getippte nicht ins
Wörterbuch der Tastatur zu übernehmen. Compose' `KeyboardOptions` hat dafür
keinen Griff, und ein Passwort-Typ ist hier falsch: Man muss den Schlüssel SEHEN,
um ihn zu prüfen. Die Passphrase des Tresors trägt `KeyboardType.Password` und
ist damit abgedeckt; dieses Feld ist es nicht.

**Der Beweis am Gerät steht offen** — `dumpsys input_method` zeigt `inputType`
und `imeOptions` der laufenden Verbindung.

### 9. Predictive Back und Overscroll

**Zurück führte auf BEIDEN Seiten aus der App heraus.** Auf der
Einstellungen-Seite ist das falsch: Wer dort etwas eingestellt hat, will zurück
zu seinen Codes. Die Folge war am Gerät gemessen — der nächste Wisch scrollte den
Launcher (die Falle steht seit P7 in CLAUDE.md).

Gebaut ist `PredictiveBackHandler` und nicht `BackHandler`: Android 14 hat die
Geste sichtbar gemacht, wer vom Rand zieht sieht WOHIN es geht und kann
umkehren. Die Vorschau ist die der Plattform — die abtretende Seite zieht sich um
bis zu 5 % zusammen, ohne Ausblenden. Der Fortschritt ist der echte des Systems
und keine eigene Fahrt: Die Bewegung gehört dem Finger.

**Gemessen:** Zurück auf der Einstellungen-Seite → die App bleibt
`topResumedActivity`, und die Startseite steht da. Die Vorschau-Aufnahme mitten
in der Geste steht offen.

**Overscroll, mit gehaltenem Finger gemessen** (`n15-9-overscroll.png`, über
`input motionevent` gezogen und während des Ziehens aufgenommen):

| Landmarke       | in Ruhe | gezogen | Verschiebung |
| --------------- | ------- | ------- | ------------ |
| Kartenoberkante | 531     | 543     | +12 px       |
| Trennlinie 1    | 1180    | 1210    | +30 px       |
| Trennlinie 2    | 1349    | 1383    | +34 px       |
| Trennlinie 3    | 1601    | 1640    | +39 px       |
| Trennlinie 4    | 2299    | 2349    | +50 px       |

Die Verschiebung WÄCHST mit der Tiefe. Das ist also keine Verschiebung, sondern
eine Streckung — der Dehn-Overscroll der Plattform, etwa 2,2 % senkrechte
Skalierung am Ende der Geste. Er ist unverändert der der Plattform: Diese App
legt keine eigene Hand daran, und das ist die Entscheidung. Ein eigener
Overscroll wäre eine Bewegung, die nur diese App kennt.

### 10. Der Statuspunkt gegen das Web

**Der Befund:** Die Tresor-Leuchte war immer GEFÜLLT und trug zwei Töne — Akzent
für „offen", Tinte für alles andere. Der ausgeschaltete Tresor sah damit genauso
aus wie der gesperrte. Von den drei Zuständen waren zwei nicht zu unterscheiden,
und zwar bei der wichtigsten Auskunft der App.

Die Web-Fassung macht es anders und begründet es in `panels.css`: „Aus = leerer
Ring, gesperrt = gefüllt in Ink, offen = gefüllt im Akzent. Nie NUR über Farbe:
Ring gegen Fläche ist ein Formunterschied." Dazu färbt dort die Statuszeile
mit — „die Leiter geht mit dem Gewicht der Auskunft".

Beides steht jetzt hier, und dazu die zweite Zahl: Die Leuchte am Tresor ist
**8 dp** (`.vault__lamp`), die im Kopf bleibt **6 dp** (`.lamp`). Nativ stand an
beiden Stellen die 6 — die wichtigere der zwei Leuchten war die kleinere.

**Am Pixel, Zustand „aus" (`n15-10-leuchte-aus.png`):**

- Durchmesser **30 px = 8,0 dp**, auf den Punkt `Glyph.dotState`.
- Es ist ein RING: Die Zeile durch die Leuchte misst Wand (`#9f9fa9`, 3 px Kern),
  20 px Kartenfarbe `#18181b`, Wand — innen ist nichts.
- Ring UND Beschriftung messen `#9f9fa9` = `--ink-3` dunkel, auf den Kanalwert.

Die Zustände „gesperrt" und „offen" sind nicht mehr fotografiert worden.

### Die zwei Nachträge aus P7 und N14

**FLAG_SECURE bei der ERSTinstallation.** P7 hatte den Schalter belegt, nicht die
Voreinstellung. Frisch installiert, gestartet, aufgenommen:

- `run-as … ls files/` ist **leer** — es gibt noch keine `lock-settings.json`, es
  gilt also die Voreinstellung im Code (`blockScreenshots = true`).
- Die Aufnahme ist im ganzen App-Fenster **EINE Farbe**: Spalte x = 720 von
  y = 150 bis 2950 ein einziger Lauf `#000000`, Zeile y = 1500 über die ganze
  Breite ebenso. Die 0,39 % Nicht-Schwarz im Bild sind Status- und
  Navigationsleiste — ein eigenes Fenster, das FLAG_SECURE nicht betrifft.
- **Gegenprobe:** Schalter aus, dieselbe Stelle — **1340 Farben**. Und erst mit
  diesem Tipp entstand `lock-settings.json`.

Bilder: `p7-flagsecure-erstinstallation.png`,
`p7-flagsecure-erstinstallation-gegenprobe.png`.

**Die Ausnahmeliste der Web-Wörter ist leer** (Punkt 5 der Release-Checkliste).
Im Quelltext: `export const ALLOWED = new Map([])`. Gemessen: Der Generator läuft
durch und schreibt 37 Sprachen, **137 Schlüssel je Sprache = 5069 Einträge**,
davon 21 aus dem `native.`-Vorrat — ohne Abbruch und ohne eine einzige geänderte
Datei. Der Lauf ist idempotent, `git status` bleibt für die Ressourcen leer.

### Ketten

| Kette                                    | Ergebnis                                                     |
| ---------------------------------------- | ------------------------------------------------------------ |
| `gradlew testDebugUnitTest`              | **221 Tests, 0 Fehler** (unverändert)                        |
| `gradlew checkNoMaterial`                | grün — auch mit core-splashscreen im Baum                    |
| `node scripts/native-theme-check.mjs`    | **92 Werte** deckungsgleich (50 Farben, 42 Maße)             |
| `node scripts/native-nav-contrast.mjs`   | 8 Messpunkte grün; Gegenprobe fällt bei 50 % durch (4 von 8) |
| `node scripts/native-strings.mjs`        | 5069 Einträge, Ausnahmeliste 0, keine Datei geändert         |
| Web: typecheck · Tests · Lint · Prettier | grün, **560 Tests**                                          |

**Keine neuen Unit-Tests**, wie in N12 bis N14: Was dieser Posten ändert, sind
Geometrie, Farbe, Bewegung und Haptik. Geprüft wird das am Pixel und von
Skripten, die rechnen — nicht auf der JVM. Die einzige neue reine Funktion
(`Feedback.constant()`) ist eine Zuordnungstabelle auf Plattform-Konstanten; ein
Test darüber prüfte, dass eine Konstante gleich sich selbst ist.

### Nachtrag aus Kevins Sichtung: Zeiger, Knopf, Fokus, „Leeren"

Vier Befunde von ihm, und sie haben **sechs Lücken** aufgedeckt — drei am
Zifferblatt (seit P5), eine am Knopf, eine am Textfeld (seit P5) und eine ganze
fehlende Taste. Seine Sätze: „beim logo design die uhr muss beim zeiger orange
sein, und beim button den testschlüssel bitte auch orange machen" — „ich meine
den hover button herum orange nicht den schlüssel" — „aber die schrifttexte
weiss" — „beim input text wenn ich wieder zurückgehe ist es immer noch
angetastet" — „ich würde da noch einbauen das man den eingabe leeren kann".

Bemerkenswert daran: **Fünf der sechs sind Paritätslücken**, keine
Gestaltungswünsche. Er hat sie am Bild gefunden, und jede war im Web schon
entschieden und begründet. Das ist der beste Beleg dafür, dass die P9-Aufgabe
„Vergleichsbilder Web-mobil gegen nativ" wirklich nötig ist.

**Das Zifferblatt.** Was `styles/mark.css` sagt, und was nativ danebenstand:

| Teil                  | Web                                       | nativ bis N15                         |
| --------------------- | ----------------------------------------- | ------------------------------------- |
| Marken (`__tick`)     | `--ink-3`, bei `expiring` `--signal-text` | `--ink-3`, bei `expiring` unverändert |
| Zeiger (`__handMark`) | **`--signal-text`, immer**                | `--ink-2`, nur bei `expiring` Signal  |
| Nabe (`__hub`)        | `--ink`, bei `copied` `--signal-text`     | dieselbe Farbe wie der Zeiger         |

Damit war der EINE Akzent des Zifferblatts verschwunden — und der Zeiger ist
genau die Stelle, an der die Marke ihn trägt: Das Emblem hat seine Signalmarke
auf 12 Uhr, die Wortmarke ihren Index, das C-Werk sein Lager. Im Leerzustand
steht der Zeiger bei `progress = 0` auf 12 Uhr, also genau dort, wo das Emblem
seine Signalmarke hat.

Alle drei Farben stehen jetzt so wie im Web. Was `expiring` tut, ist damit die
Umkehrung des alten Fehlers: Nicht der Zeiger wird orange (der ist es schon),
sondern die TEILUNG zieht mit an — im Web „der einzige Moment, in dem das Gerät
von sich aus Signalfarbe zeigt". Die Nabe FÄHRT dabei in `--dur-calm`, weil sie
es im Web auch tut (`transition: fill`); als Farbfahrt und nicht als Animation,
damit die Quittung bei abgeschalteter Bewegung bleibt.

Der tiefe Signal-Ton und nicht der Markenwert: Der Zeiger ist 0,073 R stark,
also feine Geometrie — `#f05a28` hält auf der berührten Fläche hell nur 2,89:1.
So gemessen in mark.css.

**Der Testschlüssel-Knopf** war der VIERTE Paritätsfehler in derselben Sichtung —
und die Klärung hat einen Umweg gekostet: Der erste Anlauf hat sein ZEICHEN
orange gemacht. Kevins Nachsatz: „ich meine den hover button herum orange nicht
den schlüssel."

Nachgesehen statt weiter geraten, und die Antwort steht in einer Zeile:
`index.html`:320 gibt diesem Knopf `class="key key--primary key--lg"`. Er ist im
Web die **Haupthandlung** — volle Signalfläche, `--signal-hover` beim Drücken,
Tinte `--signal-ink` (#18181b, gemessen 5,23:1; Snow hielte dort nur 3,39). Nativ
stand `Default`, also die neutrale Füllung.

Inhaltlich stimmt es auch: Im Leerzustand gibt es genau eine Handlung, die ohne
eigenes Material funktioniert, und die Hausregel gibt der EINEN Haupthandlung
eines Panels die Signalfläche. Die zwei Wege daneben („QR aus Bild", „Kamera")
bleiben `Default` — auch das wie im Web. Das Zeichen trägt dieselbe Tinte wie die
Beschriftung: eine Taste hat EINE Tinte, und die Ausnahme aus dem ersten Anlauf
ist wieder ausgebaut.

#### Und die Tinte darauf ist WEISS — eine Abweichung mit Zahl

Kevins dritter Satz: „aber die schrifttexte weiss." Das widerspricht einem
gemessenen Wert des Hauses, deshalb ist es vorgerechnet und vorgelegt worden:

| Kombination                                    | Kontrast   |
| ---------------------------------------------- | ---------- |
| Snow `#fcfcfc` auf `--signal` `#f05a28`        | **3,30:1** |
| Snow auf `--signal-hover` `#f46d44` (gedrückt) | **2,88:1** |
| Snow auf dem tiefen Orange `#a8360c`           | 6,40:1     |
| `--signal-ink` `#18181b` auf `--signal` (Web)  | 5,23:1     |

Eine 14-sp-Beschriftung braucht nach WCAG AA 4,5:1. **Kevin hat mit dieser Zahl
vor Augen das Markenorange gewählt** — nicht das tiefere, das weiße Schrift und
die Zusage gehalten hätte. Das ist seine Entscheidung; sie steht hier und im
Quelltext bei `ClockworkColors.signalKeyInk`, damit sie nachlesbar bleibt statt
unbemerkt zu wirken.

Umgesetzt ist sie als eigene FARBROLLE und nicht als geänderter Wert:
`--signal-ink` bleibt in Tokens.kt bei #18181b und damit unter der Prüfung
(weiter **92 Werte** deckungsgleich). Die neue Rolle trägt bewusst keine
`// css:`-Marke — sie hat kein Gegenstück im Web. Den Wert einfach zu
überschreiben hätte die Marke entfernt und damit einen geprüften Wert still aus
der Prüfung genommen; genau diese Sorte stiller Verlust ist diesem Projekt schon
zweimal teuer geworden.

Die Rolle gilt für BEIDE Themes mit derselben Zahl: Die Fläche darunter ist in
beiden `--signal`, also darf die Tinte darauf nicht mit dem Theme kippen. Sie
betrifft damit auch die zweite Signal-Taste der App — die Haupthandlung des
Tresors („Verschlüsselt speichern" / „Aufsperren"). Zwei orange Tasten mit
verschiedener Schriftfarbe wären schlechter als eine Abweichung.

#### Das Textfeld blieb „angetastet" — ein Fehler, der seit P5 im Code lag

Kevins vierter Satz: „beim input text wenn ich wieder zurückgehe ist es immer
noch angetastet." Am Bild sieht man es genau: der Cursor steht in Signalfarbe im
Feld, die Füllung ist die berührte (`--fill-active`) — und keine Tastatur dazu.

**Die Ursache ist der erste Zurück-Druck.** Er schließt in Compose nur die
TASTATUR; den Fokus lässt er stehen. Zurück bleibt ein Feld, das aussieht, als
würde gerade darin getippt. Im Web gibt es das nicht: Dort nimmt ein Klick
daneben dem Feld den Fokus, und `:focus-within` fällt von selbst zurück.

**Behoben an EINER Stelle** — dort, wo die App den IME-Einzug ohnehin kennt
(`ClockworkApp`, dieselbe Zeile, die seit N13 das untere Polster wegnimmt). Damit
gilt die Regel für alle drei Felder der App: Secret, Filter, Passphrase.

**Und zwar am ÜBERGANG, nicht am Zustand**, und das ist der ganze Witz daran:
Der Fokus kommt VOR der Tastatur. Wer das Feld antippt, hat einen Wimpernschlag
lang Fokus ohne IME — eine Regel „kein IME, also kein Fokus" würde genau dann
zuschlagen, und die Tastatur ginge nie auf. Geräumt wird deshalb nur der Wechsel
von „Tastatur war da" zu „Tastatur ist weg".

#### „Leeren" fehlte ganz — die Ressource lag seit P4 unbenutzt im Baum

Kevins fünfter Satz: „ich würde da noch einbauen das man den eingabe leeren
kann." Die Web-Fassung hat die Taste seit V6 (`#key-clear`, `key--flat`), der
Katalogschlüssel `key.clear` ist in allen 37 Sprachen da, und
`values/strings.xml` trägt `key_clear` seit P4 — nativ hat sie nur nie jemand
aufgerufen.

**Sie hängt am FELDINHALT, nicht an der Bühne**, wörtlich wie in `app.ts`:
`keyClear.hidden = input.value === ''` und `keyDemo.hidden = !empty`. Die beiden
sind damit gegenseitig ausschließend, und deshalb stehen sie nativ im **selben
Platz**: leer → Testschlüssel, nicht leer → Leeren. Dass im Leerzustand
überhaupt etwas im Feld stehen kann, ist kein Widerspruch — eine Zeile, die nur
ein `#`-Kommentar ist, ergibt keinen Eintrag: Die Bühne bleibt leer, das Feld ist
es nicht. Genau diesen Fall nennt die Web-Fassung als Begründung dafür, die
Tasten am Feld und nicht an der Bühne zu führen.

**Sie gibt den Fokus zurück**, und das ist keine Höflichkeit: Sie VERSCHWINDET im
selben Moment (das Feld ist jetzt leer), und ein Bauteil, das den Fokus hält und
aus der Komposition fällt, gibt ihn nicht weiter — die Falle steht in CLAUDE.md.
Die Web-Fassung löst es mit derselben Zeile (`input.focus()` direkt nach dem
Leeren).

**Zwei Abweichungen, benannt:** Im Web steht die Taste mobil ABSOLUT in der
Legendenzeile der Eingabe-Zone (36 px). Nativ ist diese Zeile selbst ein Knopf,
der die Schublade schaltet — eine Taste darin wäre ein Ziel in einem Ziel. Sie
steht deshalb in der Schublade, direkt unter dem Inhalt, den sie räumt, in voller
Breite und auf der 40-dp-Sprosse der Höhenleiter.

**Nebenbei hat das die `Flat`-Variante zum ersten Mal wirklich in Betrieb
gebracht.** Sie war seit P5 definiert und nirgends benutzt — und trug deshalb nur
die halbe Hälfte ihrer Web-Fassung: Fläche `--fill-soft`, aber ohne Druckpunkt
und mit `--ink` statt `--ink-2`. Jetzt vollständig: Ruhe `--fill-soft` auf
`--ink-2`, Druck `--surface-fill` auf `--ink`, beides in 150 ms — genau
`.key--flat` und `.key--flat:hover`. Sie ist die leiseste Taste des Geräts und
zeigt ihre volle Tinte erst beim Anfassen.

Gebaut, 221 Tests unverändert, `checkNoMaterial` grün, installiert. **Die Bilder
dazu macht Kevin selbst** — er testet.

### Was an Beweisen offen bleibt

Vollständigkeit ist hier wichtiger als ein gutes Bild:

1. **Haptik am Gerät** — `dumpsys vibrator_manager` nach einem Kopiervorgang.
2. **IME-Flags am Gerät** — `dumpsys input_method`, `inputType`/`imeOptions`.
3. **Die Tresor-Leuchte „gesperrt" und „offen"** als Bild.
4. **Die Haltefarbe der Kopiertaste im Endwert** — die Aufnahme fiel in die
   Farbfahrt.
5. **Die Predictive-Back-Vorschau** mitten in der Geste.
6. **Die neue dunkle Popover-Fläche** (`--surface-fill`) ist nach Kevins Befund
   gebaut und installiert, aber nicht mehr von mir fotografiert.
7. **Der Zeiger in Signal und das Testschlüssel-Zeichen in Signal** — beides
   nach Kevins Sichtung gebaut und installiert, ebenfalls nicht fotografiert.

Der Grund ist derselbe für alle sechs: Kevin hat ab Punkt 5 selbst getestet, und
zwei Hände auf einem Telefon ergeben keinen Messaufbau. **P9 fotografiert den
Endstand ohnehin.**

---

## N17 — Bug- und Security-Durchgang auf dem Stand nach N15

Auftrag war ein vollständiger Durchgang in zwei Blöcken, dazu die offenen
Restbeweise. **Der Auftrag stand nicht in `PROMPT-KOTLIN.md`** — die Datei endet
unverändert bei N14 (50.321 Byte, 14.08. 17:53, 921 Zeilen, letzte Überschrift
„Gegenprüfungs-Befund zum P0–P4-Stand"). Einen „Nachtrag 5" oder „N17" gibt es
dort nicht; gearbeitet ist nach der Nachricht, und der Blockschnitt A/B ist
selbst gesetzt. Dieselbe Lage wie in N15 und dieselbe Antwort darauf.

**Block A** ist alles, was ohne Gerät entscheidbar ist: Quelltext, Manifest,
Bauplan, Abhängigkeiten, die vorhandenen Dauerprüfungen. **Block B** ist alles,
was nur das laufende Programm beantwortet: Berechtigungen im Kernel,
Dateirechte, Prozessabbild, Sicherung, Bildschirmschutz.

Gemessen auf dem physischen S24 Ultra, angeschlossen über WLAN
(`192.168.1.142:5555` — die scrcpy-Verbindung aus N13; die USB-Kennung
`R3CXB0R3C2K` trifft dann NICHT mehr, `adb` meldet „device not found").

### Der Befund in einem Satz

Der Kern ist sauber — Krypto, Speicher, Parser und die Netz-Zusage halten jeder
Nachmessung stand. Der eine Fund von Gewicht kam nicht aus dem eigenen Code,
sondern aus einer Abhängigkeit: **Die App holte bei jedem Kaltstart die
Emoji-Schrift von Google Play Services.**

### Der Hauptfund: eine Web-Schrift, die niemand bestellt hat

`androidx.appcompat` — im Baum für genau eine Sache, die per-App-Sprachwahl —
zieht `androidx.emoji2` mit. Dessen `EmojiCompatInitializer` hängt sich über
`androidx.startup` in den Prozessstart und fragt den Schriftanbieter von Google
Play Services nach `NotoColorEmojiCompat`.

Der Beweis ist das Prozessabbild, nicht ein Verdacht:

```
$ adb shell run-as io.github.keco216.clockwork.dev cat /proc/12697/maps \
    | grep -iE '\.(ttf|otf|ttc)' | awk '{print $NF}' | sort -u
/data/data/com.google.android.gms/files/fonts/opentype/Noto_COLR_Emoji_Compat-400-100_0-0_0.ttf
/system/fonts/Roboto-Regular.ttf
/system/fonts/RobotoStatic-Regular.ttf
```

Warum das zählt, obwohl die App selbst nichts herunterlädt: Harte Regel 4 des
Projekts lautet „zur Laufzeit keine fremde Netzwerkanfrage, **keine Web-Fonts
von außen**". Die Verbindung baut Google Play Services stellvertretend auf; die
App bleibt ohne INTERNET und ohne Socket. Übrig bleibt trotzdem eine Abfrage an
einen Google-Dienst, bei der Google das anfragende Paket sieht — also ein
Startsignal von Clockwork an Google, bei jedem Kaltstart. Genau die Bindung,
wegen der `libs.versions.toml` ML Kit ausschließt.

Zweiter Punkt: Es war eine **Verhaltens-Gabelung**. Auf einem F-Droid-Gerät ohne
Play Services passiert gar nichts, auf einem Play-Gerät passiert es. Von zwei
Fällen wäre nur einer je gemessen worden.

**Behoben** über den Manifest-Merger (`tools:node="remove"` am Metadatum des
Initialisierers). Die zwei anderen Initialisierer bleiben — sie sind
prozessintern und fragen niemanden.

Gegenmessung nach dem Bau, gleiches Gerät, gleicher Ablauf:

|         | Treffer auf `gms/files/fonts` | Schriften im Prozess    |
| ------- | ----------------------------- | ----------------------- |
| vorher  | **1**                         | Noto-Emoji + 2 × Roboto |
| nachher | **0**                         | nur 2 × Roboto          |

Und die App zeichnet unverändert: derselbe Bildausschnitt vorher 1302, nachher
1311 verschiedene Farben, die drei häufigsten auf das Pixel gleich (`#060607`
Grund, `#27272a` Leistenpille, `#f05a28` Signal) — der Unterschied ist der
weitergelaufene Countdown, nicht die Darstellung. Kein Absturz durch fehlendes
`EmojiCompat`: Compose fragt `isConfigured()`, bevor es zugreift.

Der Preis ist benannt: Emoji, die neuer sind als die Systemschrift, erscheinen
als Kästchen.

### Die offenen Restbeweise — alle drei nachgeholt

**1. FLAG_SECURE bei der Erstinstallation.** Deinstalliert (vorher geprüft: es
lag KEIN `vault.json` im `filesDir`, nur `lock-settings.json`), frisch
installiert, `files/` existierte danach gar nicht — der Schalter kam also aus
der Code-Voreinstellung und nicht aus einer Datei.

| Zustand                                    | Ausschnitt (Zeilen 200–2900, 1440 px breit) | verschiedene Farben |
| ------------------------------------------ | ------------------------------------------- | ------------------- |
| frisch installiert, Schalter nie angefasst | 3.888.000 px                                | **1** (`#000000`)   |
| `blockScreenshots:false`, sonst identisch  | 3.888.000 px                                | **1302**            |

Die Grenze gehört dazu und ist neu gemessen: Über das **ganze** Bild sind es 474
Farben, nicht 1. Die Systemleisten zeichnet SystemUI, und `FLAG_SECURE` deckt
nur die Fläche des APP-Fensters. 4.473.658 von 4.492.800 px (99,57 %) sind
schwarz; der Rest ist Uhr, Akku und Gestenbalken. Wer „eine Farbe" behauptet,
muss den Ausschnitt mitnennen.

**2. Die Ausnahmeliste in `native-web-words.mjs` ist leer.** `ALLOWED = new
Map([])` im Quelltext, und der Generator läuft durch: 37 Sprachen, 137
Schlüssel je Sprache, 5069 Einträge (erwartet 5069), 21 davon aus dem
`native.`-Vorrat. Danach `git status` über `res/`, `StringKeys.kt` und
`LocaleRegistry.kt`: **leer** — der Generator schreibt genau das, was schon
dasteht.

**3. Die P7-Zahlen.** Kreuzproben neu erzeugt und in beide Richtungen gefahren:
Node versiegelt → Kotlin öffnet **4/4**, Kotlin versiegelt → Node öffnet
**4/4** (ascii, nicht-ascii, leerer Klartext, volle 600.000 Iterationen).
`VaultTest` 26 Tests, `VaultKeyTest` 13, null Fehler. Die sechs
Manipulations-Gegenproben sind da und grün: gekipptes Bit im Chiffrat,
gekipptes Bit im Tag, veränderter IV, verändertes Salt, abgeschnittenes
Chiffrat, heruntergesetzte Iterationszahl.

**Was NICHT nachgeholt ist, und warum:** die Biometrie-Invalidierung. Sie
verlangt, einen Fingerabdruck zu registrieren oder zu entfernen — auf diesem
Gerät sind das Kevins echte. Der Beweis von P7 ist am Emulator mit
eingespielten Abdrücken geführt worden und bleibt der gültige.

### Block B — was das laufende Programm sagt

**Die Netz-Zusage hält auf Kernel-Ebene.** Nicht das Manifest ist der Beweis,
sondern die Gruppenliste des Prozesses:

```
$ adb shell cat /proc/14999/status | grep -E '^(Uid|Gid|Groups):'
Uid:    10384   10384   10384   10384
Gid:    10384   10384   10384   10384
Groups: 9997 20384 50384
```

**3003 (`inet`) fehlt.** Ohne diese Gruppe kann der Prozess keinen Netz-Socket
öffnen — eine Aussage über das Betriebssystem und nicht über die Absicht der
App. Dazu `aapt2 dump badging` am Release-APK: INTERNET-Treffer **0**,
angefragte Berechtigungen genau CAMERA, USE_BIOMETRIC, USE_FINGERPRINT
(maxSdk 27) und die signaturgeschützte `DYNAMIC_RECEIVER_NOT_EXPORTED`; beide
Kamera-Features `uses-feature-not-required`; minSdk 26, target 36.

**Eine Messfalle dabei, und sie ist neu:** `adb shell run-as <pkg> id` zeigt
**3003(inet)** in den Gruppen — und das ist falsch. `run-as` läuft in seinem
eigenen Kontext (`u:r:runas_app:s0`) und meldet dessen Zusatzgruppen, nicht die
des App-Prozesses. Wer die Netz-Zusage messen will, liest `/proc/<pid>/status`
des laufenden Prozesses. Beinahe wäre daraus ein Befund geworden, den es nicht
gibt — dieselbe Familie wie das leere Vergleichsfeld beim APK-Vergleich.

**Zur Laufzeit erteilt** sind USE_BIOMETRIC und die eigene
Signaturberechtigung; **CAMERA steht auf `granted=false`** und wurde nie
erteilt.

**Die Sicherung ist wirklich aus.** `dumpsys package` listet die Flags
`[ DEBUGGABLE HAS_CODE ALLOW_CLEAR_USER_DATA ]` — **`ALLOW_BACKUP` steht nicht
darin**, und `dumpsys backup` kennt das Paket nicht. `allowBackup="false"`
wirkt also, nicht nur im Manifest.

**Dateirechte im `filesDir`:** `-rw-------` für jede Datei, das Verzeichnis
`drwxrwx--x` und ihm übergeordnet `drwx------`. Kein anderes Paket kommt heran.

**Was sonst noch im Datenverzeichnis liegt** — vollständig, weil die Zusage
„ohne Tresor wird nichts gespeichert" davon lebt:

| Datei                                             | Wer schreibt sie            | Inhalt                             |
| ------------------------------------------------- | --------------------------- | ---------------------------------- |
| `files/lock-settings.json`                        | die App                     | vier Einstellungen, kein Geheimnis |
| `files/profileInstalled`                          | `androidx.profileinstaller` | Merker, 24 Byte                    |
| `shared_prefs/android.app.ActivityThread.IDS.xml` | die Plattform               | `IDSCount=1`                       |

`profileInstalled` entsteht auch auf einer frischen Installation ohne jede
Bedienung — nachgemessen direkt nach `install`. Kein Nutzerdatum, aber es
gehört gewusst.

### Was geprüft wurde und sauber ist

Das ist der längere Teil des Berichts und der wichtigere.

**Krypto (`core/Vault.kt`).** PBKDF2-SHA-256 mit 600.000 Runden; AES-GCM mit
96-Bit-IV (die Länge, bei der GCM den Zählerblock direkt bildet) und
128-Bit-Tag; frischer IV bei jedem Versiegeln, auch bei „Neu speichern"; die
AAD bindet Version, Verfahren und Iterationszahl; jeder Fehlschlag beim Öffnen
gibt dieselbe Meldung, egal ob falsche Passphrase, gekipptes Bit oder
abgeschnittenes Chiffrat. `VaultKey.clear()` überschreibt mit Nullen, und
`SecretKeySpec` wird bei jedem Aufruf neu gebaut statt im Feld gehalten — sonst
läge eine zweite Kopie außerhalb der Reichweite von `clear()`. Die Grenze („die
JVM gibt Speicher nicht auf Zuruf frei") steht im Quelltext, statt übergangen
zu werden.

**Keystore und Biometrie.** Ausdrücklich `BIOMETRIC_STRONG` und ausdrücklich
**kein** `DEVICE_CREDENTIAL` — die Geräte-PIN ist nicht die Passphrase des
Tresors. `setUserAuthenticationParameters(0, …)` ab API 30 heißt Freigabe bei
JEDER Benutzung. `setInvalidatedByBiometricEnrollment(true)` entwertet den
Wickel, sobald jemand einen neuen Finger registriert. Eingewickelt wird der
ABGELEITETE Schlüssel, nie die Passphrase, und das Salt des Umschlags liegt als
Veraltungsanker daneben.

**Speicher.** `vault.json` wird atomar geschrieben (Nebendatei, `fd.sync()`,
`Files.move` mit `ATOMIC_MOVE`) — ein abgebrochener Schreibvorgang kann den
Tresor nicht halbieren. `EncryptedSharedPreferences` ist begründet verworfen:
Es hängt den Tresor an das Gerät statt an die Passphrase.

**Parser gegen fremde Eingaben** (QR-Code, eingefügter Text). Der
Protobuf-Leser begrenzt Varints auf 10 Byte, prüft jede Längenangabe gegen die
Restlänge **vor** der Wandlung nach `Int` und lehnt Wire-Type und Feldnummer 0
ab. Base32 schneidet das Padding in einer Schleife statt mit `/=+$/` — der
Regex hatte im Web quadratische Laufzeit. `parseIntegerStrict` nimmt nur
Ziffern; `parsePeriod` klemmt auf 1…3600, `digits` auf 6…8. `decodePayload`
schneidet den `data`-Parameter von Hand heraus, weil jeder Formular-Decoder das
`+` in Base64 still zu einem Leerzeichen macht.

**Format-Zeichenketten.** Die Stelle, an der ich einen Fehler erwartet und
keinen gefunden habe. `err_uri_badLabel` enthält in allen 37 Sprachen ein
nacktes `%` („ein einzelnes »%«") — bei einem Aufruf über `String.format` wäre
das eine `UnknownFormatConversionException` beim ANZEIGEN einer Fehlermeldung.
Es kann nicht passieren: `native-strings.mjs` verdoppelt `%` genau dann, wenn
der Text Platzhalter hat, und `Text.kt` formatiert genau dann. Beide
Entscheidungen kommen aus derselben Quelle (`placeholderNames` der
Basissprache, aus der auch `placeholdersFor` erzeugt wird). Die Invariante hat
eine Wahrheit, nicht zwei.

**Der WebView-Pfad (P8)** hält allem stand, was ich ihm entgegengehalten habe:
Jede Anfrage wird aus dem Programm mit einer leeren Seite beantwortet, das
Skript ist eine Konstante ohne eingesetzte Werte, gelöscht wird erst nach
bestätigtem Schreiben, und ein Umschlag, den diese Fassung nicht kennt, bleibt
unangetastet liegen.

**Was im Quelltext gar nicht vorkommt** — jedes einzeln gesucht: `Log.`,
`println`, `printStackTrace`; `Class.forName`, `Runtime.getRuntime`,
`ProcessBuilder`, `System.loadLibrary`; `Intent(`, `registerReceiver`,
`sendBroadcast`, `startActivity`. Die App schreibt nichts ins Protokoll, lädt
nichts nach und hat außer ihrer Launcher-Activity keine eigene IPC-Oberfläche.

**Das Secret-Feld** trägt `remember` und nicht `rememberSaveable` (die
P6-Lehre), dazu `KeyboardType.Ascii`, keine Großschreibung, keine
Autokorrektur. `IME_FLAG_NO_PERSONALIZED_LEARNING` bleibt unerreichbar — das
steht seit N15 dabei und gilt weiter.

**Die Zwischenablage** wird ab API 33 als `EXTRA_IS_SENSITIVE` markiert, die
Lücke darunter ist im Quelltext benannt.

### Die kleinen Fixes dieses Laufs

Vier, alle im selben Lauf gemessen.

**1. Eine Iterationszahl ohne Obergrenze konnte die App unerreichbar machen.**
`iterations` steht im Umschlag als JSON-Zahl, wird also als `Double` gelesen;
`1e20` wird beim Wandeln zu `Int.MAX_VALUE`. Geprüft wurde bisher nur
„mindestens 1". Ein verrutschtes Byte in `vault.json` hätte die Ableitung mit
2.147.483.647 Runden starten lassen — rund 3500-mal so lang wie vorgesehen,
also praktisch für immer, und zwar bevor die AAD überhaupt zum Zug kommt (die
merkt es erst beim Entschlüsseln, also NACH der Ableitung). Der Tresor wäre
ohne „App-Daten löschen" nicht mehr erreichbar gewesen, und mit dem Löschen
weg. Jetzt gilt `MAX_VAULT_ITERATIONS = 10_000_000` — reichlich sechzehnmal die
eigene Vorgabe, also öffnet jeder echte Umschlag unverändert. Zwei Tests dazu;
dass sie in Millisekunden durchlaufen, IST die Aussage. Bewusste Abweichung von
`src/lib/vault.ts`, das seit v1 eingefroren ist und nur nach unten prüft — die
Abweichung geht in die sichere Richtung.

**2. Die Biometrie-Abfrage konnte zweimal antworten.**
`onAuthenticationSucceeded` und `onAuthenticationError` riefen beide
`continuation.resume` ohne `isActive`-Prüfung. Manche Geräte schieben nach
einem Erfolg noch ein `ERROR_CANCELED` nach, und `invokeOnCancellation` ruft
selbst `cancelAuthentication()` auf — ein zweites `resume` wirft
`IllegalStateException`. Aus einer geglückten Entsperrung wäre ein Absturz
geworden. Die Nachbarn in `WebViewImport` prüfen seit P8 genau so.

**3. Die Bildgrenze hielt nicht, was ihr Kommentar versprach.**
`MAX_IMAGE_EDGE` heißt „größte Kantenlänge, mit der ein gewähltes Bild
dekodiert wird" und steht auf 2048. Die Schleife war das übliche
BitmapFactory-Muster (`… / (sample * 2) >= MAX`) und rechnet andersherum: Sie
sucht die stärkste Verkleinerung, bei der das Bild noch MINDESTENS so groß ist
wie verlangt. Herausgekommen ist eine Kante zwischen 2048 und 4095.

| Bild                         | vorher Kante / Speicher | nachher Kante / Speicher |
| ---------------------------- | ----------------------- | ------------------------ |
| S24-Bildschirmfoto 1080×2400 | 2400 / 21 MB            | 1200 / 5 MB              |
| 12-MP-Foto 4000×3000         | 4000 / **96 MB**        | 2000 / 24 MB             |
| 50-MP-Foto 8160×6120         | 4080 / **100 MB**       | 2040 / 25 MB             |

(Speicher = Bitmap 4 B/px + das `IntArray` der Pixel 4 B/px.) Ein gewöhnliches
Handyfoto lief ungesampelt durch. Jetzt hält die Grenze, und der Kommentar
stimmt. **Offen:** Der Picker-Weg ist danach nicht noch einmal am Gerät
durchgespielt worden — gehört zu P9.

**4. Die Emoji-Schrift** — siehe oben.

**Ketten nach den Fixes:** Kotlin **223 Tests** (221 + 2), null Fehler;
`checkNoMaterial` grün; Release baut, **3.291.141 Byte**, INTERNET-Treffer 0,
Emoji-Initialisierer im gepackten Release-Manifest **0**. Die Web-Kette ist
unberührt (kein Byte unter `src/` oder `scripts/` angefasst) und in diesem Lauf
trotzdem gefahren: typecheck, **560 Tests**, Lint, Prettier, Build, und
`dist/clockwork.html` byte-identisch — 801.401 Byte, SHA-256 `175f4a8e…584e`,
vor und nach dem Bau gehasht.

### Die Folgeposten — was nicht in diesen Lauf gehörte

Nummeriert, damit man sie einzeln nehmen kann.

**F1 — Die Zeitschaltung misst die falsche Uhr.** `resetIdleTimer` benutzt
`delay(timeoutMs)` auf dem Kompositions-Scope. Dessen Verzögerung läuft über
eine MONOTONE Uhr (`nanoTime` bzw. `Handler.postDelayed` auf `uptimeMillis`),
und die steht im Tiefschlaf des Geräts still — anders als `elapsedRealtime`.
Liegt das Telefon drei Stunden in der Tasche, sind davon für die Frist nur die
Wachzeiten vergangen. Im Normalfall greift vorher `lockOnHide` (Voreinstellung
an, und der Bildschirm-Aus schickt die Activity durch `onStop`); wer den
Schalter ausmacht, verlässt sich aber genau auf diese Frist. **Nicht gemessen,
hergeleitet** — Tiefschlaf lässt sich am Schreibtisch nicht in Minuten
herbeiführen, und `force-idle` legt die CPU nicht schlafen. Der Weg wäre eine
Frist in `SystemClock.elapsedRealtime()` plus eine Prüfung beim Zurückkommen;
das ändert Verhalten und braucht einen eigenen Beweis.

**F2 — ART-Baseline-Profile: entscheiden statt erben.** Die 1.x-Fassung
schaltet sie ausdrücklich ab, weil `assets/dexopt/baseline.prof` unter AGP
nicht deterministisch ausfällt (gemessen gegen den F-Droid-Buildserver: 1761
gegen 1759 Byte). Die native Fassung hat sie an — `files/profileInstalled` ist
der Beweis. Die Begründung von damals trägt hier NICHT: Dort war die Java-Seite
eine dünne Capacitor-Brücke, hier ist die ganze Oberfläche Kotlin, ein Profil
hilft also wirklich. Es bleibt eine Quelle der Nichtreproduzierbarkeit für ein
späteres F-Droid-2.0.0 und eine stille Abweichung von 1.x. Entscheidung, kein
Fehler.

**F3 — Die Zwischenablage wird nie geleert.** Ein kopierter Code bleibt darin
stehen, bis ihn etwas ersetzt. Entschärft ist es durch die Plattform: Seit
Android 10 liest keine Hintergrund-App die Zwischenablage. Etablierte
Authenticatoren bieten trotzdem ein „nach n Sekunden leeren". Produktfrage.

**F4 — Tapjacking.** Die App setzt weder `filterTouchesWhenObscured` noch
`Window.setHideOverlayWindows` (ab API 31). Eine Overlay-App könnte über dem
Passphrasenfeld liegen. Braucht Entwurf und eine Messung.

**F5 — `taskAffinity`.** Die Activity läuft mit `singleTask` und der
voreingestellten Affinität (= Paketname). `android:taskAffinity=""` ist die
übliche Härtung gegen fremde Activities in derselben Aufgabe. Zu prüfen ist, ob
es das Verhalten am Launcher ändert.

**F6 — Der exportierte `ProfileInstallReceiver`.** `androidx.profileinstaller`
mischt ihn ein: `exported="true"`, geschützt durch `android.permission.DUMP`
(signature|privileged) — erreichbar also nur von Shell und System, kein
Angriffsweg. Er steht trotzdem in keinem der beiden Manifeste, und der Kopf von
`AndroidManifest.xml` behauptet, das Nichtvorhandene sei die Aussage der Datei.
Dieselbe Lehre wie bei den zwei Biometrie-Berechtigungen in P7: Eine Zusage,
die eine Abhängigkeit still ändern kann, ist keine. Entweder ausschreiben oder
mit F2 zusammen entfernen.

**F7 — Kleinkram, gesammelt.** (a) Der Filtertext steht in `rememberSaveable`
und damit im Instanzzustand der Activity — er ist kein Secret, verrät aber
Kontonamen. (b) `PercentCodec.hexValue` benutzt `Character.digit` und
`Json.readEscape` benutzt `toIntOrNull(16)`; beide nehmen Ziffern an, die
`decodeURIComponent` ablehnt (arabisch-indische, Vollbreite, führendes
Vorzeichen). Folgenlos, weil dahinter strenge Prüfungen stehen — aber eine
Abweichung vom Web. (c) Die per-App-Sprache liegt ab API 33 in den
Systemeinstellungen und überlebt „App-Daten löschen". (d) R8 meldet fünfmal
„error occurred when parsing kotlin metadata" — Kotlin 2.4.10 ist neuer als das
R8 von AGP 8.13; das kostet Optimierung, nicht Korrektheit.

### Zwei Messfallen für die Sammlung

1. **`run-as … id` lügt über die Gruppen.** Siehe oben. Die Wahrheit steht in
   `/proc/<pid>/status` des laufenden Prozesses.
2. **Git-Bash schreibt auch den GERÄTEPFAD eines `run-as cp` um.** Bekannt war
   die Falle für `screencap`; sie gilt genauso für das QUELL-Argument eines
   `cp` in der Geräte-Shell. `cp: 'files/lock-settings.json' not directory` ist
   die Fehlermeldung dafür — sie zeigt auf das falsche Argument.
   `MSYS_NO_PATHCONV=1` gehört vor JEDEN `adb`-Aufruf, dessen Argumente auf dem
   Gerät liegen.

---

## N19 — Die Zeitschaltung misst jetzt die richtige Uhr

Der F1-Befund aus N17 war kein Backlog-Posten, sondern ein Muss-Fix: „Sperrt
automatisch nach 5 Minuten" steht als Zusage an der Oberfläche, und sie hielt
im Tiefschlaf nicht.

### Was falsch war

`resetIdleTimer` bestand aus einem einzelnen `delay(timeoutMs)` auf dem
Kompositions-Scope. Die Verzögerung von `kotlinx.coroutines` hängt an einer
MONOTONEN Uhr — `System.nanoTime` bzw. `Handler.postDelayed` auf
`SystemClock.uptimeMillis` —, und die steht still, sobald das Gerät wirklich
schläft. `SystemClock.elapsedRealtime` läuft weiter.

**Die Größenordnung ist auf Kevins S24 gemessen, nicht geschätzt.**
`dumpsys batterystats` führt beide Uhren nebeneinander:

```
Time on battery screen off: 7m 19s 279ms (99,0%) realtime, 2m 33s 502ms (34,6%) uptime
Total run time:             9m 54s 836ms         realtime, 5m  9s  61ms         uptime
```

In 439,279 s mit ausgeschaltetem Bildschirm sind nur 153,502 s monotone Zeit
vergangen — **65 % der Zeit war das Gerät suspendiert.** Eine Frist von fünf
Minuten hätte in diesem Betriebszustand rund `300 / 0,35 ≈ 860 s`, also etwa
14 Minuten Realzeit gebraucht, um überhaupt zu feuern. Fast dreimal so lang wie
zugesagt.

### Wie es jetzt gebaut ist

`core/IdleWindow.kt` ist neu und enthält die reine Rechnung: `markActive`,
`stop`, `isExpired(timeoutMs)`, `remainingMs(timeoutMs)`. Die Zeitquelle ist
ein Parameter (`now: () -> Long`), im Betrieb `SystemClock.elapsedRealtime`.
`core/` bleibt damit androidfrei.

Zwei Stellen benutzen sie:

- **Der Wecker rechnet nach jedem Klingeln neu.** Statt eines einzelnen
  `delay(timeoutMs)` läuft eine Schleife `while (remainingMs > 0) delay(...)`.
  Ist die Realzeit-Frist noch nicht um, wird die Restzeit weitergeschlafen.
- **`onStarted()` prüft beim Wiedereintritt** und ist der eigentliche Fix. Es
  hängt an `ON_START` und nicht an `ON_RESUME`, weil `ON_START` VOR dem ersten
  Bild liegt: Gesperrt wird, bevor jemand wieder etwas sieht.

Kein `AlarmManager`, keine neue Berechtigung — es muss nicht im Hintergrund
gesperrt werden.

### Der Beweis: sieben Unit-Tests mit gestellter Uhr

`IdleWindowTest` schiebt die Zeitquelle von Hand weiter. Der Kern ist der
Test `der Tiefschlaf zaehlt mit — das ist der ganze Punkt von N19`: drei
Stunden vergehen in einer Zuweisung, die Frist ist danach abgelaufen. Dazu die
Grenzfälle (eine Millisekunde davor / genau auf der Grenze), das Zurücksetzen
bei jeder Berührung, die drei Stufen des Auswahlfelds, und eine rückwärts
laufende Uhr — die sperrt zu, statt offen zu lassen, und `remainingMs` läuft
dabei nicht über.

Kotlin-Tests damit **230**, null Fehler.

### Was am Gerät NICHT zu messen war, und warum

Der Auftrag nennt einen Doze-Beweis. Er ist versucht und **nicht gelungen**:

| Messung                             | Realzeit  | Uptime    | Differenz |
| ----------------------------------- | --------- | --------- | --------- |
| 150 s Bildschirm aus, adb verbunden | 156,245 s | 156,246 s | **0**     |

Der Grund ist der Messaufbau selbst: **Eine bestehende adb-Verbindung hält das
Gerät wach.** Die Abweichung aus den Zählern oben (285,775 s) war vor der
Sitzung entstanden und ist über alle drei Ablesungen konstant geblieben — das
Gerät hat, solange ich daran hing, kein einziges Mal suspendiert.

Ein sauberer Doze-Beweis bräuchte eine Sitzung OHNE adb und ein Zeitfenster,
in dem die monotone Uhr unter der Zeitschaltung bleibt (bei 65 % Suspend also
mehr als das Dreifache der Frist). **Das ist Kevins Geräteabnahme**, und das
Rezept ist kurz: Tresor aufsperren, Zeitschaltung 1 Minute, „beim Verlassen
sperren" AUS, Telefon fünf Minuten weglegen, App wieder holen → muss gesperrt
sein. Vor dem Fix wäre sie offen geblieben.

---

## N20 — Die Breite des Audits nachgezogen

N17 hat in die TIEFE gemessen (Krypto, Netz, Speicher, Rechte). N20 holt die
BREITE nach: die neun Punkte aus dem N17-Auftrag, die der Lauf nicht gesehen
hat, und die kleinen Befunde F2–F7.

**Zur Arbeitsweise:** Kevin hat mitten im Lauf angesagt, dass Prüfen im CODE
stattfindet und nicht am Handy — er testet selbst. Der Rest dieses Abschnitts
folgt dem: Lint, Abhängigkeitsbaum, `aapt2`-Dumps, Grep über den Quellbaum.
Die zwei Geräte-Messungen, die vorher liefen, stehen weiter drin, weil sie den
schwersten Befund erst belegt haben.

### Der schwerste Fund: zwei Sprachen waren still kaputt

**Hebräisch und Indonesisch fielen auf Englisch zurück** — seit P4, in jeder
Fassung, unbemerkt.

Die Kette, Stück für Stück gemessen:

| Ebene          | Befund                                                         |
| -------------- | -------------------------------------------------------------- |
| Android Lint   | `LocaleFolder`: „The locale folder `he` should be called `iw`" |
| Quelle         | `values-b+he/strings.xml` — die hebräischen Texte liegen da    |
| APK            | `aapt2 dump resources`: `(he) "הוספת מפתח בדיקה"` — auch da    |
| System         | `cmd locale set-app-locales … --locales he` speichert `he`     |
| **Bildschirm** | **„Insert test key"** — also Englisch                          |

Die Ursache ist `java.util.Locale`: Es schreibt die drei alten Sprachcodes bei
jeder Gelegenheit zurück (`he`→`iw`, `id`→`in`, `yi`→`ji`), auch bei einem
selbst gebauten Locale. Das Ressourcensystem fragt deshalb nach `iw`, im APK
stand aber `he` — kein Treffer, Rückfall auf die Basissprache. Im APK lagen
BEIDE Codes nebeneinander: `he`/`id` von uns, `iw`/`in` von den
androidx-Bibliotheken, die es richtig machen.

**Was daran lehrreich ist:** Im Generator stand ein Kommentar, der genau diese
Frage schon beantwortet hatte — „aapt2 normalisiert die Qualifier selbst … und
die Laufzeit bildet `iw`/`in` darauf ab", mit dem Zusatz „NACHGEMESSEN am
gebauten APK". Gemessen worden war die ANZAHL der Konfigurationen (37, und die
stimmte). Nie gemessen worden war, ob Hebräisch auch hebräisch erscheint. Ein
Kommentar mit dem Wort „nachgemessen" darin ist keine Messung.

**Behoben** in `scripts/native-strings.mjs`: eine Tabelle `LEGACY_LANGUAGE`
schreibt die drei Sprachcodes um, `resourceDir` benutzt sie. Aus
`values-b+he` wird `values-b+iw`.

Gegenmessung am Gerät, gleicher Ablauf:

| Sprache | vorher                 | nachher                |
| ------- | ---------------------- | ---------------------- |
| `he`    | Insert test key        | הוספת מפתח בדיקה       |
| `id`    | Insert test key        | Sisipkan kunci uji     |
| `de`    | Testschlüssel einfügen | Testschlüssel einfügen |
| `en`    | Insert test key        | Insert test key        |

Und die Gegenprobe auf die kniffligen Codes, damit der Fix nichts anderes
zerschlägt: `zh-Hans` und `zh-Hant` liefern unterschiedliche Sätze
(密钥 gegen 密鑰), `pt-BR`, `pt-PT`, `ar` und `th` erscheinen übersetzt.

Jiddisch ist heute nicht unter den 37; die Zeile steht trotzdem in der
Tabelle, damit der stille Fehler nicht zurückkommt, wenn jemand die Sprache
ergänzt.

### Android Lint — von 7 Fehlern auf 0

Lint war vorher nie gelaufen. `gradlew :app:lintRelease` meldete **7 Fehler,
30 Warnungen**; danach **0 Fehler, 30 Warnungen**.

| Befund                                                          | Bewertung                 | Was daraus wurde                                                  |
| --------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------- |
| `MissingClass` am Startup-Provider                              | mein eigener N17-Eingriff | `tools:ignore` samt Begründung — die Klasse kommt erst beim Merge |
| `NewApi` ×2 (`windowLightNavigationBar` verlangt 27, minSdk 26) | echt, folgenlos           | `tools:targetApi="27"` in beiden Themes                           |
| `LocalContextConfigurationRead` ×2                              | **echt und wirksam**      | siehe unten                                                       |
| `NonObservableLocale`                                           | **echt und wirksam**      | siehe unten                                                       |
| `BidiSpoofing` in `Settings.kt`                                 | Fehlalarm auf die LÖSUNG  | `@Suppress` mit Begründung                                        |
| `DataExtractionRules`                                           | **echte Lücke**           | siehe unten                                                       |
| `LocaleFolder` ×2                                               | **der Sprachfehler oben** | behoben                                                           |

**Die Konfiguration wurde unbeobachtbar gelesen.** `Text.kt` holte die Sprache
über `LocalContext.current.resources.configuration`, und eine Änderung der
Konfiguration macht `LocalContext` NICHT ungültig. Weil `configChanges` im
Manifest die Activity gar nicht neu erstellen lässt, wäre nach einem
Sprachwechsel die alte Zahlengruppierung stehen geblieben (600,000 statt
600 000). Jetzt `LocalLocale.current.platformLocale`; der Rückfall auf
`Locale.getDefault()` ist ersatzlos weg, weil auch er an der Beobachtung
vorbeiliest. Dieselbe Stelle noch einmal in `Vault.kt` — dort wurde die
Sprache in einer Lambda gelesen, die den Wechsel erst recht nicht mitbekommen
hätte.

**`allowBackup="false"` deckt seit Android 12 nur noch die Cloud.** Lint sagt
es wörtlich: „In Android 12 and higher, these attributes have been deprecated
and will only apply to cloud backups." Die Geräte-zu-Geräte-Übertragung (Smart
Switch und Verwandte) läuft daneben weiter — `vault.json` wäre beim
Telefonwechsel mitgewandert, obwohl im Manifest seit 1.x das Gegenteil steht.
Neu: `res/xml/data_extraction_rules.xml` schließt beide Wege an der Wurzel
aus. Der Preis steht in der Datei: Wer das Telefon wechselt, nimmt den Tresor
nicht mit.

### Die neun Breiten-Punkte

**1. Abhängigkeiten.** Elf direkte, **232 Einträge im transitiven Baum**
(`gradlew :app:dependencies --configuration releaseRuntimeClasspath`). Keine
bekannten CVEs: ZXings Meldungen betrafen die Android-Beispiel-App, nicht
`core`; die Kotlin-CVEs (2022-24329, 2020-29582) liegen weit unter 2.4.10.

Nach dem emoji2-Befund ist der Baum auf „was hat das hier zu suchen"
durchgesehen. Auffällig ist eine Wurzel: **`androidx.appcompat` liegt für
GENAU EINEN Aufruf im Baum** (`setApplicationLocales`) und zieht die halbe
Legacy-View-Welt mit — `print`, `drawerlayout`, `viewpager`,
`localbroadcastmanager`, `cursoradapter`, `loader`, `transition` — plus
`emoji2`, den N17-Befund. Zweite Wurzel: `camera-view` zieht
`camera-video` mit, also Videoaufnahme in einem Authenticator.

Was davon das APK erreicht, ist gemessen statt vermutet (Grep über
`classes.dex` des Release-APK):

| Artefakt                                                                           | im Release-Dex      |
| ---------------------------------------------------------------------------------- | ------------------- |
| `androidx/camera/video`                                                            | **0** — R8 entfernt |
| `kotlinx/serialization`                                                            | **0**               |
| `androidx/autofill`, `print`, `drawerlayout`, `viewpager`, `localbroadcastmanager` | **0**               |
| `androidx/emoji2`, `window`, `profileinstaller`, `appcompat`                       | vorhanden           |

R8 räumt also auf; übrig bleibt, was wirklich referenziert wird. Der
Architektur-Befund bleibt trotzdem stehen und ist ein Folgeposten wert.

**2. Lint** — oben. **StrictMode** ist NICHT eingebaut: Es bräuchte
Debug-Code im Auslieferungspfad, und was es fände (Platten-Zugriff auf dem
Hauptfaden) ist hier statisch abzählbar — die App liest beim Start drei
Dateien von wenigen hundert Byte.

**3. Strings-Probe im Release-APK.** Sauber: `GEZDGNBVGY3TQOJQ` (der
RFC-4226-Testschlüssel) steht **einmal** in `classes.dex` — das ist die
bewusste Konstante `TEST_KEY`. `JBSWY3DPEHPK3PXP` steht 60-mal in
`resources.arsc`, das ist der übersetzte Beispiel-Platzhalter. Keine
Test-Passphrasen, keine Fixtures, kein RFC-Seed, keine Testfall-Namen.

Nebenbei aufgefallen und benannt: `DebugProbesKt.bin` (1728 Byte, aus
kotlinx-coroutines) und `kotlin-tooling-metadata.json` (626 Byte, nennt
Gradle- und Plugin-Version) reisen im Release mit. Kein Geheimnis, aber
totes Gewicht.

APK-Zusammensetzung, entpackt: `classes.dex` 2.963.392 · `res` 1.238.424
(Schriften) · `resources.arsc` 767.572 (37 Sprachen) · `lib` 202.236 (4 ABIs
× 3 native Bibliotheken) · `assets` 5.782 (**das Baseline-Profil, F2**).

**4. Zwischenablage.** `EXTRA_IS_SENSITIVE` wird ab API 33 gesetzt — im Code
verifiziert. Am Gerät nachzumessen ging NICHT: `dumpsys clipboard` liefert
seit Android 13 nichts mehr. Was messbar war: Nach dem Kopieren stand kein
sechsstelliger Code in irgendeiner Systemeinblendung.

**5. Prozesstod.** HOME → `am kill` (die pid war danach leer) → neu gestartet:
Die App steht im **Leerzustand**, das Feld ist leer. Nichts im Klartext
wiederhergestellt. Wichtig für die Wiederholung: `am kill` greift nur im
HINTERGRUND — im Vordergrund passiert nichts, und der Test misst dann sich
selbst.

**6. Tastatur.** Zwei Befunde, beide gemessen:

- `imeOptions=0xc2000000` = `FORCE_ASCII | NO_ENTER_ACTION | NO_FULLSCREEN`.
  `IME_FLAG_NO_PERSONALIZED_LEARNING` (0x1000000) ist **nicht** gesetzt — die
  seit N15 dokumentierte Grenze, jetzt mit Zahl.
- `inputType=0x20001` = `TYPE_CLASS_TEXT | MULTI_LINE`. **`TYPE_TEXT_FLAG_NO_SUGGESTIONS`
  fehlt**, obwohl `autoCorrectEnabled = false` im Code steht. Die Absicht kommt
  also nicht bei der Tastatur an. Folgeposten.
- **Autofill hängt am Secret-Feld.** `dumpsys autofill`:
  `s=com.samsung.android.samsungpassautofill … b=Rect(180,1807-1260,2055)` —
  genau die Grenzen des Feldes, dazu eine „augmented" Anfrage an
  `com.samsung.android.smartsuggestions`. Ein Versuch,
  `window.decorView.importantForAutofill = …NO_EXCLUDE_DESCENDANTS` zu setzen,
  ist wieder ausgebaut: Er hat GEMESSEN nichts geändert, weil Compose seine
  Felder über virtuelle View-Ids selbst anmeldet (`i=…:i110`) und die
  Wichtigkeits-Regel der View-Hierarchie dort nicht greift. Folgeposten.

**7. Cache-Reste.** Strukturell sauber, und das ist besser als aufgeräumt: Die
App schreibt genau fünf Dateien, alle im `filesDir` (`vault.json`,
`vault.json.tmp`, `vault-wrap.json`, `lock-settings.json`,
`webview-import.json`). `cacheDir`, `externalCacheDir` und `createTempFile`
kommen im ganzen Quellbaum **nicht vor**. Es gibt **kein `ImageCapture`** —
die Kamera schreibt nie eine Datei, es laufen nur `Preview` und
`ImageAnalysis`. Der Photo-Picker-Weg öffnet die `content://`-URI zweimal
lesend und gibt die Bitmap mit `recycle()` zurück; kopiert wird nichts.

**8. Härtetests.** RTL ist gemessen: Auf Arabisch erscheint die Oberfläche
vollständig übersetzt, „RFC 6238" und „javax.crypto" bleiben lateinisch.
Schriftskala 2.0 und der Monkey-Lauf sind NICHT gelaufen — der Emulator ließ
sich zweimal nicht in einen brauchbaren Zustand bringen (Benachrichtigungs-
schleier klemmte, danach hielt die alte Instanz die AVD-Sperre), und ein
Monkey mit 5000 Ereignissen gehört ohnehin nicht auf Kevins Alltagstelefon.
Offen, Rezept in den Folgeposten.

**9. Barrierefreiheit — und zwei Fehler, die nur im Code zu sehen sind.**
Die Abdeckung ist gut: Live-Regionen für Meldungen (`Assertive` bei Fehlern,
`Polite` bei Status), `Role.Button`/`Switch`/`Tab`, `selected`,
`clearAndSetSemantics` an den dekorativen Zeichen. Zwei Stellen sprachen
jedoch **Englisch, in allen 37 Sprachen**:

- `stateDescription = if (expanded) "expanded" else "collapsed"` an jeder
  Fold-Zeile. Ersetzt durch die Standard-Aktionen `expand`/`collapse` — die
  benennt die Plattform selbst, in der Sprache des Nutzers.
- `stateLabel = if (checked) "on" else "off"` an jedem Schalter. Schlimmer als
  nur unübersetzt: `stateDescription` ÜBERSCHREIBT die Ansage, die die
  Plattform für `Role.Switch` von sich aus macht — und der Kommentar zwei
  Zeilen darüber behauptete genau das Richtige („TalkBack sagt dann an/aus").
  Ersetzt durch `toggleableState`, also die Angabe WAS der Zustand ist; die
  Benennung bleibt bei dem, der die Sprache kennt.

Eine Sprachausgabe sieht man auf keinem Bildschirmfoto. Gefunden hat das der
Grep, nicht das Auge — genau Kevins Punkt.

### Die kleinen Befunde F2–F7

|         | Befund                                             | Ausgang                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F2**  | ART-Baseline-Profile an, 1.x schaltet sie ab       | **Bleiben an.** Die 1.x-Begründung trägt hier nicht: Dort war die Java-Seite eine dünne Capacitor-Brücke, hier ist die ganze Oberfläche Kotlin und Compose — das Profil beschleunigt genau den teuren Kaltstart, und es kostet 5.782 Byte. Die Reproduzierbarkeit scheitert ohnehin an R8 unter fremdem JDK. Im Manifest-Kopf begründet.                                                                                                                                                                                                                                                                                        |
| **F3**  | Zwischenablage wird nie geleert                    | **Geschlossen mit Begründung.** Seit Android 10 liest keine Hintergrund-App die Zwischenablage; `EXTRA_IS_SENSITIVE` hält den Inhalt aus der Vorschau und aus der Verlaufsliste der Tastatur; und ein TOTP-Code ist nach 30 s ohnehin wertlos. Eine App, die den systemweiten Puffer hinter dem Rücken des Nutzers leert, bricht sein Einfügen.                                                                                                                                                                                                                                                                                 |
| **F4**  | Tapjacking                                         | **Drei Wege geprüft, keiner eigenmächtig gangbar.** `setHideOverlayWindows` (ab API 31) verlangt `HIDE_OVERLAY_WINDOWS` — gemessen, Lint bricht sonst ab — und damit eine neue Berechtigung im Block von F-Droid und Play; das ist Kevins Entscheidung. `filterTouchesWhenObscured` auf der Wurzel macht die App unter jedem Blaulichtfilter unbedienbar. Nur auf einzelnen Tasten ginge in Compose nicht ohne eigenes View-Gerüst. Entschärft ist es ohne unser Zutun: Seit Android 12 blockiert die Plattform Berührungen durch nicht vertrauenswürdige Overlays selbst. Die Abwägung steht ausgeschrieben in `MainActivity`. |
| **F5**  | `taskAffinity`                                     | **Umgesetzt.** `android:taskAffinity=""` — eine fremde App kann sich nicht mehr in dieselbe Aufgabe stellen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **F6**  | Eingemischte Komponenten stehen in keinem Manifest | **Umgesetzt.** Der Manifest-Kopf führt sie jetzt einzeln auf: CameraX-MetadataHolder, Startup-Provider samt der zwei verbliebenen Initialisierer, der DUMP-geschützte `ProfileInstallReceiver`, die zwei `uses-library`-Einträge.                                                                                                                                                                                                                                                                                                                                                                                               |
| **F7a** | Filtertext in `rememberSaveable`                   | **Umgesetzt**, jetzt `remember` — dieselbe Begründung wie beim Secret-Feld in P6, und derselbe Preis: null.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **F7b** | Nachsichtige Hex-Ziffern                           | **Umgesetzt.** `PercentCodec` und `Json` nahmen über `Character.digit` bzw. `toIntOrNull(16)` auch arabisch-indische und vollbreite Ziffern und ein führendes Vorzeichen an; `decodeURIComponent` tut das nicht. Von Hand gerechnet, ein Test dazu.                                                                                                                                                                                                                                                                                                                                                                             |
| **F7c** | Per-App-Sprache überlebt „Daten löschen"           | **Geschlossen.** Sie liegt ab API 33 in den Systemeinstellungen; das ist die Plattform-API, kein eigener Speicher. Kein Geheimnis.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **F7d** | R8-Metadaten-Warnungen                             | **Geschlossen.** Kotlin 2.4.10 ist neuer als das R8 von AGP 8.13 — die dokumentierte Zange. Kostet Optimierung, nicht Korrektheit.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### Ketten

Kotlin **231 Tests**, null Fehler (223 + 7 aus N19 + 1 aus F7b).
`gradlew :app:lintRelease` **0 Fehler**, 30 Warnungen (alle einzeln
bewertet und begründet). `checkNoMaterial` grün. Web-Kette: typecheck,
**560 Tests**, ESLint, Prettier, Build — und `dist/clockwork.html` trotz
Änderung an `scripts/native-strings.mjs` **byte-identisch**: 801.401 Byte,
SHA-256 `175f4a8e…584e`, vor und nach dem Bau gehasht.

### Die Folgeposten aus diesem Lauf

**G1 — Autofill am Secret-Feld abschalten.** Gemessen, versucht, nicht gelöst
(siehe Punkt 6). Der Weg führt über die Compose-Semantik, nicht über
`importantForAutofill`. Braucht eine eigene Runde samt Gegenmessung an
`dumpsys autofill`.

**G2 — `autoCorrectEnabled = false` kommt nicht bei der Tastatur an.**
`TYPE_TEXT_FLAG_NO_SUGGESTIONS` fehlt im gemessenen `inputType`. Zu klären, ob
das an der Compose-Fassung liegt oder an der Kombination mit
`KeyboardType.Ascii`.

**G3 — AppCompat ablösen.** Es liegt für einen einzigen Aufruf im Baum und hat
den emoji2-Befund mitgebracht, dazu die halbe Legacy-View-Welt. Ab API 33
trägt `LocaleManager` die per-App-Sprache selbst; unterhalb davon bräuchte es
eine eigene, kleine Persistenz. Das ist Architektur, kein Fix.

**G4 — Härtetests nachholen** (Schriftskala 2.0, Monkey mit 5000 Ereignissen,
12 Konten). Gehört auf einen frischen Emulator, nicht auf Kevins Telefon.

**G5 — Der Doze-Beweis für N19**, Rezept im N19-Abschnitt. Kevins
Geräteabnahme.

**G6 — `DebugProbesKt.bin` und `kotlin-tooling-metadata.json`** aus dem
Release nehmen (`packaging { resources { excludes … } }`). Zwei Kilobyte und
eine Angabe zur Bauumgebung weniger.
