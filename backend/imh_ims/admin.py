from django.contrib import admin
from .models import (
    Category, Vendor, Location, Item, StockLevel,
    InventoryTransaction, Requisition, RequisitionLine,
    CountSession, CountLine, PurchaseRequest, PurchaseRequestLine,
    Department, PhysicalChangeRequest, PhysicalChangeRequestLine,
    RequestedItem, UserProfile
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent_category', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'parent_location', 'is_active']
    list_filter = ['type', 'is_active']
    search_fields = ['name', 'property_id']


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'short_code', 'category', 'unit_of_measure', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'short_code']


@admin.register(StockLevel)
class StockLevelAdmin(admin.ModelAdmin):
    list_display = ['item', 'location', 'on_hand_qty', 'par', 'is_below_par']
    list_filter = ['location', 'item__category']
    search_fields = ['item__name', 'location__name']


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ['item', 'type', 'qty', 'from_location', 'to_location', 'timestamp', 'user']
    list_filter = ['type', 'timestamp']
    search_fields = ['item__name']
    readonly_fields = ['timestamp']


class RequisitionLineInline(admin.TabularInline):
    model = RequisitionLine
    extra = 1


@admin.register(Requisition)
class RequisitionAdmin(admin.ModelAdmin):
    list_display = ['id', 'from_location', 'to_location', 'status', 'requested_by', 'created_at']
    list_filter = ['status', 'created_at']
    inlines = [RequisitionLineInline]


@admin.register(CountSession)
class CountSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'location', 'counted_by', 'status', 'started_at']
    list_filter = ['status', 'started_at']


class CountLineInline(admin.TabularInline):
    model = CountLine
    extra = 1


@admin.register(PurchaseRequest)
class PurchaseRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'vendor', 'status', 'requested_by', 'created_at']
    list_filter = ['status', 'created_at']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


class PhysicalChangeRequestLineInline(admin.TabularInline):
    model = PhysicalChangeRequestLine
    extra = 1


@admin.register(PhysicalChangeRequest)
class PhysicalChangeRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'request_type', 'location', 'status', 'requested_by', 'total_cost', 'requires_approval', 'created_at']
    list_filter = ['status', 'request_type', 'requires_approval', 'created_at']
    inlines = [PhysicalChangeRequestLineInline]


@admin.register(RequestedItem)
class RequestedItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'item', 'status', 'requested_qty', 'priority', 'requested_at']
    list_filter = ['status', 'priority', 'requested_at']
    search_fields = ['user__username', 'item__name']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'department', 'created_at']
    list_filter = ['role', 'department']
    search_fields = ['user__username', 'user__email']
