# Hoffmann Video-Manager für Home Assistant

Eine schlanke, bildfreie Videothek für Home Assistant. Version **1.0.0** (erste Testversion).

Diese Integration liest vorhandene Filmdateien und die zugehörigen XML-NFO-Dateien aus einer bereits in Home Assistant eingebundenen Medienfreigabe. Der eigene Video-Manager kann weiter für die Metadatenpflege verwendet werden.

- **Keine KI-Abfragen, keine Cover, kein eigener Benutzer-Login**
- Schnelle Tabelle mit Suche, Filtern und Sortierung
- NFO: Titel, Jahr, Genre, Inhalt, Regie, Darsteller, Laufzeit, IMDb-ID, Favoriten und Gesehen-Status
- Filme direkt im Home-Assistant-Browser starten (über `media_source/resolve_media`)
- **Videos und NFO-Dateien werden ausschließlich gelesen, niemals verändert**
- Zentrale Katalog-Zwischenspeicherung in Home Assistant; manuell neu einlesen

## Voraussetzung

Home Assistant **2026.11 oder neuer** mit Marketplace. Die Videos müssen bereits unter **Medien → Meine Medien** erreichbar und im jeweiligen Browser abspielbar sein. Eine vorhandene SMB/Samba-Medienfreigabe ist ausreichend.

## Installation über Marketplace

1. Dieses Repository **öffentlich** auf GitHub bereitstellen. Das Paket enthält ein echtes Git-Repository sowie den Veröffentlichungsassistenten `REPOSITORY-VEROEFFENTLICHEN.ps1`. Siehe `GITHUB-ERSTE-SCHRITTE.md`.
2. Home Assistant → **Einstellungen → Marketplace** → **Aus Link hinzufügen**.
3. Als GitHub-Link `https://github.com/LottoExperte/HA-Video-Manager` eintragen. Home Assistant fragt bei Bedarf nach der GitHub-Verbindung. Typ **Integration** auswählen, falls abgefragt.
4. Repository öffnen und **Installieren** auswählen.
5. In der Home-Assistant-Datei `/config/configuration.yaml` einmalig ergänzen:

```yaml
hoffmann_video_ha:
  media_root: /media/Videorecorder/Backup/Video
```

6. Home Assistant **neu starten** und den Seitenleisteneintrag **Video-Manager** öffnen. Beim ersten Aufruf wird die Filmliste gescannt.

**Wichtig:** `/media/Videorecorder/Backup/Video` ist der Dateisystempfad; `/media/local/...` ist dagegen der Browser-URL-Pfad. `local` gehört normalerweise **nicht** in `media_root`.

Wenn dieselbe Integration bereits manuell unter `/config/custom_components/hoffmann_video_ha` installiert wurde, vor einem Wechsel zu Marketplace-Konfiguration und Home Assistant sichern, und keine zweite Kopie parallel installieren. Der Marketplace verwaltet dieselben Integrationsdateien.

## NFO-Dateien

Beispiel:

```text
/media/Videorecorder/Backup/Video/Trickfilme/
    Der-König-der-Löwen-1994.mkv
    Der-König-der-Löwen-1994.nfo
```

Die `.nfo` muss den gleichen Basisdateinamen besitzen. `movie.nfo` wird ebenfalls unterstützt, falls der Ordner nur eine Videodatei enthält. Ohne NFO werden Titel und Erscheinungsjahr nach Möglichkeit aus dem Dateinamen abgeleitet.

## Wiedergabe und Sicherheit

Beim Abspielen fordert das Panel über die angemeldete Home-Assistant-Sitzung einen **frischen signierten Medienlink** an. Der Link wird nicht im Katalog gespeichert. Home Assistant nutzt automatisch die Adresse, unter der es aufgerufen wurde – lokal oder über den vorhandenen externen Zugang.

Die Integration bringt **keine separaten Benutzer- oder Filmfreigaben** mit. Sie prüft die Anmeldung über die Home-Assistant-WebSocket-Schnittstelle, ist aber **keine eigene Zugriffsschranke pro Film**. Benutzer mit Zugang zur Oberfläche können den zentralen Katalog sehen; individuelle Freigaben sollten nicht vorausgesetzt werden.

Nicht alle Browser spielen MKV/AVI-Dateien oder darin enthaltene Codecs ab. Ein Dateiformatfehler ist kein Berechtigungsfehler.

## Updates

Weitere Versionen werden als Änderung im GitHub-Repository und **GitHub-Release** mit Versionstag veröffentlicht, beispielsweise `v1.0.1`. Anschließend zeigt Home Assistant über den Marketplace die verfügbaren Updates an. Nach Änderungen an der Python-Integration Home Assistant neu starten.

## Fehlerdiagnose

- Kein Katalog: In Home Assistant unter Terminal `ls -la /media/Videorecorder/Backup/Video` prüfen.
- Fehlender Menüpunkt: Konfiguration prüfen, Home Assistant neu starten, Home-Assistant-Protokolle ansehen.
- Wiedergabe funktioniert nur unter **Medien**: Fehlermeldung aus dem Video-Manager notieren; keine `authSig`-URLs, Zugangsdaten oder Tokens weitergeben.
- NFO geändert: Im Panel **Filme neu einlesen** anklicken.

**Status:** Python-Syntax, JavaScript-Syntax und NFO-/Scan-Tests lokal geprüft; ein End-to-End-Test in der konkreten Home-Assistant-Installation steht noch aus.
