# PWA und spätere Veröffentlichung

## Bereits vorhanden

- Manifest mit Name, deutscher Sprache, Start-URL, relativem Scope und Standalone-Anzeige.
- Lokale 192-/512-Pixel-PNG-Icons; großes Icon mit Maskable-Sicherheitsabstand. Reproduzierbar über `python scripts/icons.py`.
- Service Worker ausschließlich im Produktionsbuild, damit Entwicklungsänderungen nicht vom Cache verdeckt werden.
- Buildskript berechnet einen Inhalts-Hash aller ausgelieferten Dateien und schreibt ein passendes Precache-Manifest. Offline ohne externe CDN-/Font-Aufrufe.
- Bereits geprüft: erster Online-Aufruf, aktiver Worker, Netzwerk deaktivieren, Seite neu laden, Spiel starten.

## Bereitstellen

1. `npm install` und `npm run build` ausführen.
2. Den **gesamten Inhalt von `dist/`** unverändert auf einen statischen HTTPS-Host kopieren. Alternativ lokal mit `npm run preview` testen; localhost gilt als sicherer Kontext.
3. App unter ihrer endgültigen URL öffnen und den Cacheaufbau abwarten. Danach offline testen.
4. Installation über das Browsermenü anbieten/nutzen; Bezeichnung und Verfügbarkeit hängen vom Browser ab. Auf iOS den Ablauf „Zum Home-Bildschirm“ auf einem echten Gerät prüfen.

Relative Pfade erlauben auch Unterverzeichnisse wie `/snake/`. Dort mit abschließendem Slash aufrufen beziehungsweise `/snake` zu `/snake/` umleiten. JavaScript muss als JavaScript, das Manifest als `application/manifest+json` ausgeliefert werden. `sw.js` darf nicht langfristig per HTTP-Cache eingefroren werden (`Cache-Control: no-cache` empfohlen). Gehashte Assets können langfristig gecacht werden.

## Updates

Jeder Build erhält einen neuen Cache-Namen. Der Worker aktiviert Updates regulär, nachdem bestehende App-Tabs geschlossen wurden. Er erzwingt kein `skipWaiting`, damit keine laufende Runde unvermittelt eine andere Version bekommt. Beim Aktivieren werden alte Snake-Caches entfernt. Nach Veröffentlichung alle alten Tabs schließen und neu öffnen, um das Update vollständig zu übernehmen.

Für spätere größere Veröffentlichungen kann ein expliziter „Update bereit“-Hinweis ergänzt werden. Aktuell gibt es keinen Upload, kein Backend und kein öffentliches Hosting.

## Vor öffentlicher Freigabe

Auf echten Android- und iOS-Geräten Installation, App-Neustart, Offline-Start, Audio nach Benutzergeste, Touch bei hoher Stufe, Rotation und Hintergrundwechsel prüfen. Browserdaten und Caches können vom Betriebssystem gelöscht werden. Offline funktioniert erst nach einem erfolgreichen vollständigen Online-Aufruf. Highscores hängen an der Origin; ein Wechsel von Domain, Protokoll oder Port übernimmt sie nicht automatisch.

## Ergänzungen in 0.5

Offline-Caches enthalten jetzt den Worker-Scope im Namen. Ein Update unter `/snake/` entfernt dadurch keine Caches einer anderen Snake-Installation unter einem anderen Pfad. Alte 0.4-Caches ohne Scope-Präfix werden nicht pauschal gelöscht, um fremde Installationen nicht zu beeinträchtigen; sie können einmalig als ungenutzter Browsercache zurückbleiben. Das berührt weder Rekorde noch Spielstände.

Navigation einschließlich Query-Parametern lädt die zum aktiven Worker passende HTML-Shell aus dessen Cache. Dadurch werden keine neuen HTML-Dateien mit alten, bereits gecachten Assets vermischt. Die Assetliste wird sortiert und anhand des Inhalts versioniert. `skipWaiting` bleibt absichtlich ungenutzt. Alle App-Fenster/Tabs dieser Installation schließen und neu öffnen, wenn ein Update bereitsteht. Ein einfaches Neuladen kann weiterhin die alte Version anzeigen, solange ein alter Worker noch Clients kontrolliert.

Der Spielstand wird unabhängig davon in localStorage gespeichert. Normale Service-Worker-Updates löschen keine Einstellungen, Rekorde oder Spielstände. Beim Laden werden Snapshot-Version und Spielfeld validiert, danach immer pausiert wiederhergestellt. Unbekannte/kaputte Snapshot-Versionen werden sicher verworfen. Details: [Speicherformat](STORAGE.md).

