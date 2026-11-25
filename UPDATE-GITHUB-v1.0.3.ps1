$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
function Run-Git([string[]]$gitArgs) {
  & git @gitArgs
  if ($LASTEXITCODE -ne 0) { throw ("Git fehlgeschlagen: git " + ($gitArgs -join ' ')) }
}
$expected='https://github.com/LottoExperte/HA-Video-Manager.git'
$current=(& git remote get-url origin).Trim()
if ($LASTEXITCODE -ne 0 -or $current -ne $expected) {
  throw "Falsches GitHub-Ziel: $current (erwartet $expected)"
}
$manifest=Get-Content -LiteralPath '.\custom_components\hoffmann_video_ha\manifest.json' -Raw | ConvertFrom-Json
if ($manifest.version -ne '1.0.3') { throw "Falsche Version: $($manifest.version), erwartet 1.0.3" }
$existing=([string](& git tag -l 'v1.0.3')).Trim()
if ($existing) { throw 'Das Tag v1.0.3 existiert bereits. Keine automatischen Änderungen vorgenommen.' }
Run-Git -gitArgs @('add','.')
& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) { throw 'Keine Änderungen vorgemerkt; bitte zuerst die neuen Dateien aus dem ZIP ins Repository kopieren.' }
if ($LASTEXITCODE -gt 1) { throw 'Konnte Änderungen nicht prüfen.' }
Run-Git -gitArgs @('commit','-m','HA Video-Manager v1.0.3 - Katalogbereinigung')
Run-Git -gitArgs @('push','origin','main')
Run-Git -gitArgs @('tag','v1.0.3')
Run-Git -gitArgs @('push','origin','v1.0.3')
Write-Host 'V1.0.3 erfolgreich auf GitHub übertragen. Bitte Release auf GitHub veröffentlichen.' -ForegroundColor Green
