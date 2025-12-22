# Start both Backend and Frontend
# Run this script from the IMH directory

Write-Host "Starting IMH Application..." -ForegroundColor Green
Write-Host ""

# Start backend in a new window
$backendScript = Join-Path $PSScriptRoot "start-backend.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$backendScript`""

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new window
$frontendScript = Join-Path $PSScriptRoot "start-frontend.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$frontendScript`""

Write-Host "Backend and Frontend are starting in separate windows..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
