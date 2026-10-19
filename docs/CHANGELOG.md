# Changelog – Bytecoil – Retro Snake

## 0.7.3 – Unified UI, LCD Cleanup & Fullscreen Optimization (20. Oktober 2026)

- Eine gemeinsame Oberfläche mit der bisherigen touchfreundlichen Menüführung. Profil-Buttons, Profil-Menü, bedingtes Rendering, Profileinstellung im aktiven Settings-Modell und `.modern`-/`.modern-only`-CSS entfernt. Classic Snake bleibt als Spielmodus erhalten.
- Alte `snake3310_profile`-Werte bleiben unangetastet, werden weder ausgewertet noch überschrieben. Spielstände, Rekorde, Statistiken, Achievements und übrige Einstellungen behalten ihre Formate.
- Akkuzeichen samt exklusivem Canvas-Code und Bereitschaftszeichen entfernt. Signalbalken und bestehende Spielinformationen bleiben erhalten.
- Vier CSS-Pixel mehr LCD-Breite im Smartphone-Hochformat, unverändertes 320×244-Bitmap mit 26×17 Zellen und Randreserve. Richtungstasten nutzen den unteren Bereich mit Safe Area; Kompakt erhält schmalere Tasten, Ergonomisch behält größere Ziele.
- Überholte CSS-Deklarationen und doppelte Desktop-Aktionen bereinigt; einzeilige mobile Toolbar und vollständige virtuelle Handy-Tastatur erhalten.
- Neue Migrations-, Raster-, HUD-, Offline- und Geometrieprüfungen. Vorhandene PWA-Test-Wartebedingungen auf asynchrones `expect.poll` korrigiert; echte Worker-/Cache-Zustände werden geprüft. Keine Prüfungen abgeschaltet.
- [Entwicklungsbericht, Messwerte, 28 Vergleichsbilder und Einschränkungen](UNIFIED_UI_V073.md). Separater Feature-Commit/Draft-PR; kein Merge oder Pages-Deployment.

## 0.7.2 – Fullscreen Optimization & Adaptive Toolbar (19. Oktober 2026)

- Einzeilige Smartphone-Toolbar mit Pause/Weiter, Menü, Handy/Vollbild und Mehr; Classic/Modern, Hoch-/Querformat und beide Ansichten. Vollständige Toolbar auf Desktop erhalten.
- Mehr enthält gemeinsame Aktionen für Neues Spiel/Neustart, Profil in beide Richtungen, Ton sowie Einstellungen/Komfort. Synchronisierte Zustände, native Tastatur-/Touch-/Mausbedienung und vorhandene Controller-Dialogbedienung.
- Vorübergehende Menüpause bewahrt Partie, akzeptierten Richtungspuffer und Restzeit bis zum nächsten Schritt. Schließen stellt den vorherigen Zustand wieder her; Browserwechsel verhindert automatisches Fortsetzen.
- Mobile Vollbildrahmen reduziert: 14 CSS-Pixel mehr LCD-Breite im geprüften Hochformat. Richtungstasten nutzen freie Höhe darunter; Safe Areas, drei Touch-Layouts und beide Tastengrößen bleiben berücksichtigt.
- Sehr niedriges Handy-Querformat erhält eine einzelne Toolbar-Zeile oberhalb des LCDs neben der vollständigen Zifferntastatur. Classic-Desktop-Vollbild passt auch in 1366×768.
- Keine Änderung an Engine, LCD-Bitmap, Randreserve, Speicherformat, Achievements oder Controller-Modul; keine neuen Abhängigkeiten. Ergänzte Regressionen und [Vorher-/Nachher-Bericht](MOBILE_TOOLBAR_V072.md). Kein automatischer Merge oder Pages-Deployment.

## 0.7.1 – Mobile Layout Optimization (19. Oktober 2026, lokal)

