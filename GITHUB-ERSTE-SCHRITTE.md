# HA Video-Manager: GitHub-Update V1.0.4

Repository: https://github.com/LottoExperte/HA-Video-Manager

Das Update baut auf **V1.0.3** auf und ergänzt:

- **Laufzeitfilter** (bis 45/60/75/**90**/120 Minuten, über 90 Minuten und unbekannte Laufzeit).
- **Zufallsfilm** aus allen aktuell gefilterten Filmen, unabhängig von der sichtbaren Tabellenseite.
- **Infodialog mit Wiedergabeknopf**, kein automatischer Filmstart.
- Verbesserte Erkennung gängiger NFO-Laufzeitformate, keine Änderungen an Videos oder NFO-Dateien.

## V1.0.4 veröffentlichen

1. Die ZIP-Datei `HA-Video-Manager-v1.0.4-Laufzeit-Zufallsfilm.zip` **entpacken** und ihren Inhalt in das bestehende lokale Repository kopieren:

   `C:\Users\Administrator\source\repos\HA-Video-Manager`

   Vorhandene Dateien überschreiben; den enthaltenen `custom_components`-Ordner **zusammenführen**.

2. PowerShell dort öffnen und das GitHub-Skript starten:

   ```powershell
   cd C:\Users\Administrator\source\repos\HA-Video-Manager
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\UPDATE-GITHUB-v1.0.4.ps1"
   ```

   Das Skript überprüft Version, GitHub-Ziel und vorhandenes Tag und erstellt anschließend Commit und Tag in der richtigen Reihenfolge. Bei einem Fehler stoppt es; kein blindes erneutes Tagging.

3. Auf https://github.com/LottoExperte/HA-Video-Manager/releases/new das Tag **`v1.0.4`** auswählen und das Release veröffentlichen (kein Pre-Release).
4. Home Assistant über den Marketplace aktualisieren und **vollständig neu starten**. Falls nötig `Strg+Umschalt+R` im Browser.
5. Im Video-Manager **„Filme neu einlesen“** wählen, wenn NFO-Dateien seit dem letzten Scan geändert wurden. Für den reinen Laufzeitfilter auf unverändertem Katalog ist kein Scan erforderlich.

## Laufzeitfilter

Im Auswahlfeld **„Alle Laufzeiten“** beispielsweise **„Bis 90 Minuten“** einstellen. Nur Filme mit bekannter NFO-Laufzeit (höchstens **90:00**) werden berücksichtigt. Filmdateien mit unbekannter Laufzeit werden bewusst ausgeschlossen. Um fehlende Laufzeiten zu finden, **„Laufzeit unbekannt“** auswählen.

**„🎲 Zufallsfilm“** wählt einen Film aus genau der aktuellen Treffermenge. Der Film wird zunächst mit seinen Metadaten gezeigt und erst nach einem weiteren Klick auf **„▶ Abspielen“** gestartet. Für den Unterricht vorher Vorführrechte prüfen.

Die vorhandene Konfiguration (`media_root`) und die NFO-Dateien bleiben unverändert.
