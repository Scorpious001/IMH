from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from imh_ims.models import Location, StockLevel
from api.serializers import LocationSerializer, StockLevelSerializer


class LocationViewSet(viewsets.ModelViewSet):
    """ViewSet for Location operations"""
    queryset = Location.objects.filter(is_active=True)
    serializer_class = LocationSerializer

    def get_queryset(self):
        queryset = Location.objects.filter(is_active=True)
        # Can add filters here if needed
        return queryset.order_by('name')

    @action(detail=True, methods=['get'])
    def stock(self, request, pk=None):
        """Get all stock at this location"""
        location = self.get_object()
        stock_levels = StockLevel.objects.filter(location=location).select_related('item')
        
        serializer = StockLevelSerializer(stock_levels, many=True)
        
        # Calculate summary
        below_par_count = sum(1 for s in stock_levels if s.is_below_par)
        
        return Response({
            'location_id': location.id,
            'location_name': location.name,
            'total_items': stock_levels.count(),
            'below_par_count': below_par_count,
            'stock': serializer.data
        })

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get hierarchical tree of locations"""
        root_locations = Location.objects.filter(
            parent_location__isnull=True,
            is_active=True
        )
        
        def build_tree(location):
            children = Location.objects.filter(
                parent_location=location,
                is_active=True
            )
            return {
                'id': location.id,
                'name': location.name,
                'type': location.type,
                'property_id': location.property_id or '',
                'parent_location': location.parent_location_id,
                'floorplan_id': location.floorplan_id or '',
                'coordinates': location.coordinates or '',
                'is_active': location.is_active,
                'child_locations': [build_tree(child) for child in children],
                'created_at': location.created_at.isoformat() if location.created_at else '',
                'updated_at': location.updated_at.isoformat() if location.updated_at else ''
            }
        
        tree = [build_tree(loc) for loc in root_locations]
        return Response(tree)

