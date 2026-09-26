"""
ViewSet for the Candidato resource.

Read operations (list, retrieve) are available to any authenticated user.
Write operations (create, update, destroy) and the adoption toggle are
restricted to admin users (is_staff or is_superuser) by get_permissions().
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import logging

from apps.auth_app.permissions import IsAdmin
from .models import Candidato
from .serializers import CandidatoSerializer

logger = logging.getLogger('apps.candidatos')

# Actions that modify shelter data and therefore require an admin account
ADMIN_ACTIONS = {'create', 'update', 'partial_update', 'destroy', 'adoptar'}


class CandidatoViewSet(viewsets.ModelViewSet):
    """
    Provides CRUD endpoints for Candidato objects.

    Supported query parameters:
      - search=<name>       — case-insensitive name filter
      - especie=<species>   — case-insensitive species filter
      - adoptado=true|false — filter by adoption status
    """

    serializer_class = CandidatoSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Enforce admin rights on every write action, including `adoptar`.

        Declaring the rule here (instead of checking request.user inside each
        method) keeps the permission logic in one place and makes DRF answer
        with a consistent 403 payload.
        """
        if self.action in ADMIN_ACTIONS:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Apply optional query-string filters to the base queryset."""
        queryset = Candidato.objects.all()
        search = self.request.query_params.get('search')
        especie = self.request.query_params.get('especie')
        adoptado = self.request.query_params.get('adoptado')

        if search:
            queryset = queryset.filter(nombre__icontains=search)
        if especie:
            queryset = queryset.filter(especie__icontains=especie)
        if adoptado is not None:
            queryset = queryset.filter(adoptado=adoptado.lower() in ('true', '1', 'yes'))

        return queryset

    def perform_create(self, serializer):
        candidato = serializer.save()
        logger.info(f"Candidate created: {candidato.id} - User: {self.request.user}")

    def perform_destroy(self, instance):
        logger.info(f"Candidate deleted: {instance.id} - User: {self.request.user}")
        instance.delete()

    @action(detail=True, methods=['patch'])
    def adoptar(self, request, pk=None):
        """Toggle the adoption status of a candidate (adopted ↔ available). Admin only."""
        candidato = get_object_or_404(Candidato, pk=pk)
        candidato.adoptado = not candidato.adoptado
        candidato.save(update_fields=['adoptado', 'fecha_actualizacion'])

        logger.info(
            f"Candidate {pk} marked as {'adopted' if candidato.adoptado else 'available'} "
            f"- User: {request.user}"
        )

        return Response(self.get_serializer(candidato).data, status=status.HTTP_200_OK)
