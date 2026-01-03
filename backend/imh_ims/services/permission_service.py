from imh_ims.models import ModulePermission, UserPermission
from django.contrib.auth.models import User


def initialize_permissions():
    """
    Initialize all permission combinations.
    Creates all module/action combinations if they don't exist.
    """
    modules = ['catalog', 'stock', 'vendors', 'requisitions', 'receiving', 'counts', 'reports']
    actions = ['view', 'create', 'edit', 'delete']
    
    created_count = 0
    for module in modules:
        for action in actions:
            permission, created = ModulePermission.objects.get_or_create(
                module=module,
                action=action,
                defaults={'name': f"{module}.{action}"}
            )
            if created:
                created_count += 1
    
    return created_count


def get_user_permissions(user):
    """
    Get all permissions for a user.
    Returns a queryset of UserPermission objects.
    """
    return UserPermission.objects.filter(user=user).select_related('permission')


def check_permission(user, module, action):
    """
    Check if a user has a specific permission.
    Admins have all permissions by default.
    """
    # Superusers have all permissions
    if user.is_superuser:
        return True
    
    try:
        profile = user.profile
        if profile.is_admin:
            return True
        return profile.has_permission(module, action)
    except AttributeError:
        # User doesn't have a profile - deny access
        return False
    except Exception as e:
        # Any other error - deny access
        return False


def get_user_permission_list(user):
    """
    Get all permissions for a user as a list of permission names.
    Returns list of strings like ['catalog.view', 'catalog.create', ...]
    """
    try:
        if not hasattr(user, 'profile'):
            return []
        
        profile = user.profile
        if profile.is_admin:
            # Return all permissions for admin
            try:
                return [p.name for p in ModulePermission.objects.all()]
            except Exception:
                # Permission table might not exist yet
                return []
        
        try:
            user_perms = get_user_permissions(user)
            return [up.permission.name for up in user_perms]
        except Exception:
            # UserPermission table might not exist yet
            return []
    except Exception:
        # Any other error, return empty list
        return []

