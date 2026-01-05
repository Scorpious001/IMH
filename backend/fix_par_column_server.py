#!/usr/bin/env python
"""Fix par_min column issue on server"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

# Check current columns
cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
columns = [row[1] for row in cursor.fetchall()]
print(f"Current columns: {columns}")

# SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
if 'par_min' in columns or 'par_max' in columns:
    print("Found par_min or par_max columns. Recreating table without them...")
    
    # Create new table without par_min and par_max
    cursor.execute("""
        CREATE TABLE imh_ims_stocklevel_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            on_hand_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
            reserved_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
            par DECIMAL(10,2) NOT NULL DEFAULT 0,
            last_counted_at DATETIME NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            item_id INTEGER NOT NULL,
            last_counted_by_id INTEGER NULL,
            location_id INTEGER NOT NULL,
            FOREIGN KEY (item_id) REFERENCES imh_ims_item(id),
            FOREIGN KEY (last_counted_by_id) REFERENCES auth_user(id),
            FOREIGN KEY (location_id) REFERENCES imh_ims_location(id),
            UNIQUE(item_id, location_id)
        )
    """)
    
    # Copy data, using par_min if par doesn't exist or is 0
    if 'par_min' in columns and 'par' in columns:
        cursor.execute("""
            INSERT INTO imh_ims_stocklevel_new 
            SELECT id, on_hand_qty, reserved_qty, 
                   CASE WHEN par > 0 THEN par ELSE par_min END as par,
                   last_counted_at, created_at, updated_at, 
                   item_id, last_counted_by_id, location_id
            FROM imh_ims_stocklevel
        """)
    elif 'par_min' in columns:
        cursor.execute("""
            INSERT INTO imh_ims_stocklevel_new 
            SELECT id, on_hand_qty, reserved_qty, par_min as par,
                   last_counted_at, created_at, updated_at, 
                   item_id, last_counted_by_id, location_id
            FROM imh_ims_stocklevel
        """)
    else:
        cursor.execute("""
            INSERT INTO imh_ims_stocklevel_new 
            SELECT id, on_hand_qty, reserved_qty, par,
                   last_counted_at, created_at, updated_at, 
                   item_id, last_counted_by_id, location_id
            FROM imh_ims_stocklevel
        """)
    
    # Drop old table and rename new one
    cursor.execute("DROP TABLE imh_ims_stocklevel")
    cursor.execute("ALTER TABLE imh_ims_stocklevel_new RENAME TO imh_ims_stocklevel")
    print("✓ Successfully fixed par columns")
else:
    print("✓ Database schema is correct (par column exists, no par_min/par_max)")
