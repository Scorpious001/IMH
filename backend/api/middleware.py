"""
Middleware to add no-cache headers to API responses
"""
from django.utils.deprecation import MiddlewareMixin


class NoCacheMiddleware(MiddlewareMixin):
    """Add no-cache headers to API responses to prevent browser caching"""
    
    def process_response(self, request, response):
        # Only apply to API endpoints
        if request.path.startswith('/api/'):
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        return response