Automatisiert getestet: Offline-Neuladen mit gespeicherter Partie, Hosting unter `/snake/`, Navigation mit Query-Parameter sowie ein simulierter Worker-Versionswechsel, der während des Spiels wartet und anschließend Spielstand/Rekord erhält. Der Test benutzt einen lokalen HTTP-Server; localhost ist ein sicherer Browserkontext. Eine tatsächliche externe HTTPS-Bereitstellung wurde nicht vorgenommen.

### Android Chrome und iOS Safari

- Installation erfolgt über den jeweiligen Browserablauf. Es wird kein automatischer Installationsdialog erzwungen.
- Web Audio benötigt je nach Browser eine Benutzergeste. Fehlende oder gesperrte APIs werden abgefangen; das Spiel bleibt nutzbar.
- Vibration ist optional, standardmäßig aus. Insbesondere Safari/iOS kann keine entsprechende API anbieten; dann bleibt die Einstellung ohne haptischen Effekt.
- Der Browser/das Betriebssystem kann Caches und lokalen Speicher entfernen, besonders bei Speicherknappheit, privatem Modus oder manueller Datenlöschung. Offline und dauerhafte Speicherung sind dann nicht garantiert.
- Lifecycle-Ereignisse sind bei einem harten Prozessabbruch nicht garantiert. Die periodische Sicherung begrenzt den normalerweise verlorenen Fortschritt auf ungefähr eine Sekunde; sie ist keine Garantie bei gesperrtem Speicher.
- Ein bereits erstmalig online gefüllter Cache ist Voraussetzung für Offline-Start. Mehrere gleichzeitig spielende Tabs teilen sich einen lokalen Speicherplatz; zuletzt gespeichert gewinnt.

Vor öffentlicher Veröffentlichung bleiben Hardwareprüfungen auf Android/iOS einschließlich Installation, Hintergrundwechsel, niedriger Akkuleistung und Audio/Vibration erforderlich.

## Installation auf Android, iPhone und Windows

Die öffentliche HTTPS-Adresse ist erst nach der Freigabe und dem GitHub-Pages-Release verfügbar. Anleitung: [GitHub Pages](GITHUB_PAGES.md). Die hier genannten Browser-Menüs können je nach Version etwas anders heißen.

### Android mit Chrome

1. Die endgültige HTTPS-Adresse in Chrome öffnen, nicht in einem privaten Tab.
2. Die Seite vollständig laden, Menü und Spiel einmal öffnen.
3. Im Chrome-Menü die angebotene Funktion „Zum Startbildschirm hinzufügen“ beziehungsweise „App installieren“ wählen und bestätigen.
4. Snake über das neue Startbildschirm-Icon öffnen. Die Anzeige soll als eigenständige App gemäß Manifest (`display: standalone`) erscheinen.
5. In dieser installierten App nochmals online laden und den folgenden Offline-Test durchführen.

