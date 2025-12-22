#!/usr/bin/env python
"""Script to apply the category par_levels migration"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from django.core.management import call_command
from django.db import connection

# Check current table structure
cursor = connection.cursor()
cursor.execute("PRAGMA table_info(imh_ims_category)")
columns = [row[1] for row in cursor.fetchall()]
print(f"Current columns: {columns}")

if 'par_min' not in columns or 'par_max' not in columns:
    print("Applying migration 0004_add_category_par_levels...")
    try:
        call_command('migrate', 'imh_ims', '0004_add_category_par_levels', verbosity=2)
        print("Migration applied successfully!")
        
        # Verify columns were added
        cursor.execute("PRAGMA table_info(imh_ims_category)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Updated columns: {columns}")
    except Exception as e:
        print(f"Error applying migration: {e}")
        import traceback
        traceback.print_exc()
else:
    print("Columns par_min and par_max already exist!")

