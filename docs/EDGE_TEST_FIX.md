# v0.6.1: GitHub-Actions-Randtest korrigiert

## Befund

Der [fehlgeschlagene Lauf 39174234265](https://github.com/Sepp1092/Snake/actions/runs/39174234265) betrifft Commit `014247d66d11b2cd3c13d8247ae1ee93574066ed`. Der eingelesene Job-Log bestätigt 40 erfolgreiche reguläre Szenarien und danach `170,189,131,255` beim ersten visuellen Randtest. Der Lauf hat **keine Artefakte hochgeladen**; sein ursprünglicher Screenshot ist daher nicht nachträglich verfügbar. Die lokale Reproduktion unten wird ausdrücklich nicht als ursprüngliches CI-Bild ausgegeben.

Mit Playwright Chromium 156.0.8078.4 unter Windows ist derselbe alte Einzelpixel-Test bei 320 × 568, DPR 1, Classic-Handy ohne künstliche Layoutänderung reproduzierbar. [Reproduktions-Screenshot](screenshots/v061-ci-probe-reproduction.png), [Koordinaten und RGB-Messwerte](edge-rounding-reproduction.json). Der Screenshot wurde visuell kontrolliert: Unterste Reihe, Ecken und beide Seiten sind vollständig sichtbar. Die falschen Messungen betreffen unter anderem die Zeilen 2, 8, 11 und 13 an beiden Seiten, also auch weit vom unteren LCD-Rand entfernte Segmente.

Das 320 × 244-Canvas wird dort als 196 × 149,4375 CSS-Pixel bei `(62; 343,59375)` dargestellt. Der alte Test projiziert **einen** Punkt mit Segmentoffset `(6; 9,5)` und rundet ihn mit `Math.floor` auf einen Screenshot-Pixel. Beispiel Zelle `(25; 2)`:

| Messung | Wert |
| --- | --- |
| Gezeichnetes Quellsegment | x ∈ [305; 315), y ∈ [61; 71) |
| Nomineller alter Quellpunkt | (310; 69,5) |
| Gelesener Screenshot-Pixel | (251; 386) |
| Invers projiziertes Pixelzentrum | etwa (309,388; 70,057) |
| Tatsächlich gelesene Screenshotfarbe | Papier: (170; 189; 131; 255) |

Der nominelle Punkt liegt mathematisch im Segment. Das garantiert bei verkleinerter `pixelated`-Darstellung jedoch nicht, dass der Browser genau diesen Quellpixel an dieser ganzzahligen Zielposition ausgibt. Bitmap-Resampling, Bruchteile der Layoutposition und Zielrasterrundung sind weitere Schritte. Am grenznahen Punkt kann der Browser die nächste helle Lücke abbilden. Unterschiedliche Chromium-Versionen/Plattformen können dafür unterschiedliche Pixelzuordnungen erzeugen. Die ursprüngliche Prüfung setzte eine analytische Punktprojektion mit der tatsächlichen Rasterbelegung gleich und meldete dadurch fälschlich Clipping.

Die vollständigen Quellpixel, das proportionale Canvas und dessen Lage innerhalb der LCD-Innenfläche bestehen weiter. Zusammen mit der gleich gerasterten unbeschnittenen Referenz und den kontrollierten Clipping-Gegenproben ergibt sich für die reproduzierte Darstellung **kein Darstellungsfehler der App**. Renderer, CSS und Spiellogik wurden deshalb nicht verändert.

## Änderung am Test

- `scripts/perimeter-probe.mjs` prüft pro Segment ein 3 × 3-Muster innerhalb der Grafik. Es müssen mindestens vier verschiedene dunkle Referenzpunkte existieren; durch Verkleinerung zusammenfallende Punkte werden nicht mehrfach gezählt.
- Der Test erzeugt eine unabhängige, unbeschnittene LCD-Kopie aus der echten Bitmap an exakt gleicher gebrochener Seitenposition, mit gleicher Größe, Pixelmodus und LCD-Overlay. Sie steht außerhalb aller beschneidenden Originalvorfahren. Nach der Referenzaufnahme wird sie entfernt.
- Zusätzlich zu den inneren Punkten wird die **gesamte im Referenzbild sichtbare dunkle Segmentkontur** verglichen, einschließlich letzter sichtbarer Zeile/Spalte. Dadurch würde eine reine Verschiebung aller Proben zur Segmentmitte vermiedene Teilbeschnitte weiterhin erkennen.
- Die Skalierung ergibt sich aus tatsächlicher PNG-Breite und Layout-Viewportbreite. Seitenkoordinaten enthalten Scrolloffsets; `320/244` kommt aus der tatsächlichen Bitmapgeometrie. Bilder werden nicht nachträglich skaliert. Bei unterschiedlich gerundeter entfernter Footerhöhe bleibt das gemeinsame Originalpixelraster maßgeblich; das gesamte LCD muss in beiden Bildern enthalten sein.
- Statt des früheren breiten Dunkel-Grenzwerts werden fünf getrennte LCD-Palettenfarben klassifiziert. Maximal zwölf Werte pro RGB-Kanal berücksichtigen ausschließlich das dezente Scanline-Overlay. Papier kann nie als Körper-/Kopffarbe durchgehen. Es gibt keine pauschale Lockerung des alten Grenzwerts.
- Die Originalbitmapprüfung berücksichtigt jetzt auch den Kopf inklusive der genau bekannten Augenpixel dieser Fixture.
- Im Browser wird jede der vier Seiten gezielt per `clip-path` beschnitten. Bitmap und Bounding-Box bleiben unverändert; der Screenshotvergleich muss den Defekt erkennen. Diese vier Gegenproben laufen jeweils in Chromium und WebKit.
- Drei zusätzliche Unit-Tests prüfen Bruchskalierung/DPR 1–3, den alten Papier-Fehlalarm und genau eine entfernte physische Zeile/Spalte in allen vier Ecken.
- GitHub Actions sichert `test-results/` jetzt mit `if: always()` als `browser-diagnostics` für sieben Tage. Die Veröffentlichungsvoraussetzungen bleiben unverändert.

## Prüfungen und Grenzen

```powershell
pnpm run test
pnpm run build
$env:BROWSER_CHANNEL='chromium'
pnpm run test:browser:webkit
```

`chromium` wählt explizit Playwrights Browser wie im Linux-CI anstelle eines zufällig auf Windows installierten Chrome. Alle regulären Szenarien werden weiterhin ausgeführt. Die zusätzliche WebKit-Matrix ist im genannten Befehl aktiviert.

Ergebnis: **59/59 Unit-Tests**, TypeScript-/Produktionsbuild und **58/58 Browser-Szenarien**. Darin: 40 reguläre Szenarien, neun Chromium-Randgruppen und neun WebKit-Randgruppen. Die Randgruppen prüfen jeweils **320 × 568, 390 × 844, 430 × 932 × DPR 1/2/3 × Classic/Modern × Handy/Vollbild**, insgesamt 72 unveränderte Darstellungen, zusätzlich 72 Referenzaufnahmen und acht absichtlich fehlerhafte Clipping-Aufnahmen. Keine deaktivierten Tests und keine unbehandelten Seitenfehler.

Dies sind lokale Windows-Läufe mit Playwrights Chromium und WebKit; der korrigierte GitHub-Linux-Lauf wurde noch nicht gestartet. Kein physisches iPhone-/Safari-/iOS-PWA-Testergebnis. Versionsnummer bleibt 0.6.1, Speicherschlüssel und Laufzeitcode bleiben unverändert. Eigener lokaler Korrektur-Commit auf `feature/v0.6-game-modes`, basierend auf dem bereits vorhandenen GitHub-v0.6.1-Commit. Kein Push, Release oder Pages-Deployment.
