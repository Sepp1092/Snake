# Tests – Bytecoil 0.7.4

Basis: main **6457008**, vollständig übernommene 0.7.3, Branch **feature/v0.7.4-fullscreen-controls**. Abschluss am 20. Oktober 2026. Windows, Node 24.19.0, pnpm 11.25.0, TypeScript 5.9.3, Vite 7.3.7, Playwright 1.64.1, Chromium 156.0.8078.4 und WebKit 27.2. Keine neuen Abhängigkeiten.

| Prüfung | Ergebnis |
| --- | --- |
| Sämtliche Unit-Tests | **76/76**, keine übersprungenen Tests |
| Produktionsbuild | TypeScript, Vite und Offline-Cache erfolgreich |
| Vollständiger ungefilterter Browserlauf | **186/186**, 113 Chromium und 73 WebKit; keine Seitenfehler |
| Bestehende adaptive Matrix | **480** aktive/pausierte Layoutzustände, beide Ansichten, alle drei Touch-Layouts und beide Tastengrößen |
| Bestehende Steuerungsmatrix | **288** Zustände |
| Strenge Randmatrix | **216** Darstellungen mit DPR 1/2/3, **24** reale Clipping-Gegenproben |
| Bisherige gemeinsame UI und Migration | **48** Geometrieeinträge; alte Profilwerte, Spielstand, Rekorde, Achievements und Offline-Neuladen |
| Bisheriger LCD-Header | **80** Renderprüfungen, vier Modi × fünf Paletten × beide Ansichten × beide Engines; bemalte Akku-Fläche als Gegenprobe |
| Neue v0.7.4-Anordnung | **48** aktive/pausierte Geometrieeinträge, sechs Viewports und beide Ansichten in beiden Engines |
| Neue weitere Prüfungen | je Engine dynamische Höhe/Safe Areas/Gegenproben, extremes Querformat und schnelle Touch-Wendungen/pausierter Ansichtswechsel |

## Reproduktion

```powershell
node --experimental-strip-types --test tests/*.test.ts
pnpm run build
$env:BROWSER_CHANNEL='chromium'
node scripts/browser-test.mjs --webkit
```

Der Unit-Befehl entspricht dem package.json-Skript. Der vollständige Browserlauf enthält alle bisherigen 168 Szenarien plus 18 neue. Keine Tests deaktiviert oder übersprungen. `--v074-only` ist nur eine zusätzliche fokussierte Entwicklungsoption; der Standardlauf bleibt vollständig. Der neue Testblock bestand zuvor 18/18 Szenarien in Chromium/WebKit. Maßgeblich ist der anschließende vollständige Lauf des finalen Produktionsbuilds.

Finale Artefakte: **index-EuDBrO-o.js**, **index-5ReGZqj7.css**, Offline-Cache **e5a91737a1d4**, sieben Assets. Keine nachträglichen Laufzeitänderungen nach diesem Build.

## Was ausdrücklich geprüft wurde

- 320×568, 360×740, 390×844, 430×932, 844×390 und 1366×768. Toolbar einzeilig/vier Hauptaktionen auf Smartphones, vollständig sichtbare Tasten ohne Überlappung, kein horizontaler Überlauf und im aktiven üblichen Vollbild kein Seitenscrollen.
- Im Hochformat Statusbox → obere Pfeiltaste **16–32 CSS-Pixel**, im tatsächlichen Standardlayout rund 17/22/24/24 Pixel. Unverändertes 320×244-Bitmap, scharfe Pixel-Skalierung, proportionaler Canvas, bestehende Breite und LCD-Randreserve. Handy-Proportionen werden mit dem echten v0.7.3-Build verglichen.
- Reale CSS-Gegenproben mit `margin-top:auto` und negativer Marge müssen vom selben Abstandsprüfer erkannt werden. Anschließend wieder korrektes Layout. Der Test würde den ursprünglichen großen Leerraum weiterhin erkennen.
- Wechselnde Hochformathöhen 640/740/568/844 mit Ergonomisch/Groß, Safe Areas 24/34/12/12 Pixel, Drehung auf 844×390 und zurück. Partie bleibt pausiert und identisch, alle großen Tasten mindestens 64 Pixel hoch, kein Scrollen auf diesen üblichen Größen.
- Extremfall 568×220 mit Ergonomisch/Groß: im Spiel und Menü kein Überdecken von Toolbar/LCD. Ein ggf. notwendiger Dokument-Scrollbereich umfasst sämtliche Tasten; die letzte Taste wird tatsächlich vollständig in den sichtbaren Bereich gescrollt.
- Zwei schnelle echte Touch-Taps vor dem nächsten Schritt führen zu zwei aufeinanderfolgenden Richtungswechseln. Nach zwei Schritten wird per Pause ein aktueller Snapshot geschrieben und der erwartete Kopf-/Richtungszustand geprüft. Pausierter Handy-/Vollbildwechsel bewahrt die Partie; eine verbotene Umkehrung nach Fortsetzen bleibt abgelehnt. Keine Änderung des bisherigen bewussten Puffer-Resets bei manueller Pause. Periodische Autosaves werden nicht fälschlich als Live-Enginezustand ausgewertet; nach Fortsetzen bleibt der Test deutlich zwischen dem ersten und zweiten möglichen Schritt inklusive Animationsframe-Abstand.
- Bestehende Spielmodi, Statistik, Rekorde, Achievements, Touch/Gesten, Keyboard, simulierte Gamepads, echte Audio-Oszillatoren, Vibrations-API, fehlende APIs, Pause/Neustart, Speicher-Migration, Browser-Neustart, Installierbarkeit und Offline-PWA bleiben aktiv geprüft. Mehr bewahrt temporären Pausezustand, akzeptierte Eingaben und Restzeit. Asynchroner PWA-Updatetest prüft weiterhin wartenden/aktiven Worker und Cache-Wechsel.

