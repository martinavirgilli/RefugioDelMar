"""
ViewSets for the Visita and SolicitudVisita resources.

Visita — admin-only CRUD for scheduled visits, whether they came from a request
         or were booked by hand for someone without an account.
SolicitudVisita — any authenticated user can create; list returns all for admins
         and only the user's own records for regular users; accept/reject are
         admin-only actions.
"""

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging

from apps.auth_app.permissions import IsAdmin
from .models import SolicitudVisita, Visita
from .serializers import SolicitudVisitaSerializer, VisitaSerializer

logger = logging.getLogger('apps.visitas')


class VisitaViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for Visita objects. Admin only.

    By default the list shows upcoming visits, which is what the shelter needs
    day to day. `?historial=true` returns the past ones and `?candidato=<id>`
    narrows the list to a single animal.
    """

    queryset = Visita.objects.all()
    serializer_class = VisitaSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = Visita.objects.select_related('candidato', 'usuario')
        params = self.request.query_params

        candidato = params.get('candidato')
        if candidato:
            queryset = queryset.filter(candidato_id=candidato)

        if params.get('historial', '').lower() in ('true', '1', 'yes'):
            return queryset.filter(fecha_visita__lt=timezone.now()).order_by('-fecha_visita')

        return queryset.filter(fecha_visita__gte=timezone.now()).order_by('fecha_visita')

    def perform_create(self, serializer):
        visita = serializer.save()
        logger.info(f"Visit {visita.id} created - User: {self.request.user}")

    @action(detail=True, methods=['patch'])
    def agregar_comentario(self, request, pk=None):
        """
        Add a final comment to a completed visit, which marks it as done.

        The comment is what closes a visit: there is no separate "mark as
        finished" action, because a visit without notes is not really closed.
        """
        visita = get_object_or_404(Visita, pk=pk)
        comentario = (request.data.get('comentario_final') or '').strip()

        if not comentario:
            return Response(
                {'error': 'El comentario no puede estar vacío.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        visita.comentario_final = comentario
        visita.estado = 'realizada'
        visita.save(update_fields=['comentario_final', 'estado', 'fecha_actualizacion'])

        logger.info(f"Comment added to visit {pk} - User: {request.user}")
        return Response(self.get_serializer(visita).data)


class SolicitudVisitaViewSet(viewsets.ModelViewSet):
    """
    Visit requests submitted by people who want to meet an animal.

    - list/retrieve: admins see everything; everyone else only their own.
    - create: any authenticated user.
    - aceptar / rechazar: admin-only.
    """

    serializer_class = SolicitudVisitaSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    ADMIN_ACTIONS = {'aceptar', 'rechazar'}

    def get_permissions(self):
        if self.action in self.ADMIN_ACTIONS:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Admins see all requests; regular users see only their own."""
        user = self.request.user
        queryset = SolicitudVisita.objects.select_related('candidato', 'usuario', 'visita')

        if not (user.is_staff or user.is_superuser):
            return queryset.filter(usuario=user)

        candidato = self.request.query_params.get('candidato')
        if candidato:
            queryset = queryset.filter(candidato_id=candidato)

        # El panel del refugio pregunta cuántas esperan respuesta
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset

    def perform_create(self, serializer):
        """Attach the requesting user automatically — never trust a client-sent id."""
        solicitud = serializer.save(usuario=self.request.user)
        logger.info(
            f"Visit request {solicitud.id} created by {self.request.user} "
            f"for candidato {solicitud.candidato_id}"
        )

    @action(detail=True, methods=['patch'])
    def aceptar(self, request, pk=None):
        """
        Accept a request and book the visit. Admin only.

        Accepting also creates the matching Visita: before this, an accepted
        request never showed up in the visits list, so the shelter had to
        re-enter it by hand.
        """
        solicitud = get_object_or_404(SolicitudVisita, pk=pk)
        fecha_visita = request.data.get('fecha_visita')

        if not fecha_visita:
            return Response(
                {'error': 'Hace falta una fecha para aceptar la solicitud.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            if solicitud.visita:
                # Re-accepting an already accepted request just moves the date
                visita = solicitud.visita
                visita.fecha_visita = fecha_visita
                visita.save(update_fields=['fecha_visita', 'fecha_actualizacion'])
            else:
                visita = Visita.objects.create(
                    candidato=solicitud.candidato,
                    usuario=solicitud.usuario,
                    fecha_visita=fecha_visita,
                    visitante_nombre=solicitud.nombre_apellido,
                    visitante_email=solicitud.email,
                    visitante_telefono=solicitud.telefono,
                    notas=solicitud.motivo,
                )
                solicitud.visita = visita

            solicitud.estado = 'aceptada'
            solicitud.fecha_visita = fecha_visita
            solicitud.save(update_fields=['estado', 'fecha_visita', 'visita', 'fecha_actualizacion'])

        logger.info(f"Request {pk} accepted by {request.user} — visit {visita.id} on {fecha_visita}")
        return Response(self.get_serializer(solicitud).data)

    @action(detail=True, methods=['patch'])
    def rechazar(self, request, pk=None):
        """Turn down a request, cancelling its visit if one was already booked. Admin only."""
        solicitud = get_object_or_404(SolicitudVisita, pk=pk)

        with transaction.atomic():
            if solicitud.visita:
                solicitud.visita.estado = 'cancelada'
                solicitud.visita.save(update_fields=['estado', 'fecha_actualizacion'])

            solicitud.estado = 'rechazada'
            solicitud.save(update_fields=['estado', 'fecha_actualizacion'])

        logger.info(f"Request {pk} rejected by {request.user}")
        return Response(self.get_serializer(solicitud).data)
