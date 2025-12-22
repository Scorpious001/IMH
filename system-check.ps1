# IMH IMS - System Check Script
# This script verifies that all components are ready to start

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMH IMS System Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"

$allChecksPassed = $true

# ========================================
# Backend Checks
# ========================================
Write-Host "BACKEND CHECKS" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

# Check 1: Virtual Environment
Write-Host -NoNewline "1. Virtual Environment: "
$venvPath = Join-Path $backendPath "venv\Scripts\python.exe"
if (Test-Path $venvPath) {
    Write-Host "✓ EXISTS" -ForegroundColor Green
} else {
    Write-Host "✗ NOT FOUND" -ForegroundColor Red
    $allChecksPassed = $false
}

# Check 2: Python Version
Write-Host -NoNewline "2. Python Version: "
if (Test-Path $venvPath) {
    try {
        $pythonVersion = & $venvPath --version 2>&1
        Write-Host "✓ $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "✗ ERROR" -ForegroundColor Red
        $allChecksPassed = $false
    }
} else {
    Write-Host "✗ SKIPPED (no venv)" -ForegroundColor Yellow
}

# Check 3: Required Python Packages
Write-Host -NoNewline "3. Python Dependencies: "
if (Test-Path $venvPath) {
    try {
        $result = & $venvPath -c "import django; import rest_framework; import corsheaders; import faker; print('OK')" 2>&1
        if ($result -match "OK") {
            $djangoVersion = & $venvPath -c "import django; print(django.__version__)" 2>&1
            Write-Host "✓ INSTALLED (Django $djangoVersion)" -ForegroundColor Green
        } else {
            Write-Host "✗ MISSING PACKAGES" -ForegroundColor Red
            $allChecksPassed = $false
        }
    } catch {
        Write-Host "✗ ERROR CHECKING" -ForegroundColor Red
        $allChecksPassed = $false
    }
} else {
    Write-Host "✗ SKIPPED (no venv)" -ForegroundColor Yellow
}

# Check 4: Database File
Write-Host -NoNewline "4. Database File: "
$dbPath = Join-Path $backendPath "db.sqlite3"
if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length / 1KB
    Write-Host "✓ EXISTS ($([math]::Round($dbSize, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "⚠ NOT FOUND (will be created on migration)" -ForegroundColor Yellow
}

# Check 5: Django Settings
Write-Host -NoNewline "5. Django Settings: "
$settingsPath = Join-Path $backendPath "imh\settings.py"
if (Test-Path $settingsPath) {
    Write-Host "✓ EXISTS" -ForegroundColor Green
} else {
    Write-Host "✗ NOT FOUND" -ForegroundColor Red
    $allChecksPassed = $false
}

# Check 6: Django Configuration
Write-Host -NoNewline "6. Django Configuration: "
if (Test-Path $venvPath) {
    try {
        $result = & $venvPath (Join-Path $backendPath "manage.py") check 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ VALID" -ForegroundColor Green
        } else {
            Write-Host "✗ ERRORS FOUND" -ForegroundColor Red
            $allChecksPassed = $false
        }
    } catch {
        Write-Host "⚠ CANNOT VERIFY" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ SKIPPED (no venv)" -ForegroundColor Yellow
}

# Check 7: Management Commands
Write-Host -NoNewline "7. Management Commands: "
$scorpiousCmd = Join-Path $backendPath "imh_ims\management\commands\create_scorpious_user.py"
if (Test-Path $scorpiousCmd) {
    Write-Host "✓ EXISTS" -ForegroundColor Green
} else {
    Write-Host "✗ MISSING" -ForegroundColor Red
    $allChecksPassed = $false
}

Write-Host ""

# ========================================
# Frontend Checks
# ========================================
Write-Host "FRONTEND CHECKS" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

# Check 8: Node.js
Write-Host -NoNewline "8. Node.js: "
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "✗ NOT FOUND" -ForegroundColor Red
        $allChecksPassed = $false
    }
} catch {
    Write-Host "✗ NOT FOUND" -ForegroundColor Red
    $allChecksPassed = $false
}

