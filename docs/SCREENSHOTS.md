# Screenshots – Bytecoil 0.6.1

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
