# PowerShell script to start the Django development server
Write-Host "Starting Django development server..." -ForegroundColor Green
Write-Host "Server will be available at http://localhost:8000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

cd $PSScriptRoot
.\venv\Scripts\python.exe manage.py runserver

