# Hoffmann Video-Manager für Home Assistant

Eine schlanke, bildfreie Videothek für Home Assistant. Version **1.0.4** (Testversion).

Diese Integration liest vorhandene Filmdateien und die zugehörigen XML-NFO-Dateien aus einer bereits in Home Assistant eingebundenen Medienfreigabe. Die Pflege und Aktualisierung der Filmdaten erfolgt weiterhin im **Hoffmann Video-Manager**.

- **Keine KI-Abfragen, keine Cover, kein eigener Benutzer-Login**
- Schnelle Tabelle mit Suche, Filtern und Sortierung; **ausschließlich Videodateien als Listeneinträge**
- **Dateiformat-Auswahl mit Häkchen:** AVI, MPG/MPEG, MP4, MKV, TS, **MOV** und weitere vorhandene Formate; alle Formate beim ersten Start aktiviert, Auswahl bleibt im jeweiligen Browser gespeichert
- **Bewertungsfilter:** alle, nur bewertete, unbewertete oder Filme ab 5,0 bis 9,5 Punkten; zusätzlich Bewertungsquelle „Nur IMDb“ oder „Ohne KI-Schätzungen“. Bewertung absteigend sortieren bleibt möglich
- **Laufzeitfilter:** Bis 45, 60, 75, **90** oder 120 Minuten, über 90 Minuten und „Laufzeit unbekannt“; nur bekannte Laufzeiten kommen in die „bis“-Filter, 90:00 ist eingeschlossen. Sortierung nach kurzer Laufzeit verfügbar.
- **Zufallsfilm:** Wählt aus **allen aktuellen Such- und Filterergebnissen**, nicht nur aus der sichtbaren Tabellenseite. Zunächst erscheinen die Filmdetails; die Wiedergabe startet erst über den separaten Knopf **„Abspielen“**.
- **Filmtitel statt Dateiname:** Titel aus der passenden NFO wird in Tabelle, Suche und Wiedergabe angezeigt; Dateiname nur als Ersatz, wenn kein NFO-Titel vorliegt. Im Detailfenster steht die Titelquelle.
- **Katalogbereinigung:** Versteckte Dateien wie `._Alles steht Kopf.mpg` und Videodateien **unter 1 MB** werden ignoriert. Die Mindestgröße ist optional in `configuration.yaml` einstellbar.
- **Neu einlesen entfernt alte Katalogeinträge:** Umbenannte, gelöschte, ausgeblendete oder zu kleine Videos erscheinen nach dem Scan nicht mehr. **Auf dem Datenträger werden keinerlei Dateien gelöscht.** Die Anzahl entfernter Katalogeinträge wird gemeldet.
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

## Filme nach Bewertung filtern

Oben in der Filterleiste **„Alle Bewertungen“** auswählen, z. B. **„Ab 7,0 Punkten“**. Es bleiben nur Filme mit einer Bewertung von mindestens 7,0 sichtbar. **„Mit Bewertung“** zeigt alle bewerteten Filme, **„Ohne Bewertung“** nur solche ohne gültigen NFO-Wert. Die Schwelle ist **einschließlich** des angegebenen Wertes. Die Filmliste wird sofort gefiltert; erneutes Einlesen ist dazu nicht notwendig.

Mit der zusätzlichen Auswahl **„Alle Bewertungsquellen“ / „Nur IMDb-Bewertungen“ / „Ohne KI-Schätzungen“** lässt sich die Herkunft eingrenzen. „Nur IMDb“ verwendet ausschließlich Werte, die in der NFO ausdrücklich als IMDb gekennzeichnet sind. Bei „Ohne Bewertung“ ist die Quellenwahl deaktiviert. Diese Filter betreffen nur die Anzeige, niemals die Video- oder NFO-Dateien. **Bewertung absteigend** ist weiterhin eine Sortierung und unabhängig vom neuen Mindestwertfilter.

