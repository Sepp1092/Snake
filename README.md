# Bytecoil – Retro Snake 0.6.1

Weiterentwicklung des veröffentlichten v0.5.2-Stands mit **Classic Snake, Zen Mode, Time Attack und drei Challenges**, lokalen Statistiken und getrennten Rekorden. Eine gemeinsame Engine, keine neuen Frameworks, keine Anmeldung und keine externen Laufzeitdienste. **0.6.1 korrigiert LCD-Clipping:** vier logische Pixel Randreserve, einheitliches 320 × 244-Canvas und ein vom Rahmen unabhängiges Seitenverhältnis. 26 × 17 Zellen, Spieltempo und Speicherformate bleiben erhalten. [Analyse und Randtests](docs/LCD.md).

**Entwicklungsstand:** Branch `feature/v0.6-game-modes`, Ausgangscommit `059debfdb68502d668092df4c2c434be9333dd2d` aus `Sepp1092/Snake`. Der Arbeitscheckout liegt lokal unter `bytecoil-v06`. Die bestehende Website wird durch diesen lokalen Stand nicht verändert.

[Spielmodi und Bedienung](docs/MODES.md) · [Speicherformat und Migration](docs/STORAGE.md) · [Tests](docs/TESTS.md) · [Neue Screenshots](docs/SCREENSHOTS.md)


## Neue Spielmodi

Hauptmenü → Spiele: **Classic Snake** behält die bisherigen Regeln; **Zen Mode** setzt die Schlange nach Kollision sicher zurück und erhält die Sitzungspunkte; **Time Attack** bietet 60/120/180 aktive Sekunden; **Challenge Mode** bietet Food Hunter, Survivor und Maze Master mit festen Regeln und lokalem Abschlussstatus. Vor dem Challenge-Start wird das Ziel erklärt.

Hauptmenü → **Statistik**: Die erste Zeile wechselt zwischen Gesamt und den vier Modi. **Highscores** zeigt Classic, die drei Time-Attack-Rekorde und Challenge-Abschlüsse. Zen hat bewusst keine kompetitive Rangliste. Profile Classic/Modern und Handy/Vollbild betreffen weiterhin nur die Darstellung.

Version-1-Spielstände aus v0.5.2 werden pausiert als Classic übernommen und beim nächsten Sichern in Version 2 geschrieben. Der alte Classic-Rekord bleibt unter `snake3310_best`. Eine stabile Sitzungs-ID und fortlaufende Checkpoints verhindern Doppelzählung beim Neuladen. Historische Gesamtstatistiken vor v0.6 können nicht nachträglich rekonstruiert werden.

## Starten

Voraussetzung: **Node.js 24 LTS** und npm (normalerweise im Node-Installer enthalten) oder pnpm.

```sh
npm install
npm run dev
```

Die im Terminal ausgegebene Adresse öffnen, normalerweise `http://127.0.0.1:5173`. Nicht per Doppelklick auf `index.html` starten: TypeScript-Module benötigen den Entwicklungsserver.

Alternativ mit der mitgelieferten Lockdatei: `pnpm install --frozen-lockfile`, danach `pnpm dev`. `pnpm-workspace.yaml` erlaubt ausschließlich den esbuild-Buildschritt. Mit älteren pnpm-Versionen gegebenenfalls `pnpm approve-builds` für esbuild verwenden.

```sh
npm test                 # 56 Tests für Regeln, Eingaben, Menüs, Speicherung und Feedback
npm run build            # TypeScript-Prüfung, Vite-Build, Offline-Cache
npm run preview          # Fertigen Build lokal unter Port 4173 ansehen
npm run test:browser     # Playwright: Desktop, Smartphone und Offline
```

Der Browsertest nutzt unter Windows vorhandenes Chrome, sonst Playwright Chromium. Falls nötig einmal `npx playwright install chromium` ausführen. Optional `BROWSER_CHANNEL=msedge` oder `chrome` setzen (PowerShell: `$env:BROWSER_CHANNEL='msedge'`). Der Test startet und beendet seinen eigenen lokalen HTTP-Server. Screenshots und JSON-Bericht liegen unter `test-results/`.

## Spielen

