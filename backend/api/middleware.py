"""
Middleware to add no-cache headers to API responses
"""
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)


class NoCacheMiddleware(MiddlewareMixin):
    """Add no-cache headers to API responses to prevent browser caching"""
    
    def process_response(self, request, response):
        # Only apply to API endpoints
        if request.path.startswith('/api/'):
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        return response


class AuthDebugMiddleware(MiddlewareMixin):
    """Debug middleware to log authentication status for API requests"""
    
    def process_request(self, request):
        if request.path.startswith('/api/'):
            logger.info(f'API Request: {request.method} {request.path}')
            logger.info(f'User authenticated: {request.user.is_authenticated}')
            if request.user.is_authenticated:
                logger.info(f'User: {request.user.username}, Superuser: {request.user.is_superuser}')
                try:
                    if hasattr(request.user, 'profile'):
                        logger.info(f'Profile role: {request.user.profile.role}, is_admin: {request.user.profile.is_admin}')
                except Exception as e:
                    logger.warning(f'Error accessing profile: {e}')
            logger.info(f'Session key: {request.session.session_key}')
        return None

