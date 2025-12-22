#!/usr/bin/env python
"""Verify admin role assignment"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imh.settings')
django.setup()

from django.contrib.auth.models import User
from imh_ims.models import UserProfile

# Find user
user = User.objects.filter(username__iexact='scorpious').first()

if user:
    profile = UserProfile.objects.filter(user=user).first()
    if profile:
        print(f"User: {user.username}")
        print(f"Role: {profile.role}")
        print(f"Role Display: {profile.get_role_display()}")
        print(f"Is Admin: {profile.is_admin}")
    else:
        print(f"User {user.username} found but no profile exists. Creating...")
        profile = UserProfile.objects.create(user=user, role='ADMIN')
        print(f"Created profile with ADMIN role")
else:
    print("User 'Scorpious' not found!")
    print("Run: python manage.py create_scorpious_user")

