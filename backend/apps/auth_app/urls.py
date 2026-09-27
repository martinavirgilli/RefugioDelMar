# URL patterns for the auth_app.
# Mounted at /api/auth/ in the root URL configuration.

from django.urls import path

from .user_admin_views import buscar_usuarios, crear_usuario
from .views import login, register

urlpatterns = [
    path('login', login, name='login'),
    path('register', register, name='register'),

    # Admin-only: used by the manual visit form
    path('usuarios/buscar', buscar_usuarios, name='buscar-usuarios'),
    path('usuarios/crear', crear_usuario, name='crear-usuario'),
]
