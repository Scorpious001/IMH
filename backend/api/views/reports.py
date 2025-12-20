from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import F, Q
from imh_ims.models import StockLevel, Item
from api.serializers import StockLevelSerializer, ItemSerializer
from imh_ims.services.order_service import OrderSuggestionService


class AlertsView(APIView):
    """Get alerts for below-par items and unusual usage"""
    def get(self, request):
        # Below par alerts
        below_par_stock = StockLevel.objects.filter(
            on_hand_qty__lt=F('par_min')
        ).select_related('item', 'location')
        
        below_par_serializer = StockLevelSerializer(below_par_stock, many=True)
        
        # At risk items (near reorder trigger)
        at_risk_stock = StockLevel.objects.filter(
            on_hand_qty__gte=F('par_min'),
            on_hand_qty__lt=F('par_min') * 1.2
        ).select_related('item', 'location')
        
        at_risk_serializer = StockLevelSerializer(at_risk_stock, many=True)
        
        return Response({
            'below_par': below_par_serializer.data,
            'at_risk': at_risk_serializer.data,
            'below_par_count': below_par_stock.count(),
            'at_risk_count': at_risk_stock.count()
        })


class SuggestedOrdersView(APIView):
    """Get suggested orders based on par levels and usage"""
    def get(self, request):
        vendor_id = request.query_params.get('vendor_id', None)
        
        suggestions = OrderSuggestionService.calculate_suggested_orders(
            vendor=vendor_id
        )
        
        # Format suggestions for response
        formatted_suggestions = []
        for suggestion in suggestions:
            formatted_suggestions.append({
                'item_id': suggestion['item'].id,
                'item_name': suggestion['item'].name,
                'item_short_code': suggestion['item'].short_code,
                'location_id': suggestion['location'].id,
                'location_name': suggestion['location'].name,
                'current_on_hand': float(suggestion['current_on_hand']),
                'par_min': float(suggestion['par_min']),
                'par_max': float(suggestion['par_max']),
                'avg_daily_usage': float(suggestion['avg_daily_usage']),
                'lead_time_days': suggestion['lead_time_days'],
                'projected_on_hand': float(suggestion['projected_on_hand']),
                'suggested_order_qty': float(suggestion['suggested_order_qty']),
                'days_until_below_par': suggestion['days_until_below_par']
            })
        
        return Response({
            'suggestions': formatted_suggestions,
            'count': len(formatted_suggestions)
        })


class UsageTrendsView(APIView):
    """Get usage trends and analytics"""
    def get(self, request):
        item_id = request.query_params.get('item_id')
        days = int(request.query_params.get('days', 30))
        
        if not item_id:
            return Response(
                {'error': 'item_id parameter required'},
                status=400
            )
        
        try:
            item = Item.objects.get(id=item_id)
        except Item.DoesNotExist:
            return Response(
                {'error': 'Item not found'},
                status=404
            )
        
        # This would typically use the usage endpoint from ItemViewSet
        # For now, return basic structure
        return Response({
            'item_id': item.id,
            'item_name': item.name,
            'period_days': days,
            'message': 'Use /api/items/{id}/usage/ endpoint for detailed usage data'
        })

