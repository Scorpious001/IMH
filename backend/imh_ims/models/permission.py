from django.db import models
from django.contrib.auth.models import User


class ModulePermission(models.Model):
    """Permission model for module/action combinations"""
    MODULE_CHOICES = [
        ('catalog', 'Catalog'),
        ('stock', 'Stock'),
        ('vendors', 'Vendors'),
        ('requisitions', 'Requisitions'),
        ('receiving', 'Receiving'),
        ('counts', 'Counts'),
        ('reports', 'Reports'),
    ]

    ACTION_CHOICES = [
        ('view', 'View'),
        ('create', 'Create'),
        ('edit', 'Edit'),
        ('delete', 'Delete'),
    ]

    module = models.CharField(max_length=50, choices=MODULE_CHOICES)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    name = models.CharField(max_length=100, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['module', 'action']]
        ordering = ['module', 'action']
        indexes = [
            models.Index(fields=['module', 'action']),
        ]

    def save(self, *args, **kwargs):
        """Auto-generate name from module and action"""
        self.name = f"{self.module}.{self.action}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_module_display()}: {self.get_action_display()}"


class UserPermission(models.Model):
    """Many-to-many relationship between User and Permission"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='module_permissions'  # Changed from 'user_permissions' to avoid conflict with Django's built-in user_permissions
    )
    permission = models.ForeignKey(
        ModulePermission,
        on_delete=models.CASCADE,
        related_name='user_permissions'
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='granted_permissions'
    )

    class Meta:
        unique_together = [['user', 'permission']]
        ordering = ['user', 'permission']
        indexes = [
            models.Index(fields=['user', 'permission']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.permission.name}"

