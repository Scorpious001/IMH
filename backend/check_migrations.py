#!/usr/bin/env python
"""Script to check migration status"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from django.db import connection

# Check applied migrations
cursor = connection.cursor()
cursor.execute("SELECT name FROM django_migrations WHERE app = 'imh_ims' ORDER BY id")
migrations = [row[0] for row in cursor.fetchall()]
print("Applied migrations:")
for m in migrations:
    print(f"  - {m}")

# Check if 0004 is applied
if '0004_add_category_par_levels' not in migrations:
    print("\n⚠️  Migration 0004_add_category_par_levels is NOT applied!")
    print("Applying it now...")
    from django.core.management import call_command
    try:
        call_command('migrate', 'imh_ims', '0004_add_category_par_levels', verbosity=2)
        print("✅ Migration applied!")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("\n✅ Migration 0004_add_category_par_levels is already applied")

# Check table structure
cursor.execute("PRAGMA table_info(imh_ims_category)")
columns = cursor.fetchall()
print("\nCategory table columns:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

if 'par_min' not in [c[1] for c in columns]:
    print("\n⚠️  par_min column is missing!")
if 'par_max' not in [c[1] for c in columns]:
    print("⚠️  par_max column is missing!")

sys.stdout.flush()

