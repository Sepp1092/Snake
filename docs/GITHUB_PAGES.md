# GitHub Pages – Freigabe und erste Testveröffentlichung

Version 0.5.1 ist lokal fertig und für GitHub Pages vorbereitet. Es ist derzeit kein GitHub-Remote im Projekt eingetragen; weder Repository-Upload noch Veröffentlichung wurden vorgenommen. Diese Anleitung führt die spätere Freigabe konkret aus.

## 1. GitHub-Repository vorbereiten

Ein Repository beispielsweise namens **snake-3310** anlegen. Für einen unkomplizierten Test mit GitHub Free ein öffentliches Repository verwenden. Keine Zugangsdaten, persönlichen Tokens, Browserprofile oder lokalen Speicherstände hochladen. Die `.gitignore` schließt `node_modules/`, `dist/`, `.pnpm-store/` und `test-results/` aus. Die dokumentierten Screenshots in `docs/screenshots/` gehören zum Quellcode.

Den Projektstand einschließlich `.github/workflows/pages.yml`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `src/`, `public/`, `scripts/` und `tests/` auf den Standardbranch des Repositories übertragen. Die CI benötigt den vollständigen Quellcode, nicht nur die ursprüngliche HTML-Datei.

Beispielbefehle im Projektordner, Platzhalter vorher ersetzen:

```sh
git add .
git commit -m "Prepare Snake 3310 0.5.1 mobile PWA release"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/snake-3310.git
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

Diese Ereignisse haben keine Deployment-Freigabe und veröffentlichen keine Website. Ein manueller Lauf ohne gesetztes Freigabefeld prüft ebenfalls nur. Die GitHub-Runner-Ausführung wurde hier nicht ausgeführt; lokal bestehen dieselben Projektskripte. Der Workflow wurde als YAML geparst und auf Freigabebedingungen und Artefaktpfad geprüft.

## 4. Nach ausdrücklicher Freigabe veröffentlichen

1. **Actions → Verify and release GitHub Pages → Run workflow** öffnen.
2. Den **Standardbranch** auswählen, in diesem Beispiel `main`.
3. Das Feld **I approve publishing this version to GitHub Pages** aktivieren. Es ist standardmäßig aus.
4. Workflow starten und alle Prüfungen abwarten. Falls Reviewer eingerichtet sind, das `github-pages`-Deployment anschließend prüfen und genehmigen.
5. Der Upload-Schritt verpackt ausschließlich **`dist/`**; der Deployment-Job wartet auf erfolgreiche Prüfung. Die nötigen kurzlebigen GitHub-Berechtigungen werden vom Workflow bereitgestellt. Kein eigener Token/Secret nötig.
6. Nach erfolgreichem Job die von GitHub ausgegebene `page_url` öffnen. Für das Beispiel lautet das Schema `https://DEIN-NAME.github.io/snake-3310/` – dies ist ein Platzhalter, keine bereits veröffentlichte Adresse.

Pushes nach der ersten Veröffentlichung ersetzen die Live-Version ebenfalls nicht automatisch. Jedes Release benötigt wieder den manuellen Freigabelauf.

## 5. Pfade und Abnahme auf der endgültigen Adresse

Vite bleibt bei **`base: './'`**. Manifest, Icons, Skripte, CSS und Service Worker verwenden relative Pfade. Ein normaler Projektpfad wie `/snake-3310/` wird unterstützt und ist lokal automatisiert getestet. Die URL mit abschließendem Slash aufrufen. `start_url`, `scope` und Manifest-`id` bleiben relativ und stabil.

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
