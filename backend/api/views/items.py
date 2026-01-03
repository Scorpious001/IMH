from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, Sum, F
from django.db import transaction
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal, InvalidOperation
import pandas as pd
import io
from imh_ims.models import Item, StockLevel, InventoryTransaction, Category, Vendor, Location
from api.serializers import ItemSerializer
from imh_ims.services.stock_service import StockService
from imh_ims.services.qr_service import generate_qr_code_response, generate_qr_code_base64
from api.permissions import create_permission_class


class ItemViewSet(viewsets.ModelViewSet):
    """ViewSet for Item operations"""
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Apply permission checks based on action"""
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [IsAuthenticated, create_permission_class('catalog', 'view')]
        elif self.action == 'create':
            self.permission_classes = [IsAuthenticated, create_permission_class('catalog', 'create')]
        elif self.action in ['update', 'partial_update']:
            self.permission_classes = [IsAuthenticated, create_permission_class('catalog', 'edit')]
        elif self.action == 'destroy':
            self.permission_classes = [IsAuthenticated, create_permission_class('catalog', 'delete')]
        elif self.action == 'bulk_import':
            # Bulk import requires admin permission (checked in the action itself)
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        # For list view, filter by active items
        # For detail view (retrieve), allow inactive items too
        if self.action == 'retrieve':
            queryset = Item.objects.all()
        else:
            queryset = Item.objects.filter(is_active=True)
        
        # Filters
        category = self.request.query_params.get('category', None)
        below_par = self.request.query_params.get('below_par', None)
        vendor = self.request.query_params.get('vendor', None)
        search = self.request.query_params.get('search', None)
        critical = self.request.query_params.get('critical', None)
        
        if category:
            queryset = queryset.filter(category_id=category)
        
        if vendor:
            queryset = queryset.filter(default_vendor_id=vendor)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(short_code__icontains=search)
            )
        
        if below_par == 'true':
            # Filter items that are below par at any location
            item_ids = StockLevel.objects.filter(
                on_hand_qty__lt=F('par')
            ).values_list('item_id', flat=True).distinct()
            queryset = queryset.filter(id__in=item_ids)
        
        if critical == 'true':
            # Items that are below par and have low stock
            item_ids = StockLevel.objects.filter(
                on_hand_qty__lt=F('par')
            ).filter(
                on_hand_qty__lt=10
            ).values_list('item_id', flat=True).distinct()
            queryset = queryset.filter(id__in=item_ids)
        
        return queryset.order_by('name')

    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        """Get usage history for an item"""
        item = self.get_object()
        days = int(request.query_params.get('days', 30))
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Get transactions grouped by day
        transactions = InventoryTransaction.objects.filter(
            item=item,
            type='ISSUE',
            timestamp__gte=cutoff_date
        ).extra(
            select={'day': 'date(timestamp)'}
        ).values('day').annotate(
            total_qty=Sum('qty')
        ).order_by('day')
        
        return Response({
            'item_id': item.id,
            'item_name': item.name,
            'period_days': days,
            'usage_by_day': list(transactions)
        })

    @action(detail=True, methods=['get'])
    def stock_by_location(self, request, pk=None):
        """Get stock levels for this item across all locations"""
        item = self.get_object()
        # Get all stock levels for this item using the same relation as ItemSerializer
        stock_levels = item.stock_levels.all().select_related('location', 'item')
        
        from api.serializers import StockLevelSerializer
        serializer = StockLevelSerializer(stock_levels, many=True)
        
        # Get property-based on-hand count
        property_on_hand, property_id = StockService.get_property_on_hand(item)
        
        return Response({
            'item_id': item.id,
            'item_name': item.name,
            'property_on_hand': float(property_on_hand),
            'property_id': property_id or '',
            'stock_by_location': serializer.data
        })

    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get recent transactions for this item"""
        item = self.get_object()
        limit = int(request.query_params.get('limit', 50))
        
        transactions = InventoryTransaction.objects.filter(
            item=item
        ).select_related('from_location', 'to_location', 'user').order_by('-timestamp')[:limit]
        
        from api.serializers import InventoryTransactionSerializer
        serializer = InventoryTransactionSerializer(transactions, many=True)
        
        return Response({
            'item_id': item.id,
            'item_name': item.name,
            'transactions': serializer.data
        })

    @action(detail=True, methods=['get'], url_path='qr-code')
    def get_qr_code(self, request, pk=None):
        """
        Generate and return QR code image for item's short_code.
        Returns PNG image that can be displayed or downloaded.
        """
        item = self.get_object()
        # QR code contains the short_code for scanning
        qr_data = item.short_code
        size = int(request.query_params.get('size', 200))
        error_correction = request.query_params.get('error_correction', 'M')
        return generate_qr_code_response(qr_data, size, error_correction)

    @action(detail=True, methods=['get'], url_path='qr-code-data')
    def get_qr_code_data(self, request, pk=None):
        """
        Get QR code as base64-encoded string for embedding in JSON responses.
        Useful for frontend display without separate image request.
        """
        item = self.get_object()
        qr_data = item.short_code
        size = int(request.query_params.get('size', 200))
        error_correction = request.query_params.get('error_correction', 'M')
        qr_base64 = generate_qr_code_base64(qr_data, size, error_correction)
        
        return Response({
            'item_id': item.id,
            'item_name': item.name,
            'short_code': item.short_code,
            'qr_code': qr_base64,
            'qr_data': qr_data,  # The data encoded in QR code
            'size': size
        })

    @action(detail=False, methods=['get'], url_path='lookup/(?P<short_code>[^/.]+)')
    def lookup_by_code(self, request, short_code=None):
        """
        Look up item by short_code (for QR code scanning).
        This endpoint is optimized for mobile QR scanners.
        """
        try:
            item = Item.objects.get(short_code=short_code, is_active=True)
            serializer = self.get_serializer(item)
            return Response(serializer.data)
        except Item.DoesNotExist:
            return Response(
                {'error': f'Item with code "{short_code}" not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_import(self, request):
        """Bulk import items from CSV/Excel spreadsheet"""
        # Check admin permission
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            if not request.user.profile.is_admin:
                return Response({'error': 'Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'error': 'Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
        
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        preview_mode = request.query_params.get('preview', 'false').lower() == 'true'
        
        try:
            # Parse spreadsheet
            rows, errors = parse_spreadsheet(file)
            if errors:
                return Response({'error': f'Failed to parse file: {errors}'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate all rows
            validated_rows = []
            validation_errors = []
            
            for idx, row in enumerate(rows, start=2):  # Start at 2 (row 1 is header)
                validation_result = validate_row(row, idx)
                if validation_result['valid']:
                    validated_rows.append({
                        'row_number': idx,
                        'data': validation_result['data'],
                        'errors': []
                    })
                else:
                    validation_errors.append({
                        'row_number': idx,
                        'errors': validation_result['errors'],
                        'data': row
                    })
            
            if preview_mode:
                # Return preview with validation results
                return Response({
                    'preview': True,
                    'total_rows': len(rows),
                    'valid_rows': len(validated_rows),
                    'invalid_rows': len(validation_errors),
                    'rows': validated_rows,
                    'errors': validation_errors
                })
            else:
                # Process import
                result = process_import_rows(validated_rows, request.user)
                return Response(result)
                
        except Exception as e:
            import traceback
            return Response({
                'error': f'Import failed: {str(e)}',
                'traceback': traceback.format_exc() if request.user.is_superuser else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def parse_spreadsheet(file):
    """Parse CSV or Excel file into list of dictionaries"""
    errors = []
    rows = []
    
    try:
        # Determine file type
        file_extension = file.name.lower().split('.')[-1]
        
        if file_extension in ['xlsx', 'xls']:
            # Excel file
            df = pd.read_excel(file, engine='openpyxl')
        elif file_extension == 'csv':
            # CSV file
            df = pd.read_csv(file)
        else:
            errors.append(f'Unsupported file type: {file_extension}. Supported: CSV, XLSX, XLS')
            return rows, errors
        
        # Convert to list of dictionaries, handling NaN values
        df = df.fillna('')  # Replace NaN with empty string
        rows = df.to_dict('records')
        
        # Normalize column names (strip whitespace, lowercase)
        normalized_rows = []
        for row in rows:
            normalized_row = {}
            for key, value in row.items():
                normalized_key = str(key).strip().lower().replace(' ', '_')
                normalized_row[normalized_key] = value
            normalized_rows.append(normalized_row)
        
        return normalized_rows, errors
        
    except Exception as e:
        errors.append(f'Failed to parse file: {str(e)}')
        return rows, errors


def validate_row(row, row_number):
    """Validate a single row of import data"""
    errors = []
    data = {}
    
    # Debug: Log available keys for troubleshooting (first row only)
    if row_number == 2:
        print(f"DEBUG: Available columns in row: {list(row.keys())}")
        print(f"DEBUG: Sample row data: {row}")
    
    # Required fields
    name = str(row.get('name', '')).strip()
    short_code = str(row.get('short_code', '')).strip()
    
    if not name:
        errors.append('name is required')
    else:
        data['name'] = name
    
    if not short_code:
        errors.append('short_code is required')
    else:
        data['short_code'] = short_code
    
    # Optional item fields
    category = str(row.get('category', '')).strip()
    if category:
        data['category'] = category
    
    default_vendor = str(row.get('default_vendor', '')).strip()
    if default_vendor:
        data['default_vendor'] = default_vendor
        # Also extract optional vendor details if provided
        vendor_email = str(row.get('vendor_email', '')).strip()
        if vendor_email:
            data['vendor_email'] = vendor_email
        
        vendor_phone = str(row.get('vendor_phone', '')).strip()
        if vendor_phone:
            data['vendor_phone'] = vendor_phone
        
        vendor_contact_info = str(row.get('vendor_contact_info', '')).strip()
        if vendor_contact_info:
            data['vendor_contact_info'] = vendor_contact_info
    
    photo_url = str(row.get('photo_url', '')).strip()
    if photo_url:
        data['photo_url'] = photo_url
    
    unit_of_measure = str(row.get('unit_of_measure', '')).strip() or 'ea'
    data['unit_of_measure'] = unit_of_measure
    
    cost = str(row.get('cost', '')).strip()
    if cost:
        try:
            data['cost'] = Decimal(str(cost))
        except (InvalidOperation, ValueError):
            errors.append(f'Invalid cost value: {cost}')
    
    lead_time_days = str(row.get('lead_time_days', '')).strip()
    if lead_time_days:
        try:
            data['lead_time_days'] = int(lead_time_days)
            if data['lead_time_days'] < 0:
                errors.append('lead_time_days must be >= 0')
        except ValueError:
            errors.append(f'Invalid lead_time_days value: {lead_time_days}')
    else:
        data['lead_time_days'] = 0
    
    is_active = str(row.get('is_active', '')).strip().lower()
    if is_active in ['true', '1', 'yes']:
        data['is_active'] = True
    elif is_active in ['false', '0', 'no']:
        data['is_active'] = False
    else:
        data['is_active'] = True  # Default
    
    # Location fields - always try to extract, even if empty (for preview)
    # Try multiple possible column name variations
    location_name = ''
    for key in ['location_name', 'location', 'locationname', 'loc_name']:
        if key in row:
            location_name = str(row.get(key, '')).strip()
            if location_name:
                break
    
    if location_name:
        data['location_name'] = location_name
        
        location_type = str(row.get('location_type', '')).strip().upper()
        valid_types = ['STOREROOM', 'CLOSET', 'CART', 'ROOM', 'OTHER']
        if location_type in valid_types:
            data['location_type'] = location_type
        else:
            data['location_type'] = 'STOREROOM'  # Default
        
        location_property_id = str(row.get('location_property_id', '')).strip()
        if location_property_id:
            data['location_property_id'] = location_property_id
        
        parent_location_name = str(row.get('parent_location_name', '')).strip()
        if parent_location_name:
            data['parent_location_name'] = parent_location_name
    else:
        # Still add empty location_name for preview display
        data['location_name'] = ''
    
    # Stock fields - try multiple column name variations and always extract for preview
    # Try various possible column names (prioritize common variations like 'qty' and 'min_par')
    on_hand_qty_str = ''
    for key in ['qty', 'quantity', 'on_hand_qty', 'on_hand', 'qty_on_hand', 'onhand_qty', 'stock', 'current_stock']:
        if key in row:
            val = str(row.get(key, '')).strip()
            if val:  # Check if not empty
                on_hand_qty_str = val
                break
    
    par_str = ''
    for key in ['par', 'par_level', 'min_par', 'par_min', 'parmin', 'minimum_par', 'par_minimum', 'min', 'minimum']:
        if key in row:
            val = str(row.get(key, '')).strip()
            if val:  # Check if not empty
                par_str = val
                break
    
    has_location = bool(location_name)
    has_stock_data = any([on_hand_qty_str, par_str])
    
    # Always add stock fields to data for preview (even if empty)
    if has_stock_data and not has_location:
        errors.append('location_name is required when stock fields (on_hand_qty, par) are provided')
    
    # Process on_hand_qty
    if on_hand_qty_str:
        try:
            qty = Decimal(str(on_hand_qty_str))
            if qty < 0:
                errors.append('on_hand_qty must be >= 0')
            else:
                data['on_hand_qty'] = qty
        except (InvalidOperation, ValueError):
            errors.append(f'Invalid on_hand_qty value: {on_hand_qty_str}')
    else:
        # Add empty for preview
        data['on_hand_qty'] = None
    
    # Process par
    if par_str:
        try:
            par_val = Decimal(str(par_str))
            if par_val < 0:
                errors.append('par must be >= 0')
            else:
                data['par'] = par_val
        except (InvalidOperation, ValueError):
            errors.append(f'Invalid par value: {par_str}')
    else:
        # Add empty for preview
        data['par'] = None
    
    return {
        'valid': len(errors) == 0,
        'data': data,
        'errors': errors
    }


def get_or_create_location(location_data, user):
    """Get existing location or create new one"""
    location_name = location_data.get('location_name')
    if not location_name:
        return None, None
    
    # Try to find existing location by name
    location = Location.objects.filter(name=location_name, is_active=True).first()
    
    if location:
        return location, None
    
    # Create new location
    try:
        location = Location.objects.create(
            name=location_name,
            type=location_data.get('location_type', 'STOREROOM'),
            property_id=location_data.get('location_property_id', ''),
            is_active=True
        )
        
        # Handle parent location if specified
        parent_location_name = location_data.get('parent_location_name')
        if parent_location_name:
            parent_location = Location.objects.filter(name=parent_location_name, is_active=True).first()
            if parent_location:
                location.parent_location = parent_location
                location.save()
            else:
                # Create parent location if it doesn't exist
                parent_location = Location.objects.create(
                    name=parent_location_name,
                    type='STOREROOM',
                    is_active=True
                )
                location.parent_location = parent_location
                location.save()
        
        return location, 'created'
    except Exception as e:
        return None, f'Failed to create location: {str(e)}'


def get_or_create_vendor(vendor_name_or_id, vendor_data=None):
    """Get existing vendor or create new one"""
    if not vendor_name_or_id:
        return None, None
    
    # Try as ID first
    vendor = None
    try:
        vendor_id = int(vendor_name_or_id)
        vendor = Vendor.objects.filter(id=vendor_id, is_active=True).first()
    except (ValueError, TypeError):
        pass
    
    # If not found, try as name
    if not vendor:
        vendor = Vendor.objects.filter(name__iexact=vendor_name_or_id, is_active=True).first()
    
    if vendor:
        return vendor, None
    
    # Create new vendor
    try:
        vendor = Vendor.objects.create(
            name=str(vendor_name_or_id),
            contact_info=vendor_data.get('vendor_contact_info', '') if vendor_data else '',
            phone=vendor_data.get('vendor_phone', '') if vendor_data else '',
            email=vendor_data.get('vendor_email', '') if vendor_data else '',
            is_active=True
        )
        return vendor, 'created'
    except Exception as e:
        return None, f'Failed to create vendor: {str(e)}'


@transaction.atomic
def process_import_rows(validated_rows, user):
    """Process validated rows and create/update items, locations, and stock levels"""
    results = {
        'items_created': 0,
        'items_updated': 0,
        'vendors_created': 0,
        'locations_created': 0,
        'stock_levels_created': 0,
        'stock_levels_updated': 0,
        'errors': []
    }
    
    for row_info in validated_rows:
        row_number = row_info['row_number']
        data = row_info['data']
        row_errors = []
        
        try:
            # Get or create category
            category = None
            if 'category' in data:
                category_name_or_id = data['category']
                # Try as ID first
                try:
                    category_id = int(category_name_or_id)
                    category = Category.objects.filter(id=category_id, is_active=True).first()
                except (ValueError, TypeError):
                    pass
                
                # If not found, try as name
                if not category:
                    category = Category.objects.filter(name__iexact=category_name_or_id, is_active=True).first()
            
            # Get or create vendor
            vendor = None
            if 'default_vendor' in data:
                vendor_name_or_id = data['default_vendor']
                vendor, vendor_status = get_or_create_vendor(vendor_name_or_id, data)
                
                if vendor and vendor_status == 'created':
                    results['vendors_created'] += 1
                elif vendor_status and 'Failed' in vendor_status:
                    row_errors.append(f'Vendor creation failed: {vendor_status}')
            
            # Get or create/update item
            item, created = Item.objects.get_or_create(
                short_code=data['short_code'],
                defaults={
                    'name': data['name'],
                    'category': category,
                    'default_vendor': vendor,
                    'photo_url': data.get('photo_url', ''),
                    'unit_of_measure': data.get('unit_of_measure', 'ea'),
                    'cost': data.get('cost'),
                    'lead_time_days': data.get('lead_time_days', 0),
                    'is_active': data.get('is_active', True)
                }
            )
            
            if created:
                results['items_created'] += 1
            else:
                # Update existing item
                item.name = data['name']
                if category:
                    item.category = category
                if vendor:
                    item.default_vendor = vendor
                if 'photo_url' in data:
                    item.photo_url = data.get('photo_url', '')
                item.unit_of_measure = data.get('unit_of_measure', 'ea')
                if 'cost' in data:
                    item.cost = data.get('cost')
                item.lead_time_days = data.get('lead_time_days', 0)
                if 'is_active' in data:
                    item.is_active = data.get('is_active', True)
                item.save()
                results['items_updated'] += 1
            
            # Handle location and stock level if provided
            # Check if we have location_name or stock data
            has_location_name = 'location_name' in data and data.get('location_name')
            has_stock_data = any([
                'on_hand_qty' in data,
                'par' in data
            ])
            
            if has_stock_data and not has_location_name:
                # Stock data provided but no location - error
                row_errors.append('location_name is required when stock fields (on_hand_qty, par) are provided')
            elif has_location_name:
                # Process location and stock (if provided)
                location, location_status = get_or_create_location(data, user)
                
                if location:
                    if location_status == 'created':
                        results['locations_created'] += 1
                    
                    # Create or update stock level (only if stock data is provided)
                    if has_stock_data:
                        # Get stock values, defaulting to 0 if None
                        on_hand = data.get('on_hand_qty')
                        if on_hand is None:
                            on_hand = Decimal('0')
                        par_val = data.get('par')
                        # Support both 'par' and 'par_min' for backward compatibility
                        if par_val is None:
                            par_val = data.get('par_min')
                        if par_val is None:
                            par_val = Decimal('0')
                        
                        stock_level, stock_created = StockLevel.objects.get_or_create(
                            item=item,
                            location=location,
                            defaults={
                                'on_hand_qty': on_hand,
                                'par': par_val
                            }
                        )
                        
                        if stock_created:
                            results['stock_levels_created'] += 1
                        else:
                            # Update existing stock level
                            if 'on_hand_qty' in data and data['on_hand_qty'] is not None:
                                stock_level.on_hand_qty = data['on_hand_qty']
                            if 'par' in data and data['par'] is not None:
                                stock_level.par = data['par']
                            elif 'par_min' in data and data['par_min'] is not None:
                                # Backward compatibility
                                stock_level.par = data['par_min']
                        stock_level.save()
                        results['stock_levels_updated'] += 1
                elif location_status and 'Failed' in location_status:
                    row_errors.append(f'Location creation failed: {location_status}')
            
        except Exception as e:
            row_errors.append(f'Row {row_number}: {str(e)}')
        
        if row_errors:
            results['errors'].append({
                'row_number': row_number,
                'errors': row_errors
            })
    
    return results

