# Bytecoil 0.7.3 – Unified UI und LCD Cleanup

Basis: `main` **40b5342** (Merge von 0.7.2), Branch **feature/v0.7.3-unified-ui**, bestehendes Projekt `bytecoil-v06`. Stand: 20. Oktober 2026. Keine neue Engine, Frameworks, Dienste oder Abhängigkeiten.

## Einheitliche Oberfläche und Migration

Die bisherige touchfreundliche Menüführung ist jetzt der einzige UI-Pfad. Profilwahl, Profil-Menü, Toolbar-/Mehr-Profilbuttons, Profil-Handler und Classic-Paginierung sind entfernt. Die gemeinsame Liste rendert alle Einträge, scrollt intern und hält den per Tastatur oder Controller ausgewählten Eintrag sichtbar. `.modern`, `.modern-only` und deren Gegenbedingungen sind aus HTML, Laufzeitlogik und CSS entfernt. 204 nachweislich überschriebene CSS-Deklarationen wurden bereinigt; der gebaute CSS-Inhalt sinkt von etwa 31,7 auf 23,5 KB.

`snake3310_profile` bleibt im LocalStorage unverändert liegen. Es wird vom aktiven Settings-Modell weder gelesen noch geschrieben; es wird auch beim Zurücksetzen anderer Einstellungen nicht gelöscht. Classic, Modern, unbekannte und fehlende alte Werte führen daher zur gleichen Oberfläche. Es gibt keine neue Profil-Standardeinstellung und keinen versteckten Profilzustand. **Classic Snake bleibt ein unveränderter Spielmodus.** Snapshot-Version 2, alte Snapshot-Migration, Speicherkeys für Rekorde, Statistik und Achievements sowie alle anderen Optionen bleiben erhalten. Es werden keine Daten übertragen.

Die Menüstruktur ist gemeinsam:

- Hauptmenü: Spiele, Einstellungen, Statistik, Highscores, Achievements.
- Spiele: Classic Snake, Zen Mode, Time Attack und Challenge Mode mit ihren bisherigen Untermenüs und Regeln.
- Einstellungen: Sound, LCD-Darstellung, Steuerung, Randmodus, Ansicht, Lautstärke, Vibration, Touch-Layout, Tastengröße, Steuerkreuz, Controller, Erfolgsmeldungen, Standardeinstellungen.
- Smartphone-Toolbar: Pause/Weiter, Menü, Handy/Vollbild, Mehr in einer Zeile mit mindestens 44×44 CSS-Pixel großen Touch-Zielen.
- Mehr: Neues Spiel/Neustart, Ton, Einstellungen/Komfort, Schließen beziehungsweise Weiterspielen. Touch, Maus, Tab, Pfeile, Home/End, Enter/Escape und die bestehende Controller-Bedienung bleiben verfügbar.

Desktop bietet Neues Spiel, Pause/Weiter, Menü, Ansicht, Ton und Einstellungen direkt. Die doppelten separaten Neustart-/Fortsetzen-Buttons entfallen zugunsten dieser gemeinsamen Aktionen. Mehr bewahrt weiterhin vorherigen Pausezustand, akzeptierte Richtungen und Restzeit bis zum nächsten Schritt; Hintergrundwechsel verhindert automatisches Fortsetzen. Einstellungen öffnen bewusst das pausierende Spielmenü.

## LCD und Geometrie

Das Akkuzeichen ist im Canvas samt exklusivem Strich-/Füllcode und im Bereitschaftsbildschirm entfernt. Signalbalken, Score, Modus und die bisherigen modusspezifischen Informationen bleiben erhalten: Classic mit HI/LV, Time Attack mit Restzeit/HI/LV, Zen mit Länge/Zeit/Kollisionen und Challenges mit Fortschritt. Der frei gewordene Headerbereich bleibt ruhig; keine neuen dekorativen Symbole.

Das Bitmap bleibt **320×244**, davon ein **26×17**-Spielfeld mit 12-Pixel-Zellen, 32-Pixel-Statusbereich und der bestehenden vierseitigen Randreserve. Canvas-Rahmen, Content-Box und Pixel-Skalierung bleiben erhalten. Keine Änderung von Engine, Spieltempo, Eingabepuffer, Kollisionsgrenzen oder Spielregeln.

Mobile Vollbild-Außenpolster werden um insgesamt vier Pixel reduziert. Das LCD bleibt proportional. Im Hochformat stehen die Richtungstasten über `margin-top:auto` am unteren sicheren Rand; der bestehende Größenfitter reserviert nur ihre tatsächliche Höhe, nicht den frei verteilten Auto-Abstand. Dadurch entsteht keine Rückkopplung der Höhenberechnung. `100dvh`, Safe Areas, VisualViewport und bestehende Resize-Beobachtung bleiben berücksichtigt. Unten gelten mindestens 12 Pixel beziehungsweise ein größerer Safe-Area-Inset.

