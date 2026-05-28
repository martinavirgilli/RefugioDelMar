"""
ViewSet for the Visita resource.

All operations are restricted to admin users (is_staff or is_superuser).
The list endpoint only returns future visits — past ones are not shown
in the UI but remain in the database for record-keeping.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
import logging

from .models import Visita
from .serializers import VisitaSerializer
from apps.auth_app.permissions import IsAdmin

logger = logging.getLogger('apps.visitas')


class VisitaViewSet(viewsets.ModelViewSet):
    """
    Provides CRUD endpoints for Visita objects.

    All write operations and listing are restricted to admin users.
    Regular authenticated users receive a 403 for any endpoint in this ViewSet.
    """

    queryset = Visita.objects.all()
    serializer_class = VisitaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only upcoming visits — those scheduled from now onwards."""
        return Visita.objects.filter(
            fecha_visita__gte=timezone.now()
        ).order_by('fecha_visita')

    def list(self, request, *args, **kwargs):
        """List all upcoming visits. Admin only."""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'You do not have permission to view visits'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            logger.info(f"Listing visits - User: {request.user}")
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error listing visits: {str(e)}")
            return Response(
                {'error': 'Error retrieving visits'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Schedule a new visit. Admin only."""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only admins can create visits'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            logger.info(f"Creating visit - User: {request.user}")
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            logger.info(f"Visit created: {serializer.data.get('id')}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating visit: {str(e)}")
            return Response(
                {'error': 'Error creating visit', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        """Delete a visit. Admin only."""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only admins can delete visits'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            logger.info(f"Deleting visit {kwargs.get('pk')} - User: {request.user}")
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error deleting visit: {str(e)}")
            return Response(
                {'error': 'Error deleting visit'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['patch'])
    def agregar_comentario(self, request, pk=None):
        """
        Add a final comment to a completed visit. Admin only.

        Also sets the visit status to 'realizada', marking it as done.
        """
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only admins can add comments'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            visita = get_object_or_404(Visita, pk=pk)
            comentario = request.data.get('comentario_final', '')

            if not comentario or not comentario.strip():
                return Response(
                    {'error': 'Comment cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            visita.comentario_final = comentario.strip()
            visita.estado = 'realizada'  # Mark as completed when a comment is added
            visita.save()

            logger.info(f"Comment added to visit {pk} - User: {request.user}")

            serializer = self.get_serializer(visita)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error adding comment: {str(e)}")
            return Response(
                {'error': 'Error adding comment'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
