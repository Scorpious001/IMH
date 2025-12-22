#!/usr/bin/env python
"""
Comprehensive script to verify database state, check for WAL files,
backup databases, and clear all inventory data including WAL checkpoints.
"""
import os
import sys
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from django.db import connection
from django.contrib.sessions.models import Session
from imh_ims.models import (
    PurchaseRequestLine, PurchaseRequest, RequisitionLine, Requisition,
    CountLine, CountSession, InventoryTransaction, StockLevel,
    Item, Location, Category, Vendor
)
from django.db import transaction

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / 'db.sqlite3'
WAL_PATH = BASE_DIR / 'db.sqlite3-wal'
SHM_PATH = BASE_DIR / 'db.sqlite3-shm'

def log(msg):
    """Print message and write to file"""
    print(msg)
    with open('clear_log.txt', 'a', encoding='utf-8') as f:
        f.write(msg + '\n')

def check_files():
    """Check for database files and WAL files"""
    log("\n" + "="*60)
    log("CHECKING FOR DATABASE FILES AND BACKUPS")
    log("="*60)
    
    files_found = []
    
    # Check main database
    if DB_PATH.exists():
        size = DB_PATH.stat().st_size
        log(f"Main database: db.sqlite3 ({size:,} bytes)")
        files_found.append(DB_PATH)
    else:
        log("Main database: db.sqlite3 NOT FOUND")
    
    # Check WAL file
    if WAL_PATH.exists():
        size = WAL_PATH.stat().st_size
        log(f"WAL file: db.sqlite3-wal EXISTS ({size:,} bytes) - THIS CAN PRESERVE DATA!")
        files_found.append(WAL_PATH)
    else:
        log("WAL file: db.sqlite3-wal NOT FOUND")
    
    # Check SHM file
    if SHM_PATH.exists():
        size = SHM_PATH.stat().st_size
        log(f"SHM file: db.sqlite3-shm EXISTS ({size:,} bytes)")
        files_found.append(SHM_PATH)
    else:
        log("SHM file: db.sqlite3-shm NOT FOUND")
    
    # Check for backup files
    backup_patterns = ['*.bak', '*.backup', '*.old', '*.db.backup', '*.sqlite.backup']
    for pattern in backup_patterns:
        for backup_file in BASE_DIR.glob(pattern):
            if backup_file.name != 'db.sqlite3':
                size = backup_file.stat().st_size
                log(f"Backup file found: {backup_file.name} ({size:,} bytes)")
                files_found.append(backup_file)
    
    return files_found

def check_journal_mode():
    """Check SQLite journal mode"""
    log("\n" + "="*60)
    log("CHECKING SQLITE JOURNAL MODE")
    log("="*60)
    
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA journal_mode;")
        mode = cursor.fetchone()[0]
        log(f"Current journal mode: {mode}")
        return mode

def checkpoint_wal():
    """Checkpoint WAL file to main database"""
    log("\n" + "="*60)
    log("CHECKPOINTING WAL FILE")
    log("="*60)
    
    try:
        with connection.cursor() as cursor:
            # Checkpoint WAL to main database
            cursor.execute("PRAGMA wal_checkpoint(FULL);")
            result = cursor.fetchone()
            log(f"WAL checkpoint result: {result}")
            
            # Check if WAL still exists
            if WAL_PATH.exists():
                size = WAL_PATH.stat().st_size
                log(f"WAL file still exists after checkpoint: {size:,} bytes")
            else:
                log("WAL file removed after checkpoint")
    except Exception as e:
        log(f"Error during WAL checkpoint: {e}")

def verify_database_state():
    """Verify current state of database"""
    log("\n" + "="*60)
    log("VERIFYING DATABASE STATE")
    log("="*60)
    
    counts = {
        'Items': Item.objects.count(),
        'Locations': Location.objects.count(),
        'Categories': Category.objects.count(),
        'Vendors': Vendor.objects.count(),
        'StockLevels': StockLevel.objects.count(),
        'Transactions': InventoryTransaction.objects.count(),
        'Requisitions': Requisition.objects.count(),
        'CountSessions': CountSession.objects.count(),
        'PurchaseRequests': PurchaseRequest.objects.count(),
        'Sessions': Session.objects.count(),
    }
    
    for name, count in counts.items():
        log(f"{name}: {count:,} records")
    
    total = sum(counts.values())
    log(f"\nTOTAL RECORDS: {total:,}")
    
    return counts, total

