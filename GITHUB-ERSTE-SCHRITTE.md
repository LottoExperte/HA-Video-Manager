# HA Video-Manager: GitHub-Update V1.0.3

Repository: https://github.com/LottoExperte/HA-Video-Manager

Dieses Update baut auf V1.0.2 auf. Es blendet versteckte Begleitdateien (z. B. `._Film.mpg`) und Videodateien unter **1 MB (1.000.000 Byte)** aus. Ein erneutes Einlesen ersetzt den zentralen Katalog; nicht mehr vorhandene bzw. nicht mehr zugelassene Einträge verschwinden aus der Liste. **Es werden keine Originalvideos oder NFO-Dateien gelöscht.**

## V1.0.3 veröffentlichen

1. Das ZIP **HA-Video-Manager-v1.0.3-Katalogbereinigung.zip** entpacken und alle Dateien (nicht die ZIP-Datei) in das lokale Repository `C:\Users\Administrator\source\repos\HA-Video-Manager` kopieren; vorhandene Dateien ersetzen.
2. PowerShell öffnen:

   ```powershell
   cd C:\Users\Administrator\source\repos\HA-Video-Manager
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\UPDATE-GITHUB-v1.0.3.ps1"
   ```

   Das Skript prüft das GitHub-Ziel, die Version und das Tag und führt `git add`, `git commit`, `git push` sowie das Tagging in der richtigen Reihenfolge aus. Bei Fehlern bricht es ab.

3. Unter GitHub → **Releases** das Tag `v1.0.3` als Release veröffentlichen.
4. Im Home-Assistant-Marketplace V1.0.3 aktualisieren und **Home Assistant neu starten**.
5. Im Home-Assistant-Video-Manager auf **„Filme neu einlesen“** klicken. Bei einer alten Ansicht im Browser Strg+Umschalt+R.

## Einstellung der Mindestgröße (optional)

In `/config/configuration.yaml` gilt standardmäßig die Grenze von 1 MB. Wenn du sie ändern möchtest:

```yaml
hoffmann_video_ha:
  media_root: /media/Videorecorder/Backup/Video
  min_video_bytes: 1000000
```

Die Zahl bedeutet Byte. Auch bei `min_video_bytes: 0` werden versteckte Dateien wie `._Film.mpg` ignoriert.

**Wichtig:** Unter `/media/Videorecorder/...` fehlt kein `local`. `local` gehört zum Home-Assistant-Medien-URL-Pfad, nicht normalerweise zum Dateisystempfad.
