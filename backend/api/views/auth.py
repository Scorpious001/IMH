from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from imh_ims.models import UserProfile


class LoginView(APIView):
    """Handle user login"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            if not user.is_active:
                return Response(
                    {'error': 'User account is disabled. Please contact an administrator.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            login(request, user)
            # Get user role
            try:
                profile = user.profile
                role = profile.role
            except UserProfile.DoesNotExist:
                # Create default profile if it doesn't exist
                profile = UserProfile.objects.create(user=user, role='SUPERVISOR')
                role = profile.role
            
            # Get user permissions
            permissions = []
            try:
                from imh_ims.services.permission_service import get_user_permission_list
                permissions = get_user_permission_list(user)
            except Exception:
                # If permissions table doesn't exist yet, return empty list
                pass
            
            # Get or create token for mobile app authentication
            token, created = Token.objects.get_or_create(user=user)
            
            response_data = {
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': role,
                    'permissions': permissions
                },
                'token': token.key  # Include token for mobile apps
            }
            
            return Response(response_data)
        else:
            return Response(
                {'error': 'Invalid username or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    """Handle user logout"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({'message': 'Logout successful'})


class UserInfoView(APIView):
    """Get current user information"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        # Get user role
        try:
            profile = user.profile
            role = profile.role
        except UserProfile.DoesNotExist:
            # Create default profile if it doesn't exist
            profile = UserProfile.objects.create(user=user, role='SUPERVISOR')
            role = profile.role
        
        # Get user permissions
        permissions = []
        try:
            from imh_ims.services.permission_service import get_user_permission_list
            permissions = get_user_permission_list(user)
        except Exception:
            # If permissions table doesn't exist yet, return empty list
            pass
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': role,
            'permissions': permissions
        })


class CSRFTokenView(APIView):
    """Get CSRF token for frontend"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        token = get_token(request)
        return Response({'csrfToken': token})

