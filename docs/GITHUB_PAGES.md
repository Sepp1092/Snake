# v0.7.2 – Entwicklungsbranch und Freigabe

Basis: `main` auf `3a44d40` (0.7.1), Branch `feature/v0.7.2-mobile-toolbar`. Nach erfolgreichen Unit-, Build- und vollständigen Browserprüfungen folgt ein eigener Commit mit Draft-PR nach `main`. Kein automatischer Merge und keine Pages-Veröffentlichung. Die vorhandenen Workflow-Bedingungen werden nicht verändert. [Toolbar-/Layoutbericht](MOBILE_TOOLBAR_V072.md) · [Tests](TESTS.md).

## Historische Entwicklungsfreigabe v0.7

Basis des neuen Branches `feature/v0.7-achievements-controls` ist der aktualisierte GitHub-main-Stand `79c00f9` einschließlich der v0.6.1-Korrekturen. Nach lokalen Abschlussprüfungen werden die Änderungen committed und dürfen gemäß Auftrag als Entwicklungsbranch mit Review-PR veröffentlicht werden. Das ist keine Freigabe für einen Merge oder ein Pages-Deployment.

Der vorhandene Workflow prüft Pushes und Pull Requests. Veröffentlichung bleibt an den expliziten manuellen Workflow-Aufruf mit Publish-Zustimmung auf dem Standardbranch gebunden; der Feature-Branch kann damit kein Pages-Release auslösen. Diagnoseartefakte enthalten künstliche Testdaten, keine Benutzerprofile oder Zugangsdaten. Echte iPhone-/Controller-Gerätetests vor einer separaten Release-Freigabe durchführen. [Entwicklungsbericht](DEVELOPMENT_V07.md), [Tests](TESTS.md).

Die folgenden Abschnitte dokumentieren frühere Entwicklungs- und Veröffentlichungsstände; ihre Versionsangaben sind historisch.

---

## Historische Entwicklungsfreigabe v0.6

Der lokale Entwicklungscheckout basiert auf `Sepp1092/Snake` Commit `059debfdb68502d668092df4c2c434be9333dd2d`. Alle Änderungen liegen auf `feature/v0.6-game-modes`; sie wurden nicht auf GitHub gepusht, nicht mit `main` zusammengeführt und nicht veröffentlicht. Die öffentliche v0.5.2 bleibt unverändert.

Empfohlene Reihenfolge:

1. Lokalen Diff, Modus-/Statistik-Screenshots und Testbericht prüfen. Auf echten Smartphones und Safari kurz spielen; eine kopierte v0.5.2-Partie in einer Testumgebung migrieren.
2. Den Feature-Stand bewusst committen und den Feature-Branch pushen; einen Review-PR gegen `main` eröffnen. Ein Push führt im vorhandenen Workflow nur Prüfungen aus.
3. Tests im GitHub-Runner bestätigen. Erst nach ausdrücklicher Freigabe den PR mergen.
4. Veröffentlichung separat freigeben: manueller Pages-Workflow vom Standardbranch mit gesetztem Veröffentlichungsfeld. Der Workflow selbst blieb unverändert; ein Feature-Branch kann damit nicht veröffentlichen.
5. Nach Freigabe auf der endgültigen HTTPS-Adresse Modusauswahl, Statistik, Offline-Start und Migration prüfen. Dasselbe Origin beibehalten; vorhandene App-Tabs regulär schließen, bevor ein wartendes Update übernimmt.

Snapshot-Version 2 wird von v0.5.2 nicht unterstützt. Ein bewusstes Rollback sollte deshalb erst nach Beenden einer aktiven v0.6-Partie erfolgen. Datenformat und Grenzen: [STORAGE.md](STORAGE.md).

Die folgende Anleitung beschreibt den bestehenden Pages-Ablauf aus v0.5.2 und ist kein ausgeführtes Deployment.

---

# GitHub Pages – Freigabe und erste Testveröffentlichung

Version 0.5.2 ist als Quellprojekt für einen erneuten Build und die GitHub-Pages-Freigabe vorbereitet. Das bestehende GitHub-Repository ist `Sepp1092/Snake`; die folgende Anleitung beschreibt das Update über GitHub Desktop.

## 1. GitHub-Repository vorbereiten

Verwende das bereits vorhandene Repository **Sepp1092/Snake**. Für einen unkomplizierten Test mit GitHub Free ein öffentliches Repository verwenden. Keine Zugangsdaten, persönlichen Tokens, Browserprofile oder lokalen Speicherstände hochladen. Die `.gitignore` schließt `node_modules/`, `dist/`, `.pnpm-store/` und `test-results/` aus. Nur frisch erzeugte Screenshots des Bytecoil-Designs dürfen in `docs/screenshots/` veröffentlicht werden.

Den Projektstand einschließlich `.github/workflows/pages.yml`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `src/`, `public/`, `scripts/` und `tests/` auf den Standardbranch des Repositories übertragen. Die CI benötigt den vollständigen Quellcode, nicht nur die ursprüngliche HTML-Datei.

Alternative Git-Befehle (bei GitHub Desktop nicht erforderlich):

```sh
git add .
git commit -m "Prepare Bytecoil 0.5.2 mobile PWA release"
git branch -M main
git remote add origin https://github.com/Sepp1092/Snake.git
git push -u origin main
```

`remote add` nur verwenden, wenn noch kein Remote existiert. Anmeldung über den normalen GitHub-/Git-Anmeldeablauf vornehmen; keine Zugangsdaten in URL, Dateien oder Workflow eintragen. Das Hochladen des Codes ist bei einem öffentlichen Repository bereits öffentlich, auch wenn die Website noch nicht veröffentlicht ist.

## 2. Repository-Einstellungen

