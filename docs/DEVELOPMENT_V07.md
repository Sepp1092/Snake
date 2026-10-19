# Entwicklungsbericht – Bytecoil 0.7.0

## Ausgangspunkt und technische Entscheidungen

`main` wurde vom Repository `Sepp1092/Snake` per Fast-Forward auf `79c00f9` aktualisiert. Danach wurde der ausdrücklich gewünschte Branch `feature/v0.7-achievements-controls` angelegt. Damit sind die v0.6.1-Canvas-Randkorrektur und die robuste Screenshot-Prüfung enthalten.

Die vorhandene Vite-/TypeScript-/Canvas-Struktur bleibt bestehen. Kein React, kein neues Framework, kein externes Gamepad-/Achievement-SDK. `engine.ts`, `modes.ts`, `records.ts`, `snapshot.ts`, `render.ts` und `display.ts` behalten ihre bisherigen Regeln beziehungsweise Datenformate. Die Spiel- und Canvas-Geometrie bleibt unverändert.

- **Achievements:** eigenes DOM-unabhängiges Modul mit zwölf Definitionen, Pixel-Symbolen, Fortschrittsberechnung und begrenztem lokalem Speicherformat. Es konsumiert die vorhandenen validierten Statistiken; Perfect Run benötigt zusätzlich einen tatsächlich beobachteten Abschluss. So entstehen aus fehlenden historischen Daten keine erfundenen Erfolge.
- **Controller:** reine Eingabeschicht mit Flankenerkennung, Deadzone und Hysterese. Ein dominanter Richtungsimpuls geht an denselben Zweierpuffer wie Keyboard und Touch. Browserstatus/Neutralstellung sind von der Bewegung getrennt. Abgeschaltete Controller erzeugen keine API-Abfragen.
- **Oberfläche:** bestehendes Menü um Achievements und Eingabeeinstellungen erweitert. Classic zeigt zwei Achievement-Zeilen mit Fortschritt zugleich, damit auf kleinen Handhelds keine ausgewählte Zeile abgeschnitten wird; Modern verwendet die vorhandene Scrollliste. Beschreibungen sind in einem zugänglichen Detaildialog lesbar.
- **Mobile Layouts:** Standard erhält die alte Position, Kompakt und Ergonomisch verkürzen im Modern-Vollbild den Abstand zwischen LCD und Tasten. Ergonomisch und Groß erhöhen Touch-Ziele. Die echte virtuelle Zifferntastatur bleibt erhalten. Ein ausgeblendetes Vollbild-Steuerkreuz lässt Wischen verfügbar und bleibt in Menüs bedienbar.
- **Persistenz/Offline:** additive Einstellungskeys plus `snake3310_achievements_v1`; Snapshot 2 und Records 1 unverändert. In vorhandenen Checkpoints prüfen, nur neue Freischaltungen speichern, keine Arbeit in jedem Renderframe. Derselbe inhaltsabhängige PWA-Cache bündelt alle neuen Funktionen lokal.

## Qualität und Artefakte

[Ausführlicher Testbericht](TESTS.md), [Achievement-Regeln](ACHIEVEMENTS.md), [Controller und Mobilbedienung](CONTROLLER.md), [Speicherformat](STORAGE.md), [Screenshots](SCREENSHOTS.md).

Automatisierte Gamepads sind Simulationen der standardisierten Browserzustände. Echte Geräte, Funk/USB und eine installierte iOS-PWA bleiben Hardwaretests. Keine Aussagen über gemessene Hardware-Latenz, Akkulast oder Haptik. Das Spiel bleibt ohne Gamepad-API nutzbar.

## GitHub und Review

Alle v0.7-Änderungen werden nach erfolgreichen Abschlussprüfungen auf dem Entwicklungsbranch committed. Der Branch darf gemäß Auftrag veröffentlicht und als Pull Request zur Prüfung angeboten werden. Kein automatischer Merge nach main, kein manuell freigegebenes Pages-Release und kein Deployment. Der vorhandene Workflow prüft Push/PR; Veröffentlichung benötigt weiterhin den expliziten manuellen Publish-Schritt auf main. [Release-Vorgehen](GITHUB_PAGES.md).


## Abschlussprüfungen

`pnpm install --frozen-lockfile`, 72/72 Unit-Tests und TypeScript-/Produktionsbuild erfolgreich. Beide beauftragten Browserbefehle ausgeführt: 78/78 Chromium-Szenarien sowie 116/116 im kombinierten Chromium-/WebKit-Lauf. `failed: null`, keine unbehandelten Seitenfehler. Insgesamt 216 visuell verglichene Randdarstellungen mit null fehlenden Segmentpixeln und 288 zusätzliche Layoutzustände; alle 24 absichtlichen Clippings erkannt. Die zehn kuratierten Achievement-/Steuerungsbilder wurden bereitgestellt, ausgewählte Bilder visuell kontrolliert und alle lokalen Dokumentationslinks geprüft. Keine deaktivierten Tests.

Neues JavaScript-Bundle etwa 45,1 KB beziehungsweise 15,9 KB gzip, CSS etwa 21 KB; zwei kleine zusätzliche TypeScript-Module ohne neue Abhängigkeit. Dies ist keine Messung auf echter Mobilhardware. Der lokale Preview-Server unter Port 4174 liefert 0.7.0 aus.
