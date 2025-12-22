import sqlite3
import sys

db_path = 'db.sqlite3'
print(f"Connecting to {db_path}...")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check current columns
cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
cols = {row[1]: row for row in cursor.fetchall()}
print("\nCurrent columns:")
for col in sorted(cols.keys()):
    print(f"  - {col}")

has_par_max = 'par_max' in cols
has_par = 'par' in cols

if has_par_max:
    print("\nRemoving par_max column...")
    print("(SQLite doesn't support DROP COLUMN, so recreating table)")
    
    try:
        # Create new table without par_max
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
        
        # Copy data (excluding par_max)
        cursor.execute("""
            INSERT INTO imh_ims_stocklevel_new 
            (id, item_id, location_id, on_hand_qty, reserved_qty, par, 
             last_counted_at, last_counted_by_id, created_at, updated_at)
            SELECT id, item_id, location_id, on_hand_qty, reserved_qty, par,
                   last_counted_at, last_counted_by_id, created_at, updated_at
            FROM imh_ims_stocklevel
        """)
        
        # Drop old table and rename new one
        cursor.execute("DROP TABLE imh_ims_stocklevel")
        cursor.execute("ALTER TABLE imh_ims_stocklevel_new RENAME TO imh_ims_stocklevel")
        conn.commit()
        
        print("✓ Successfully removed par_max column")
    except Exception as e:
        print(f"✗ Error: {e}")
        conn.rollback()
        sys.exit(1)
else:
    print("\n✓ par_max column doesn't exist - nothing to remove")

# Verify
cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
cols_after = {row[1]: row for row in cursor.fetchall()}
print("\nColumns after fix:")
for col in sorted(cols_after.keys()):
    print(f"  - {col}")

if 'par_max' not in cols_after and 'par' in cols_after:
    print("\n✓ Success! par_max removed, par column exists.")
else:
    print("\n⚠️  Unexpected state")

conn.close()
print("\nDone!")