Die früheren Assertions für untere Verankerung beziehungsweise zwingendes Abwärtsverschieben sind durch die neue ausdrücklich geforderte Abstandsregel ersetzt; sichere Unterkante, Überlappung, Raster-/Farbprüfungen und sämtliche Funktionsprüfungen bleiben erhalten. Kein Abschwächen von Clipping-Farbgrenzen; die Randtestdateien sind unverändert.

## Nachweise und Grenzen

Rohdaten: `test-results/browser-report.json` mit **1134** Layout-/Geometrieeinträgen, `failed:null` und `pageErrors:[]`; `test-results/v074-unit-tests.txt`; `test-results/installability.json`. Entwicklungszwischenstände bleiben nur im ignorierten Testausgabeordner. 20 kuratierte Bilder und 48 Vorher-/Nachher-Messungen unter `docs/screenshots/v074/`.

[Layoutbericht, Messwerte und Bilder](FULLSCREEN_CONTROLS_V074.md) · [Vollständige geänderte Dateiliste](CHANGED_FILES_V074.md).

Kein echtes iPhone/Safari und keine installierte iOS-PWA auf Hardware. Browserleistenanimationen, Display-Zoom, physisches Controller-Pairing und Vibration sind nicht auf Geräten geprüft. Safe Areas, dynamische Höhe und Controller-API werden simuliert. Übliche Queransicht bleibt aus Platzgründen seitlich; extrem niedrige Fenster dürfen sicher scrollen. Die Desktop-Handyansicht behält ihren bisherigen normalen Dokument-Scrollbereich. GitHub-Actions-Prüfungen folgen nach dem Feature-Commit; dieser Bericht dokumentiert den lokalen Abschluss. Kein automatischer Merge oder Pages-Deployment.

---

# Historischer Teststand – Bytecoil 0.7.3

Basis: `main` **40b5342**, Branch **feature/v0.7.3-unified-ui**. Windows, Node 24.19.0, pnpm 11.25.0, TypeScript 5.9.3, Vite 7.3.7, Playwright 1.64.1, Chromium 156.0.8078.4 und WebKit 27.2. Keine neuen Abhängigkeiten.

## Abschluss am 20. Oktober 2026

| Prüfung | Ergebnis |
| --- | --- |
| Nativer Unit-Testbefehl aus package.json | **76/76**, keine übersprungenen Tests |
| `pnpm run build` | TypeScript, Vite und Offline-Cache erfolgreich |
| Vollständiger Browserlauf mit `--webkit` | **168/168**, 104 Chromium und 64 WebKit; keine Seitenfehler |
| Adaptive Layout-Matrix | **480 aktive/pausierte Zustände**, beide alten Profilwerte, Ansichten, drei Layouts, zwei Tastengrößen |
| Bestehende Steuerungsmatrix | **288 Zustände**, einschließlich schmalerer Kompakt-Tasten |
| Strenge Randmatrix | **216 Darstellungen**, DPR 1/2/3; **24** echte Clipping-Gegenproben |
| Neue gemeinsame UI-Geometrie | **48 Ansichten** über sechs Viewports und beide Engines; alte Profilwerte liefern identische Canvas-Pixel und Layouts |
| Neuer LCD-Header | **80 Renderprüfungen**: vier Modi × fünf Paletten × zwei Ansichten × zwei Engines, jeweils mit bemaltem Bereich als Gegenprobe |

## Reproduktion

```powershell
node --experimental-strip-types --test tests/*.test.ts
pnpm run build
$env:BROWSER_CHANNEL='chromium'
node scripts/browser-test.mjs --webkit
```

Der erste Befehl entspricht exakt dem `test`-Skript. Der vollständige Browserbefehl verwendet keine Filter und enthält alle bisherigen 148 plus 20 neue gruppierte Szenarien. Die fokussierten Entwicklungsoptionen `--v073-only` und die bestehenden Filter ändern den Standardlauf nicht. Es wurden keine Tests deaktiviert. Die neue Funktion war zuvor zusätzlich mit 20/20 fokussierten Szenarien in beiden Engines geprüft; maßgeblich ist der anschließende vollständige Lauf des finalen Builds.

Lokale Produktionsartefakte: `index-F7SLnUfp.js`, `index-CNxfA0IY.css`; Offline-Cache **4aad441c8806**, sieben aktuelle Assets. Nach diesem Build wurden keine Laufzeitdateien mehr verändert.

## Umfang und korrigierter Testfehler

