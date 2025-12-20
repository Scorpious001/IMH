from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token


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
            login(request, user)
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser
                }
            })
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
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'first_name': user.first_name,
            'last_name': user.last_name
        })


class CSRFTokenView(APIView):
    """Get CSRF token for frontend"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        token = get_token(request)
        return Response({'csrfToken': token})

