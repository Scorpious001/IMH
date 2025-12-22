#!/usr/bin/env python
"""
Comprehensive script to clear all inventory data and Django sessions
while preserving user accounts.
"""
import os
import sys
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from django.db import connection, transaction
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.contrib.contenttypes.models import ContentType
from imh_ims.models import (
    PurchaseRequestLine,
    PurchaseRequest,
    RequisitionLine,
    Requisition,
    CountLine,
    CountSession,
    InventoryTransaction,
    StockLevel,
    Item,
    Location,
    Category,
    Vendor,
)

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / 'db.sqlite3'
WAL_PATH = BASE_DIR / 'db.sqlite3-wal'
SHM_PATH = BASE_DIR / 'db.sqlite3-shm'

def log(msg):
    """Print message"""
    print(msg)

def checkpoint_wal():
    """Checkpoint WAL file to main database"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("PRAGMA wal_checkpoint(FULL);")
            result = cursor.fetchone()
            return result
    except Exception as e:
        log(f"Error checkpointing WAL: {e}")
        return None

def vacuum_database():
    """Vacuum database to reclaim space and ensure data is deleted"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("VACUUM;")
            return True
    except Exception as e:
        log(f"Error vacuuming database: {e}")
        return False

def get_counts():
    """Get counts of all data to be deleted"""
    return {
        'PurchaseRequestLine': PurchaseRequestLine.objects.count(),
        'PurchaseRequest': PurchaseRequest.objects.count(),
        'RequisitionLine': RequisitionLine.objects.count(),
        'Requisition': Requisition.objects.count(),
        'CountLine': CountLine.objects.count(),
        'CountSession': CountSession.objects.count(),
        'InventoryTransaction': InventoryTransaction.objects.count(),
        'StockLevel': StockLevel.objects.count(),
        'Item': Item.objects.count(),
        'Location': Location.objects.count(),
        'Category': Category.objects.count(),
        'Vendor': Vendor.objects.count(),
        'Session': Session.objects.count(),
    }

def clear_all_data():
    """Clear all inventory data and Django sessions"""
    log("\n" + "=" * 60)
    log("CLEARING ALL SYSTEM DATA (EXCEPT USER ACCOUNTS)")
    log("=" * 60)
    
    # Get initial counts
    counts_before = get_counts()
    total_before = sum(counts_before.values())
    
    if total_before == 0:
        log("\nNo data found. Database is already empty.")
        return {'success': True, 'deleted': 0, 'message': 'Database already empty'}
    
    # Display summary
    log("\nData to be deleted:")
    for model_name, count in counts_before.items():
        if count > 0:
            log(f"  {model_name}: {count:,} record(s)")
    log(f"\n  TOTAL: {total_before:,} record(s)")
    log(f"\nUser accounts will be PRESERVED: {User.objects.count()} user(s)")
    
    # Check for WAL files
    has_wal = WAL_PATH.exists() or SHM_PATH.exists()
    if has_wal:
        log("\nSQLite WAL files detected. Checkpointing before deletion...")
        checkpoint_wal()
        log("WAL checkpointed.")
    
    # Perform deletion in transaction
    try:
        with transaction.atomic():
            deleted_counts = {}
            
            # Delete in proper order to handle foreign keys
            log("\nDeleting data...")
            
            # 1. Delete PurchaseRequestLine
            deleted_counts['PurchaseRequestLine'] = PurchaseRequestLine.objects.all().delete()[0]
            
            # 2. Delete PurchaseRequest
            deleted_counts['PurchaseRequest'] = PurchaseRequest.objects.all().delete()[0]
            
            # 3. Delete RequisitionLine
            deleted_counts['RequisitionLine'] = RequisitionLine.objects.all().delete()[0]
            
            # 4. Delete Requisition
            deleted_counts['Requisition'] = Requisition.objects.all().delete()[0]
            
            # 5. Delete CountLine
            deleted_counts['CountLine'] = CountLine.objects.all().delete()[0]
            
            # 6. Delete CountSession
            deleted_counts['CountSession'] = CountSession.objects.all().delete()[0]
            
            # 7. Delete InventoryTransaction
            deleted_counts['InventoryTransaction'] = InventoryTransaction.objects.all().delete()[0]
            
            # 8. Delete StockLevel
            deleted_counts['StockLevel'] = StockLevel.objects.all().delete()[0]
            
            # 9. Delete Item
            deleted_counts['Item'] = Item.objects.all().delete()[0]
            
            # 10. Delete Location (handle self-referential FK)
            Location.objects.update(parent_location=None)
            deleted_counts['Location'] = Location.objects.all().delete()[0]
            
            # 11. Delete Category (handle self-referential FK)
            Category.objects.update(parent_category=None)
            deleted_counts['Category'] = Category.objects.all().delete()[0]
            
            # 12. Delete Vendor
            deleted_counts['Vendor'] = Vendor.objects.all().delete()[0]
            
            # 13. Delete Django Sessions
            deleted_counts['Session'] = Session.objects.all().delete()[0]
            
            # Verify User data is preserved
            user_count = User.objects.count()
            
            # Display deletion summary
            log("\n" + "=" * 60)
            log("DELETION COMPLETE")
            log("=" * 60)
            
            total_deleted = sum(deleted_counts.values())
            log(f"\nTotal records deleted: {total_deleted:,}")
            
            log("\nBreakdown by model:")
            for model_name, count in deleted_counts.items():
                if count > 0:
                    log(f"  {model_name}: {count:,} record(s)")
            
            log(f"\nUser records preserved: {user_count}")
        
        # Vacuum database to reclaim space
        log("\nVacuuming database...")
        if vacuum_database():
            log("Database vacuumed successfully.")
        
        # Final WAL checkpoint
        if has_wal:
            log("\nFinal WAL checkpoint...")
            checkpoint_wal()
        
        # Verify final state
        counts_after = get_counts()
        total_after = sum(counts_after.values())
        
        if total_after == 0:
            log("\n✓ SUCCESS: All data cleared successfully!")
            return {'success': True, 'deleted': total_deleted, 'message': 'All data cleared'}
        else:
            log(f"\n⚠ WARNING: {total_after:,} records still remain")
            return {'success': False, 'deleted': total_deleted, 'message': f'{total_after} records remain'}
    
    except Exception as e:
        log(f"\n✗ ERROR during deletion: {e}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'deleted': 0, 'message': str(e)}

def main():
    """Main execution"""
    log("=" * 60)
    log("COMPREHENSIVE DATA CLEARANCE")
    log("=" * 60)
    import django.utils.timezone
    log(f"Timestamp: {django.utils.timezone.now()}")
    
    result = clear_all_data()
    
    log("\n" + "=" * 60)
    log("OPERATION COMPLETE")
    log("=" * 60)
    
    return result

if __name__ == '__main__':
    main()

