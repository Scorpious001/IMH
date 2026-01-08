from django.db import models
from django.contrib.auth.models import User


class RequestedItem(models.Model):
    """
    Track items requested by users for tracking and reference.
    This is separate from requisitions - used for wishlist/tracking purposes.
    """
    STATUS_CHOICES = [
        ('REQUESTED', 'Requested'),
        ('ORDERED', 'Ordered'),
        ('RECEIVED', 'Received'),
        ('CANCELLED', 'Cancelled'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='requested_items'
    )
    item = models.ForeignKey(
        'Item',
        on_delete=models.CASCADE,
        related_name='requested_by_users'
    )
    department = models.ForeignKey(
        'Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requested_items'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REQUESTED')
    requested_at = models.DateTimeField(auto_now_add=True)
    requested_qty = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=1,
        help_text="Quantity requested"
    )
    notes = models.TextField(blank=True)
    priority = models.IntegerField(
        default=1,
        help_text="Priority level (1=low, 5=high)"
    )
    
    # Tracking
    ordered_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_requested_items'
    )

    class Meta:
        ordering = ['-requested_at']
        unique_together = [['user', 'item', 'status']]

    def __str__(self):
        return f"{self.user.username} requested {self.item.name} ({self.status})"
