# F-Droid-Vorbereitung

Stand 10.08.2026: **eingereicht, drei Review-Runden eingearbeitet.** Der
Merge-Request
[fdroid/fdroiddata!45284](https://gitlab.com/fdroid/fdroiddata/-/merge_requests/45284)
ist offen. Dieses Dokument hält die Prüfung gegen die Aufnahmeregeln fest,
beschreibt die Bausteine (fastlane-Metadaten, Build-Härtung), enthält die
eingereichte Metadaten-Fassung und die Anleitung, die zum MR geführt hat —
samt der Lehren aus den roten Pipelines und aus dem Review.

## 0. Was das Review verlangt hat (10.08.2026)

### Dritte Runde

`linsui`, knapp: **„Change the category."** Zu Recht — `Security` ist der
alte Sammeltopf. F-Droid führt seit der Kategorien-Überarbeitung eine
feingliedrige Liste (`config/categories.yml` in fdroiddata, gut 100
Einträge), und darin steht **`Password & 2FA`**. Das benutzen auch die
bestehenden Authenticator-Apps: Aegis trägt `Password & 2FA` + `Security`,
FreeOTP `Password & 2FA` + `System`; nur das unpflegte andOTP steht noch
allein unter `Security`.

Eingetragen ist **`Password & 2FA`** allein — „change" heißt ersetzen, nicht
ergänzen. Im MR angeboten, `Security` wie bei Aegis wieder danebenzustellen,
falls der Reviewer das Paar bevorzugt. Pipeline danach grün: **2747186427**.

### Zweite Runde

`linsui`, kurz nach der ersten Antwort:

3. **„Please don't use tag or branch in commit. Use the full commit hash
   instead."** Aus `commit: v1.5.2` wurde
   `commit: 36c7ef406fdacc7dd23a0c246b3910e054957604`.
4. **„Please follow the template at templates/build-react-native.yml."**
   Übernommen sind die drei Stellen, die auf dieses Projekt passen:
   `apt-get install -y npm` (das Debian-Paket `npm` zieht `nodejs` mit),
   `scandelete` statt `scanignore` und der volle Hash. Der Rest der Vorlage
   ist React-Native-Sache — expo, firebase-stub, Hermes-Binärdateien, ein
   `npx expo prebuild`, das den Android-Ordner erst erzeugt. Clockwork hat
   kein Plugin und trägt `android/` im Repo.

   **Eine bewusste Abweichung:** Die Vorlage schreibt `npm install`, wir
   lassen `npm ci` stehen — sonst löste der Bau die Versionsbereiche zur
   Bauzeit neu auf, statt das Lock-File zu nehmen. Im MR gefragt, ob das so
   bleiben darf.

Pipeline danach grün: **2746774024**.

### Erste Runde

`linsui` hat zwei Punkte angemerkt, beide zur Build-Rezeptur:

1. **„Install node from debian."** Die erste Fassung zog ein per SHA-256
   geprüftes Node-22-Tarball von nodejs.org. Ein vorgebautes Binärpaket im
   Bau ist genau das, was F-Droid nicht will — die Bitte ist prinzipiell und
   nicht geschmacklich, und sie ist berechtigt.
2. **„Don't connect the commands with ; or &&. Use a list of strings
   instead."** `init` und `prebuild` standen als eine Zeichenkette mit `&&`
   da. fdroidserver verkettet Listen ohnehin selbst mit `; ` und führt sie
   unter `bash -e -u -o pipefail -x` aus — als Liste steht jeder Schritt
   einzeln im Bauprotokoll.

Punkt 2 ist eine Formsache. Punkt 1 ließ sich **nicht** in den Metadaten
lösen, und der Grund ist gemessen: Der Buildserver ist Debian trixie, und
Debian hat dort nur `nodejs` **20.19.2** (kein Backport; Node 22 gibt es
erst in sid). Capacitors CLI verlangt in `bin/capacitor` hart Node ≥ 22.
Vite selbst läuft auf Node 20 (`^20.19.0 || >=22.12.0`) — gestorben war
also nur der Sync-Schritt.

Behoben wurde es deshalb **im Projekt, nicht in den Metadaten**:
`scripts/android-sync.mjs` schreibt die sechs Dateien, die `cap sync`
erzeugt, in gewöhnlichem JavaScript — byte-identisch, im gebauten APK
nachgeprüft. Damit fällt die Node-22-Bedingung aus dem Bau, und die
Rezeptur wird kürzer statt länger. Einzelheiten in
[`README.de.md`](README.de.md#der-bau-kommt-ohne-den-capacitor-cli-aus-seit-v152).
Das erforderte einen Commit und damit ein Tag: **v1.5.2**. Damit gibt es
zum ersten Mal ein Tag auf einem Stand mit `android/`, und erst das macht
`AutoUpdateMode: Version` + `UpdateCheckMode: Tags` möglich. Im
`commit:`-Feld steht trotzdem der volle Hash und nicht das Tag — siehe
zweite Runde oben.

## 1. Prüfung gegen die Inclusion Policy

Geprüft gegen <https://f-droid.org/en/docs/Inclusion_Policy/> (abgerufen am
09.08.2026), Punkt für Punkt:

| Kriterium                                | Befund                                                                                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FLOSS-Lizenz                             | ✓ MIT (LICENSE im Repo)                                                                                                                                                                      |
| Lizenzen der Bestandteile                | ✓ jsQR Apache-2.0 · Capacitor MIT · androidx Apache-2.0 · Schriften Inter/Chivo Mono unter SIL OFL (weiterverteilbar; Lizenztexte liegen neben den Dateien)                                  |
| Keine Google-Dienste/Firebase/Analytics  | ✓ Nichts davon. Das `google-services`-Gradle-Plugin aus der Capacitor-Vorlage ist **entfernt** (Classpath und Apply-Block)                                                                   |
| Kein Tracking, keine Werbung             | ✓ Stärker: Die App deklariert **keine INTERNET-Berechtigung** — sie kann nicht ins Netz                                                                                                      |
| Kein Nachladen von ausführbarem Code     | ✓ Alles im APK; die Einzeldatei trägt `connect-src 'none'`                                                                                                                                   |
| Keine API-Schlüssel im Quelltext         | ✓ Es gibt keine Dienste, für die einer nötig wäre                                                                                                                                            |
| Abhängigkeiten aus erlaubten Quellen     | ✓ Maven Central + Google Maven (AGP, androidx), npm-Registry (laut Policy erlaubtes Ökosystem); `flatDir`/`libs` der Vorlage sind leer                                                       |
| Freie Werkzeugkette                      | ✓ OpenJDK, Gradle (Wrapper mit Prüfsumme), AGP, Node/npm, Vite — kein Oracle-JDK, nichts Proprietäres                                                                                        |
| Vorkompilierte Binärdateien im Repo      | ✓ Nur `gradle/wrapper/gradle-wrapper.jar` (vom fdroid-Scanner ausdrücklich ausgenommen); Schriften (woff2) und PNGs sind Daten, keine Programme. `node_modules` entsteht erst beim Bau       |
| Anti-Features                            | **Keine.** Kein NonFreeNet (kein Netz), kein NonFreeDep, kein Tracking, keine Werbung, keine unfreien Assets                                                                                 |
| Eindeutige App-ID aus eigenem Namensraum | ✓ `io.github.keco216.clockwork` — GitHub-Namensraum des Projektkontos, das von F-Droid empfohlene Muster                                                                                     |
| Kein bloßer Webseiten-Wrapper            | ✓ mit Erklärbedarf: Die App IST ein WebView — aber ohne Webseite. Der Inhalt liegt vollständig im APK, wird aus dem Quelltext gebaut und kann mangels INTERNET-Berechtigung nichts nachladen |
| Baubar auf dem F-Droid-Buildserver       | ✓ dem Aufbau nach (npm ci → npm run android → Gradle, unsigniert ohne `CLOCKWORK_KEYSTORE`); die Node-Version des Buildservers ist der wahrscheinlichste Stolperstein, siehe Abschnitt 4     |
| Aktiv gepflegt, keine Demo               | ✓ Öffentliches Repo, Releases, Tests, CI                                                                                                                                                     |

**Der eine Punkt, den ein Reviewer vermutlich anspricht:** „WebView-App".
Die Antwort steht oben in der Tabelle und gehört in die MR-Beschreibung: Es
gibt keine entfernte Webseite, die gewrappt würde — der WebView zeigt eine
lokale Datei aus dem APK, gebaut aus dem Quelltext dieses Repos, und das
Manifest verbietet dem Prozess jede Netzverbindung.

## 2. fastlane-Metadaten (liegen im Repo)

```
fastlane/metadata/android/
├── en-US/
│   ├── title.txt                    „Clockwork"
│   ├── short_description.txt        75 Zeichen (Grenze: 80)
│   ├── full_description.txt
│   ├── changelogs/10400.txt         291 Zeichen (Grenze: 500)
│   ├── changelogs/10500.txt         393 Zeichen
│   ├── changelogs/10502.txt         je Version eine Datei, Name = versionCode
│   └── images/
│       ├── icon.png                 512 × 512, aus public/icon-512.png
│       └── phoneScreenshots/
│           ├── 1.png                Arbeitszustand, hell (Code-Karte)
│           ├── 2.png                Leerzustand, hell (Emblem)
│           └── 3.png                Arbeitszustand, dunkel
└── de-DE/
    ├── title.txt · short_description.txt · full_description.txt
    └── changelogs/10400.txt · 10500.txt · 10502.txt
```

Die Screenshots sind echte Aufnahmen des Release-APKs im Emulator
(1080 × 2400, Demo-Statusleiste), nicht die Desktop-Bilder aus `docs/`.
`de-DE` trägt bewusst keine eigenen Bilder: F-Droid fällt auf die
`en-US`-Bilder zurück, und die Oberfläche der Aufnahmen ist ohnehin
sprachneutral genug (wer deutsche Bilder will, schaltet die App-Sprache im
Fuß um und wiederholt die drei Aufnahmen).

## 3. Build-Parameter und Reproduzierbarkeit

Der Bau ist zweistufig; beide Stufen sind aus versionierten Eingaben
bestimmt:

| Parameter         | Wert                                                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web-Bau           | `npm ci` (package-lock.json) → `npm run android` (Vite-Bau, Einzeldatei, Icons, Sync)                                                                                 |
| Node              | entwickelt mit 26.x; **es genügt Debians `nodejs` 20.19.2** — Vite 8 braucht `^20.19.0 \|\| >=22.12.0`, und seit v1.5.2 ist der Capacitor-CLI (Node ≥ 22) aus dem Bau |
| Gradle            | 9.5.1 über den Wrapper, Distribution per **SHA-256 verankert** (`distributionSha256Sum`)                                                                              |
| AGP               | 8.13.0 · compileSdk/targetSdk 36 · minSdk 24 · build-tools 36.0.0                                                                                                     |
| JDK (lokal)       | OpenJDK 25 (JBR von Android Studio)                                                                                                                                   |
| Release-Build     | `gradlew assembleRelease`; **ohne** `CLOCKWORK_KEYSTORE` unsigniert — der F-Droid-Pfad                                                                                |
| versionName/-Code | 1.5.2 / 10502 (`Major·10000 + Minor·100 + Patch`), fest in `android/app/build.gradle`                                                                                 |

Determinismus-Maßnahmen, jede nachprüfbar:

- **Kein Google-Metadatenblock im APK:** `dependenciesInfo { includeInApk
false }` — der Block wäre eine verschlüsselte, nur für Google lesbare
  Abhängigkeitsliste im Signaturblock; F-Droid verlangt ihn weg.
- **Wrapper-Prüfsumme:** Der Gradle-Wrapper verweigert jede Distribution,
  die nicht das verankerte Archiv ist.
- **Eigene Generatoren ohne Zeitstempel:** icons.mjs, og-image.mjs und
  android-icons.mjs schreiben PNGs ohne tIME-Chunk und ohne Zufall —
  derselbe Quellstand erzeugt dieselben Bytes.
- **Web-Bau aus dem Lock-File:** keine ungebundenen Versionen; die
  Einzeldatei wandert unverändert als Asset ins APK, AGP nullt die
  Zip-Zeitstempel.

**Ehrliche Grenze:** Byte-identische Reproduktion über Maschinen hinweg ist
damit nicht bewiesen. Die bekannte Restquelle ist R8, dessen Ausgabe von der
JDK-Version abhängen kann — lokal lief OpenJDK 25, der F-Droid-Buildserver
nutzt seins. Für die Aufnahme ist das unerheblich (F-Droid baut selbst und
signiert mit eigenem Schlüssel); wer später die „Reproducible
Builds"-Verifikation mit Entwicklersignatur will, muss JDK- und
SDK-Versionen exakt an den Buildserver angleichen — das ist ein eigenes
Vorhaben und hier nicht behauptet.

## 4. Die eingereichte Metadaten-Datei

`metadata/io.github.keco216.clockwork.yml`, **kanonische Fassung** — exakt
der Stand, mit dem die MR-Pipeline grün wurde (Quelle: das
`fdroid rewritemeta`-Job-Artefakt, byte-genau übernommen):

```yaml
Categories:
  - Password & 2FA
License: MIT
AuthorName: Kevin
WebSite: https://clockwork-sage.vercel.app
SourceCode: https://github.com/keco216/clockwork
IssueTracker: https://github.com/keco216/clockwork/issues
Changelog: https://github.com/keco216/clockwork/releases

AutoName: Clockwork

RepoType: git
Repo: https://github.com/keco216/clockwork.git

Builds:
  - versionName: 1.5.2
    versionCode: 10502
    commit: 36c7ef406fdacc7dd23a0c246b3910e054957604
    subdir: android/app
    sudo:
      - apt-get update
      - apt-get install -y npm
    init:
      - cd ../..
      - npm ci
    gradle:
      - yes
    prebuild:
      - cd ../..
      - npm run android
    scandelete:
      - node_modules

AutoUpdateMode: Version
UpdateCheckMode: Tags ^v[0-9.]+$
CurrentVersion: 1.5.2
CurrentVersionCode: 10502
```

Die Entscheidungen darin — und die Lehren aus den roten Pipelines und dem
Review:

- **Node kommt aus Debian.** Die erste Fassung zog ein per SHA-256 geprüftes
  Node-22-Tarball von nodejs.org, weil Capacitors CLI hart Node ≥ 22
  verlangt und Debian trixie nur 20.19.2 hat. Der Reviewer hat das zu Recht
  abgelehnt — ein vorgebautes Binärpaket im Bau ist genau das, was F-Droid
  vermeidet. Aufgelöst wurde es im Projekt statt in der Rezeptur: Seit
  v1.5.2 braucht `npm run android` den CLI nicht mehr (Abschnitt 0). Die
  `sudo`-Liste schrumpft dadurch von sechs Zeilen auf zwei — Debian liefert
  `nodejs` 20.19.2 und `npm` 9.2.0, beides genügt.
- **`init` und `prebuild` sind Listen, keine `&&`-Ketten.** fdroidserver
  verkettet die Einträge selbst mit `; ` und führt sie unter
  `bash -e -u -o pipefail -x` aus — `-e` bricht bei jedem Fehler ab, `-x`
  schreibt jeden Schritt einzeln ins Bauprotokoll. Eine `&&`-Kette ist eine
  Zeile im Log und nimmt genau das weg. `cd ../..` wirkt trotzdem über den
  Zeilenwechsel hinaus, weil alle Einträge in EINER Bash laufen.
- **`fdroid rewritemeta` verlangt SEINE Schreibweise, nicht nur gültiges
  YAML:** `gradle:` VOR `prebuild` (kanonische Feldreihenfolge im
  Builds-Eintrag), einelementige Listen als Strings, Zeilenumbruch am
  Dateiende — und lange Skalare bricht der Dumper selbst um. Wer daneben
  liegt, findet die gültige Fassung als Artefakt des rewritemeta-Jobs unter
  `tmp/<appid>.yml` — byte-genau übernehmen statt von Hand nachbauen.
- **`UpdateCheckMode: Tags` ab v1.5.2.** Die erste Einreichung stand auf
  `Static` mit einem losen Commit-Hash, weil das damals jüngste Tag
  (`v1.4.0`) den Android-Ordner noch nicht enthielt — ein Tag-Checker liefe
  ins Leere. Seit v1.5.2 gibt es ein Tag auf einem Stand mit `android/`,
  also zieht F-Droid neue Versionen selbst.

  **`AutoUpdateMode` nimmt kein Tag-Muster.** Der naheliegende Versuch
  `Version v%v` (weil die Tags ein `v` tragen, der Versionsname aber nicht)
  fällt in der Schema-Prüfung durch: `schemas/metadata.json` erlaubt nur
  `^(None|Version( \+.+)?)$` — nach `Version` darf ausschließlich ein
  Suffix stehen, das mit `+` beginnt. Das `v` findet stattdessen
  `UpdateCheckMode: Tags ^v[0-9.]+$`, und `AutoUpdateMode: Version`
  übernimmt schlicht das Tag, das dabei herauskam.

- **`scandelete: node_modules`, nicht `scanignore`.** Die erste Fassung
  benutzte `scanignore` in der Annahme, `scandelete` lösche den ganzen
  Ordner — und der wird gebraucht, weil der Gradle-Bau Capacitors
  Android-Bibliothek aus `node_modules/@capacitor/android` mitkompiliert.
  Die Annahme war falsch: `scandelete` löscht **nur die einzelnen
  beanstandeten Dateien** (`os.remove(filepath)` in `scanner.py`), nicht den
  Pfad. Damit ist es die strengere und richtige Wahl — `scanignore` heißt
  „hinsehen verboten", `scandelete` heißt „weg damit". Beanstandet werden
  hier sieben Dateien: `source-map/lib/mappings.wasm`,
  `playwright-core/lib/webp_codec.wasm` und fünf `.tar.gz` unter
  `@capacitor/cli/assets`. Keine davon rührt der Bau an — den CLI ruft er
  seit v1.5.2 nicht mehr auf. **Gemessen statt vermutet:** Ein Bau aus
  frischem Klon mit genau diesen sieben Dateien gelöscht liefert ein APK
  derselben Größe (1.231.711 Byte).

  Nebenbei: Ein `scandelete`, das nichts trifft, ist selbst ein Fehler
  („Unused scandelete path"). Beide Listen dürfen also nicht ins Blaue
  hinein stehen.

- **`commit:` trägt den vollen Hash, kein Tag.** Reviewer-Bitte vom 10.08.:
  „Please don't use tag or branch in commit. Use the full commit hash
  instead." Ein Tag lässt sich verschieben, ein Hash nicht. **Achtung, das
  gilt nur für die Handarbeit:** `checkupdates.py` setzt bei
  `AutoUpdateMode: Version` + `UpdateCheckMode: Tags` selbst
  `b.commit = tag`, schreibt in automatisch erzeugte Einträge also den
  Tag-Namen. Die Frage, ob F-Droid das hier so will oder lieber
  `AutoUpdateMode: None` mit einem MR je Release, liegt beim Reviewer.

## 5. Schritt für Schritt: Was auf gitlab.com zu tun ist

_Erledigt am 09.08.2026 — Ergebnis ist MR !45284 mit grüner Pipeline; am
10.08. um die Review-Punkte aus Abschnitt 0 nachgebessert. Die Schritte
bleiben als Anleitung stehen, denn dieselbe Mechanik gilt für jede künftige
Änderung an den Metadaten._

**Gearbeitet wird über die GitLab-API, nicht über einen Klon** — fdroiddata
ist groß, und für eine einzelne Datei lohnt es nicht: Commits in den Fork
per Files-API (PUT, base64), die MR-Beschreibung per PUT auf
`projects/fdroid%2Ffdroiddata/merge_requests/45284`, Kommentare per POST
auf `/notes`.

Empfohlen ist der **direkte Merge-Request an `fdroiddata`** — der
RFP-Weg (<https://gitlab.com/fdroid/rfp>) ist nur sinnvoll, wenn jemand
anderes die Metadaten schreiben soll; sie sind hier aber schon fertig.

1. **GitLab-Konto** anlegen oder anmelden (gitlab.com).
2. **Fork:** <https://gitlab.com/fdroid/fdroiddata> → „Fork" (öffentlich).
3. Fork klonen, Branch anlegen:

   ```bash
   git clone https://gitlab.com/<DEIN-KONTO>/fdroiddata.git
   cd fdroiddata
   git checkout -b io.github.keco216.clockwork
   ```

4. **Metadaten-Datei anlegen:** `metadata/io.github.keco216.clockwork.yml`
   mit dem YAML aus Abschnitt 4; bei `commit:` den Commit-Hash von `main`
   eintragen, der `android/` und `fastlane/` enthält (oder ein künftiges
   Tag darauf).
5. Committen und pushen:

   ```bash
   git add metadata/io.github.keco216.clockwork.yml
   git commit -m "New app: Clockwork (io.github.keco216.clockwork)"
   git push -u origin io.github.keco216.clockwork
   ```

6. **Merge-Request** gegen `fdroid/fdroiddata:master` öffnen. In die
   Beschreibung gehören: Link aufs Repo, Lizenz MIT, der Hinweis „no
   INTERNET permission, content is built from source and bundled — not a
   web wrapper" (der Punkt aus Abschnitt 1) und dass fastlane-Metadaten im
   Repo liegen. Die Checkliste der MR-Vorlage abhaken.
7. **Die Pipeline arbeiten lassen.** Der MR-CI baut die App selbst; ein
   grüner `fdroid build` ist die halbe Aufnahme. Bei Rot: Log lesen —
   Node-Version siehe oben — nachbessern, pushen, Pipeline läuft neu.
8. **Auf Review reagieren.** Nach dem Merge erscheint die App mit dem
   nächsten Durchlauf des Build- und Signierzyklus im Repo (das dauert
   erfahrungsgemäß Tage, nicht Stunden).

Optional vorab lokal prüfen (unter Windows via WSL):
`pip install fdroidserver`, dann im fdroiddata-Klon
`fdroid readmeta && fdroid lint io.github.keco216.clockwork` — die
MR-Pipeline prüft dasselbe, nur später.

**Nicht vergessen:** Wenn die App einmal drin ist, baut und signiert
F-Droid selbst. Das GitHub-Release-APK (mit dem Projektschlüssel signiert)
und das F-Droid-APK (deren Schlüssel) sind dann **nicht
gegenseitig updatefähig** — genau die Update-Regel aus
[`README.de.md`](README.de.md#signierung-und-die-update-regel). Das gehört
später in die README, damit niemand zwischen beiden Quellen wechselt, ohne
seine Einträge zu sichern.
