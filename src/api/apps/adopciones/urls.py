from django.urls import path
from .views import resumen_adopciones, historial_adopciones

urlpatterns = [
    path('resumen', resumen_adopciones, name='resumen-adopciones'),
    path('historial', historial_adopciones, name='historial-adopciones'),
]

