from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User


class PurchaseRequest(models.Model):
    """Purchase request for ordering from vendors"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('ORDERED', 'Ordered'),
        ('RECEIVED', 'Received'),
        ('CANCELLED', 'Cancelled'),
    ]

    vendor = models.ForeignKey(
        'Vendor',
        on_delete=models.CASCADE,
        related_name='purchase_requests'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    requested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='purchase_requests'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"PR #{self.id}: {self.vendor.name} ({self.status})"


class PurchaseRequestLine(models.Model):
    """Line item in a purchase request"""
    purchase_request = models.ForeignKey(
        PurchaseRequest,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    item = models.ForeignKey(
        'Item',
        on_delete=models.CASCADE,
        related_name='purchase_request_lines'
    )
    qty = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    unit_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    class Meta:
        unique_together = [['purchase_request', 'item']]

    def __str__(self):
        return f"{self.item.name}: {self.qty} @ {self.unit_cost or 'N/A'}"

