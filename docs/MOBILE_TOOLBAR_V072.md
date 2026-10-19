# Bytecoil 0.7.2 – Vollbild und adaptive Toolbar

Basis: `main` auf **3a44d40** (0.7.1), Branch **feature/v0.7.2-mobile-toolbar**. Bestehendes Projekt `bytecoil-v06`, keine Neuentwicklung und keine neuen Abhängigkeiten.

## Layout und Entscheidungen

Auf Smartphones zeigen Classic und Modern in Handy- und Vollbildansicht dieselben vier Aktionen in einer Zeile: **Pause/Weiter, Menü, Handy/Vollbild, Mehr**. Die mobile Regel gilt bis 600 Pixel Breite sowie bis 960 Pixel Breite bei höchstens 500 Pixel Höhe. Desktop behält die vollständige Toolbar. Die tatsächliche DOM-Reihenfolge entspricht der sichtbaren mobilen Reihenfolge, einschließlich Tab-Navigation. Kurze Beschriftungen, flexible Spalten und mindestens 44×44 CSS-Pixel große Ziele verhindern einen Zeilenumbruch.

Im Vollbild reduzieren schmalere Gehäuse-/LCD-Außenflächen den seitlichen Platzverbrauch. Die Bitmap bleibt **320×244**, das Spielfeld **26×17**; die vier logischen Reservepixel aus 0.6.1, Canvas-Rahmen und `image-rendering: pixelated` bleiben unverändert. Die Bildgröße wird proportional berechnet. Fractionale CSS-Skalierung wird weiterhin vom Browser auf Geräte-Pixel gerastert; die strengen Screenshot-Randprüfungen decken DPR 1/2/3 ab.

Die Richtungstasten nutzen einen per `dvh` begrenzten Abstand unter dem LCD. Kompakt erhält einen kleineren Abstand, Ergonomisch größere Ziele und mehr Abstand. Classic berücksichtigt zusätzlich die frei gewordene zweite Toolbar-Zeile, damit die Tasten gegenüber 0.7.1 tatsächlich tiefer stehen. Der vorhandene Größenfitter zieht diesen Abstand von seinem Höhenbudget ab. Er berücksichtigt weiterhin gemessene Toolbar-/Tastenhöhen, Safe Areas, ResizeObserver und VisualViewport; kein zweiter Layout-Loop wurde eingeführt. Im Querformat bleiben LCD und Richtungstasten nebeneinander, die Tasten stehen vertikal mittig.

Die Handyansicht behält alle 15 Tasten in drei Spalten und fünf Reihen. Bei sehr niedrigen Querformaten (z. B. 568×320) nutzt die einzelne Toolbar-Zeile den Platz oberhalb des LCDs neben der Tastatur. Die bisherige 120-Pixel-Seitenleiste entfällt. Auf kurzen Desktop-Fenstern verwendet Classic-Vollbild dieselbe vorhandene Anordnung mit seitlicher Steuerung wie Modern, damit 1366×768 ohne Seitenscrollen funktioniert.

## Mehr-Menü und Spielzustand

- **Neues Spiel/Neustart, Profil Classic/Modern, Ton und Einstellungen/Komfort** verwenden dieselben Handler wie die bisherigen direkten Buttons. Profil und Ton lassen sich in beide Richtungen umschalten, bleiben im Dialog sichtbar und zeigen synchronisierte Zustände. Verborgene Desktop-Buttons sind nicht fokussierbar; es gibt keine widersprüchlichen sichtbaren Duplikate.
- Das native Dialogfenster bietet Touch/Maus, Tab/Shift+Tab, Pfeile, Home/End, Enter/Space und Escape. Die bestehende Controller-Dialogbedienung bleibt erhalten. Bei geringer Höhe scrollt nur der Dialoginhalt.
- Öffnen während des Spiels hält die aktive Spielzeit an. Eine nur im Arbeitsspeicher gehaltene Sitzung bewahrt den bereits akzeptierten Richtungspuffer und die Restzeit bis zum nächsten Schritt. Schließen setzt eine zuvor laufende Partie fort; eine vorher pausierte bleibt pausiert. Es gibt weder Nachholschritte noch zusätzliche Richtungen.
- Browser-/Fokuswechsel widerruft das automatische Fortsetzen, wie bei der bisherigen Hintergrundpause. Nach Rückkehr wird bewusst manuell fortgesetzt. Neuladen stellt weiterhin eine pausierte gespeicherte Partie her.
- Ausdrückliche Navigation zu Einstellungen bleibt pausiert. Neustart benutzt die bestehende Bestätigung; Abbrechen erhält die Partie. Diese Aktionen schließen die vorübergehende Mehr-Sitzung vorher ab, damit kein verspätetes `close`-Ereignis eine neue Partie oder ein Menü fortsetzt.

