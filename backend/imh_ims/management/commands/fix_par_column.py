from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Fix par_min to par column rename'

    def handle(self, *args, **options):
        cursor = connection.cursor()
        
        # Check current columns
        cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
        cols = {row[1]: row for row in cursor.fetchall()}
        
        self.stdout.write("Current columns: " + ", ".join(sorted(cols.keys())))
        
        has_par_min = 'par_min' in cols
        has_par = 'par' in cols
        
        if has_par_min and not has_par:
            self.stdout.write("Renaming par_min to par...")
            try:
                cursor.execute("ALTER TABLE imh_ims_stocklevel RENAME COLUMN par_min TO par")
                connection.commit()
                self.stdout.write(self.style.SUCCESS("✓ Successfully renamed par_min to par"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"✗ Error: {e}"))
                return
        
        # Verify
        cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
        cols_after = {row[1]: row for row in cursor.fetchall()}
        self.stdout.write("Columns after: " + ", ".join(sorted(cols_after.keys())))
        
        if 'par' in cols_after:
            self.stdout.write(self.style.SUCCESS("✓ Migration successful!"))
        else:
            self.stdout.write(self.style.ERROR("✗ Migration failed"))

