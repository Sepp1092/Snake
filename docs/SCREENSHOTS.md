# Screenshots – Bytecoil 0.7.1

## 0.7.1 – Mobile Layout

[Alle acht Vorher-/Nachher-Bilder sowie Messwerte und Beschreibung](MOBILE_LAYOUT_V071.md#vorhernachher). Smartphone-Vollbild und Handy, jeweils aktiv und pausiert, mit Schlange am unteren Rand und in allen vier Ecken.

## Historische Screenshots 0.7.0

## 0.7 – Achievements und mobile Steuerung

Produktionsbuild 0.7.0, künstliche lokale Testsitzungen, keine echten Benutzerdaten. Die Achievement-Aufnahme zeigt eine echte Freischaltung nach einem Futter-Schritt und ihre nicht blockierende Meldung. Die Steuerungsbilder verwenden eine validierte Randschlange, damit unterste Reihe und Ecken erkennbar sind; pausiert, um den Zustand reproduzierbar zu halten.

| Ansicht | Chromium | WebKit |
| --- | --- | --- |
| Achievements | [390 × 844](screenshots/v07-chrome-achievements.png) | [390 × 844](screenshots/v07-webkit-achievements.png) |
| Standard, normale Tasten | [390 × 844](screenshots/v07-chrome-standard-390x844.png) | [390 × 844](screenshots/v07-webkit-standard-390x844.png) |
| Kompakt, normale Tasten | [390 × 844](screenshots/v07-chrome-compact-390x844.png) | [390 × 844](screenshots/v07-webkit-compact-390x844.png) |
| Ergonomisch, normale Tasten | [390 × 844](screenshots/v07-chrome-ergonomic-390x844.png) | [390 × 844](screenshots/v07-webkit-ergonomic-390x844.png) |
| Ergonomisch, große Tasten | [320 × 568](screenshots/v07-chrome-ergonomic-320x568.png) | [320 × 568](screenshots/v07-webkit-ergonomic-320x568.png) |

Die mobilen Touch-Ziele und Scrollgrenzen werden automatisiert gemessen. WebKit ist eine Windows-Engine-Prüfung und keine Fotografie eines iPhones. [Testumfang und Hardwaregrenzen](TESTS.md). Die älteren Bilder unten bleiben als Versionshistorie erhalten.


## 0.6.1: Schlange am unteren Rand und in allen vier Ecken

Frisch erzeugte DPR-3-Aufnahmen des Produktionsbuilds mit bewusst vorbereiteter zusammenhängender Randschlange. Pausiert, damit die unterste Reihe unverändert bleibt; der Dialog verdeckt keine Randzelle. In beiden Engines wurden Bitmap, CSS-Grenzen und sichtbare Screenshot-Pixel automatisiert geprüft. Ausgewählte Chrome-/WebKit-Aufnahmen wurden zusätzlich visuell kontrolliert.

| Viewport | Chrome, Modern-Vollbild | WebKit, Modern-Vollbild |
| --- | --- | --- |
| 320 × 568 | [chrome](screenshots/v061-chrome-bottom-320x568-dpr3-modern-full.png) | [webkit](screenshots/v061-webkit-bottom-320x568-dpr3-modern-full.png) |
| 390 × 844 | [chrome](screenshots/v061-chrome-bottom-390x844-dpr3-modern-full.png) | [webkit](screenshots/v061-webkit-bottom-390x844-dpr3-modern-full.png) |
| 430 × 932 | [chrome](screenshots/v061-chrome-bottom-430x932-dpr3-modern-full.png) | [webkit](screenshots/v061-webkit-bottom-430x932-dpr3-modern-full.png) |

Zusätzlich die kleine Handyansicht: [Chrome 320 × 568](screenshots/v061-chrome-bottom-320x568-dpr3-modern-handheld.png), [WebKit 320 × 568](screenshots/v061-webkit-bottom-320x568-dpr3-modern-handheld.png).

Alle **72** Aufnahmen (einschließlich DPR 1/2 und Classic-Profil) werden reproduzierbar unter `test-results/v061-*-bottom-*.png` erzeugt. [Analyse und Testanleitung](LCD.md). Die älteren v0.6-Bilder unten dokumentieren weiterhin die Spielmodi; sie zeigen die Darstellung vor der Randreserve.


Frisch erzeugte Screenshots des Bytecoil-v0.6-Produktionsbuilds, ausschließlich mit dem eigenständigen Branding. Die Bilder stammen aus dem erfolgreichen Playwright-Lauf; vorbereitete Zielzustände werden in der Testdokumentation genannt.

## Spielmodus-Auswahl

- [Classic-Handheld am Desktop](screenshots/v06-modes-desktop.png)
- [Modern auf 320×568](screenshots/v06-modes-mobile.png) – die Liste ist bei dieser kleinen Größe scrollbar; alle Einträge sind auch mit den Richtungstasten erreichbar.

## Statistik

- [Gesamtstatistik im Handheld](screenshots/v06-statistics-classic.png)
- [Statistik im mobilen Modern-Profil](screenshots/v06-statistics-mobile.png)

Die erste Statistikzeile schaltet zwischen Gesamt und den vier Modi. Weitere Werte sind durch Menünavigation beziehungsweise Scrollen erreichbar; sie benötigen keine zusätzliche permanente Spielfläche.

## Spielanzeigen

- [Zen mit laufender Sitzung](screenshots/v06-zen-desktop.png)
- [Time Attack 60 Sekunden, gespeicherte Restzeit](screenshots/v06-time-60-mobile.png)
- [Time Attack 120 Sekunden, gespeicherte Restzeit](screenshots/v06-time-120-mobile.png)
- [Time Attack 180 Sekunden, gespeicherte Restzeit](screenshots/v06-time-180-mobile.png)
- [Challenge-Zielbeschreibung am Smartphone](screenshots/v06-challenge-goal-mobile.png)
- [Food Hunter geschafft](screenshots/v06-challenge-hunter-success.png)
- [Survivor geschafft](screenshots/v06-challenge-survivor-success.png)
- [Maze Master geschafft](screenshots/v06-challenge-maze-success.png)

Time-Attack-Bilder zeigen absichtlich einen pausiert wiederhergestellten Spielstand kurz vor Ablauf. Die Erfolgsbilder basieren auf vorbereiteten Zwischenständen mit tatsächlich ausgeführtem letztem Zielschritt. Vollständige Viewport-Messungen und weitere Bilder liegen im regenerierbaren Ordner `test-results/`.


## Reproduktion des CI-Einzelpixel-Fehlalarms

[Playwright Chromium, 320 × 568, DPR 1, Classic-Handy](screenshots/v061-ci-probe-reproduction.png): vollständige Randschlange, während der alte Einzelpunkt an mehreren seitlichen Segmenten Hintergrund meldet. Lokal reproduziert; der ursprüngliche GitHub-Lauf hat kein Screenshot-Artefakt gespeichert. [Koordinaten und Ursachenanalyse](EDGE_TEST_FIX.md).
