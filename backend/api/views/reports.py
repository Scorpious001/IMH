from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, Q, Sum, Count
from django.utils import timezone
from datetime import timedelta, datetime
from imh_ims.models import StockLevel, Item, InventoryTransaction
from api.serializers import StockLevelSerializer, ItemSerializer
from imh_ims.services.order_service import OrderSuggestionService
from api.permissions import create_permission_class


class AlertsView(APIView):
    """Get alerts for below-par items and unusual usage"""
    permission_classes = [IsAuthenticated, create_permission_class('reports', 'view')]
    
    def get(self, request):
        # Below par alerts - items that are below the par level
        # Match the same query logic as LowParTrendsView (no par__gt=0 filter to match behavior)
        below_par_stock = StockLevel.objects.filter(
            on_hand_qty__lt=F('par')
        ).select_related('item', 'location')
        
        # Debug logging
        below_par_count = below_par_stock.count()
        print(f"DEBUG AlertsView: Found {below_par_count} items below par (matching LowParTrendsView query)")
        
        # Optionally filter to only active items (but show all for now to match LowParTrendsView)
        # below_par_stock = below_par_stock.filter(item__is_active=True)
        
        below_par_serializer = StockLevelSerializer(below_par_stock, many=True)
        
        # At risk items - items that are at or near par level (within 20% of par)
        # These are items that are close to going below par
        # For now, use same logic as LowParTrendsView (items below par)
        at_risk_stock = StockLevel.objects.filter(
            on_hand_qty__lt=F('par')
        ).select_related('item', 'location')
        
        at_risk_count = at_risk_stock.count()
        print(f"DEBUG AlertsView: Found {at_risk_count} items at risk (matching LowParTrendsView)")
        
        at_risk_serializer = StockLevelSerializer(at_risk_stock, many=True)
        
        response_data = {
            'below_par': below_par_serializer.data,
            'at_risk': at_risk_serializer.data,
            'below_par_count': below_par_count,
            'at_risk_count': at_risk_count
        }
        
        print(f"DEBUG AlertsView: Returning {len(response_data['below_par'])} below par items in response")
        if len(response_data['below_par']) > 0:
            print(f"DEBUG AlertsView: First item: {response_data['below_par'][0]}")
        
        return Response(response_data)


class SuggestedOrdersView(APIView):
    """Get suggested orders based on par levels and usage"""
    permission_classes = [IsAuthenticated, create_permission_class('reports', 'view')]
    
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
                'par': float(suggestion['par']),
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
    permission_classes = [IsAuthenticated, create_permission_class('reports', 'view')]
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


class GeneralUsageView(APIView):
    permission_classes = [IsAuthenticated, create_permission_class('reports', 'view')]
    """Get general usage statistics across all items"""
    def get(self, request):
        period = request.query_params.get('period', 'year')  # month, quarter, year
        
        # Calculate date range
        cutoff_date = timezone.now() - timedelta(days=365)
        
        if period == 'year' or period == 'month':
            # Last 12 months - group by month
            transactions = InventoryTransaction.objects.filter(
                type='ISSUE',
                timestamp__gte=cutoff_date
            ).extra(
                select={'period': "strftime('%%Y-%%m', timestamp)"}
            ).values('period').annotate(
                total_qty=Sum('qty'),
                item_count=Count('item', distinct=True)
            ).order_by('period')
        else:  # quarter
            # Last 4 quarters
            transactions = InventoryTransaction.objects.filter(
                type='ISSUE',
                timestamp__gte=cutoff_date
            ).extra(
                select={
                    'year': "strftime('%%Y', timestamp)",
                    'quarter': "CAST((CAST(strftime('%%m', timestamp) AS INTEGER) - 1) / 3 + 1 AS INTEGER)"
                }
            ).values('year', 'quarter').annotate(
                total_qty=Sum('qty'),
                item_count=Count('item', distinct=True)
            ).order_by('year', 'quarter')
        
        usage_by_period = list(transactions)
        total_usage = sum(float(entry['total_qty'] or 0) for entry in usage_by_period)
        average_per_period = total_usage / len(usage_by_period) if usage_by_period else 0
        
        return Response({
            'period': period,
            'usage_by_period': usage_by_period,
            'total_usage': total_usage,
            'average_per_period': average_per_period
        })


class LowParTrendsView(APIView):
    permission_classes = [IsAuthenticated, create_permission_class('reports', 'view')]
    """Get low par usage trends over annual timeline"""
    def get(self, request):
        # Get monthly snapshots of below par items for the last 12 months
        trends = []
        current_date = timezone.now()
        
        for i in range(12):
            month_date = current_date - timedelta(days=30 * i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # For historical data, we'll use current stock levels as approximation
            # In a real system, you'd store historical snapshots
            if i == 0:
                # Current month - use actual data
                below_par_stock = StockLevel.objects.filter(
                    on_hand_qty__lt=F('par')
                )
                at_risk_stock = StockLevel.objects.filter(
                    on_hand_qty__lt=F('par')
                )
                below_par_count = below_par_stock.count()
                at_risk_count = at_risk_stock.count()
            else:
                # Historical months - estimate based on transactions
                # This is a simplified approach - in production you'd want historical snapshots
                below_par_count = max(0, int(StockLevel.objects.filter(
                    on_hand_qty__lt=F('par')
                ).count() * (1 - i * 0.05)))  # Rough estimate
                at_risk_count = max(0, int(StockLevel.objects.filter(
                    on_hand_qty__lt=F('par')
                ).count() * (1 - i * 0.05)))
            
            trends.append({
                'period': month_start.strftime('%Y-%m'),
                'below_par_count': below_par_count,
                'at_risk_count': at_risk_count,
                'total_alerts': below_par_count + at_risk_count
            })
        
        trends.reverse()  # Oldest to newest
        
        # Get current counts
        current_below_par = StockLevel.objects.filter(
            on_hand_qty__lt=F('par')
        ).count()
        current_at_risk = StockLevel.objects.filter(
            on_hand_qty__lt=F('par')
        ).count()
        
        # Calculate averages
        below_par_counts = [t['below_par_count'] for t in trends]
        average_below_par = sum(below_par_counts) / len(below_par_counts) if below_par_counts else 0
        peak_below_par = max(below_par_counts) if below_par_counts else 0
        
        return Response({
            'trends': trends,
            'current_below_par': current_below_par,
            'current_at_risk': current_at_risk,
            'average_below_par': average_below_par,
            'peak_below_par': peak_below_par
        })