from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from django.utils import timezone
from imh_ims.models import Requisition, Item, Location, UserProfile
from api.serializers import RequisitionSerializer
from imh_ims.services.requisition_service import RequisitionService
from api.permissions import create_permission_class


class RequisitionViewSet(viewsets.ModelViewSet):
    """ViewSet for Requisition operations"""
    queryset = Requisition.objects.all()
    serializer_class = RequisitionSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Apply permission checks based on action"""
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [IsAuthenticated, create_permission_class('requisitions', 'view')]
        elif self.action == 'create':
            self.permission_classes = [IsAuthenticated, create_permission_class('requisitions', 'create')]
        elif self.action in ['update', 'partial_update']:
            self.permission_classes = [IsAuthenticated, create_permission_class('requisitions', 'edit')]
        elif self.action == 'destroy':
            self.permission_classes = [IsAuthenticated, create_permission_class('requisitions', 'delete')]
        return super().get_permissions()

    def get_queryset(self):
        queryset = Requisition.objects.all()
        
        status_filter = self.request.query_params.get('status', None)
        location_id = self.request.query_params.get('location_id', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if location_id:
            queryset = queryset.filter(
                from_location_id=location_id
            ) | queryset.filter(to_location_id=location_id)
        
        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """Create a new requisition with lines"""
        from_location_id = request.data.get('from_location_id')
        to_location_id = request.data.get('to_location_id')
        needed_by = request.data.get('needed_by')
        notes = request.data.get('notes', '')
        lines_data = request.data.get('lines', [])
        
        try:
            from_location = Location.objects.get(id=from_location_id)
            to_location = Location.objects.get(id=to_location_id)
        except Location.DoesNotExist as e:
            return Response(
                {'error': f'Location not found: {str(e)}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Convert lines data to proper format
        lines = []
        for line in lines_data:
            try:
                item = Item.objects.get(id=line['item_id'])
                lines.append({
                    'item': item,
                    'qty': Decimal(str(line['qty']))
                })
            except (Item.DoesNotExist, KeyError) as e:
                return Response(
                    {'error': f'Invalid line data: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            requisition = RequisitionService.create_requisition(
                from_location=from_location,
                to_location=to_location,
                requested_by=request.user,
                lines_data=lines,
                needed_by=needed_by,
                notes=notes
            )
            serializer = RequisitionSerializer(requisition)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class RequisitionPickView(APIView):
    """Pick items for a requisition"""
    def post(self, request, requisition_id):
        try:
            requisition = Requisition.objects.get(id=requisition_id)
        except Requisition.DoesNotExist:
            return Response(
                {'error': 'Requisition not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            requisition = RequisitionService.pick_requisition(requisition, request.user)
            serializer = RequisitionSerializer(requisition)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class RequisitionCompleteView(APIView):
    """Complete a requisition"""
    def post(self, request, requisition_id):
        try:
            requisition = Requisition.objects.get(id=requisition_id)
        except Requisition.DoesNotExist:
            return Response(
                {'error': 'Requisition not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            requisition = RequisitionService.complete_requisition(requisition)
            serializer = RequisitionSerializer(requisition)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class RequisitionApproveView(APIView):
    """Approve a requisition - Manager/Admin only"""
    permission_classes = [IsAuthenticated]

    def post(self, request, requisition_id):
        # Check if user is manager or admin
        try:
            profile = request.user.profile
            if not profile.is_manager_or_admin:
                return Response(
                    {'error': 'Only managers and admins can approve requisitions'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            requisition = Requisition.objects.get(id=requisition_id)
        except Requisition.DoesNotExist:
            return Response(
                {'error': 'Requisition not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if requisition.status != 'PENDING':
            return Response(
                {'error': f'Cannot approve requisition with status {requisition.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        requisition.status = 'APPROVED'
        requisition.approved_by = request.user
        requisition.approved_at = timezone.now()
        requisition.save()

        serializer = RequisitionSerializer(requisition)
        return Response(serializer.data)


class RequisitionDenyView(APIView):
    """Deny a requisition - Manager/Admin only"""
    permission_classes = [IsAuthenticated]

    def post(self, request, requisition_id):
        # Check if user is manager or admin
        try:
            profile = request.user.profile
            if not profile.is_manager_or_admin:
                return Response(
                    {'error': 'Only managers and admins can deny requisitions'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            requisition = Requisition.objects.get(id=requisition_id)
        except Requisition.DoesNotExist:
            return Response(
                {'error': 'Requisition not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if requisition.status != 'PENDING':
            return Response(
                {'error': f'Cannot deny requisition with status {requisition.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        denial_reason = request.data.get('denial_reason', '')

        requisition.status = 'DENIED'
        requisition.denied_by = request.user
        requisition.denied_at = timezone.now()
        requisition.denial_reason = denial_reason
        requisition.save()

        serializer = RequisitionSerializer(requisition)
        return Response(serializer.data)

