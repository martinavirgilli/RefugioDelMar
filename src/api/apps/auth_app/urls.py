# URL patterns for the auth_app.
# These are mounted at /api/auth/ in the root URL configuration.

from django.urls import path
from .views import login, register

urlpatterns = [
    path('login', login, name='login'),
    path('register', register, name='register'),
]
