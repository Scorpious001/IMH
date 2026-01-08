"""
API views for Synergy/Enigma integration
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from api.integrations.synergy_enigma import get_integration
from api.permissions import create_permission_class


class SynergyEnigmaSyncView(APIView):
    """View for syncing data with Synergy/Enigma systems"""
    permission_classes = [IsAuthenticated, create_permission_class('settings', 'edit')]
    
    def post(self, request):
        """Trigger sync with external systems"""
        sync_type = request.data.get('type', 'all')  # all, items, locations, users, transactions
        
        integration = get_integration()
        
        try:
            if sync_type == 'all' or sync_type == 'items':
                items = integration.sync_items()
            if sync_type == 'all' or sync_type == 'locations':
                locations = integration.sync_locations()
            if sync_type == 'all' or sync_type == 'users':
                users = integration.sync_users()
            if sync_type == 'all' or sync_type == 'transactions':
                start_date = request.data.get('start_date')
                transactions = integration.sync_transactions(start_date)
            
            return Response({
                'success': True,
                'message': f'Sync completed for {sync_type}'
            })
        except Exception as e:
            return Response(
                {'error': f'Sync failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SynergyEnigmaPushView(APIView):
    """View for pushing data to Synergy/Enigma systems"""
    permission_classes = [IsAuthenticated, create_permission_class('settings', 'edit')]
    
    def post(self, request):
        """Push inventory update to external system"""
        item_id = request.data.get('item_id')
        location_id = request.data.get('location_id')
        quantity = request.data.get('quantity')
        
        if not all([item_id, location_id, quantity is not None]):
            return Response(
                {'error': 'item_id, location_id, and quantity are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        integration = get_integration()
        
        try:
            success = integration.push_inventory_update(item_id, location_id, float(quantity))
            if success:
                return Response({
                    'success': True,
                    'message': 'Inventory update pushed successfully'
                })
            else:
                return Response(
                    {'error': 'Failed to push inventory update'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            return Response(
                {'error': f'Push failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
