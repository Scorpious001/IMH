from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Creates or updates an admin user with username "admin" and password "admin123"'

    def handle(self, *args, **options):
        username = 'admin'
        password = 'admin123'
        email = 'admin@example.com'
        
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        # Always set the password in case it was changed or user already exists
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.email = email
        user.save()
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created admin user "{username}"')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated admin user "{username}" with new password')
            )

