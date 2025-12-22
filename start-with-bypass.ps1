# IMH IMS - Server Startup with Execution Policy Bypass
# This script bypasses PowerShell execution policy and starts both servers

# Bypass execution policy for this session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

Write-Host "========================================" -ForegroundColor Green
Write-Host "IMH IMS - Starting Servers" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"

# Start Backend Server
Write-Host "Starting Backend Server (Django)..." -ForegroundColor Cyan
$backendScript = @"
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
cd '$backendPath'
Write-Host '========================================' -ForegroundColor Green
Write-Host 'BACKEND SERVER (Django)' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Starting on: http://localhost:8000' -ForegroundColor Yellow
Write-Host 'API: http://localhost:8000/api/' -ForegroundColor Yellow
Write-Host ''
& '$backendPath\venv\Scripts\python.exe' manage.py runserver 0.0.0.0:8000
Write-Host ''
Write-Host 'Server stopped. Press any key to close...' -ForegroundColor Red
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@

Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", $backendScript -WindowStyle Normal
Write-Host "  Backend window opened" -ForegroundColor Gray

# Wait a moment
Start-Sleep -Seconds 3

# Ensure frontend .env exists
$frontendEnv = Join-Path $frontendPath ".env"
if (-not (Test-Path $frontendEnv)) {
    "PORT=3001" | Out-File -FilePath $frontendEnv -Encoding utf8
    Write-Host "  Created frontend .env file" -ForegroundColor Gray
}

# Start Frontend Server
Write-Host "Starting Frontend Server (React)..." -ForegroundColor Cyan
$frontendScript = @"
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
cd '$frontendPath'
Write-Host '========================================' -ForegroundColor Green
Write-Host 'FRONTEND SERVER (React)' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Starting on: http://localhost:3001' -ForegroundColor Yellow
Write-Host ''
npm start
Write-Host ''
Write-Host 'Server stopped. Press any key to close...' -ForegroundColor Red
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@

Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", $frontendScript -WindowStyle Normal
Write-Host "  Frontend window opened" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Servers are starting..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Two PowerShell windows should have opened:" -ForegroundColor Cyan
Write-Host "  1. Backend Server (Django)" -ForegroundColor White
Write-Host "  2. Frontend Server (React)" -ForegroundColor White
Write-Host ""
Write-Host "Please wait 15-20 seconds for servers to start." -ForegroundColor Yellow
Write-Host ""
Write-Host "Then open: http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to check server status..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Wait and check
Write-Host ""
Write-Host "Waiting 20 seconds, then checking status..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SERVER STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPort = netstat -ano | findstr ":8000" | findstr "LISTENING"
$frontendPort = netstat -ano | findstr ":3001" | findstr "LISTENING"

if ($backendPort) {
    Write-Host "✓ Backend is LISTENING on port 8000" -ForegroundColor Green
} else {
    Write-Host "✗ Backend is NOT listening - check backend window" -ForegroundColor Red
}

if ($frontendPort) {
    Write-Host "✓ Frontend is LISTENING on port 3001" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend is NOT listening - check frontend window" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing HTTP connections..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Backend HTTP: SUCCESS" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend HTTP: FAILED" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Frontend HTTP: SUCCESS" -ForegroundColor Green
    Write-Host ""
    Write-Host "✓✓✓ SUCCESS! Open http://localhost:3001 in your browser! ✓✓✓" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend HTTP: FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the PowerShell windows for error messages." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

