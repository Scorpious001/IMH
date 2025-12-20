from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal
from imh_ims.models import Category, Vendor, StockLevel, Item, Location
from api.serializers import CategorySerializer, VendorSerializer


class CategoriesViewSet(viewsets.ModelViewSet):
    """ViewSet for Category management"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class VendorsViewSet(viewsets.ModelViewSet):
    """ViewSet for Vendor management"""
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer


class ParLevelsView(APIView):
    """Bulk par level management"""
    def post(self, request):
        """Bulk update par levels"""
        updates = request.data.get('updates', [])
        
        updated = []
        errors = []
        
        for update in updates:
            item_id = update.get('item_id')
            location_id = update.get('location_id')
            par_min = update.get('par_min')
            par_max = update.get('par_max')
            
            try:
                stock, created = StockLevel.objects.get_or_create(
                    item_id=item_id,
                    location_id=location_id,
                    defaults={
                        'on_hand_qty': 0,
                        'par_min': Decimal(str(par_min)) if par_min else 0,
                        'par_max': Decimal(str(par_max)) if par_max else 0
                    }
                )
                
                if not created:
                    if par_min is not None:
                        stock.par_min = Decimal(str(par_min))
                    if par_max is not None:
                        stock.par_max = Decimal(str(par_max))
                    stock.save()
                
                updated.append({
                    'item_id': item_id,
                    'location_id': location_id,
                    'par_min': float(stock.par_min),
                    'par_max': float(stock.par_max)
                })
            except Exception as e:
                errors.append({
                    'item_id': item_id,
                    'location_id': location_id,
                    'error': str(e)
                })
        
        return Response({
            'updated': updated,
            'errors': errors,
            'updated_count': len(updated),
            'error_count': len(errors)
        })

