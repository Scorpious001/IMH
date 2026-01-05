from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from imh_ims.models import UserProfile, ModulePermission, UserPermission


class Command(BaseCommand):
    help = 'Assign default permissions to all users based on their roles'

    def handle(self, *args, **options):
        # Get all permissions
        all_permissions = ModulePermission.objects.all()
        
        if not all_permissions.exists():
            self.stdout.write(self.style.WARNING('No permissions found in database. Please run migrations first.'))
            return
        
        # Get all users
        users = User.objects.all()
        
        assigned_count = 0
        
        for user in users:
            try:
                profile = user.profile
            except UserProfile.DoesNotExist:
                # Create profile if it doesn't exist
                profile = UserProfile.objects.create(user=user, role='SUPERVISOR')
            
            # Superusers and admins have all permissions implicitly, but we can still assign them
            # For other users, assign based on role
            if user.is_superuser or profile.role == 'ADMIN':
                # Admins get all permissions
                for perm in all_permissions:
                    UserPermission.objects.get_or_create(
                        user=user,
                        permission=perm
                    )
                assigned_count += 1
                self.stdout.write(f'  Assigned all permissions to {user.username} (admin/superuser)')
            elif profile.role == 'MANAGER':
                # Managers get view, create, edit permissions
                manager_perms = all_permissions.filter(
                    action__in=['view', 'create', 'edit']
                )
                for perm in manager_perms:
                    UserPermission.objects.get_or_create(
                        user=user,
                        permission=perm
                    )
                assigned_count += 1
                self.stdout.write(f'  Assigned manager permissions to {user.username}')
            else:
                # Supervisors get view permissions
                view_perms = all_permissions.filter(action='view')
                for perm in view_perms:
                    UserPermission.objects.get_or_create(
                        user=user,
                        permission=perm
                    )
                assigned_count += 1
                self.stdout.write(f'  Assigned view permissions to {user.username}')
        
        self.stdout.write(self.style.SUCCESS(f'\n[SUCCESS] Assigned permissions to {assigned_count} users'))
