# Mobile Layout – Bytecoil 0.7.1

Lokale Weiterentwicklung von **0.7.0 / `101a4f5`** im vorhandenen Checkout `bytecoil-v06`. Neuer Branch **`feature/v0.7.1-mobile-layout`**, direkt vom aktuellen `main` **`e77b00f`** (Merge von v0.7.0). Nach erfolgreichen Tests: eigener Commit und Draft-PR nach `main`, wie beauftragt. Kein automatischer Merge und kein Pages-Deployment.

## Umsetzung

Die alten Modern-Regeln zentrierten das Vollbild-LCD in einer verbleibenden hohen Grid-Zeile, während das Steuerkreuz am unteren Bildschirmrand blieb. Die Handyansicht verwendete feste Breiten, besonders 272/244 Pixel bei kurzen Bildschirmen. Classic hatte keine vollständige mobile Höhenanpassung.

`src/mobile-layout.ts` berechnet jetzt ein Höhenbudget aus dem tatsächlichen `100dvh`-Bereich, Safe-Area-Padding, gemessener Menüleistenhöhe, sichtbarer Steuerung und Abständen. Die verbleibende Höhe wird mit dem unveränderten LCD-Seitenverhältnis in eine maximale Gehäusebreite umgerechnet. Gemessene Gehäuse-/Tastenhöhen berücksichtigen Classic/Modern, Normal/Groß sowie Menüs und Spiel. CSS übernimmt Positionierung, Safe Areas, Abstände und Hoch-/Querformat. Die kleine JavaScript-Ergänzung misst ausschließlich variierende Größen wie die tatsächlich umgebrochene Classic-Aktionsleiste und die unterschiedlichen Tastenhöhen; sie läuft bei Layout-/Viewport-Änderungen, nicht in der Spielschleife. Keine pauschale CSS-Transformation, kein verändertes Canvas-Bitmap.

- Vollbild: Menüleiste, LCD und Steuerkreuz folgen direkt aufeinander, mit 4–8 Pixeln Abstand zwischen den Gruppen. Schmalere Displayrahmen geben dem Spielfeld mehr Breite. Im Querformat sitzt die Steuerung daneben.
- Handy: schmalere Gehäuseränder und Displayeinfassung; die volle verfügbare Breite wird genutzt, solange alle fünf Tastenreihen in die Höhe passen. Auf kurzen Geräten entfallen Lautsprecher und Modellaufdruck zugunsten des LCD. Die Marke und alle 15 Tasten bleiben erhalten.
- Handy im Querformat: Tastatur neben dem LCD, weiterhin im ursprünglichen Raster von drei Spalten und fünf Reihen. Bei höchstens 380 Pixeln Höhe wechselt die Aktionsleiste in eine seitliche Leiste, damit auch nach Drehung von 320×568 und mit Safe Areas alle großen Tasten sichtbar bleiben.
- Touch-Ziele bleiben mindestens 44 Pixel hoch/breit, große Handy-Tasten mindestens 48 Pixel hoch. Die vier Classic-Tastaturreihen plus Navigation bleiben bedienbar. Classic behält seine Aktionsschaltflächen.
- `ResizeObserver`, Änderungen der Layout-Einstellungen/Ansicht und Fenster-/VisualViewport-Größenwechsel lösen eine Neuberechnung aus. Keine Storage-Schreibvorgänge oder Eingaben durch die Berechnung.

## Unveränderte Teile

Engine, Spielmodi, Renderer, LCD-Geometrie, Highscores, Statistik, Snapshots, Achievements und Gamepad-Logik bleiben unverändert. Keine neuen Abhängigkeiten, keine neuen Speicherschlüssel. Die logische LCD-Fläche bleibt **320×244**, mit **26×17 Zellen à 12 Pixel**, **32 Pixel Status** und **4 Pixel Randreserve**. Der CSS-Rahmen liegt weiterhin außerhalb der proportional skalierten Canvas-Innenfläche; `pixelated` und ausgeschaltete Glättung bleiben erhalten.

## Betroffene Dateien

- Darstellung: `src/style.css`, neues `src/mobile-layout.ts`, Initialisierung in `src/main.ts`.
- Version: `package.json`, `index.html`.
- Browserprüfung: neues `scripts/v071-test.mjs`, Einbindung und konsistente PWA-Registrierungsprüfung in `scripts/browser-test.mjs`.
- Dokumentation: `README.md`, `docs/CHANGELOG.md`, `docs/TESTS.md`, `docs/SCREENSHOTS.md`, dieser Bericht und acht Vergleichsbilder, ein kurzes Querformat-Beispiel und zwei Messdateien unter `docs/screenshots/v071/`.

## Reproduktion und Tests

```powershell
pnpm run test
pnpm run build
$env:BROWSER_CHANNEL='chromium'
pnpm run test:browser
pnpm run test:browser:webkit
```

Für die gezielte Entwicklung der neuen Matrix zusätzlich: `node scripts/browser-test.mjs --layout-only --webkit`. Die regulären Befehle führen alle bisherigen Szenarien und die neuen Tests aus.

