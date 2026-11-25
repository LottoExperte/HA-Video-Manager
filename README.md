# Hoffmann Video-Manager für Home Assistant

Eine schlanke, bildfreie Videothek für Home Assistant. Version **1.0.1** (Testversion).

Diese Integration liest vorhandene Filmdateien und die zugehörigen XML-NFO-Dateien aus einer bereits in Home Assistant eingebundenen Medienfreigabe. Die Pflege und Aktualisierung der Filmdaten erfolgt weiterhin im **Hoffmann Video-Manager**.

- **Keine KI-Abfragen, keine Cover, kein eigener Benutzer-Login**
- Schnelle Tabelle mit Suche, Filtern und Sortierung; **ausschließlich Videodateien als Listeneinträge**
- **Dateiformat-Auswahl mit Häkchen:** AVI, MPG/MPEG, MP4, MKV, TS, **MOV** und weitere vorhandene Formate; alle Formate beim ersten Start aktiviert, Auswahl bleibt im jeweiligen Browser gespeichert
- Bewertungsanzeige bereits in der Filmliste; nach Bewertung sortieren
- **Filmtitel statt Dateiname:** Titel aus der passenden NFO wird in Tabelle, Suche und Wiedergabe angezeigt; Dateiname nur als Ersatz, wenn kein NFO-Titel vorliegt. Im Detailfenster steht die Titelquelle.
- NFO: Titel, Jahr, Genre, Inhalt, Regie, Darsteller, Laufzeit, IMDb-ID, IMDb-Bewertung, gekennzeichnete KI-Schätzung, Favoriten und Gesehen-Status
- Filme direkt im Home-Assistant-Browser starten (über `media_source/resolve_media`)
- **Videos und NFO-Dateien werden ausschließlich gelesen, niemals verändert**
- Zentrale Katalog-Zwischenspeicherung in Home Assistant; manuell neu einlesen

## Zusammenspiel mit dem Video-Manager von Hoffmann Software

