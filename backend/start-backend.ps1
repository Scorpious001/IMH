# PowerShell script to start the Django backend server
Write-Host "Starting Django backend server..." -ForegroundColor Green
Write-Host "Server will be available at http://localhost:8000" -ForegroundColor Yellow
Write-Host "API endpoints will be at http://localhost:8000/api/" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Navigate to backend directory
Set-Location $PSScriptRoot

# Activate virtual environment and start server
.\venv\Scripts\python.exe manage.py runserver

