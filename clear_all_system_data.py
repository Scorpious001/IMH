#!/usr/bin/env python
"""
Master script to clear all system data and generated files.
This script orchestrates the complete data removal process.
"""
import os
import sys
import subprocess
from pathlib import Path

# Get project root and backend directory
PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / 'backend'
VENV_PYTHON = BACKEND_DIR / 'venv' / 'Scripts' / 'python.exe'

def log(msg):
    """Print message"""
    print(msg)

def get_python_executable(needs_django=False):
    """Get the appropriate Python executable"""
    if needs_django:
        # For Django scripts, use venv Python if available
        if VENV_PYTHON.exists():
            return str(VENV_PYTHON)
        else:
            log(f"Warning: Virtual environment Python not found at {VENV_PYTHON}")
            log("Falling back to system Python. Make sure Django is installed.")
            return sys.executable
    else:
        # For non-Django scripts, use system Python
        return sys.executable

def run_script(script_path, description):
    """Run a Python script and return the result"""
    log(f"\n{'=' * 60}")
    log(f"RUNNING: {description}")
    log(f"{'=' * 60}")
    
    try:
        # Determine if script needs Django
        needs_django = 'clear_all_data' in str(script_path)
        python_exe = get_python_executable(needs_django=needs_django)
        
        # Change to backend directory for Django setup
        if needs_django:
            # For Django scripts, we need to run from backend directory
            result = subprocess.run(
                [python_exe, str(script_path)],
                cwd=str(BACKEND_DIR),
                capture_output=False,
                text=True
            )
        else:
            # For other scripts, run from their directory
            result = subprocess.run(
                [python_exe, str(script_path)],
                cwd=str(script_path.parent),
                capture_output=False,
                text=True
            )
        
        if result.returncode == 0:
            log(f"\n✓ {description} completed successfully")
            return True
        else:
            log(f"\n✗ {description} failed with return code {result.returncode}")
            return False
    except Exception as e:
        log(f"\n✗ Error running {description}: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main execution"""
    log("=" * 60)
    log("COMPLETE SYSTEM DATA REMOVAL")
    log("=" * 60)
    log("\nThis script will:")
    log("  1. Clear all inventory data and Django sessions")
    log("  2. Remove all generated files (WAL, logs, cache, media, build)")
    log("  3. Preserve user accounts")
    log("\nWARNING: This operation cannot be undone!")
    
    # Confirm before proceeding
    try:
        confirm = input("\nAre you sure you want to proceed? (yes/no): ")
        if confirm.lower() not in ['yes', 'y']:
            log("\nOperation cancelled.")
            return
    except KeyboardInterrupt:
        log("\n\nOperation cancelled by user.")
        return
    
    results = {
        'data_cleared': False,
        'files_cleaned': False,
    }
    
    # Step 1: Clear all data
    clear_data_script = BACKEND_DIR / 'clear_all_data.py'
    if clear_data_script.exists():
        results['data_cleared'] = run_script(
            clear_data_script,
            "Data Clearing (Inventory + Sessions)"
        )
    else:
        log(f"\n✗ Data clearing script not found: {clear_data_script}")
    
    # Step 2: Cleanup generated files
    cleanup_script = BACKEND_DIR / 'cleanup_generated_files.py'
    if cleanup_script.exists():
        results['files_cleaned'] = run_script(
            cleanup_script,
            "File Cleanup (WAL, logs, cache, media, build)"
        )
    else:
        log(f"\n✗ File cleanup script not found: {cleanup_script}")
    
    # Final summary
    log("\n" + "=" * 60)
    log("FINAL SUMMARY")
    log("=" * 60)
    
    if results['data_cleared']:
        log("✓ Data clearing: SUCCESS")
    else:
        log("✗ Data clearing: FAILED or SKIPPED")
    
    if results['files_cleaned']:
        log("✓ File cleanup: SUCCESS")
    else:
        log("✗ File cleanup: FAILED or SKIPPED")
    
    if all(results.values()):
        log("\n✓ All operations completed successfully!")
        log("\nThe system has been cleared of all data except user accounts.")
        log("All generated files have been removed.")
    else:
        log("\n⚠ Some operations may have failed. Please review the output above.")
    
    log("\n" + "=" * 60)
    log("OPERATION COMPLETE")
    log("=" * 60)

if __name__ == '__main__':
    main()

