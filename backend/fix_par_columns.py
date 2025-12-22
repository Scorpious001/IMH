import sqlite3
import sys

db_path = 'db.sqlite3'
print(f"Connecting to {db_path}...", flush=True)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check current columns
cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
cols = {row[1]: row for row in cursor.fetchall()}
print("\nCurrent columns:")
for col in sorted(cols.keys()):
    print(f"  - {col}")

has_par_min = 'par_min' in cols
has_par = 'par' in cols
has_par_max = 'par_max' in cols

print(f"\nStatus: par_min={has_par_min}, par={has_par}, par_max={has_par_max}")

if has_par_min and not has_par:
    print("\nApplying fix: Renaming par_min to par...")
    try:
        cursor.execute("ALTER TABLE imh_ims_stocklevel RENAME COLUMN par_min TO par")
        conn.commit()
        print("✓ Successfully renamed par_min to par")
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)
elif has_par:
    print("\n✓ par column already exists")
else:
    print("\n⚠️  Neither par_min nor par exists - unexpected state")
    sys.exit(1)

# Verify
cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
cols_after = {row[1]: row for row in cursor.fetchall()}
print("\nColumns after fix:")
for col in sorted(cols_after.keys()):
    print(f"  - {col}")

if 'par' in cols_after:
    print("\n✓ Migration successful! The 'par' column exists.")
    if 'par_max' in cols_after:
        print("⚠️  Note: par_max column still exists but will be ignored by the application.")
else:
    print("\n✗ Migration failed - par column not found")
    sys.exit(1)

conn.close()
print("\nDone!")

