#!/usr/bin/env python
"""
Script to remove all generated files including:
- SQLite WAL/SHM files
- Log files
- Python __pycache__ directories
- Media files
- Frontend build artifacts
"""
import os
import sys
import shutil
from pathlib import Path

# Get project root (IMH directory)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = PROJECT_ROOT / 'frontend'

def log(msg):
    """Print message"""
    print(msg)

def remove_file(file_path, description=""):
    """Remove a file if it exists"""
    try:
        if file_path.exists():
            size = file_path.stat().st_size
            file_path.unlink()
            log(f"  ✓ Removed {description or file_path.name} ({size:,} bytes)")
            return True
        else:
            log(f"  - {description or file_path.name} not found (skipped)")
            return False
    except Exception as e:
        log(f"  ✗ Error removing {description or file_path.name}: {e}")
        return False

def remove_directory(dir_path, description=""):
    """Remove a directory and all its contents if it exists"""
    try:
        if dir_path.exists() and dir_path.is_dir():
            # Calculate size before deletion
            total_size = sum(f.stat().st_size for f in dir_path.rglob('*') if f.is_file())
            file_count = sum(1 for f in dir_path.rglob('*') if f.is_file())
            shutil.rmtree(dir_path)
            log(f"  ✓ Removed {description or dir_path.name} ({file_count} files, {total_size:,} bytes)")
            return True
        else:
            log(f"  - {description or dir_path.name} not found (skipped)")
            return False
    except Exception as e:
        log(f"  ✗ Error removing {description or dir_path.name}: {e}")
        return False

def remove_pycache_directories(base_dir):
    """Recursively remove all __pycache__ directories, excluding venv and node_modules"""
    removed_count = 0
    total_size = 0
    
    # Directories to exclude from cleanup (these are recreated automatically)
    exclude_dirs = {'venv', 'node_modules', '.venv', 'env'}
    
    try:
        for pycache_dir in base_dir.rglob('__pycache__'):
            if pycache_dir.is_dir():
                # Check if this __pycache__ is inside an excluded directory
                should_exclude = False
                for part in pycache_dir.parts:
                    if part in exclude_dirs:
                        should_exclude = True
                        break
                
                if should_exclude:
                    continue  # Skip venv and other excluded directories
                
                try:
                    # Calculate size
                    dir_size = sum(f.stat().st_size for f in pycache_dir.rglob('*') if f.is_file())
                    file_count = sum(1 for f in pycache_dir.rglob('*') if f.is_file())
                    shutil.rmtree(pycache_dir)
                    removed_count += 1
                    total_size += dir_size
                    log(f"  ✓ Removed {pycache_dir.relative_to(base_dir)} ({file_count} files, {dir_size:,} bytes)")
                except Exception as e:
                    log(f"  ✗ Error removing {pycache_dir.relative_to(base_dir)}: {e}")
        
        if removed_count > 0:
            log(f"\n  Total: {removed_count} __pycache__ directories removed ({total_size:,} bytes)")
            log("  Note: Cache directories in venv/node_modules are excluded (they're recreated automatically)")
        else:
            log("  No __pycache__ directories found (excluding venv/node_modules)")
        
        return removed_count
    except Exception as e:
        log(f"  ✗ Error searching for __pycache__ directories: {e}")
        return 0

def cleanup_sqlite_files():
    """Remove SQLite WAL and SHM files"""
    log("\n" + "=" * 60)
    log("CLEANING SQLITE FILES")
    log("=" * 60)
    
    removed = 0
    
    # WAL file
    wal_path = BACKEND_DIR / 'db.sqlite3-wal'
    if remove_file(wal_path, "SQLite WAL file"):
        removed += 1
    
    # SHM file
    shm_path = BACKEND_DIR / 'db.sqlite3-shm'
    if remove_file(shm_path, "SQLite SHM file"):
        removed += 1
    
    return removed

def cleanup_log_files():
    """Remove log files from backend directory"""
    log("\n" + "=" * 60)
    log("CLEANING LOG FILES")
    log("=" * 60)
    
    log_files = [
        'clear_log.txt',
        'clear_execution_results.txt',
        'force_clear_log.txt',
    ]
    
    removed = 0
    for log_file in log_files:
        log_path = BACKEND_DIR / log_file
        if remove_file(log_path):
            removed += 1
    
    return removed