## Kleine und versteckte Dateien / Bereinigung

Standardmäßig werden **nur Videos ab 1.000.000 Byte (1 MB)** eingelesen. Versteckte Dateien und AppleDouble-Begleitdateien (z. B. `._Film.mpg`) werden unabhängig von ihrer Dateigröße ausgelassen. NFO-Dateien selbst sind davon nicht betroffen; sie werden weiterhin als Metadaten gelesen.

Optional kannst du den Schwellenwert in `configuration.yaml` ändern:

```yaml
hoffmann_video_ha:
  media_root: /media/Videorecorder/Backup/Video
  min_video_bytes: 1000000
```

**„Filme neu einlesen“ ersetzt den bisherigen Katalog vollständig.** Nicht mehr vorhandene Videos, ausgeblendete Begleitdateien und zu kleine Dateien werden im zentralen Katalog entfernt. Eine **Löschung der Originaldateien** oder von NFO-Dateien findet dabei **niemals** statt. Falls ein Verzeichnis aufgrund eines Zugriffsfehlers nicht lesbar ist, wird der bestehende Katalog nicht durch einen unvollständigen Scan überschrieben. Prüfe nach einem Update den Status über der Filmliste.

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

## Laufzeitfilter und Zufallsfilm (V1.0.4)

In der oberen Filterleiste **„Bis 90 Minuten“** wählen. Berücksichtigt werden nur Videos mit einer **bekannten Laufzeit** aus der zugehörigen NFO-Datei (`<runtime>` in Minuten oder `<hoffmann_video_manager><duration_seconds>` in Sekunden). **90:00 Minuten gehören dazu; 90:01 nicht mehr.** Ohne Laufzeitangabe werden Filme bei einer Minutenobergrenze ausgeblendet, damit kein unbekannt langer Film vorgeschlagen wird. Mit **„Laufzeit unbekannt“** lassen sich solche Filme gezielt finden. Der Video-Manager liest weiterhin keine Videodateien vollständig aus und führt keine FFmpeg-Analyse aus. Für korrekte Angaben die NFO-Dateien im PC-Video-Manager aktualisieren und danach **„Filme neu einlesen“**.

**„🎲 Zufallsfilm“** berücksichtigt sämtliche aktiven Filter (Laufzeit, Suchtext, Genre, Bewertungen, Formate, Favoriten usw.) und alle Ergebnisse über alle Tabellenseiten hinweg. Es erscheint zunächst das Infofenster mit **„▶ Abspielen“**; so wird in der Schule kein Film versehentlich sofort gestartet. Ein direkter zweiter Zufallstreffer wird nach Möglichkeit nicht wiederholt. Es werden keine Dateien verändert.

Bei der Vorführung von Spielfilmen im Unterricht bitte die benötigten Vorführ- bzw. Nutzungsrechte beachten.

## Updates

Weitere Versionen werden als Änderung im GitHub-Repository und **GitHub-Release** mit einer jeweils höheren Versionsnummer veröffentlicht. Anschließend zeigt Home Assistant über den Marketplace die verfügbaren Updates an. Nach Änderungen an der Python-Integration Home Assistant neu starten.

## Fehlerdiagnose

- Kein Katalog: In Home Assistant unter Terminal `ls -la /media/Videorecorder/Backup/Video` prüfen.
- Fehlender Menüpunkt: Konfiguration prüfen, Home Assistant neu starten, Home-Assistant-Protokolle ansehen.
- Wiedergabe funktioniert nur unter **Medien**: Fehlermeldung aus dem Video-Manager notieren; keine `authSig`-URLs, Zugangsdaten oder Tokens weitergeben.
- NFO geändert: Im Panel **Filme neu einlesen** anklicken.

**Status:** Python-Syntax, JavaScript-Syntax und NFO-/Scan-Tests lokal geprüft; ein End-to-End-Test in der konkreten Home-Assistant-Installation steht noch aus.
