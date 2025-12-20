from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Creates or updates the Scorpious master user with username "Scorpious" and password "L8Rb1tch"'

    def handle(self, *args, **options):
        username = 'Scorpious'
        password = 'L8Rb1tch'
        email = 'scorpious@example.com'
        
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
                self.style.SUCCESS(f'Successfully created master user "{username}"')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated master user "{username}" with new password')
            )

