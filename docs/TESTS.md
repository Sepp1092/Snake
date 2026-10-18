# Testbericht – Version 0.5.1

Ausgeführt am 18. Oktober 2026 unter Windows, Node.js 24.19.0, TypeScript 5.9.3, Vite 7.3.7 und Playwright 1.64.1 mit lokal installiertem Chrome (Chromium). Abhängigkeiten sind in `pnpm-lock.yaml` fixiert.

## Abschließende Pflichtprüfungen

Da **npm in dieser Umgebung nicht installiert/auffindbar ist**, wurden die drei angeforderten `package.json`-Skripte wie im Auftrag erlaubt mit dem vorhandenen pnpm ausgeführt:

| Befehl | Ergebnis |
| --- | --- |
| `pnpm run test` | 36/36 Tests bestanden, regulärer isolierter Node-Testlauf |
| `pnpm run build` | TypeScript-Prüfung, Vite-Build und Offline-Cache erfolgreich |
| `pnpm run test:browser` | 29/29 Szenarien bestanden; keine unbehandelten Seitenfehler |

Die Sandbox blockiert Unterprozesse standardmäßig. Die vollständigen Abschlusstests und der Build liefen mit freigegebener lokaler Prozessausführung. Zusätzlich wurden die Unit-Tests während der Entwicklung mit `--test-isolation=none` ausgeführt. Keine Tests wurden übersprungen. Es wurde kein npm-Erfolg behauptet.

## Unit-Tests: 36

16 Engine-Tests: Bewegung, W → D im selben Tick, maximal zwei gepufferte Wendungen und kontrollierte Ablehnung bei vollem Puffer, doppelte/Gegenrichtungen, vier Durchgangsränder, vier Wandränder, Selbstkollision, frei werdender Schwanz, Hindernisse und Startpositionen, originale Labyrinthpassagen, Wachstum/Punkte/Rekord, Bonus-Spawn/-Verzehr, Bonus-Ablauf, Pause/Fortsetzen/Neustart, neun Geschwindigkeiten und Sieg auf vollem Feld.

Sieben Menü-/Speichertests: Hierarchie und Rücksprungposition, zyklische Auswahl und Stufen, beide Einstellungszugänge, Highscore-Seite, alte Schlüssel, Einstellungs-Roundtrip/monotoner Rekord, fehlerhafte Werte und Speicherverweigerung.

13 Snapshot-/Feedbacktests: vollständige Wiederherstellung einschließlich Bonus und aktiver Regeln, unabhängige Kopie, keine Speicherung abgeschlossener Partien, ungültige Versionen/Modi/Felder, Zellgrenzen/Duplikate/Nachbarschaft/Halsrichtung/Hindernisse, Futter-/Bonus-Überlappung, Randdurchgang, alle Labyrinthstarts und Bonus-Ablauf, Reset ohne Verlust von Rekord/Partie/Statistikschlüsseln, kaputtes JSON/zu große Daten, fehlender Speicher, Migration neuer Einstellungen, fehlende Audio-/Vibrations-APIs und Fehlerbehandlung.

## Playwright: 29 Szenarien

Der Test startet einen eigenen HTTP-Server für den Produktionsbuild und beendet ihn anschließend. Kontrollierte Browserzeit macht die Bewegungsprüfungen deterministisch.