Engine, Spielmodi, Canvas-Geometrie, Rekorde, Statistiken, Speicherformate und Schlüssel, Achievements und Controller-Modul wurden nicht verändert. Mehr ist eine UI-Sitzung und benötigt keine neuen gespeicherten Einstellungen. Offline-Cache und Updateverfahren bleiben bestehen.

## Messwerte

Reproduzierbare Chromium-Messungen mit identischem Standard-Touch-Layout und normalen Tasten, aktive Partie. LCD-Breite ist das Canvas-Außenmaß in CSS-Pixeln. D-Pad-Y ist die Oberkante der gesamten Richtungsgruppe. Beide Profile haben dieselbe neue LCD-Breite.

| Viewport | LCD vorher → nachher | Modern D-Pad-Y vorher → nachher | Classic D-Pad-Y vorher → nachher |
| --- | --- | --- | --- |
| 320×568 | 288 → **302** | 320,94 → **337,61** | 368,94 → **377,61** |
| 360×740 | 328 → **342** | 354,88 → **383,55** | 402,88 → **423,55** |
| 390×844 | 358 → **372** | 378,97 → **418,03** | 426,97 → **458,03** |
| 430×932 | 398 → **412** | 409,47 → **457,33** | 457,47 → **497,33** |
| 844×390 | 380,31 → **388,19** | 52 → **165,50** | 52 → **165,50** |

390×844: **3,91 % mehr LCD-Breite bzw. rund 8 % mehr Fläche**, Richtungstasten in Modern **39,06 Pixel**, in Classic **31,06 Pixel** tiefer. Classic-Toolbar im Hochformat **92 → 44 Pixel**; Modern bleibt 44 Pixel. Kein Scroll-Überlauf in diesen aktiven Vollbild-Aufnahmen. Die Handy-LCDs werden nicht kleiner; auf 320×568 wächst Classic von **193,20 auf 256,16 CSS-Pixel Breite**, während Modern dort 256,16 behält. Die vollständige Tastatur bleibt erhalten. Das Seitenverhältnis begrenzt auf hohen Smartphones weiterhin die nutzbare LCD-Größe durch die Breite.

Rohdaten: [0.7.1](screenshots/v072/before-metrics.json), [0.7.2](screenshots/v072/after-metrics.json), jeweils 48 Zustände über sechs Viewports, zwei Profile, zwei Ansichten, aktiv/pausiert. Messungen vergleichen vollständige Produktionsbuilds, keine manuell nachgestellten CSS-Mockups.

## Vorher/Nachher

390×844, dieselbe validierte zusammenhängende Schlange in der gesamten untersten Reihe und allen vier Ecken. Die Bewegung ist für die Aufnahme eingefroren; aktiv zeigt die echte Spieloberfläche, pausiert deren bestehenden Pause-Dialog. Keine Benutzerdaten.

| Zustand | 0.7.1 | 0.7.2 |
| --- | --- | --- |
| Modern Vollbild, aktiv / Toolbar | [Vorher](screenshots/v072/before-modern-full-390x844-active.png) | [Nachher](screenshots/v072/after-modern-full-390x844-active.png) |
| Modern Vollbild, pausiert | [Vorher](screenshots/v072/before-modern-full-390x844-paused.png) | [Nachher](screenshots/v072/after-modern-full-390x844-paused.png) |
| Modern Handy, aktiv / Toolbar | [Vorher](screenshots/v072/before-modern-handheld-390x844-active.png) | [Nachher](screenshots/v072/after-modern-handheld-390x844-active.png) |
| Modern Handy, pausiert | [Vorher](screenshots/v072/before-modern-handheld-390x844-paused.png) | [Nachher](screenshots/v072/after-modern-handheld-390x844-paused.png) |
| Classic Vollbild, aktiv / Toolbar | [Vorher](screenshots/v072/before-classic-full-390x844-active.png) | [Nachher](screenshots/v072/after-classic-full-390x844-active.png) |
| Classic Vollbild, pausiert | [Vorher](screenshots/v072/before-classic-full-390x844-paused.png) | [Nachher](screenshots/v072/after-classic-full-390x844-paused.png) |
| Classic Handy, aktiv / Toolbar | [Vorher](screenshots/v072/before-classic-handheld-390x844-active.png) | [Nachher](screenshots/v072/after-classic-handheld-390x844-active.png) |
| Classic Handy, pausiert | [Vorher](screenshots/v072/before-classic-handheld-390x844-paused.png) | [Nachher](screenshots/v072/after-classic-handheld-390x844-paused.png) |
| Classic Vollbild, 320×568 aktiv | [Vorher](screenshots/v072/before-classic-full-320x568-active.png) | [Nachher](screenshots/v072/after-classic-full-320x568-active.png) |
| Modern Vollbild, 844×390 aktiv | [Vorher](screenshots/v072/before-modern-full-844x390-active.png) | [Nachher](screenshots/v072/after-modern-full-844x390-active.png) |
| Mehr-Menü, Modern Vollbild | [Vorher](screenshots/v072/before-more-full.png) | [Nachher](screenshots/v072/after-more-full.png) |
| Mehr-Menü, Modern Handy | [Vorher](screenshots/v072/before-more-handheld.png) | [Nachher](screenshots/v072/after-more-handheld.png) |

