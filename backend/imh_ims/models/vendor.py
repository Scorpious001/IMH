from django.db import models


class Vendor(models.Model):
    """Vendor/supplier information"""
    name = models.CharField(max_length=200)
    contact_info = models.TextField(blank=True, help_text="Contact details, address, etc.")
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

