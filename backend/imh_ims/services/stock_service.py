from decimal import Decimal
from django.db import transaction, models
from django.utils import timezone
from imh_ims.models import StockLevel, InventoryTransaction, Item, Location


class StockService:
    """Service for stock operations and calculations"""

    @staticmethod
    def get_global_on_hand(item: Item) -> Decimal:
        """Calculate total on-hand quantity across all locations"""
        return sum(
            stock.on_hand_qty for stock in StockLevel.objects.filter(item=item)
        )

    @staticmethod
    def check_par_levels(item: Item = None, location: Location = None):
        """Check if items are below par levels"""
        queryset = StockLevel.objects.all()
        
        if item:
            queryset = queryset.filter(item=item)
        if location:
            queryset = queryset.filter(location=location)
        
        return {
            'below_par': queryset.filter(on_hand_qty__lt=models.F('par_min')),
            'at_risk': queryset.filter(
                on_hand_qty__gte=models.F('par_min'),
                on_hand_qty__lt=models.F('par_min') * Decimal('1.2')
            ),
            'above_par': queryset.filter(on_hand_qty__gte=models.F('par_max'))
        }

    @staticmethod
    @transaction.atomic
    def transfer_stock(
        item: Item,
        from_location: Location,
        to_location: Location,
        qty: Decimal,
        user,
        notes: str = '',
        requisition=None
    ) -> InventoryTransaction:
        """Transfer stock between locations"""
        # Get or create stock levels
        from_stock, _ = StockLevel.objects.get_or_create(
            item=item,
            location=from_location,
            defaults={'on_hand_qty': 0, 'par_min': 0, 'par_max': 0}
        )
        to_stock, _ = StockLevel.objects.get_or_create(
            item=item,
            location=to_location,
            defaults={'on_hand_qty': 0, 'par_min': 0, 'par_max': 0}
        )

        # Validate available quantity
        if from_stock.available_qty < qty:
            raise ValueError(f"Insufficient stock. Available: {from_stock.available_qty}, Requested: {qty}")

        # Update stock levels
        from_stock.on_hand_qty -= qty
        from_stock.save()
        
        to_stock.on_hand_qty += qty
        to_stock.save()

        # Create transaction record
        trans = InventoryTransaction.objects.create(
            item=item,
            from_location=from_location,
            to_location=to_location,
            qty=qty,
            type='TRANSFER',
            user=user,
            notes=notes,
            requisition=requisition
        )

        return trans

    @staticmethod
    @transaction.atomic
    def issue_stock(
        item: Item,
        from_location: Location,
        qty: Decimal,
        user,
        notes: str = '',
        requisition=None,
        work_order_id: str = ''
    ) -> InventoryTransaction:
        """Issue stock from a location (removes from inventory)"""
        stock, _ = StockLevel.objects.get_or_create(
            item=item,
            location=from_location,
            defaults={'on_hand_qty': 0, 'par_min': 0, 'par_max': 0}
        )

        if stock.available_qty < qty:
            raise ValueError(f"Insufficient stock. Available: {stock.available_qty}, Requested: {qty}")

        stock.on_hand_qty -= qty
        stock.save()

        trans = InventoryTransaction.objects.create(
            item=item,
            from_location=from_location,
            qty=qty,
            type='ISSUE',
            user=user,
            notes=notes,
            requisition=requisition,
            work_order_id=work_order_id
        )

        return trans

    @staticmethod
    @transaction.atomic
    def receive_stock(
        item: Item,
        to_location: Location,
        qty: Decimal,
        user,
        cost: Decimal = None,
        notes: str = '',
        receipt_id: str = '',
        vendor=None
    ) -> InventoryTransaction:
        """Receive stock into a location"""
        stock, _ = StockLevel.objects.get_or_create(
            item=item,
            location=to_location,
            defaults={'on_hand_qty': 0, 'par_min': 0, 'par_max': 0}
        )

        stock.on_hand_qty += qty
        stock.save()

        trans = InventoryTransaction.objects.create(
            item=item,
            to_location=to_location,
            qty=qty,
            type='RECEIVE',
            user=user,
            cost=cost,
            notes=notes,
            receipt_id=receipt_id
        )

        return trans

    @staticmethod
    @transaction.atomic
    def adjust_stock(
        item: Item,
        location: Location,
        qty: Decimal,
        user,
        notes: str = '',
        reason: str = ''
    ) -> InventoryTransaction:
        """Manually adjust stock level"""
        stock, _ = StockLevel.objects.get_or_create(
            item=item,
            location=location,
            defaults={'on_hand_qty': 0, 'par_min': 0, 'par_max': 0}
        )

        stock.on_hand_qty = qty
        stock.save()

        trans = InventoryTransaction.objects.create(
            item=item,
            to_location=location,
            qty=qty,
            type='ADJUST',
            user=user,
            notes=f"{notes} (Reason: {reason})" if reason else notes
        )

        return trans

