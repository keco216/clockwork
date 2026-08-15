# Geprüft und verworfen

Was in der nativen App **nicht** steckt, obwohl es naheliegt — und warum nicht.

Die Liste ist keine Sammlung von Ausreden. Jeder Eintrag nennt, was geprüft
wurde, mit welcher Messung oder welcher Regel es gescheitert ist, und was
stattdessen dasteht. Wer einen Punkt neu aufmachen will, findet hier die
Bedingung, unter der die Entscheidung kippen würde.

> **Stand P9 (15.08.2026).** Die Punkte aus der Bau-Phase sind nachgetragen;
> ihre Begründungen standen bis dahin nur als Kommentar an der Stelle, an der
> sie wirken. Die Fundstelle steht jeweils dabei — sie ist die Quelle, dieser
> Eintrag die Zusammenfassung.

---

## Compose Material (M2 und M3)

**Geprüft:** Die naheliegende Art, eine Compose-App zu bauen.

**Verworfen,** weil es ein zweites Designsystem neben `src/styles/tokens.css`
wäre. Eine Material-Taste bringt ihre eigene Farbrolle, ihre eigene Höhe und
ihre eigene Ripple mit; Clockwork ist seit v1.3.0 ein HeroUI-Theme, und das
steht in Tokens, nicht in einer Bibliothek. Dieselbe Hausregel wie im Web, wo
die Oberfläche aus rohem CSS entsteht und nicht aus Tailwind.

**Stattdessen** Compose Foundation. Der Preis ist ehrlich zu benennen: Ripple,
Fokus-Ring und Trefferfläche baut man dann selbst (`ui/Components.kt`).

**Die Bedingung, unter der es kippt:** keine. Die Entscheidung ist als
Dauerprüfung festgeschrieben — `gradlew checkNoMaterial` löst den
Release-Klassenpfad auf und fällt aus, sobald ein `androidx.compose.material*`
darin auftaucht, auch über `material-ripple`.
_Quelle: `app/build.gradle.kts`, Aufgabe `checkNoMaterial`._

## ML Kit für die QR-Erkennung

**Geprüft:** Googles Barcode-Scanner, der bequemere Weg.

**Verworfen,** weil er proprietär ist und an Play Services hängt. Eine App,
deren Zusage „kein Netz, nichts wird nachgeladen" lautet, kann ihre
Bilderkennung nicht von einem Dienst holen, der nachlädt — genau diese Art von
stiller Abhängigkeit hat N17 bei der Emoji-Schrift gefunden.

**Stattdessen** ZXing core: pures Java, Apache-2.0, keine Play-Services-Bindung.
Es sieht Pixel und liefert Text; die OTP-Rechnung bleibt vollständig die eigene
(harte Regel 1). Das native Gegenstück zu jsQR in der Web-Fassung.
_Quelle: `app/build.gradle.kts`, Abhängigkeitsblock „Kamera und QR (P6)"._

## `SplitInstallManager` (Play Feature Delivery) für die Sprachen

**Geprüft:** Der von Google vorgesehene Weg, wenn ein Bundle nach Sprachen
aufgeteilt ist und die App trotzdem eine eigene Sprachwahl anbietet. Die App
fordert die fehlende Sprache zur Laufzeit nach (`SplitInstallManager
.deferredLanguageInstall` bzw. `startInstall`), Play lädt sie herunter.

**Verworfen** aus drei Gründen, von denen jeder allein genügt:

1. Er braucht **Play Core** (`com.google.android.play:feature-delivery`) — eine
   proprietäre Bibliothek. Damit wäre der F-Droid-Bau erledigt: Deren Buildserver
   nimmt keine unfreien Abhängigkeiten, und die App liegt seit dem 12.08.2026 im
   Katalog.
2. Er bricht die **Netz-Zusage**. „Zur Laufzeit keine fremde Netzwerkanfrage" ist
   harte Regel 4 und steht in beiden READMEs; eine Sprache nachzuladen ist
   genau so eine Anfrage. Dass sie an Google ginge und nicht an einen
   beliebigen Dritten, ändert daran nichts — es ist dieselbe Klasse stiller
   Abhängigkeit, die N17 bei der Emoji-Schrift gefunden hat.
