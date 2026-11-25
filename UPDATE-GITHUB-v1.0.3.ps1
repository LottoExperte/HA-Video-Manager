$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Run-Git([string[]]$gitArgs) {
    & git @gitArgs
    if ($LASTEXITCODE -ne 0) {
        throw ("Git fehlgeschlagen: git " + ($gitArgs -join ' '))
    }
}

$expected = 'https://github.com/LottoExperte/HA-Video-Manager.git'
$origins = @(& git remote get-url origin)
if ($LASTEXITCODE -ne 0 -or $origins.Count -eq 0) {
    throw 'GitHub-Remote origin ist nicht eingerichtet.'
}
$current = $origins[0]
if ($current -ne $expected) {
    throw "Falsches GitHub-Ziel: $current (erwartet $expected)"
}

$manifest = Get-Content -LiteralPath '.\custom_components\hoffmann_video_ha\manifest.json' -Raw | ConvertFrom-Json
if ($manifest.version -ne '1.0.3') {
    throw "Falsche Version: $($manifest.version), erwartet 1.0.3"
}

# Ein Tag, das noch nicht existiert, liefert KEINE Ausgabe.
# Deshalb Arrayvergleich statt .Trim() an einer moeglichen $null-Antwort.
$existingTags = @(& git tag --list 'v1.0.3')
if ($LASTEXITCODE -ne 0) {
    throw 'Git-Tags konnten nicht gelesen werden.'
}
if ($existingTags -contains 'v1.0.3') {
    throw 'Das Tag v1.0.3 existiert bereits. Keine automatischen Aenderungen vorgenommen.'
}

Run-Git -gitArgs @('add','.')
& git diff --cached --quiet
$diffStatus = $LASTEXITCODE
if ($diffStatus -eq 0) {
    throw 'Keine Aenderungen vorgemerkt; bitte zuerst die neuen Dateien aus dem ZIP ins Repository kopieren.'
}
if ($diffStatus -ne 1) {
    throw 'Konnte vorgemerkte Aenderungen nicht pruefen.'
}

Run-Git -gitArgs @('commit','-m','HA Video-Manager v1.0.3 - Katalogbereinigung')
Run-Git -gitArgs @('push','origin','main')
Run-Git -gitArgs @('tag','v1.0.3')
Run-Git -gitArgs @('push','origin','v1.0.3')
Write-Host 'V1.0.3 erfolgreich auf GitHub uebertragen. Bitte das Release auf GitHub veroeffentlichen.' -ForegroundColor Green
