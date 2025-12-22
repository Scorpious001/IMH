from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from imh_ims.models import StockLevel, Item, Location
from api.serializers import StockLevelSerializer, InventoryTransactionSerializer
from imh_ims.services.stock_service import StockService
from api.permissions import create_permission_class


class StockViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing stock levels"""
    queryset = StockLevel.objects.all()
    serializer_class = StockLevelSerializer
    permission_classes = [IsAuthenticated, create_permission_class('stock', 'view')]

    def get_queryset(self):
        queryset = StockLevel.objects.all()
        
        item_id = self.request.query_params.get('item_id', None)
        location_id = self.request.query_params.get('location_id', None)
        
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        
        return queryset

    @action(detail=False, methods=['get'])
    def by_item(self, request):
        """Get stock for an item across all locations"""
        item_id = request.query_params.get('item_id')
        if not item_id:
            return Response(
                {'error': 'item_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            item = Item.objects.get(id=item_id)
        except Item.DoesNotExist:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        stock_levels = StockLevel.objects.filter(item=item)
        serializer = StockLevelSerializer(stock_levels, many=True)
        
        return Response({
            'item_id': item.id,
            'item_name': item.name,
            'global_on_hand': StockService.get_global_on_hand(item),
            'stock_by_location': serializer.data
        })


class StockTransferView(APIView):
    """Transfer stock between locations"""
    permission_classes = [IsAuthenticated, create_permission_class('stock', 'edit')]
    
    def post(self, request):
        item_id = request.data.get('item_id')
        from_location_id = request.data.get('from_location_id')
        to_location_id = request.data.get('to_location_id')
        qty = Decimal(str(request.data.get('qty')))
        notes = request.data.get('notes', '')
        
        try:
            item = Item.objects.get(id=item_id)
            from_location = Location.objects.get(id=from_location_id)
            to_location = Location.objects.get(id=to_location_id)
        except (Item.DoesNotExist, Location.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            transaction = StockService.transfer_stock(
                item=item,
                from_location=from_location,
                to_location=to_location,
                qty=qty,
                user=request.user,
                notes=notes
            )
            serializer = InventoryTransactionSerializer(transaction)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class StockIssueView(APIView):
    """Issue stock from a location"""
    permission_classes = [IsAuthenticated, create_permission_class('stock', 'edit')]
    
    def post(self, request):
        item_id = request.data.get('item_id')
        from_location_id = request.data.get('from_location_id')
        qty = Decimal(str(request.data.get('qty')))
        notes = request.data.get('notes', '')
        work_order_id = request.data.get('work_order_id', '')
        
        try:
            item = Item.objects.get(id=item_id)
            from_location = Location.objects.get(id=from_location_id)
        except (Item.DoesNotExist, Location.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            transaction = StockService.issue_stock(
                item=item,
                from_location=from_location,
                qty=qty,
                user=request.user,
                notes=notes,
                work_order_id=work_order_id
            )
            serializer = InventoryTransactionSerializer(transaction)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class StockAdjustView(APIView):
    """Manually adjust stock level"""
    permission_classes = [IsAuthenticated, create_permission_class('stock', 'edit')]
    
    def post(self, request):
        item_id = request.data.get('item_id')
        location_id = request.data.get('location_id')
        qty = Decimal(str(request.data.get('qty')))
        notes = request.data.get('notes', '')
        reason = request.data.get('reason', '')
        
        try:
            item = Item.objects.get(id=item_id)
            location = Location.objects.get(id=location_id)
        except (Item.DoesNotExist, Location.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            transaction = StockService.adjust_stock(
                item=item,
                location=location,
                qty=qty,
                user=request.user,
                notes=notes,
                reason=reason
            )
            serializer = InventoryTransactionSerializer(transaction)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

