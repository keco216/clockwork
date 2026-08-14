# Geprüft und verworfen

Was in der nativen App **nicht** steckt, obwohl es naheliegt — und warum nicht.

Die Liste ist keine Sammlung von Ausreden. Jeder Eintrag nennt, was geprüft
wurde, mit welcher Messung oder welcher Regel es gescheitert ist, und was
stattdessen dasteht. Wer einen Punkt neu aufmachen will, findet hier die
Bedingung, unter der die Entscheidung kippen würde.

> **Stand N14.** Der Posten P9 ergänzt diese Liste um die Punkte aus der
> Bau-Phase (Material3, ML Kit und was sonst geprüft und verworfen wurde);
> hier stehen bislang nur die Befunde aus N13 und N14.

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
