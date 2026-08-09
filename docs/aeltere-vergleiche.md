# Ältere Vorher/Nachher-Vergleiche

Jeder Gestaltungsdurchgang hat seinen Vergleich als Bildpaar dokumentiert. Die
Bilder sind der teuerste Teil dieses Repos: Acht Aufnahmen wiegen je nach Stand
2,5 bis 4 MB, und sie werden einmal angesehen. Deshalb liegen im Repo nur die
Bilder zur **aktuellen** Version; ältere sind ausgelagert, aber nicht verloren.

| Vergleich       | Was er zeigt                | Wo er liegt                                                                            |
| --------------- | --------------------------- | -------------------------------------------------------------------------------------- |
| V4 → V5         | „Instrument trifft Apple"   | Als `clockwork-v5-vergleich.zip` am [Release v1.2.0](https://github.com/keco216/clockwork/releases/tag/v1.2.0) |
| v1.1.0 → V7     | Struktur: Gehäuse und Bühne | Im Branch `v7-struktur`, unter `docs/v7-vergleich/`                                     |
| V7 → V8         | Klarheit: Flächen und Teile | [`v8-vergleich/`](v8-vergleich/README.md) — im Repo                                     |

## Warum V7 nicht als Asset dabei ist

V6, V7 und V8 sind nie einzeln veröffentlicht worden. Sie erscheinen zusammen
als v1.2.0, weil nur der letzte Stand je öffentlich lief. Ein Vergleich, der
gegen einen Zwischenstand misst, den niemand benutzen konnte, beschreibt keinen
Unterschied, den jemand erlebt hat. Wer die Zwischenstufe trotzdem sehen will,
findet sie im Branch.

## Neu erzeugen

Alle Vergleichsbilder entstehen jederzeit wieder. Der Server muss auf Port 5180
laufen, und zwischen den beiden Läufen wird der jeweils andere Stand
ausgecheckt:

```bash
npx vite --port 5180 --strictPort &

git checkout <alter-stand>
node scripts/shoot-compare.mjs vorher  docs/<zielordner>
git checkout <neuer-stand>
node scripts/shoot-compare.mjs nachher docs/<zielordner>
```

Der Zielordner ist ein Argument und steht bewusst nicht im Skript: Die
Dateinamen sind je Version dieselben, ein festverdrahtetes Ziel überschriebe
also beim nächsten Durchgang unbemerkt den vorigen Vergleich.

Für die Rasterbilder zum Abstands-Audit gilt dasselbe mit
`node scripts/shoot-grid.mjs <vorher|nachher>`.
