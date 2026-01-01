# IMH IMS - Connection Diagnostic Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMH IMS Connection Diagnostics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if servers are running
Write-Host "1. Checking if servers are running..." -ForegroundColor Yellow
$backendPort = netstat -ano | findstr ":8000" | findstr "LISTENING"
$frontendPort3001 = netstat -ano | findstr ":3001" | findstr "LISTENING"
$frontendPort3000 = netstat -ano | findstr ":3000" | findstr "LISTENING"

if ($backendPort) {
    Write-Host "   ✓ Backend is listening on port 8000" -ForegroundColor Green
} else {
    Write-Host "   ✗ Backend is NOT running on port 8000" -ForegroundColor Red
}

if ($frontendPort3001) {
    Write-Host "   ✓ Frontend is listening on port 3001" -ForegroundColor Green
} else {
    Write-Host "   ✗ Frontend is NOT running on port 3001" -ForegroundColor Red
}

if ($frontendPort3000) {
    Write-Host "   ✓ Frontend is listening on port 3000" -ForegroundColor Green
} else {
    Write-Host "   ✗ Frontend is NOT running on port 3000" -ForegroundColor Red
}

Write-Host ""

# Test backend connection
Write-Host "2. Testing backend connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✓ Backend responded with status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend connection failed" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -match "Unable to connect") {
        Write-Host "     → Backend server is not running. Start it with:" -ForegroundColor Yellow
        Write-Host "       cd backend" -ForegroundColor White
        Write-Host "       .\venv\Scripts\python.exe manage.py runserver" -ForegroundColor White
    }
}

Write-Host ""

# Test frontend connection
Write-Host "3. Testing frontend connection..." -ForegroundColor Yellow
$frontendWorking = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✓ Frontend responded on port 3001 with status: $($response.StatusCode)" -ForegroundColor Green
    $frontendWorking = $true
} catch {
    Write-Host "   ✗ Frontend connection failed on port 3001" -ForegroundColor Red
    Write-Host "     Trying port 3000..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "   ✓ Frontend responded on port 3000 with status: $($response.StatusCode)" -ForegroundColor Green
        $frontendWorking = $true
    } catch {
        Write-Host "   ✗ Frontend connection failed on port 3000" -ForegroundColor Red
        Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Message -match "Unable to connect") {
            Write-Host "     → Frontend server is not running. Start it with:" -ForegroundColor Yellow
            Write-Host "       cd frontend" -ForegroundColor White
            Write-Host "       npm start" -ForegroundColor White
        }
    }
}

Write-Host ""

# Check processes
Write-Host "4. Checking running processes..." -ForegroundColor Yellow
$pythonProcs = Get-Process python -ErrorAction SilentlyContinue
$nodeProcs = Get-Process node -ErrorAction SilentlyContinue

if ($pythonProcs) {
    Write-Host "   ✓ Python processes found: $($pythonProcs.Count)" -ForegroundColor Green
    $pythonProcs | ForEach-Object { Write-Host "     - PID: $($_.Id)" -ForegroundColor Gray }
} else {
    Write-Host "   ✗ No Python processes found" -ForegroundColor Red
}

if ($nodeProcs) {
    Write-Host "   ✓ Node processes found: $($nodeProcs.Count)" -ForegroundColor Green
    $nodeProcs | ForEach-Object { Write-Host "     - PID: $($_.Id)" -ForegroundColor Gray }
} else {
    Write-Host "   ✗ No Node processes found" -ForegroundColor Red
}

Write-Host ""

# Check configuration
Write-Host "5. Checking configuration..." -ForegroundColor Yellow
$backendSettings = Test-Path "backend\imh\settings.py"
$frontendEnv = Test-Path "frontend\.env"
$frontendPackage = Test-Path "frontend\package.json"

if ($backendSettings) {
    Write-Host "   ✓ Backend settings file exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Backend settings file missing" -ForegroundColor Red
}

if ($frontendEnv) {
    Write-Host "   ✓ Frontend .env file exists" -ForegroundColor Green
    Write-Host "     Contents:" -ForegroundColor Gray
    Get-Content "frontend\.env" | ForEach-Object { Write-Host "       $_" -ForegroundColor Gray }
} else {
    Write-Host "   ⚠ Frontend .env file not found (will use default port 3000)" -ForegroundColor Yellow
}

if ($frontendPackage) {
    Write-Host "   ✓ Frontend package.json exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Frontend package.json missing" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($backendPort -and $frontendWorking) {
    Write-Host "✓ Both servers appear to be running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Try accessing:" -ForegroundColor Yellow
    if ($frontendPort3001) {
        Write-Host "  Frontend: http://localhost:3001" -ForegroundColor White
    } else {
        Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    }
    Write-Host "  Backend:  http://localhost:8000/api/" -ForegroundColor White
} else {
    Write-Host "✗ Connection issues detected" -ForegroundColor Red
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    if (-not $backendPort) {
        Write-Host "  1. Start the backend server" -ForegroundColor White
        Write-Host "     cd backend" -ForegroundColor Gray
        Write-Host "     .\venv\Scripts\python.exe manage.py runserver" -ForegroundColor Gray
    }
    if (-not $frontendPort3001 -and -not $frontendPort3000) {
        Write-Host "  2. Start the frontend server" -ForegroundColor White
        Write-Host "     cd frontend" -ForegroundColor Gray
        Write-Host "     npm start" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "  Or use the startup script:" -ForegroundColor White
    Write-Host "     powershell -ExecutionPolicy Bypass -File .\start-all.ps1" -ForegroundColor Gray
}

Write-Host ""