# Check 9: npm
Write-Host -NoNewline "9. npm: "
try {
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ v$npmVersion" -ForegroundColor Green
    } else {
        Write-Host "✗ NOT FOUND" -ForegroundColor Red
        $allChecksPassed = $false
    }
} catch {
    Write-Host "✗ NOT FOUND" -ForegroundColor Red
    $allChecksPassed = $false
}

# Check 10: node_modules
Write-Host -NoNewline "10. node_modules: "
$nodeModulesPath = Join-Path $frontendPath "node_modules"
if (Test-Path $nodeModulesPath) {
    Write-Host "✓ EXISTS" -ForegroundColor Green
} else {
    Write-Host "✗ NOT FOUND" -ForegroundColor Red
    Write-Host "   Run: cd frontend && npm install" -ForegroundColor Yellow
    $allChecksPassed = $false
}

# Check 11: package.json
Write-Host -NoNewline "11. package.json: "
$packageJsonPath = Join-Path $frontendPath "package.json"
if (Test-Path $packageJsonPath) {
    Write-Host "✓ EXISTS" -ForegroundColor Green
} else {
    Write-Host "✗ NOT FOUND" -ForegroundColor Red
    $allChecksPassed = $false
}

# Check 12: Frontend .env file
Write-Host -NoNewline "12. Frontend .env: "
$envPath = Join-Path $frontendPath ".env"
if (Test-Path $envPath) {
    Write-Host "✓ EXISTS" -ForegroundColor Green
    Get-Content $envPath | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "⚠ NOT FOUND (will use default port 3000)" -ForegroundColor Yellow
}

# Check 13: Frontend Source Files
Write-Host -NoNewline "13. Frontend Source: "
$srcPath = Join-Path $frontendPath "src"
$appPath = Join-Path $srcPath "App.tsx"
if (Test-Path $appPath) {
    Write-Host "✓ EXISTS" -ForegroundColor Green
} else {
    Write-Host "✗ NOT FOUND" -ForegroundColor Red
    $allChecksPassed = $false
}

Write-Host ""

# ========================================
# Port Availability
# ========================================
Write-Host "PORT AVAILABILITY" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

# Check 14: Port 8000 (Backend)
Write-Host -NoNewline "14. Port 8000 (Backend): "
$port8000 = netstat -ano | findstr ":8000"
if ($port8000) {
    Write-Host "⚠ IN USE" -ForegroundColor Yellow
    Write-Host "   Backend may already be running" -ForegroundColor Gray
} else {
    Write-Host "✓ AVAILABLE" -ForegroundColor Green
}

# Check 15: Port 3000/3001 (Frontend)
Write-Host -NoNewline "15. Port 3000 (Frontend): "
$port3000 = netstat -ano | findstr ":3000"
if ($port3000) {
    Write-Host "⚠ IN USE" -ForegroundColor Yellow
    Write-Host "   Frontend may already be running" -ForegroundColor Gray
} else {
    Write-Host "✓ AVAILABLE" -ForegroundColor Green
}

Write-Host -NoNewline "16. Port 3001 (Frontend Alt): "
$port3001 = netstat -ano | findstr ":3001"
if ($port3001) {
    Write-Host "⚠ IN USE" -ForegroundColor Yellow
    Write-Host "   Frontend may already be running" -ForegroundColor Gray
} else {
    Write-Host "✓ AVAILABLE" -ForegroundColor Green
}

Write-Host ""

# ========================================
# Summary
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($allChecksPassed) {
    Write-Host "✓ SYSTEM READY TO START" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start the system, run:" -ForegroundColor Yellow
    Write-Host "  cd IMH" -ForegroundColor White
    Write-Host "  powershell -ExecutionPolicy Bypass -File .\start-all.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or start manually:" -ForegroundColor Yellow
    Write-Host "  Backend:  cd IMH\backend && .\venv\Scripts\python.exe manage.py runserver" -ForegroundColor White
    Write-Host "  Frontend: cd IMH\frontend && npm start" -ForegroundColor White
} else {
    Write-Host "✗ SYSTEM NOT READY - Please fix the issues above" -ForegroundColor Red
}

Write-Host ""

