from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from imh_ims.services.permission_service import check_permission


def create_permission_class(module, action):
    """
    Factory function to create a permission class for a specific module/action.
    Usage: permission_classes = [IsAuthenticated, create_permission_class('catalog', 'view')]
    """
    class HasPermission(permissions.BasePermission):
        """
        Permission class to check if user has specific module/action permission.
        Admins bypass all permission checks.
        """
        def has_permission(self, request, view):
            # Check authentication first
            if not request.user.is_authenticated:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f'Permission denied: User not authenticated. User: {request.user}, IsAuthenticated: {request.user.is_authenticated}')
                return False
            
            # Admins have all permissions - check multiple ways
            # First check if user is superuser (most reliable)
            if request.user.is_superuser:
                return True
            
            # Then check profile.is_admin
            try:
                if hasattr(request.user, 'profile'):
                    profile = request.user.profile
                    if profile.is_admin:
                        return True
            except (AttributeError, Exception) as e:
                # If profile doesn't exist, that's okay - continue to permission check
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f'Profile check failed for user {request.user.username}: {e}')
            
            # Check specific permission
            try:
                has_perm = check_permission(request.user, module, action)
                if not has_perm:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f'Permission denied: User {request.user.username} does not have {module}.{action} permission')
                return has_perm
            except Exception as e:
                # If permission check fails, deny access
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Permission check error for user {request.user.username}: {e}')
                return False
    
    return HasPermission


def require_permission(module, action):
    """
    Decorator to require a specific permission for a view.
    Usage:
        @require_permission('catalog', 'view')
        def my_view(request):
            ...
    """
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                from rest_framework.exceptions import AuthenticationFailed
                raise AuthenticationFailed('Authentication required')
            
            # Admins bypass
            try:
                if request.user.profile.is_admin:
                    return view_func(request, *args, **kwargs)
            except AttributeError:
                pass
            
            # Check permission
            if not check_permission(request.user, module, action):
                raise PermissionDenied(
                    f'You do not have permission to {action} {module}'
                )
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

