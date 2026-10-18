# Spielmodi – Bytecoil 0.6

Darstellungsprofile **Classic/Modern** verändern die Oberfläche. Die Spielmodi **Classic Snake, Zen Mode, Time Attack, Challenge Mode** verändern die Regeln. Handy/Vollbild, LCD-Thema, Sound und Vibration bleiben unabhängig davon.

## Auswahl und Fortsetzen

Hauptmenü → Spiele → Modus auswählen → Neues Spiel. Time Attack bietet zusätzlich „Zeitlimit“, Challenge Mode „Herausforderung“. Bei einer laufenden/pausierten Partie wird ein neuer Start bestätigt. Die Modusauswahl allein ersetzt keine Partie. „Spiel fortsetzen“ setzt immer die tatsächlich gespeicherte Sitzung fort, auch wenn inzwischen ein anderer Modus für das nächste Spiel ausgewählt ist. Der aktive Modus steht im Canvas-Kopf; zusätzliche Informationen stehen in dessen zweiter Zeile und im Modern-Komfortbereich, wenn Platz vorhanden ist.

## Classic Snake

Die vorhandene Engine bleibt unverändert: 26×17 Zellen, neun Geschwindigkeiten, drei Labyrinthe und Durchgang oder Randwände. Futter 10 Punkte, Bonus 25 Punkte; beides wächst um ein Segment. Zwei zukünftige Richtungswechsel, kein Umdrehen, höchstens eine Wendung pro Schritt. Ein Modus-Wrapper verwendet exakt dieselbe Bewegung/Kollision. Der historische Rekord unter `snake3310_best` wird weiterverwendet.

## Zen Mode

Die gewählten Geschwindigkeits-, Labyrinth- und Randregeln gelten. Bei einer Kollision erfolgt ein sicherer Neustart der Schlange auf der Startposition des vorhandenen Labyrinths. Der Körper wird auf Startlänge zurückgesetzt, Futter neu platziert und der Eingabepuffer geleert. Punkte, aktive Sitzungszeit, Futteranzahl, historische maximale Länge und Kollisionszahl bleiben erhalten. Bei vollständig gefülltem Feld beginnt ebenfalls ein neuer Körperzyklus ohne Sitzungsende; dies zählt nicht als Kollision.

HUD: Punkte, aktuelle Länge, aktive Sekunden und Kollisionen. Pause und gespeicherte Wiederherstellung funktionieren regulär. Keine kompetitive Zen-Rangliste. Die Sitzung endet praktisch durch den bestätigten Start einer anderen/neuen Partie; ihre bis dahin gesicherten Statistiken bleiben bestehen.

## Time Attack

Varianten **60, 120, 180 Sekunden**, Standard 120. Geschwindigkeit, Labyrinth und Randmodus bleiben einstellbar. Der Countdown beginnt mit dem tatsächlichen Spielstart und endet bei verbrauchter aktiver Zeit; eine Kollision kann die Partie vorher beenden. Ein volles Feld kann wie im Classic-Modus gewonnen werden.

Aktive Zeit wird über `performance.now()` gemessen, nicht aus Schritten abgeleitet und nicht über Datum/Uhrzeit. Framedrops verlangsamen den Countdown nicht. Pause, Menüs, Hintergrundwechsel und reguläres Schließen frieren den Zeitstand ein. Beim Wiederherstellen wird der gespeicherte aktive Zeitwert samt Bruchteilen einer Millisekunde verwendet; die neue monotone Uhr erhält erst beim Fortsetzen einen neuen Anker. Hintergrunddauer zählt nicht mit. Der nächste Bewegungsschritt liegt wie bisher einen Spieltakt nach Fortsetzen; abgelaufene Bewegungen werden nicht nachgeholt.

HUD: verbleibende aufgerundete Sekunden, Punkte, Spielstufe und persönlicher Rekord der gewählten Variante. Rekorde sind strikt nach Dauer getrennt und beeinflussen Classic nicht.

## Challenges

Vor dem ersten Start erscheint eine Zielbeschreibung mit den verbindlichen Regeln. Jede Kollision beendet den Versuch. Nach Erfolg erscheint „GESCHAFFT!“, der Abschlussstatus wird sofort lokal gespeichert. Ein bereits begonnener Versuch kann nach Fehler/Erfolg direkt per Enter/5 oder Neustart wiederholt werden; die Einführung wird dann nicht erneut erzwungen.

| Challenge | Ziel | Feste Regeln |
| --- | --- | --- |
| Food Hunter | 10 Futterobjekte | Stufe 4, freies Feld, feste Randwände |
| Survivor | 100 erfolgreiche Bewegungsschritte ohne Kollision | Stufe 5, Kreuz-Labyrinth, feste Randwände |
| Maze Master | 5 Futterobjekte ohne Kollision | Stufe 4, Box-Labyrinth, feste Randwände |

Normales Futter und Bonus zählen jeweils als ein Futterobjekt. Punkte bleiben 10/25. Survivor zählt nur tatsächlich ausgeführte erfolgreiche Bewegungen; weder pausierte Zeit noch verworfene Eingaben zählen. Die feste Kreuz-Karte mit Randwänden verhindert, dass bloßes endloses Geradeausfahren auf einem leeren Durchgangsfeld ausreicht.

Die allgemeinen Stufen-/Labyrinth-/Rand-Einstellungen gelten weiterhin für andere Modi, werden aber beim Challenge-Start durch die jeweilige Definition ersetzt. Der Challenge-Untermenübaum bietet deshalb keine widersprüchlichen Regeländerungen. Definitionen und Ziele stehen zentral in `src/modes.ts`; neue Challenges können dort ergänzt werden, ohne Bewegung und Kollision neu zu implementieren. Derzeit werden die drei bekannten IDs im Speicherformat explizit validiert; neue IDs brauchen auch eine bewusste Schema-/UI-Erweiterung.

## Statistik und Grenzen

Hauptmenü → Statistik. Die erste Zeile schaltet zwischen Gesamt, Classic Snake, Zen Mode, Time Attack und Challenge Mode. Weitere Zeilen zeigen gestartete Partien, aktive Sekunden, Futter, Punkte, längste Schlange und Kollisionen. Gesamtanzeige enthält zudem Classic-/Time-Attack-Rekorde und die Anzahl verschiedener abgeschlossener Challenges (0–3). Hauptmenü → Highscores zeigt die getrennten Rekorde und jeden Challenge-Abschlussstatus.

Alle Daten bleiben lokal und offline verfügbar. Speichern erfolgt periodisch und bei relevanten Ereignissen; ein harter Prozessabbruch kann den seit dem letzten Checkpoint entstandenen Fortschritt verlieren. Exakte Wiederherstellung bezeichnet den **tatsächlich gespeicherten** aktiven Zeitwert. Mehrere parallele Tabs besitzen weiterhin keinen Schreib-Lock. Details: [Datenspeicherung](STORAGE.md).
