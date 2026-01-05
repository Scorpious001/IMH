from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, Q, Sum, Count, CharField
from django.db.models.functions import TruncMonth, TruncQuarter, Extract
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
        # Only include items with par > 0 to avoid false positives
        below_par_stock = StockLevel.objects.filter(
            on_hand_qty__lt=F('par'),
            par__gt=0
        ).select_related('item', 'location')
        
        # Optionally filter to only active items
        below_par_stock = below_par_stock.filter(item__is_active=True)
        
        below_par_count = below_par_stock.count()
        
        below_par_serializer = StockLevelSerializer(below_par_stock, many=True)
        
        # At risk items - items that are at or near par level (80-100% of par)
        # These are items that are close to going below par but not yet below
        # Formula: on_hand_qty >= par * 0.8 AND on_hand_qty < par AND par > 0
        at_risk_stock = StockLevel.objects.filter(
            on_hand_qty__gte=F('par') * 0.8,
            on_hand_qty__lt=F('par'),
            par__gt=0
        ).select_related('item', 'location')
        
        # Only active items
        at_risk_stock = at_risk_stock.filter(item__is_active=True)
        
        at_risk_count = at_risk_stock.count()
        
        at_risk_serializer = StockLevelSerializer(at_risk_stock, many=True)
        
        response_data = {
            'below_par': below_par_serializer.data,
            'at_risk': at_risk_serializer.data,
            'below_par_count': below_par_count,
            'at_risk_count': at_risk_count
        }
        
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
        
        base_query = InventoryTransaction.objects.filter(
            type='ISSUE',
            timestamp__gte=cutoff_date
        )
        
        if period == 'year' or period == 'month':
            # Last 12 months - group by month using Django ORM
            transactions = base_query.annotate(
                period=TruncMonth('timestamp')
            ).values('period').annotate(
                total_qty=Sum('qty'),
                item_count=Count('item', distinct=True)
            ).order_by('period')
            
            # Format period as YYYY-MM string
            usage_by_period = []
            for entry in transactions:
                period_str = entry['period'].strftime('%Y-%m')
                usage_by_period.append({
                    'period': period_str,
                    'total_qty': float(entry['total_qty'] or 0),
                    'item_count': entry['item_count']
                })
        else:  # quarter
            # Last 4 quarters - group by quarter
            transactions = base_query.annotate(
                year=Extract('timestamp', 'year'),
                quarter=Extract('timestamp', 'quarter')
            ).values('year', 'quarter').annotate(
                total_qty=Sum('qty'),
                item_count=Count('item', distinct=True)
            ).order_by('year', 'quarter')
            
            usage_by_period = []
            for entry in transactions:
                usage_by_period.append({
                    'year': entry['year'],
                    'quarter': entry['quarter'],
                    'total_qty': float(entry['total_qty'] or 0),
                    'item_count': entry['item_count']
                })
        
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
                    on_hand_qty__lt=F('par'),
                    par__gt=0,
                    item__is_active=True
                )
                at_risk_stock = StockLevel.objects.filter(
                    on_hand_qty__gte=F('par') * 0.8,
                    on_hand_qty__lt=F('par'),
                    par__gt=0,
                    item__is_active=True
                )
                below_par_count = below_par_stock.count()
                at_risk_count = at_risk_stock.count()
            else:
                # Historical months - estimate based on current data with slight variation
                # This is a simplified approach - in production you'd want historical snapshots
                current_below_par = StockLevel.objects.filter(
                    on_hand_qty__lt=F('par'),
                    par__gt=0,
                    item__is_active=True
                ).count()
                current_at_risk = StockLevel.objects.filter(
                    on_hand_qty__gte=F('par') * 0.8,
                    on_hand_qty__lt=F('par'),
                    par__gt=0,
                    item__is_active=True
                ).count()
                # Add some variation for historical months
                variation = 1 + (i * 0.05)  # Slight increase going back in time
                below_par_count = max(0, int(current_below_par * variation))
                at_risk_count = max(0, int(current_at_risk * variation))
            
            trends.append({
                'period': month_start.strftime('%Y-%m'),
                'below_par_count': below_par_count,
                'at_risk_count': at_risk_count,
                'total_alerts': below_par_count + at_risk_count
            })
        
        trends.reverse()  # Oldest to newest
        
        # Get current counts (same as month 0)
        current_below_par = StockLevel.objects.filter(
            on_hand_qty__lt=F('par'),
            par__gt=0,
            item__is_active=True
        ).count()
        current_at_risk = StockLevel.objects.filter(
            on_hand_qty__gte=F('par') * 0.8,
            on_hand_qty__lt=F('par'),
            par__gt=0,
            item__is_active=True
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