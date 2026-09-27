# Mounted at /api/colaboraciones/ in the root URL configuration.

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ColaboracionViewSet

router = DefaultRouter()
router.register(r'', ColaboracionViewSet, basename='colaboracion')

urlpatterns = [path('', include(router.urls))]