Offizielle Anleitung: [Google Chrome – Web-Apps verwenden](https://support.google.com/chrome/answer/9658361).

### iPhone mit Safari

1. Die HTTPS-Adresse in Safari öffnen und vollständig laden.
2. „Teilen“ öffnen und „Zum Home-Bildschirm“ wählen.
3. Falls angeboten „Als Web-App öffnen“ aktiviert lassen, Namen prüfen und „Hinzufügen“ wählen.
4. Die App über das neue Icon starten und vor dem Offline-Test einmal online laden. Der Browser kann Safari und eine installierte Web-App in getrennten Datenkontexten betreiben; einen im Safari-Tab begonnenen Spielstand nicht als automatisch übertragen voraussetzen.
5. Touch, Rotation, Safe Areas und Hintergrundwechsel auf dem tatsächlichen Gerät prüfen. Vibration kann mangels API ohne Wirkung bleiben.

Offizielle Anleitung: [Apple – Website als App auf dem iPhone verwenden](https://support.apple.com/guide/iphone/iphea86e5236/ios).

### Windows mit Chrome oder Edge

1. Die HTTPS-Adresse im Browser öffnen. Die lokale Adresse `http://127.0.0.1:4173/` funktioniert zum Testen ebenfalls, solange der lokale Vorschauprozess läuft.
2. In Chrome das angebotene Installieren-Symbol in der Adressleiste oder den entsprechenden Installationspunkt im Browsermenü wählen. In Edge die Funktion „Diese Website als App installieren“ im Apps-Menü verwenden.
3. Über Startmenü oder App-Verknüpfung öffnen. Die Seite soll in einem eigenen Fenster erscheinen.
4. Online einmal vollständig laden, dann Offline-Test durchführen. Im privaten/Inkognito-Modus kann die Installationsfunktion fehlen.

Offizielle Anleitungen: [Google Chrome – Web-Apps verwenden](https://support.google.com/chrome/answer/9658361), [Microsoft Edge – Apps installieren und verwalten](https://support.microsoft.com/en-us/edge/install-manage-or-uninstall-apps-in-microsoft-edge).

## Offline-Test nach Installation

1. Die installierte App online starten. Eine Runde beginnen, einige Schritte spielen und pausieren. Punktestand und Schlangenposition merken.
2. Warten, bis die Seite vollständig geladen und der Service Worker bereit ist. Für eine technische Kontrolle im Desktop-Chrome DevTools → Application → Service Workers auf einen aktivierten Worker unter dem App-Pfad prüfen.
3. Die App vollständig schließen und über ihr Icon nochmals online öffnen. Die gespeicherte Partie muss pausiert erscheinen. Dies stellt auch sicher, dass die App bereits vom aktiven Worker kontrolliert wird.
4. Flugmodus einschalten beziehungsweise WLAN und mobile Daten ausschalten. Unter Windows alternativ die Netzwerkverbindung vorübergehend trennen oder DevTools → Network → Offline verwenden.
5. App vollständig schließen und offline erneut über das Icon öffnen. Sie muss erscheinen und dieselbe Partie pausiert anbieten. Fortsetzen und einige Richtungswechsel ausprobieren.
6. Wieder pausieren und schließen. Offline erneut öffnen und prüfen, dass auch dieser neue Fortschritt erhalten blieb. Anschließend Netzwerk wieder einschalten.

Der automatisierte Browserlauf prüft dieses Prinzip mit einem vollständigen Chromium-Prozessneustart, demselben temporären Benutzerprofil und ausgeschaltetem Netzwerk. Er ersetzt keine physische Homescreen-Installation auf Android/iOS. Browserdaten nicht löschen und die App nicht deinstallieren, wenn Rekorde und Spielstand erhalten bleiben sollen.

## Release-Status 0.5.2

Manifest, Icons, relativer Basis-/Worker-Pfad und versionierter Cache waren bereits vorhanden und wurden erhalten. Unter `/Snake/` werden Manifest, beide Icons, CSS und JavaScript erfolgreich geladen. Chrome meldete im regulären lokalen Profil keine Installierbarkeitsfehler. Die Inkognito-Testkontexte werden dafür bewusst nicht verwendet.

Die GitHub-Actions-Veröffentlichung ist vorbereitet, aber nicht ausgeführt. Pushes/PRs prüfen nur. Erst nach ausdrücklicher Freigabe den manuellen Release-Workflow mit aktivierter Veröffentlichung starten. Der Workflow ist anhand der [offiziellen GitHub-Pages-Anleitung](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) aufgebaut. Eine tatsächliche GitHub-Runner-Ausführung und die HTTPS-Adresse sind erst nach Einrichten des Repositories prüfbar.

## Fehlerbehebung: Seite erscheint ohne Gestaltung

Wenn Chrome eine ältere HTML-Fassung mit inzwischen fehlenden Skript-/CSS-Dateien anzeigt, auf der geöffneten Seite einmal **Strg+Umschalt+R** drücken. Das lädt die aktuellen Dateien, ohne localStorage zu löschen. Browserdaten müssen dafür nicht gelöscht werden.

Die aktuelle HTML-Datei enthält einen kleinen, von den Spielmodulen unabhängigen Ladehinweis. Bei fehlendem JavaScript oder CSS bietet er „App neu laden“ an. Die Aktion meldet ausschließlich den Service Worker mit exakt passendem App-Scope ab und lädt neu; sie löscht weder localStorage noch Caches. Anschließend registriert die funktionierende App ihren Worker wieder regulär. Nach einem solchen Reparaturvorgang online vollständig laden, bevor erneut offline gespielt wird.

Lokale Vite-Builds behalten bereits vorhandene gehashte Assets, damit noch offene ältere Dokumente weiterhin passende Dateien finden. Der Offline-Build verwendet das aktuelle Vite-Manifest, sodass ältere Dateien nicht zusätzlich in den neuen Offline-Cache aufgenommen werden. Frische GitHub-Runner besitzen keinen vorherigen dist-Ordner; dort schützt weiterhin der zur aktiven Version passende vollständige Service-Worker-Cache.

Diese zwei Fehlerfälle sind mit blockierten CSS-/JS-Anfragen und anschließender erfolgreicher Wiederherstellung im Browser getestet.
