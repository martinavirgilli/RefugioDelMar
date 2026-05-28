"""
Authentication views: login and self-registration.

All endpoints are public (AllowAny) since they are the entry point
for unauthenticated users. On success, both views return a JWT access
token + refresh token so the client is immediately authenticated.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
import logging

logger = logging.getLogger('apps.auth_app')


def _user_response(user):
    """Return a serializable dict with the fields the frontend needs."""
    return {
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'name': user.get_full_name() or user.username,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Authenticate a user with email + password and return JWT tokens.

    The frontend uses email as the primary identifier, but Django's
    authenticate() works with username, so we look up the User by email first.
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            logger.warning("Login attempt without email or password")
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Look up the user by email (username field may differ)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"Login attempt with unknown email: {email}")
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Verify the password using Django's built-in authenticate
        user = authenticate(username=user.username, password=password)

        if user is None:
            logger.warning(f"Wrong password for: {email}")
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate a new JWT token pair for the authenticated user
        refresh = RefreshToken.for_user(user)

        logger.info(f"Successful login: {user.email}")

        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': _user_response(user),
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response(
            {'error': 'Error processing login'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Create a new regular user account and return JWT tokens.

    New users are created with is_staff=False and is_superuser=False,
    so they can browse the shelter data but cannot manage it.
    The email is used as the username to simplify the login flow.
    """
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    name = request.data.get('name', '').strip()

    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 6:
        return Response(
            {'error': 'Password must be at least 6 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'An account with this email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name,
            is_staff=False,
            is_superuser=False,
        )
        refresh = RefreshToken.for_user(user)
        logger.info(f"New user registered: {email}")
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': _user_response(user),
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response(
            {'error': 'Error creating account'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