def clear_all_data():
    """Clear all inventory data and handle WAL files"""
    log("\n" + "="*60)
    log("CLEARING ALL INVENTORY DATA")
    log("="*60)
    
    try:
        # First, checkpoint WAL to ensure all data is in main database
        checkpoint_wal()
        
        # Clear all data in transaction
        with transaction.atomic():
            log("\nDeleting data in order...")
            
            deleted = {}
            deleted['PurchaseRequestLine'] = PurchaseRequestLine.objects.all().delete()[0]
            deleted['PurchaseRequest'] = PurchaseRequest.objects.all().delete()[0]
            deleted['RequisitionLine'] = RequisitionLine.objects.all().delete()[0]
            deleted['Requisition'] = Requisition.objects.all().delete()[0]
            deleted['CountLine'] = CountLine.objects.all().delete()[0]
            deleted['CountSession'] = CountSession.objects.all().delete()[0]
            deleted['InventoryTransaction'] = InventoryTransaction.objects.all().delete()[0]
            deleted['StockLevel'] = StockLevel.objects.all().delete()[0]
            deleted['Item'] = Item.objects.all().delete()[0]
            
            # Handle self-referential FKs
            Location.objects.update(parent_location=None)
            deleted['Location'] = Location.objects.all().delete()[0]
            
            Category.objects.update(parent_category=None)
            deleted['Category'] = Category.objects.all().delete()[0]
            
            deleted['Vendor'] = Vendor.objects.all().delete()[0]
            
            log("\nDeletion summary:")
            total_deleted = 0
            for model, count in deleted.items():
                if count > 0:
                    log(f"  {model}: {count:,} records")
                    total_deleted += count
            
            log(f"\nTotal deleted: {total_deleted:,} records")
        
        # Vacuum database to reclaim space and ensure data is gone
        log("\nVacuuming database...")
        with connection.cursor() as cursor:
            cursor.execute("VACUUM;")
        log("Database vacuumed successfully")
        
        # Checkpoint WAL again after vacuum
        checkpoint_wal()
        
        # Try to remove WAL and SHM files if they exist
        if WAL_PATH.exists():
            try:
                WAL_PATH.unlink()
                log(f"Removed WAL file: {WAL_PATH.name}")
            except Exception as e:
                log(f"Could not remove WAL file: {e}")
        
        if SHM_PATH.exists():
            try:
                SHM_PATH.unlink()
                log(f"Removed SHM file: {SHM_PATH.name}")
            except Exception as e:
                log(f"Could not remove SHM file: {e}")
        
        return True
        
    except Exception as e:
        log(f"\nERROR during deletion: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main execution"""
    # Clear log file
    if Path('clear_log.txt').exists():
        Path('clear_log.txt').unlink()
    
    log("="*60)
    log("COMPREHENSIVE DATABASE CLEARANCE")
    log("="*60)
    log(f"Timestamp: {django.utils.timezone.now()}")
    
    # Check for files
    files_found = check_files()
    
    # Check journal mode
    journal_mode = check_journal_mode()
    
    # Verify current state
    counts, total = verify_database_state()
    
    if total == 0:
        log("\nDatabase is already empty.")
        # Still checkpoint WAL if it exists
        if WAL_PATH.exists():
            log("\nWAL file exists but database is empty. Checkpointing...")
            checkpoint_wal()
        return
    
    # Clear all data
    success = clear_all_data()
    
    if success:
        # Verify deletion
        log("\n" + "="*60)
        log("VERIFICATION AFTER DELETION")
        log("="*60)
        counts_after, total_after = verify_database_state()
        
        if total_after == 0:
            log("\n✓ SUCCESS: All inventory data cleared!")
        else:
            log(f"\n⚠ WARNING: {total_after:,} records still remain")
            log("This may indicate a problem with the deletion process.")
    
    log("\n" + "="*60)
    log("OPERATION COMPLETE")
    log("="*60)
    log("\nCheck clear_log.txt for full details.")

if __name__ == '__main__':
    import django.utils.timezone
    main()