3. Er verlegt einen **Fehlerfall in die Sprachwahl**: ohne Netz keine Sprache.
   Eine Offline-App, deren Bedienoberfläche erst online vollständig wird, sagt
   etwas anderes zu, als auf der Verpackung steht.

**Stattdessen** die Aufteilung gar nicht erst zulassen:
`bundle { language { enableSplit = false } }`. Jede Installation trägt alle 37
Sprachen, die Sprachwahl greift ohne Netz, und alle drei Kanäle verhalten sich
gleich. Der Preis ist gemessen und steht an der Fundstelle.

**Die Bedingung, unter der es kippt:** Wenn der Sprachanteil so wüchse, dass er
den Download spürbar belastet — bei 37 Sprachen tut er das nicht. Play Core
käme auch dann nicht in Frage; der Weg wäre dann eher, den Katalog zu teilen.
_Quelle: `app/build.gradle.kts`, Block „Sprach-Splits AUS (D1)"._

## `EncryptedSharedPreferences` für den Tresor

**Geprüft:** Die naheliegende Wahl für „verschlüsselt speichern" unter Android.

**Verworfen** aus zwei Gründen, und der zweite wiegt schwerer:

1. Seit `androidx.security` 1.1 ist es als **deprecated** gekennzeichnet, ohne
   Nachfolger.
2. Es verschlüsselt mit einem Schlüssel, den das **Gerät** hält. Der Tresor
   hinge dann am Gerät und nicht mehr an der Passphrase — eine schwächere
   Zusage als die, die in der App steht, und von außen nicht zu unterscheiden.

**Stattdessen** eine Datei: `vault.json` im `filesDir`, Inhalt ist genau der
Umschlag der Web-Fassung (AES-256-GCM, Schlüssel aus PBKDF2). Das ist zugleich
die Voraussetzung für P8 — wer von 1.x aktualisiert, öffnet denselben Umschlag
mit derselben Passphrase.
_Quelle: `store/VaultStore.kt`, Kopfkommentar._

## `DataStore` für die Einstellungen

**Geprüft:** Der von Google empfohlene Nachfolger von `SharedPreferences`.

**Verworfen,** weil vier Werte kein Framework brauchen. DataStore brächte
Coroutinen-Flüsse, ein Serialisierungsschema und eine Abhängigkeit für eine
Datei, die vier Zeilen lang ist. Dieselbe Abwägung wie beim selbst
geschriebenen Protobuf-Leser der Web-Fassung (harte Regel 2).

**Stattdessen** `lock-settings.json` neben dem Umschlag — unverschlüsselt, weil
darin kein Stück Klartext-Geheimnis steht, und mit denselben Feldnamen wie im
`localStorage` der WebView-Fassung, damit die Übernahme in P8 ein
Kopiervorgang ist und keine Umrechnung.
_Quelle: `store/LockSettings.kt`, Kopfkommentar._

## Ein Navigations-Framework

**Geprüft:** `navigation-compose`, der Standardweg für mehrere Seiten.

**Verworfen,** weil die App genau eine Bühne mit zwei Zuständen hat
(`data-stage` vacant/working im Web) — ein Navigationsgraph dafür wäre Apparat
ohne Aufgabe. Auch die zwei Seiten seit N11 (Start, Einstellungen) sind ein
Zustand und kein Rückweg: Es gibt keinen Zurück-Stapel, keine Argumente, keine
Tiefenverlinkung.

**Stattdessen** eine einzige Activity, kein Fragment, und die Seitenwahl als
Zustand in der Composition.
_Quelle: `MainActivity.kt`, Kopfkommentar._

## Der T0-Parameter aus RFC 6238

**Geprüft:** RFC 6238 erlaubt einen Startzeitpunkt T0 ≠ 0, also
`floor((zeit − T0) / periode)`.

**Verworfen,** weil ihn kein Anbieter benutzt, das `otpauth://`-Format kein Feld
dafür vorsieht und die RFC-Testvektoren alle von T0 = 0 ausgehen. Ein Parameter,
den niemand setzen kann, ist eine Eingabemöglichkeit für Fehler.