- Vier neue Unit-Tests: Classic-/Modern-/unbekannte Profilwerte werden ignoriert und unverändert gespeichert gelassen; Snapshot, Rekorde, Achievements und Komfortoptionen bleiben erhalten. Gemeinsames Menü ohne Profilwahl, alle vier Spielmodi und bisherigen Komfortmenüs bleiben vorhanden. Die 72 bisherigen Tests bleiben aktiv; die alte Profil-Erwartung prüft jetzt die ausdrücklich gewünschte Entfernung aus dem Settings-Modell.
- **320×568, 360×740, 390×844, 430×932, 844×390, 1366×768**: beide Ansichten, gleiche Oberfläche für beide alten Profilwerte, Canvas-Verhältnis/Bitmap, vollständige Randschlange, unveränderter Spielstand und gespeicherter Legacy-Key. Kein horizontaler Überlauf, kein Seitenscrollen im aktiven Vollbild, vier mobile Toolbar-Buttons und mindestens 44-Pixel-Ziele. Safe Areas und zusätzliche Drehungen 568×320/740×360 bleiben abgedeckt.
- Standard/Kompakt/Ergonomisch und Normal/Groß bleiben geprüft. Veraltete obere Schranken für den Abstand der Spielgruppen wurden durch Mindestabstand und sicheren unteren Steuerungsanker ersetzt. Überlappung, Touch-Flächen, Vollständigkeit und alle Raster-/Farbprüfungen bleiben unverändert streng.
- Separate Browser-Migrationen laden historische Statistik/Rekorde, Achievements, Amber-LCD, Lautstärke, Vibration, großes Tastenlayout und gespeicherte Partie. Nach Mehr-Aktionen, Menüwechsel und Offline-Reload bleiben Daten und ursprünglicher Profilwert erhalten. Die aktivierte Vibration erreicht die abgefangene Browser-API. Keine physische Vibrationsprüfung.
- Der ehemalige Akkubereich wird in allen vier Modi und fünf Paletten auf die echte LCD-Headerfarbe geprüft; Signalbalken müssen weiterhin Tinte enthalten. Tatsächliche Canvas-Textaufrufe für Modus/Score/Status werden gemessen: Text liegt im Header und überlappt Signal/Score nicht. Eine absichtliche Einfärbung des Akkubereichs muss die saubere Probe verletzen.
- Alle bestehenden Spielmodi, Time-Attack-Limits, Challenges, Achievements, Statistik/Rekorde, Snapshot-Migration, schnelle Eingaben, Touch/Keyboard/Controller, reale Audio-Oszillatoren, fehlende APIs, Pause/Neustart, Browser-Neustart, Installierbarkeit, Unterverzeichnisse und Offline-PWA bleiben abgedeckt. Die Mehr-Tests erhalten vorherigen Pausezustand, zwei akzeptierte Richtungen, Schritt-Restzeit und aktive Time-Attack-Zeit. Die entfernte Profilaktion wird durch Abwesenheits-/Migrationsprüfungen ersetzt; kein unsichtbarer No-op im Bedienhelper.
- Im vorhandenen PWA-Updatetest wurde ein tatsächlicher Testfehler behoben: `waitForFunction` wartete in der installierten Version nicht auf die asynchronen Prädikate. Das konnte vorzeitig weiterlaufen und anschließend `waiting.state` von `null` lesen. `expect.poll` wartet jetzt auf den installierten wartenden Worker und unveränderten bisherigen Controller; nach Navigation werden Aktivierung und Entfernung des alten Scope-Caches geprüft. Keine Änderung der App oder des Service-Worker-Protokolls. Frühere fehlgeschlagene Entwicklungsberichte liegen als `v073-pwa-race-report.json` und `v073-pwa-async-report.json` im ignorierten Testausgabeordner.

Aktuelle Rohdaten: `test-results/browser-report.json` mit **1086 Layout-/Geometrieeinträgen**, `failed: null` und `pageErrors: []`; `test-results/v073-unit-tests.txt`; `test-results/installability.json` ohne Installierbarkeitsfehler. Die 28 kuratierten Vergleichsbilder und jeweils 48 Vorher-/Nachher-Messungen liegen unter `docs/screenshots/v073/`. Weitere HUD-/Randbilder erzeugt die Suite im Testausgabeordner.

[Änderungen, Profilmigration, Messwerte und Vergleichsbilder](UNIFIED_UI_V073.md) · [Vollständige Dateiliste](CHANGED_FILES_V073.md)

## Grenzen und Freigabe

Kein echtes iPhone/Safari, kein Display-Zoom, kein physisches Controller-Pairing und keine installierte iOS-PWA auf Hardware. Safe Areas, Viewportwechsel, Standard-Gamepads und Vibrations-API werden simuliert. Hohe Displays behalten den beschriebenen Zwischenraum zwischen proportionalem LCD und unterer Daumenzone. Menüs/Mehr dürfen intern scrollen; die aktive Spielseite passt in die geprüften Vollbildgrößen. Keine bekannten offenen Fehler in den geprüften Szenarien. GitHub-Actions-Prüfungen folgen nach dem Feature-Commit; dieser Bericht dokumentiert den lokalen Abschlusslauf. Kein automatischer Merge oder Pages-Deployment.

---

# Historischer Teststand – Bytecoil 0.7.2

Basis: `main` **3a44d40** (0.7.1), Branch **feature/v0.7.2-mobile-toolbar**. Windows, Node 24.19.0, pnpm 11.25.0, TypeScript 5.9.3, Vite 7.3.7, Playwright 1.64.1, Chromium 156.0.8078.4 und WebKit 27.2. Keine neuen Abhängigkeiten.

## Abschließende Ergebnisse (19. Oktober 2026)

| Prüfung | Ergebnis |
| --- | --- |
| `pnpm run test` / identischer nativer Node-Testbefehl | **72/72**, keine übersprungenen Tests |
| `pnpm run build` | TypeScript, Vite und Offline-Cache erfolgreich |
| `$env:BROWSER_CHANNEL='chromium'; node scripts/browser-test.mjs --webkit` | **148/148**, 94 Chromium und 54 WebKit; keine Seitenfehler |
| Bestehende adaptive Layout-Matrix | **480 aktive/pausierte Zustände**, beide Engines; weiterhin erfolgreich |
| Bestehende v0.7-Steuerungsmatrix | **288 Zustände**, drei Touch-Layouts und beide Tastengrößen |
| Visuelle Randmatrix | **216 Darstellungen**, DPR 1/2/3, Classic/Modern und Handy/Vollbild |
| Echte Clipping-Gegenproben | **24** absichtlich beschnittene Fälle weiterhin erkannt |
| Neue Toolbar-/Geometriematrix | **48 Ansichten**, sechs Viewports, beide Profile/Ansichten und Engines |

