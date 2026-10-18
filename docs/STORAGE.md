# Lokale Daten in Version 0.5

Es werden keine Daten übertragen. localStorage ist an die Origin (Protokoll, Host, Port) gebunden. Ein neuer Build oder ein Service-Worker-Update löscht localStorage nicht. Pro Origin existieren ein aktueller Spielstand und ein Rekord; mehrere gleichzeitig spielende Tabs können denselben Speicher überschreiben. Unterverzeichnisse teilen sich diese Daten, haben aber getrennte Offline-Caches.

## Einstellungen

Jeder Name verwendet den Präfix `snake3310_`. Die bisherigen Einzelwerte aus 0.3/0.4 bleiben kompatibel; keine Massenlöschung oder Neuanlage des Speichers.

| Schlüssel | Werte | Standard |
| --- | --- | --- |
| level | Ganzzahl 1–9 | 3 |
| maze | 0 Frei, 1 Box, 2 Kreuz | 0 |
| walls | wrap / solid | wrap |
| sound | true / false | true |
| full | true / false | false |
| lcd | olive / silver / amber / dark / contrast | olive |
| control | both / swipe / keys | both |
| profile | classic / modern | classic |
| volume | Ganzzahl 0–4 | 2 |
| vibration | true / false | false |
| best | Nichtnegative sichere Ganzzahl | 0 |

Unbekannte oder ungültige Einstellungswerte fallen auf Standardwerte zurück. Ein Reset schreibt ausschließlich die bekannten Einstellungsfelder neu. `best`, `snapshot` und unbekannte Schlüssel, etwa vorhandene Statistikdaten, bleiben unberührt. Version 0.5 führt selbst keine Statistikfunktion ein.

## Snapshot Version 1

Ein JSON-Dokument unter **`snake3310_snapshot`**. Beispiel für eine valide begonnene Runde:

```json
{
  "version": 1,
  "gameMode": "snake2",
  "phase": "paused",
  "snake": [{ "x": 4, "y": 8 }, { "x": 3, "y": 8 }, { "x": 2, "y": 8 }],
  "dir": { "x": 1, "y": 0 },
  "food": { "x": 20, "y": 10 },
  "bonus": null,
  "bonusSteps": 0,
  "score": 0,
  "beat": 0,
  "options": { "level": 3, "maze": 0, "walls": "wrap" }
}
```

`gameMode` beschreibt die Spielregeln, nicht das unabhängige Darstellungsprofil. `beat` ist der bisherige Spielschrittzähler. `options` sind die **aktiven Regeln der Partie** und müssen nicht den inzwischen gewählten Einstellungen für das nächste Spiel entsprechen. Hindernisse werden deterministisch aus `maze` rekonstruiert. Der Eingabepuffer wird absichtlich nicht gespeichert. Beim Wiederherstellen ist er leer und die Engine pausiert.

Prüfung vor Wiederherstellung:

- Nur bekannte Version 1, Modus snake2 und Zustand paused.
- Sichere Ganzzahlen, gültige Geschwindigkeit, Labyrinth und Randmodus.
- Mindestens zwei zusammenhängende Schlangensegmente innerhalb des 26×17-Feldes; keine doppelten Zellen oder Hindernisüberlappungen.
- Nachbarschaft berücksichtigt Randdurchgang; Kopfbewegung muss zur Position des Halses passen.
- Futter und optionaler Bonus dürfen weder Körper noch Wände noch einander überlappen.
- Bonuslaufzeit 1–55 bei vorhandenem Bonus, sonst 0; Punkte und Fortschritt mit definierten Wertebereichen.
- Maximal 24 KB Eingabetext vor dem JSON-Parsing. Nur explizit erlaubte Felder werden kopiert.

Beschädigte, unbekannte oder veraltete Versionen werden verworfen. 0.4 hatte keine gespeicherten Partien, daher ist keine Snapshot-Migration aus 0.4 erforderlich. Eine künftige Formatänderung braucht einen expliziten Migrationspfad; bloßes Ändern der Versionsnummer genügt nicht.

## Schreibstrategie und Grenzen

Speichern beim Start, bei Futter/Bonus, Pause und `pagehide`, außerdem während der Bewegung frühestens nach einer Sekunde seit dem letzten Speichern. `visibilitychange`/`blur` pausiert und speichert unmittelbar. Kein localStorage-Zugriff in jedem Animationsframe. Game Over/Sieg entfernt den aktuellen Snapshot; der Rekord wird unabhängig gespeichert.

Bei einem harten Browser-/Geräteabbruch kann ungefähr die letzte Sekunde fehlen; auch Ereignisbehandlung beim Schließen wird vom Betriebssystem nicht garantiert. Bei Speicherverweigerung oder -erschöpfung bleibt die aktuelle Runde spielbar, aber Speichern beziehungsweise Löschen kann fehlschlagen. Alte Daten können dann bestehen bleiben. Das Modern-Profil zeigt erkannte Speicherprobleme an. Keine Garantie gegen gelöschte Browserdaten oder gleichzeitige Änderungen durch andere Tabs.
