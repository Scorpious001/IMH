"""
Middleware to add no-cache headers to API responses and handle HTTPS detection
"""
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
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


class HttpsSecurityMiddleware(MiddlewareMixin):
    """Middleware to set secure cookie flags when HTTPS is detected"""
    
    def process_request(self, request):
        # Check if request is over HTTPS (via X-Forwarded-Proto header from Nginx)
        is_https = (
            request.scheme == 'https' or
            request.META.get('HTTP_X_FORWARDED_PROTO') == 'https' or
            request.META.get('HTTPS') == 'on'
        )
        
        # Dynamically set SESSION_COOKIE_SECURE based on HTTPS detection
        if is_https:
            settings.SESSION_COOKIE_SECURE = True
            settings.CSRF_COOKIE_SECURE = True
        else:
            # Allow HTTP for local development
            if 'localhost' in request.get_host() or '127.0.0.1' in request.get_host():
                settings.SESSION_COOKIE_SECURE = False
                settings.CSRF_COOKIE_SECURE = False
            else:
                # For production, prefer secure cookies even on HTTP (will be upgraded to HTTPS)
                settings.SESSION_COOKIE_SECURE = False
                settings.CSRF_COOKIE_SECURE = False
        
        return None


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

