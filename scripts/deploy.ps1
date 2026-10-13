# Prebuilt deploy to Azure App Service.
# Builds Next.js standalone output locally, assembles the minimal runtime
# folder, zips it, and deploys without triggering Oryx build on the server.

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$ResourceGroup = "vit-scope-rg"
$AppName = "vit-scope-portal"

$StageDir = "$env:TEMP\vit-scope-deploy-prebuilt"
$ZipPath = "$env:TEMP\vit-scope-deploy-prebuilt.zip"

Write-Host "Building Next.js app..."
Push-Location $RootDir
try {
    npm run build
} finally {
    Pop-Location
}

$StandaloneDir = Join-Path $RootDir ".next\standalone"
if (-not (Test-Path $StandaloneDir)) {
    throw "Standalone build output not found at $StandaloneDir. Check next.config.ts has output: 'standalone'."
}

Write-Host "Assembling deploy package..."
Remove-Item $StageDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $StageDir -Force | Out-Null

# Copy the standalone server + pruned node_modules
Copy-Item "$StandaloneDir\*" $StageDir -Recurse -Force

# Standalone output does not include static assets or public/ - add them
New-Item -ItemType Directory -Path "$StageDir\.next\static" -Force | Out-Null
Copy-Item "$RootDir\.next\static\*" "$StageDir\.next\static" -Recurse -Force

if (Test-Path "$RootDir\public") {
    New-Item -ItemType Directory -Path "$StageDir\public" -Force | Out-Null
    Copy-Item "$RootDir\public\*" "$StageDir\public" -Recurse -Force
}

Write-Host "Zipping package..."
Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue
Compress-Archive -Path "$StageDir\*" -DestinationPath $ZipPath -Force

Write-Host "Configuring App Service for prebuilt deploys..."
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $AppName `
    --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false WEBSITE_RUN_FROM_PACKAGE=0 | Out-Null

az webapp config set `
    --resource-group $ResourceGroup `
    --name $AppName `
    --startup-file "node server.js" | Out-Null

Write-Host "Deploying..."
az webapp deploy `
    --resource-group $ResourceGroup `
    --name $AppName `
    --src-path $ZipPath `
    --type zip `
    --timeout 1800

Write-Host "Done."
