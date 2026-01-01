# Generate Demo Data for IMH IMS
Write-Host "Generating demo data..." -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"
$venvPython = Join-Path $backendPath "venv\Scripts\python.exe"

# Check if venv exists, if not use system python
if (-not (Test-Path $venvPython)) {
    $venvPython = "python"
}

Push-Location $backendPath

Write-Host "Creating demo user..." -ForegroundColor Yellow
& $venvPython manage.py create_scorpious_user 2>&1 | Out-Null

Write-Host ""
Write-Host "Generating demo data (this may take 30-60 seconds)..." -ForegroundColor Yellow
Write-Host ""

& $venvPython manage.py generate_test_data --clear --categories 15 --vendors 10 --locations 20 --items 200 --requisitions 50 --count-sessions 20 --purchase-requests 30 --transactions 100

Pop-Location

Write-Host ""
Write-Host "Demo data generation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor Cyan
Write-Host "  Username: Scorpious" -ForegroundColor Yellow
Write-Host "  Password: L8Rb1tch" -ForegroundColor Yellow

