from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from decimal import Decimal
from imh_ims.models import CountSession, CountLine, Location, Item
from api.serializers import CountSessionSerializer, CountLineSerializer
from imh_ims.services.count_service import CountService


class CountSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for Count Session operations"""
    queryset = CountSession.objects.all()
    serializer_class = CountSessionSerializer

    def get_queryset(self):
        queryset = CountSession.objects.all()
        
        status_filter = self.request.query_params.get('status', None)
        location_id = self.request.query_params.get('location_id', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        
        return queryset.order_by('-started_at')

    def create(self, request, *args, **kwargs):
        """Start a new count session"""
        location_id = request.data.get('location_id')
        notes = request.data.get('notes', '')
        
        try:
            location = Location.objects.get(id=location_id)
        except Location.DoesNotExist:
            return Response(
                {'error': 'Location not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        session = CountService.start_count_session(
            location=location,
            counted_by=request.user,
            notes=notes
        )
        serializer = CountSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CountLineView(APIView):
    """Add or update a count line"""
    def post(self, request, session_id):
        item_id = request.data.get('item_id')
        counted_qty = Decimal(str(request.data.get('counted_qty')))
        reason_code = request.data.get('reason_code', '')
        notes = request.data.get('notes', '')
        
        try:
            session = CountSession.objects.get(id=session_id)
            item = Item.objects.get(id=item_id)
        except (CountSession.DoesNotExist, Item.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if session.status != 'IN_PROGRESS':
            return Response(
                {'error': f'Cannot add lines to count session with status {session.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        count_line = CountService.add_count_line(
            count_session=session,
            item=item,
            counted_qty=counted_qty,
            reason_code=reason_code,
            notes=notes
        )
        serializer = CountLineSerializer(count_line)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CountCompleteView(APIView):
    """Complete a count session"""
    def post(self, request, session_id):
        try:
            session = CountSession.objects.get(id=session_id)
        except CountSession.DoesNotExist:
            return Response(
                {'error': 'Count session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            session = CountService.complete_count_session(session)
            serializer = CountSessionSerializer(session)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CountApproveView(APIView):
    """Approve a count session and apply variances"""
    def post(self, request, session_id):
        try:
            session = CountSession.objects.get(id=session_id)
        except CountSession.DoesNotExist:
            return Response(
                {'error': 'Count session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            session = CountService.apply_count_variance(session, request.user)
            serializer = CountSessionSerializer(session)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

