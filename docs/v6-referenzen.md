# V6 — Referenzlage und was daraus übernommen wurde

Referenzquelle war [21st.dev](https://21st.dev) (Katalog von 12.000+
UI-Komponenten). Übernommen wurde **das Prinzip**: Werte, Timing, Aufbau —
nachgebaut in Vanilla-CSS und -TypeScript. **Kein Code**, keine
Abhängigkeit, kein Tailwind, kein React.

## Zur Quellenlage, ehrlich

21st.dev rendert seinen Katalog clientseitig und virtualisiert. Auslesbar war
zuverlässig die **Kategorienlage** — welche Bausteine das Ökosystem überhaupt
kennt und wie stark jede Gattung besetzt ist. Die Einzelkomponenten sind
React/Tailwind mit shadcn-Konventionen; ihr Quelltext wäre für dieses Projekt
ohnehin unbrauchbar gewesen.

Die Kategoriezahlen sind trotzdem eine brauchbare Auskunft, und zwar als
Häufigkeitsverteilung: Sie sagen, was das Feld für selbstverständlich hält.

| Kategorie                       | Einträge | Was das über die Referenzlage sagt                           |
| ------------------------------- | -------: | ------------------------------------------------------------ |
| Buttons                         |     2043 | Die am dichtesten besetzte Gattung überhaupt                 |
| Cards                           |     1780 | Karten sind die Grundwährung — hier bewusst nicht übernommen |
| Heroes                          |     1152 | Für ein Werkzeug ohne Landingpage irrelevant                 |
| Badges                          |      605 | —                                                            |
| Avatars                         |      597 | —                                                            |
| Navigation Menus                |      477 | —                                                            |
| Images                          |      428 | —                                                            |
| **Backgrounds**                 |  **365** | Eigene Gattung: Textur ist ein anerkanntes Mittel            |
| Scroll Areas                    |      293 | —                                                            |
| **Stats & KPIs**                |  **153** | Wo die Number-Ticker sitzen                                  |
| Steppers                        |      124 | —                                                            |
| **Borders**                     |  **111** | Eigene Gattung für Kanten — Bestätigung für Punkt 2          |
| Shaders / Gradients / ASCII Art |      neu | Ausdrücklich nicht übernommen (siehe Bans)                   |

Für die Technik selbst waren die kanonischen Fundstellen ergiebiger als der
Katalog; sie stehen unten je Punkt.

## Die übernommenen Techniken

### 1. Korn über `feTurbulence`, nicht über ein Bild

