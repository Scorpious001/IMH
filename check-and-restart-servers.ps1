# Script to check endpoints and restart servers
Write-Host "=== IMH IMS Server Restart Script ===" -ForegroundColor Green
Write-Host ""

# Kill existing processes on ports 8000 and 3001
Write-Host "Stopping existing servers..." -ForegroundColor Yellow

$backendProcess = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
$frontendProcess = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($backendProcess) {
    Write-Host "Killing backend process (PID: $backendProcess)..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

if ($frontendProcess) {
    Write-Host "Killing frontend process (PID: $frontendProcess)..." -ForegroundColor Yellow
    Stop-Process -Id $frontendProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Green
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

# Start Backend
Write-Host "Starting Backend Server on http://0.0.0.0:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; Write-Host '=== Django Backend Server ===' -ForegroundColor Green; Write-Host 'Starting on http://localhost:8000' -ForegroundColor Yellow; Write-Host 'API: http://localhost:8000/api/' -ForegroundColor Yellow; Write-Host ''; .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server on http://localhost:3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$frontendPath'; Write-Host '=== React Frontend Server ===' -ForegroundColor Green; Write-Host 'Starting on http://localhost:3001' -ForegroundColor Yellow; Write-Host ''; if (-not (Test-Path .env)) { 'PORT=3001' | Out-File -FilePath .env -Encoding utf8 }; `$env:PORT=3001; npm start"
) -WindowStyle Normal

Write-Host ""
Write-Host "Waiting for servers to start (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "=== Checking Server Status ===" -ForegroundColor Cyan
Write-Host ""

# Check backend
$backendListening = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($backendListening) {
    Write-Host "✓ Backend is running on port 8000" -ForegroundColor Green
} else {
    Write-Host "✗ Backend is NOT running - check the backend window for errors" -ForegroundColor Red
}

# Check frontend
$frontendListening = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($frontendListening) {
    Write-Host "✓ Frontend is running on port 3001" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend is NOT running - check the frontend window for errors" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Testing API Endpoints ===" -ForegroundColor Cyan
Write-Host ""

# Test backend endpoints
$baseUrl = "http://localhost:8000"

try {
    # Test CSRF endpoint
    Write-Host "Testing /api/auth/csrf/..." -ForegroundColor Yellow
    $csrfResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/csrf/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ CSRF endpoint: OK (Status: $($csrfResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ✗ CSRF endpoint: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    # Test API root
    Write-Host "Testing /api/..." -ForegroundColor Yellow
    $apiResponse = Invoke-WebRequest -Uri "$baseUrl/api/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ API root: OK (Status: $($apiResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ✗ API root: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Available Endpoints ===" -ForegroundColor Cyan
Write-Host "Authentication:" -ForegroundColor Yellow
Write-Host "  GET  $baseUrl/api/auth/csrf/" -ForegroundColor White
Write-Host "  POST $baseUrl/api/auth/login/" -ForegroundColor White
Write-Host "  POST $baseUrl/api/auth/logout/" -ForegroundColor White
Write-Host "  GET  $baseUrl/api/auth/user/" -ForegroundColor White
Write-Host ""
Write-Host "Core Resources:" -ForegroundColor Yellow
Write-Host "  GET/POST   $baseUrl/api/items/" -ForegroundColor White
Write-Host "  GET/POST   $baseUrl/api/locations/" -ForegroundColor White
Write-Host "  GET        $baseUrl/api/stock/" -ForegroundColor White
Write-Host "  GET/POST   $baseUrl/api/requisitions/" -ForegroundColor White
Write-Host "  GET/POST   $baseUrl/api/counts/sessions/" -ForegroundColor White
Write-Host "  GET/POST   $baseUrl/api/purchase-requests/" -ForegroundColor White
Write-Host ""
Write-Host "Stock Operations:" -ForegroundColor Yellow
Write-Host "  POST $baseUrl/api/stock/transfer/" -ForegroundColor White
Write-Host "  POST $baseUrl/api/stock/issue/" -ForegroundColor White
Write-Host "  POST $baseUrl/api/stock/adjust/" -ForegroundColor White
Write-Host ""
Write-Host "Requisitions:" -ForegroundColor Yellow
Write-Host "  POST $baseUrl/api/requisitions/{id}/pick/" -ForegroundColor White
Write-Host "  POST $baseUrl/api/requisitions/{id}/complete/" -ForegroundColor White
Write-Host "  POST $baseUrl/api/requisitions/{id}/approve/" -ForegroundColor White
Write-Host "  POST $baseUrl/api/requisitions/{id}/deny/" -ForegroundColor White
Write-Host ""
Write-Host "Receiving:" -ForegroundColor Yellow
Write-Host "  POST $baseUrl/api/receiving/receive/" -ForegroundColor White
Write-Host "  GET  $baseUrl/api/receiving/history/" -ForegroundColor White
Write-Host ""
Write-Host "Counts:" -ForegroundColor Yellow
Write-Host "  POST $baseUrl/api/counts/sessions/{id}/lines/" -ForegroundColor White
Write-Host "  POST $baseUrl/api/counts/sessions/{id}/complete/" -ForegroundColor White
Write-Host "  POST $baseUrl/api/counts/sessions/{id}/approve/" -ForegroundColor White
Write-Host ""
Write-Host "Reports:" -ForegroundColor Yellow
Write-Host "  GET $baseUrl/api/reports/alerts/" -ForegroundColor White
Write-Host "  GET $baseUrl/api/reports/suggested-orders/" -ForegroundColor White
Write-Host "  GET $baseUrl/api/reports/usage-trends/" -ForegroundColor White
Write-Host "  GET $baseUrl/api/reports/general-usage/" -ForegroundColor White
Write-Host "  GET $baseUrl/api/reports/low-par-trends/" -ForegroundColor White
Write-Host ""
Write-Host "Settings:" -ForegroundColor Yellow
Write-Host "  GET/POST   $baseUrl/api/settings/categories/" -ForegroundColor White
Write-Host "  GET/POST   $baseUrl/api/settings/vendors/" -ForegroundColor White
Write-Host "  GET/POST   $baseUrl/api/settings/users/" -ForegroundColor White
Write-Host "  GET/POST   $baseUrl/api/settings/par-levels/" -ForegroundColor White
Write-Host "  GET/POST   $baseUrl/api/settings/categories/{id}/par-levels/" -ForegroundColor White
Write-Host ""
Write-Host "Purchase Requests:" -ForegroundColor Yellow
Write-Host "  POST $baseUrl/api/purchase-requests/{id}/approve/" -ForegroundColor White
Write-Host "  POST $baseUrl/api/purchase-requests/{id}/deny/" -ForegroundColor White
Write-Host ""
Write-Host "=== Access URLs ===" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "Backend API: $baseUrl/api/" -ForegroundColor White
Write-Host "Admin Panel: $baseUrl/admin/" -ForegroundColor White
Write-Host ""
Write-Host "Check the PowerShell windows that opened for detailed server output." -ForegroundColor Yellow
Write-Host ""