1. Auf GitHub **Settings → Actions → General** öffnen und die im Workflow verwendeten GitHub Actions zulassen. Eine Organisation kann zusätzliche Richtlinien vorgeben.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions** wählen. Kein `docs/`-Ordner und kein `gh-pages`-Branch als Quelle nötig.
3. Falls verfügbar unter **Settings → Environments → github-pages** einen erforderlichen Reviewer und die erlaubten Deployment-Branches einstellen. Der Workflow selbst veröffentlicht ausschließlich vom jeweiligen Repository-Standardbranch und nur nach manueller Auswahl.
4. Für die erste Testveröffentlichung die normale `github.io`-Adresse verwenden. Unter Pages **Enforce HTTPS** aktivieren beziehungsweise die automatisch bereitgestellte HTTPS-Adresse verwenden. Eine eigene Domain ist für den Test nicht erforderlich.

## 3. Prüfungen ohne Veröffentlichung

Ein Push oder Pull Request startet den Job **verify**:

1. Node.js 24.19.0 und pnpm 11.25.0 installieren.
2. `pnpm install --frozen-lockfile` – reproduzierbare Abhängigkeiten.
3. `pnpm run test` – Spielregeln, Speicherung und Eingaben.
4. `pnpm run build` – TypeScript-Prüfung, Vite und versionierter Offline-Cache.
5. Playwright Chromium inklusive Systemabhängigkeiten installieren.
6. `pnpm run test:browser` – Browser, Viewports, Touch, PWA-Updates und Offline-Neustart.

Diese Ereignisse haben keine Deployment-Freigabe und veröffentlichen keine Website. Ein manueller Lauf ohne gesetztes Freigabefeld prüft ebenfalls nur. Die GitHub-Runner-Ausführung wurde hier nicht ausgeführt; lokal bestehen dieselben Projektskripte. Die GitHub-Actions-Konfiguration sieht manuelle Freigabe und Artefaktpfad `dist/` vor; eine v0.5.2-Ausführung auf GitHub steht aus.

## 4. Nach ausdrücklicher Freigabe veröffentlichen

1. **Actions → Verify and release GitHub Pages → Run workflow** öffnen.
2. Den **Standardbranch** auswählen, in diesem Beispiel `main`.
3. Das Feld **I approve publishing this version to GitHub Pages** aktivieren. Es ist standardmäßig aus.
4. Workflow starten und alle Prüfungen abwarten. Falls Reviewer eingerichtet sind, das `github-pages`-Deployment anschließend prüfen und genehmigen.
5. Der Upload-Schritt verpackt ausschließlich **`dist/`**; der Deployment-Job wartet auf erfolgreiche Prüfung. Die nötigen kurzlebigen GitHub-Berechtigungen werden vom Workflow bereitgestellt. Kein eigener Token/Secret nötig.
6. Nach erfolgreichem Job die von GitHub ausgegebene `page_url` öffnen. Für das Beispiel lautet das Schema `https://sepp1092.github.io/Snake/` – dies ist ein Platzhalter, keine bereits veröffentlichte Adresse.

Pushes nach der ersten Veröffentlichung ersetzen die Live-Version ebenfalls nicht automatisch. Jedes Release benötigt wieder den manuellen Freigabelauf.

## 5. Pfade und Abnahme auf der endgültigen Adresse

Vite bleibt bei **`base: './'`**. Manifest, Icons, Skripte, CSS und Service Worker verwenden relative Pfade. Ein normaler Projektpfad wie `/Snake/` wird unterstützt war mit der vorherigen Version automatisiert getestet; die neue Version muss nach dem Update erneut geprüft werden. Die URL mit abschließendem Slash aufrufen. `start_url`, `scope` und Manifest-`id` bleiben relativ und stabil.

Auf der endgültigen Website prüfen:

- Seite und Icons laden über HTTPS; keine 404-Fehler im Netzwerkfenster.
- Eine Runde spielen, pausieren und vollständig schließen. Erneut öffnen: gleiche Partie, pausiert.
- Einmal vollständig online laden und den Worker aktivieren lassen; danach Flugmodus/Offline einschalten und neu öffnen.
- Installation nach [PWA-Anleitung](PWA.md#installation-auf-android-iphone-und-windows).
- Ein späteres manuelles Release unter derselben Adresse testen: aktive Runde wird nicht überraschend unterbrochen; nach Schließen aller App-Tabs/Fenster neue Version öffnen.

## Daten und bekannte Grenzen

Normale Builds und Deployments löschen keine lokalen Werte. Format und Schlüssel von 0.5 bleiben unverändert. Bei derselben Origin werden Einstellungen, Rekord und valide gespeicherte Partie übernommen. Localhost-Daten werden vom Browser **nicht** nach `github.io` übertragen. Auch ein Wechsel von Benutzer/Domain/Protokoll/Port kann einen anderen Speicherbereich bedeuten. Mehrere Snake-Projekte unter derselben Origin teilen sich die bisherigen lokalen Schlüssel; dafür ist weiterhin kein Mehrtab-/Mehrprojekt-Schutz implementiert.

Ein defekter oder unbekannter Snapshot wird zur Stabilität verworfen. Gelöschte Browserdaten, privater Modus, Betriebssystem-Speicherbereinigung und fehlgeschlagene Speicherzugriffe sind keine garantierten Update-Szenarien. Installations- und Safari-Hardwaretests bleiben nach der Veröffentlichung erforderlich.

## Quellen für die Workflow-Konfiguration

[GitHub: Custom workflows for Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Pages-Quelle konfigurieren](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [Deploy-Pages-Action](https://github.com/actions/deploy-pages).

**Hinweis zur Namensänderung:** Das GitHub-Repository heißt weiterhin `Snake`. Ein Repository-Rename ist für das Bytecoil-Branding nicht erforderlich.
