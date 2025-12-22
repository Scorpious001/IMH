from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from imh_ims.models import UserProfile


class Command(BaseCommand):
    help = 'Assign ADMIN role to a user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to assign ADMIN role to')

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"User '{username}' not found!"))
            self.stdout.write("Available users:")
            for u in User.objects.all():
                self.stdout.write(f"  - {u.username}")
            return

        # Get or create profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        old_role = profile.role
        profile.role = 'ADMIN'
        profile.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"✓ Successfully assigned ADMIN role to user: {user.username}"
            )
        )
        self.stdout.write(f"  User ID: {user.id}")
        self.stdout.write(f"  Email: {user.email or 'N/A'}")
        if created:
            self.stdout.write(f"  Profile was created (didn't exist before)")
        else:
            self.stdout.write(f"  Previous Role: {old_role}")
        self.stdout.write(f"  New Role: {profile.get_role_display()}")

