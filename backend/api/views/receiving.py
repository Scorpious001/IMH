from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from imh_ims.models import Item, Location, Vendor, InventoryTransaction
from api.serializers import InventoryTransactionSerializer
from imh_ims.services.stock_service import StockService
from api.permissions import create_permission_class


class ReceiveView(APIView):
    """Receive items into inventory"""
    permission_classes = [IsAuthenticated, create_permission_class('receiving', 'create')]
    
    def post(self, request):
        item_id = request.data.get('item_id')
        to_location_id = request.data.get('to_location_id')
        qty = Decimal(str(request.data.get('qty')))
        cost = request.data.get('cost')
        vendor_id = request.data.get('vendor_id')
        po_number = request.data.get('po_number', '')
        notes = request.data.get('notes', '')
        
        try:
            item = Item.objects.get(id=item_id)
            to_location = Location.objects.get(id=to_location_id)
        except (Item.DoesNotExist, Location.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        
        cost_decimal = Decimal(str(cost)) if cost else None
        
        try:
            transaction = StockService.receive_stock(
                item=item,
                to_location=to_location,
                qty=qty,
                user=request.user,
                cost=cost_decimal,
                notes=notes,
                receipt_id=po_number
            )
            serializer = InventoryTransactionSerializer(transaction)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ReceivingHistoryView(APIView):
    """Get receiving history"""
    permission_classes = [IsAuthenticated, create_permission_class('receiving', 'view')]
    
    def get(self, request):
        from imh_ims.models import InventoryTransaction
        
        transactions = InventoryTransaction.objects.filter(
            type='RECEIVE'
        ).order_by('-timestamp')[:100]  # Last 100 receipts
        
        serializer = InventoryTransactionSerializer(transactions, many=True)
        return Response(serializer.data)

