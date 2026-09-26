"""
URL configuration for refugio_api project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
import os


def serve_frontend_file(request):
    """
    Vista para servir archivos estáticos del frontend (JS, CSS, imágenes, etc.)
    """
    # Obtener la ruta del request
    path = request.path.lstrip('/')
    frontend_path = os.path.join(settings.BASE_DIR, 'frontend', path)
    if os.path.exists(frontend_path) and os.path.isfile(frontend_path):
        return FileResponse(open(frontend_path, 'rb'))
    raise Http404()


def serve_frontend(request):
    """
    Vista para servir el index.html del frontend React.
    Maneja todas las rutas que no son de la API para el routing del SPA.
    """
    frontend_path = os.path.join(settings.BASE_DIR, 'frontend', 'index.html')
    if os.path.exists(frontend_path):
        return FileResponse(open(frontend_path, 'rb'), content_type='text/html')
    else:
        from django.http import HttpResponse
        return HttpResponse('Frontend no encontrado. Por favor, reconstruya la aplicación.', status=404)


urlpatterns = [
    # Rutas de la API
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.auth_app.urls')),
    path('api/candidatos/', include('apps.candidatos.urls')),
    path('api/adopciones/', include('apps.adopciones.urls')),
    path('api/visitas/', include('apps.visitas.urls')),
    # JWT Token endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Servir archivos estáticos del frontend (assets, imágenes, etc.)
    # Esto captura rutas como /assets/..., /vite.svg, etc.
    re_path(r'^(?!api|admin|static)(.+\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|webp))$', 
            serve_frontend_file, name='frontend-static'),
    
    # Servir el index.html para todas las demás rutas (SPA routing)
    re_path(r'^(?!api|admin|static).*$', serve_frontend, name='frontend'),
]