def cleanup_python_cache():
    """Remove Python __pycache__ directories"""
    log("\n" + "=" * 60)
    log("CLEANING PYTHON CACHE FILES")
    log("=" * 60)
    
    # Remove from backend directory
    removed = remove_pycache_directories(BACKEND_DIR)
    
    return removed

def cleanup_media_files():
    """Remove media files directory contents"""
    log("\n" + "=" * 60)
    log("CLEANING MEDIA FILES")
    log("=" * 60)
    
    media_dir = BACKEND_DIR / 'media'
    
    if not media_dir.exists():
        log("  - Media directory not found (skipped)")
        return 0
    
    # Remove all contents but keep the directory
    removed_files = 0
    removed_dirs = 0
    total_size = 0
    
    try:
        for item in media_dir.iterdir():
            try:
                if item.is_file():
                    size = item.stat().st_size
                    item.unlink()
                    removed_files += 1
                    total_size += size
                elif item.is_dir():
                    dir_size = sum(f.stat().st_size for f in item.rglob('*') if f.is_file())
                    file_count = sum(1 for f in item.rglob('*') if f.is_file())
                    shutil.rmtree(item)
                    removed_dirs += 1
                    total_size += dir_size
            except Exception as e:
                log(f"  ✗ Error removing {item.name}: {e}")
        
        if removed_files > 0 or removed_dirs > 0:
            log(f"  ✓ Removed {removed_files} files and {removed_dirs} directories ({total_size:,} bytes)")
        else:
            log("  - Media directory is empty (skipped)")
        
        return removed_files + removed_dirs
    except Exception as e:
        log(f"  ✗ Error cleaning media directory: {e}")
        return 0

def cleanup_frontend_build():
    """Remove frontend build artifacts"""
    log("\n" + "=" * 60)
    log("CLEANING FRONTEND BUILD ARTIFACTS")
    log("=" * 60)
    
    removed = 0
    
    # Build directory
    build_dir = FRONTEND_DIR / 'build'
    if remove_directory(build_dir, "Frontend build directory"):
        removed += 1
    
    # .cache directory (if exists)
    cache_dir = FRONTEND_DIR / '.cache'
    if remove_directory(cache_dir, "Frontend cache directory"):
        removed += 1
    
    # .next directory (if using Next.js)
    next_dir = FRONTEND_DIR / '.next'
    if remove_directory(next_dir, "Next.js build directory"):
        removed += 1
    
    # dist directory (if exists)
    dist_dir = FRONTEND_DIR / 'dist'
    if remove_directory(dist_dir, "Frontend dist directory"):
        removed += 1
    
    return removed

def main():
    """Main execution"""
    log("=" * 60)
    log("CLEANING GENERATED FILES")
    log("=" * 60)
    
    results = {
        'sqlite_files': 0,
        'log_files': 0,
        'python_cache': 0,
        'media_files': 0,
        'frontend_build': 0,
    }
    
    # Cleanup SQLite files
    results['sqlite_files'] = cleanup_sqlite_files()
    
    # Cleanup log files
    results['log_files'] = cleanup_log_files()
    
    # Cleanup Python cache
    results['python_cache'] = cleanup_python_cache()
    
    # Cleanup media files
    results['media_files'] = cleanup_media_files()
    
    # Cleanup frontend build
    results['frontend_build'] = cleanup_frontend_build()
    
    # Summary
    log("\n" + "=" * 60)
    log("CLEANUP SUMMARY")
    log("=" * 60)
    log(f"SQLite files removed: {results['sqlite_files']}")
    log(f"Log files removed: {results['log_files']}")
    log(f"Python cache directories removed: {results['python_cache']}")
    log(f"Media files/directories removed: {results['media_files']}")
    log(f"Frontend build artifacts removed: {results['frontend_build']}")
    
    total_operations = sum(results.values())
    log(f"\nTotal cleanup operations: {total_operations}")
    
    log("\n" + "=" * 60)
    log("CLEANUP COMPLETE")
    log("=" * 60)
    
    return results

if __name__ == '__main__':
    main()

