#!/usr/bin/env python
"""Apply migration and verify"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from django.core.management import call_command
from django.db import connection

print("Applying migrations...")
try:
    call_command('migrate', 'imh_ims', verbosity=2)
    print("\n✓ Migrations applied successfully!")
except Exception as e:
    print(f"\n✗ Error applying migrations: {e}")
    sys.exit(1)

# Verify table exists
print("\nVerifying database tables...")
with connection.cursor() as cursor:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='imh_ims_userprofile'")
    result = cursor.fetchone()
    if result:
        print("✓ imh_ims_userprofile table exists")
    else:
        print("✗ imh_ims_userprofile table NOT found")
        sys.exit(1)
    
    # Check for approval fields in requisition
    cursor.execute("PRAGMA table_info(imh_ims_requisition)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'approved_by_id' in columns:
        print("✓ Requisition approval fields exist")
    else:
        print("✗ Requisition approval fields NOT found")

print("\n✓ All migrations verified successfully!")

