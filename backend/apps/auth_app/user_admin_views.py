"""
Admin-only endpoints for looking up and creating visitor accounts.

These exist for one concrete flow: the shelter books a visit by phone and the
person on the other side may or may not already have an account. The admin
searches by name or email, and if nobody matches, creates the account right
there so the visit can be linked to it.
"""

import logging
import secrets
import string

from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .permissions import IsAdmin

logger = logging.getLogger('apps.auth_app')

# Sin caracteres que se confundan al dictarlos por teléfono (l/1/I, O/0)
ALFABETO_CLARO = ''.join(c for c in string.ascii_letters + string.digits if c not in 'lI1O0')


def _generar_password(largo=12):
    return ''.join(secrets.choice(ALFABETO_CLARO) for _ in range(largo))


def _usuario_publico(user):
    return {
        'id': user.id,
        'nombre': user.get_full_name() or user.first_name or user.username,
        'email': user.email,
        'is_staff': user.is_staff,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def buscar_usuarios(request):
    """
    Search accounts by name or email for the visit form's autocomplete.

    Returns at most ten matches: it feeds a suggestion list, not a user
    directory. An empty or very short query returns nothing so a stray
    keystroke does not dump the whole table.
    """
    q = (request.query_params.get('q') or '').strip()

    if len(q) < 2:
        return Response([])

    usuarios = (
        User.objects
        .filter(Q(email__icontains=q) | Q(first_name__icontains=q) | Q(username__icontains=q))
        .order_by('first_name', 'email')[:10]
    )

    return Response([_usuario_publico(u) for u in usuarios])


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def crear_usuario(request):
    """
    Create an account for a visitor who does not have one. Admin only.

    The password is generated here and returned **once**, in this response,
    for the admin to pass on. It is never stored in readable form and cannot
    be retrieved again; if it gets lost the account needs a new one.
    """
    email = (request.data.get('email') or '').strip().lower()
    nombre = (request.data.get('nombre') or '').strip()

    if not email or '@' not in email:
        return Response(
            {'error': 'Hace falta un email válido.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {'error': 'Ya existe una cuenta con ese email.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    password = _generar_password()
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=nombre,
        is_staff=False,
        is_superuser=False,
    )

    logger.info(f"Account {email} created from the admin panel by {request.user}")

    return Response(
        {**_usuario_publico(user), 'password_temporal': password},
        status=status.HTTP_201_CREATED,
    )