1. Nokia-Boot und Standby.
2. Tastatur-Menü bis Stufe 9, Speicherung und Rücknavigation.
3. Spielstart, zwei gepufferte Wendungen, Canvas-Pixel nach einem Tick, Pause, Fortsetzen und bestätigter Neustart.
4. Fokusverlust pausiert; Menübesuch erhält die Runde.
5. Große Ansicht und Einstellungen nach Neuladen.
6. Manifest, aktiver Worker, Offline-Neuladen und Fortsetzen.
7. Periodische Sicherung; Neuladen rekonstruiert das identische pausierte Canvas und den Snapshot.
8. Neustart-Bestätigung: Abbrechen erhält den Spielstand, Akzeptieren setzt Zähler/Bonus zurück.
9. Classic/Modern und Nokia/Vollbild unabhängig; Dark LCD, High Contrast, Lautstärke, Vibration und Reset ohne Datenverlust.
10. Smartphone-Touchmenüs, Bernstein-Thema, kein horizontaler Überlauf.
11. Echte emulierte Touch-Ereignisse: 3/4-Pixel-Zittern ignoriert, deutlicher Wischer vor Fingerfreigabe per Canvas-Pixel geprüft; kein Scrollversatz; Gerätetasten/Pause.
12. 320-Pixel-Layout und große Ansicht passen ohne horizontalen Überlauf.
13. Modern-Menüs am Smartphone scrollbar und mindestens 44 px hoch; Themen/Profil funktionieren in großer Ansicht.
14. Beschädigter Spielstand verworfen; alte Einstellungen/Rekord erhalten; fehlende Audio-/Vibrations-APIs führen zu keinem Seitenfehler.
15. Tödliche Randkollision löscht Snapshot; ein frisch geöffnetes App-Fenster bietet keinen abgeschlossenen Spielstand an; Enter startet sofort ohne Dialog neu.
16. Snapshot-Schreibzugriffe werden gezählt: keine periodischen Writes unter einer Sekunde, ein sofortiger Write bei Pause; Autorepeat und dritte Eingabe bei vollem Puffer ändern die Bewegung nicht.
17. Hosting unter `/snake/`, passender Worker-Scope, Offline-Neuladen mit Query-Parameter und unveränderter pausierter Partie.
18. Simulierter neuer Worker-Build wartet während einer laufenden Runde; reguläre Aktivierung nach Verlassen erhält Snapshot/Rekord; danach erneutes Offline-Neuladen.
19. 320×568: Modern-Spielansicht vollständig sichtbar, kein Scrollen, große Tasten; pausierter Wechsel zur Nokia-Ansicht erhält Snapshot und Profil. Auch die Nokia-Hochformatansicht passt in den Bildschirm.
20. Dieselben Layout-/Zustandsprüfungen bei 360×740.
21. Dieselben Layout-/Zustandsprüfungen bei 390×844.
22. Dieselben Layout-/Zustandsprüfungen bei 430×932.
23. 844×390: Spielfeld und seitliche Steuerung vollständig sichtbar, kein Scrollen; pausierter Ansichtswechsel erhält Spielstand.
24. 1366×768: Modern-Spielfeld und seitliche Steuerung vollständig sichtbar, kein Scrollen; Tastatur/Maus und Ansichtswechsel funktionieren.
25. Safe-Area-Simulation (30 px oben, 24 px unten, je 10 px seitlich), Touch-Richtungsfolge und kein Scrollversatz. Die Browserzeit wird für diese Eingabefolge vor dem Start explizit pausiert, damit die beiden Taps nicht von Echtzeit-Ticks beeinflusst werden.
26. GitHub-Pages-Pfad `/snake-3310/`: relative Manifest-URL, `scope`, `start_url`, beide PNG-Icons, JavaScript und CSS erreichbar; alle beobachteten Ressourcen lokal und ohne HTTP-Fehler.
27. Reguläres temporäres Chromium-Profil: Chrome-CDP meldet keine Installierbarkeitsfehler; Browserprozess vollständig schließen, mit demselben Profil erneut starten, Netzwerk deaktivieren, offline öffnen und identischen Snapshot/Rekord pausiert wiederherstellen; Fortsetzen erfolgreich.

28. Absichtlich blockiertes JavaScript: unabhängiger Ladehinweis erscheint; Neu-Laden stellt die pausierte Partie und den Rekord unverändert wieder her.
29. Absichtlich blockiertes CSS: derselbe Reparaturablauf stellt das korrekt gestaltete LCD wieder her; lokale Daten bleiben erhalten.

Der Update-Test ändert die Cache-Version in der lokalen Serverantwort, nicht in `dist/` oder Benutzerdaten. Er prüft den tatsächlichen Service-Worker-Lebenszyklus, aber keine echte externe Hostingplattform.

