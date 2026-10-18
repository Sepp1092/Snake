# LCD-Korrektur in 0.6.1

## Ursache und Lösung

Die Engine benötigt unverändert 26 × 12 = 312 Pixel Breite und 17 × 12 = 204 Pixel Höhe; darüber liegen 32 Statuspixel. Das bisherige 312 × 236-Canvas enthielt die letzte Zelle vollständig. Der Darstellungsfehler entstand außerhalb der Engine: Der globale `border-box`-Standard bezog den LCD-Rahmen in das CSS-Seitenverhältnis ein, während das Canvas die innere Fläche ausfüllte. Zusätzlich konkurrierten `1.32`, `312/236`, Canvas-Seitenverhältnis und prozentuale Höhe. Je nach Auflösung prozentualer Höhen konnte das Canvas verzerrt werden oder über die innere LCD-Höhe hinausragen. `overflow:hidden` schnitt diesen Überstand ab. Beispielsweise hat ein 312 × 236 großer Border-Box-Rahmen mit 3 Pixeln Rand innen nur 306 × 230 Pixel; ein proportional 306 Pixel breites altes Canvas benötigt dagegen etwa 231,46 Pixel Höhe.

`src/display.ts` definiert jetzt die logischen Maße gemeinsam für Renderer und Tests. Das Canvas ist **320 × 244** groß. Der bisherige 312 × 236-Inhalt wird um **(4, 4)** verschoben; die zusätzliche Fläche bleibt im LCD-Papierton. Zellgrafik (10 × 10 Pixel innerhalb einer 12er-Zelle), Statusbereich, Spielfeldkoordinaten, Labyrinthe und Kollisionen bleiben unverändert. Auch Futter, Bonus und Kopfaugen verwenden dieselbe Verschiebung. Statische Hintergründe werden weiter zwischengespeichert.

Die `.lcd` verwendet ausdrücklich `box-sizing:content-box` und das Verhältnis `320/244`. Der Rahmen liegt außerhalb dieser Fläche. Das Canvas erhält `width:100%` und `height:auto`. Das feste LCD-Verhältnis hält auch bei verborgenem Canvas die absolut positionierten Menüs offen. Alle Handy-/Vollbildregeln verwenden dasselbe Verhältnis; die Breitenberechnung wird entsprechend angepasst. Die kurze Modern-Handyansicht ist acht CSS-Pixel schmaler, damit die zusätzliche Höhe nicht zu vertikalem Scrollbedarf führt.

## Pixelgrafik und iPhone/PWA

Die logische Bitmap wird unabhängig von `devicePixelRatio` nicht vergrößert oder neu gerastert. `imageSmoothingEnabled=false` und zuletzt `image-rendering:pixelated` erhalten harte Pixelkanten. Die frühere zusätzliche Gehäuse-Transformation `scale(1.02)` entfällt. Breite und Höhe skalieren proportional. Bei nicht ganzzahligen Größen können logische Pixel unterschiedlich viele physische Pixel belegen; das ist bei responsiver Nearest-Neighbor-Skalierung unvermeidbar und keine bilineare Unschärfe.

Browser und installierte PWA verwenden denselben Renderer und dieselben Styles. Manifest, `viewport-fit=cover`, `dvh` und vorhandene Safe-Area-Abstände bleiben erhalten. Die Randkorrektur hängt weder von einer Browserleiste noch von einer bestimmten Pixeldichte ab. Der Offline-Cache bekommt durch den Build automatisch einen neuen inhaltsabhängigen Namen. Vorhandene Spielstände, Highscores und alle Speicherschlüssel werden beibehalten.

## Reproduzierbare Tests

```sh
pnpm run test
pnpm run build
pnpm run test:browser
pnpm exec playwright install webkit
pnpm run test:browser:webkit
```

Der letzte Befehl führt die vollständige Chrome-Suite plus die WebKit-Randmatrix aus. `BROWSER_CHANNEL` kann wie bisher die Chromium-basierte Installation auswählen; alternativ aktiviert `TEST_WEBKIT=true` dieselbe zusätzliche Matrix.

`scripts/edge-test.mjs` erzeugt einen validierten, zusammenhängenden Spielstand entlang des gesamten Spielfeldumfangs: alle vier Ecken, die ganze unterste Reihe und beide Seiten sind belegt. Die App lädt diesen regulär als pausierten Classic-Spielstand; die Testuhr bleibt stehen. Der Pausedialog liegt in der Mitte und verdeckt keine Randzelle. Es gibt keinen Debug-Zugang in der ausgelieferten App.

Für **320 × 568, 390 × 844, 430 × 932**, jeweils **DPR 1, 2, 3**, jeweils **Classic/Modern** und **Handy/Vollbild**, prüfen Chrome und WebKit:

- tatsächliche Bitmapmaße und Device-Pixel-Ratio;
- alle 100 Körperpixel jeder Randzelle einschließlich der letzten gezeichneten Pixelzeile;
- Papierton der unteren Reserve, abgeschaltete Glättung und CSS-Pixelmodus;
- gleichmäßiges Seitenverhältnis und vollständige Lage des Canvas innerhalb der LCD-Innenfläche;
- sichtbare Pixel jeder Randzelle im **komponierten Browser-Screenshot** (erkennt CSS-Clipping, das reine Canvas-Tests übersehen);
- keinen horizontalen Überlauf und keinen vertikalen Überlauf in den mobilen Modern-Ansichten.

Das ergibt **72 Darstellungen** in 18 gruppierten Szenarien sowie zwei Geometrie- und drei Raster-Unit-Tests. Jede Darstellung erhält einen vollständigen PNG-Screenshot unter `test-results/v061-*-bottom-*.png`. Der Browserbericht enthält Messwerte für jede Darstellung. Ausgewählte DPR-3-Aufnahmen sind dauerhaft unter [Screenshots](SCREENSHOTS.md) dokumentiert.

WebKit unter Windows ist eine zusätzliche Engine-Prüfung, kein physisches iPhone und keine installierte iOS-PWA. Ein abschließender Gerätetest mit Safari und „Zum Home-Bildschirm“ bleibt erforderlich; echte Browserleistenwechsel, OS-Suspend, Hardware-Audio und iOS-Compositing können hier nicht vollständig nachgebildet werden. Die vollständigen funktionalen PWA-/Touch-Regressionen laufen in Chrome; die zusätzliche WebKit-Matrix konzentriert sich auf Raster und Layout.


## CI-Rasterkorrektur

Der ursprüngliche grenznahe Screenshot-Einzelpunkt konnte bei Bruchskalierung Hintergrund lesen, obwohl das Segment sichtbar war. Die Prüfung vergleicht nun mehrere innere Punkte und die gesamte dunkle Kontur mit einer unbeschnittenen, gleich gerasterten LCD-Referenz. Vier absichtliche CSS-Clippings pro Engine sowie Einzelpixel-Unit-Gegenproben sichern die Fehlererkennung. [Messwerte, Reproduktionsbild und Ergebnisse](EDGE_TEST_FIX.md). Die oben beschriebene App-Geometrie bleibt unverändert.
