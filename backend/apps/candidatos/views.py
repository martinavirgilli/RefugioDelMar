"""
ViewSet for the Candidato resource.

Reading the catalogue is public: someone looking to adopt should be able to
browse and open a profile without an account. An account is only required to
request a visit. Every write action is restricted to admins by get_permissions().

One exception to "reading is public": an adopted animal's record is archived,
and an archived record is internal. It leaves the public catalogue and public
detail lookups answer 404; only the shelter can open it. What stays public
about an adoption is the aggregate — the counters on /adopciones and the
reviews the families sent — not the file itself.
"""

from datetime import date

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
import logging

from apps.auth_app.permissions import IsAdmin, es_admin
from .models import Candidato, CandidatoFoto, Resena
from .serializers import CandidatoFotoSerializer, CandidatoSerializer, ResenaSerializer

logger = logging.getLogger('apps.candidatos')

# Actions anyone may use, with or without an account
PUBLIC_ACTIONS = {'list', 'retrieve', 'especies', 'resenas_publicas'}

# Actions that modify shelter data and therefore require an admin account
ADMIN_ACTIONS = {
    'create', 'update', 'partial_update', 'destroy',
    'adoptar', 'fotos', 'borrar_foto', 'actividad',
    'resenas', 'editar_resena', 'borrar_resena',
}

# How `orden` maps to a queryset ordering
ORDENES = {
    'recientes': '-fecha_creacion',   # los últimos en llegar
    'antiguos': 'fecha_creacion',     # los que más tiempo llevan esperando
    'nombre': 'nombre',
}

VERDADERO = ('true', '1', 'yes')


class CandidatoViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for Candidato objects.

    Supported query parameters on the list endpoint:
      - search=<name>          — case-insensitive name filter
      - especie=<species>      — case-insensitive species filter
      - genero=macho|hembra|desconocido
      - etapa=cachorro|joven|adulto
      - apto_salida=true|false — animals that can spend a day out
      - adoptado=true|false    — admin only; the public list never shows adopted
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
        """
        Apply optional query-string filters to the base queryset.

        Visitors only ever see animals looking for a home. Filtering here (and
        not in the frontend) also means an archived record cannot be reached by
        guessing its URL: retrieve() looks it up in this same queryset and
        answers 404.
        """
        queryset = Candidato.objects.prefetch_related('fotos', 'resenas')
        params = self.request.query_params
        admin = es_admin(self.request)

        if admin:
            # Cuánta gente está esperando respuesta por este animal. Se anota
            # solo acá para no disparar una consulta por fila del catálogo.
            queryset = queryset.annotate(
                pendientes=Count('solicitudes', filter=Q(solicitudes__estado='revision')),
            )
            adoptado = params.get('adoptado')
            if adoptado is not None:
                queryset = queryset.filter(adoptado=adoptado.lower() in VERDADERO)
        elif params.get('adoptado', '').lower() in VERDADERO:
            # Pidió el archivo sin ser del refugio. Devolver los disponibles
            # en su lugar sería confuso: no hay nada que mostrarle acá.
            return queryset.none()
        else:
            queryset = queryset.filter(adoptado=False)

        search = params.get('search')
        especie = params.get('especie')
        genero = params.get('genero')
        etapa = params.get('etapa')
        apto_salida = params.get('apto_salida')

        if search:
            queryset = queryset.filter(nombre__icontains=search)
        if especie:
            queryset = queryset.filter(especie__iexact=especie)
        if genero:
            queryset = queryset.filter(genero__iexact=genero)
        if etapa:
            queryset = queryset.filter(etapa__iexact=etapa)
        if apto_salida is not None:
            queryset = queryset.filter(apto_salida=apto_salida.lower() in VERDADERO)

        return queryset.order_by(ORDENES.get(params.get('orden'), '-fecha_creacion'))

    def perform_create(self, serializer):
        candidato = serializer.save()
        logger.info(f"Candidate created: {candidato.id} - User: {self.request.user}")

    def perform_destroy(self, instance):
        logger.info(f"Candidate deleted: {instance.id} - User: {self.request.user}")
        instance.delete()

    @action(detail=True, methods=['patch'])
    def adoptar(self, request, pk=None):
        """
        Toggle the adoption status of a candidate (adopted <-> available).
        Admin only.

        Adopting also records when it happened and who adopted: the date used
        to be inferred from fecha_actualizacion, which moved on every edit.
        Both can be sent in the body; the date defaults to today. Reverting
        clears them, so a record never keeps a stale adoption.
        """
        candidato = get_object_or_404(Candidato, pk=pk)
        candidato.adoptado = not candidato.adoptado

        if candidato.adoptado:
            candidato.fecha_adopcion = request.data.get('fecha_adopcion') or date.today()
            candidato.adoptante = (request.data.get('adoptante') or '').strip()
        else:
            candidato.fecha_adopcion = None
            candidato.adoptante = ''

        candidato.save(update_fields=[
            'adoptado', 'fecha_adopcion', 'adoptante', 'fecha_actualizacion',
        ])

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
        happens to be on the current page. For visitors it only counts animals
        looking for a home: offering a species whose only animals are archived
        would return an empty catalogue every time.
        """
        candidatos = Candidato.objects.all()
        if not es_admin(request):
            candidatos = candidatos.filter(adoptado=False)

        especies = candidatos.order_by('especie').values_list('especie', flat=True).distinct()
        return Response(sorted({e.strip().lower() for e in especies if e and e.strip()}))

    # -- Galeria de fotos (admin) -------------------------------------------

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

    # -- Resenas de adopcion -----------------------------------------------

    @action(detail=False, methods=['get'], url_path='resenas', url_name='resenas-publicas')
    def resenas_publicas(self, request):
        """
        Published reviews, newest first, for the home page and /adopciones.

        This is what stays public about an adoption: the family's story, not
        the animal's file. `limite` caps how many come back.
        """
        try:
            limite = max(1, min(int(request.query_params.get('limite', 6)), 24))
        except (TypeError, ValueError):
            limite = 6

        resenas = (
            Resena.objects
            .filter(publicada=True, candidato__adoptado=True)
            .select_related('candidato')[:limite]
        )
        return Response(ResenaSerializer(resenas, many=True, context={'request': request}).data)

    @action(detail=True, methods=['get', 'post'], url_path='resenas')
    def resenas(self, request, pk=None):
        """
        List every review of a candidate, or write a new one. Admin only.

        A review only makes sense once the animal left with a family, so it is
        refused on a candidate that is still looking for a home.
        """
        candidato = get_object_or_404(Candidato, pk=pk)

        if request.method == 'GET':
            return Response(ResenaSerializer(
                candidato.resenas.all(), many=True, context={'request': request},
            ).data)

        if not candidato.adoptado:
            return Response(
                {'error': 'Las reseñas son de animales ya adoptados. '
                          'Marcá la adopción primero.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ResenaSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        resena = serializer.save(candidato=candidato)
        logger.info(f"Review {resena.id} added to candidate {pk} - User: {request.user}")

        return Response(
            ResenaSerializer(resena, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['patch'], url_path=r'resenas/(?P<resena_id>[^/.]+)')
    def editar_resena(self, request, pk=None, resena_id=None):
        """Edit a review, or publish and unpublish it. Admin only."""
        resena = get_object_or_404(Resena, pk=resena_id, candidato_id=pk)

        serializer = ResenaSerializer(
            resena, data=request.data, partial=True, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], url_path=r'resenas/(?P<resena_id>[^/.]+)/borrar')
    def borrar_resena(self, request, pk=None, resena_id=None):
        """Delete a review. Admin only."""
        resena = get_object_or_404(Resena, pk=resena_id, candidato_id=pk)
        resena.delete()
        logger.info(f"Review {resena_id} removed from candidate {pk} - User: {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

    # -- Ficha interna (admin) ---------------------------------------------

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
