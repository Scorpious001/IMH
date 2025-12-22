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
            # Admins have all permissions
            if request.user.is_authenticated:
                try:
                    if request.user.profile.is_admin:
                        return True
                except AttributeError:
                    pass
            
            # Check specific permission
            if not request.user.is_authenticated:
                return False
            
            return check_permission(request.user, module, action)
    
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

