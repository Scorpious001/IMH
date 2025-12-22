from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from imh_ims.models import UserProfile


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
                'is_superuser': True,
                'is_active': True
            }
        )
        
        # Always set the password in case it was changed or user already exists
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True  # Ensure user is active
        user.email = email
        user.save()
        
        # Get or create UserProfile and assign ADMIN role
        profile, profile_created = UserProfile.objects.get_or_create(user=user)
        profile.role = 'ADMIN'
        profile.save()
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created master user "{username}"')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated master user "{username}" with new password')
            )
        
        if profile_created:
            self.stdout.write(
                self.style.SUCCESS(f'Created UserProfile and assigned ADMIN role to "{username}"')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Updated UserProfile: assigned ADMIN role to "{username}"')
            )

