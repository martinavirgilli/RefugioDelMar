from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VisitaViewSet, SolicitudVisitaViewSet

visitas_router = DefaultRouter()
visitas_router.register(r'', VisitaViewSet, basename='visita')

solicitudes_router = DefaultRouter()
solicitudes_router.register(r'', SolicitudVisitaViewSet, basename='solicitud')

urlpatterns = [
    path('solicitudes/', include(solicitudes_router.urls)),
    path('', include(visitas_router.urls)),
]
