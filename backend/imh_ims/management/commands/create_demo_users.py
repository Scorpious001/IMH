from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from imh_ims.models import UserProfile, ModulePermission, UserPermission


class Command(BaseCommand):
    help = 'Create generic demo users with different roles for demonstration purposes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing demo users before creating new ones'
        )

    def handle(self, *args, **options):
        demo_users = [
            {
                'username': 'demo_admin',
                'password': 'demo123',
                'email': 'demo_admin@example.com',
                'first_name': 'Demo',
                'last_name': 'Administrator',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'username': 'demo_manager',
                'password': 'demo123',
                'email': 'demo_manager@example.com',
                'first_name': 'Demo',
                'last_name': 'Manager',
                'role': 'MANAGER',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'username': 'demo_supervisor',
                'password': 'demo123',
                'email': 'demo_supervisor@example.com',
                'first_name': 'Demo',
                'last_name': 'Supervisor',
                'role': 'SUPERVISOR',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'username': 'demo_staff',
                'password': 'demo123',
                'email': 'demo_staff@example.com',
                'first_name': 'Demo',
                'last_name': 'Staff',
                'role': 'SUPERVISOR',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'username': 'demo_user1',
                'password': 'demo123',
                'email': 'demo_user1@example.com',
                'first_name': 'Demo',
                'last_name': 'User One',
                'role': 'SUPERVISOR',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'username': 'demo_user2',
                'password': 'demo123',
                'email': 'demo_user2@example.com',
                'first_name': 'Demo',
                'last_name': 'User Two',
                'role': 'SUPERVISOR',
                'is_staff': False,
                'is_superuser': False,
            },
        ]

        if options['clear']:
            self.stdout.write('Clearing existing demo users...')
            demo_usernames = [user['username'] for user in demo_users]
            User.objects.filter(username__in=demo_usernames).delete()
            self.stdout.write(self.style.SUCCESS('  [OK] Cleared existing demo users'))

        with transaction.atomic():
            created_count = 0
            updated_count = 0

            for user_data in demo_users:
                username = user_data.pop('username')
                password = user_data.pop('password')
                role = user_data.pop('role')

                user, created = User.objects.get_or_create(
                    username=username,
                    defaults=user_data
                )

                if created:
                    created_count += 1
                    self.stdout.write(f'  Created user: {username}')
                else:
                    updated_count += 1
                    # Update existing user
                    for key, value in user_data.items():
                        setattr(user, key, value)
                    user.save()
                    self.stdout.write(f'  Updated user: {username}')

                # Set password
                user.set_password(password)
                user.is_active = True
                user.save()

                # Create or update profile
                profile, profile_created = UserProfile.objects.get_or_create(user=user)
                profile.role = role
                profile.save()

                # Assign permissions for non-admin users
                if role != 'ADMIN':
                    try:
                        # Get all view permissions for common modules
                        view_permissions = ModulePermission.objects.filter(
                            action='view'
                        ).filter(
                            module__in=['catalog', 'stock', 'requisitions', 'receiving', 'counts']
                        )
                        
                        # Assign permissions
                        for permission in view_permissions:
                            UserPermission.objects.get_or_create(
                                user=user,
                                permission=permission
                            )
                        
                        # For managers, also add create and edit permissions
                        if role == 'MANAGER':
                            manager_permissions = ModulePermission.objects.filter(
                                action__in=['create', 'edit']
                            ).filter(
                                module__in=['catalog', 'stock', 'requisitions', 'receiving', 'counts']
                            )
                            
                            for permission in manager_permissions:
                                UserPermission.objects.get_or_create(
                                    user=user,
                                    permission=permission
                                )
                    except Exception as e:
                        # If permissions don't exist yet, skip
                        self.stdout.write(
                            self.style.WARNING(f'  Could not assign permissions to {username}: {e}')
                        )

        self.stdout.write(self.style.SUCCESS(f'\n[SUCCESS] Demo users created/updated!'))
        self.stdout.write(f'  Created: {created_count} users')
        self.stdout.write(f'  Updated: {updated_count} users')
        self.stdout.write('\nDemo Login Credentials:')
        self.stdout.write('=' * 50)
        for user_data in demo_users:
            self.stdout.write(f"  Username: {user_data['username']}")
            self.stdout.write(f"  Password: demo123")
            self.stdout.write(f"  Role: {user_data['role']}")
            self.stdout.write('')
