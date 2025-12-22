@echo off
echo ========================================
echo IMH IMS - Starting Servers
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Backend Server...
start "Backend Server" powershell -NoExit -Command "cd '%~dp0backend'; Write-Host '=== BACKEND SERVER ===' -ForegroundColor Green; Write-Host 'Starting on http://localhost:8000' -ForegroundColor Yellow; .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
if not exist "frontend\.env" (
    echo PORT=3001 > "frontend\.env"
)
start "Frontend Server" powershell -NoExit -Command "cd '%~dp0frontend'; Write-Host '=== FRONTEND SERVER ===' -ForegroundColor Green; Write-Host 'Starting on http://localhost:3001' -ForegroundColor Yellow; npm start"

echo.
echo ========================================
echo Servers are starting in separate windows
echo ========================================
echo.
echo Please wait 15-20 seconds for servers to start.
echo.
echo Then open: http://localhost:3001
echo.
echo Press any key to exit this window...
pause >nul

