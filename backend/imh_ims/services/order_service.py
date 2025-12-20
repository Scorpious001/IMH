from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Avg, F
from imh_ims.models import Item, StockLevel, InventoryTransaction


class OrderSuggestionService:
    """Service for calculating suggested orders"""

    @staticmethod
    def calculate_avg_daily_usage(item: Item, days: int = 30) -> Decimal:
        """Calculate average daily usage over the last N days"""
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Get all issue transactions in the period
        issues = InventoryTransaction.objects.filter(
            item=item,
            type='ISSUE',
            timestamp__gte=cutoff_date
        )
        
        total_issued = issues.aggregate(total=Sum('qty'))['total'] or Decimal('0')
        return total_issued / Decimal(str(days))

    @staticmethod
    def project_stock_levels(item: Item, location, days_ahead: int = 7) -> dict:
        """Project stock levels N days ahead based on usage"""
        avg_daily_usage = OrderSuggestionService.calculate_avg_daily_usage(item)
        
        try:
            stock = StockLevel.objects.get(item=item, location=location)
            current_qty = stock.on_hand_qty
            par_min = stock.par_min
        except StockLevel.DoesNotExist:
            current_qty = Decimal('0')
            par_min = Decimal('0')

        projected_qty = current_qty - (avg_daily_usage * Decimal(str(days_ahead)))
        
        return {
            'current_qty': current_qty,
            'projected_qty': projected_qty,
            'avg_daily_usage': avg_daily_usage,
            'days_until_below_par': None if par_min == 0 else int((current_qty - par_min) / avg_daily_usage) if avg_daily_usage > 0 else None,
            'will_go_below_par': projected_qty < par_min if par_min > 0 else False
        }

    @staticmethod
    def calculate_suggested_orders(vendor=None, lead_time_buffer_days: int = 3) -> list:
        """Calculate suggested order quantities for items"""
        items = Item.objects.filter(is_active=True)
        if vendor:
            items = items.filter(default_vendor=vendor)

        suggestions = []
        
        for item in items:
            # Get stock levels for this item
            stock_levels = StockLevel.objects.filter(item=item)
            
            for stock in stock_levels:
                if stock.par_min == 0:
                    continue  # Skip items without par levels
                
                avg_daily_usage = OrderSuggestionService.calculate_avg_daily_usage(item)
                lead_time_days = item.lead_time_days + lead_time_buffer_days
                
                # Calculate projected usage during lead time
                projected_usage = avg_daily_usage * Decimal(str(lead_time_days))
                
                # Calculate how much we'll have when order arrives
                projected_on_hand = stock.on_hand_qty - projected_usage
                
                # If projected to go below par, suggest order
                if projected_on_hand < stock.par_min:
                    # Order enough to bring back to par_max
                    order_qty = stock.par_max - projected_on_hand
                    
                    if order_qty > 0:
                        suggestions.append({
                            'item': item,
                            'location': stock.location,
                            'current_on_hand': stock.on_hand_qty,
                            'par_min': stock.par_min,
                            'par_max': stock.par_max,
                            'avg_daily_usage': avg_daily_usage,
                            'lead_time_days': lead_time_days,
                            'projected_on_hand': projected_on_hand,
                            'suggested_order_qty': order_qty,
                            'days_until_below_par': int((stock.on_hand_qty - stock.par_min) / avg_daily_usage) if avg_daily_usage > 0 else None
                        })

        return suggestions

