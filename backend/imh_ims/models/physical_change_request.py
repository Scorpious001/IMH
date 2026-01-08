from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User
from decimal import Decimal


class PhysicalChangeRequest(models.Model):
    """
    Physical change request for inventory modifications.
    Items above a cost threshold require manager approval.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('DENIED', 'Denied'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    REQUEST_TYPES = [
        ('ADJUST', 'Stock Adjust'),
        ('COUNT_ADJUST', 'Count Adjust'),
        ('TRANSFER', 'Transfer'),
        ('ISSUE', 'Issue'),
        ('RECEIVE', 'Receive'),
    ]

    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    location = models.ForeignKey(
        'Location',
        on_delete=models.CASCADE,
        related_name='physical_change_requests'
    )
    requested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='physical_change_requests'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Approval fields
    requires_approval = models.BooleanField(default=False, help_text="True if total cost exceeds threshold")
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_physical_change_requests'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    denied_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='denied_physical_change_requests'
    )
    denied_at = models.DateTimeField(null=True, blank=True)
    denial_reason = models.TextField(blank=True)
    
    # Tracking fields
    total_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Total cost of all items in this request"
    )
    cost_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=100.00,
        help_text="Cost threshold above which manager approval is required"
    )
    
    # Print tracking
    printed_at = models.DateTimeField(null=True, blank=True)
    printed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='printed_change_requests'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"PCR #{self.id}: {self.get_request_type_display()} - {self.location.name} ({self.status})"

    @property
    def needs_approval(self):
        """Check if this request needs manager approval based on cost"""
        return self.total_cost > self.cost_threshold

    def calculate_total_cost(self):
        """Calculate total cost of all items in this request"""
        total = Decimal('0')
        for line in self.lines.all():
            if line.item.cost:
                total += Decimal(str(line.item.cost)) * Decimal(str(line.qty))
        return total


class PhysicalChangeRequestLine(models.Model):
    """Line item in a physical change request"""
    request = models.ForeignKey(
        PhysicalChangeRequest,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    item = models.ForeignKey(
        'Item',
        on_delete=models.CASCADE,
        related_name='physical_change_request_lines'
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
        blank=True,
        help_text="Cost at time of request"
    )
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = [['request', 'item']]

    def __str__(self):
        return f"{self.item.name}: {self.qty}"

    @property
    def line_cost(self):
        """Calculate line cost"""
        if self.unit_cost:
            return Decimal(str(self.unit_cost)) * Decimal(str(self.qty))
        elif self.item.cost:
            return Decimal(str(self.item.cost)) * Decimal(str(self.qty))
        return Decimal('0')
