# Play-Store-Vorbereitung

> **Achtung, Stand 15.08.2026:** Für Play gilt ab jetzt **v2.0.1, die native
> App** — siehe den Nachtrag in Abschnitt 6. Die Abschnitte 1 bis 5 gelten
> unverändert (Richtlinien, Data Safety, Bau-Entscheidungen, Kanal-Regel); die
> ARTEFAKT-Angaben unten beschreiben weiter 1.5.4 und damit den F-Droid- und
> GitHub-Kanal. Auch der Bildbestand hat sich mit N18 geändert: Es sind
> **sieben Screenshots je Sprache plus Funktionsgrafik**, in beiden Sprachen,
> und sie entstehen jetzt am Emulator statt über Playwright.

**Stand 13.08.2026: fertig vorbereitet, nicht eingereicht.** Im Repo liegt
alles, was sich ohne Google-Konto herstellen lässt — Datenschutzseite,
Listing-Texte in zwei Sprachen, Funktionsgrafik, vier Screenshots in
Play-Maßen und die Bau-Entscheidungen. **Das signierte AAB ist gebaut und
geprüft** (Abschnitt 6). Was noch fehlt, ist allein der Upload: Er braucht
Kevins Entwicklerkonto.

Dieses Dokument ist das Gegenstück zu
[`fdroid-vorbereitung.md`](fdroid-vorbereitung.md) und hält dieselben Dinge
fest: die Prüfung gegen die Aufnahmeregeln, die Bausteine, die Bau-Parameter
und die Entscheidungen samt Begründung.

## 1. Prüfung gegen die Play-Programmrichtlinien

Geprüft am 12.08.2026, Punkt für Punkt:

| Kriterium                       | Befund                                                                                                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Datenschutzerklärung als URL    | ✓ `public/privacy.html`, ausgeliefert unter `/privacy.html`. Pflicht für jeden Eintrag, auch bei Apps, die nichts erheben                                                                     |
| Data-Safety-Angaben             | ✓ vollständig vorbereitet, Abschnitt 3 — überall „keine Erhebung"                                                                                                                             |
| Zielversion der API             | ✓ `targetSdk 36`, weit über der jeweils geltenden Untergrenze                                                                                                                                 |
| Auslieferungsformat             | ✓ AAB (`bundleRelease`); für neue Apps seit 2021 Pflicht                                                                                                                                      |
| Sensible Berechtigungen         | ✓ Einzige System-Berechtigung ist CAMERA, ausschließlich für den QR-Sucher. Keine der gesondert genehmigungspflichtigen (SMS, Anrufliste, Standort im Hintergrund, `QUERY_ALL_PACKAGES`)      |
| Kontolöschung                   | ✓ nicht anwendbar — es gibt keine Konten und keinen Server                                                                                                                                    |
| Werbung, Käufe, Abos            | ✓ nichts davon                                                                                                                                                                                |
| Inhaltsbewertung                | ✓ Werkzeug ohne nutzergenerierte Inhalte; Fragebogen ergibt die niedrigste Stufe                                                                                                              |
| Fremde Vertriebswege im Eintrag | ✓ Der Listing-Text nennt die Projektwebseite und den Quelltext auf GitHub, aber **keinen anderen App-Katalog** — obwohl Clockwork dort liegt. Ein Test hält das fest (`play-listing.test.ts`) |
| Nachladen von ausführbarem Code | ✓ ausgeschlossen: keine INTERNET-Berechtigung, `connect-src 'none'` in der ausgelieferten Datei                                                                                               |
| Verschlüsselung / Exportregeln  | ✓ nur `crypto.subtle` des Systems, keine mitgelieferte Krypto-Implementierung                                                                                                                 |

**Der Punkt, den eine Prüfung ansprechen könnte,** ist derselbe wie bei
F-Droid: „WebView-App". Die Antwort ist dieselbe und gehört in die
Store-Beschreibung, wo sie auch steht — es gibt keine entfernte Webseite, die
gewrappt würde. Der Inhalt liegt vollständig im Paket, wird aus dem Quelltext
gebaut, und das Manifest verbietet dem Prozess jede Netzverbindung.

## 2. Was im Repo liegt

