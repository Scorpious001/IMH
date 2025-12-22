# Start both servers with visible output
Write-Host "Starting IMH IMS Servers..." -ForegroundColor Green
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; Write-Host '=== Django Backend Server ===' -ForegroundColor Green; Write-Host 'Starting on http://localhost:8000' -ForegroundColor Yellow; Write-Host ''; .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$frontendPath'; Write-Host '=== React Frontend Server ===' -ForegroundColor Green; Write-Host 'Starting on http://localhost:3001' -ForegroundColor Yellow; Write-Host ''; if (-not (Test-Path .env)) { 'PORT=3001' | Out-File -FilePath .env -Encoding utf8 }; npm start"
) -WindowStyle Normal

Write-Host ""
Write-Host "Servers are starting in separate windows..." -ForegroundColor Yellow
Write-Host "Please wait 10-15 seconds for them to fully start." -ForegroundColor Yellow
Write-Host ""
Write-Host "Then access:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000/api/" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to check server status..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Check status
Write-Host ""
Write-Host "=== Checking Server Status ===" -ForegroundColor Cyan
Start-Sleep -Seconds 5

$backend = netstat -ano | findstr ":8000" | findstr "LISTENING"
$frontend = netstat -ano | findstr ":3001" | findstr "LISTENING"

if ($backend) {
    Write-Host "✓ Backend is running on port 8000" -ForegroundColor Green
} else {
    Write-Host "✗ Backend is NOT running - check the backend window for errors" -ForegroundColor Red
}

if ($frontend) {
    Write-Host "✓ Frontend is running on port 3001" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend is NOT running - check the frontend window for errors" -ForegroundColor Red
}

Write-Host ""
Write-Host "Check the PowerShell windows that opened for detailed server output." -ForegroundColor Yellow