Der vollständige Browserlauf enthält alle bisherigen 126 und 22 neue gruppierte Szenarien; keine alten Prüfungen wurden abgeschaltet. Das zusätzliche `--v072-only` dient nur fokussierter Entwicklung. Der oben genannte Abschlussbefehl verwendet keine Filter. Separat wurde `--layout-only --webkit` mit **10/10** gruppierten Szenarien und 480 Zuständen ausgeführt. Die Rohdaten bestätigen auch im pausierten Zustand genau vier sichtbare Toolbar-Buttons in allen 480 mobilen Layoutzuständen.

Lokaler Produktionsbuild: `index-BnyJYZ-d.js`, `index-D5vwomHf.css`, Offline-Cache **f123246d31bd**, sieben aktuelle Assets. Sämtliche Laufzeitänderungen einschließlich DOM-/Tab-Reihenfolge und Schutz beim Ablauf von Time Attack waren vor diesem Build und dem vollständigen Browserlauf enthalten.

## Neue Regressionen und bestehender Funktionsumfang

- **320×568, 360×740, 390×844, 430×932, 844×390, 1366×768**: beide Profile/Ansichten. Mobile Toolbar exakt vier Buttons in einer 44 Pixel hohen Zeile, Texte passen, Ziele mindestens 44×44, Tab-Reihenfolge Pause → Menü → Ansicht → Mehr. Desktop behält die vollständige Toolbar. Kein Scroll-Überlauf im aktiven Vollbild; Classic/Modern-Handy-LCDs werden gegenüber der eingecheckten 0.7.1-Baseline nicht kleiner. Vollbild-LCD und tiefere Richtungstasten werden ausdrücklich gegen diese Baseline gemessen.
- Beide Engines prüfen Mehr in Classic/Modern und Handy/Vollbild: temporäre Pause, unveränderte Sitzungs-ID/Schlange/Punkte, erhaltene zwei akzeptierte Richtungen und Resttakt, ausgeschlossene Menüzeit in Time Attack. Profil und Sound funktionieren in beide Richtungen mit synchronen Zuständen. Touch, Maus, Tab/Pfeile/Home/End/Enter/Escape und Controller-B bedienen die Dialoge; ein zuvor pausiertes Spiel bleibt pausiert.
- Einstellungen/Touch-Layout sind tatsächlich über Mehr erreichbar. Neustart mit Abbruch erhält die Partie; Bestätigen startet genau eine neue. Hintergrundpause verhindert automatisches Fortsetzen. Keine neue Richtung durch Menübedienung und kein Seitenscrollen.
- Offline auf 320 Pixeln: installierter Service Worker, Netzwerk aus, Reload der gespeicherten Partie, Profil/Sound über Mehr bedienen, unveränderter Snapshot und anschließendes Fortsetzen derselben Runde.
- Unverändert aktiv: Classic, Zen, Time Attack 60/120/180, drei Challenges, Highscores/Statistik/Migration, Achievements, Controller-Verbindung/Deadzone/Neutralstellung/fehlende API, reale Web-Audio-Oszillatoren, Tastatur/Touch, Save/Restore, Browser-Neustart, Installierbarkeit, Unterverzeichnisbetrieb, wartendes PWA-Update und fehlende JS-/CSS-Assets.
- Randtests vergleichen die vollständige sichtbare Kontur mit einer gleich gerasterten unbeschnittenen Referenz. Unterste Reihe und alle vier Ecken werden sowohl im Quellraster als auch im Screenshot geprüft. Keine Lockerung von Farben oder Clipping-Erkennung. Safe Areas, Drehung/Rückdrehung, 568×320 und 740×360 bleiben abgedeckt.

Aktuelle Rohdaten: `test-results/browser-report.json` (`failed: null`, `pageErrors: []`), `test-results/v072-layout-report.json`, `test-results/v072-unit-tests.txt` und `test-results/installability.json` (keine Installierbarkeitsfehler). Vergleichsaufnahmen: je 48 Messungen aus 0.7.1 und 0.7.2 sowie **25 ausgewählte Bilder** unter `docs/screenshots/v072/`. Die alten 0.7.1-/0.7.0-Berichte unten bleiben historische Nachweise.

[Änderungen, Messwerte, Dateien und Vorher/Nachher](MOBILE_TOOLBAR_V072.md) · [Screenshots](SCREENSHOTS.md)

## Grenzen und Freigabe

Kein physisches iPhone, kein reales Safari mit Browserleistenanimationen, kein Display-Zoom oder Hardware-Pairing. WebKit-/Safe-Area-/Gamepad-Simulationen ersetzen keine auf iOS installierte PWA. Auf hohen Displays bleibt wegen des proportionalen LCDs freie Fläche unter den Tasten möglich; kurze Mehr-Dialoge dürfen intern scrollen. Keine bekannten offenen Fehler in den geprüften Szenarien. GitHub-Prüfungen folgen auf den Feature-Commit/Draft-PR; diese Ergebnisse beschreiben den lokalen Abschlusslauf. Kein automatischer Merge und kein Pages-Deployment.

---

# Historischer Teststand – Bytecoil 0.7.1

Basis: `main` **e77b00f**, neuer Branch **feature/v0.7.1-mobile-layout**. Windows, Node 24.19.0, pnpm 11.25.0, TypeScript 5.9.3, Vite 7.3.7, Playwright 1.64.1, Chromium 156.0.8078.4 und WebKit 27.2. Keine zusätzlichen Abhängigkeiten.

## Abschließende Ergebnisse (19. Oktober 2026)

