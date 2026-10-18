# Datenspeicherung – Bytecoil 0.6

Alle Daten liegen ausschließlich im lokalen Browser. Die bisherigen `snake3310_*`-Schlüssel bleiben kompatibel. Es gibt keine Datenübertragung, Anmeldung oder Cloud. Eine Origin besteht aus Protokoll, Host und Port; `127.0.0.1:4174` und die veröffentlichte GitHub-Pages-Adresse sind verschiedene Speicherbereiche.

## Bestehende und neue Schlüssel

| Schlüssel | Bedeutung |
| --- | --- |
| `snake3310_best` | Historischer Classic-Rekord; weiterhin gelesen und bei Classic-Rekorden fortgeschrieben |
| `snake3310_level`, `maze`, `walls` | Standardregeln für Classic, Zen und Time Attack |
| `snake3310_profile`, `full`, `lcd`, `control` | Darstellungsprofil, Handy/Vollbild, Palette, Eingaben |
| `snake3310_sound`, `volume`, `vibration` | Vorhandene Feedback-Einstellungen |
| `snake3310_gameMode` | Neu: classic / zen / timeAttack / challenge; Standard classic |
| `snake3310_duration` | Neu: 60 / 120 / 180; Standard 120 |
| `snake3310_challenge` | Neu: hunter / survivor / maze; Standard hunter |
| `snake3310_snapshot` | Aktuelle pausiert wiederherstellbare Partie, Snapshot-Version 2; Version 1 wird übernommen |
| `snake3310_records_v1` | Neue Statistik-/Rekordstruktur mit Formatversion 1 und Sitzungs-Checkpoints |

Das Zurücksetzen der Einstellungen verändert ausschließlich Einstellungsfelder. Rekorde, Statistiken und gespeicherte Partie bleiben erhalten. Unbekannte vorhandene Schlüssel werden nicht gelöscht. Ein Statistik-Reset wurde bewusst nicht hinzugefügt.

## Snapshot Version 2

Die bestehenden Felder `snake`, `dir`, `food`, `bonus`, `bonusSteps`, `score`, `beat`, `options` und `phase: paused` bleiben. Neu sind `version: 2`, der tatsächliche `gameMode` und `run`:

```json
{
  "version": 2,
  "gameMode": "classic",
  "phase": "paused",
  "snake": [{"x":4,"y":8},{"x":3,"y":8},{"x":2,"y":8}],
  "dir": {"x":1,"y":0},
  "food": {"x":20,"y":10},
  "bonus": null,
  "bonusSteps": 0,
  "score": 0,
  "beat": 0,
  "options": {"level":3,"maze":0,"walls":"wrap"},
  "run": {
    "id":"example-run-1", "mode":"classic", "duration":120,
    "challenge":"hunter", "elapsedMs":0, "food":0, "steps":0,
    "collisions":0, "longest":3, "outcome":"active"
  }
}
```

`run.id` ist eine zufällige lokale Sitzungskennung. Sie dient nur der Doppelzählungsvermeidung, enthält keine Benutzerkennung und wird nie übertragen. `elapsedMs` speichert aktive Zeit einschließlich Bruchteilen einer Millisekunde. Time Attack leitet die Restzeit aus `duration * 1000 - elapsedMs` ab. Ein monotoner Zeitanker wird nicht gespeichert: Erst bewusstes Fortsetzen setzt ihn auf die aktuelle `performance.now()`-Zeit.

`steps` zählt erfolgreiche Bewegungen, `beat` die bisherigen Engine-Ticks einschließlich Kollisionsversuchen. `food` zählt reguläre und Bonusobjekte, `longest` die historische maximale Körperlänge der Sitzung. `outcome` ist bei fortsetzbaren Partien immer active. Finale Zustände werden in Statistik/Challenge-Status gesichert, nicht als laufende Partie gespeichert.

Validierung: erlaubte Version/Modi/IDs und Dauern, endliche nichtnegative Zähler, gültige zusammenhängende Schlange und Richtung, kein Hindernis-/Futter-/Bonus-Überlappen, sichere Zahlenbereiche. Bei Challenges müssen die gespeicherten Optionen exakt der Definition entsprechen; ein bereits erfülltes Ziel gilt nicht als laufender Snapshot. Abgelaufene Time-Attack-Partien werden nicht als aktiv akzeptiert. Der Eingabepuffer bleibt absichtlich ungespeichert und wird beim Laden geleert.

## Migration aus v0.5.2