## Layout und visuelle Prüfung

Zusätzlich zu den bisherigen Desktop-/Mobile-Tests wurden alle sechs ausdrücklich geforderten Größen geprüft. In der Modern-Vollbildansicht entspricht die Dokumentgröße jeweils exakt dem Viewport; LCD und vier Steuertasten sind vollständig innerhalb des sichtbaren Bereichs. Richtungstasten mindestens 44×44 CSS-Pixel, mobile große Ansicht 48 px hoch. Die vier Smartphone-Hochformatansichten passen auch mit Nokia-Gehäuse und sämtlichen Zahlentasten.

Dauerhafte Screenshots und Messwerte: [SCREENSHOTS.md](SCREENSHOTS.md) und `docs/screenshots/`. Kleines Smartphone, Nokia-Ansicht und Querformat wurden visuell inspiziert. Rohdaten und weitere Bilder werden unter `test-results/` erzeugt; der abschließende JSON-Bericht enthält 29 bestandene Szenarien, `failed: null`, `pageErrors: []` und die sechs Layoutmessungen. `test-results/installability.json` enthält `installabilityErrors: []` aus dem regulären Profil. Das Testprofil wird anschließend sicher innerhalb des eigenen Testausgabeordners entfernt; vorhandene Chrome-Nutzerprofile werden nicht verwendet.

## GitHub-Actions-Konfiguration

`.github/workflows/pages.yml` wurde mit dem vorhandenen YAML-Parser aus dem Playwright-Paket geparst. Zusätzlich geprüft: Veröffentlichungsfeld standardmäßig `false`, Upload und Deployment an manuelle Freigabe gebunden, Deployment abhängig vom Prüfjob und Artefaktpfad ausschließlich `dist`. Kein zusätzliches Paket wurde dafür installiert. Lockdatei-Installation und Projektskripte wurden lokal ausgeführt. Der GitHub-Runner selbst und eine öffentliche HTTPS-Adresse wurden mangels eingerichteten Remotes und ausstehender Veröffentlichungsfreigabe nicht getestet.

## Performance

Statisches Raster/Labyrinth im Canvas zwischengespeichert. Canvas wird nur bei Ticks/Statusänderungen gezeichnet; Menü-DOM wird während des Spiels nicht neu aufgebaut. Text/ARIA-Aktualisierung nur bei geändertem Inhalt. Autosave ist zeitlich begrenzt und im Browser anhand der Schreibzugriffe geprüft. Kein Benchmark auf physisch leistungsschwachen Geräten; entsprechende Framerate-/Energieaussagen werden nicht behauptet.

## Nicht durchgeführt / verbleibende Grenzen

Keine physischen Android-/iOS-Geräte, Safari-/Firefox-Läufe, echte Homescreen-Installation, Hardware-Vibration oder akustische Hörprüfung. Installierbarkeit wurde technisch in einem regulären Chromium-Profil geprüft, eine tatsächliche Installation über eine Betriebssystemoberfläche nicht. Keine öffentliche HTTPS-Veröffentlichung. Fokusverlust wurde durch ein Blur-Ereignis ausgelöst; echtes Betriebssystem-Suspend/Resume bleibt ein Hardwaretest. Netzwerkabschaltung, vollständiger Browser-Neustart und Cache-Updates wurden in Chromium geprüft. Betriebssystemseitig gelöschte Daten, abruptes Beenden ohne Lifecycle-Ereignis und konkurrierende Spielstände mehrerer Tabs sind nicht zuverlässig abzusichern.

Im niedrigen Smartphone-Querformat kann das vollständige Nokia-Gehäuse scrollen, um seine Zahlentasten groß zu erhalten. Die große Modern-Spielansicht passt dort ohne Scrollen; der Wechsel ist direkt in der Toolbar verfügbar. Auf Displays kleiner als die geprüften Größen kann das Mindestlayout bewusst scrollen, statt Spielfeld oder Tasten abzuschneiden.
