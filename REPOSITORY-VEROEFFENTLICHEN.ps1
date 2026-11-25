#requires -Version 5.1
# Veroeffentlicht das vorbereitete Git-Repository unter LottoExperte/HA-Video-Manager.
# Funktioniert auch, wenn das GitHub-Repository vorher LEER im Browser angelegt wurde.
# Ein bestehendes Repository mit Commits/Dateien wird nicht ueberschrieben.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = 'LottoExperte/HA-Video-Manager'
$url = "https://github.com/$repo"
function Require-Program([string]$name, [string]$hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "'$name' fehlt. $hint" }
}
try {
    Require-Program 'git' 'winget install --id Git.Git -e'
    Require-Program 'gh' 'winget install --id GitHub.cli -e'
    if (-not (Test-Path (Join-Path $root '.git'))) { throw 'Versteckter Ordner .git fehlt. ZIP vollstaendig entpacken.' }
    & git -C $root rev-parse --verify HEAD *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Git-Commit fehlt.' }
    & git -C $root rev-parse --verify refs/tags/v1.0.0 *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Versions-Tag v1.0.0 fehlt.' }

    & gh auth status *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Bitte im Browser bei GitHub anmelden.'
        & gh auth login --web --git-protocol https
        if ($LASTEXITCODE -ne 0) { throw 'GitHub-Anmeldung fehlgeschlagen.' }
    }
    $login = ((& gh api user --jq .login) | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $login -ine 'LottoExperte') {
        throw "GitHub-Konto '$login' ist nicht LottoExperte. Bitte richtige Anmeldung waehlen."
    }

    & gh repo view $repo --json name --jq .name *> $null
    $exists = ($LASTEXITCODE -eq 0)
    if ($exists) {
        $heads = (& git ls-remote --heads "$url.git" 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0) { throw "Kann vorhandenes Repository $url nicht pruefen: $heads" }
        if ($heads) { throw "Repository $url enthaelt bereits Commits. Sicherheitshalber keine Aenderung." }
        Write-Host "Leeres Repository vorhanden: $url" -ForegroundColor Cyan
    } else {
        Write-Host "Neues oeffentliches Repository wird angelegt: $url" -ForegroundColor Cyan
    }

    $answer = Read-Host 'Um fortzufahren JA eingeben'
    if ($answer -cne 'JA') { Write-Host 'Abgebrochen.'; exit 0 }
    if (-not $exists) {
        & gh repo create $repo --public --description 'Schlanker Video-Manager fuer Home Assistant mit NFO-Metadaten und direkter Wiedergabe'
        if ($LASTEXITCODE -ne 0) { throw 'GitHub-Repository konnte nicht erstellt werden.' }
    }
    $remote = ((& git -C $root remote get-url origin 2>$null) | Out-String).Trim()
    if ($LASTEXITCODE -eq 0 -and $remote) {
        if ($remote -ne "$url.git" -and $remote -ne $url) { throw "Remote origin zeigt auf $remote. Bitte manuell pruefen." }
    } else {
        & git -C $root remote add origin "$url.git"
        if ($LASTEXITCODE -ne 0) { throw 'Git-Remote konnte nicht gesetzt werden.' }
    }
    & git -C $root push -u origin main
    if ($LASTEXITCODE -ne 0) { throw 'Git-Push fehlgeschlagen.' }
    & git -C $root push origin refs/tags/v1.0.0
    if ($LASTEXITCODE -ne 0) { throw 'Git-Tag konnte nicht hochgeladen werden.' }
    & gh release create v1.0.0 --repo $repo --title 'Hoffmann Video-Manager HA v1.0.0' --notes 'Erste Testversion: Videoordner und NFO-Dateien lesen, Filmkatalog durchsuchen, Filme im Home-Assistant-Browser abspielen. Keine Aenderungen an Medien.'
    if ($LASTEXITCODE -ne 0) { throw 'Repository und Tag hochgeladen, Release bitte im GitHub-Browser anlegen.' }
    Write-Host "FERTIG: $url" -ForegroundColor Green
    Write-Host "Home Assistant Marketplace: $url"
} catch {
    Write-Host "FEHLER: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