**Stattdessen** T0 fest auf 0 — in beiden Fassungen, denn `src/lib/` ist die
Quelle und der Kotlin-Port bildet sie Zeile für Zeile ab.
_Quelle: `src/lib/totp.ts`, Kopfkommentar; `core/Totp.kt` gleichlautend._

---

## Echter Backdrop-Blur unter der Navigationsleiste

**Wollte:** Die schwebende Leiste soll nicht nur durchscheinend sein, sondern
den Inhalt darunter tatsächlich WEICHZEICHNEN — die Anmutung, die Samsung in
One UI 8.5 „frosted" nennt und die Apple seit Jahren als Material führt.

**Verworfen.** Drei Wege, drei Gründe:

1. **Fremdbibliothek (Haze und Verwandte).** Verstößt gegen die
   Abhängigkeitsregel dieses Projekts. Die native App zieht heute genau drei
   fremde Dinge: AndroidX/Compose, CameraX und ZXing — jedes davon, weil es
   eine Fähigkeit liefert, die man nicht selbst bauen kann, ohne
   Sicherheitsfragen aufzuwerfen. Eine Optik ist keine solche Fähigkeit.

2. **Der Fenster-Weichzeichner der Plattform.**
   `Window.setBackgroundBlurRadius()` und `blurBehindRadius` (ab Android 12)
   zeichnen weich, was **hinter dem FENSTER** liegt — bei einer
   bildschirmfüllenden App also das Hintergrundbild oder die App darunter,
   nicht der eigene Inhalt. Für eine Leiste, die über dem eigenen
   Scrollbereich schwebt, ist das die falsche Ebene.

3. **Eigenbau über `RenderEffect` / `Modifier.blur`.**
   `RenderEffect.createBlurEffect` zeichnet den INHALT des Knotens weich, auf
   den man ihn legt — nicht das, was dahinter liegt. Wer den Untergrund
   weichzeichnen will, muss den Inhalt ein zweites Mal in eine eigene Ebene
   rendern, diese Ebene weichzeichnen und sie unter der Leiste anzeigen.

   Das ist genau die Konstruktion, gegen die dieses Projekt seit V11 eine
   gemessene Regel hat: **Eine dauerhafte Maske kostet eine Compositor-Ebene**
   (im Web damals 19 statt 18). Hier wäre es schlimmer als eine Maske — der
   gesamte Scrollinhalt liefe zweimal durch die Zeichnung, und zwar in jedem
   Bild einer Scrollbewegung.

**Was stattdessen dasteht:** Transluzenz ohne Weichzeichnung — `--surface` mit
90 % Deckkraft (N13: 82 %; N14 hat sie angehoben, weil Durchsicht ohne
Weichzeichner nicht milchig wirkt, sondern kaputt). Der Inhalt scheint durch, er ist nur nicht unscharf. Der
Grad ist ausgerechnet und nicht geschätzt (siehe
`scripts/native-nav-contrast.mjs`).

**Wann das kippt:** Wenn AndroidX selbst einen Backdrop-Weichzeichner
mitbringt, der ohne Doppel-Rendering auskommt. Dann als eigener Commit — und
**mit einer Ebenen-Messung**, nicht mit einem Bildschirmfoto.

---

## Verlaufsabblendung des Inhalts zur Unterkante

> **ZURÜCKGENOMMEN in N14 — sie ist jetzt Pflicht.** Der Eintrag bleibt
> trotzdem stehen, weil er die Rechnung enthält, die weiterhin gilt; nur die
> Schlussfolgerung war an die falsche Frage geknüpft. Was N14 daran geändert
> hat, steht am Ende dieses Eintrags.

**Wollte:** Der Inhalt soll zur Leiste hin sanft ausblenden, damit die Kante
zwischen Inhalt und schwebender Leiste weicher wird — Samsungs
„gradient blur"-Anmutung ohne den Weichzeichner.

**In N13 verworfen, und zwar an der Kontrastmessung.** Eine Abblendung liegt
über Text und Grund gleichermaßen — genau das war beim ersten Anlauf falsch
gerechnet worden, und mit der richtigen Rechnung ist der Befund eindeutig:

