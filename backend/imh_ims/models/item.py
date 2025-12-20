from django.db import models
from django.core.validators import MinValueValidator


class Item(models.Model):
    """Inventory item/SKU"""
    name = models.CharField(max_length=200)
    short_code = models.CharField(max_length=50, unique=True, help_text="Unique item code/SKU")
    category = models.ForeignKey(
        'Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items'
    )
    photo_url = models.URLField(blank=True, help_text="URL to item photo")
    unit_of_measure = models.CharField(
        max_length=20,
        default='ea',
        help_text="Unit of measure (ea, case, roll, liter, etc.)"
    )
    default_vendor = models.ForeignKey(
        'Vendor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items'
    )
    cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    lead_time_days = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Lead time in days from vendor"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.short_code})"

