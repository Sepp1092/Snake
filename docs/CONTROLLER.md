# Controller und mobile Steuerung in 0.7

## Gamepad

Bluetooth- und USB-Controller werden im Betriebssystem verbunden. Bytecoil verwendet anschließend ausschließlich `navigator.getGamepads()`. Es gibt keinen Bluetooth-Pairingdialog in der App und keine Geräte-ID-Speicherung. Unter **Einstellungen → Controller** lässt sich die Eingabe abschalten. Bei deaktivierter Eingabe wird die Gamepad-API nicht abgefragt. Ein erkannter Controller, eine nicht standardisierte Belegung und die Trennung werden angezeigt; der aktuelle Zustand ist auch im Controller-Einstellungsmenü unter dem LCD lesbar.

| Standardbelegung | Bytecoil |
| --- | --- |
| D-Pad, Buttons 12–15 | Richtung / Menü |
| Linker Stick, Achsen 0/1 | Richtung / Menü |
| A / Haupttaste, Button 0 | Bestätigen, Fortsetzen, Spiel starten |
| B, Button 1 | Zurück; im Spiel Pause |
| Start, Button 9 | Pause / Fortsetzen |

Dialoge unterstützen ebenfalls Richtungsauswahl, A zum Betätigen und B zum Abbrechen. Nach einer Trennung bleiben Tastatur und Touch nutzbar. Bei mehreren Standardgeräten wird das erste im vom Browser gelieferten Array verwendet; es gibt keine Mehrspieler-Steuerung. Nicht standardisierte Geräte werden angezeigt, aber nicht nach einer möglicherweise falschen Belegung interpretiert.

Die eigene Eingabeschicht `src/gamepad.ts` enthält keine Spielregeln. Abfrage maximal einmal pro 16 ms im vorhandenen Animationsloop, keine Speicherzugriffe. Neue Tastenflanken erzeugen Aktionen; gehaltene Tasten und Sticks wiederholen nicht. Der Stick aktiviert ab 0,55 und kehrt unter 0,35 in Neutralstellung zurück. Nur die dominante Achse erzeugt eine Richtung; das D-Pad hat Vorrang. Browserfokus und Sichtbarkeit werden berücksichtigt. Nach Hintergrund-/Fokuswechsel oder erneutem Aktivieren muss ein gehaltener Controller erst neutral werden. Alle Richtungen gehen durch denselben bestehenden Zweierpuffer wie Tastatur und Touch; verbotene Umkehrungen und doppelte Richtungen werden dort weiter abgelehnt.

## Browser und iPhone

Die Browserfreigabe von Geräten und das Standardmapping liegen beim Browser. Bereits angeschlossene Geräte können erst nach einem Tastendruck sichtbar werden; eine fehlende API oder verweigerte Berechtigung wird abgefangen. Siehe [W3C Gamepad](https://www.w3.org/TR/gamepad/) und [MDN zur Nutzung der Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API).

Auf iPhone/iPad hängen Geräteerkennung und Belegung von Controller, iOS/iPadOS und Safari ab. Die installierte PWA erhält die vom Browser bereitgestellte API, keine zusätzliche native Controller-Schicht. Bitte den Controller über das Betriebssystem verbinden, die App aktivieren und eine Taste drücken. Falls kein Standardgerät erkannt wird, funktionieren Touch und Tastatur weiter. HTTPS beziehungsweise der lokale sichere Entwicklungskontext ist für Browserfunktionen vorzusehen. Es werden keine umfassende iPhone-Gerätefreigabe und keine garantierte Erkennung jedes USB-/Bluetooth-Modells behauptet.

Automatisiert geprüft werden standardisierte `getGamepads()`-Zustände, Tasten und Achsen in Chromium und WebKit. Die Simulation ersetzt weder echte Funk-/USB-Verbindung noch OS-Pairing, Hardware-Latenz oder den Test einer installierten iOS-PWA. Keine Controller-Haptik; die bestehende Geräte-Vibration bleibt unverändert.

## Mobile Einstellungen

**Touch-Layout:** Seit 0.7.4 folgen alle Vollbild-Richtungstasten im Smartphone-Hochformat mit 16–24 CSS-Pixeln Abstand direkt auf die LCD-Statuszeile. Freie Höhe bleibt darunter; keine automatische untere Verankerung. Standard verwendet bis 90 Pixel breite Tasten, Kompakt bis 80 Pixel für kürzere horizontale Reichweite. Ergonomisch verwendet größere Tasten. Im Querformat bleiben Feld und Tasten nebeneinander, die Tasten vertikal mittig. Die Handyansicht behält alle 15 virtuellen Tasten in drei Spalten und fünf Reihen.

**Tastengröße:** Normal oder Groß. Normal besitzt mindestens 44 Pixel hohe Ziele; die Vollbildsteuerung nutzt 48, ergonomisch 56 Pixel. Groß hat in der Handyansicht mindestens 48, beim Steuerkreuz mindestens 60 Pixel, ergonomisch 64. Auf kurzen Handys spart die Verkleinerung von Gehäusetrim/LCD-Breite Platz für die größeren Tasten. Die logische Bitmap bleibt immer 320 × 244 mit unveränderten 26 × 17 Zellen.

**Steuerkreuz (Vollbild):** lässt die Richtungstasten im Spiel ausblenden. Menüs behalten ihre Navigationsmöglichkeiten. Wischen bleibt verfügbar; eine widersprüchliche Einstellung „nur Bildschirmtasten“ wird dabei auf „Tasten + Wischen“ korrigiert. Die Zifferntastatur der Handyansicht bleibt erhalten. Das Ändern einer Darstellung erzeugt keine Richtung, startet keine neue Partie und ändert keine gespeicherten Regeln. Einstellungen werden im pausierenden Menü vorgenommen; anschließend kann die Partie fortgesetzt werden.

Safe Areas, `dvh`/`svh`, Hoch-/Querformat und die existierende variable Größenberechnung bleiben erhalten. Beide Ansichten passen in den geprüften Smartphone-Größen ohne Seitenscrollen, auch bei großen Tasten. Auf sehr niedrigen Querformat-Geräten steht die einzeilige Toolbar oberhalb des LCDs neben der Zifferntastatur. Die Smartphone-Toolbar enthält vier Hauptaktionen; weitere Einstellungen liegen unter Mehr. Das native Mehr-Dialogfenster darf bei geringer Höhe intern scrollen. Unter 280 Pixel Viewporthöhe darf die Vollbildseite im Querformat sicher scrollen, damit große Spiel- und Menütasten erreichbar bleiben. [Messwerte und Grenzen](FULLSCREEN_CONTROLS_V074.md).
