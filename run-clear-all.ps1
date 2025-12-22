# PowerShell script to run the complete system data clearing
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "COMPLETE SYSTEM DATA REMOVAL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = Join-Path $PSScriptRoot "backend"
$rootDir = $PSScriptRoot

# Change to backend directory
Push-Location $backendDir

Write-Host "Step 1: Clearing all inventory data and Django sessions..." -ForegroundColor Yellow
Write-Host ""

# Run data clearing script
try {
    & .\venv\Scripts\python.exe clear_all_data.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Data clearing completed successfully" -ForegroundColor Green
    } else {
        Write-Host "`n✗ Data clearing failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "`n✗ Error running data clearing script: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 2: Cleaning up generated files..." -ForegroundColor Yellow
Write-Host ""

# Run file cleanup script
try {
    & .\venv\Scripts\python.exe cleanup_generated_files.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ File cleanup completed successfully" -ForegroundColor Green
    } else {
        Write-Host "`n✗ File cleanup failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "`n✗ Error running file cleanup script: $_" -ForegroundColor Red
}

Pop-Location

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "OPERATION COMPLETE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