**Woher:** Gattung „Backgrounds" (365 Einträge) · Technik dokumentiert bei
[Codrops](https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/),
[CSS-Tricks](https://css-tricks.com/grainy-gradients/) und
[freeCodeCamp](https://www.freecodecamp.org/news/grainy-css-backgrounds-using-svg-filters/).

**Prinzip:** `type="fractalNoise"` mit hoher `baseFrequency` erzeugt feines
Korn; `numOctaves` steuert die Tiefe, `feColorMatrix` die Deckung. Als
`data:`-URI im `background-image` kostet das ein paar hundert Byte statt eines
PNG-Kachelbildes.

**Warum es hierher passt:** Papier und mattschwarzes Gehäuse sind keine
Bildschirmflächen. Ein Hauch Korn macht aus einer Farbfläche ein Material —
ohne einen einzigen Verlauf, der hier verboten ist. Und weil es ein Filter ist
und kein Bild, skaliert es mit jeder Auflösung und bleibt eine Textdatei.

### 2. Die Lichtkante als `inset`-Schatten, nicht als Rahmen

**Woher:** Gattung „Borders" (111 Einträge) · Technik bei
[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow) und
[CSS-Tricks](https://css-tricks.com/almanac/properties/b/box-shadow/).

**Prinzip:** `box-shadow: inset 0 1px 0 rgb(255 255 255 / α)` legt eine 1 px
hohe Aufhellung an die Oberkante — wie Deckenlicht auf einer gefrästen Kante.
Ein `inset`-Schatten **belegt keinen Platz im Boxmodell**, anders als ein
Rahmen; das Layout bleibt unberührt, und die Kante lässt sich frei mit der
äußeren Erhebung kombinieren.

**Warum es hierher passt:** V5 hatte die Lichtkante bereits, aber als
`border-top-color`. Das funktionierte, kostete aber die Rahmenfarbe als
Ausdrucksmittel und ließ sich nicht mit der Rundung sauber führen. Als
Innenschatten liegt sie _innerhalb_ des Radius und folgt ihm.

### 3. Nummern-Ticker: Stagger je Stelle

**Woher:** Gattung „Stats & KPIs" (153 Einträge). Das Muster ist dort
allgegenwärtig: Zahlen wechseln nicht als Block, sondern Stelle für Stelle
minimal versetzt.

**Prinzip:** Ein Versatz von 15–25 ms je Stelle. Weniger sieht aus wie ein
Fehler, mehr wie eine Animation.

**Warum es hierher passt:** Clockwork hat den Stellen-Umsprung schon seit V2 —
er ist die Fallblattanzeige und der Marken-Moment. Übernommen wird nur die
Präzisierung des Timings: **20 ms**, gemessen an der Zahl der tatsächlich
wechselnden Stellen, nicht an ihrer Position.

### 4. Karten heben sich beim Überfahren — hier: Kanalzüge

**Woher:** Gattung „Cards" (1780 Einträge), das dichteste Muster des Katalogs.

**Prinzip:** `transform: translateY(-1px … -2px)` plus eine Stufe mehr
Erhebung, auf einer Federkurve.

**Warum es hierher passt — und wo es abgewandelt wurde:** Clockwork hat keine
Karten und bekommt auch keine. Der Kanalzug ist trotzdem die Zeile, mit der man
umgeht (kopieren, ablesen), und eine Rückmeldung beim Überfahren ist dort
Information, keine Dekoration. Übernommen wird die Bewegung, nicht der Kasten:
Die Zeile hebt sich um **1 px** und bekommt einen leisen Flächenton — keinen
eigenen Schatten, weil sie kein eigenes Objekt ist.

### 5. Listbox statt aufgehübschtem `<select>`

**Woher:** Gattung „Selects/Dropdowns"; im shadcn-Ökosystem durchgehend
Radix-Listbox statt nativem Feld. Verhaltensvorlage:
[WAI-ARIA Authoring Practices, Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

**Prinzip:** Ein Knopf öffnet ein Panel; Pfeiltasten wandern, Pos1/Ende
springen, Tippen sucht, Esc schließt, Fokus kehrt zurück.

**Warum es hierher passt:** Ein natives `<select>` lässt sich in der
geschlossenen Form gestalten — die aufgeklappte Liste gehört dem System und
sieht auf jeder Plattform anders aus. Bei 37 Sprachen ist das die längste Liste
der App.

**Abwandlung, die hier zwingend ist:** Das native Feld bleibt die Basis und
funktioniert allein. Die Listbox wird erst darübergelegt, wenn das Skript
läuft — progressive enhancement, nicht Ersatz.

### 6. Trenner tragen Bedeutung, nicht nur Abstand

**Woher:** Gattung „Borders" (111), zweite Lesart: Trennung als gestaltetes
Element statt als 1-px-Linie.

**Prinzip:** Ein Trenner darf ein Muster sein, solange es aus der Formsprache
des Produkts stammt.

**Warum es hierher passt:** Clockwork hat bereits ein Muster — die 30er-Teilung
des Emblems. Ein Trenner aus **Tick-Marks** ist deshalb keine Zierleiste,
sondern dasselbe Zeichen in einer dritten Rolle (nach Emblem und Countdown).
Das ist der Punkt, an dem die Referenz die Marke _bestätigt_, statt sie zu
überschreiben.

### 7. Der leere Zustand fragt nach der ersten Handlung

**Woher:** Gattung „Empty states" bzw. Onboarding-Muster; im Katalog
durchgehend: Symbol, ein Satz, **ein** Knopf.

**Prinzip:** Der leere Zustand ist kein Fehlzustand, sondern die Einladung.

**Warum es hierher passt — mit einer Einschränkung:** Clockwork hatte einen
„Demo einfügen"-Knopf und hat ihn in V4 **absichtlich entfernt**: Ein Knopf,
der Beispiel-Schlüsselmaterial in dasselbe Feld schreibt wie echte Secrets,
gehört nicht in ein Produktivwerkzeug. V6 holt ihn zurück, und deshalb sitzt er
jetzt **ausschließlich im leeren Zustand** — er verschwindet mit der ersten
Eingabe und kann echtes Schlüsselmaterial nie überschreiben. Die Einzelheiten
stehen in [`README.de.md`](README.de.md#der-leere-zustand).

## Was ausdrücklich NICHT übernommen wurde

- **Karten je Datensatz.** Die dichteste Gattung des Katalogs (1780) ist genau
  das, was Clockwork seit V2 nicht ist. Kanalzüge in einem Gehäuse bleiben.
- **Shader, Gradients, ASCII-Art.** Drei eigene, neue Gattungen auf 21st.dev —
  und drei Verstöße gegen die Bans. Das Korn ist Textur, kein Verlauf.
- **Glow und farbige Schatten.** Im Katalog verbreitet, hier seit V2 verboten.
- **Zweite Akzentfarbe.** Genau ein Signal, unverändert.
- **Jeder Zeile ihre Micro-Interaction.** Übernommen wurde die eine Bewegung,
  die etwas mitteilt (Hover, Kopier-Quittung), nicht das Prinzip „überall etwas".
