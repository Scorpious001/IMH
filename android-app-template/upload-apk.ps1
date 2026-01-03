# Upload APK to Server Script
# This script uploads the built APK to the EC2 server

param(
    [string]$ServerHost = "ubuntu@3.234.249.243",
    [string]$APKPath = "android/app/build/outputs/apk/release/app-release.apk"
)

$ErrorActionPreference = "Stop"

# Resolve SSH key path
$SSH_INFO_PATH = Join-Path (Split-Path $PSScriptRoot -Parent) "SSH INFO"
$SSH_KEY_FILES = Get-ChildItem $SSH_INFO_PATH -Filter "*.pem" -ErrorAction SilentlyContinue
if ($SSH_KEY_FILES -and $SSH_KEY_FILES.Count -gt 0) {
    $SSH_KEY = $SSH_KEY_FILES[0].FullName
    Write-Host "Using SSH key: $SSH_KEY" -ForegroundColor Gray
} else {
    Write-Host "ERROR: No .pem file found in SSH INFO folder!" -ForegroundColor Red
    Write-Host "   Please ensure your SSH key file (.pem) is in: $SSH_INFO_PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Uploading APK to Server ===" -ForegroundColor Cyan
Write-Host ""

# Check if APK exists
if (-not (Test-Path $APKPath)) {
    Write-Host "Error: APK not found at: $APKPath" -ForegroundColor Red
    Write-Host "Please build the APK first using: .\build-apk.ps1" -ForegroundColor Yellow
    exit 1
}

$apkFile = Get-Item $APKPath
$apkSize = [math]::Round($apkFile.Length / 1MB, 2)

Write-Host "APK File: $($apkFile.Name)" -ForegroundColor Cyan
Write-Host "APK Size: $apkSize MB" -ForegroundColor Cyan
Write-Host ""

# Create apps directory on server if it doesn't exist
Write-Host "Creating apps directory on server..." -ForegroundColor Yellow
ssh -i "$SSH_KEY" "$ServerHost" "mkdir -p ~/SPS-IMH/backend/media/apps"

# Upload APK
Write-Host "Uploading APK..." -ForegroundColor Yellow
$remotePath = "~/SPS-IMH/backend/media/apps/imh-ims.apk"
scp -i "$SSH_KEY" "$APKPath" "${ServerHost}:${remotePath}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to upload APK" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Upload Successful ===" -ForegroundColor Green
Write-Host "APK is now available at: http://3.234.249.243/media/apps/imh-ims.apk" -ForegroundColor Cyan
Write-Host ""
Write-Host "The APK can be downloaded from the website's download page." -ForegroundColor Gray
