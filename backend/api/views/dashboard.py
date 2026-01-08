from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta
from imh_ims.models import InventoryTransaction, Item, StockLevel
from api.permissions import create_permission_class


class DashboardStatsView(APIView):
    """Get dashboard statistics including top 5 items used and overall inventory usage"""
    permission_classes = [IsAuthenticated, create_permission_class('reports', 'view')]
    
    def get(self, request):
        # Get date range (default: last 30 days)
        days = int(request.query_params.get('days', 30))
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Filter by department if user has one
        user = request.user
        department = None
        if hasattr(user, 'profile') and user.profile.department:
            department = user.profile.department
        
        # TOP 5 ITEMS USED (by quantity issued)
        # Get all ISSUE transactions in the period
        issue_transactions = InventoryTransaction.objects.filter(
            type='ISSUE',
            timestamp__gte=cutoff_date
        ).select_related('item')
        
        # Aggregate by item to get total quantity issued
        top_items = issue_transactions.values(
            'item_id',
            'item__name',
            'item__short_code',
            'item__photo_url',
            'item__unit_of_measure'
        ).annotate(
            total_qty_used=Sum('qty'),
            transaction_count=Count('id')
        ).order_by('-total_qty_used')[:5]
        
        # Format top 5 items
        top_5_items = []
        for item_data in top_items:
            top_5_items.append({
                'item_id': item_data['item_id'],
                'item_name': item_data['item__name'],
                'item_short_code': item_data['item__short_code'],
                'item_photo_url': item_data['item__photo_url'] or '',
                'unit_of_measure': item_data['item__unit_of_measure'],
                'total_qty_used': float(item_data['total_qty_used'] or 0),
                'transaction_count': item_data['transaction_count']
            })
        
        # OVERALL INVENTORY USAGE
        # Total quantity issued across all items
        total_inventory_used = issue_transactions.aggregate(
            total_qty=Sum('qty')
        )['total_qty'] or 0
        
        # Total number of unique items used
        unique_items_used = issue_transactions.values('item_id').distinct().count()
        
        # Total number of transactions
        total_transactions = issue_transactions.count()
        
        # Average quantity per transaction
        avg_qty_per_transaction = float(total_inventory_used) / total_transactions if total_transactions > 0 else 0
        
        # Current total inventory value (sum of all stock levels * item cost)
        # Get all active items with stock
        current_inventory_items = StockLevel.objects.filter(
            item__is_active=True,
            on_hand_qty__gt=0
        ).select_related('item')
        
        total_inventory_value = 0
        total_items_in_stock = 0
        for stock in current_inventory_items:
            if stock.item.cost:
                total_inventory_value += float(stock.item.cost) * float(stock.on_hand_qty)
            total_items_in_stock += 1
        
        # Items below par count
        items_below_par = StockLevel.objects.filter(
            on_hand_qty__lt=F('par'),
            par__gt=0,
            item__is_active=True
        ).count()
        
        # Summary stats
        overall_inventory_usage = {
            'total_qty_used': float(total_inventory_used),
            'unique_items_used': unique_items_used,
            'total_transactions': total_transactions,
            'avg_qty_per_transaction': round(avg_qty_per_transaction, 2),
            'current_inventory_value': round(total_inventory_value, 2),
            'total_items_in_stock': total_items_in_stock,
            'items_below_par': items_below_par,
            'period_days': days
        }
        
        return Response({
            'top_5_items_used': top_5_items,
            'overall_inventory_usage': overall_inventory_usage,
            'department_filter': department.name if department else None
        })