- Gemessene mobile Höhenberechnung statt fester Handybreiten und großer Vollbild-Restflächen; Safe Areas, tatsächliche Menüleisten-/Tastenhöhen und dynamische Viewports berücksichtigen.
- Vollbild-LCD direkt unter der Aktionsleiste, Steuerung direkt darunter beziehungsweise daneben. Schmalere Rahmen und größere LCD-Fläche.
- Handyansicht maximiert LCD-Breite innerhalb der verfügbaren Höhe; alle 15 Tasten bleiben sichtbar. Platzsparendes Querformat und seitliche Aktionsleiste bei sehr niedrigen Displays.
- Classic und Modern, drei Touch-Layouts und beide Tastengrößen; keine Änderung an Spiel-/Speicher-/Achievement-/Controller-Logik oder der v0.6.1-Randreserve.
- Neue Browsermatrix für aktive und pausierte Spiele, Rotation/Safe Areas und Überlappungen. Vorher-/Nachher-Screenshots und [Entwicklungsbericht](MOBILE_LAYOUT_V071.md). Kein automatischer Merge oder Pages-Deployment.

## 0.7.0 – Achievements, Controller und mobile Bedienung

- Basis: `main` auf GitHub-Stand `79c00f9` aktualisiert; neuer Branch `feature/v0.7-achievements-controls`. Die komplette v0.6.1-Randkorrektur und ihre Regressionen bleiben enthalten.
- Zwölf Achievements in eigenem DOM-unabhängigen Modul: eindeutige IDs, eigene Pixel-Symbole, Fortschritt, lokale Freischaltungen und kurze nicht blockierende Benachrichtigungen. Historische Erfolge nur mit Beleg; keine Classic-Erfolge aus Zen, kein erfundener historischer Perfect Run.
- Standardisierte Gamepad-API als Eingabeschicht: D-Pad/linker Stick, A/B/Start, Menü- und Dialogbedienung, Verbindungsanzeige, Deadzone/Hysterese, Flankenerkennung, Neutralstellung nach Tabwechsel. Derselbe bestehende Zweierpuffer; keine neue Engine.
- Standard/Kompakt/Ergonomisch, Normal/Groß sowie ausblendbares Vollbild-Steuerkreuz; die vollständige Handyansicht behält ihre Tasten. Im Modern-Vollbild rücken Kompakt/Ergonomisch das LCD näher an die Bedienung. Safe Areas und responsive Hoch-/Querformate bleiben erhalten.
- Neue Einstellungen für Controller und Erfolgsmeldungen; additive Speicherkeys ohne Verlust von Snapshot, Statistik oder Rekorden. Keine neuen Abhängigkeiten oder externen Laufzeitdienste.
- Zusätzliche Unit-Tests und Chromium-/WebKit-Simulationen für Achievements, Gamepads und sechs Viewports. Alle bisherigen visuellen Randtests bleiben bestehen und laufen zusätzlich für die beiden neuen Touch-Layouts.
- [Achievements](ACHIEVEMENTS.md), [Controller](CONTROLLER.md), [Testbericht](TESTS.md), [Speicherformat](STORAGE.md). Kein Merge oder Pages-Deployment.

## 0.6.1 – CI-Randtest-Korrektur (19. Oktober 2026, lokal)

- Einzelne grenznahe Screenshot-Probe durch mehrere innere Punkte und vollständigen Konturvergleich mit einer gleich gerasterten, unbeschnittenen LCD-Referenz ersetzt. Der ursprüngliche Hintergrund-Fehlalarm wurde mit Playwright Chromium reproduziert.
- Screenshotmaßstab aus tatsächlichen PNG-Maßen, streng getrennte LCD-Palettenfarben und gezielte Clipping-Gegenproben an allen vier Seiten. Keine gelockerten pauschalen Farbgrenzen und keine deaktivierten Tests.
- Drei neue Raster-Unit-Tests einschließlich einzelner fehlender Pixelzeilen/-spalten; Kopf und Auge ebenfalls im Quellraster geprüft. Alle 59 Unit-Tests, Build und 58 Browser-Szenarien erneut erfolgreich; vollständige 72er-Randmatrix in Chromium und WebKit.
- GitHub Actions sichert Berichte und Screenshots auch nach einem Fehler. Keine Änderung an Laufzeitcode, Spiellogik, Version oder Speicherformat; kein Deployment.
- [Analyse, Messwerte, Reproduktionsbild und Grenzen](EDGE_TEST_FIX.md).

