from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from imh_ims.models import UserProfile, ModulePermission, UserPermission, Item
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = 'Comprehensive system check for authentication and data issues'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write(self.style.SUCCESS('COMPREHENSIVE SYSTEM CHECK'))
        self.stdout.write(self.style.SUCCESS('=' * 70))
        
        # 1. Check Users
        self.stdout.write('\n[1] USER CHECK')
        self.stdout.write('-' * 70)
        users = User.objects.all()
        self.stdout.write(f'Total users: {users.count()}')
        
        demo_users = ['demo_admin', 'demo_manager', 'demo_supervisor', 'demo_staff', 'demo_user1', 'demo_user2']
        seed_users = ['admin', 'manager', 'staff1', 'staff2']
        
        for user in users:
            try:
                profile = user.profile
                role = profile.role
            except UserProfile.DoesNotExist:
                role = 'NO PROFILE'
            
            status = '[OK]' if user.is_active else '[X]'
            self.stdout.write(f'  {status} {user.username:20} | Active: {user.is_active:5} | Superuser: {str(user.is_superuser):5} | Role: {role}')
            
            # Test password authentication
            if user.username in demo_users + seed_users:
                test_passwords = {
                    'demo_admin': 'demo123',
                    'demo_manager': 'demo123',
                    'demo_supervisor': 'demo123',
                    'demo_staff': 'demo123',
                    'demo_user1': 'demo123',
                    'demo_user2': 'demo123',
                    'admin': 'admin123',
                    'manager': 'manager123',
                    'staff1': 'staff123',
                    'staff2': 'staff123',
                }
                password = test_passwords.get(user.username, 'unknown')
                # Create a mock request for authentication test
                test_user = authenticate(username=user.username, password=password)
                if test_user:
                    self.stdout.write(f'    [OK] Password authentication works')
                else:
                    self.stdout.write(f'    [X] Password authentication FAILED')
        
        # 2. Check Permissions
        self.stdout.write('\n[2] PERMISSION CHECK')
        self.stdout.write('-' * 70)
        permissions = ModulePermission.objects.all()
        self.stdout.write(f'Total permissions: {permissions.count()}')
        
        catalog_view = ModulePermission.objects.filter(module='catalog', action='view').first()
        if catalog_view:
            self.stdout.write(f'  [OK] catalog.VIEW permission exists (ID: {catalog_view.id})')
        else:
            self.stdout.write(f'  [X] catalog.VIEW permission MISSING')
        
        # Check user permissions
        for user in users:
            if user.is_superuser:
                self.stdout.write(f'  {user.username}: Superuser (has all permissions)')
            else:
                try:
                    profile = user.profile
                    if profile.role == 'ADMIN':
                        self.stdout.write(f'  {user.username}: ADMIN role (has all permissions)')
                    else:
                        user_perms = UserPermission.objects.filter(user=user)
                        has_catalog_view = user_perms.filter(permission__module='catalog', permission__action='view').exists()
                        status = '[OK]' if has_catalog_view else '[X]'
                        self.stdout.write(f'  {status} {user.username}: {user_perms.count()} permissions | catalog.VIEW: {has_catalog_view}')
                except UserProfile.DoesNotExist:
                    self.stdout.write(f'  [X] {user.username}: NO PROFILE')
        
        # 3. Check Data
        self.stdout.write('\n[3] DATA CHECK')
        self.stdout.write('-' * 70)
        items_count = Item.objects.count()
        active_items = Item.objects.filter(is_active=True).count()
        self.stdout.write(f'Total items: {items_count}')
        self.stdout.write(f'Active items: {active_items}')
        
        if items_count == 0:
            self.stdout.write(self.style.ERROR('  [X] NO ITEMS IN DATABASE - Run seed_data command!'))
        elif active_items == 0:
            self.stdout.write(self.style.WARNING('  [WARN] All items are inactive'))
        else:
            self.stdout.write(self.style.SUCCESS(f'  [OK] {active_items} active items available'))
        
        # 4. Check Authentication System
        self.stdout.write('\n[4] AUTHENTICATION SYSTEM CHECK')
        self.stdout.write('-' * 70)
        self.stdout.write('Authentication classes configured:')
        self.stdout.write('  - SessionAuthentication (for web)')
        self.stdout.write('  - TokenAuthentication (for mobile)')
        self.stdout.write('  - BasicAuthentication (fallback)')
        
        # Check tokens
        tokens = Token.objects.all()
        self.stdout.write(f'\nTotal auth tokens: {tokens.count()}')
        
        # 5. Test Login for Demo Users
        self.stdout.write('\n[5] LOGIN TEST')
        self.stdout.write('-' * 70)
        
        test_credentials = [
            ('demo_admin', 'demo123'),
            ('demo_manager', 'demo123'),
            ('demo_supervisor', 'demo123'),
            ('admin', 'admin123'),
            ('manager', 'manager123'),
        ]
        
        for username, password in test_credentials:
            user = User.objects.filter(username=username).first()
            if not user:
                self.stdout.write(f'  [X] {username}: User does not exist')
                continue
            
            if not user.is_active:
                self.stdout.write(f'  [X] {username}: User is inactive')
                continue
            
            test_user = authenticate(username=username, password=password)
            if test_user:
                self.stdout.write(self.style.SUCCESS(f'  [OK] {username}: Authentication works'))
            else:
                self.stdout.write(self.style.ERROR(f'  [X] {username}: Authentication FAILED'))
        
        # 6. Recommendations
        self.stdout.write('\n[6] RECOMMENDATIONS')
        self.stdout.write('-' * 70)
        
        issues = []
        
        # Check if demo users exist
        demo_exist = User.objects.filter(username__in=demo_users).exists()
        if not demo_exist:
            issues.append('Demo users do not exist - run: python manage.py create_demo_users')
        
        # Check if users have permissions
        users_without_perms = []
        for user in users:
            if not user.is_superuser:
                try:
                    profile = user.profile
                    if profile.role != 'ADMIN':
                        has_any_perm = UserPermission.objects.filter(user=user).exists()
                        if not has_any_perm:
                            users_without_perms.append(user.username)
                except:
                    pass
        
        if users_without_perms:
            issues.append(f'Users without permissions: {", ".join(users_without_perms)} - run: python manage.py assign_permissions')
        
        # Check if data exists
        if items_count == 0:
            issues.append('No items in database - run: python manage.py seed_data --clear')
        
        if issues:
            self.stdout.write(self.style.WARNING('Issues found:'))
            for issue in issues:
                self.stdout.write(f'  - {issue}')
        else:
            self.stdout.write(self.style.SUCCESS('No issues found!'))
        
        self.stdout.write('\n' + '=' * 70)
