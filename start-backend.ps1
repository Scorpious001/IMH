# Start Django Backend Server
# Run this script from the IMH directory

Write-Host "Starting Django Backend Server..." -ForegroundColor Green
Write-Host ""

# Navigate to backend directory
$backendPath = Join-Path $PSScriptRoot "IMH\backend"
Set-Location $backendPath

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Check if virtual environment exists
$venvPython = Join-Path $backendPath "venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "ERROR: Virtual environment not found at $venvPython" -ForegroundColor Red
    Write-Host "Please create the virtual environment first." -ForegroundColor Yellow
    exit 1
}

# Start the server
Write-Host "Starting server at http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

& $venvPython manage.py runserver