Nach dem Startbildschirm: **Menü → Spiele → Retro Snake → Neues Spiel**. Die obere Schaltfläche „Neues Spiel“ startet direkt. Menüeinträge sind auch antippbar.

Im mobilen Modern-Profil: **Mehr → Neues Spiel / Neustart**. Pause/Weiter, Menü und Handy-/Vollbildwechsel stehen immer in einer einzigen Toolbar-Zeile bereit.

| Eingabe | Funktion |
| --- | --- |
| Pfeile / WASD / 2, 4, 6, 8 | Schlange steuern; im Menü navigieren |
| Enter / 5 / linke Funktionstaste | Auswählen, fortsetzen; nach Game Over neu starten |
| Leertaste / 0 | Pause und Fortsetzen |
| Escape / Backspace / C | Im Menü zurück, im Spiel Pause |
| * | Neustart; bei laufender/pausierter Partie mit Bestätigung |
| # | Ton umschalten |
| Wischen auf dem LCD | Richtungswechsel schon während der Bewegung |
| Menü-Schaltfläche | Laufende Partie pausieren und Hauptmenü öffnen |

Im Menü führt Links zurück und Rechts wählt aus. Über „Zurück“ am Hauptmenü gelangt man zur pausierten Partie; Enter setzt sie fort. PC-Tastatur bleibt in allen Touch-Modi nutzbar. „Steuerung“ wählt zwischen Wischen, Bildschirmtasten oder beidem für Richtungswechsel im Spiel. Funktionstasten bleiben erreichbar.

Neun Spielstufen, drei Labyrinthe (Frei, Box, Kreuz), Durchgang oder tödliche Randwände. Futter bringt 10 Punkte und ein Segment; Bonusfutter 25 Punkte und ein Segment. Bonus erscheint bei Punkteständen, die durch 50 teilbar sind, und bleibt bis zu 55 Spielschritte sichtbar.

Änderungen an Stufe, Labyrinth und Randmodus gelten ab der nächsten Runde. So bleibt eine pausierte Partie konsistent. LCD, Ton und Touch-Modus wirken sofort. Browser-/Tabwechsel pausiert automatisch; Fortsetzen erfolgt bewusst per Taste.

„Vollbildansicht“ bezeichnet wie in 0.3 eine große Spielfeldansicht mit Bildschirmsteuerung, nicht die Browser-Fullscreen-API.

## Neu in 0.5.2

**Smartphones:** Die Modern-Toolbar belegt eine Zeile mit vier direkt erreichbaren Aktionen. Profilwechsel, Neustart und Einstellungen stehen unter „Mehr“; das Öffnen pausiert die Partie. Kopfbereich, Fußtexte und doppelte Aktionen entfallen auf kleinen Displays. In der großen Spielansicht passen Spielfeld und vier 48-Pixel-Richtungstasten gemeinsam in das Fenster. Im Querformat stehen sie nebeneinander. Safe Areas und dynamische Viewport-Höhen sind berücksichtigt. Klassische Retro-Handy-Optik und Zahlentasten bleiben verfügbar.

**Geprüfte Größen:** 320×568, 360×740, 390×844, 430×932, 844×390 und 1366×768. Die Modern-Vollbildansicht benötigt bei diesen Größen keinen horizontalen oder vertikalen Bildlauf. Die Modern-Handy-Ansicht passt ebenfalls in die geprüften Hochformat-Smartphones. Im schmalen Querformat darf das vollständige Handygehäuse scrollen; dort die direkt erreichbare Vollbildansicht nutzen. [Screenshots und Messwerte](docs/SCREENSHOTS.md).