`scripts/v071-test.mjs` prüft 320×568, 360×740, 390×844, 430×932 und 844×390, beide Profile und Ansichten, drei Touch-Layouts, zwei Tastengrößen und aktive/pausierte Zustände. Dazu kommen Safe Areas (24/20/12/12 Pixel), Rotation hin und zurück, unveränderte Snapshots, keine Überlappung der Tasten, vollständiges LCD, Maximalnutzung von Breite oder Höhe in der Handyansicht sowie kleine Abstände im Vollbild. Für Rotation läuft die Browser-Uhr wieder, während das Spiel pausiert bleibt: eingefrorene Rendering-Zeit würde native Resize-Ereignisse verzögern.

Die neue Rotation-/Safe-Area-Prüfung deckte außerdem einen realen sechs Pixel großen Überstand in Modern/Handy/Querformat auf: eine ältere, spezifischere Brand-Regel behielt ihren unteren Abstand. Die endgültige Querformat-Regel setzt diesen Abstand ausdrücklich zurück. Auch die ältere Großtasten-Regel brachte im Modern-Querformat noch fünf Pixel oberen Tastenabstand mit und verursachte im engsten Safe-Area-Fall einen Pixel Überstand. Beide Alt-Abstände sind jetzt ausdrücklich zurückgesetzt. Die Prüfgrenzen wurden dafür nicht gelockert. Eine zusätzliche Sichtprüfung zeigte überlaufende Classic-Beschriftungen in der schmalen Querformat-Aktionsleiste. Die Leiste ist deshalb 120 Pixel breit; der Ansichtswechsel heißt mobil in beiden Profilen kurz „Handy“/„Vollbild“. Tests prüfen die tatsächliche Textbreite und den unteren Safe-Area-Abstand nach beiden Drehungen.

Die bestehende vollständige Screenshot-Randprüfung bleibt zusätzlich aktiv: unterste Reihe und alle vier Ecken, DPR 1/2/3, beide Profile/Ansichten, drei Touch-Layouts, Chromium und WebKit, inklusive absichtlich beschnittener Gegenproben. Ergebnisse siehe [Testbericht](TESTS.md).

Im bestehenden PWA-Updatetest wurde außerdem die Registrierung konsistent über `getRegistration()` gelesen. Damit verwendet die Zustandsprüfung dieselbe Registrierungsreferenz wie die direkt vorherige Warteschleife; im ersten Durchlauf hatte die abweichende `ready`-Referenz einen leeren `waiting`-Wert geliefert. Die Prüfung auf einen installierten wartenden Worker bleibt unverändert streng.

## Vorher/Nachher

Die Vorher-Bilder stammen aus dem unveränderten lokalen 0.7.0-Produktionsbuild, mit isolierten Browserdaten und derselben validierten Randschlange. Nachher-Bilder werden aus 0.7.1 aufgenommen. Alle Bilder zeigen 390×844, Modern/Standard/Normal. Die Schlange liegt bewusst in der untersten Reihe und allen vier Ecken. Aktive Aufnahmen entstehen nach Fortsetzen, vor dem nächsten Bewegungsschritt; die pausierten Aufnahmen zeigen denselben Spielstand mit Pausehinweis.

| Ansicht/Zustand | 0.7.0 | 0.7.1 |
| --- | --- | --- |
| Vollbild aktiv | [Vorher](screenshots/v071/before-full-active.png) | [Nachher](screenshots/v071/after-full-active.png) |
| Vollbild pausiert | [Vorher](screenshots/v071/before-full-paused.png) | [Nachher](screenshots/v071/after-full-paused.png) |
| Handy aktiv | [Vorher](screenshots/v071/before-handheld-active.png) | [Nachher](screenshots/v071/after-handheld-active.png) |
| Handy pausiert | [Vorher](screenshots/v071/before-handheld-paused.png) | [Nachher](screenshots/v071/after-handheld-paused.png) |

Bei 390×844 wächst das Vollbild-LCD von 350 auf **358 CSS-Pixel Breite**, das Handy-LCD von 300 auf **330 CSS-Pixel** (+10 % Breite / +21 % Fläche). Im Standard-Vollbild schrumpfen die beiden Gruppenabstände von jeweils etwa **183 auf 8 Pixel**.

[Zusatzbild: Classic-Handy bei 568×320, großen Tasten und Safe Areas](screenshots/v071/short-landscape-classic-568x320.png).

Messwerte stehen neben den Bildern in `before-metrics.json` und `after-metrics.json`. Weitere reproduzierbare Bilder (320×568 und Querformat, beide Engines) erzeugt die neue Browsermatrix unter `test-results/v071-*.png`.

## Grenzen

Die maximale LCD-Größe im Smartphone-Hochformat wird bei hohen Geräten durch die verfügbare Breite begrenzt. Restfläche unter der zusammenhängenden Spiel-/Tastengruppe bleibt deshalb möglich; das Spielfeld wird weder verzerrt noch mit unbedienbar kleinen Tasten in die Höhe gestreckt. Bei sehr kleinen Geräten begrenzen die vollständige Handy-Tastatur und Classic-Aktionsleiste die LCD-Größe; Vollbild bietet dort das größere Feld.

Die Tests verwenden Chromium und Playwright-WebKit sowie simulierte Safe Areas. Ein echtes iPhone, Safari-Browserleistenanimationen, Display-Zoom und eine auf iOS installierte PWA wurden nicht auf Hardware geprüft. Dialoge und lange Menüs dürfen intern scrollen; die aktive Spielfläche und ihre Steuerung benötigen auf den geprüften Größen keine Seitenscrollbalken.
