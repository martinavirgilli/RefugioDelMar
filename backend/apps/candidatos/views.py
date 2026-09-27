"""
ViewSet for the Candidato resource.

Reading the catalogue is public: someone looking to adopt should be able to
browse and open a profile without an account. An account is only required to
request a visit. Every write action is restricted to admins by get_permissions().
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
import logging

from apps.auth_app.permissions import IsAdmin
from .models import Candidato, CandidatoFoto
from .serializers import CandidatoFotoSerializer, CandidatoSerializer

logger = logging.getLogger('apps.candidatos')

# Actions anyone may use, with or without an account
PUBLIC_ACTIONS = {'list', 'retrieve', 'especies'}

# Actions that modify shelter data and therefore require an admin account
ADMIN_ACTIONS = {
    'create', 'update', 'partial_update', 'destroy',
    'adoptar', 'fotos', 'borrar_foto', 'actividad',
}

# How `orden` maps to a queryset ordering
ORDENES = {
    'recientes': '-fecha_creacion',   # los últimos en llegar
    'antiguos': 'fecha_creacion',     # los que más tiempo llevan esperando
    'nombre': 'nombre',
}


class CandidatoViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for Candidato objects.

    Supported query parameters on the list endpoint:
      - search=<name>          — case-insensitive name filter
      - especie=<species>      — case-insensitive species filter
      - genero=macho|hembra|desconocido
      - adoptado=true|false    — filter by adoption status
      - orden=recientes|antiguos|nombre
      - page / page_size       — pagination
    """

    serializer_class = CandidatoSerializer

    def get_permissions(self):
        """
        Reading is public; writing is admin-only.

        Declaring the rule here (instead of checking request.user inside each
        method) keeps the permission logic in one place and makes DRF answer
        with a consistent 403 payload.
        """
        if self.action in ADMIN_ACTIONS:
            return [IsAuthenticated(), IsAdmin()]
        if self.action in PUBLIC_ACTIONS:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Apply optional query-string filters to the base queryset."""
        queryset = Candidato.objects.prefetch_related('fotos')
        params = self.request.query_params

        search = params.get('search')
        especie = params.get('especie')
        genero = params.get('genero')
        adoptado = params.get('adoptado')

        if search:
            queryset = queryset.filter(nombre__icontains=search)
        if especie:
            queryset = queryset.filter(especie__iexact=especie)
        if genero:
            queryset = queryset.filter(genero__iexact=genero)
        if adoptado is not None:
            queryset = queryset.filter(adoptado=adoptado.lower() in ('true', '1', 'yes'))

        return queryset.order_by(ORDENES.get(params.get('orden'), '-fecha_creacion'))

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

    @action(detail=False, methods=['get'])
    def especies(self, request):
        """
        Distinct species present in the catalogue, for the filter dropdown.

        Computed in the database so the dropdown does not depend on whatever
        happens to be on the current page.
        """
        especies = (
            Candidato.objects
            .order_by('especie')
            .values_list('especie', flat=True)
            .distinct()
        )
        return Response(sorted({e.strip().lower() for e in especies if e and e.strip()}))

    # ── Galería de fotos (admin) ────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='fotos')
    def fotos(self, request, pk=None):
        """
        Add a photo to a candidate's gallery. Admin only.

        Accepts either multipart with an `archivo` file or JSON with a `url`.
        New photos go to the end of the gallery unless `orden` says otherwise.
        """
        candidato = get_object_or_404(Candidato, pk=pk)

        serializer = CandidatoFotoSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        if 'orden' not in serializer.validated_data:
            ultimo = candidato.fotos.order_by('-orden').first()
            serializer.validated_data['orden'] = (ultimo.orden + 1) if ultimo else 0

        foto = serializer.save(candidato=candidato)
        logger.info(f"Photo {foto.id} added to candidate {pk} - User: {request.user}")

        return Response(
            CandidatoFotoSerializer(foto, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['delete'], url_path=r'fotos/(?P<foto_id>[^/.]+)')
    def borrar_foto(self, request, pk=None, foto_id=None):
        """Remove one photo from a candidate's gallery. Admin only."""
        foto = get_object_or_404(CandidatoFoto, pk=foto_id, candidato_id=pk)
        foto.delete()
        logger.info(f"Photo {foto_id} removed from candidate {pk} - User: {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Ficha interna (admin) ───────────────────────────────────────────────

    @action(detail=True, methods=['get'])
    def actividad(self, request, pk=None):
        """
        Everything the shelter has on one candidate: who asked to meet them,
        which visits are booked and which already happened. Admin only.

        It is one endpoint instead of three so the detail page loads the whole
        picture in a single request.
        """
        # Imported here to keep the candidatos app from importing visitas at
        # module load time, which would make the two apps depend on each other.
        from apps.visitas.models import SolicitudVisita, Visita
        from apps.visitas.serializers import SolicitudVisitaSerializer, VisitaSerializer

        candidato = get_object_or_404(Candidato, pk=pk)

        solicitudes = (
            SolicitudVisita.objects
            .filter(candidato=candidato)
            .select_related('usuario', 'candidato')
        )
        visitas = Visita.objects.filter(candidato=candidato).select_related('candidato')

        return Response({
            'candidato': self.get_serializer(candidato).data,
            'solicitudes': SolicitudVisitaSerializer(solicitudes, many=True).data,
            'visitas': VisitaSerializer(visitas, many=True).data,
        })
