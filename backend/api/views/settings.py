from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from imh_ims.models import Category, Vendor, StockLevel, Item, Location
from api.serializers import CategorySerializer, VendorSerializer
from api.permissions import create_permission_class


class CategoriesViewSet(viewsets.ModelViewSet):
    """ViewSet for Category management"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]  # Settings remain admin-only via role check
    
    def create(self, request, *args, **kwargs):
        """Override create to provide better error handling"""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            error_detail = str(e)
            traceback_str = traceback.format_exc()
            print(f"Error creating category: {error_detail}")
            print(f"Traceback: {traceback_str}")
            return Response(
                {'error': error_detail, 'detail': 'Failed to create category. Please check the server logs for details.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VendorsViewSet(viewsets.ModelViewSet):
    """ViewSet for Vendor management"""
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Apply permission checks based on action"""
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [IsAuthenticated, create_permission_class('vendors', 'view')]
        elif self.action == 'create':
            self.permission_classes = [IsAuthenticated, create_permission_class('vendors', 'create')]
        elif self.action in ['update', 'partial_update']:
            self.permission_classes = [IsAuthenticated, create_permission_class('vendors', 'edit')]
        elif self.action == 'destroy':
            self.permission_classes = [IsAuthenticated, create_permission_class('vendors', 'delete')]
        return super().get_permissions()


class ParLevelsView(APIView):
    """Bulk par level management"""
    permission_classes = [IsAuthenticated, create_permission_class('par', 'edit')]
    
    def post(self, request):
        """Bulk update par levels"""
        updates = request.data.get('updates', [])
        
        if not updates:
            return Response(
                {'error': 'No updates provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated = []
        errors = []
        
        for update in updates:
            item_id = update.get('item_id')
            location_id = update.get('location_id')
            par = update.get('par') or update.get('par_min')  # Support both for backward compatibility
            
            if item_id is None or location_id is None:
                errors.append({
                    'item_id': item_id,
                    'location_id': location_id,
                    'error': 'item_id and location_id are required'
                })
                continue
            
            try:
                # Get or create stock level
                stock, created = StockLevel.objects.get_or_create(
                    item_id=item_id,
                    location_id=location_id,
                    defaults={
                        'on_hand_qty': 0,
                        'par': Decimal('0')
                    }
                )
                
                # Update par level (always update, even if 0)
                updated_par = False
                if par is not None:
                    stock.par = Decimal(str(par))
                    updated_par = True
                
                # Save if we updated par level or if it was just created
                if updated_par or created:
                    stock.save()
                
                updated.append({
                    'item_id': item_id,
                    'location_id': location_id,
                    'par': float(stock.par)
                })
            except Exception as e:
                import traceback
                error_detail = str(e)
                traceback_str = traceback.format_exc()
                print(f"Error updating par level: {error_detail}")
                print(f"Traceback: {traceback_str}")
                errors.append({
                    'item_id': item_id,
                    'location_id': location_id,
                    'error': error_detail
                })
        
        # Return appropriate status code based on errors
        if errors and not updated:
            # All updates failed
            return Response({
                'updated': updated,
                'errors': errors,
                'updated_count': len(updated),
                'error_count': len(errors)
            }, status=status.HTTP_400_BAD_REQUEST)
        elif errors:
            # Some updates failed, but some succeeded
            return Response({
                'updated': updated,
                'errors': errors,
                'updated_count': len(updated),
                'error_count': len(errors)
            }, status=status.HTTP_207_MULTI_STATUS)
        
        # All updates succeeded
        return Response({
            'updated': updated,
            'errors': errors,
            'updated_count': len(updated),
            'error_count': len(errors)
        }, status=status.HTTP_200_OK)


class CategoryParLevelsView(APIView):
    """Category par level management"""
    permission_classes = [IsAuthenticated]

    def get(self, request, category_id):
        """Get par levels for a category"""
        try:
            category = Category.objects.get(id=category_id)
            return Response({
                'category_id': category.id,
                'category_name': category.name,
                'par_min': float(category.par_min) if category.par_min else None,
                'par_max': float(category.par_max) if category.par_max else None,
            })
        except Category.DoesNotExist:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request, category_id):
        """Update par levels for a category"""
        try:
            category = Category.objects.get(id=category_id)
            par_min = request.data.get('par_min')
            par_max = request.data.get('par_max')

            if par_min is not None:
                category.par_min = Decimal(str(par_min)) if par_min else None
            if par_max is not None:
                category.par_max = Decimal(str(par_max)) if par_max else None

            if category.par_min and category.par_max and category.par_min > category.par_max:
                return Response(
                    {'error': 'par_min cannot be greater than par_max'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            category.save()
            return Response({
                'category_id': category.id,
                'category_name': category.name,
                'par_min': float(category.par_min) if category.par_min else None,
                'par_max': float(category.par_max) if category.par_max else None,
            })
        except Category.DoesNotExist:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class BulkApplyCategoryParLevelsView(APIView):
    """Bulk apply category par levels to all items in the category"""
    permission_classes = [IsAuthenticated]

    def post(self, request, category_id):
        """Apply category par levels to all items in the category"""
        try:
            category = Category.objects.get(id=category_id)
            
            if not category.par_min and not category.par_max:
                return Response(
                    {'error': 'Category does not have par levels set'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get all items in this category
            items = Item.objects.filter(category=category, is_active=True)
            
            # Get all locations
            locations = Location.objects.filter(is_active=True)
            
            updated = []
            errors = []
            
            for item in items:
                for location in locations:
                    try:
                        stock, created = StockLevel.objects.get_or_create(
                            item=item,
                            location=location,
                            defaults={
                                'on_hand_qty': 0,
                                'par_min': category.par_min or Decimal('0'),
                                'par_max': category.par_max or Decimal('0')
                            }
                        )
                        
                        if not created:
                            if category.par_min is not None:
                                stock.par_min = category.par_min
                            if category.par_max is not None:
                                stock.par_max = category.par_max
                            stock.save()
                        
                        updated.append({
                            'item_id': item.id,
                            'item_name': item.name,
                            'location_id': location.id,
                            'location_name': location.name,
                        })
                    except Exception as e:
                        errors.append({
                            'item_id': item.id,
                            'item_name': item.name,
                            'location_id': location.id,
                            'location_name': location.name,
                            'error': str(e)
                        })
            
            return Response({
                'category_id': category.id,
                'category_name': category.name,
                'par_min': float(category.par_min) if category.par_min else None,
                'par_max': float(category.par_max) if category.par_max else None,
                'items_updated': len(updated),
                'errors': errors,
                'updated_count': len(updated),
                'error_count': len(errors),
                'updated': updated[:100],  # Limit response size
            })
        except Category.DoesNotExist:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
