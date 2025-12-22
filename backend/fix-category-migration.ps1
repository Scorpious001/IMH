# Fix Category Migration - Add par_min and par_max columns
Write-Host "Applying category migration..." -ForegroundColor Yellow

cd $PSScriptRoot

# Activate virtual environment and run migration
.\venv\Scripts\python.exe manage.py migrate imh_ims 0004_add_category_par_levels --verbosity 2

Write-Host "`nChecking migration status..." -ForegroundColor Yellow
.\venv\Scripts\python.exe manage.py showmigrations imh_ims

Write-Host "`nMigration complete! Try creating a category again." -ForegroundColor Green

