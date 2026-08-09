# F-Droid-Vorbereitung

Stand 09.08.2026. **Es ist nichts eingereicht** — dieses Dokument hält die
Prüfung gegen die Aufnahmeregeln fest, beschreibt die vorbereiteten Bausteine
(fastlane-Metadaten, Build-Härtung) und enthält die Schritt-für-Schritt-
Anleitung samt fertigem Metadaten-Vorschlag für `fdroiddata`.

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
│   └── images/
│       ├── icon.png                 512 × 512, aus public/icon-512.png
│       └── phoneScreenshots/
│           ├── 1.png                Arbeitszustand, hell (Code-Karte)
│           ├── 2.png                Leerzustand, hell (Emblem)
│           └── 3.png                Arbeitszustand, dunkel
└── de-DE/
    ├── title.txt · short_description.txt · full_description.txt
    └── changelogs/10400.txt         328 Zeichen
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

| Parameter         | Wert                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Web-Bau           | `npm ci` (package-lock.json) → `npm run android` (Vite-Bau, Einzeldatei, Icons, cap sync) |
| Node              | entwickelt mit 26.x; Vite 8 braucht ≥ 20.19                                               |
| Gradle            | 9.5.1 über den Wrapper, Distribution per **SHA-256 verankert** (`distributionSha256Sum`)  |
| AGP               | 8.13.0 · compileSdk/targetSdk 36 · minSdk 24 · build-tools 36.0.0                         |
| JDK (lokal)       | OpenJDK 25 (JBR von Android Studio)                                                       |
| Release-Build     | `gradlew assembleRelease`; **ohne** `CLOCKWORK_KEYSTORE` unsigniert — der F-Droid-Pfad    |
| versionName/-Code | 1.4.0 / 10400 (`Major·10000 + Minor·100 + Patch`), fest in `android/app/build.gradle`     |

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

## 4. Fertiger Metadaten-Vorschlag für fdroiddata

Datei `metadata/io.github.keco216.clockwork.yml` (COMMIT beim Einreichen
eintragen — der referenzierte Stand muss `android/` und `fastlane/`
enthalten; das Tag `v1.4.0` enthält beides NICHT, es ist älter als der
Wrap):

```yaml
Categories:
  - Security
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
  - versionName: 1.4.0
    versionCode: 10400
    commit: COMMIT_EINTRAGEN
    subdir: android/app
    sudo:
      - apt-get update
      - apt-get install -y --no-install-recommends nodejs npm
    init:
      - cd ../.. && npm ci
    prebuild:
      - cd ../.. && npm run android
    scanignore:
      - node_modules
    gradle:
      - yes

AutoUpdateMode: None
UpdateCheckMode: Static
CurrentVersion: 1.4.0
CurrentVersionCode: 10400
```

Zwei bewusste Entscheidungen darin:

- **`UpdateCheckMode: Static` statt `Tags`**, weil das jüngste Tag
  (`v1.4.0`) den Android-Ordner noch nicht enthält — ein Tag-Checker liefe
  ins Leere. **Ab dem nächsten echten Release** (Tag auf einem Stand mit
  `android/`) auf `AutoUpdateMode: Version` + `UpdateCheckMode: Tags
^v[0-9.]+$` umstellen, dann zieht F-Droid neue Versionen selbst.
- **`scanignore: node_modules`**, weil der Gradle-Bau Capacitors
  Android-Bibliothek aus `node_modules/@capacitor/android` mitkompiliert —
  löschen (scandelete) würde den Bau brechen; der Scanner soll den Ordner
  nur nicht durchsuchen.

Wahrscheinlichster CI-Stolperstein: Die Debian-Node-Version des
Buildservers. Reicht sie nicht für Vite 8, sind die beiden `sudo`-Zeilen
gegen eine Node-22-Installation zu tauschen (z. B. über
`n`/Nodesource-Skript) — die Reviewer kennen das Muster, in `fdroiddata`
gibt es Vorbilder (nach `sudo:.*nodejs` suchen).

## 5. Schritt für Schritt: Was auf gitlab.com zu tun ist

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
