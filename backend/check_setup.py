#!/usr/bin/env python
"""Check if migration was applied and verify setup"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from django.db import connection
from django.contrib.auth.models import User
from imh_ims.models import UserProfile

print("=" * 60)
print("Checking Database Setup")
print("=" * 60)

# Check if UserProfile table exists
with connection.cursor() as cursor:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='imh_ims_userprofile'")
    result = cursor.fetchone()
    if result:
        print("✓ imh_ims_userprofile table exists")
    else:
        print("✗ imh_ims_userprofile table NOT found - run: python manage.py migrate")
        sys.exit(1)

# Check Scorpious user
print("\n" + "=" * 60)
print("Checking Scorpious User")
print("=" * 60)

user = User.objects.filter(username__iexact='scorpious').first()
if user:
    print(f"✓ User found: {user.username}")
    profile = UserProfile.objects.filter(user=user).first()
    if profile:
        print(f"✓ Profile exists")
        print(f"  Role: {profile.role}")
        print(f"  Role Display: {profile.get_role_display()}")
        print(f"  Is Admin: {profile.is_admin}")
        if profile.role != 'ADMIN':
            print(f"\n⚠ WARNING: User role is {profile.role}, not ADMIN")
            print("  Run: python manage.py assign_admin_role Scorpious")
        else:
            print("\n✓ User has ADMIN role - ready to use!")
    else:
        print("✗ Profile does not exist")
        print("  Run: python manage.py create_scorpious_user")
else:
    print("✗ User 'Scorpious' not found")
    print("  Run: python manage.py create_scorpious_user")

print("\n" + "=" * 60)

