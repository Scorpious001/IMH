# PowerShell script to create demo users
# Usage: .\create-demo-users.ps1 [--clear]

param(
    [switch]$Clear
)

Write-Host "Creating Demo Users..." -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
$backendDir = Join-Path $PSScriptRoot "backend"
if (-not (Test-Path $backendDir)) {
    Write-Host "ERROR: backend directory not found!" -ForegroundColor Red
    exit 1
}

Set-Location $backendDir

# Activate virtual environment if it exists
$venvPath = Join-Path $backendDir "venv"
if (Test-Path $venvPath) {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & "$venvPath\Scripts\Activate.ps1"
}

# Build command
$command = "python manage.py create_demo_users"
if ($Clear) {
    $command += " --clear"
}

# Run the command
Write-Host "Running: $command" -ForegroundColor Yellow
Write-Host ""
Invoke-Expression $command

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Demo users created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Demo Login Credentials:" -ForegroundColor Cyan
    Write-Host "======================" -ForegroundColor Cyan
    Write-Host "Username: demo_admin     | Password: demo123 | Role: ADMIN" -ForegroundColor White
    Write-Host "Username: demo_manager   | Password: demo123 | Role: MANAGER" -ForegroundColor White
    Write-Host "Username: demo_supervisor| Password: demo123 | Role: SUPERVISOR" -ForegroundColor White
    Write-Host "Username: demo_staff     | Password: demo123 | Role: SUPERVISOR" -ForegroundColor White
    Write-Host "Username: demo_user1     | Password: demo123 | Role: SUPERVISOR" -ForegroundColor White
    Write-Host "Username: demo_user2     | Password: demo123 | Role: SUPERVISOR" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✗ Failed to create demo users!" -ForegroundColor Red
    exit 1
}
