from django.db import models
from django.contrib.auth.models import User


class CountSession(models.Model):
    """Physical count session"""
    STATUS_CHOICES = [
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('APPROVED', 'Approved'),
        ('CANCELLED', 'Cancelled'),
    ]

    location = models.ForeignKey(
        'Location',
        on_delete=models.CASCADE,
        related_name='count_sessions'
    )
    counted_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='count_sessions'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_count_sessions'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Count #{self.id}: {self.location.name} ({self.status})"


class CountLine(models.Model):
    """Line item in a count session"""
    REASON_CODES = [
        ('LOST', 'Lost'),
        ('DAMAGED', 'Damaged'),
        ('VENDOR_ERROR', 'Vendor Error'),
        ('DATA_ERROR', 'Data Error'),
        ('THEFT', 'Theft'),
        ('OTHER', 'Other'),
    ]

    count_session = models.ForeignKey(
        CountSession,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    item = models.ForeignKey(
        'Item',
        on_delete=models.CASCADE,
        related_name='count_lines'
    )
    expected_qty = models.DecimalField(max_digits=10, decimal_places=2)
    counted_qty = models.DecimalField(max_digits=10, decimal_places=2)
    variance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reason_code = models.CharField(
        max_length=20,
        choices=REASON_CODES,
        blank=True,
        help_text="Reason for variance (if applicable)"
    )
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = [['count_session', 'item']]

    def __str__(self):
        return f"{self.item.name}: Expected {self.expected_qty}, Counted {self.counted_qty}"

    def save(self, *args, **kwargs):
        """Calculate variance automatically"""
        self.variance = self.counted_qty - self.expected_qty
        super().save(*args, **kwargs)

