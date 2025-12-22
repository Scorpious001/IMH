from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """Extended user profile with role information"""
    ROLE_CHOICES = [
        ('SUPERVISOR', 'Supervisor'),
        ('MANAGER', 'Manager'),
        ('ADMIN', 'Admin'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='SUPERVISOR'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user__username']

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"

    @property
    def is_manager_or_admin(self):
        """Check if user is manager or admin (can approve requests)"""
        return self.role in ['MANAGER', 'ADMIN']

    @property
    def is_admin(self):
        """Check if user is admin (can manage users)"""
        return self.role == 'ADMIN'

    def has_permission(self, module, action):
        """
        Check if user has a specific permission.
        Admins have all permissions by default.
        """
        if self.is_admin:
            return True
        
        from imh_ims.models import ModulePermission, UserPermission
        try:
            permission = ModulePermission.objects.get(module=module, action=action)
            return UserPermission.objects.filter(
                user=self.user,
                permission=permission
            ).exists()
        except ModulePermission.DoesNotExist:
            return False

    def get_permissions(self):
        """Get all permissions for this user as a queryset"""
        from imh_ims.models import UserPermission
        return UserPermission.objects.filter(user=self.user).select_related('permission')

    def can_view_module(self, module):
        """Convenience method to check if user can view a module"""
        return self.has_permission(module, 'view')

