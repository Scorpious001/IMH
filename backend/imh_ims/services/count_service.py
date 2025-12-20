from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from imh_ims.models import CountSession, CountLine, StockLevel
from .stock_service import StockService


class CountService:
    """Service for count operations"""

    @staticmethod
    @transaction.atomic
    def start_count_session(location, counted_by, notes='') -> CountSession:
        """Start a new count session"""
        session = CountSession.objects.create(
            location=location,
            counted_by=counted_by,
            notes=notes
        )
        return session

    @staticmethod
    @transaction.atomic
    def add_count_line(
        count_session: CountSession,
        item,
        counted_qty: Decimal,
        reason_code='',
        notes=''
    ) -> CountLine:
        """Add a count line to a count session"""
        # Get expected quantity from stock level
        try:
            stock = StockLevel.objects.get(
                item=item,
                location=count_session.location
            )
            expected_qty = stock.on_hand_qty
        except StockLevel.DoesNotExist:
            expected_qty = Decimal('0')

        count_line, created = CountLine.objects.get_or_create(
            count_session=count_session,
            item=item,
            defaults={
                'expected_qty': expected_qty,
                'counted_qty': counted_qty,
                'reason_code': reason_code,
                'notes': notes
            }
        )

        if not created:
            count_line.counted_qty = counted_qty
            count_line.reason_code = reason_code
            count_line.notes = notes
            count_line.save()

        return count_line

    @staticmethod
    @transaction.atomic
    def complete_count_session(count_session: CountSession) -> CountSession:
        """Mark count session as completed"""
        if count_session.status != 'IN_PROGRESS':
            raise ValueError(f"Cannot complete count session with status {count_session.status}")

        count_session.status = 'COMPLETED'
        count_session.completed_at = timezone.now()
        count_session.save()

        return count_session

    @staticmethod
    @transaction.atomic
    def apply_count_variance(count_session: CountSession, approved_by) -> CountSession:
        """Apply approved count variances to stock levels"""
        if count_session.status != 'COMPLETED':
            raise ValueError(f"Cannot approve count session with status {count_session.status}")

        # Apply each variance
        for line in count_session.lines.all():
            variance = line.variance
            if variance != 0:
                # Adjust stock to match counted quantity
                StockService.adjust_stock(
                    item=line.item,
                    location=count_session.location,
                    qty=line.counted_qty,
                    user=approved_by,
                    notes=f"Count adjustment from session #{count_session.id}",
                    reason=line.reason_code or 'Count variance'
                )

                # Update stock level's last counted info
                stock, _ = StockLevel.objects.get_or_create(
                    item=line.item,
                    location=count_session.location,
                    defaults={'on_hand_qty': 0, 'par_min': 0, 'par_max': 0}
                )
                stock.last_counted_at = timezone.now()
                stock.last_counted_by = approved_by
                stock.save()

        count_session.status = 'APPROVED'
        count_session.approved_by = approved_by
        count_session.approved_at = timezone.now()
        count_session.save()

        return count_session

