from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User


class Requisition(models.Model):
    """Internal requisition request"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('DENIED', 'Denied'),
        ('PICKED', 'Picked'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    from_location = models.ForeignKey(
        'Location',
        on_delete=models.CASCADE,
        related_name='outgoing_requisitions'
    )
    to_location = models.ForeignKey(
        'Location',
        on_delete=models.CASCADE,
        related_name='incoming_requisitions'
    )
    requested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='requisitions'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    needed_by = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    # Approval fields
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_requisitions'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    denied_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='denied_requisitions'
    )
    denied_at = models.DateTimeField(null=True, blank=True)
    denial_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Req #{self.id}: {self.from_location.name} -> {self.to_location.name} ({self.status})"


class RequisitionLine(models.Model):
    """Line item in a requisition"""
    requisition = models.ForeignKey(
        Requisition,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    item = models.ForeignKey(
        'Item',
        on_delete=models.CASCADE,
        related_name='requisition_lines'
    )
    qty_requested = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    qty_picked = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )

    class Meta:
        unique_together = [['requisition', 'item']]

    def __str__(self):
        return f"{self.item.name}: {self.qty_requested} requested, {self.qty_picked} picked"