## 0.6.1 – LCD-Randkorrektur (19. Oktober 2026, lokal)

- Weiterentwicklung des vorhandenen v0.6-Stands auf `feature/v0.6-game-modes`, ausschließlich im Checkout `bytecoil-v06`.
- LCD-Canvas von 312 × 236 auf 320 × 244 logische Pixel erweitert: vier Pixel Reserve rund um die bisherige Darstellung. Die Engine behält 26 × 17 Zellen à 12 Pixel und den 32-Pixel-Statusbereich.
- LCD-Seitenverhältnis beschreibt jetzt die **Innenfläche**, der 3-Pixel-CSS-Rahmen liegt außerhalb. Canvas-Höhe proportional/automatisch; Menüs behalten bei verborgenem Canvas ihre Fläche. Gehäuse-Transform entfällt, `pixelated` hat Vorrang und Glättung bleibt ausgeschaltet.
- Vollbild-Breitenformeln angepasst. Kompaktes Modern-Gehäuse auf kurzen Hochformatdisplays um acht CSS-Pixel schmaler, damit die gesamte Tastatur weiterhin ohne Scrollen passt.
- Zwei Geometrietests und eine reproduzierbare Randschlange über alle vier Ecken und die gesamte unterste Reihe. Canvas-Raster, CSS-Grenzen und sichtbare Screenshot-Pixel werden gemeinsam geprüft: drei Viewports × drei DPR × zwei Profile × zwei Ansichten, in Chrome und WebKit.
- Web-Audio-Regression prüft echte Oszillatorstarts, Stummschaltung und gespeicherte Sound-Einstellung. Alle bisherigen Modus-, Statistik-, Highscore-, Speicher-, Touch- und Offline-Tests erneut ausgeführt.
- Ergebnis: 56 Unit-Tests, Produktionsbuild und 58 Browser-Szenarien mit optionaler WebKit-Matrix erfolgreich. Details und Geräte-Grenzen: [Tests](TESTS.md), [LCD](LCD.md), [Screenshots](SCREENSHOTS.md).
- Bytecoil-Branding und vorhandene Speicherschlüssel unverändert. Kein Push, Merge, öffentliches Release oder GitHub-Pages-Deployment.


## 0.6.0 – Spielmodi, Statistik und getrennte Rekorde

Ausgangsbasis: Bytecoil v0.5.2, Commit `059debfdb68502d668092df4c2c434be9333dd2d`, lokaler Branch `feature/v0.6-game-modes`.

