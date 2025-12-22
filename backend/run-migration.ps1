# PowerShell script to activate venv and run migrations
# Run this script from the backend directory

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to activate virtual environment!" -ForegroundColor Red
    exit 1
}

Write-Host "Running migrations..." -ForegroundColor Yellow
python manage.py migrate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Migrations completed successfully!" -ForegroundColor Green
    Write-Host "`nAssigning ADMIN role to Scorpious user..." -ForegroundColor Yellow
    python manage.py create_scorpious_user
    Write-Host "`n✓ Setup complete!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Migration failed!" -ForegroundColor Red
    exit 1
}

