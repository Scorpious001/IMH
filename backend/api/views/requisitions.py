from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from decimal import Decimal
from imh_ims.models import Requisition, Item, Location
from api.serializers import RequisitionSerializer
from imh_ims.services.requisition_service import RequisitionService


class RequisitionViewSet(viewsets.ModelViewSet):
    """ViewSet for Requisition operations"""
    queryset = Requisition.objects.all()
    serializer_class = RequisitionSerializer

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