Der **HA-Video-Manager** ist bewusst eine schlanke **Anzeige- und Wiedergabeoberfläche** für Home Assistant. Für die **Verwaltung und Aktualisierung der Filmdaten** gibt es den eigenständigen [**Hoffmann Video-Manager**](https://video.hoffmann-software.de/).

- Im **Hoffmann Video-Manager** können Filme verwaltet sowie Titel, Jahr, Beschreibung, Genre und IMDb-Verknüpfungen mithilfe der vorhandenen KI-/Wikidata-Suche gepflegt werden.
- Die aktualisierten Metadaten werden über **NFO-Zusatzdateien im selben Ordner wie die Filmdateien** bereitgestellt. Wichtig: Die NFO-Dateien müssen für Home Assistant über die eingebundene Medienfreigabe erreichbar sein.
- Der **HA-Video-Manager** liest diese Daten nur ein und bietet eine schnelle Suche, Filter und Wiedergabe im Browser. Er benötigt **keine eigene KI-Anbindung** und schreibt nichts in die Film- oder NFO-Dateien.
- Nach Änderungen der NFO-Dateien mit dem Hoffmann Video-Manager im Home-Assistant-Video-Manager **„Filme neu einlesen“** wählen, damit die aktualisierten Angaben im Katalog erscheinen.

Die Programme können getrennt verwendet werden. Auch Filme **ohne NFO-Datei** erscheinen im HA-Video-Manager anhand ihres Dateinamens.

## Voraussetzung

Home Assistant **2026.11 oder neuer** mit Marketplace. Die Videos müssen bereits unter **Medien → Meine Medien** erreichbar und im jeweiligen Browser abspielbar sein. Eine vorhandene SMB/Samba-Medienfreigabe ist ausreichend.

## Installation über Marketplace

1. Das bereits veröffentlichte Repository [LottoExperte/HA-Video-Manager](https://github.com/LottoExperte/HA-Video-Manager) auf GitHub öffnen.
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

## Dateiformate, MOV und TS-Aufnahmen

Die Liste zeigt nur Videodateien. Über die Kontrollkästchen unter **Dateiformate** lassen sich AVI, MPG/MPEG, MP4/M4V, MKV, TS, **MOV** sowie weitere vorhandene Dateitypen gezielt ein- oder ausblenden. Die Zahlen in Klammern zeigen, wie viele Dateien des jeweiligen Typs **im gescannten Katalog** sind. **Alle** schaltet alle Formate wieder ein. Die Auswahl filtert nur im Browser und ändert keine Dateien oder Metadaten.

`.ts` (auch `.TS`), `.mov` (auch `.MOV`), `.m2ts`, `.mts`, `.m2t`, `.trp` und `.tp` werden beim Scan berücksichtigt. Nach einem Update bitte Home Assistant neu starten, im Video-Manager **Filme neu einlesen** wählen und gegebenenfalls die Seite neu laden. Wenn **TS (0)** angezeigt wird, den tatsächlichen Dateinamen und die Position unterhalb des konfigurierten `media_root` prüfen.

**Wichtig:** Die Auflistung eines TS-Videos bedeutet noch nicht, dass jeder Browser dessen MPEG-TS-Inhalt nativ wiedergeben kann. Das hängt vom Browser und den enthaltenen Codecs ab; die Integration wandelt Videos nicht um.

## NFO-Dateien

Beispiel:

```text
/media/Videorecorder/Backup/Video/Trickfilme/
    Der-König-der-Löwen-1994.mkv
    Der-König-der-Löwen-1994.nfo
```

**NFO-Dateien werden nicht als eigener Film angezeigt.** Sie werden nur als Zusatzdaten gelesen. Im regulären Menü **Home Assistant → Medien** können die Dateien weiterhin sichtbar sein; unsere Integration verändert den eingebauten Home-Assistant-Medienbrowser nicht.

Die `.nfo` wird bevorzugt über den gleichen Basisdateinamen zugeordnet. Auch verschiedene Unicode-Schreibweisen oder Trennzeichen werden erkannt, solange die Zuordnung eindeutig bleibt. Alternativ berücksichtigt die Integration den Dateinamen-Eintrag in einer Hoffmann-NFO-Datei sowie `movie.nfo` in einem Ordner mit nur einem Video. Ohne zuordenbaren NFO-Titel wird der Anzeigename aus dem Videodateinamen abgeleitet. **Im Detailfenster unter „Titelquelle“** lässt sich die verwendete Quelle prüfen. Ein erneutes Einlesen aktualisiert den Titel.

**Bewertungsquelle:** Explizit als IMDb gekennzeichnete NFO-Werte werden als IMDb-Bewertung angezeigt. KI-Schätzungen werden mit `≈` und `KI` gekennzeichnet. Andere NFO-Bewertungen bleiben allgemein bezeichnet. Es wird keine Bewertung von IMDb geladen. Bitte die IMDb-Nutzungsbedingungen beachten.

## Wiedergabe und Sicherheit

Beim Abspielen fordert das Panel über die angemeldete Home-Assistant-Sitzung einen **frischen signierten Medienlink** an. Der Link wird nicht im Katalog gespeichert. Home Assistant nutzt automatisch die Adresse, unter der es aufgerufen wurde – lokal oder über den vorhandenen externen Zugang.

Die Integration bringt **keine separaten Benutzer- oder Filmfreigaben** mit. Sie prüft die Anmeldung über die Home-Assistant-WebSocket-Schnittstelle, ist aber **keine eigene Zugriffsschranke pro Film**. Benutzer mit Zugang zur Oberfläche können den zentralen Katalog sehen; individuelle Freigaben sollten nicht vorausgesetzt werden.

Nicht alle Browser spielen MKV/AVI-Dateien oder darin enthaltene Codecs ab. Ein Dateiformatfehler ist kein Berechtigungsfehler.

## Updates

Weitere Versionen werden als Änderung im GitHub-Repository und **GitHub-Release** mit einer jeweils höheren Versionsnummer veröffentlicht. Anschließend zeigt Home Assistant über den Marketplace die verfügbaren Updates an. Nach Änderungen an der Python-Integration Home Assistant neu starten.

## Fehlerdiagnose

- Kein Katalog: In Home Assistant unter Terminal `ls -la /media/Videorecorder/Backup/Video` prüfen.
- Fehlender Menüpunkt: Konfiguration prüfen, Home Assistant neu starten, Home-Assistant-Protokolle ansehen.
- Wiedergabe funktioniert nur unter **Medien**: Fehlermeldung aus dem Video-Manager notieren; keine `authSig`-URLs, Zugangsdaten oder Tokens weitergeben.
- NFO geändert: Im Panel **Filme neu einlesen** anklicken.

**Status:** Python-Syntax, JavaScript-Syntax und NFO-/Scan-Tests lokal geprüft; ein End-to-End-Test in der konkreten Home-Assistant-Installation steht noch aus.