- Classic Snake nutzt unverändert die bestehende Bewegungs-/Kollisionsengine. Ein zusätzlicher Sitzungswrapper ergänzt aktive Zeit, Ziele und Fortschritt; es gibt keine zweite unabhängige Engine.
- Zen Mode: sicherer Respawn nach Kollision und bei vollem Feld; Sitzungspunkte und Fortschritt bleiben erhalten, Kollisionen werden gezählt. Keine Zen-Rangliste.
- Time Attack: 60/120/180 Sekunden, monotone aktive Zeit, genaue pausierte Wiederherstellung und getrennte Rekorde. Kollision und Timeout beenden die Runde.
- Challenges: Food Hunter, Survivor und Maze Master, verbindliche Ziel-/Kartenregeln, Ziel-Dialog, Fortschritt und Retro-Erfolgsbildschirm. Sofortige Wiederholung ohne erneute Einführung nach abgeschlossenem Versuch.
- Modusauswahl unter Spiele; Statistik und Highscores im Hauptmenü. Profile bleiben unabhängig. Keine zusätzliche permanente Smartphone-Menüfläche.
- Statistik-Format 1 mit Sitzungs-Checkpoints: gestartete Partien, aktive Zeit, Futter, Punkte, maximale Länge und Kollisionen je Modus. Challenge-Status separat je ID, Rekorde für jede Zeitvariante. Wiederherstellung zählt dieselbe Sitzung nicht erneut.
- Snapshot-Format 2 enthält Modus und Sitzungsfortschritt. Version-1-Partien werden ohne Änderung des Spielfelds als Classic übernommen. Bestehende Einstellungen und `snake3310_best` bleiben kompatibel.
- Neue Module: `src/modes.ts`, `src/records.ts`; neue Tests: `tests/modes-records.test.ts`; neue Dokumentation: `docs/MODES.md`.
- Erweitert: `main.ts`, `menu.ts`, `render.ts`, `snapshot.ts`, `storage.ts`, `index.html`, `package.json`, Browser-/Menütests und Dokumentation. Neue Bytecoil-Screenshots unter `docs/screenshots/`. `engine.ts`, LCD-Themen, Eingabepuffer, Audio und PWA-Grundlage bleiben unverändert.
- 54 Unit-Tests, 39 Browser-Szenarien und TypeScript-/Produktionsbuild geprüft; siehe [Testbericht](TESTS.md).

Bekannte Grenzen: keine Tests auf physischen Android-/iOS-Geräten oder Safari; kein Mehrtab-Schreib-Lock; ein harter Abbruch kann ungesicherte Fortschritte verlieren. Die vorhandenen historischen Daten erlauben keine rückwirkende Gesamtspielzeit-/Futterstatistik. Es wurde weder gepusht noch gemergt oder veröffentlicht. Die öffentliche v0.5.2 bleibt unberührt.

---

# Version 0.5.2 – Bytecoil-Rebranding

- Neuer öffentlicher Spielname: **Bytecoil – Retro Snake**.
- Fremde Markenkennzeichen und Werbeslogans aus der Spieloberfläche entfernt.
- Virtuelles Retro-Gerät mit eigenständigen Konturen, Farbpalette und Tasten gestaltet.
- Spiel- und Menütitel, PWA-Manifest, Tests und Dokumentation angepasst.
- Frühere HTML-Referenz und Screenshots mit altem Branding aus dem aktuellen Projekt entfernt.
- Lokale Datenspeicherung weiterhin unter den bisherigen `snake3310_*`-Schlüsseln, um Rekorde, Spielstände und Einstellungen beim Update auf derselben Origin zu erhalten.
- Engine und Spielregeln unverändert. 37 automatisierte Tests inklusive neuem Branding-Check bestanden.

**Vor Veröffentlichung:** Neue Screenshots, Browser-/Smartphone-Abnahme, Prüfung des Namens in Markenregistern und Kontrolle der öffentlichen Git-Historie erforderlich.

---

# Version 0.5.2 – Mobile Optimierung und PWA-Release-Vorbereitung

## Änderungen

- Kompakte Modern-Toolbar mit Pause/Weiter, Menü, Ansichtswechsel und „Mehr“. Seltenere Aktionen liegen in einem tastaturbedienbaren Dialog; eine laufende Runde pausiert beim Öffnen.
- Moderne große Spielansicht nutzt dynamische Viewport-Höhe und verfügbare Breite. Bildschirmränder und Safe Areas sind reserviert. Im Querformat und niedrigen Desktopfenster stehen Richtungstasten neben dem LCD.
- Kopf-/Fußbereich und redundante Komfortanzeigen entfallen auf kleinen Modern-Displays. Vier mobile Richtungstasten sind 48 px hoch, übrige wichtige Aktionen mindestens 44 px.
- Kompaktere Gehäuseabstände auf kleinen Modern-Handy-Ansichten. Alle Zahlentasten und die ursprüngliche Classic-Ansicht bleiben erhalten.
- Alle sechs geforderten Fenstergrößen geprüft: 320×568, 360×740, 390×844, 430×932, 844×390 und 1366×768. In Modern-Vollbild keine horizontale oder vertikale Scrollbar während des Spiels. Handy-Hochformat passt bei allen vier Smartphone-Größen.
- Zusätzliche Playwright-Prüfungen für pausierten Ansichtswechsel, Safe Areas, GitHub-Pages-Unterpfade, Manifest/Icons/Assets, Installierbarkeit in einem regulären Profil und Offline-Wiederherstellung nach vollständigem Browser-Neustart.
- GitHub-Actions-Konfiguration mit fixiertem Node/pnpm und Lockdatei-Installation. Unit-/Browser-Tests und TypeScript-Build vor einem Release. Veröffentlichung ausschließlich per manueller Freigabe vom Standardbranch; nur `dist/` wird hochgeladen.
- GitHub-Pages-, Installations- und Offline-Testanleitungen sowie dauerhaft gespeicherte Screenshots ergänzt.

