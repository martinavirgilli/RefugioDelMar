"""
ViewSets for the Visita and SolicitudVisita resources.

Visita — admin-only CRUD for manually scheduled visits.
SolicitudVisita — any authenticated user can create; list returns all for admins
                  and only the user's own records for regular users;
                  accept/reject actions are admin-only.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
import logging

from .models import Visita, SolicitudVisita
from .serializers import VisitaSerializer, SolicitudVisitaSerializer
from apps.auth_app.permissions import IsAdmin

logger = logging.getLogger('apps.visitas')


class VisitaViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for manually-created Visita objects.

    All operations are restricted to admin users.
    Regular authenticated users receive 403 for every endpoint here.
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


class SolicitudVisitaViewSet(viewsets.ModelViewSet):
    """
    Endpoints for visit requests submitted by regular users.

    - list/retrieve: admin sees all; regular users see only their own.
    - create: any authenticated user.
    - aceptar / rechazar: admin-only custom PATCH actions.
    """

    serializer_class = SolicitudVisitaSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        """Admins see all requests; regular users see only their own."""
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return SolicitudVisita.objects.select_related('candidato', 'usuario').all()
        return SolicitudVisita.objects.select_related('candidato', 'usuario').filter(usuario=user)

    def perform_create(self, serializer):
        """Attach the requesting user automatically."""
        serializer.save(usuario=self.request.user)

    def create(self, request, *args, **kwargs):
        """Submit a new visit request. Any authenticated user."""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            logger.info(f"Visit request created by {request.user} for candidato {request.data.get('candidato')}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating visit request: {str(e)}")
            return Response(
                {'error': 'Error creating visit request', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['patch'])
    def aceptar(self, request, pk=None):
        """Accept a visit request and set the visit date. Admin only."""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'error': 'Only admins can accept requests'}, status=status.HTTP_403_FORBIDDEN)

        solicitud = get_object_or_404(SolicitudVisita, pk=pk)
        fecha_visita = request.data.get('fecha_visita')

        if not fecha_visita:
            return Response({'error': 'fecha_visita is required to accept a request'}, status=status.HTTP_400_BAD_REQUEST)

        solicitud.estado = 'aceptada'
        solicitud.fecha_visita = fecha_visita
        solicitud.save()

        logger.info(f"Visit request {pk} accepted by {request.user} — date: {fecha_visita}")
        return Response(self.get_serializer(solicitud).data)

    @action(detail=True, methods=['patch'])
    def rechazar(self, request, pk=None):
        """Reject a visit request. Admin only."""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'error': 'Only admins can reject requests'}, status=status.HTTP_403_FORBIDDEN)

        solicitud = get_object_or_404(SolicitudVisita, pk=pk)
        solicitud.estado = 'rechazada'
        solicitud.save()

        logger.info(f"Visit request {pk} rejected by {request.user}")
        return Response(self.get_serializer(solicitud).data)
