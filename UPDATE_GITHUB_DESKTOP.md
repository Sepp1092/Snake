# Bytecoil – Retro Snake 0.5.2 in GitHub Desktop übernehmen

1. Repository `Sepp1092/Snake` in GitHub Desktop öffnen.
2. Zur Sicherheit vor dem Ersetzen der Dateien ein lokales Backup erstellen.
3. Über **Repository → Show in Explorer** den geklonten Repository-Ordner öffnen.
4. Alle Dateien **innerhalb** des ZIP-Ordners `Snake/` in den Repository-Ordner kopieren (nicht einen zusätzlichen verschachtelten `Snake`-Ordner erzeugen). Die `.git`-Struktur unverändert lassen.
5. Im Repository die alten Dateien `reference/Snake_3310_v0.3.html` und den gesamten bisherigen Ordner `docs/screenshots/` löschen, soweit noch vorhanden. Andernfalls bleiben alte Logos und Bilder öffentlich.
6. In GitHub Desktop alle Änderungen, insbesondere die **Löschungen**, kontrollieren. Commit `Bytecoil Retro Snake v0.5.2 – branding update` erstellen und `Push origin` klicken.
7. Auf GitHub `Actions → Verify and release GitHub Pages` öffnen. Den grünen `verify`-Job abwarten. Wenn ein Test fehlschlägt, nicht veröffentlichen.
8. Nach erfolgreicher Prüfung den Workflow manuell über `Run workflow` auf `main` mit dem Feld **I approve publishing this version to GitHub Pages** freigeben.
9. App unter `https://sepp1092.github.io/Snake/` aufrufen (nur nach erfolgreichem Deployment). Eventuell vorhandene Service-Worker-Caches im Browser beachten, falls noch eine alte Version geladen wird.

**Achtung:** Da `Sepp1092/Snake` öffentlich ist, bleiben alte Markeninhalte auch nach dem Löschen aus dem aktuellen Stand über frühere Git-Commits sichtbar. Für eine Veröffentlichung ohne diese Git-Historie empfiehlt sich ein **neues Repository mit sauberem Erst-Commit**. Ein bloßer Repository-Rename entfernt die Historie nicht. Forks und Kopien können weiterhin existieren.

**Markenhinweis:** `Bytecoil` wurde nicht abschließend markenrechtlich freigegeben; vor einer breiten Veröffentlichung eine Markenrecherche und ggf. juristische Prüfung durchführen.
