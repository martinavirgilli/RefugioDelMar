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