## Datenkompatibilität

Engine, zwei gepufferte Wendungen, Punktewerte, Themen, Audio und Snapshot-Format Version 1 sind unverändert. Es gibt keine Migration/Löschung bestehender Daten. Normale Updates unter derselben Origin erhalten Einstellungen, Rekord und valide gespeicherte Partie; Wiederherstellung bleibt pausiert. Ein Wechsel von Localhost zu GitHub Pages überträgt lokale Daten nicht automatisch.

## Dateien

Geändert: `index.html`, `package.json`, `src/main.ts`, `src/style.css`, `scripts/browser-test.mjs`, README sowie CHANGELOG/PWA/TESTS. Neu: `.github/workflows/pages.yml`, `docs/GITHUB_PAGES.md`, `docs/SCREENSHOTS.md` und `docs/screenshots/`. `dist/` wurde neu gebaut. Keine neuen Abhängigkeiten.

## Ergebnisse und verbleibende Grenzen

36/36 Unit-Tests, 29/29 Browser-Szenarien und Produktionsbuild erfolgreich, ausgeführt mit dem vorhandenen pnpm. Chrome meldet im regulären lokalen Testprofil keine Installierbarkeitsfehler. YAML wurde geparst und auf opt-in-Freigabe und `dist/`-Artefakt geprüft. Der Workflow selbst wurde noch nicht auf GitHub ausgeführt; kein Remote konfiguriert und keine Veröffentlichung vorgenommen.

Physische Android-/iOS-Tests, Safari, tatsächliche Installation über die Betriebssystemoberfläche und finale HTTPS-Abnahme bleiben vor dem öffentlichen Testrelease erforderlich. Das vollständige Handygehäuse darf bei niedrigem Smartphone-Querformat scrollen; dort passt die direkt erreichbare Vollbildansicht. Details: [Testbericht](TESTS.md), [Screenshots](SCREENSHOTS.md), [GitHub Pages](GITHUB_PAGES.md).

---

# Version 0.5 – gespeicherte Partien und optionale Komfortfunktionen

Weiterentwicklung direkt im bestehenden Projekt. Eine Engine, keine neuen Abhängigkeiten, keine Dienste oder Telemetrie. Die vergrößerte Vollbildansicht (bis 1100 px, abhängig vom Fenster) bleibt erhalten.

## Implementiert