Standard nutzt bis 90 Pixel breite Richtungstasten, Kompakt bis 80 Pixel für kürzere horizontale Reichweite. Ergonomisch behält größere Tasten; Normal/Groß bleiben erhalten. Im Querformat stehen LCD und Steuerung weiterhin nebeneinander. Die Handyansicht behält Gehäuseform und sämtliche 15 Tasten in drei Spalten und fünf Reihen, einschließlich der platzsparenden Querformat-Anordnung.

## Messbare Platzverteilung

Standard, normale Tasten, aktive Partie; Chromium, CSS-Pixel. Der Vergleich verwendet die bisherige Modern-Ansicht aus 0.7.2 als Basis. Die beiden alten Profilwerte liefern in 0.7.3 dieselben Messwerte und Canvas-Pixel.

| Viewport | Canvas-Breite 0.7.2 → 0.7.3 | Oberkante Steuerung vorher → nachher | Unterkante nachher |
| --- | --- | --- | --- |
| 320×568 | 302 → **306** | 337,61 → **451** | 556 |
| 360×740 | 342 → **346** | 383,55 → **623** | 728 |
| 390×844 | 372 → **376** | 418,03 → **727** | 832 |
| 430×932 | 412 → **416** | 457,33 → **815** | 920 |
| 844×390 | 388,19 → **393,44** | 165,50 → **165,50** | 270,50 |

Bei 390×844 wächst das Canvas auf ungefähr **376×286,7 CSS-Pixel**, rund **2,2 % mehr Fläche**. Die ungenutzte Fläche direkt unter der Steuerung sinkt von ungefähr 321 auf **12 Pixel**. Das Handy-LCD bleibt bei dieser Größe **330 Pixel breit**. Auf 320×568 bleibt das Handy-LCD etwa 256,16 Pixel breit; es wird durch die vereinheitlichte Oberfläche nicht kleiner.

**Geometrische Grenze:** Im Hochformat bleiben 14 Pixel Gesamtbreite für äußere Abstände und die geschützten LCD-/Gehäuseränder. Ein noch höheres LCD würde bei gleicher Breite das Verhältnis 320:244 verletzen. Deshalb wird die freie Höhe als Abstand zwischen oberem Displaybereich und unterer Daumenzone verteilt. Die gesamte leere Fläche verschwindet dadurch nicht; die Steuerung nutzt nun den zuvor freien unteren Bereich. Es wird keine künstliche Streckung oder vollständige Höhenfüllung behauptet.

Rohdaten mit jeweils 48 Zuständen: [0.7.2](screenshots/v073/before-metrics.json), [0.7.3](screenshots/v073/after-metrics.json). Enthalten sind sechs Viewports, beide alten Profilwerte, Handy/Vollbild und aktiv/pausiert. Automatisiert zusätzlich: Safe Areas, Drehung/Rückdrehung und alle drei Touch-Layouts sowie beide Tastengrößen.

## Vorher/Nachher

28 Aufnahmen aus echten Produktionsbuilds, isolierte synthetische Daten, eingefrorener Spieltakt. Bei Spielaufnahmen liegt eine validierte zusammenhängende Schlange in der gesamten untersten Reihe und allen vier Ecken. Die Vorher-Bilder wurden vor der Implementierung aus dem unveränderten 0.7.2-Build aufgenommen. 390×844, sofern nicht anders angegeben.

| Zustand | 0.7.2 | 0.7.3 |
| --- | --- | --- |
| Handy aktiv | [Vorher](screenshots/v073/before-handheld-active.png) | [Nachher](screenshots/v073/after-handheld-active.png) |
| Handy pausiert | [Vorher](screenshots/v073/before-handheld-paused.png) | [Nachher](screenshots/v073/after-handheld-paused.png) |
| Vollbild aktiv | [Vorher](screenshots/v073/before-full-active.png) | [Nachher](screenshots/v073/after-full-active.png) |
| Vollbild pausiert | [Vorher](screenshots/v073/before-full-paused.png) | [Nachher](screenshots/v073/after-full-paused.png) |
| Hauptmenü Handy | [Vorher](screenshots/v073/before-main-handheld.png) | [Nachher](screenshots/v073/after-main-handheld.png) |
| Hauptmenü Vollbild | [Vorher](screenshots/v073/before-main-full.png) | [Nachher](screenshots/v073/after-main-full.png) |
| Mehr Handy | [Vorher](screenshots/v073/before-more-handheld.png) | [Nachher](screenshots/v073/after-more-handheld.png) |
| Mehr Vollbild | [Vorher](screenshots/v073/before-more-full.png) | [Nachher](screenshots/v073/after-more-full.png) |
| Achievements Handy | [Vorher](screenshots/v073/before-achievements-handheld.png) | [Nachher](screenshots/v073/after-achievements-handheld.png) |
| Achievements Vollbild | [Vorher](screenshots/v073/before-achievements-full.png) | [Nachher](screenshots/v073/after-achievements-full.png) |
| Einstellungen Handy | [Vorher](screenshots/v073/before-settings-handheld.png) | [Nachher](screenshots/v073/after-settings-handheld.png) |
| Einstellungen Vollbild | [Vorher](screenshots/v073/before-settings-full.png) | [Nachher](screenshots/v073/after-settings-full.png) |
| Vollbild 320×568 aktiv | [Vorher](screenshots/v073/before-full-320x568-active.png) | [Nachher](screenshots/v073/after-full-320x568-active.png) |
| Vollbild 844×390 aktiv | [Vorher](screenshots/v073/before-full-844x390-active.png) | [Nachher](screenshots/v073/after-full-844x390-active.png) |

