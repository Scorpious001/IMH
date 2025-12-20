from django.db import models


class Category(models.Model):
    """Item category for organizing inventory items"""
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name or class")
    parent_category = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name

