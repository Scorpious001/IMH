# Quick setup script - Run migrations and assign admin role
# Usage: .\setup-admin.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMH Setup - Migrations & Admin Role" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
$backendPath = "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\backend"
Set-Location $backendPath

# Step 1: Run migrations
Write-Host "Step 1: Running database migrations..." -ForegroundColor Yellow
& .\venv\Scripts\python.exe manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Migration failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Migrations completed" -ForegroundColor Green
Write-Host ""

# Step 2: Assign admin role to Scorpious
Write-Host "Step 2: Assigning ADMIN role to Scorpious user..." -ForegroundColor Yellow
& .\venv\Scripts\python.exe manage.py create_scorpious_user
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to assign admin role!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Admin role assigned" -ForegroundColor Green
Write-Host ""

# Step 3: Verify setup
Write-Host "Step 3: Verifying setup..." -ForegroundColor Yellow
& .\venv\Scripts\python.exe check_setup.py
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now log in as 'Scorpious' with admin privileges." -ForegroundColor White