**PWA-Release vorbereitet:** [.github/workflows/pages.yml](.github/workflows/pages.yml) installiert reproduzierbar per Lockdatei, prüft Unit-Tests, TypeScript, Build und Browser-/Offline-Tests. Pushes und Pull Requests veröffentlichen nichts. Erst ein manuell gestarteter Workflow mit ausdrücklich aktivierter Veröffentlichung lädt ausschließlich `dist/` zu GitHub Pages. Die GitHub-Pages-Bereitstellung erfordert eine gesonderte Freigabe; vorhandene Bereitstellungen müssen nach einem Commit aktualisiert werden. [Schritt-für-Schritt-Anleitung](docs/GITHUB_PAGES.md) und [Installation auf Android, iPhone und Windows](docs/PWA.md#installation-auf-android-iphone-und-windows).

## Neu in 0.5

**Fortsetzen:** Eine laufende Runde wird etwa einmal pro Sekunde sowie bei Futter, Pause und Hintergrundwechsel gespeichert. Nach dem Öffnen erscheint sie nach dem Startbildschirm **pausiert**. Fortsetzen über Enter/5, die Weiter-Schaltfläche oder **Spiele → Retro Snake → Spiel fortsetzen**. Beim Überschreiben einer begonnenen Partie erscheint eine Bestätigung; Abbrechen lässt sie pausiert erhalten. Nach Game Over/Sieg wird der Fortsetzungsstand entfernt, der Rekord bleibt erhalten. Es gibt einen lokalen Speicherplatz für die aktuelle Runde.

**Zuverlässige Eingaben:** Genau zwei zukünftige Richtungswechsel werden angenommen. W → D im selben Takt bleibt erhalten. Bei vollem Puffer wird die nächste Eingabe verworfen, nicht eine bereits angenommene ersetzt. Pro Tick höchstens ein Richtungswechsel; Pause, Wiederherstellung und Game Over leeren die Warteschlange. Wischen benötigt mindestens 14 Pixel und eine erkennbare Hauptachse; winzige/diagonale Fingerbewegungen erzeugen keine Richtungswechsel.

**Classic und Modern:** Über „Profil“ oder das Einstellungsmenü umschalten. Classic behält das Retro-Menü. Modern vergrößert Bedienelemente, zeigt Spielinformationen und bietet direkten Zugriff auf Neustart und Einstellungen sowie scrollbare Touch-Menüs. Das Profil ist von **Handy-/Vollbildansicht unabhängig**: Beide Kombinationen funktionieren mit derselben Engine und denselben Regeln. Im Modern-Profil übernimmt „Neustart“ auch den Start einer neuen Runde.

**Themen und Feedback:** Oliv, Silber, Bernstein, Dark LCD und High Contrast. Sound separat ein/aus; Lautstärke 0 (stumm) bis 4, Standard 2. Unterschiedliche Rechtecktöne für Menü, Futter, Bonus, Game Over und den ersten neuen Rekord einer Sitzung. Vibration ist separat, standardmäßig aus und bei fehlender Browser-API wirkungslos. Reduzierte Animationen werden respektiert.

**Standardeinstellungen:** Unter Einstellungen → Standardeinstellungen zurücksetzen. Der Bestätigungsdialog betrifft ausschließlich die Einstellungen. Rekord, gespeicherte Partie und sonstige lokale Daten bleiben erhalten. Änderungen an Spielstufe/Labyrinth/Rand wirken weiterhin erst ab dem nächsten neuen Spiel.

## Struktur und Entscheidungen

```text
src/engine.ts       Spiellogik, Labyrinthe und Richtungswarteschlange
src/menu.ts         Menüstruktur und Navigation mit Rücksprungposition
src/storage.ts      Validierte Einstellungen und Rekord; alte Speicherschlüssel
src/snapshot.ts     Versionierte Spielstände: Validierung, Kopie und pausierte Wiederherstellung
src/render.ts       Aus 0.3 übernommene Canvas-Darstellung mit LCD-Paletten
src/audio.ts        Kurze Web-Audio-Rechtecktöne
src/main.ts         Eingaben, Zeitsteuerung, DOM-Menüs und App-Zustand
src/style.css      Eigenständiges Retro-Handheld-Design
public/            Manifest und lokale Icons
scripts/           Offline-Build, Browsertest und reproduzierbare Icons
tests/             Automatisierte Unit-Tests ohne zusätzliches Testframework
(historische Referenzdatei bewusst entfernt)
docs/              Analyse, Änderungen, Testergebnisse und PWA-Hinweise
dist/              Generierter, direkt hostbarer Produktionsbuild
```

TypeScript + Vite + Canvas, bewusst ohne React: Für dieses kleine Spiel genügt ein klarer Zustandsfluss. DOM-Menüs ermöglichen antippbare und tastaturbedienbare Schaltflächen; das eigentliche Spiel bleibt auf Canvas. Node führt die Tests mit nativer TypeScript-Unterstützung aus. Ein `requestAnimationFrame`-Takt ersetzt das browsergebundene Intervall, ohne nach Hintergrundpausen unsichtbare Schritte nachzuholen.


## Speicherung

Die bisherigen `snake3310_*`-Schlüssel werden weiterverwendet. Bestehende Werte werden übernommen, **wenn dieselbe Origin verwendet wird**. Daten einer per `file://` geöffneten HTML-Datei oder einer anderen Adresse/Portnummer sind vom Browser getrennt und werden nicht automatisch übertragen. Rekord, Einstellungen und Spielstand bleiben lokal; gelöschte Browserdaten löschen auch diese Werte. Bei gesperrtem oder vollem Speicher bleibt das Spiel nutzbar, die Persistenz kann dann fehlen. Neue Optionen erhalten konservative Standardwerte. Details zu Schlüsseln, Snapshot-Version 2, Migration aus Version 1 und Validierungsregeln: [Speicherformat](docs/STORAGE.md).

## Qualität und Veröffentlichung

Ergebnis: **56 bestandene Unit-Tests, 49 Chrome-Szenarien plus 9 WebKit-Randprüfungen** und erfolgreicher TypeScript-/Produktionsbuild. Ausgeführt über `pnpm run test`, `pnpm run build` und `pnpm run test:browser`, da die Entwicklungsumgebung kein npm bereitstellt. Die Skripte sind identisch. Desktop und mobile Chrome-/WebKit-Darstellung wurden geprüft. Die WebKit-Matrix läuft zusätzlich mit `pnpm run test:browser:webkit` (vorher `pnpm exec playwright install webkit`). Ein reguläres temporäres Browserprofil bestand Installierbarkeitsprüfung, vollständigen Browser-Neustart und Offline-Fortsetzen. Testumfang und Grenzen: [Testbericht](docs/TESTS.md).

Der Build enthält bereits Manifest, Icons und einen versionierten Service Worker. Nach dem ersten vollständigen Online-Laden funktioniert er offline. `dist/` später auf einem statischen **HTTPS**-Host veröffentlichen. Details zu Installation, Updates, Unterverzeichnissen und Einschränkungen: [PWA-Veröffentlichung](docs/PWA.md). Es wurde kein öffentlicher Deployment durchgeführt.

Eigenständiges Retro-Arcade-Spiel ohne Herstellerbezug. Historisch inspiriert, keine pixelgenaue Emulation der Original-Firmware.

## Öffentliches Branding (0.5.2)

Die App heißt jetzt **Bytecoil – Retro Snake**. Das gestaltete Handheld ist ein eigenständiges Fantasiegerät; Herstellerlogos und fremde Werbeslogans sind nicht Bestandteil der Benutzeroberfläche. Die alte Referenz-HTML und frühere Screenshots wurden aus dem aktuellen Projekt entfernt. Details: [Branding-Checkliste](docs/BRANDING.md). Die Browserdaten bleiben unter den bisherigen `snake3310_*`-Schlüsseln kompatibel; bitte nicht umbenennen.

Der v0.6-Entwicklungsstand ist mit Build-/Browsertests und neuen Screenshots geprüft; vor einer Freigabe sind diese auf der Zielplattform zu bestätigen. Der Produktname muss noch in einschlägigen Markenregistern auf Verfügbarkeit untersucht werden.

## Freigabe von v0.6

Alle Arbeit erfolgt lokal auf `feature/v0.6-game-modes`. Keine Veröffentlichung, kein Merge und kein Deployment wurden ausgeführt. Empfohlen: Diff und Screenshots prüfen, anschließend den Entwicklungsbranch bewusst committen/pushen und als PR gegen `main` prüfen. Erst nach ausdrücklicher Freigabe mergen. Das GitHub-Pages-Deployment ist eine separate manuelle Freigabe; ein Push auf den Feature-Branch darf nicht die öffentliche v0.5.2 ersetzen. Der Workflow veröffentlicht außerdem nur vom Standardbranch und nach gesetztem Freigabefeld.

Lokale Vorschau kann mit `pnpm run preview --port 4174` vom älteren Checkout getrennt gestartet werden. Ein anderer Port ist eine andere Origin und besitzt eigene Browserdaten; die spätere Übernahme bestehender Daten wird unter derselben veröffentlichten Adresse geprüft.