- P0: versionierte und streng validierte Snapshots; automatisches Speichern mit Ein-Sekunden-Intervall und ereignisbezogenen Sicherungen; pausierte Wiederherstellung; Fortsetzen im Retro-Menü; Bestätigung vor Überschreiben; Löschen des Fortsetzungsstands bei Game Over/Sieg.
- P0: Eingabepuffer auf zwei zukünftige Wendungen begrenzt; kein Überschreiben angenommener Eingaben; W → D, volle Queue und Autorepeat deterministisch geprüft. Winzige/uneindeutige Touch-Bewegungen werden ignoriert.
- P0: Rendern nur bei Spielschritten oder UI-Änderungen, statisches LCD-Raster und Labyrinth werden zwischengespeichert; DOM-Texte nur bei Änderungen; keine Kopie des gesamten Körpers für die Kollisionsprüfung; kein Speichern pro Animationsframe.
- P0: Offline-Cache nach Service-Worker-Scope getrennt, Navigation mit Query-Parametern funktioniert offline. Regulär wartende Updates unterbrechen keine Partie und berühren localStorage nicht. Unterverzeichnis und simulierter Update-Zyklus getestet.
- P1: Classic/Modern unabhängig von Retro-Handy/Vollbild; Modern mit größeren, scrollbaren Menüs, Spielinformationen und Schnellzugriffen. Eine gemeinsame Spiellogik.
- P1: Dark LCD und High Contrast ergänzen Oliv/Silber/Bernstein. Bonusobjekte besitzen ein kontrastierendes Pluszeichen.
- P1: fünf Lautstärkestufen einschließlich stumm, getrennte Signale und optionales haptisches Feedback; sichere Fallbacks bei fehlenden APIs.
- P1: Einstellungen zurücksetzen mit Bestätigung, ohne Rekord, Partie oder fremde Statistikdaten anzutasten. Neustart sofort nach Game Over, mit Sicherheitsdialog während laufender/pausierter Runde.
- P1: Spieltasten und Toolbar mit mindestens 44 px Trefferhöhe; Modern-Menüpunkte ebenfalls mindestens 44 px. Klassische LCD-Einträge bleiben kompakt und zusätzlich über die großen Gerätetasten bedienbar. Reduzierte Animationen bleiben berücksichtigt.

## Dateien

Neu: `src/snapshot.ts`, `tests/snapshot-audio.test.ts`, `docs/STORAGE.md`.

Erweitert: `src/engine.ts`, `src/storage.ts`, `src/main.ts`, `src/menu.ts`, `src/render.ts`, `src/audio.ts`, `src/style.css`, `index.html`, `package.json`, `tests/engine.test.ts`, `scripts/browser-test.mjs`, `scripts/offline.mjs`, README und diese Dokumentationen. `dist/` wurde neu erzeugt. Manifest und Icons bleiben in ihrer bestehenden Struktur funktionsfähig. Keine neue Runtime-Abhängigkeit.

## Abnahme und Grenzen

36 Unit-Tests und 18 Browser-Szenarien bestanden; TypeScript und Produktionsbuild erfolgreich. Details und npm/pnpm-Umgebungsabweichung: [Tests](TESTS.md). Format und Migrationsverhalten: [Speicherung](STORAGE.md). Einschränkungen und Update-Ablauf: [PWA](PWA.md).

Alle P0-Anforderungen und die oben genannten P1-Funktionen sind umgesetzt. Nicht als erledigt gelten Hardwaretests auf Android/iOS, echte Homescreen-Installation, Safari-/Firefox-Abnahme, Hör-/Vibrationstest auf Hardware und öffentliche HTTPS-Veröffentlichung.

## Mögliche Arbeit für 0.6

- Echte Mobilgeräte und Browsermatrix einschließlich Safari; Akkulast/Frametiming auf schwachen Geräten messen.
- Mehrtab-Schutz für den gemeinsamen lokalen Spielstand und optionaler lokaler Export/Import.
- Optionaler Hinweis auf bereitstehende Updates mit bewusstem Wechsel nach Spielende.
- Neue Spielmodi, Achievements, Online-Bestenlisten und Controller-Unterstützung bleiben außerhalb dieses Auftrags; keine davon ist für 0.5 vorausgesetzt.

---

# Analyse und Änderungen: 0.3 → 0.4

## Ausgangslage

Der Projektordner enthielt keine App-Dateien. Die angegebene Datei aus Downloads war der funktionierende 0.3-Prototyp: eine vollständige HTML-Datei mit CSS und einer JavaScript-IIFE. Alle Funktionen waren unmittelbar an DOM und einen gemeinsamen Zustand gebunden. Es gab keine Test- oder Buildstruktur.

