# URL configuration for the candidatos app.
# Uses a DefaultRouter to automatically generate standard CRUD routes.
# Mounted at /api/candidatos/ in the root URL configuration.

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CandidatoViewSet

router = DefaultRouter()
router.register(r'', CandidatoViewSet, basename='candidato')

urlpatterns = [
    path('', include(router.urls)),
]