```
play/listing/
├── en-US/
│   ├── title.txt                    „Clockwork" — 9 von 30 Zeichen
│   ├── short_description.txt        75 von 80 Zeichen
│   ├── full_description.txt         2054 von 4000 Zeichen
│   └── images/
│       ├── featureGraphic.png       1024 × 500, Farbtyp 2, 7,1 kB
│       └── phoneScreenshots/1–4.png 1080 × 1920, Farbtyp 2, je 112–136 kB
└── de-DE/
    └── title.txt · short_description.txt · full_description.txt
```

**Grafiken nur in `en-US`** — Play erbt sie aus der Standardsprache, `de-DE`
bekommt ausschließlich eigene Texte. Dieselbe Aufteilung wie bei den
fastlane-Metadaten für F-Droid.

**Das App-Icon wird nicht dupliziert:** Play verlangt 512 × 512 als 32-Bit-PNG
mit Alpha, und genau das ist `public/icon-512.png` (6.892 Byte, erzeugt von
`scripts/icons.mjs`). Eine Kopie unter `play/` wären zwei Wahrheiten für
dieselbe Datei.

Die Zeichenzahlen oben sind nicht abgeschrieben, sondern gemessen —
`scripts/play-listing.test.ts` prüft sie bei jedem `npm test` gegen die
Grenzen der Console. Der Grund ist die Kurzbeschreibung: 75 und 78 von 80
Zeichen sind so knapp, dass ein eingefügtes Wort sie sprengt, und auffallen
würde das sonst erst beim Hochladen.

### Die Funktionsgrafik

`scripts/play-graphics.mjs` zeichnet sie wie `og-image.mjs` das
Vorschaubild: Skala-Emblem auf Nacht, Punkt-in-Form-Test je Strich in einen
Puffer, 3×3-Überabtastung, PNG über Nodes `zlib`. Keine Bildbibliothek.

Ein Unterschied ist der Grund, warum das Skript eigenständig neben den drei
anderen Generatoren steht: **Play verlangt für die Funktionsgrafik ein
24-Bit-PNG ohne Alphakanal.** Die bestehenden Generatoren schreiben alle
Farbtyp 6 (RGBA), weil ein Icon Transparenz braucht; hier ist sie
regelwidrig. Also Farbtyp 2, drei Byte je Pixel — nachgemessen im Kopf der
fertigen Datei.

Deterministisch wie die anderen: zwei Läufe hintereinander liefern
byte-identische Dateien (gemessen, gleicher SHA-256).

### Die Screenshots — und warum sie nicht aus dem Emulator kommen

