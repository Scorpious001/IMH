from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from imh_ims.models import UserProfile, ModulePermission, UserPermission
from api.serializers import UserSerializer, UserProfileSerializer, PermissionSerializer


class IsAdminPermission(BasePermission):
    """Permission class to check if user is admin"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            profile = request.user.profile
            return profile.is_admin
        except UserProfile.DoesNotExist:
            return False
    
    def has_object_permission(self, request, view, obj):
        """Object-level permission check - same as view-level for admin"""
        return self.has_permission(request, view)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User management - Admin only"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]

    def get_queryset(self):
        queryset = User.objects.select_related('profile').all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                email__icontains=search
            ) | queryset.filter(
                first_name__icontains=search
            ) | queryset.filter(
                last_name__icontains=search
            )
        return queryset.order_by('username')

    def create(self, request, *args, **kwargs):
        """Create a new user with profile and permissions"""
        username = request.data.get('username')
        email = request.data.get('email', '')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'SUPERVISOR')
        permission_ids = request.data.get('permission_ids', [])

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=make_password(password)
        )

        # Create profile
        UserProfile.objects.create(
            user=user,
            role=role
        )

        # Assign permissions
        if permission_ids:
            permissions = ModulePermission.objects.filter(id__in=permission_ids)
            for permission in permissions:
                UserPermission.objects.get_or_create(
                    user=user,
                    permission=permission,
                    defaults={'granted_by': request.user}
                )

        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update user, profile, and permissions"""
        user = self.get_object()
        password = request.data.get('password')
        role = request.data.get('role')
        permission_ids = request.data.get('permission_ids')

        # Update user fields
        if 'email' in request.data:
            user.email = request.data['email']
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if password:
            user.password = make_password(password)
        user.save()

        # Update profile
        if role:
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.role = role
            profile.save()

        # Update permissions
        if permission_ids is not None:
            # Remove existing permissions
            UserPermission.objects.filter(user=user).delete()
            # Add new permissions
            if permission_ids:
                permissions = ModulePermission.objects.filter(id__in=permission_ids)
                for permission in permissions:
                    UserPermission.objects.create(
                        user=user,
                        permission=permission,
                        granted_by=request.user
                    )

        serializer = UserSerializer(user)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete user"""
        user = self.get_object()
        # Prevent deleting yourself
        if user.id == request.user.id:
            return Response(
                {'error': 'Cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def permissions(self, request):
        """Get all available permissions"""
        try:
            permissions = ModulePermission.objects.all().order_by('module', 'action')
            serializer = PermissionSerializer(permissions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            error_detail = str(e)
            traceback_str = traceback.format_exc()
            print(f"Error loading permissions: {error_detail}")
            print(f"Traceback: {traceback_str}")
            return Response(
                {'error': f'Failed to load permissions: {error_detail}', 'detail': error_detail},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

