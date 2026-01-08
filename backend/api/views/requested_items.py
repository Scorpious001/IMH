from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from imh_ims.models import RequestedItem, Item, Department, UserProfile
from api.serializers import RequestedItemSerializer
from api.permissions import create_permission_class


class RequestedItemViewSet(viewsets.ModelViewSet):
    """ViewSet for Requested Item tracking"""
    queryset = RequestedItem.objects.all()
    serializer_class = RequestedItemSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Apply permission checks based on action"""
        if self.action in ['list', 'retrieve', 'create']:
            self.permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Users can only edit their own, admins can edit any
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        queryset = RequestedItem.objects.select_related(
            'user', 'item', 'department', 'cancelled_by'
        ).all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by user (default to current user unless admin)
        user_id = self.request.query_params.get('user_id', None)
        try:
            profile = self.request.user.profile
            if user_id and profile.is_admin:
                # Admins can view any user's requests
                queryset = queryset.filter(user_id=user_id)
            elif not profile.is_admin:
                # Non-admins only see their own requests
                queryset = queryset.filter(user=self.request.user)
        except UserProfile.DoesNotExist:
            # No profile, default to own requests
            queryset = queryset.filter(user=self.request.user)
        
        # Filter by department
        department_id = self.request.query_params.get('department_id', None)
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        # Filter by item
        item_id = self.request.query_params.get('item_id', None)
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        
        return queryset.order_by('-requested_at')

    def perform_create(self, serializer):
        """Create requested item with current user"""
        # Get department from user profile if available
        department = None
        try:
            profile = self.request.user.profile
            department = profile.department
        except UserProfile.DoesNotExist:
            pass
        
        # Use department from request if provided, otherwise from profile
        department_id = self.request.data.get('department_id')
        if department_id:
            try:
                department = Department.objects.get(id=department_id)
            except Department.DoesNotExist:
                pass
        
        serializer.save(
            user=self.request.user,
            department=department
        )

    @action(detail=True, methods=['post'])
    def mark_ordered(self, request, pk=None):
        """Mark item as ordered"""
        requested_item = self.get_object()
        requested_item.status = 'ORDERED'
        requested_item.ordered_at = timezone.now()
        requested_item.save()
        
        serializer = self.get_serializer(requested_item)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_received(self, request, pk=None):
        """Mark item as received"""
        requested_item = self.get_object()
        requested_item.status = 'RECEIVED'
        requested_item.received_at = timezone.now()
        requested_item.save()
        
        serializer = self.get_serializer(requested_item)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel requested item"""
        requested_item = self.get_object()
        
        # Only the requester or admin can cancel
        if requested_item.user != request.user:
            try:
                profile = request.user.profile
                if not profile.is_admin:
                    return Response(
                        {'error': 'Only the requester or admin can cancel'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except UserProfile.DoesNotExist:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        requested_item.status = 'CANCELLED'
        requested_item.cancelled_at = timezone.now()
        requested_item.cancelled_by = request.user
        requested_item.save()
        
        serializer = self.get_serializer(requested_item)
        return Response(serializer.data)
