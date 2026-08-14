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