| Prüfung | Ergebnis |
| --- | --- |
| `pnpm run test` | **72/72**, keine übersprungenen Tests |
| `pnpm run build` | TypeScript, Vite und Offline-Cache erfolgreich |
| `$env:BROWSER_CHANNEL='chromium'; node scripts/browser-test.mjs --webkit` | **126/126**, davon 83 Chromium und 43 WebKit; keine Seitenfehler |
| Neue Layout-Matrix | **480 Zustände** über beide Engines, aktiv und pausiert |
| Visuelle Randmatrix | **216 Darstellungen**, DPR 1/2/3; keine fehlenden Randkonturen |
| Clipping-Gegenproben | **24** absichtlich beschnittene Fälle weiterhin erkannt |

Der kombinierte Browserbefehl entspricht `pnpm run test:browser:webkit`: er führt sämtliche Chromium-Szenarien und anschließend die WebKit-Matrix aus. Alle bestehenden Prüfungen bleiben aktiv. `node scripts/browser-test.mjs --layout-only --webkit` wurde zusätzlich gezielt ausgeführt: **10/10** gruppierte Szenarien, 480 Zustände.

Produktionsartefakte: `index-BmbDM2SC.css`, `index-NQ8Tn5LY.js`; Offline-Cache **15c1c21ef878**, sieben aktuelle Assets. Der vollständige Lauf wurde nach den letzten Laufzeitänderungen erneut ausgeführt.

## Umfang und Fehlerbehebung

- **320×568, 360×740, 390×844, 430×932, 844×390**: Classic/Modern, Handy/Vollbild, Standard/Kompakt/Ergonomisch, Normal/Groß, aktiv/pausiert. Keine Seitenüberbreite, keine vertikalen Scrollbalken, alle Tasten/LCD/Handyunterkante sichtbar. Mindestens 44×44-Pixel-Touch-Ziele, große Handy-Tasten mindestens 48 Pixel hoch. Tasten überlappen weder einander noch das LCD.
- Abstände zwischen Aktionsleiste, LCD-Gruppe und Steuerung werden gemessen. Handy nutzt maximale Breite oder verfügbare Höhe. Das 320×244-Bitmap bleibt proportional, unterste Reihe und alle Ecken sind vollständig vorhanden.
- Safe Areas **24/20/12/12 Pixel**, Drehung und Rückdrehung, auch 568×320 und 740×360. Klassische Tastenanordnung bleibt erhalten. Die mobile Aktionsleiste muss ihre Texte vollständig enthalten; nach Drehung bleibt die untere Safe Area frei.
- Snapshots bleiben bei Layout-/Größenänderungen unverändert. Die bestehenden Tests decken alle vier Spielmodi, Rekorde/Statistik, Migration, Pause/Neustart, Achievements, Controller, Tastatur/Touch/Sound, Installierbarkeit und Offline-Fortsetzen ab. Desktop 1366×768 bleibt zusätzlich in der bisherigen Matrix enthalten.
- Gefundene Fehler wurden korrigiert: verzögerte Größenanpassung beim Ansichtswechsel; alte spezifischere Brand-/Großtasten-Abstände im Querformat; überlaufende Classic-Texte in der schmalen Seitenleiste. Die Rotationsprüfung lässt den Browser rendern, während das Spiel pausiert bleibt. Der bestehende PWA-Updatetest verwendet für Warten und Zustandsprüfung konsistent `getRegistration()`.
- Keine abgeschalteten Tests und keine gelockerten Farbgrenzen. Die vollständigen Randkonturen werden weiterhin mit einer unbeschnittenen Referenz verglichen; echte Clipping-Gegenproben sichern die Prüfung ab.

Aktuelle Rohdaten: `test-results/browser-report.json` (`failed: null`, `pageErrors: []`), zusätzlicher fokussierter Bericht `test-results/v071-layout-report.json`, Installierbarkeitsbericht `test-results/installability.json`. Die Browser-Suite erzeugt alle Diagnosebilder erneut; neun ausgewählte Bilder liegen unter `docs/screenshots/v071/`.

[Layoutbericht, betroffene Dateien und Vorher/Nachher](MOBILE_LAYOUT_V071.md) · [Screenshots](SCREENSHOTS.md)

## Grenzen

Chromium und Playwright-WebKit unter Windows mit simulierten Safe Areas ersetzen keinen realen iPhone-/Safari-/installierten-PWA-Test. Browserleistenanimationen und Display-Zoom wurden nicht auf Hardware geprüft. Auf hohen Hochformat-Geräten begrenzt die Breite das proportional skalierte LCD; Restfläche unter der kompakten Spielgruppe bleibt möglich. Keine bekannten offenen Fehler in den geprüften Szenarien. Kein automatischer Merge oder Pages-Deployment.

---

# Historischer Teststand – Bytecoil 0.7.0

Basis: aktualisiertes `main` auf `79c00f9`; Branch `feature/v0.7-achievements-controls`. Umgebung: Windows, Node 24.19.0, pnpm 11.25.0, Playwright 1.64.1, Playwright Chromium 156.0.8078.4 und WebKit 27.2. Keine neuen Abhängigkeiten.

## v0.7 – Befehle und Ergebnisse

| Befehl | Ergebnis |
| --- | --- |
| `pnpm install --frozen-lockfile` | Erfolgreich |
| `pnpm run test` | 72/72 bestanden: 59 bestehende plus 13 neue |
| `pnpm run build` | TypeScript, Vite und Offline-Cache erfolgreich |
| `BROWSER_CHANNEL=chromium pnpm run test:browser` | 78/78 Szenarien bestanden; keine Seitenfehler |
| `BROWSER_CHANNEL=chromium pnpm run test:browser:webkit` | 116/116 Szenarien bestanden; keine Seitenfehler |

PowerShell: vor den Browserbefehlen `$env:BROWSER_CHANNEL='chromium'` setzen. So wird derselbe Playwright-Browser wie im CI anstelle eines zufällig installierten Chrome verwendet. Der WebKit-Befehl führt die gesamte Chromium-Suite erneut aus und ergänzt die WebKit-Matrix; keine alten Tests werden ersetzt oder deaktiviert.

