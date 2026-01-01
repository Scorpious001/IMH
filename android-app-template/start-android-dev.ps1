# Complete Android Development Startup Script
# This script helps you start Metro and the Android app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  React Native Android App Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found." -ForegroundColor Red
    Write-Host "Please run this script from the android-app-template directory." -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

Write-Host "IMPORTANT: You need TWO terminal windows!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Window 1: Metro Bundler (REQUIRED)" -ForegroundColor Cyan
Write-Host "  Run: npm start" -ForegroundColor White
Write-Host "  Or:  .\start-metro.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Window 2: Android App (this window)" -ForegroundColor Cyan
Write-Host "  Run: npm run android" -ForegroundColor White
Write-Host "  Or:  .\start-android.ps1" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Is Metro bundler already running? (Y/N)"

if ($response -ne "Y" -and $response -ne "y") {
    Write-Host ""
    Write-Host "Please start Metro bundler first!" -ForegroundColor Red
    Write-Host "Open another PowerShell window and run:" -ForegroundColor Yellow
    Write-Host "  cd `"$PWD`"" -ForegroundColor White
    Write-Host "  npm start" -ForegroundColor White
    Write-Host ""
    Write-Host "Then come back here and run this script again." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting Android app..." -ForegroundColor Green
Write-Host ""

# Start Android app
npm run android

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Error: Failed to start Android app" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure Metro bundler is running (npm start)" -ForegroundColor White
    Write-Host "  2. Check Android device/emulator is connected:" -ForegroundColor White
    Write-Host "     Run: adb devices" -ForegroundColor Gray
    Write-Host "  3. For physical devices, configure debug server:" -ForegroundColor White
    Write-Host "     Shake device → Dev Settings → Debug server host" -ForegroundColor Gray
    Write-Host "     Enter: YOUR_COMPUTER_IP:8081" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

