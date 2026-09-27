# Custom DRF permission classes used across the project.

from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Grants access only to authenticated staff or superuser accounts.

    Used to protect admin-only endpoints such as creating visits or
    managing shelter candidates.
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser)
        )


def es_admin(request):
    """
    Same rule as IsAdmin, as a plain function.

    Views need it outside the permission system too: some endpoints are public
    but answer with more detail for the shelter than for a visitor.
    """
    usuario = getattr(request, 'user', None)
    return bool(
        usuario and usuario.is_authenticated
        and (usuario.is_staff or usuario.is_superuser)
    )