Mehr-Menü: [Vollbild](screenshots/v072/after-more-full.png) · [Handyansicht](screenshots/v072/after-more-handheld.png).

Zusätzlich: [WebKit Classic-Handy bei 568×320 mit großen Tasten und simulierten Safe Areas](screenshots/v072/after-classic-handheld-568x320-safe.png). Die vier Toolbar-Buttons teilen sich eine Zeile über dem LCD; alle 15 Handy-Tasten bleiben vollständig sichtbar.

Die Bilder und Rohdaten lassen sich mit `node scripts/capture-v072.mjs` nach `pnpm run build` erneut erzeugen (`test-results/v072-after/`). Für echte Vorher-Bilder **den 0.7.1-Build** in `dist/` bereitstellen und erst dann `node scripts/capture-v072.mjs --before` ausführen. Die Option benennt Ausgaben; sie stellt keinen alten Build her. Die eingecheckte Baseline stammt vom unveränderten `main` vor der Implementierung.

## Betroffene Dateien und Prüfung

- `src/style.css`: Toolbar, Rahmen, Tastenabstand, Dialog und kurze Quer-/Desktopformate.
- `src/mobile-layout.ts`: Abstand im vorhandenen Höhenbudget und Position der Toolbar im sehr niedrigen Handy-Querformat.
- `src/main.ts`: gemeinsame Aktionen, synchrone Zustände und sichere temporäre Mehr-Sitzung.
- `index.html`, `package.json`: zugängliche Dialog-/Toolbar-Struktur und Version 0.7.2.
- `scripts/v072-test.mjs`, `toolbar-action.mjs`, `capture-v072.mjs`: neue UI-Regressionen, echte Bedienung verborgener Aktionen über Mehr und Vergleichsaufnahmen.
- Bestehende Browser-/Layouttests bleiben aktiv. Frühere unmittelbare Button-Klicks bedienen mobil jetzt das tatsächliche Mehr-Menü; alte feste Abstandsannahmen berücksichtigen den ausdrücklich gewünschten neuen Tastenabstand. Keine Bildfarbgrenzen wurden gelockert.
- README, Changelog, Test-, Screenshot-, Controller- und PWA-Dokumentation wurden ergänzt.

Ausgeführte Befehle, Ergebnisse und vollständiger Umfang: [Testbericht](TESTS.md).

## Grenzen und Veröffentlichung

Playwright Chromium und WebKit unter Windows simulieren Viewports, DPR und Safe Areas. Ein echtes iPhone, Safari-Browserleistenanimationen, Display-Zoom und eine auf Hardware installierte PWA wurden nicht geprüft. Controller-Tests verwenden die vorhandene standardisierte API-Simulation, kein physisches Pairing. Bei sehr geringer Höhe kann Mehr intern scrollen; die aktive Spielseite bleibt in den geprüften Vollbildgrößen ohne Scrollen. Hohe Displays behalten wegen des unveränderten LCD-Seitenverhältnisses freie Fläche unter den Tasten.

Freigabeweg für Version 0.7.2: eigener Commit und Draft-PR nach `main`. Kein automatischer Merge, keine öffentliche Release-Erstellung und kein GitHub-Pages-Deployment. Push-/PR-Workflows prüfen ausschließlich; die bestehende manuelle Veröffentlichungsfreigabe bleibt unverändert.
