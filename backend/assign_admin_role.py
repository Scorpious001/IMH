#!/usr/bin/env python
"""Script to assign admin role to a user"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from django.contrib.auth.models import User
from imh_ims.models import UserProfile

# Find user by username (case-insensitive)
username = 'scorpious'
user = User.objects.filter(username__iexact=username).first()

if not user:
    print(f"User '{username}' not found!")
    print("Available users:")
    for u in User.objects.all():
        print(f"  - {u.username}")
    exit(1)
else:
    # Get or create profile
    profile, created = UserProfile.objects.get_or_create(user=user)
    old_role = profile.role
    profile.role = 'ADMIN'
    profile.save()
    
    print(f"✓ Successfully assigned ADMIN role to user: {user.username}")
    print(f"  User ID: {user.id}")
    print(f"  Email: {user.email or 'N/A'}")
    print(f"  Previous Role: {old_role}")
    print(f"  New Role: {profile.get_role_display()}")
    print(f"  Profile created: {created}")