**Die vorhandenen F-Droid-Screenshots sind für Play unbrauchbar.** Sie sind
1080 × 2400, Verhältnis **2,222**. Play lässt höchstens 2,0 zu („the maximum
dimension can't be more than twice as long as the minimum"). Gemessen, nicht
vermutet — und es wäre erst beim Hochladen aufgefallen.

`scripts/shoot-play.mjs` nimmt deshalb vier eigene auf, in **1080 × 1920**
(16:9, Verhältnis 1,778 — Googles empfohlenes Hochformat). Erzeugt aus einem
Fenster von 360 × 640 CSS-Pixeln bei dreifacher Skalierung, also genau so, wie
ein Handy mit 1080 Punkten Breite rechnet. Das Fenster liegt damit unter
420 px: Jede Aufnahme zeigt das Kompaktraster der Karte.

| Datei   | Motiv             | Was es zeigt                                         |
| ------- | ----------------- | ---------------------------------------------------- |
| `1.png` | Codes, hell       | die Hauptfunktion — Zifferblatt, Code, Kopiertaste   |
| `2.png` | Codes, dunkel     | dieselbe Ansicht im dunklen Modus                    |
| `3.png` | Tresor, hell      | Verschlüsselung und der Fuß „no network, no storage" |
| `4.png` | Leerzustand, hell | wie man anfängt                                      |

**Aufgenommen wird über Playwright, nicht im Emulator.** Entstanden ist das
aus der Not — am 12.08. gab es auf der Maschine weder SDK noch AVD —, aber es
ist als Dauerlösung tragfähig: Die App IST dieselbe Einzeldatei in einem
System-WebView, das Bild also dasselbe bis auf die Android-Statusleiste, die
die F-Droid-Aufnahmen im Demo-Modus tragen. Play verlangt keine
Geräteaufnahme, sondern eine Abbildung der App.

Der Nebeneffekt ist der eigentliche Gewinn: Die vier Bilder entstehen in einer
Minute reproduzierbar neu, ohne Emulator-Start, und das Skript misst jede
Aufnahme selbst nach. Wer sie doch mit Statusleiste will, braucht ein AVD im
**16:9-Format** — das vorhandene `clockwork-test` (1080 × 2400) taugt dafür
nicht, sein Verhältnis 2,222 lässt Play nicht zu.

Das Skript misst jede Aufnahme nach, statt sich auf den `deviceScaleFactor` zu
verlassen: Kantenlängen, Seitenverhältnis und waagerechter Überlauf. Ein
Überlauf fällt auf einem Standbild nicht auf — die Seite wird einfach seitlich
scrollbar, genau so ist in V3 ein Kanalzug unbemerkt 60 px über den Rand
gelaufen.

## 3. Die Data-Safety-Angaben, vorbereitet

Das Formular in der Play Console ist Handarbeit (Teil 1). Damit dort nichts
geraten werden muss, hier die Antworten:

| Frage der Console                                  | Antwort                                                                                                                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Erhebt oder teilt die App Nutzerdaten?             | **Nein** — keine einzige Kategorie                                                                                                                                      |
| Werden Daten übertragen?                           | Nein. Die App hat keine INTERNET-Berechtigung; eine Übertragung ist technisch ausgeschlossen                                                                            |
| Werden Daten auf dem Gerät gespeichert?            | Nur mit ausdrücklicher Einwilligung (Tresor), verschlüsselt, ausschließlich lokal. Das ist keine „Erhebung" im Sinne des Formulars, weil nichts den Entwickler erreicht |
| Verschlüsselung bei der Übertragung                | Nicht anwendbar — es gibt keine Übertragung                                                                                                                             |
| Können Nutzer Löschung verlangen?                  | Nicht anwendbar — es liegen keine Daten bei uns. Auf dem Gerät löscht „Alles löschen" oder die Deinstallation alles                                                     |
| Datentypen (Standort, Kontakte, Fotos, Dateien, …) | Keiner. Die Kamera liefert Bilder, die im Arbeitsspeicher dekodiert und verworfen werden — nichts wird gespeichert oder gesendet                                        |
| Werbe-ID                                           | Nein                                                                                                                                                                    |
| Absturz- und Diagnoseberichte                      | Nein — kein Crash-Reporting, keine Telemetrie                                                                                                                           |
| Zielgruppe Kinder                                  | Nein, aber auch keine Datenerhebung von irgendwem                                                                                                                       |

**Ein Link zur Datenschutzerklärung in der App** ist nicht nötig: Play
verlangt ihn, wenn personenbezogene Daten erhoben werden. Hier wird nichts
erhoben, und der Fuß der App sagt bereits „no network · no storage".

## 4. Bau-Parameter

| Parameter         | Wert                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Artefakt          | AAB — `cd android && ./gradlew bundleRelease`                                                                                      |
| Ergebnis          | `android/app/build/outputs/bundle/release/app-release.aab`                                                                         |
| Web-Bau davor     | `npm run android` (Vite-Bau, Einzeldatei, Icons, Sync ohne Capacitor-CLI)                                                          |
| Signierung        | derselbe Weg wie beim APK: `CLOCKWORK_KEYSTORE` zeigt auf die properties-Datei; ohne die Variable entsteht ein unsigniertes Bundle |
| versionCode/-Name | 10504 / 1.5.4 aus `android/app/build.gradle` — kanalübergreifend dieselbe Zahl                                                     |
| Gradle / AGP      | 9.5.1 über den Wrapper (SHA-256 verankert) · AGP 8.13 · compileSdk/targetSdk 36 · minSdk 24                                        |

**Kein npm-Skript für den Gradle-Aufruf.** `npm run android` deckt den
Web-Teil ab, der Gradle-Befehl steht wie bei `assembleDebug` in der Doku: Ein
`cd android && gradlew.bat` in der `package.json` wäre Windows-only und bräche
eine bis dahin plattformneutrale Skriptliste.

### `dependenciesInfo` bleibt aus — gegen Googles Empfehlung

`android/app/build.gradle` setzt `includeInApk false` **und**
`includeInBundle false`. Der erste Wert steht dort für F-Droid, das den Block
ablehnt: eine verschlüsselte, nur für Google lesbare Abhängigkeitsliste im
Signaturblock. Der zweite gilt jetzt auch für den Play-Weg, und das ist eine
bewusste Entscheidung gegen die Empfehlung:

- Der Block speist in der Play Console die **Schwachstellen-Anzeige** für
  Bibliotheken. Play lehnt ein AAB ohne ihn **nicht** ab; es fehlt allein
  diese Anzeige.
- Zu zeigen hätte sie hier wenig. Die Web-App hat genau **eine**
  Laufzeit-Abhängigkeit (jsQR); alles andere sind `devDependencies` und die
  androidx-Pakete der Capacitor-Hülle.
- Die Alternative wäre eine zweite Baukonfiguration je Kanal. **Ein Artefakt,
  zwei Rezepte** kostet mehr als der Verzicht — und zwar dauerhaft, denn jede
  künftige Änderung müsste beide Wege treffen.

## 5. Play App Signing und die Kanal-Regel

**Für neue Apps hält Google den Signaturschlüssel.** Play App Signing ist
nicht abwählbar: Hochgeladen wird mit einem _Upload-Key_, ausgeliefert werden
APKs, die Google mit **seinem** App-Signaturschlüssel signiert. Der eigene
Keystore ist auf diesem Weg also nicht mehr die Signatur der App, sondern nur
noch der Ausweis beim Hochladen.

Das hat eine praktische Seite, die man nicht beschönigen sollte, aber auch
nicht dramatisieren muss:

- **Ein verlorener Upload-Key ist ersetzbar.** Über den Google-Support lässt
  er sich zurücksetzen; die App bleibt aktualisierbar.
- **Ein verlorener eigener Release-Key ist es nicht.** Er signiert die
  APKs am GitHub-Release, und dort gibt es niemanden, der etwas zurücksetzen
  könnte. Er bleibt damit der kritische Schlüssel des Projekts — unabhängig
  davon, was Play tut.

Daraus folgt die **Kanal-Regel**, die es bisher nur für zwei Quellen gab:

| Bezugsquelle   | Wer signiert                         | Zertifikat                                                              |
| -------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| GitHub-Release | wir selbst (`clockwork-release.jks`) | SHA-256 `d31e10a4…cf3f` (neuer Schlüssel seit 12.08.2026, siehe README) |
| F-Droid        | F-Droid mit eigenem Schlüssel        | deren Katalog-Schlüssel                                                 |
| Google Play    | **Google** (Play App Signing)        | von Google erzeugt                                                      |

**Keine zwei davon sind gegenseitig updatefähig.** Android nimmt ein Update
nur an, wenn es dieselbe Signatur trägt wie die installierte App. Ein Wechsel
der Bezugsquelle verlangt deshalb Deinstallation — und die löscht die
App-Daten **mitsamt einem auf dem Gerät gespeicherten Tresor**. Wer wechselt,
sperrt vorher den Tresor auf und kopiert die Einträge aus dem Textfeld heraus.

Aufzulösen wäre das nur über einen **reproduzierbaren Bau**: F-Droid liefert
dann das entwicklersignierte APK aus statt eines eigenen. Das ist versucht
worden und gescheitert — 14 abweichende Einträge aus Werkzeugketten-
Unterschieden, nachzulesen in
[`fdroid-vorbereitung.md`](fdroid-vorbereitung.md) Abschnitt 3. Für Play
hilft es ohnehin nicht: Dort signiert Google, unabhängig von jeder
Reproduzierbarkeit.

## 6. Der Stand — das AAB liegt fertig da

> **Nachtrag 15.08.2026 (P9): Für Play gilt ab jetzt v2.0.1, nicht 1.5.4.**
> Kevins Entscheidung: Der erste Play-Build ist die **native** App aus dem
> Zweig `kotlin-android` — nicht die WebView-Fassung. Dieser Abschnitt
> beschreibt darunter weiter den 1.x-Stand; er bleibt stehen, weil er den
> F-Droid- und GitHub-Kanal betrifft und weil die Abschnitte 1 bis 5
> unverändert gelten (Richtlinien, Data Safety, `dependenciesInfo`,
> Kanal-Regel).
>
> **Warum 2.0.1 und nicht 2.0.0 (D1, 15.08.2026):** Der 2.0.0-Bau ging in den
> geschlossenen Test und hatte dort einen bekannten Defekt — Play teilte das
> Bundle nach Sprachen auf, und 35 der 37 Sprachen kamen auf dem Gerät nie an.
> Play nimmt eine Nummer kein zweites Mal an; 20000 steht damit dauerhaft für
> den defekten Stand. Behoben mit `bundle { language { enableSplit = false } }`,
> nachgemessen in `android-native/docs/abnahme/README.de.md` (Abschnitt D1).
>
> Was sich für v2.0 ändert:
>
> |                     | 1.5.4 (unten)                            | **2.0.1 (Play)**                               |
> | ------------------- | ---------------------------------------- | ---------------------------------------------- |
> | Gebaut in           | `android/` (Capacitor)                   | `android-native/`                              |
> | Befehl              | `npm run android; gradlew bundleRelease` | `cd android-native; gradlew.bat bundleRelease` |
> | versionCode / -Name | 10504 / 1.5.4                            | **20001 / 2.0.1**                              |
> | AAB                 | 1.604.575 Byte                           | **5.432.694 Byte** (signiert gemessen)         |
> | APK                 | 1.235.807 Byte                           | **3.289.773 Byte**                             |
>
> Die Größe ist in `android-native/docs/abnahme/README.de.md` (Abschnitt P9)
> eingeordnet. Berechtigungen und Zusagen sind am Release-APK mit
> `aapt2 dump badging` nachgemessen: kein INTERNET, CAMERA plus die zwei
> Biometrie-Berechtigungen, beide Kamera-Features `uses-feature-not-required`.

Am 12.08.2026 war hier noch alles Android-nahe blockiert: Die Maschine war
frisch aufgesetzt, es gab weder SDK noch JDK noch den Keystore. Beides ist
seither erledigt — Android Studio ist wieder installiert (JBR = OpenJDK 25,
SDK mit build-tools 36.0.0), und der Release-Schlüssel ist **neu erzeugt**,
weil der alte nicht wiederherstellbar war. Einzelheiten zum Wechsel stehen in
[`README.de.md`](README.de.md#der-signaturschlüssel-hat-am-12082026-gewechselt).

**Gebaut und geprüft am 13.08.2026:**

| Artefakt          | Größe          | Prüfung                                                                         |
| ----------------- | -------------- | ------------------------------------------------------------------------------- |
| `app-release.aab` | 1.604.575 Byte | signiert, Zertifikat `d31e10a4…cf3f`, aus `keytool -printcert -jarfile` gelesen |
| `clockwork.apk`   | 1.235.807 Byte | `apksigner`: „Verifies", v2-Schema, **kein INTERNET** im Manifest               |

Beide tragen versionCode **10504** / versionName **1.5.4** — kanalübergreifend
dieselbe Zahl.

**Das AAB liegt bewusst nicht im Repo.** Es entsteht in
`android/app/build/outputs/bundle/release/` und wird bei jedem Release neu
gebaut; eine 1,6-MB-Binärdatei einzuchecken, die aus dem Quelltext folgt,
widerspräche der Linie des Projekts. Neu bauen:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:CLOCKWORK_KEYSTORE = 'C:\Users\Kevin\clockwork-keys\key.properties'
npm run android
cd android; .\gradlew.bat bundleRelease
```

**Was jetzt noch fehlt, ist ausschließlich Kevins Teil 1:** Entwicklerkonto
anlegen, Store-Eintrag füllen (Texte und Grafiken liegen unter
`play/listing/`), Data Safety nach Abschnitt 3 beantworten, Inhaltsbewertung
ausfüllen, das AAB hochladen. Von hier aus ist nichts mehr vorzubereiten.
