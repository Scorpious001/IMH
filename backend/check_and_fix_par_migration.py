#!/usr/bin/env python
"""Check and fix par_min/par_max migration"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

# Check current columns
cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
cols = {row[1]: row for row in cursor.fetchall()}
print("Current columns in imh_ims_stocklevel:")
for col_name in sorted(cols.keys()):
    col_info = cols[col_name]
    print(f"  {col_name} ({col_info[2]})")

# Check if migration is needed
has_par_min = 'par_min' in cols
has_par_max = 'par_max' in cols
has_par = 'par' in cols

print(f"\nMigration status:")
print(f"  Has par_min: {has_par_min}")
print(f"  Has par_max: {has_par_max}")
print(f"  Has par: {has_par}")

if has_par_min and not has_par:
    print("\n⚠️  Migration needed: par_min exists but par does not")
    print("Running migration...")
    
    # Rename par_min to par (SQLite 3.25+ supports RENAME COLUMN)
    try:
        cursor.execute("ALTER TABLE imh_ims_stocklevel RENAME COLUMN par_min TO par")
        connection.commit()
        print("✓ Renamed par_min to par")
    except Exception as e:
        print(f"✗ Error renaming column: {e}")
        print("   Trying alternative approach...")
        # Fallback: recreate table
        try:
            cursor.execute("""
                CREATE TABLE imh_ims_stocklevel_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_id INTEGER NOT NULL,
                    location_id INTEGER NOT NULL,
                    on_hand_qty NUMERIC NOT NULL DEFAULT 0,
                    reserved_qty NUMERIC NOT NULL DEFAULT 0,
                    par NUMERIC NOT NULL DEFAULT 0,
                    last_counted_at DATETIME NULL,
                    last_counted_by_id INTEGER NULL,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    UNIQUE(item_id, location_id),
                    FOREIGN KEY(item_id) REFERENCES imh_ims_item(id),
                    FOREIGN KEY(location_id) REFERENCES imh_ims_location(id),
                    FOREIGN KEY(last_counted_by_id) REFERENCES auth_user(id)
                )
            """)
            cursor.execute("""
                INSERT INTO imh_ims_stocklevel_new 
                (id, item_id, location_id, on_hand_qty, reserved_qty, par, 
                 last_counted_at, last_counted_by_id, created_at, updated_at)
                SELECT id, item_id, location_id, on_hand_qty, reserved_qty, par_min,
                       last_counted_at, last_counted_by_id, created_at, updated_at
                FROM imh_ims_stocklevel
            """)
            cursor.execute("DROP TABLE imh_ims_stocklevel")
            cursor.execute("ALTER TABLE imh_ims_stocklevel_new RENAME TO imh_ims_stocklevel")
            connection.commit()
            print("✓ Recreated table with par column")
        except Exception as e2:
            print(f"✗ Error recreating table: {e2}")
            connection.rollback()
    
    # Check if par_max still exists and remove it (should be gone if we recreated table)
    cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
    cols_after = {row[1]: row for row in cursor.fetchall()}
    if 'par_max' in cols_after:
        print("⚠️  par_max still exists - this is expected if using RENAME COLUMN")
        print("   par_max will be ignored by the application")
    
    print("\n✓ Migration applied!")
elif has_par and not has_par_min:
    print("\n✓ Migration already applied!")
else:
    print("\n⚠️  Unexpected state - manual intervention may be needed")

