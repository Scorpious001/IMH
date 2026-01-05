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

if 'par_min' in columns and 'par' not in columns:
    print("Renaming par_min to par...")
    cursor.execute("ALTER TABLE imh_ims_stocklevel RENAME COLUMN par_min TO par")
    print("✓ Successfully renamed par_min to par")
elif 'par_min' in columns and 'par' in columns:
    print("Both par_min and par exist. Copying par_min to par and dropping par_min...")
    cursor.execute("UPDATE imh_ims_stocklevel SET par = par_min WHERE par = 0 OR par IS NULL")
    cursor.execute("ALTER TABLE imh_ims_stocklevel DROP COLUMN par_min")
    print("✓ Successfully fixed par columns")
else:
    print("✓ Database schema is correct (par column exists)")