Übernommen: 312 × 236 Canvas, 26 × 17 Spielfeld, 12-Pixel-Zellen, Box/Kreuz-Labyrinthe, Übergangsränder oder Wandkollisionen, 10/25-Punkt-Futter, Bonus-Lebensdauer, neun Geschwindigkeiten, rechteckige Retro-Töne, lokale Schlüssel, Gehäuseverläufe, Pixelzeichnung und responsive Ansicht.

## Gezielte Verbesserungen

- Reine TypeScript-Spielklasse ermöglicht deterministische Tests mit injiziertem Zufall. Kein Framework und keine neue Game Engine.
- Eingabepuffer ohne bisherige Drei-Eingaben-Grenze. Gegenrichtung wird gegen die zuletzt gepufferte Richtung geprüft. Ein Spielschritt verbraucht höchstens einen Richtungswechsel. Wiederholte Keydown-Ereignisse und doppelte Richtungen werden ignoriert.
- Beim Neustart wird altes Futter vor der Neuberechnung gelöscht. Bonusfutter kann die letzte freie Zelle nicht mehr als falschen Sieg blockieren.
- Pausieren leert vorgemerkte Bewegungen. Kein automatisches Wiederanlaufen bei Rückkehr; kein Nachholen von Bewegungen nach langsamen Frames.
- Vollständiger Menübaum inklusive Hauptmenü, Spiele, Retro Snake, Spielstufe, Labyrinth, Highscores und Einstellungen mit Sound, LCD, Steuerung und Randmodus.
- Menünavigation speichert die Position im Elternmenü. Auswahlrahmen, Eintragsnummern, Softkey-Beschriftungen, Start- und Standby-Bildschirm.
- Bestehende Partie bleibt beim Öffnen des Menüs erhalten. Spielfeldänderungen gelten erst beim nächsten Start, statt die Runde überraschend neu zu starten.
- Originale Geräteansicht mit vollständiger Zahlentastatur, grauen Tasten und geprägter Optik. Große Ansicht mit Touch-Steuerkreuz bleibt verfügbar.
- Oliv-, Silber- und Bernstein-LCD; dezentes Raster; kurze gestufte Menü- und Game-Over-Animationen. Reduzierte Bewegung wird respektiert.
- Pointer Capture, Pointer-Cancel-Behandlung, 14-Pixel-Wischschwelle und Richtungswechsel während der Bewegung. Scrollen auf LCD und Steuertasten wird unterbunden; die restliche Seite bleibt scrollbar und zoombar.
- Validierte Speicherwerte und robuster Fallback bei nicht verfügbarem localStorage. Bestehender Rekord wird nicht durch kleinere Werte überschrieben.
- Build mit relativen Assetpfaden, lokale Icons, PWA-Manifest und automatisch versionierter Offline-Cache. Keine externen Schriftarten oder Dienste.

## Bewusste Grenzen

Ein geräteweiter Highscore wie in 0.3, keine Online-Rangliste. Keine Original-Retro-Handy-Binärdateien oder proprietären Schriftdateien. Die historische Optik wird mit System-Monospace und Canvas nachgebildet. Die große Ansicht nutzt das Browserfenster, nicht exklusives Betriebssystem-Vollbild. Veröffentlichung und echte Smartphone-Installation wurden nicht vorgenommen.

### Nachbesserung: Laden alter Dokumente

`vite.config.ts` behält ältere Assets bei lokalen Builds. `scripts/offline.mjs` verwendet das aktuelle Vite-Manifest und nimmt nur die aktuellen Bundle-Dateien in den Offline-Cache auf. Der neue Inline-Ladehinweis aus `scripts/load-guard.js` funktioniert unabhängig von CSS und Spielmodulen und bietet eine Reparatur ohne Löschen lokaler Daten. Zwei zusätzliche Browserfälle für fehlendes JavaScript und CSS bestanden; aktueller Browserumfang: 29 Szenarien.
