# PowerShell script to start the Django development server
Write-Host "Starting Django development server..." -ForegroundColor Green
Write-Host "Server will be available at http://localhost:8000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

cd $PSScriptRoot
# Bind to 0.0.0.0:8000 to allow access from Android emulator (10.0.2.2) and network devices
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000

