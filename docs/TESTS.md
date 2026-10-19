# Tests – Bytecoil 0.7.0

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
