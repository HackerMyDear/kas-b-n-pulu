$ErrorActionPreference = 'Stop'

npm run build
npx cap sync android

New-Item -ItemType Directory -Force android_app_bundle | Out-Null
robocopy android android_app_bundle\android /E /NFL /NDL /NJH /NJS /NP | Out-Null

$settingsPath = "android_app_bundle\android\capacitor.settings.gradle"
if (Test-Path $settingsPath) {
  (Get-Content -Raw $settingsPath).Replace("../node_modules/", "../../node_modules/") | Set-Content $settingsPath
}

Write-Host "Android bundle refreshed at android_app_bundle/android"
