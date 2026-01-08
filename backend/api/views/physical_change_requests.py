from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from imh_ims.models import PhysicalChangeRequest, PhysicalChangeRequestLine, Item, Location, UserProfile
from api.serializers import PhysicalChangeRequestSerializer, PhysicalChangeRequestLineSerializer
from api.permissions import create_permission_class


class PhysicalChangeRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for Physical Change Request operations"""
    queryset = PhysicalChangeRequest.objects.all()
    serializer_class = PhysicalChangeRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Apply permission checks based on action"""
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [IsAuthenticated]
        elif self.action == 'create':
            self.permission_classes = [IsAuthenticated]
        elif self.action in ['approve', 'deny']:
            # Only managers/admins can approve
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        queryset = PhysicalChangeRequest.objects.select_related(
            'location', 'requested_by', 'approved_by', 'denied_by', 'printed_by'
        ).prefetch_related('lines__item').all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by location
        location_id = self.request.query_params.get('location_id', None)
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(requested_by_id=user_id)
        
        # Filter items that need approval (for manager dashboard)
        needs_approval = self.request.query_params.get('needs_approval', None)
        if needs_approval == 'true':
            queryset = queryset.filter(
                status='PENDING',
                requires_approval=True
            )
        
        # Filter by department if user has one
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.department:
            # Show requests from user's department or user's own requests
            queryset = queryset.filter(
                requested_by__profile__department=user.profile.department
            ) | queryset.filter(requested_by=user)
        
        return queryset.order_by('-created_at')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new physical change request with lines"""
        request_type = request.data.get('request_type')
        location_id = request.data.get('location_id')
        notes = request.data.get('notes', '')
        lines_data = request.data.get('lines', [])
        cost_threshold = Decimal(str(request.data.get('cost_threshold', 100.00)))
        
        try:
            location = Location.objects.get(id=location_id)
        except Location.DoesNotExist:
            return Response(
                {'error': 'Location not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create request
        pcr = PhysicalChangeRequest.objects.create(
            request_type=request_type,
            location=location,
            requested_by=request.user,
            notes=notes,
            cost_threshold=cost_threshold
        )
        
        # Add lines and calculate total cost
        total_cost = Decimal('0')
        for line_data in lines_data:
            try:
                item = Item.objects.get(id=line_data['item_id'])
                qty = Decimal(str(line_data['qty']))
                unit_cost = item.cost if item.cost else Decimal('0')
                
                line = PhysicalChangeRequestLine.objects.create(
                    request=pcr,
                    item=item,
                    qty=qty,
                    unit_cost=unit_cost,
                    notes=line_data.get('notes', '')
                )
                
                total_cost += line.line_cost
            except (Item.DoesNotExist, KeyError) as e:
                return Response(
                    {'error': f'Invalid line data: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update total cost and check if approval is needed
        pcr.total_cost = total_cost
        pcr.requires_approval = total_cost > cost_threshold
        pcr.save()
        
        serializer = self.get_serializer(pcr)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a physical change request"""
        pcr = self.get_object()
        
        # Check if user can approve (manager or admin)
        try:
            profile = request.user.profile
            if not profile.is_manager_or_admin:
                return Response(
                    {'error': 'Only managers and admins can approve requests'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if pcr.status != 'PENDING':
            return Response(
                {'error': 'Request is not pending'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pcr.status = 'APPROVED'
        pcr.approved_by = request.user
        pcr.approved_at = timezone.now()
        pcr.save()
        
        # TODO: Execute the physical change (create transaction, update stock, etc.)
        # This would depend on the request_type and integrate with StockService
        
        serializer = self.get_serializer(pcr)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deny(self, request, pk=None):
        """Deny a physical change request"""
        pcr = self.get_object()
        denial_reason = request.data.get('denial_reason', '')
        
        # Check if user can deny (manager or admin)
        try:
            profile = request.user.profile
            if not profile.is_manager_or_admin:
                return Response(
                    {'error': 'Only managers and admins can deny requests'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if pcr.status != 'PENDING':
            return Response(
                {'error': 'Request is not pending'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pcr.status = 'DENIED'
        pcr.denied_by = request.user
        pcr.denied_at = timezone.now()
        pcr.denial_reason = denial_reason
        pcr.save()
        
        serializer = self.get_serializer(pcr)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_printed(self, request, pk=None):
        """Mark request as printed (for tracking)"""
        pcr = self.get_object()
        
        pcr.printed_at = timezone.now()
        pcr.printed_by = request.user
        pcr.save()
        
        serializer = self.get_serializer(pcr)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def for_print(self, request):
        """Get requests above cost threshold for printing"""
        cost_threshold = Decimal(str(request.query_params.get('cost_threshold', 100.00)))
        
        queryset = self.get_queryset().filter(
            status='PENDING',
            total_cost__gte=cost_threshold
        ).order_by('-total_cost')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
