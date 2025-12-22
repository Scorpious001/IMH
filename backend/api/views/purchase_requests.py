from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from imh_ims.models import PurchaseRequest, UserProfile
from api.serializers import PurchaseRequestSerializer


class PurchaseRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for PurchaseRequest operations"""
    queryset = PurchaseRequest.objects.all()
    serializer_class = PurchaseRequestSerializer

    def get_queryset(self):
        queryset = PurchaseRequest.objects.all()
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-created_at')


class PurchaseRequestApproveView(APIView):
    """Approve a purchase request - Manager/Admin only"""
    permission_classes = [IsAuthenticated]

    def post(self, request, purchase_request_id):
        # Check if user is manager or admin
        try:
            profile = request.user.profile
            if not profile.is_manager_or_admin:
                return Response(
                    {'error': 'Only managers and admins can approve purchase requests'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            purchase_request = PurchaseRequest.objects.get(id=purchase_request_id)
        except PurchaseRequest.DoesNotExist:
            return Response(
                {'error': 'Purchase request not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if purchase_request.status not in ['DRAFT', 'SUBMITTED']:
            return Response(
                {'error': f'Cannot approve purchase request with status {purchase_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        purchase_request.status = 'APPROVED'
        purchase_request.approved_by = request.user
        purchase_request.approved_at = timezone.now()
        purchase_request.save()

        serializer = PurchaseRequestSerializer(purchase_request)
        return Response(serializer.data)


class PurchaseRequestDenyView(APIView):
    """Deny a purchase request - Manager/Admin only"""
    permission_classes = [IsAuthenticated]

    def post(self, request, purchase_request_id):
        # Check if user is manager or admin
        try:
            profile = request.user.profile
            if not profile.is_manager_or_admin:
                return Response(
                    {'error': 'Only managers and admins can deny purchase requests'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            purchase_request = PurchaseRequest.objects.get(id=purchase_request_id)
        except PurchaseRequest.DoesNotExist:
            return Response(
                {'error': 'Purchase request not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if purchase_request.status not in ['DRAFT', 'SUBMITTED']:
            return Response(
                {'error': f'Cannot deny purchase request with status {purchase_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        denial_reason = request.data.get('denial_reason', '')

        purchase_request.status = 'CANCELLED'  # Using CANCELLED for denied
        purchase_request.denied_by = request.user
        purchase_request.denied_at = timezone.now()
        purchase_request.denial_reason = denial_reason
        purchase_request.save()

        serializer = PurchaseRequestSerializer(purchase_request)
        return Response(serializer.data)

