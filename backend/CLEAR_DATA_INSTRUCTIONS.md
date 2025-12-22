# Instructions for Clearing Inventory Data

## Overview

The system has been enhanced to properly clear all inventory data while handling SQLite WAL files and preventing browser caching. All necessary scripts and commands have been created.

## Complete System Data Removal (Recommended)

For a complete cleanup that removes **all data except user accounts** and **all generated files**, use the master script:

### Master Script: Clear All System Data

```powershell
cd "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH"
python clear_all_system_data.py
```

This master script will:
1. **Clear all inventory data** (items, locations, categories, vendors, stock, transactions, requisitions, counts, purchase requests)
2. **Clear all Django sessions**
3. **Remove SQLite WAL/SHM files**
4. **Remove all log files** (clear_log.txt, clear_execution_results.txt, etc.)
5. **Remove Python cache files** (all __pycache__ directories)
6. **Remove media files** (backend/media/ directory contents)
7. **Remove frontend build artifacts** (build/, .cache/, dist/, .next/ directories)

**What gets preserved:**
- User accounts and authentication data

**What gets removed:**
- All inventory data
- All Django sessions
- All generated files (WAL, logs, cache, media, build artifacts)

### Individual Scripts

You can also run the individual scripts separately:

#### Option A: Clear Data Only

```powershell
cd "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\backend"
.\venv\Scripts\python.exe clear_all_data.py
```

This clears all inventory data and Django sessions while preserving user accounts.

#### Option B: Cleanup Generated Files Only

```powershell
cd "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\backend"
.\venv\Scripts\python.exe cleanup_generated_files.py
```

This removes all generated files (WAL, logs, cache, media, build artifacts) without touching database data.

## What Was Implemented

1. **Enhanced Clear Command** (`clear_inventory_data.py`)
   - Detects and handles SQLite WAL files
   - Checkpoints WAL before deletion
   - Vacuums database after deletion
   - Removes WAL/SHM files

2. **No-Cache Middleware** (`api/middleware.py`)
   - Prevents browser caching of API responses
   - Added to Django middleware stack

3. **Verification Scripts**
   - `verify_and_clear_all.py` - Comprehensive verification and clearing
   - `force_clear_data.py` - Direct data clearing with logging

## Legacy Options (Inventory Data Only)

These options clear only inventory data and preserve Django sessions. For complete system cleanup, use the master script above.

### Option 1: Use the Management Command

```powershell
cd "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\backend"
.\venv\Scripts\python.exe manage.py clear_inventory_data --noinput --verbose
```

This will:
- Check for WAL files
- Show summary of data to be deleted
- Delete all inventory data
- Vacuum the database
- Remove WAL files if possible

### Option 2: Use the Force Clear Script

```powershell
cd "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\backend"
.\venv\Scripts\python.exe force_clear_data.py
```

Then check `force_clear_log.txt` for results.

### Option 3: Use the Comprehensive Verification Script

```powershell
cd "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\backend"
.\venv\Scripts\python.exe verify_and_clear_all.py
```

Then check `clear_log.txt` for detailed results.

## Verify Data Was Cleared

### Check Database State

```powershell
cd "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\backend"
.\venv\Scripts\python.exe check_db_state.py
```

Or use Django shell:

```powershell
.\venv\Scripts\python.exe manage.py shell
```

Then in the shell:
```python
from imh_ims.models import Item, Location, Category, Vendor
print(f"Items: {Item.objects.count()}")
print(f"Locations: {Location.objects.count()}")
print(f"Categories: {Category.objects.count()}")
print(f"Vendors: {Vendor.objects.count()}")
```

### Check for WAL Files

```powershell
Get-ChildItem -Filter "*wal*" -Force
Get-ChildItem -Filter "*shm*" -Force
```

If WAL files exist and can't be deleted, restart the Django server to release the database lock.

## Frontend Cache Clearing

After clearing data:

1. **Hard refresh the browser**: Press `Ctrl+Shift+R` or `Ctrl+F5`
2. **Clear browser cache**: 
   - Chrome: Settings > Privacy > Clear browsing data
   - Or use Developer Tools > Application > Clear storage
3. **Check Network tab**: Verify API responses have `Cache-Control: no-cache` headers

## Troubleshooting

### If items still show after clearing:

1. **Restart Django server** - This releases database locks and allows WAL file removal
2. **Check WAL files exist** - If they do, the server needs to be stopped to remove them
3. **Hard refresh browser** - Clear browser cache
4. **Check API directly** - Visit `http://localhost:8000/api/items/` to see if API returns empty data
5. **Verify database** - Use `check_db_state.py` to confirm database is empty

### If WAL files can't be removed:

WAL files are locked when the database is in use. To remove them:
1. Stop the Django server
2. Delete the files manually:
   ```powershell
   Remove-Item db.sqlite3-wal -ErrorAction SilentlyContinue
   Remove-Item db.sqlite3-shm -ErrorAction SilentlyContinue
   ```
3. Restart the server

## What Gets Deleted (Complete System Removal)

When using `clear_all_system_data.py` or `clear_all_data.py`:

**Database Data:**
- Items
- Locations
- Categories
- Vendors
- Stock Levels
- Inventory Transactions
- Requisitions
- Count Sessions
- Purchase Requests
- Django Sessions

**Generated Files:**
- SQLite WAL files (db.sqlite3-wal)
- SQLite SHM files (db.sqlite3-shm)
- Log files (clear_log.txt, clear_execution_results.txt, force_clear_log.txt)
- Python cache directories (__pycache__)
- Media files (backend/media/ contents)
- Frontend build artifacts (build/, .cache/, dist/, .next/)

## What Gets Preserved

- User accounts and authentication data
- Database schema and migrations
- Application code and configuration

## Important Notes

- **Stop the Django server** before running data clearing scripts to release database locks
- The master script (`clear_all_system_data.py`) handles SQLite WAL files automatically
- Database vacuuming ensures data is completely removed
- All operations are wrapped in transactions for safety
- No-cache headers prevent browser from showing stale data
- User accounts are always preserved - they must be deleted manually if needed

## Scripts Reference

| Script | Purpose | Location |
|--------|---------|----------|
| `clear_all_system_data.py` | Master script - clears all data and files | `IMH/` (root) |
| `clear_all_data.py` | Clear inventory data + sessions | `IMH/backend/` |
| `cleanup_generated_files.py` | Remove generated files only | `IMH/backend/` |
| `clear_inventory_data.py` | Django management command (inventory only) | `IMH/backend/imh_ims/management/commands/` |
| `verify_and_clear_all.py` | Legacy verification script | `IMH/backend/` |