## Neue Unit-Tests

`tests/achievements-gamepad.test.ts`: zwölf eindeutige Definitionen und verschiedene gültige Pixel-Symbole; nachweisbare historische Freischaltungen; einmalige Vergabe und Neustart; unzureichende Historie; kein kompetitiver Classic-Erfolg aus Zen; Perfect Run nur mit beobachtetem Erfolg ohne Kollision; beschädigte/überlange Daten; alte Einstellungen und neue Defaults/Validierung/Roundtrip. Controller: nicht verfügbare/verweigerte API, Verbindung/Trennung, nicht standardisierte Belegung, D-Pad/A/B/Start, Halten/Loslassen, Deadzone und Hysterese, dominante Achse, deaktivierte Eingabe, Hintergrund/Neutralstellung und gemeinsamer Zweierpuffer mit Umkehr-/Duplikatschutz.

## Browserumfang

- Alle **40 regulären v0.6.1-Szenarien** bleiben bestehen: alle Spielmodi, Zeitvarianten/Challenges, Rekorde und Statistik, Keyboard/Touch/Sound, Snapshot-Migration und Offline-Restore, Browser-Neustart/Installierbarkeit, Safe Areas, PWA-Update und Asset-Reparatur.
- Alle ursprünglichen Randtests bleiben bestehen und laufen zusätzlich für Kompakt und Ergonomisch. Pro Engine drei Größen (320×568, 390×844, 430×932) × drei DPR × drei Touch-Layouts × zwei Profile × zwei Ansichten = **108 Randdarstellungen**. In Chromium plus WebKit: **216 Darstellungen**, jeweils Original- und unbeschnittene Referenzaufnahme. Vier echte Clipping-Gegenproben je Layout/Engine ergeben **24** absichtlich fehlerhafte Darstellungen, die erkannt werden müssen. Pixel-Prüfung umfasst unterste Reihe und alle vier Ecken; keine bloße pauschale RGB-Lockerung.
- Je Engine elf neue gruppierte Szenarien in `scripts/v07-test.mjs`: echter Futter-Schritt mit Freischaltung, weiterlaufende Bewegung während der Meldung, Detailansicht, Offline-Restore ohne erneute Vergabe; Classic-Achievement-Navigation bis Perfect Run auf 320px; historische Belege mit beschädigten Unlock-Daten und Meldungen aus; Controller-Simulation; fehlende/verweigerte/deaktivierte API; sechs Layoutgruppen; Einstellungen per Touch einschließlich Safe Area, ausgeblendetem Steuerkreuz und echter Pointer-Wischbewegung.
- Mobile-/Desktop-Matrix: **320×568, 360×740, 390×844, 430×932, 844×390, 1366×768**, jeweils drei Touch-Layouts × Normal/Groß × Classic/Modern × Handy/Vollbild = **144 Zustände je Engine**, insgesamt **288**. Jede verwendet eine validierte Randschlange. Bitmapmaße, alle vier Ecken/unterste Reihe im Quellraster, Seitenverhältnis, Canvas-Rand, Touch-Zielgrößen, unveränderter Snapshot und Scrollgrenzen werden geprüft. Kompakt/Ergonomisch müssen in Modern-Hochformat zusätzlich die Konsole direkt an die Steuerung rücken.
- Controller sind im Browser über `getGamepads()` injizierte Standardzustände; die App wird über ihren echten RAF-Polling-Loop bedient. Geprüft: Verbindung, D-Pad/Stick/Deadzone, einmalige Menüaktion bei gehaltenem Stick, A/B/Start, Dialogabbruch, gemischte Keyboard-/Pad-Eingabe ohne Queue-Duplikat, Pause und Trennung. Kein Hardware-Pairing-Test.

Rohberichte: `test-results/browser-chromium-report.json` und `test-results/browser-report.json`; letzterer enthält den kombinierten Lauf mit Layout- und Konturmessungen. PNGs und Referenzen liegen ebenfalls in `test-results/`. Kuratierte Bilder: [Screenshot-Übersicht](SCREENSHOTS.md).

## Einschränkungen

Keine physischen Controller, Bluetooth-/USB-Verbindungen, iPhone-/Safari-Installation, Home-Screen-PWA, OS-Tastatur-/Browserleistenwechsel, Hörprüfung, Hardware-Vibration oder Leistungs-/Akkumessung. WebKit unter Windows ersetzt kein iOS-Gerät. Die vollständigen alten funktionalen PWA-/Neustartprüfungen laufen in Chromium; WebKit erhält die komplette neue Funktions- und Randmatrix. Ein Linux-GitHub-Actions-Lauf ist erst nach Push/PR separat bewertbar. Keine Zusage für mehrere gleichzeitig schreibende Tabs oder vom OS gelöschte Browserdaten. [Controller-Grenzen](CONTROLLER.md), [Persistenzgrenzen](STORAGE.md).

---

## Historischer Teststand 0.6.1

Entwicklungsbranch `feature/v0.6-game-modes`, ausgehend von Bytecoil v0.5.2 Commit `059debfdb68502d668092df4c2c434be9333dd2d`. Prüfungen am 19. Oktober 2026 unter Windows, Node.js 24.19.0, pnpm 11.25.0, TypeScript 5.9.3, Vite 7.3.7 und Playwright 1.64.1 mit lokalem Chrome. Paketversionen sind durch die bestehende Lockdatei fixiert; keine neue Abhängigkeit.

## Ausgeführte Befehle

