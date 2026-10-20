# Bytecoil 0.7.4 – Fullscreen Layout & Mobile Controls

Basis: `main` **6457008**, einschließlich vollständig gemergter v0.7.3 (PR #5). Branch **feature/v0.7.4-fullscreen-controls**. Bestehendes Projekt `bytecoil-v06`, Stand 20. Oktober 2026. Keine neuen Abhängigkeiten.

## Zusammenhängende Bedieneinheit

Im Smartphone-Hochformat stehen **Toolbar → LCD → Status → Steuerkreuz** direkt untereinander. Die Ursache des vorherigen großen Leerraums war `margin-top:auto` aus v0.7.3. Die automatische untere Verankerung entfällt vollständig. Der neue CSS-Abstand ergibt sich aus `clamp(16px,3dvh,24px)`. Der Flex-Gruppenabstand wird von der zusätzlichen Marge abgezogen, damit der tatsächliche Gesamtabstand nicht doppelt gezählt wird. Die obere Pfeiltaste folgt so ungefähr 17–24 Pixel unter der Statusbox; die übrigen drei Pfeile bleiben darunter, das gesamte Kreuz horizontal zentriert. Freie Höhe liegt bewusst **unter** der Bedieneinheit.

Die Statuszeile bleibt kompakt, ohne zusätzliche Randpolster. In einer aktiven Partie zeigt sie Modus und Punkte, pausiert die bestehenden Fortsetzen-Hinweise. Standard, Kompakt, Ergonomisch sowie Normal/Groß behalten ihre bisherigen Tastenmaße; die kleinsten Ziele bleiben mindestens 44×44 CSS-Pixel groß.

Der bereits vorhandene JavaScript-Größenfitter bleibt für die tatsächlich gemessenen Tasten-, Toolbar-, Gehäuse- und Schriftmaße zuständig. Er reserviert jetzt auch den **endlichen CSS-Abstand** vor den Tasten. Die Marge hängt nur von der Viewporthöhe ab und nicht vom verbleibenden Flexraum; dadurch gibt es keine Rückkopplung über einen Auto-Abstand. Keine neue Schleife, keine neue Layoutbibliothek. CSS bestimmt Reihenfolge und Abstände.

## LCD und unveränderte Funktionen

Die v0.7.3-Anzeige nutzt bereits die verfügbare Breite bis auf **14 CSS-Pixel** für Außenabstände und geschützte Rahmen. Ein weiteres Vergrößern würde diese Rahmen entfernen oder das feste Verhältnis verletzen. Deshalb bleibt die LCD-Größe im üblichen Hochformat erhalten, während die Steuerung deutlich näher rückt. Es wird keine künstliche Vergrößerung behauptet.

Unverändert: 320×244-Bitmap, 26×17 Spielfeldzellen, 12-Pixel-Zellen, 32-Pixel-Statusbereich, vierseitige Reserve aus v0.6.1, Pixel-Skalierung, Engine und Spieltempo. Keine Änderungen an Modi, Rekorden, Achievements, Speicherformaten/-keys, Controller, Gesten, Audio, Vibration oder Service-Worker-Protokoll. Die gemeinsame Oberfläche, vier einzeilige Smartphone-Toolbar-Aktionen, Mehr-Menü, LCD-Themen und alle 15 virtuellen Handytasten bleiben erhalten.

## Gemessene Geometrie

Chromium, Produktionsbuilds 0.7.3 und 0.7.4, CSS-Pixel, Standard/Normal, aktive Partie. LCD-Breite meint den Canvas-Inhalt ohne dessen umliegende Rahmen. „Statusabstand“ wird von der Unterkante der Statusbox bis zur Oberkante der oberen Pfeiltaste gemessen; „LCD → Status“ von der äußeren LCD-Unterkante zur Oberkante der Statusbox.

| Viewport | Canvas-Breite vorher → nachher | Canvas-Höhe nachher | Statusabstand vorher → nachher | LCD → Status | Obere Pfeiltaste Y vorher → nachher |
| --- | --- | --- | --- | --- | --- |
| 320×568 | 306 → **306** | 233,31 | 132,02 → **17,03** | 2 | 451 → **336,02** |
| 360×740 | 346 → **346** | 263,81 | 271,8 → **22,19** | 2 | 623 → **373,39** |
| 390×844 | 376 → **376** | 286,69 | 352,31 → **24** | 2 | 727 → **398,69** |
| 430×932 | 416 → **416** | 317,19 | 409,81 → **24** | 2 | 815 → **429,19** |

Bei 390×844 liegt die obere Pfeiltaste jetzt bei **Y=398,69** statt Y=727. Die Richtungstasten enden bei **503,69**; der verbleibende untere Raum ist beabsichtigt. Bei 430×932 beginnt das Kreuz bei **429,19** statt Y=815. Keine Streckung des Spielfelds und keine überdeckenden Tasten.

Im üblichen kurzen Querformat 844×390 bleiben LCD und Steuerkreuz als sicherer Platz-Fallback nebeneinander: Canvas **393,44×300 CSS-Pixel**, Steuerung seitlich vertikal mittig. Eine gleich breite vertikale Stapelung würde nicht in 390 Pixel Höhe passen. Die Desktop-Vollbildansicht 1366×768 und die Retro-Handyansicht behalten ihre bisherige Geometrie.

Rohdaten: [24 Vorher-Zustände](screenshots/v074/before-metrics.json), [24 Nachher-Zustände](screenshots/v074/after-metrics.json), jeweils sechs Viewports × beide Ansichten × aktiv/pausiert. Die vollständige Browsermatrix ergänzt alle drei Touch-Layouts und beide Tastengrößen.

## Dynamische Höhe und sichere Grenzen

`100dvh`, die bestehenden `VisualViewport`-/Resize-Beobachtungen und Safe Areas bleiben erhalten. Die Fassung berücksichtigt eingeblendete Browserleisten über verringerte Viewporthöhe und hält die Tasten oberhalb des unteren Insets. Auf üblichen Zielgrößen ist die aktive Vollbildseite ohne horizontales oder vertikales Seitenscrollen spielbar.

Bei weniger als 280 Pixel hoher Smartphone-Queransicht darf das Dokument sicher vertikal scrollen: intrinsische Zeilenhöhe statt erzwungener Zentrierung. Große Spiel-/Menütasten werden nicht über Toolbar oder LCD gelegt und lassen sich vollständig in den sichtbaren Bereich scrollen. Der automatisierte Extremfall ist **568×220**, Ergonomisch/Groß, im Spiel und Menü. Die übliche Queransicht bleibt unverändert. Lange Menüs und Mehr-Dialoge dürfen weiterhin intern scrollen. Die Desktop-Handyansicht besitzt wie zuvor ihren normalen Dokument-Scrollbereich; sie wird nicht künstlich auf Fensterhöhe zusammengestaucht.

## Vorher/Nachher

20 Bilder aus echten, getrennt aufgenommenen Produktionsbuilds. Der Vorher-Build stammt vom unveränderten main 6457008 mit Version 0.7.3, vor den Laufzeitänderungen. Gleiche isolierte künstliche Spielstände, eingefrorener Takt und eine zusammenhängende Schlange in der gesamten untersten Reihe sowie allen vier Ecken. Keine echten Benutzerdaten.

| Zustand | 0.7.3 | 0.7.4 |
| --- | --- | --- |
| Vollbild 320×568 · aktiv | [Vorher](screenshots/v074/before-full-320x568-active.png) | [Nachher](screenshots/v074/after-full-320x568-active.png) |
| Vollbild 320×568 · pausiert | [Vorher](screenshots/v074/before-full-320x568-paused.png) | [Nachher](screenshots/v074/after-full-320x568-paused.png) |
| Vollbild 390×844 · aktiv | [Vorher](screenshots/v074/before-full-390x844-active.png) | [Nachher](screenshots/v074/after-full-390x844-active.png) |
| Vollbild 390×844 · pausiert | [Vorher](screenshots/v074/before-full-390x844-paused.png) | [Nachher](screenshots/v074/after-full-390x844-paused.png) |
| Vollbild 430×932 · aktiv | [Vorher](screenshots/v074/before-full-430x932-active.png) | [Nachher](screenshots/v074/after-full-430x932-active.png) |
| Vollbild 430×932 · pausiert | [Vorher](screenshots/v074/before-full-430x932-paused.png) | [Nachher](screenshots/v074/after-full-430x932-paused.png) |
| Vollbild 844×390 · aktiv | [Vorher](screenshots/v074/before-full-844x390-active.png) | [Nachher](screenshots/v074/after-full-844x390-active.png) |
| Vollbild 844×390 · pausiert | [Vorher](screenshots/v074/before-full-844x390-paused.png) | [Nachher](screenshots/v074/after-full-844x390-paused.png) |
| Handy 390×844 · aktiv | [Vorher](screenshots/v074/before-handheld-390x844-active.png) | [Nachher](screenshots/v074/after-handheld-390x844-active.png) |
| Handy 390×844 · pausiert | [Vorher](screenshots/v074/before-handheld-390x844-paused.png) | [Nachher](screenshots/v074/after-handheld-390x844-paused.png) |

Reproduktion: `pnpm run build`, dann `node scripts/capture-v074.mjs`. Ausgaben: `test-results/v074-after/`. `--before` ändert nur die Ausgabe-Bezeichnung und erfordert zuvor den **unveränderten 0.7.3-Build** in `dist/`; das Skript baut keine historische Version selbst.

## Tests und Dateien

[Testbericht und Befehle](TESTS.md) · [Vollständige Dateiliste](CHANGED_FILES_V074.md).

Neue Prüfungen messen den Statusabstand und vergleichen LCD-/Handygröße mit dem echten v0.7.3-Build. Reale CSS-Gegenproben setzen den alten Auto-Abstand beziehungsweise eine negative Marge; die Abstandsprüfung muss beide zurückweisen. Dazu kommen dynamische Höhe, injizierte Safe Areas, Quer-/Hochformatwechsel, große Tasten in sehr kurzen Fenstern sowie schnelle echte Touch-Taps in zwei Richtungen, verbotene Umkehrung und pausierter Ansichtswechsel. Snapshot-Prüfungen nutzen den tatsächlichen Speicher-Checkpoint nach einer Pause, nicht einen veralteten periodischen Autosave. Die manuelle Pause behält ihren bisherigen bewussten Puffer-Reset.

Die bisherigen Assertions für eine untere Verankerung beziehungsweise ein zwingendes Abwärtsverschieben werden auf den nun ausdrücklich geforderten Abstand **16–32 Pixel** umgestellt. Alle Funktions-, Raster-, Clipping-, Daten- und Offline-Prüfungen bleiben aktiv; keine Tests deaktiviert oder Farbgrenzen gelockert. Die 0.6.1-Randprobe bleibt unverändert.

## Einschränkungen und Freigabe

Playwright-WebKit unter Windows ersetzt kein echtes iPhone mit Safari oder installierter PWA. Browserleistenanimationen, Display-Zoom, Hardware-Vibration und physisches Controller-Pairing sind nicht auf einem Gerät getestet. Safe Areas, dynamische Höhe und Standard-Controller werden simuliert. Im üblichen Querformat bleibt die seitliche Anordnung nötig; extrem niedrige Fenster dürfen zugunsten vollständiger Steuerelemente scrollen. Der größere freie Bereich unter dem Steuerkreuz auf hohen Smartphones ist beabsichtigt.

Eigener Entwicklungscommit, Draft-PR nach main und Kontrolle der GitHub-Actions-Prüfungen. Kein automatischer Merge, keine Release-Erstellung und kein Pages-Deployment; die veröffentlichte Version bleibt bis zu einer separaten Freigabe unangetastet.
