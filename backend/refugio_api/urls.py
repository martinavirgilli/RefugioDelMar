"""
URL configuration for refugio_api.

This project is API-only: the React frontend is a separate application
(see ../frontend) deployed to Netlify, so Django never serves HTML here.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API
    path('api/auth/', include('apps.auth_app.urls')),
    path('api/candidatos/', include('apps.candidatos.urls')),
    path('api/adopciones/', include('apps.adopciones.urls')),
    path('api/visitas/', include('apps.visitas.urls')),

    # JWT token endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
