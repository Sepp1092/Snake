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
