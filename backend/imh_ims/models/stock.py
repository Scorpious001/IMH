from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User


class StockLevel(models.Model):
    """Stock level for an item at a specific location"""
    item = models.ForeignKey(
        'Item',
        on_delete=models.CASCADE,
        related_name='stock_levels'
    )
    location = models.ForeignKey(
        'Location',
        on_delete=models.CASCADE,
        related_name='stock_levels'
    )
    on_hand_qty = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    reserved_qty = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    par_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Minimum par level"
    )
    par_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Maximum par level"
    )
    last_counted_at = models.DateTimeField(null=True, blank=True)
    last_counted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='counted_stock_levels'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['item', 'location']]
        ordering = ['item__name']

    def __str__(self):
        return f"{self.item.name} at {self.location.name}: {self.on_hand_qty}"

    @property
    def available_qty(self):
        """Available quantity (on_hand - reserved)"""
        return max(0, self.on_hand_qty - self.reserved_qty)

    @property
    def is_below_par(self):
        """Check if stock is below minimum par level"""
        return self.on_hand_qty < self.par_min

    @property
    def is_at_risk(self):
        """Check if stock is near reorder trigger (between min and min*1.2)"""
        if self.par_min == 0:
            return False
        return self.par_min <= self.on_hand_qty < (self.par_min * 1.2)

