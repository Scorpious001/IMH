from rest_framework import serializers
from django.contrib.auth.models import User
from imh_ims.models import (
    Category, Vendor, Location, Item, StockLevel,
    InventoryTransaction, Requisition, RequisitionLine,
    CountSession, CountLine, PurchaseRequest, PurchaseRequestLine,
    UserProfile, ModulePermission, UserPermission
)


class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()
    parent_category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'parent_category', 'subcategories', 'is_active', 'par_min', 'par_max', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.all(), many=True).data
        return []
    
    def validate_parent_category(self, value):
        """Validate parent_category - allow None for top-level categories"""
        return value
    
    def create(self, validated_data):
        """Create category with proper handling of None values"""
        try:
            # Ensure parent_category is None (not empty string) if not provided
            if 'parent_category' not in validated_data:
                validated_data['parent_category'] = None
            elif validated_data['parent_category'] is None:
                validated_data['parent_category'] = None
            
            # Ensure is_active has a default value
            if 'is_active' not in validated_data:
                validated_data['is_active'] = True
                
            return super().create(validated_data)
        except Exception as e:
            import traceback
            print(f"Error in CategorySerializer.create: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            print(f"Validated data: {validated_data}")
            raise


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ['id', 'name', 'contact_info', 'phone', 'email', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class LocationSerializer(serializers.ModelSerializer):
    parent_location_name = serializers.CharField(source='parent_location.name', read_only=True)
    full_path = serializers.CharField(read_only=True)
    child_locations = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = [
            'id', 'property_id', 'name', 'type', 'parent_location', 'parent_location_name',
            'floorplan_id', 'coordinates', 'is_active', 'full_path', 'child_locations',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_child_locations(self, obj):
        if obj.child_locations.exists():
            return LocationSerializer(obj.child_locations.all(), many=True).data
        return []


class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    default_vendor_name = serializers.CharField(source='default_vendor.name', read_only=True)
    property_on_hand = serializers.SerializerMethodField()
    property_id = serializers.SerializerMethodField()
    is_below_par_anywhere = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'short_code', 'category', 'category_name', 'photo_url',
            'unit_of_measure', 'default_vendor', 'default_vendor_name', 'cost',
            'lead_time_days', 'is_active', 'property_on_hand', 'property_id', 'is_below_par_anywhere',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'property_on_hand', 'property_id', 'is_below_par_anywhere']

    def get_property_on_hand(self, obj):
        """Calculate total on-hand quantity for the primary property"""
        from imh_ims.services.stock_service import StockService
        on_hand, _ = StockService.get_property_on_hand(obj)
        return on_hand

    def get_property_id(self, obj):
        """Get the primary property_id for this item"""
        from imh_ims.services.stock_service import StockService
        _, property_id = StockService.get_property_on_hand(obj)
        return property_id

    def get_is_below_par_anywhere(self, obj):
        """Check if item is below par at any location"""
        return any(stock.is_below_par for stock in obj.stock_levels.all())


class StockLevelSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_short_code = serializers.CharField(source='item.short_code', read_only=True)
    item_photo_url = serializers.CharField(source='item.photo_url', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_property_id = serializers.CharField(source='location.property_id', read_only=True, allow_blank=True)
    available_qty = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2, coerce_to_string=False)
    on_hand_qty = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    reserved_qty = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    par = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    is_below_par = serializers.BooleanField(read_only=True)
    is_at_risk = serializers.BooleanField(read_only=True)

    class Meta:
        model = StockLevel
        fields = [
            'id', 'item', 'item_name', 'item_short_code', 'item_photo_url',
            'location', 'location_name', 'location_property_id', 'on_hand_qty', 'reserved_qty',
            'available_qty', 'par', 'is_below_par', 'is_at_risk',
            'last_counted_at', 'last_counted_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'available_qty', 'is_below_par', 'is_at_risk']


class InventoryTransactionSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    from_location_name = serializers.CharField(source='from_location.name', read_only=True, allow_null=True)
    to_location_name = serializers.CharField(source='to_location.name', read_only=True, allow_null=True)
    user_name = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'item', 'item_name', 'from_location', 'from_location_name',
            'to_location', 'to_location_name', 'qty', 'type', 'timestamp',
            'user', 'user_name', 'cost', 'notes', 'requisition', 'receipt_id',
            'work_order_id', 'count_session'
        ]
        read_only_fields = ['timestamp']


class RequisitionLineSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_short_code = serializers.CharField(source='item.short_code', read_only=True)
    item_photo_url = serializers.CharField(source='item.photo_url', read_only=True)
    available_qty = serializers.SerializerMethodField()

    class Meta:
        model = RequisitionLine
        fields = [
            'id', 'item', 'item_name', 'item_short_code', 'item_photo_url',
            'qty_requested', 'qty_picked', 'available_qty'
        ]

    def get_available_qty(self, obj):
        """Get available quantity at from_location"""
        requisition = obj.requisition
        try:
            stock = StockLevel.objects.get(
                item=obj.item,
                location=requisition.from_location
            )
            return stock.available_qty
        except StockLevel.DoesNotExist:
            return 0


class RequisitionSerializer(serializers.ModelSerializer):
    from_location_name = serializers.CharField(source='from_location.name', read_only=True)
    to_location_name = serializers.CharField(source='to_location.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    denied_by_name = serializers.CharField(source='denied_by.username', read_only=True, allow_null=True)
    lines = RequisitionLineSerializer(many=True, read_only=True)

    class Meta:
        model = Requisition
        fields = [
            'id', 'from_location', 'from_location_name', 'to_location', 'to_location_name',
            'requested_by', 'requested_by_name', 'status', 'created_at', 'needed_by',
            'completed_at', 'notes', 'lines', 'approved_by', 'approved_by_name', 'approved_at',
            'denied_by', 'denied_by_name', 'denied_at', 'denial_reason'
        ]
        read_only_fields = ['created_at', 'completed_at', 'approved_at', 'denied_at']


class CountLineSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_short_code = serializers.CharField(source='item.short_code', read_only=True)
    item_photo_url = serializers.CharField(source='item.photo_url', read_only=True)

    class Meta:
        model = CountLine
        fields = [
            'id', 'item', 'item_name', 'item_short_code', 'item_photo_url',
            'expected_qty', 'counted_qty', 'variance', 'reason_code', 'notes'
        ]


class CountSessionSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)
    counted_by_name = serializers.CharField(source='counted_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    lines = CountLineSerializer(many=True, read_only=True)

    class Meta:
        model = CountSession
        fields = [
            'id', 'location', 'location_name', 'counted_by', 'counted_by_name',
            'status', 'started_at', 'completed_at', 'approved_by', 'approved_by_name',
            'approved_at', 'notes', 'lines'
        ]
        read_only_fields = ['started_at', 'completed_at', 'approved_at']


class PurchaseRequestLineSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_short_code = serializers.CharField(source='item.short_code', read_only=True)

    class Meta:
        model = PurchaseRequestLine
        fields = ['id', 'item', 'item_name', 'item_short_code', 'qty', 'unit_cost']


class PurchaseRequestSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    denied_by_name = serializers.CharField(source='denied_by.username', read_only=True, allow_null=True)
    lines = PurchaseRequestLineSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseRequest
        fields = [
            'id', 'vendor', 'vendor_name', 'status', 'requested_by', 'requested_by_name',
            'created_at', 'submitted_at', 'notes', 'lines', 'approved_by', 'approved_by_name', 'approved_at',
            'denied_by', 'denied_by_name', 'denied_at', 'denial_reason'
        ]
        read_only_fields = ['created_at', 'submitted_at', 'approved_at', 'denied_at']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'role', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModulePermission
        fields = ['id', 'module', 'action', 'name']
        read_only_fields = ['name']


class UserPermissionSerializer(serializers.ModelSerializer):
    permission = PermissionSerializer(read_only=True)
    permission_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = UserPermission
        fields = ['id', 'permission', 'permission_id', 'granted_at', 'granted_by']
        read_only_fields = ['granted_at']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of permission IDs to assign to the user"
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_staff', 'is_superuser', 'profile', 'role', 'permissions', 'permission_ids'
        ]
        read_only_fields = ['is_staff', 'is_superuser']

    def get_role(self, obj):
        try:
            return obj.profile.role
        except UserProfile.DoesNotExist:
            return 'SUPERVISOR'

    def get_permissions(self, obj):
        """Get all permissions for the user"""
        try:
            from imh_ims.services.permission_service import get_user_permission_list
            return get_user_permission_list(obj)
        except Exception:
            # If permissions table doesn't exist yet or other error, return empty list
            return []