Reproduktion: `pnpm run build`, danach `node scripts/capture-v073.mjs`; Ausgaben unter `test-results/v073-after/`. `--before` benennt nur den Ausgabeordner: Für echte Vorher-Aufnahmen muss zuvor der **0.7.2-Build** in `dist/` bereitstehen. Die Option baut keine historische Version.

## Geänderte Dateien und Qualität

[Vollständige Dateiliste einschließlich aller Bilder und Messdaten](CHANGED_FILES_V073.md).

Die Laufzeitänderungen liegen in `src/main.ts`, `menu.ts`, `storage.ts`, `render.ts`, `style.css`, `mobile-layout.ts`, `index.html` und `package.json`. Engine, Modi, Snapshot-/Rekord-/Achievement-/Controller-Module, Audio und Service-Worker-Protokoll sind unverändert. Tests und Dokumentation wurden passend zur ausdrücklich entfernten Profilfunktion aktualisiert: frühere Profil-Umschaltprüfungen testen jetzt fehlende Auswahl und gleiche UI bei alten Daten. Alle übrigen Funktions-, Raster-, Kollisions- und Eingabeprüfungen bleiben aktiv.

Beim vollständigen Lauf wurde ein bestehender PWA-Testfehler aufgedeckt: In Playwright 1.64.1 prüft das verwendete `waitForFunction` den Rückgabewert des Prädikats, ohne dessen Promise abzuwarten. Die alten asynchronen Bedingungen konnten damit vor einem tatsächlich wartenden Worker weiterlaufen; der nachfolgende Zugriff auf `waiting.state` traf gelegentlich auf `null`. Die Prüfung verwendet nun `expect.poll` aus der bereits vorhandenen Playwright-Abhängigkeit. Sie wartet wirklich auf `installed`, hält den bisherigen Controller fest und prüft nach dem Verlassen der alten Seite aktivierten Worker, neuen Cache und Entfernung des alten Scope-Caches. Keine App-/SW-Änderung, keine Sleeps als Ersatz und keine deaktivierten Tests.

Ausgeführte Befehle und vollständige Ergebnisse: [Testbericht](TESTS.md). Neue Tests umfassen beide Profilmigrationen mit Save/Records/Achievements/Offline, gemeinsame Menüs, identische Raster, untere Touch-Zone sowie HUD und Akku-Abwesenheit in allen vier Modi und fünf Paletten. Positive Kontrollen bemalen den ehemaligen Akkubereich absichtlich und müssen die saubere Rasterprobe verletzen.

## Grenzen und Freigabe

Chromium und Playwright-WebKit unter Windows sind keine echten iPhone-Gerätetests. iOS-Browserleistenanimationen, Display-Zoom, physisches Controller-Pairing und eine auf Hardware installierte PWA wurden nicht geprüft. Safe Areas, dynamische Größenwechsel, Touch/Gesten und Standard-Gamepads werden simuliert; Vibration wird über die abgefangene Browser-API geprüft, nicht physisch gespürt. Auf hohen Smartphones bleibt der beschriebene geometrisch bedingte Zwischenraum bestehen. Dialoge und lange LCD-Menüs scrollen intern, die aktive Vollbild-Spielseite in den geprüften Größen nicht.

Freigabeweg: eigener Commit auf `feature/v0.7.3-unified-ui`, Draft-PR nach `main`, Kontrolle der GitHub-Actions-Prüfungen. Kein automatischer Merge, keine öffentliche Release-Erstellung und kein Pages-Deployment. Die bestehende manuelle Veröffentlichungsfreigabe bleibt unverändert.
