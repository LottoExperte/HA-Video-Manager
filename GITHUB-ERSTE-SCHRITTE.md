# GitHub-Repository veröffentlichen – einmaliger Schritt

Das ZIP enthält **ein echtes Git-Repository**: einschließlich des versteckten Ordners `.git`, des Branches `main` und des Versions-Tags `v1.0.0`. Es ist noch **nicht** auf GitHub online.

## A. Empfohlen: automatisiert unter deinem Konto `LottoExperte`

1. ZIP in einen eigenen Ordner entpacken, dabei auch `.git` beibehalten.
2. Auf Windows **Git** und **GitHub CLI (`gh`)** installieren, falls noch nicht vorhanden:

   ```powershell
   winget install --id Git.Git -e
   winget install --id GitHub.cli -e
   ```

   Danach ein neues PowerShell-Fenster öffnen.
3. PowerShell im entpackten Repositoryordner öffnen und ausführen:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\REPOSITORY-VEROEFFENTLICHEN.ps1"
   ```

4. Gegebenenfalls die GitHub-Anmeldung im Browser durchführen. Das Skript kontrolliert ausdrücklich, dass du als `LottoExperte` angemeldet bist.
5. Die öffentliche Veröffentlichung mit **JA** bestätigen.

Das Skript legt `https://github.com/LottoExperte/HA-Video-Manager` an, überträgt den fertigen Git-Verlauf und veröffentlicht das Release `v1.0.0`. Falls du das Repository im Browser bereits **leer** angelegt hast, wird es befüllt. Ein Repository mit vorhandenen Commits/Dateien wird **nicht überschrieben**.

Das Skript benötigt deine eigene GitHub-Anmeldung. Es enthält keine Zugangsdaten.

## B. Alternative: nur über die GitHub-Webseite

1. Unter https://github.com/new ein leeres Repository `HA-Video-Manager` als **Public** erstellen. Kein zusätzliches README, keine Lizenz und keine `.gitignore` auf GitHub anlegen (Repository muss leer sein).
2. Die **Dateien aus dem entpackten ZIP** hochladen; die ZIP-Datei selbst NICHT hochladen. Den Ordner `.git` NICHT mit hochladen. Achte auf `hacs.json` direkt im Repository-Hauptverzeichnis und die Ordnerstruktur `custom_components/hoffmann_video_ha/...`.
3. GitHub: **Releases** > **Create a new release** > Tag `v1.0.0` erstellen und veröffentlichen.

*Hinweis:* Die Funktion „GitHub Importer“ importiert bestehende **online erreichbare Git-Repositories** und akzeptiert kein ZIP als Git-Repository. Deshalb enthält dieses Paket den optionalen Veröffentlichungsassistenten.

## C. Installation in Home Assistant 2026.11+

1. Home Assistant öffnen: **Einstellungen > Marketplace > Aus Link hinzufügen**.
2. Link einfügen: `https://github.com/LottoExperte/HA-Video-Manager`.
3. Bei Bedarf GitHub mit Home Assistant verbinden. Typ: **Integration**.
4. Integration **Installieren**.
5. Einmalig in `/config/configuration.yaml`:

   ```yaml
   hoffmann_video_ha:
     media_root: /media/Videorecorder/Backup/Video
   ```

   `local` gehört nicht in den Dateisystempfad, sondern zur Medien-URL `/media/local/...`.
6. Home Assistant neu starten; links **Video-Manager** öffnen.

**Wichtig:** Installiere nicht parallel eine manuell kopierte und eine Marketplace-Version derselben Integration. Home-Assistant-Konfiguration vorher sichern.

## Spätere Updates

Neue Version in `custom_components/hoffmann_video_ha/manifest.json` setzen, Git-Änderungen pushen, neues GitHub-Release z. B. `v1.0.1` veröffentlichen. Der Marketplace zeigt Updates an.
