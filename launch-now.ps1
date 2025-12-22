# IMH IMS - Direct Server Launch
# This script starts both servers and shows their status

Write-Host "========================================" -ForegroundColor Green
Write-Host "IMH IMS - Starting Servers" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"

# Stop any existing servers
Write-Host "Stopping any existing servers..." -ForegroundColor Yellow
Get-Process python,node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*IMH*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend
Write-Host "Starting Backend Server (Django)..." -ForegroundColor Cyan
$backendProc = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; Write-Host '========================================' -ForegroundColor Green; Write-Host 'BACKEND SERVER (Django)' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Green; Write-Host ''; Write-Host 'Starting on: http://localhost:8000' -ForegroundColor Yellow; Write-Host 'API: http://localhost:8000/api/' -ForegroundColor Yellow; Write-Host ''; .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"
) -WindowStyle Normal -PassThru

Write-Host "  Backend window opened (PID: $($backendProc.Id))" -ForegroundColor Gray

# Wait a moment
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server (React)..." -ForegroundColor Cyan

# Ensure .env exists
if (-not (Test-Path (Join-Path $frontendPath ".env"))) {
    "PORT=3001" | Out-File -FilePath (Join-Path $frontendPath ".env") -Encoding utf8
    Write-Host "  Created .env file for port 3001" -ForegroundColor Gray
}

$frontendProc = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$frontendPath'; Write-Host '========================================' -ForegroundColor Green; Write-Host 'FRONTEND SERVER (React)' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Green; Write-Host ''; Write-Host 'Starting on: http://localhost:3001' -ForegroundColor Yellow; Write-Host ''; npm start"
) -WindowStyle Normal -PassThru

Write-Host "  Frontend window opened (PID: $($frontendProc.Id))" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Servers are starting..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Please wait 15-20 seconds for both servers to fully start." -ForegroundColor Yellow
Write-Host ""
Write-Host "Two PowerShell windows should have opened:" -ForegroundColor Cyan
Write-Host "  1. Backend Server (Django)" -ForegroundColor White
Write-Host "  2. Frontend Server (React)" -ForegroundColor White
Write-Host ""
Write-Host "Check those windows for:" -ForegroundColor Cyan
Write-Host "  Backend: 'Starting development server at http://0.0.0.0:8000/'" -ForegroundColor Gray
Write-Host "  Frontend: 'Compiled successfully!' and 'Local: http://localhost:3001'" -ForegroundColor Gray
Write-Host ""

# Wait and check status
Write-Host "Waiting 20 seconds, then checking server status..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SERVER STATUS CHECK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check ports
$backendPort = netstat -ano | findstr ":8000" | findstr "LISTENING"
$frontendPort = netstat -ano | findstr ":3001" | findstr "LISTENING"

if ($backendPort) {
    Write-Host "✓ Backend is LISTENING on port 8000" -ForegroundColor Green
} else {
    Write-Host "✗ Backend is NOT listening on port 8000" -ForegroundColor Red
    Write-Host "  → Check the Backend PowerShell window for errors" -ForegroundColor Yellow
}

if ($frontendPort) {
    Write-Host "✓ Frontend is LISTENING on port 3001" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend is NOT listening on port 3001" -ForegroundColor Red
    Write-Host "  → Check the Frontend PowerShell window for errors" -ForegroundColor Yellow
}

Write-Host ""

# Test HTTP connections
Write-Host "Testing HTTP connections..." -ForegroundColor Cyan
Write-Host ""

$backendOk = $false
$frontendOk = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Backend HTTP: SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
    $backendOk = $true
} catch {
    Write-Host "✗ Backend HTTP: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Frontend HTTP: SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
    $frontendOk = $true
} catch {
    Write-Host "✗ Frontend HTTP: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($backendOk -and $frontendOk) {
    Write-Host "✓✓✓ BOTH SERVERS ARE RUNNING! ✓✓✓" -ForegroundColor Green
    Write-Host ""
    Write-Host "Open your browser and go to:" -ForegroundColor Yellow
    Write-Host "  http://localhost:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "Login with:" -ForegroundColor Yellow
    Write-Host "  Username: Scorpious" -ForegroundColor White
    Write-Host "  Password: L8Rb1tch" -ForegroundColor White
} else {
    Write-Host "✗ Servers are not fully operational" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check the two PowerShell windows that opened" -ForegroundColor White
    Write-Host "  2. Look for error messages in red" -ForegroundColor White
    Write-Host "  3. Make sure ports 8000 and 3001 are not blocked by firewall" -ForegroundColor White
    Write-Host "  4. Try accessing directly:" -ForegroundColor White
    Write-Host "     - Backend: http://localhost:8000/api/" -ForegroundColor Gray
    Write-Host "     - Frontend: http://localhost:3001" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