| Befehl | Ergebnis |
| --- | --- |
| `pnpm install --frozen-lockfile` | Erfolgreich im separaten Entwicklungscheckout |
| `pnpm run test` | 59/59 Unit-Tests bestanden |
| `pnpm run build` | TypeScript-Prüfung, Vite-Produktionsbuild und Offline-Cache erfolgreich |
| `pnpm run test:browser` | 49 Chrome-Szenarien (Teil des vollständigen Laufs) bestanden |
| `pnpm run test:browser:webkit` | 58/58: 49 Chrome- und 9 zusätzliche WebKit-Szenarien; keine unbehandelten Seitenfehler |

Prozesse wurden mit der für diese Windows-Sandbox erforderlichen lokalen Prozessfreigabe ausgeführt. Der Produktionsbuild benötigt keinen externen Dienst. JavaScript-Bundle etwa 35,3 KB beziehungsweise 12,9 KB gzip; kein Hardware-Performance-Benchmark.

## CI-Korrektur des Randtests

Der ursprüngliche grenznahe Einzelpixel-Test meldete in Playwright Chromium fälschlich Hintergrund trotz sichtbarer Schlange. Dieser Fall wurde lokal ohne Layoutmanipulation reproduziert. Die korrigierte Prüfung nutzt mehrere innere Punkte, eine gleich gerasterte unbeschnittene Referenz und den Vergleich der gesamten dunklen Segmentkontur. Eine entfernte physische Zeile/Spalte sowie echtes CSS-Clipping bleiben nachweisbar. Keine Änderung an Renderer, CSS oder Spielregeln. [Ursache, Messwerte und Reproduktionsbild](EDGE_TEST_FIX.md).

Zusätzliche drei Unit-Tests ergeben jetzt 59. Die vollständige Browser-Suite wurde erneut mit `BROWSER_CHANNEL=chromium` und `pnpm run test:browser:webkit` ausgeführt: 58 Szenarien, 72 reguläre Randdarstellungen, 72 Referenzbilder und acht erwartungsgemäß erkannte Clipping-Gegenproben. GitHub Actions lädt Diagnoseartefakte auch im Fehlerfall hoch. Der korrigierte Linux-CI-Lauf wurde noch nicht gestartet.

## Ergänzungen in 0.6.1

Weiterentwicklung ausschließlich in `bytecoil-v06` auf dem bestehenden Entwicklungsbranch. Ausführung mit `pnpm run test`, `pnpm run build` und `TEST_WEBKIT=true pnpm run test:browser` (PowerShell: `$env:TEST_WEBKIT='true'`); der neue Alias `pnpm run test:browser:webkit` aktiviert denselben Lauf ohne Umgebungsvariable. WebKit 27.2 / Playwright-Build 2370 wurde als lokale Testlaufzeit installiert. Keine neue Projektabhängigkeit.

- Zwei neue Unit-Tests prüfen die gemeinsame LCD-Geometrie, HTML-Bitmapmaße und die vollständige Zellgrafik an den Rändern; alle bisherigen 54 Tests erneut bestanden.
- Alle 39 bisherigen Browser-Szenarien erneut bestanden: Classic, Zen-Respawn, Time Attack 60/120/180, drei Challenges mit Erfolg und Fehlversuch/Retry, getrennte Rekorde und Statistik ohne Doppelzählung, alte und aktuelle Spielstände, Pause/Reload/Offline-Fortsetzen, Touch und virtuelle Tasten, PWA-Updates sowie fehlende Assets.
- Ein neuer Chrome-Test instrumentiert `OscillatorNode.start` der echten Web-Audio-Implementierung. Start erzeugt Oszillatoren; Mute verhindert weitere Starts, bleibt nach Reload erhalten, Einschalten erzeugt wieder Tonereignisse. Das ist eine Scheduling-Prüfung, keine Hörprobe.
- Neun gruppierte Randtests pro Engine: drei Viewports × drei DPR. Pro Gruppe beide Profile und beide Ansichten, insgesamt 72 Screenshots über Chrome und WebKit. Die Schlange liegt bewusst über die ganze unterste Reihe und in allen vier Ecken. Raster, CSS-Clipping und sichtbare Screenshot-Pixel werden geprüft. Details: [LCD-Analyse](LCD.md).
- Die bestehenden sechs Layoutprüfungen einschließlich Querformat/Desktop sowie Safe-Area- und Touch-Scrollprüfungen bestehen weiter. Das kurze Modern-Handy wurde für die Randreserve geringfügig verschmälert; Tasten bleiben mindestens 44 Pixel hoch.

Der Standardbefehl ohne WebKit-Option führt 49 Chrome-Szenarien aus. Die zusätzlichen neun WebKit-Szenarien sind bewusst optional, damit reine Chrome-Umgebungen keine zusätzliche Browserlaufzeit benötigen. Beide Varianten verwenden denselben Produktionsbuild.

## Unit-Tests

37 Tests aus dem tatsächlichen v0.5.2-Repository wurden erneut ausgeführt: Branding, Bewegung, Eingabepuffer, Kollisionen, Ränder, Futter/Bonus, Highscore, Pause, Neustart, Labyrinthe, alte Snapshot-Validierung, Einstellungen, Menünavigation und Feedback-Fallbacks. Die zyklische Menüprüfung wurde an die zusätzlichen Hauptmenüeinträge angepasst; ihre Funktion bleibt geprüft.

17 zusätzliche Tests in `tests/modes-records.test.ts`:

1. Classic-Sitzung und unveränderte v0.5.2-Engine liefern dieselben Schritte, Körper, Futter, Punkte und Kollisionen über mehrere Karten/Randmodi.
2. Zen überlebt wiederholte Rand-, Hindernis- und Körperkollisionen mit sicherem Respawn.
3. Zen erhält Punkte, Futterzähler, aktive Zeit und maximale Länge.
4. Alle drei Zeitbudgets enden exakt bei ihrem aktiven Limit.
5. Pause, wiederholtes Resume, rückwärts simulierte Uhrlesung und Framedrops.
6. Time-Attack-Snapshot erhält Millisekundenbruchteile und bleibt nach Restore pausiert.
7. Kollision beendet Time Attack vor dem Timeout.
8. Alle drei Challenge-Definitionen erzwingen sichere Karten und erreichen ihr Ziel.
9. Fehlversuch und sauberer Neustart derselben Challenge.
10. Ungültige Modus-Snapshots, Zeitwerte, IDs und widersprüchliche Challenge-Regeln werden abgelehnt.
11. v0.5.2-Classic-Snapshot migriert mit stabiler ID und unverändertem Spielfeld.
12. Wiederholte Restore-/Checkpoint-Läufe und zurückliegende Snapshots zählen Fortschritt nicht doppelt.
13. Finale Checkpoints verhindern erneute Abschlusszählung.
14. Classic und jede Time-Attack-Dauer besitzen unabhängige Rekorde; Zen überschreibt Classic nicht.
15. Separate Challenge-Abschlüsse bleiben dauerhaft gespeichert und zählen eindeutige Ziele.
16. Beschädigte Statistiken und alte Einstellungen werden sicher behandelt, alter Rekord bleibt erhalten.
17. Modusnavigation und Challenge-Regelbindung sind vom Darstellungsprofil unabhängig.

## Browser-Tests

Die 29 bestehenden Szenarien aus v0.5.2 wurden vollständig erneut ausgeführt. Dazu gehören Boot, Desktop-/Mobile-Eingaben, Pause, Snapshot, Neustart-Bestätigung, Themen/Feedback, alle sechs Viewports, Safe Areas, Manifest/Icons/Assets unter `/Snake/`, PWA-Update-Lebenszyklus, reguläres Chrome-Profil mit vollständigem Prozessneustart und Offline-Fortsetzen sowie Reparatur bei fehlendem CSS/JavaScript. Erwartete Menütitel wurden auf Classic Snake umgestellt; Version-1-Fixtures werden nun mit dem erhaltenen Spielfeld der Version-2-Migration verglichen.

Zehn neue Szenarien:

- Tastaturauswahl aller vier sichtbaren Modi; Zen-Kollision, Respawn, dauerhafte Statistik und wiederholtes Neuladen ohne neue Partiezählung.
- Time Attack 60, 120 und 180: jeweils exakte aktive Zeit nach Pause, lange Pause ohne Countdown, gespeicherter Restwert, Offline-Neuladen, Timeout und korrekter separater Rekord (drei Szenarien).
- Food Hunter, Survivor und Maze Master: jeweils feste Regeln, Fortschritt, Erfolgsbildschirm und persistenter Abschluss nach Neuladen (drei Szenarien). Hier werden valide vorbereitete Spielstände kurz vor dem Ziel verwendet; der abschließende Bewegungsschritt wird tatsächlich im Browser ausgeführt.
- 320×568-Touch: Modusauswahl, Challenge-Zielbeschreibung, echter Fehlversuch durch Randkollision und unmittelbarer Neustart; weiterhin kein Scrollbedarf im aktiven Modern-Spiel. Statistikansicht per Touch erreichbar.
- Version-1-Migration aus v0.5.2 mit erhaltenem Classic-Rekord, gleichem Spielfeld und unveränderten Gesamtpunkten nach vier weiteren Reloads.
- Virtuelle Handytasten wählen Time Attack, öffnen dessen Zeitlimit, wählen 60 Sekunden und starten den richtigen Modus. Classic-Profil und Handyansicht bleiben unverändert.

Die Zeitprüfungen verwenden eine explizit pausierte Browseruhr. Sie simulieren kontrollierte aktive Zeit und echte Pause/Resume-/Ladeereignisse; sie sind keine Behauptung über jeden physischen OS-Suspend-Fall.

## Ansichten und Artefakte

Erneut geprüft: 320×568, 360×740, 390×844, 430×932, 844×390, 1366×768 sowie weitere Desktopansichten. In der Modern-Vollbildansicht sind Spielfeld und vier Richtungstasten ohne horizontalen oder vertikalen Scrollbedarf sichtbar. Die Handyansicht bleibt im niedrigen Querformat bewusst scrollbar. Neue Modus-/Statistikbilder wurden visuell inspiziert und unter `docs/screenshots/` abgelegt: [Screenshot-Übersicht](SCREENSHOTS.md).

Rohdaten: `test-results/browser-report.json` mit `failed: null`, `pageErrors: []` und Layoutmessungen. `test-results/installability.json` enthält keine Installierbarkeitsfehler im regulären Profil. Temporäre Browserprofile werden nur im eigenen Ausgabeordner angelegt und anschließend entfernt. Bestehende Benutzerprofile wurden nicht verwendet.

## Grenzen und Release

Keine physischen Android-/iOS-Geräte, kein tatsächliches Safari auf iPhone oder installierte iOS-PWA, kein Firefox, keine Hardware-Vibration, Hörprüfung oder Akkulastmessung. Die neue WebKit-Matrix unter Windows prüft die Safari-verwandte Engine, ersetzt aber keinen iOS-Gerätetest. Keine öffentliche HTTPS-Änderung, kein GitHub-Runner-Lauf für diesen Branch und kein Merge/Deployment. Statistik konkurrierender Tabs besitzt keinen Schreib-Lock; bei gesperrtem/vollem Speicher und hartem Prozessabbruch gelten die dokumentierten Persistenzgrenzen. Keine bekannten offenen Fehler in den geprüften Szenarien. Vor Freigabe empfiehlt sich ein echter Geräte-/Browser-Smoketest und ein Review der Migration unter der endgültigen Website-Adresse.
