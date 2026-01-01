# Start Metro Bundler for React Native Android App
# This script starts the Metro bundler which is required for the app to load

Write-Host "Starting Metro Bundler for React Native..." -ForegroundColor Green
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the android-app-template directory." -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies first..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting Metro bundler..." -ForegroundColor Cyan
Write-Host "Keep this window open while developing!" -ForegroundColor Yellow
Write-Host ""
Write-Host "To run the app on Android:" -ForegroundColor Cyan
Write-Host "  1. Open another PowerShell window" -ForegroundColor White
Write-Host "  2. Navigate to: android-app-template" -ForegroundColor White
Write-Host "  3. Run: npm run android" -ForegroundColor White
Write-Host ""
Write-Host "For physical devices, make sure your device and computer are on the same network." -ForegroundColor Yellow
Write-Host ""

# Start Metro bundler
npm start

