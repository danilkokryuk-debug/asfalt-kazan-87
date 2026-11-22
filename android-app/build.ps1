# Сборка Android-версии «Асфальта».
# Android Gradle не собирает в путях с кириллицей, поэтому проект копируется в C:\asfalt-android и собирается там.
# Запуск:  powershell -ExecutionPolicy Bypass -File android-app\build.ps1 [debug|release]
# release: нужен ключ подписи android-app\signing\upload.jks и android-app\signing\keystore.properties (их не коммитим).
param([string]$mode = 'debug')
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$dst = 'C:\asfalt-android'
$env:JAVA_HOME = (Get-ChildItem 'C:\Program Files\Microsoft' -Directory -Filter 'jdk-21*' | Select-Object -First 1).FullName
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

Push-Location $src
node build-www.mjs
npx cap sync android | Out-Null
Pop-Location

# зеркалим проект (без сборочного мусора) в латинский путь
robocopy $src $dst /MIR /XD build .gradle www-unused /XF build.ps1 /NFL /NDL /NJH /NJS /NP | Out-Null
("sdk.dir=" + ($env:ANDROID_HOME -replace '\\', '\\')) | Out-File -Encoding ascii "$dst\android\local.properties"

Push-Location "$dst\android"
if ($mode -eq 'release') { .\gradlew.bat bundleRelease assembleRelease --no-daemon -q } else { .\gradlew.bat assembleDebug --no-daemon -q }
Pop-Location

$out = Join-Path $src 'out'; New-Item -ItemType Directory -Force $out | Out-Null
Get-ChildItem "$dst\android\app\build\outputs" -Recurse -Include *.apk, *.aab | ForEach-Object { Copy-Item $_.FullName $out -Force; Write-Output ("готово: out\" + $_.Name + "  " + [math]::Round($_.Length / 1MB, 1) + " МБ") }
