# Bytecoil – Retro Snake: Screenshots

Die Bilder der früheren Version wurden entfernt, da sie fremde Marken- und Designmerkmale zeigen konnten.

Die aktuellen Screenshots sind nach dem Markenbereinigungs-Update neu zu erzeugen:

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm exec playwright install chromium
pnpm run test:browser
```

Die Screenshots liegen danach in `test-results/`. Nur neu erstellte, visuell überprüfte Bilder dürfen unter `docs/screenshots/` übernommen werden. Für die PWA bzw. GitHub Pages ist die Veröffentlichung von Screenshots nicht erforderlich.

Die dokumentierten Viewport-Abmessungen und Messwerte in den älteren Testprotokollen beziehen sich auf Version 0.5.1 und sind nach dem Styling-Update erneut zu überprüfen.
