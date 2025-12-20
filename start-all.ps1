# IMH IMS - Startup Script
# This script starts both the Django backend and React frontend servers

Write-Host "Starting IMH IMS Systems..." -ForegroundColor Green
Write-Host ""

# Get the script directory (project root)
# Use $PSScriptRoot if available, otherwise use current directory
if ($PSScriptRoot) {
    $scriptPath = $PSScriptRoot
} else {
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    if (-not $scriptPath) {
        $scriptPath = Get-Location
    }
}

$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"
$venvActivateScript = Join-Path $backendPath "venv\Scripts\Activate.ps1"

# Check if virtual environment exists
if (-Not (Test-Path $venvActivateScript)) {
    Write-Host "Error: Virtual environment not found at $venvActivateScript" -ForegroundColor Red
    Write-Host "Please create the virtual environment first by running:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Yellow
    Write-Host "  python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Activate virtual environment and run backend setup
Write-Host "Setting up backend..." -ForegroundColor Cyan
Set-Location $backendPath
& $venvActivateScript

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Cyan
python manage.py migrate --no-input

# Create/update admin user
Write-Host "Creating/updating admin user..." -ForegroundColor Cyan
python manage.py create_admin_user

# Create/update Scorpious master user
Write-Host "Creating/updating Scorpious master user..." -ForegroundColor Cyan
python manage.py create_scorpious_user

# Start Django backend server in a new window
Write-Host "Starting Django backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; & '$venvActivateScript'; python manage.py runserver" -WindowStyle Normal

# Start React frontend server in a new window
Write-Host "Starting React frontend server..." -ForegroundColor Cyan

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "All systems started!" -ForegroundColor Green
Write-Host "Backend API: http://localhost:8000/api/" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Django Admin: http://localhost:8000/admin/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin credentials:" -ForegroundColor Yellow
Write-Host "  Username: admin" -ForegroundColor Yellow
Write-Host "  Password: admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Master credentials:" -ForegroundColor Yellow
Write-Host "  Username: Scorpious" -ForegroundColor Yellow
Write-Host "  Password: L8Rb1tch" -ForegroundColor Yellow
Write-Host ""
Write-Host "Both servers are running in separate windows. Close those windows to stop the servers." -ForegroundColor Green

