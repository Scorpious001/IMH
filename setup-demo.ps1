# IMH IMS Demo Setup Script
# This script sets up everything needed for a demo

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IMH IMS Demo Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Get script directory
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Paths
$backendPath = Join-Path $scriptRoot "backend"
$frontendPath = Join-Path $scriptRoot "frontend"

# Check if directories exist
if (-not (Test-Path $backendPath)) {
    Write-Host "ERROR: Backend directory not found at: $backendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "ERROR: Frontend directory not found at: $frontendPath" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Checking Python virtual environment..." -ForegroundColor Yellow
$venvPython = Join-Path $backendPath "venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "  Creating virtual environment..." -ForegroundColor Cyan
    Push-Location $backendPath
    python -m venv venv
    Pop-Location
    
    if (-not (Test-Path $venvPython)) {
        Write-Host "  ERROR: Could not create virtual environment" -ForegroundColor Red
        exit 1
    }
}

Write-Host "  ✓ Virtual environment ready" -ForegroundColor Green
Write-Host ""

# Create demo user (will skip if already exists)
Write-Host "Step 2: Setting up demo user..." -ForegroundColor Yellow
Push-Location $backendPath
$userOutput = & $venvPython manage.py create_scorpious_user 2>&1
Pop-Location

$userString = $userOutput -join " "
if ($userString -match "already exists" -or $userString -match "successfully") {
    Write-Host "  ✓ Demo user ready" -ForegroundColor Green
} else {
    Write-Host "  ✓ Demo user setup attempted" -ForegroundColor Green
}
Write-Host ""

# Start backend
Write-Host "Step 3: Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; Write-Host '=== Django Backend Server (Demo Mode) ===' -ForegroundColor Green; Write-Host 'Starting on http://localhost:8000' -ForegroundColor Yellow; Write-Host ''; .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"
) -WindowStyle Normal

Write-Host "  ✓ Backend server starting..." -ForegroundColor Green
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Step 4: Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$frontendPath'; Write-Host '=== React Frontend Server ===' -ForegroundColor Green; Write-Host 'Starting on http://localhost:3001' -ForegroundColor Yellow; Write-Host ''; if (-not (Test-Path .env)) { 'PORT=3001' | Out-File -FilePath .env -Encoding utf8 }; npm start"
) -WindowStyle Normal

Write-Host "  ✓ Frontend server starting..." -ForegroundColor Green
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Step 5: Generating demo data..." -ForegroundColor Yellow
Write-Host "  This may take 30-60 seconds..." -ForegroundColor Cyan
Write-Host ""

# Wait a bit more for backend to be fully ready
Start-Sleep -Seconds 5

# Generate demo data
Push-Location $backendPath
$generateOutput = & $venvPython manage.py generate_test_data --clear --categories 15 --vendors 10 --locations 20 --items 200 --requisitions 50 --count-sessions 20 --purchase-requests 30 --transactions 100 2>&1
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Demo data generated successfully!" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Warning: Demo data generation had issues. Check the output above." -ForegroundColor Yellow
    Write-Host $generateOutput
}
Write-Host ""

# Wait for servers
Write-Host "Waiting for servers to fully start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check server status
Write-Host ""
Write-Host "Step 6: Checking server status..." -ForegroundColor Yellow
$backend = netstat -ano | findstr ":8000" | findstr "LISTENING"
$frontend = netstat -ano | findstr ":3001" | findstr "LISTENING"

if ($backend) {
    Write-Host "  ✓ Backend is running on port 8000" -ForegroundColor Green
} else {
    Write-Host "  ✗ Backend is NOT running - check the backend window" -ForegroundColor Red
}

if ($frontend) {
    Write-Host "  ✓ Frontend is running on port 3001" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Frontend may still be starting - check the frontend window" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Demo Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application:" -ForegroundColor White
Write-Host "  URL:      http://localhost:3001" -ForegroundColor Cyan
Write-Host "  Username: Scorpious" -ForegroundColor Yellow
Write-Host "  Password: L8Rb1tch" -ForegroundColor Yellow
Write-Host ""
Write-Host "Demo data includes:" -ForegroundColor White
Write-Host "  • 200 inventory items" -ForegroundColor Gray
Write-Host "  • 20 locations" -ForegroundColor Gray
Write-Host "  • 50 requisitions" -ForegroundColor Gray
Write-Host "  • 20 count sessions" -ForegroundColor Gray
Write-Host "  • 30 purchase requests" -ForegroundColor Gray
Write-Host ""
Write-Host "Opening browser in 3 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Open browser
Start-Process "http://localhost:3001"

Write-Host ""
Write-Host "Press any key to exit this script (servers will keep running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

