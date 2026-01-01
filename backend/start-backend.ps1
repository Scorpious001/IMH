# PowerShell script to start the Django backend server
Write-Host "Starting Django backend server..." -ForegroundColor Green
Write-Host "Server will be available at:" -ForegroundColor Yellow
Write-Host "  - http://localhost:8000 (web browser)" -ForegroundColor Cyan
Write-Host "  - http://10.0.2.2:8000 (Android emulator)" -ForegroundColor Cyan
Write-Host "API endpoints will be at http://localhost:8000/api/" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Navigate to backend directory
Set-Location $PSScriptRoot

# Activate virtual environment and start server
# Bind to 0.0.0.0:8000 to allow access from Android emulator (10.0.2.2) and network devices
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000

