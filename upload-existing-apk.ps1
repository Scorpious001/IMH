# Upload Existing APK Script
# This script uploads an existing APK file to the server
# Usage: .\upload-existing-apk.ps1 [path-to-apk]

param(
    [string]$APKPath = ""
)

$ErrorActionPreference = "Stop"

# Resolve SSH key path
$SSH_INFO_PATH = Join-Path $PSScriptRoot "SSH INFO"
$SSH_KEY_FILES = Get-ChildItem $SSH_INFO_PATH -Filter "*.pem" -ErrorAction SilentlyContinue
if ($SSH_KEY_FILES -and $SSH_KEY_FILES.Count -gt 0) {
    $SSH_KEY = $SSH_KEY_FILES[0].FullName
    Write-Host "Using SSH key: $SSH_KEY" -ForegroundColor Gray
} else {
    Write-Host "ERROR: No .pem file found in SSH INFO folder!" -ForegroundColor Red
    exit 1
}

$SERVER_HOST = "ubuntu@3.234.249.243"
$REMOTE_PATH = "~/SPS-IMH/backend/media/apps/imh-ims.apk"

Write-Host "=== Upload APK to Server ===" -ForegroundColor Cyan
Write-Host ""

# If no path provided, try common locations
if ([string]::IsNullOrWhiteSpace($APKPath)) {
    $currentDir = Get-Location
    $commonPaths = @(
        ".\app\build\outputs\apk\debug\app-debug.apk",
        ".\android\app\build\outputs\apk\debug\app-debug.apk",
        "app\build\outputs\apk\debug\app-debug.apk",
        "android\app\build\outputs\apk\debug\app-debug.apk",
        "$currentDir\app\build\outputs\apk\debug\app-debug.apk",
        "$currentDir\android\app\build\outputs\apk\debug\app-debug.apk"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $APKPath = (Resolve-Path $path).Path
            Write-Host "Found APK at: $APKPath" -ForegroundColor Green
            break
        }
    }
    
    # If still not found, search in parent directories
    if ([string]::IsNullOrWhiteSpace($APKPath)) {
        Write-Host "Searching in current directory and parent directories..." -ForegroundColor Yellow
        $searchDir = $currentDir
        for ($i = 0; $i -lt 3; $i++) {
            $searchPath = Join-Path $searchDir "app\build\outputs\apk\debug\app-debug.apk"
            if (Test-Path $searchPath) {
                $APKPath = (Resolve-Path $searchPath).Path
                Write-Host "Found APK at: $APKPath" -ForegroundColor Green
                break
            }
            $searchDir = Split-Path $searchDir -Parent
            if ([string]::IsNullOrWhiteSpace($searchDir)) { break }
        }
    }
    
    if ([string]::IsNullOrWhiteSpace($APKPath)) {
        Write-Host "APK file not found in common locations." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Current directory: $currentDir" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Please provide the full path to the APK file:" -ForegroundColor Cyan
        Write-Host "  .\upload-existing-apk.ps1 -APKPath 'C:\path\to\app-debug.apk'" -ForegroundColor White
        Write-Host ""
        Write-Host "Or navigate to your Android project directory (where 'app' folder is) and run:" -ForegroundColor Cyan
        Write-Host "  .\upload-existing-apk.ps1" -ForegroundColor White
        Write-Host ""
        Write-Host "The script looks for: app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Gray
        exit 1
    }
} else {
    # Resolve the provided path
    if (-not (Test-Path $APKPath)) {
        Write-Host "Error: APK file not found at: $APKPath" -ForegroundColor Red
        exit 1
    }
    $APKPath = (Resolve-Path $APKPath).Path
}

# Verify file exists
$apkFile = Get-Item $APKPath
$apkSize = [math]::Round($apkFile.Length / 1MB, 2)

Write-Host "APK File: $($apkFile.Name)" -ForegroundColor Cyan
Write-Host "APK Size: $apkSize MB" -ForegroundColor Cyan
Write-Host "Full Path: $APKPath" -ForegroundColor Gray
Write-Host ""

# Create apps directory on server if it doesn't exist
Write-Host "Creating apps directory on server..." -ForegroundColor Yellow
ssh -i "$SSH_KEY" "$SERVER_HOST" "mkdir -p ~/SPS-IMH/backend/media/apps"

# Upload APK
Write-Host "Uploading APK..." -ForegroundColor Yellow
scp -i "$SSH_KEY" "$APKPath" "${SERVER_HOST}:${REMOTE_PATH}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to upload APK" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Upload Successful ===" -ForegroundColor Green
Write-Host "APK is now available at: http://3.234.249.243/api/app/download/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test the download page: http://3.234.249.243/download" -ForegroundColor Cyan
