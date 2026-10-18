# Version 0.5.1 – geprüfte Ansichten

Die Bilder stammen aus dem erfolgreichen Playwright-Lauf mit dem Produktionsbuild. Die Tests messen zusätzlich Spielfeld, Zielgrößen und Dokumentabmessungen; ein Screenshot allein gilt nicht als Abnahme.

## Modern – große Spielansicht

| Fenster | Gerendertes LCD, gerundet | Dokumentgröße | Screenshot |
| --- | --- | --- | --- |
| 320 × 568 | 286 × 216 | 320 × 568 | [Kleines Smartphone](screenshots/modern-full-320x568.png) |
| 360 × 740 | 326 × 247 | 360 × 740 | [Smartphone 360](screenshots/modern-full-360x740.png) |
| 390 × 844 | 356 × 269 | 390 × 844 | [Smartphone 390](screenshots/modern-full-390x844.png) |
| 430 × 932 | 396 × 300 | 430 × 932 | [Großes Smartphone](screenshots/modern-full-430x932.png) |
| 844 × 390 | 374 × 283 | 844 × 390 | [Querformat](screenshots/modern-full-844x390.png) |
| 1366 × 768 | 863 × 653 | 1366 × 768 | [Desktop](screenshots/modern-full-1366x768.png) |

Bei allen sechs Größen: kein horizontaler/vertikaler Scrollbedarf während des Spiels, das vollständige LCD und alle vier Richtungstasten sichtbar, Trefferflächen mindestens 44 × 44 CSS-Pixel. Die mobilen Richtungstasten sind 48 Pixel hoch. Im Querformat sowie niedrigen Desktopfenstern stehen die Tasten rechts neben dem Spielfeld.

## Modern mit Nokia-Gehäuse und Safe Areas

- [Nokia-Ansicht 320 × 568](screenshots/modern-nokia-320x568.png): kompaktere Gehäuseabstände, alle Zahlentasten erhalten, kein vertikaler Scrollbedarf.
- [Nokia-Ansicht 390 × 844](screenshots/modern-nokia-390x844.png).
- [Safe-Area-Simulation 390 × 844](screenshots/modern-safe-area.png): 30 Pixel oben, 24 unten und je 10 seitlich reserviert; LCD und Steuerung bleiben sichtbar.

Die vollständige Handyansicht darf im niedrigen Smartphone-Querformat scrollen, damit Gehäuse und Zahlentasten bedienbar bleiben. Dort bietet die obere Toolbar direkt den Wechsel in die ohne Scrollen nutzbare große Ansicht. Das Classic-Profil behält seine bisherige Gestaltung; die Kompaktregeln gelten für Modern.

Mobile Geräte wurden in Chromium emuliert. Physische Geräte mit echten Aussparungen und variabler Browserleiste sowie Safari sind noch zu prüfen.