| Schleier zum `--ground` | `--ink-3` hell | `--ink-3` dunkel | Code in `--ink` hell |
| ----------------------- | -------------- | ---------------- | -------------------- |
| 25 %                    | **3,34:1**     | **4,26:1**       | 7,97:1               |
| 40 %                    | **2,52:1**     | **3,11:1**       | 4,75:1               |
| 50 %                    | **2,12:1**     | **2,49:1**       | **3,46:1**           |
| 100 %                   | **1,00:1**     | **1,00:1**       | **1,00:1**           |

Schon bei einem Viertel Schleier reißt die leiseste Textstufe AA in beiden
Themes; bei der Hälfte reißt der Code selbst. Es gibt keinen Grad, der
gleichzeitig sichtbar wirkt und die 4,5:1 hält — die Auftragsbedingung
(„drückt sie irgendeinen Text unter 4,5:1 → weglassen") ist damit erfüllt,
und zwar ohne Ermessensspielraum.

**Der zweite Grund, unabhängig vom ersten:** Ein Messgerät blendet seine
Anzeige nicht aus. Die Hausregel lautet seit V5 „Was man anfasst, wird weich.
Was man abliest, bleibt scharf." Ein Code, der beim Scrollen verblasst, ist
eine Anzeige, die über ihren eigenen Zustand lügt.

**Was stattdessen dastand (bis N14):** Eine harte Kante — der Schatten
(`--elev-2`) im Hellen, die Innenlichtkante im Dunkeln, dazu eine Haarlinie in
`--rule` für den Fall, dass eine weiße Karte unter der Leiste durchläuft und
beide gleich hell sind. **Die Haarlinie ist mit N14 wieder weg** — mit der
Abblendung ist der Untergrund der Leiste verlässlich `--ground`, ihr Anlass
also entfallen.

**Wann das kippt:** Nie in dieser Form. Wollte man die Kante trotzdem weicher,
müsste die Abblendung den Inhalt AUSSPAREN — also nur den Untergrund
einfärben —, und das kann eine Überlagerung grundsätzlich nicht.

### Und dann ist es doch gekippt — N14, einen Lauf später

Kevins Befund am Gerät: **Transluzenz ohne Weichzeichner wirkt nicht milchig,
sondern kaputt.** Man liest halbe Buchstaben durch eine Fläche, auf der
Beschriftungen stehen. Und einen echten Weichzeichner gibt es hier nicht — der
steht einen Eintrag weiter oben, verworfen.

Damit war die Ablehnung an die falsche Frage geknüpft. Sie lautete: „Bleibt
Text in der Abblendung lesbar?" Die richtige lautet: „Wo hört die lesbare Zone
auf?" Text in der Abblendung ist dort **per Definition am Auslaufen**, wie ein
Wort am unteren Bildrand — 1,00:1 ist an dieser Stelle kein Mangel, sondern
der Zweck.

Die Zahlen oben stimmen weiterhin; sie beantworten jetzt eine andere Frage.
`native-nav-contrast.mjs --abblendung` rechnet sie aus und nennt die Grenze:

| Textstufe | lesbar bis Schleier … | = Strecke im 24-dp-Anlauf, hell | dunkel  |
| --------- | --------------------- | ------------------------------- | ------- |
| `--ink`   | 42 % / 53 %           | 10,0 dp                         | 12,6 dp |
| `--ink-2` | 21 % / 37 %           | 5,0 dp                          | 8,9 dp  |
| `--ink-3` | 10 % / 22 %           | **2,4 dp**                      | 5,3 dp  |

Die strengste Stufe gibt die Grenze vor: Über den obersten **2,4 dp** des
Anlaufs gilt AA unverändert, darunter läuft der Inhalt absichtlich aus.

**Was daraus für die Liste folgt:** Ein Eintrag hier ist die Antwort auf eine
FRAGE, nicht ein Urteil über eine Sache. Wer eine Verwerfung umdreht, muss die
Frage benennen, die sich geändert hat — sonst sieht es aus, als hätte die
Messung getäuscht. Sie hat nicht.