Snapshot-Version 1 mit `gameMode: snake2` ist weiterhin valide. Sie wird beim Wiederherstellen als Classic übernommen: identisches Spielfeld, Richtung, Punkte, Bonus, Spielstufe, Labyrinth und Randmodus. Der Zustand bleibt pausiert. Eine deterministische Kennung `legacy-<Hash des validierten Spielstands>` verhindert Mehrfachzählung desselben alten Spielstands. Das nächste Speichern schreibt Version 2; vorhandene Einstellungen und `snake3310_best` werden dabei nicht entfernt.

Alte Spielstände enthalten keine historische aktive Zeit oder Anzahl gegessener Objekte. Diese Werte werden nicht erfunden: importierte aktive Zeit und Futterzahl beginnen bei null; vorhandene Punkte, Engine-Schritte und Länge sind bekannt und werden einmalig berücksichtigt. Frühere abgeschlossene Partien können nicht rückwirkend statistisch rekonstruiert werden. Ohne gespeicherte Partie startet die neue Statistik bei null; der Classic-Rekord wird unabhängig davon übernommen.

Unbekannte/beschädigte Versionen werden sicher verworfen. Ein Downgrade zu einer alten App-Version kann Version 2 nicht interpretieren; laufende v0.6-Partien vor einem bewussten Rollback beenden oder lokal sichern. Normale Vorwärtsupdates bleiben kompatibel.

## Statistik und Rekorde

`snake3310_records_v1` enthält:

- `version: 1`.
- `modes`: classic, zen, timeAttack, challenge mit `games`, `activeMs`, `food`, `points`, `longest`, `collisions`.
- `classicBest` und getrennte `timeBest`-Felder für 60, 120 und 180 Sekunden.
- `completed`: je ein boolescher Abschlussstatus für hunter, survivor und maze.
- `receipts`: Checkpoints nach Sitzungs-ID mit zuletzt gezählter Zeit, Futter, Punkten, Länge, Kollisionen und `done`.

Partien werden bei ihrem ersten Checkpoint einmal gezählt. Abgebrochene beziehungsweise durch eine neue Partie ersetzte Sitzungen zählen damit als gestartete Partien. Jeder weitere Checkpoint addiert ausschließlich den positiven Fortschritt gegenüber dem letzten Wasserstand. Die längste Schlange ist ein Maximum, keine Summe. Challenge-Abschlüsse zählen als Zahl verschiedener erledigter Ziele (0–3), nicht als Rangliste. Zen schreibt keinen kompetitiven Rekord.

Ein Snapshot wird **nach** der Statistik gesichert. Ist nach einem Abbruch die Statistik weiter als der Snapshot, bleiben ihre höheren Wasserstände bestehen; beim erneuten Spielen werden diese Werte nicht noch einmal gezählt. Ein finalisierter Checkpoint verhindert außerdem das Wiederbeleben einer bereits abgeschlossenen Sitzung, falls das Löschen eines älteren Snapshots noch nicht erfolgt war. Es werden keine monotonen Zeitanker oder Browser-Daten übertragen.

Die Daten werden auf Struktur, ID-Form, Modus, Endlichkeit und plausible Werte geprüft. Beschädigte Statistiken fallen auf eine leere Struktur zurück; der separate historische Classic-Rekord wird erneut übernommen. Checkpoints werden für Doppelzählungsschutz aufbewahrt. Sehr viele Sitzungen vergrößern daher diesen lokalen Datensatz; der Parser begrenzt ihn auf 4 MB. Speichererschöpfung bleibt ein Browserlimit.

## Schreibstrategie und Grenzen

Keine synchronen Speicherzugriffe in jedem Animationsframe. Checkpoints beim Start, Futter/Bonus, Pause, Hintergrundwechsel und Abschluss; während des aktiven Spiels etwa einmal pro Sekunde. Das Canvas und HUD werden bei Bewegung und nötigen Zeit-/Zustandsänderungen aktualisiert; Statistik-Menülisten werden nur bei geöffnetem Menü aufgebaut.

Ein harter Abbruch kann Fortschritt seit dem letzten Checkpoint verlieren. Exakt wiederhergestellt wird der gespeicherte aktive Zeitwert, nicht ein eventuell ungesicherter letzter Frame. Fehlender/voller localStorage unterbricht das Spiel nicht, verhindert aber verlässliche Persistenz. Betriebssystem-Speicherbereinigung und manuell gelöschte Daten sind nicht abzusichern. Mehrere gleichzeitig spielende Tabs besitzen keinen atomaren Schreib-Lock; zuletzt gespeicherter Zustand kann konkurrierende Änderungen überschreiben. Diese Version verspricht keine Mehrtab-Synchronisierung.
