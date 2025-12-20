from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User


class InventoryTransaction(models.Model):
    """Inventory transaction ledger"""
    TRANSACTION_TYPES = [
        ('RECEIVE', 'Receive'),
        ('ISSUE', 'Issue'),
        ('TRANSFER', 'Transfer'),
        ('ADJUST', 'Adjust'),
        ('COUNT_ADJUST', 'Count Adjust'),
    ]

    item = models.ForeignKey(
        'Item',
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    from_location = models.ForeignKey(
        'Location',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='outgoing_transactions'
    )
    to_location = models.ForeignKey(
        'Location',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='incoming_transactions'
    )
    qty = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='inventory_transactions'
    )
    cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    notes = models.TextField(blank=True)
    # Reference fields for linking to other entities
    requisition = models.ForeignKey(
        'Requisition',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    receipt_id = models.CharField(max_length=100, blank=True)
    work_order_id = models.CharField(max_length=100, blank=True)
    count_session = models.ForeignKey(
        'CountSession',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['item', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.get_type_display()} - {self.item.name} - {self.qty} @ {self.timestamp}"

