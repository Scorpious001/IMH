#!/usr/bin/env python
"""Execute data clearing and write results to file"""
import os
import sys
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from django.db import connection, transaction
from imh_ims.models import (
    PurchaseRequestLine, PurchaseRequest, RequisitionLine, Requisition,
    CountLine, CountSession, InventoryTransaction, StockLevel,
    Item, Location, Category, Vendor
)

output_file = Path('clear_execution_results.txt')
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("="*60 + "\n")
    f.write("INVENTORY DATA CLEARANCE EXECUTION\n")
    f.write("="*60 + "\n\n")
    
    # Check initial state
    f.write("INITIAL STATE:\n")
    f.write(f"  Items: {Item.objects.count()}\n")
    f.write(f"  Locations: {Location.objects.count()}\n")
    f.write(f"  Categories: {Category.objects.count()}\n")
    f.write(f"  Vendors: {Vendor.objects.count()}\n")
    f.write(f"  StockLevels: {StockLevel.objects.count()}\n")
    f.write(f"  Transactions: {InventoryTransaction.objects.count()}\n")
    f.write(f"  Requisitions: {Requisition.objects.count()}\n")
    f.write(f"  CountSessions: {CountSession.objects.count()}\n")
    f.write(f"  PurchaseRequests: {PurchaseRequest.objects.count()}\n\n")
    
    total_before = (Item.objects.count() + Location.objects.count() + 
                   Category.objects.count() + Vendor.objects.count() +
                   StockLevel.objects.count() + InventoryTransaction.objects.count() +
                   Requisition.objects.count() + CountSession.objects.count() +
                   PurchaseRequest.objects.count())
    f.write(f"TOTAL RECORDS: {total_before}\n\n")
    
    if total_before == 0:
        f.write("Database is already empty.\n")
    else:
        # Check for WAL files
        db_path = Path(connection.settings_dict['NAME'])
        wal_path = db_path.parent / f"{db_path.name}-wal"
        shm_path = db_path.parent / f"{db_path.name}-shm"
        
        f.write("CHECKING FOR WAL FILES:\n")
        if wal_path.exists():
            f.write(f"  WAL file found: {wal_path.name} ({wal_path.stat().st_size} bytes)\n")
        else:
            f.write("  No WAL file found\n")
        
        if shm_path.exists():
            f.write(f"  SHM file found: {shm_path.name} ({shm_path.stat().st_size} bytes)\n")
        else:
            f.write("  No SHM file found\n")
        f.write("\n")
        
        # Checkpoint WAL
        f.write("CHECKPOINTING WAL FILE...\n")
        try:
            with connection.cursor() as cursor:
                cursor.execute("PRAGMA wal_checkpoint(FULL);")
                result = cursor.fetchone()
                f.write(f"  Result: {result}\n")
        except Exception as e:
            f.write(f"  Error: {e}\n")
        f.write("\n")
        
        # Delete all data
        f.write("DELETING DATA...\n")
        try:
            with transaction.atomic():
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
                
                Location.objects.update(parent_location=None)
                deleted['Location'] = Location.objects.all().delete()[0]
                
                Category.objects.update(parent_category=None)
                deleted['Category'] = Category.objects.all().delete()[0]
                
                deleted['Vendor'] = Vendor.objects.all().delete()[0]
                
                f.write("  Deletion summary:\n")
                total_deleted = 0
                for model, count in deleted.items():
                    if count > 0:
                        f.write(f"    {model}: {count} records\n")
                        total_deleted += count
                f.write(f"  Total deleted: {total_deleted} records\n\n")
        except Exception as e:
            f.write(f"  ERROR: {e}\n")
            import traceback
            f.write(traceback.format_exc())
        
        # Vacuum database
        f.write("VACUUMING DATABASE...\n")
        try:
            with connection.cursor() as cursor:
                cursor.execute("VACUUM;")
            f.write("  Database vacuumed successfully\n\n")
        except Exception as e:
            f.write(f"  Error: {e}\n\n")
        
        # Final checkpoint
        f.write("FINAL WAL CHECKPOINT...\n")
        try:
            with connection.cursor() as cursor:
                cursor.execute("PRAGMA wal_checkpoint(FULL);")
            f.write("  Checkpoint complete\n\n")
        except Exception as e:
            f.write(f"  Error: {e}\n\n")
        
        # Verify final state
        f.write("FINAL STATE:\n")
        f.write(f"  Items: {Item.objects.count()}\n")
        f.write(f"  Locations: {Location.objects.count()}\n")
        f.write(f"  Categories: {Category.objects.count()}\n")
        f.write(f"  Vendors: {Vendor.objects.count()}\n")
        f.write(f"  StockLevels: {StockLevel.objects.count()}\n")
        f.write(f"  Transactions: {InventoryTransaction.objects.count()}\n")
        f.write(f"  Requisitions: {Requisition.objects.count()}\n")
        f.write(f"  CountSessions: {CountSession.objects.count()}\n")
        f.write(f"  PurchaseRequests: {PurchaseRequest.objects.count()}\n\n")
        
        total_after = (Item.objects.count() + Location.objects.count() + 
                      Category.objects.count() + Vendor.objects.count() +
                      StockLevel.objects.count() + InventoryTransaction.objects.count() +
                      Requisition.objects.count() + CountSession.objects.count() +
                      PurchaseRequest.objects.count())
        f.write(f"TOTAL RECORDS: {total_after}\n\n")
        
        if total_after == 0:
            f.write("✓ SUCCESS: All inventory data has been cleared!\n")
        else:
            f.write(f"⚠ WARNING: {total_after} records still remain\n")
    
    f.write("\n" + "="*60 + "\n")
    f.write("EXECUTION COMPLETE\n")
    f.write("="*60 + "\n")

print("Execution complete. Check clear_execution_results.txt for details.")

