# HA Video-Manager: GitHub und Home Assistant

Das öffentliche GitHub-Repository **existiert bereits**:
https://github.com/LottoExperte/HA-Video-Manager

Das erste Release ist `v1.0.0`. Das aktuelle Update wird deshalb `v1.0.1`
und bündelt alle Korrekturen und neuen Funktionen seit `v1.0.0`.

## Update V1.0.1 veröffentlichen

1. Das ZIP **HA-Video-Manager-v1.0.1-inkl-MOV-TS-Bewertung.zip** entpacken
   und die darin enthaltenen Dateien unter
   `C:\Users\Administrator\source\repos\HA-Video-Manager`
   über die vorhandenen Dateien kopieren.
2. Im lokalen Repository PowerShell ausführen:

   ```powershell
   cd C:\Users\Administrator\source\repos\HA-Video-Manager
   git status
   git add .
   git commit -m "HA Video-Manager v1.0.1: Formatauswahl, TS, MOV und Bewertung"
   git push origin main
   git tag v1.0.1
   git push origin v1.0.1
   ```
3. Auf GitHub unter **Releases** das Release `v1.0.1` mit dem
   **bereits vorhandenen Tag** `v1.0.1` veröffentlichen.
4. Das Update im Home-Assistant-Marketplace einspielen und Home Assistant
   neu starten. Im Video-Manager anschließend **Filme neu einlesen**.

**Keine Version überspringen:** Vom bisher veröffentlichten `v1.0.0` geht es jetzt zu `v1.0.1`.

Hinweis: Wenn das Release bereits anders erstellt wurde, vor einer erneuten
Vergabe des Tags zunächst den Zustand auf GitHub prüfen. Tags nicht
gewaltsam überschreiben.

## Home Assistant konfigurieren (einmalig)

In `/config/configuration.yaml`:

```yaml
hoffmann_video_ha:
  media_root: /media/Videorecorder/Backup/Video
```

`local` gehört normalerweise nur zum Medien-URL-Schema, nicht in den
Dateisystempfad. Nach der Konfiguration Home Assistant neu starten.
