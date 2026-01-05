# Seed Data Script for IMH IMS
# This script generates comprehensive seed data for the system
# Usage: .\seed-data.ps1 [--clear]

param(
    [switch]$Clear = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMH IMS - Seed Data Generation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"
$venvPython = Join-Path $backendPath "venv\Scripts\python.exe"

# Check if venv exists, if not use system python
if (-not (Test-Path $venvPython)) {
    $venvPython = "python"
    Write-Host "Using system Python (venv not found)" -ForegroundColor Yellow
}

Push-Location $backendPath

$clearFlag = if ($Clear) { "--clear" } else { "" }

Write-Host "Generating seed data..." -ForegroundColor Yellow
if ($Clear) {
    Write-Host "  (Clearing existing data first)" -ForegroundColor Yellow
}
Write-Host ""

& $venvPython manage.py seed_data $clearFlag

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Seed data generation failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Seed Data Generation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now log in and explore the system with full data." -ForegroundColor Cyan

Pop-Location
