from django.db import models
from django.contrib.auth.models import User


class Location(models.Model):
    """Physical locations where inventory is stored"""
    LOCATION_TYPES = [
        ('STOREROOM', 'Storeroom'),
        ('CLOSET', 'Closet'),
        ('CART', 'Cart'),
        ('ROOM', 'Room'),
        ('OTHER', 'Other'),
    ]

    property_id = models.CharField(max_length=50, blank=True, help_text="Property identifier")
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=LOCATION_TYPES, default='STOREROOM')
    parent_location = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='child_locations',
        help_text="For hierarchical structure (e.g., Floor -> Closet)"
    )
    floorplan_id = models.CharField(max_length=100, blank=True, help_text="Link to Floor Plan IMS")
    coordinates = models.CharField(max_length=100, blank=True, help_text="Coordinates on floor plan")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

    def get_full_path(self):
        """Return full hierarchical path"""
        path = [self.name]
        parent = self.parent_location
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent_location
        return " > ".join(path)

