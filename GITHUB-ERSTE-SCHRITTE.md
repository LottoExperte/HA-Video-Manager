# HA Video-Manager – GitHub-Update V1.0.5

Dieses Paket baut auf V1.0.4 auf und enthält weiterhin alle vorhandenen Funktionen, insbesondere NFO-Titel, IMDb-Bewertungen, Videoformate, Bereinigung und Zufallsfilm.

## Neu in V1.0.5

Der Laufzeitfilter ist wie bei TVHeadend nach Bereichen gruppiert:

- 0–30 Minuten (einschließlich 30:00)
- 30–60 Minuten (über 30:00 bis einschließlich 60:00)
- 60–90 Minuten (über 60:00 bis einschließlich 90:00)
- 90–180 Minuten (über 90:00 bis einschließlich 180:00)
- Über 180 Minuten
- Laufzeit unbekannt / Alle Laufzeiten

Die Auswahl ist mit Suche, Genre, Bewertung, Formaten und Zufallsfilm kombinierbar. Die NFO-Dateien werden nicht verändert. Ein erneutes Einlesen ist für diese reine Oberflächenänderung nicht erforderlich.

## Veröffentlichen

1. Den **Inhalt** von `HA-Video-Manager-v1.0.5-Laufzeitbereiche.zip` in das bereits bestehende lokale Repository kopieren, z. B. `C:\Users\Administrator\source\repos\HA-Video-Manager` (Dateien überschreiben).
2. PowerShell im Repository öffnen:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\UPDATE-GITHUB-v1.0.5.ps1"
   ```

   Alternativ manuell in genau dieser Reihenfolge: `git add .`, `git commit -m "HA Video-Manager v1.0.5"`, `git push origin main`, `git tag v1.0.5`, `git push origin v1.0.5`.
3. Auf https://github.com/LottoExperte/HA-Video-Manager/releases/new das **bereits gepushte Tag `v1.0.5` auswählen** und das Release veröffentlichen.
4. In Home Assistant über den Marketplace aktualisieren. Home Assistant neu starten und die Seite nötigenfalls mit Strg+Umschalt+R neu laden.

Das lokale Repository bleibt unter deiner Kontrolle. Die tatsächliche Home-Assistant-Installation kann hier nicht live getestet werden.
