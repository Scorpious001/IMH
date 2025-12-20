from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum, F
from datetime import timedelta
from django.utils import timezone
from imh_ims.models import Item, StockLevel, InventoryTransaction
from api.serializers import ItemSerializer
from imh_ims.services.stock_service import StockService


class ItemViewSet(viewsets.ModelViewSet):
    """ViewSet for Item operations"""
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

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
                on_hand_qty__lt=F('par_min')
            ).values_list('item_id', flat=True).distinct()
            queryset = queryset.filter(id__in=item_ids)
        
        if critical == 'true':
            # Items that are below par and have low stock
            item_ids = StockLevel.objects.filter(
                on_hand_qty__lt=F('par_min')
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
        stock_levels = StockLevel.objects.filter(item=item).select_related('location')
        
        from api.serializers import StockLevelSerializer
        serializer = StockLevelSerializer(stock_levels, many=True)
        
        return Response({
            'item_id': item.id,
            'item_name': item.name,
            'global_on_hand': StockService.get_global_on_hand(item),
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

