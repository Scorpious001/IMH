from django.core.management.base import BaseCommand
from django.db import transaction, connection
from django.contrib.auth.models import User
from pathlib import Path
import os

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


class Command(BaseCommand):
    help = 'Clear all inventory-related data while preserving User authentication data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--noinput',
            action='store_true',
            help='Run command non-interactively (no confirmation prompt)',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output for each deletion',
        )

    def check_wal_files(self):
        """Check for and handle SQLite WAL files"""
        from django.conf import settings
        db_path = Path(settings.DATABASES['default']['NAME'])
        wal_path = db_path.parent / f"{db_path.name}-wal"
        shm_path = db_path.parent / f"{db_path.name}-shm"
        
        wal_exists = wal_path.exists()
        shm_exists = shm_path.exists()
        
        if wal_exists or shm_exists:
            self.stdout.write(self.style.WARNING('\nSQLite WAL files detected!'))
            if wal_exists:
                size = wal_path.stat().st_size
                self.stdout.write(f'  WAL file: {wal_path.name} ({size:,} bytes)')
            if shm_exists:
                size = shm_path.stat().st_size
                self.stdout.write(f'  SHM file: {shm_path.name} ({size:,} bytes)')
            self.stdout.write('  These files can preserve data even after deletion.')
            return True, wal_path, shm_path
        return False, None, None

    def checkpoint_wal(self):
        """Checkpoint WAL file to main database"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("PRAGMA wal_checkpoint(FULL);")
                result = cursor.fetchone()
                return result
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error checkpointing WAL: {e}'))
            return None

    def vacuum_database(self):
        """Vacuum database to reclaim space and ensure data is deleted"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("VACUUM;")
                return True
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error vacuuming database: {e}'))
            return False

    def handle(self, *args, **options):
        noinput = options['noinput']
        verbose = options['verbose']

        # Check for WAL files
        has_wal, wal_path, shm_path = self.check_wal_files()
        
        # Get counts before deletion
        counts = {
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
        }

        # Calculate total records
        total_records = sum(counts.values())

        if total_records == 0:
            self.stdout.write(
                self.style.WARNING('No inventory data found. Database is already empty.')
            )
            return

        # Display summary
        self.stdout.write(self.style.WARNING('\n' + '=' * 60))
        self.stdout.write(self.style.WARNING('INVENTORY DATA CLEARANCE SUMMARY'))
        self.stdout.write(self.style.WARNING('=' * 60))
        self.stdout.write('\nThe following data will be DELETED:\n')

        for model_name, count in counts.items():
            if count > 0:
                self.stdout.write(f'  {model_name}: {count:,} record(s)')

        self.stdout.write(f'\n  TOTAL: {total_records:,} record(s)')
        self.stdout.write('\n' + '-' * 60)
        self.stdout.write(self.style.SUCCESS('User authentication data will be PRESERVED'))
        self.stdout.write('-' * 60 + '\n')

        # Confirmation prompt
        if not noinput:
            confirm = input('Are you sure you want to proceed? (yes/no): ')
            if confirm.lower() not in ['yes', 'y']:
                self.stdout.write(self.style.ERROR('Operation cancelled.'))
                return

        # Checkpoint WAL before deletion if it exists
        if has_wal:
            self.stdout.write('\nCheckpointing WAL file to ensure all data is in main database...')
            self.checkpoint_wal()
            self.stdout.write('WAL checkpointed.')

        # Perform deletion in transaction
        try:
            with transaction.atomic():
                deleted_counts = {}

                # 1. Delete PurchaseRequestLine
                if verbose:
                    self.stdout.write('Deleting PurchaseRequestLine records...')
                deleted_counts['PurchaseRequestLine'] = PurchaseRequestLine.objects.all().delete()[0]

                # 2. Delete PurchaseRequest
                if verbose:
                    self.stdout.write('Deleting PurchaseRequest records...')
                deleted_counts['PurchaseRequest'] = PurchaseRequest.objects.all().delete()[0]

                # 3. Delete RequisitionLine
                if verbose:
                    self.stdout.write('Deleting RequisitionLine records...')
                deleted_counts['RequisitionLine'] = RequisitionLine.objects.all().delete()[0]

                # 4. Delete Requisition
                if verbose:
                    self.stdout.write('Deleting Requisition records...')
                deleted_counts['Requisition'] = Requisition.objects.all().delete()[0]

                # 5. Delete CountLine
                if verbose:
                    self.stdout.write('Deleting CountLine records...')
                deleted_counts['CountLine'] = CountLine.objects.all().delete()[0]

                # 6. Delete CountSession
                if verbose:
                    self.stdout.write('Deleting CountSession records...')
                deleted_counts['CountSession'] = CountSession.objects.all().delete()[0]

                # 7. Delete InventoryTransaction
                if verbose:
                    self.stdout.write('Deleting InventoryTransaction records...')
                deleted_counts['InventoryTransaction'] = InventoryTransaction.objects.all().delete()[0]

                # 8. Delete StockLevel
                if verbose:
                    self.stdout.write('Deleting StockLevel records...')
                deleted_counts['StockLevel'] = StockLevel.objects.all().delete()[0]

                # 9. Delete Item
                if verbose:
                    self.stdout.write('Deleting Item records...')
                deleted_counts['Item'] = Item.objects.all().delete()[0]

                # 10. Delete Location (handle parent_location FK by deleting all at once)
                # Django will handle the cascade, but we need to be careful with self-referential FKs
                if verbose:
                    self.stdout.write('Deleting Location records...')
                # First, set all parent_location to None to break circular references
                Location.objects.update(parent_location=None)
                deleted_counts['Location'] = Location.objects.all().delete()[0]

                # 11. Delete Category (handle parent_category FK similarly)
                if verbose:
                    self.stdout.write('Deleting Category records...')
                # First, set all parent_category to None to break circular references
                Category.objects.update(parent_category=None)
                deleted_counts['Category'] = Category.objects.all().delete()[0]

                # 12. Delete Vendor
                if verbose:
                    self.stdout.write('Deleting Vendor records...')
                deleted_counts['Vendor'] = Vendor.objects.all().delete()[0]

                # Verify User data is preserved
                user_count = User.objects.count()
                if verbose:
                    self.stdout.write(f'\nVerifying User data preservation...')
                    self.stdout.write(f'Users remaining: {user_count}')

            # Display results
            self.stdout.write('\n' + '=' * 60)
            self.stdout.write(self.style.SUCCESS('DELETION COMPLETE'))
            self.stdout.write('=' * 60 + '\n')

            total_deleted = sum(deleted_counts.values())
            self.stdout.write(f'Total records deleted: {total_deleted:,}\n')

            if verbose:
                self.stdout.write('Breakdown by model:')
                for model_name, count in deleted_counts.items():
                    if count > 0:
                        self.stdout.write(f'  {model_name}: {count:,} record(s)')

            self.stdout.write(f'\nUser records preserved: {user_count}')
            
            # Vacuum database to reclaim space and ensure data is deleted
            self.stdout.write('\nVacuuming database...')
            if self.vacuum_database():
                self.stdout.write('Database vacuumed successfully.')
            
            # Checkpoint WAL again after vacuum
            if has_wal:
                self.stdout.write('Final WAL checkpoint...')
                self.checkpoint_wal()
                
                # Try to remove WAL and SHM files
                try:
                    if wal_path and wal_path.exists():
                        wal_path.unlink()
                        self.stdout.write(f'Removed WAL file: {wal_path.name}')
                    if shm_path and shm_path.exists():
                        shm_path.unlink()
                        self.stdout.write(f'Removed SHM file: {shm_path.name}')
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Could not remove WAL/SHM files: {e}'))
                    self.stdout.write(self.style.WARNING('You may need to restart the Django server to remove these files.'))
            
            self.stdout.write(self.style.SUCCESS('\nOperation completed successfully!'))

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\nError during deletion: {str(e)}')
            )
            self.stdout.write(
                self.style.ERROR('Transaction rolled back. No data was deleted.')
            )
            raise

