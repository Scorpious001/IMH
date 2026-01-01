# Start React Native Android App
# This script starts the Android app (assumes Metro is already running)

Write-Host "Starting React Native Android App..." -ForegroundColor Green
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the android-app-template directory." -ForegroundColor Red
    exit 1
}

# Check if Metro is running (optional check)
Write-Host "Note: Make sure Metro bundler is running in another window!" -ForegroundColor Yellow
Write-Host "If not, run: npm start" -ForegroundColor Yellow
Write-Host ""

# Start Android app
Write-Host "Building and launching Android app..." -ForegroundColor Cyan
npm run android

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Error: Failed to start Android app" -ForegroundColor Red
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Metro bundler is running (npm start)" -ForegroundColor White
    Write-Host "  2. Android device/emulator is connected" -ForegroundColor White
    Write-Host "  3. Android SDK is properly configured" -ForegroundColor White
    exit 1
}

