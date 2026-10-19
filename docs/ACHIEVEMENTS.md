# Achievements in Bytecoil 0.7

Hauptmenü → **Achievements** zeigt zwölf Erfolge, den Gesamtstand, Freigabestatus und messbaren Fortschritt. Eine Auswahl öffnet Beschreibung, Pixel-Symbol und Fortschritt. Im Classic-Profil wird die Liste mit den Richtungstasten durchgeblättert, im Modern-Profil zusätzlich gescrollt. Alle Daten bleiben lokal.

| ID | Name | Nachweis |
| --- | --- | --- |
| first-bite | First Bite | Mindestens ein gespeichertes Futterobjekt |
| getting-started | Getting Started | Classic-Rekord ≥ 100 |
| snake-master | Snake Master | Classic-Rekord ≥ 500 |
| pixel-legend | Pixel Legend | Classic-Rekord ≥ 1.000 |
| growing-up | Growing Up | Maximale gespeicherte Länge ≥ 20, beliebiger Modus |
| marathon-snake | Marathon Snake | Mindestens 3.600.000 aktive Millisekunden über alle Partien |
| food-collector | Food Collector | Mindestens 100 gespeicherte Futterobjekte über alle Modi |
| zen-explorer | Zen Explorer | Mindestens 600.000 aktive Millisekunden in **einem** Zen-Sitzungscheckpoint |
| speed-runner | Speed Runner | Rekord ≥ 150 ausdrücklich bei Time Attack **60 Sekunden** |
| challenge-beginner | Challenge Beginner | Mindestens ein gespeichertes Challenge-Abschlussflag |
| challenge-master | Challenge Master | Alle drei verschiedenen Challenge-Abschlussflags |
| perfect-run | Perfect Run | Beobachteter Challenge-Erfolg mit null Kollisionen im Sitzungszustand |

Futter umfasst wie bisher auch Bonusfutter. Aktive Zeit verwendet die vorhandene Sitzungsuhr; Pausen und Hintergrundzeit zählen nicht. Zen-Punkte werden nie für Classic-Rekorde verwendet. Zwei Zen-Partien von je fünf Minuten reichen nicht für Zen Explorer. Die Punkte einer 120-/180-Sekunden-Partie zählen nicht für Speed Runner.

## Historische Daten und Persistenz

`src/achievements.ts` ist unabhängig von DOM und Canvas. Es verwendet ausschließlich validierte Daten aus `Records` sowie bei neuen Erfolgen den bestehenden `GameSession`-Zustand. Historische, nachweisbare Erfolge werden beim Start still übernommen. Ein alter Classic-Rekord ist ein Nachweis für die Classic-Punkteerfolge. Aus Punkten wird hingegen keine unbekannte Futterzahl rekonstruiert. Alte Challenge-Flags enthalten keinen Kollisionsnachweis: Perfect Run wird daraus nicht erfunden. Noch in v0.6 gespeicherte Partien dürfen nach ihrem tatsächlichen Erfolg unter v0.7 neue Erfolge freischalten.

Neuer Schlüssel: `snake3310_achievements_v1`, beispielsweise:

```json
{"version":1,"unlocked":{"first-bite":1792411200000,"getting-started":1792411200000}}
```

Die IDs sind fest, die Zahlen lokale Freischaltungszeitpunkte in Millisekunden. Nur bekannte IDs und gültige Zeitwerte werden übernommen; ungültiges JSON, unbekannte Versionen und Datensätze über 10 KB fallen sicher zurück. Der Schlüssel wird nur bei einer neuen Freischaltung geschrieben. Wiederholte Checkpoints und Reloads vergeben denselben Erfolg nicht erneut. Einstellungs-Reset und PWA-Updates löschen die Freischaltungen nicht.

Prüfungen erfolgen nach den vorhandenen Statistik-Checkpoints (Start, Futter, Pause, Abschluss und etwa einmal je aktiver Sekunde), nicht in jedem Animationsframe. Eine kurze 2,4-Sekunden-Benachrichtigung besitzt keine Pointer-Ereignisse und pausiert die Bewegung nicht. Mehrere Meldungen werden nacheinander angezeigt. **Einstellungen → Erfolgsmeldungen → Aus** beendet die Anzeige; die Freischaltungen selbst bleiben aktiv und werden gespeichert. Historische Freischaltungen und wiederhergestellte Checkpoints erzeugen beim Start keine Meldungsflut.

Bei gesperrtem Speicher bleibt die App spielbar, aber dauerhafte Freischaltungen sind dann nicht garantiert. Die bekannten Grenzen bei gleichzeitig schreibenden Tabs und hartem Prozessabbruch gelten weiter. Es gibt keine Accounts, Serverabgleiche oder externen Achievement-SDKs.
