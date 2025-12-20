from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from imh_ims.models import Requisition, RequisitionLine, StockLevel
from .stock_service import StockService


class RequisitionService:
    """Service for requisition operations"""

    @staticmethod
    def check_availability(requisition: Requisition) -> dict:
        """Check availability of all items in a requisition"""
        availability = {}
        for line in requisition.lines.all():
            try:
                stock = StockLevel.objects.get(
                    item=line.item,
                    location=requisition.from_location
                )
                available = stock.available_qty
            except StockLevel.DoesNotExist:
                available = Decimal('0')
            
            availability[line.item.id] = {
                'requested': line.qty_requested,
                'available': available,
                'sufficient': available >= line.qty_requested
            }
        return availability

    @staticmethod
    @transaction.atomic
    def create_requisition(
        from_location,
        to_location,
        requested_by,
        lines_data: list,
        needed_by=None,
        notes=''
    ) -> Requisition:
        """Create a new requisition with lines"""
        requisition = Requisition.objects.create(
            from_location=from_location,
            to_location=to_location,
            requested_by=requested_by,
            needed_by=needed_by,
            notes=notes
        )

        for line_data in lines_data:
            RequisitionLine.objects.create(
                requisition=requisition,
                item=line_data['item'],
                qty_requested=line_data['qty']
            )

        return requisition

    @staticmethod
    @transaction.atomic
    def pick_requisition(requisition: Requisition, user) -> Requisition:
        """Pick items for a requisition (updates stock)"""
        if requisition.status != 'PENDING':
            raise ValueError(f"Cannot pick requisition with status {requisition.status}")

        # Check availability
        availability = RequisitionService.check_availability(requisition)
        insufficient = [
            item_id for item_id, info in availability.items()
            if not info['sufficient']
        ]
        
        if insufficient:
            raise ValueError(f"Insufficient stock for items: {insufficient}")

        # Transfer stock for each line
        for line in requisition.lines.all():
            qty_to_pick = line.qty_requested
            StockService.transfer_stock(
                item=line.item,
                from_location=requisition.from_location,
                to_location=requisition.to_location,
                qty=qty_to_pick,
                user=user,
                requisition=requisition,
                notes=f"Picked for requisition #{requisition.id}"
            )
            line.qty_picked = qty_to_pick
            line.save()

        requisition.status = 'PICKED'
        requisition.save()

        return requisition

    @staticmethod
    @transaction.atomic
    def complete_requisition(requisition: Requisition) -> Requisition:
        """Mark requisition as completed"""
        if requisition.status != 'PICKED':
            raise ValueError(f"Cannot complete requisition with status {requisition.status}")

        requisition.status = 'COMPLETED'
        requisition.completed_at = timezone.now()
        requisition.save()

        return requisition

