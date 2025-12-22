#!/usr/bin/env python
import sqlite3
import sys

try:
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    # Check before
    cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
    cols_before = [row[1] for row in cursor.fetchall()]
    print("BEFORE:", ", ".join(cols_before))
    
    has_par_min = 'par_min' in cols_before
    has_par = 'par' in cols_before
    
    print(f"Has par_min: {has_par_min}")
    print(f"Has par: {has_par}")
    
    if has_par_min and not has_par:
        print("Renaming par_min to par...")
        cursor.execute("ALTER TABLE imh_ims_stocklevel RENAME COLUMN par_min TO par")
        conn.commit()
        print("RENAME COMPLETE")
    
    # Check after
    cursor.execute("PRAGMA table_info(imh_ims_stocklevel)")
    cols_after = [row[1] for row in cursor.fetchall()]
    print("AFTER:", ", ".join(cols_after))
    
    if 'par' in cols_after:
        print("SUCCESS: par column exists!")
    else:
        print("ERROR: par column not found")
        sys.exit(1)
    
    conn.close()
    print("DONE")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

