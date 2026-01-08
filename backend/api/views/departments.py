from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from imh_ims.models import Department
from api.serializers import DepartmentSerializer
from api.permissions import create_permission_class


class DepartmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Department operations"""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Apply permission checks based on action"""
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only admins can manage departments
            self.permission_classes = [IsAuthenticated, create_permission_class('settings', 'edit')]
        return super().get_permissions()

    def get_queryset(self):
        queryset = Department.objects.all()
        
        # Filter by active if requested
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('name')
