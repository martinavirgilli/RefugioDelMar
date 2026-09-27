"""
Read-only endpoints with the shelter's adoption numbers.

They are public: the counters and the "finales felices" gallery are part of
the public home page, so they cannot require an account. Note what is public
here is the aggregate, not the animals' records — an adopted animal's file is
archived and only the shelter can open it.

The adoption date now comes from `Candidato.fecha_adopcion`, which the shelter
sets (and can correct) when marking the adoption. Rows created before that
field existed fall back to `fecha_actualizacion`, the old approximation.
"""

from collections import Counter
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import logging

from apps.auth_app.permissions import es_admin
from apps.candidatos.models import Candidato

logger = logging.getLogger('apps.adopciones')

MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
         'jul', 'ago', 'sep', 'oct', 'nov', 'dic']


def fecha_de_adopcion(candidato):
    """
    When this animal was adopted, as a date.

    Prefers the date the shelter recorded; falls back to the last update for
    records that predate the field.
    """
    if candidato.fecha_adopcion:
        return candidato.fecha_adopcion
    return timezone.localtime(candidato.fecha_actualizacion).date()


@api_view(['GET'])
@permission_classes([AllowAny])
def resumen_adopciones(request):
    """
    Aggregated adoption stats: totals, a breakdown by species and the last
    twelve months, so the adoptions page can show more than three numbers.
    """
    try:
        candidatos = list(Candidato.objects.all())
        adoptados = [c for c in candidatos if c.adoptado]

        # Últimos 12 meses, incluido el actual, siempre en orden cronológico
        hoy = timezone.localtime()
        meses = []
        for atras in range(11, -1, -1):
            fecha = (hoy.replace(day=1) - timedelta(days=atras * 30)).replace(day=1)
            meses.append({'clave': (fecha.year, fecha.month),
                          'etiqueta': f'{MESES[fecha.month - 1]} {str(fecha.year)[2:]}',
                          'cantidad': 0})

        indice = {m['clave']: m for m in meses}
        for c in adoptados:
            fecha = fecha_de_adopcion(c)
            mes = indice.get((fecha.year, fecha.month))
            if mes:
                mes['cantidad'] += 1

        por_especie = [
            {'especie': especie, 'adoptados': cantidad}
            for especie, cantidad in sorted(
                Counter(c.especie.strip().lower() for c in adoptados).items(),
                key=lambda par: -par[1],
            )
        ]

        return Response({
            'total': len(candidatos),
            'adoptados': len(adoptados),
            'disponibles': len(candidatos) - len(adoptados),
            'por_especie': por_especie,
            'por_mes': [{'etiqueta': m['etiqueta'], 'cantidad': m['cantidad']} for m in meses],
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching adoption summary: {str(e)}")
        return Response(
            {'error': 'Error al calcular el resumen'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def historial_adopciones(request):
    """
    Animals that already found a home, most recent adoption first.

    Carries `resenas` so /adopciones can show the family's story next to the
    animal, and `adoptante` so the shelter sees who took them home. It is the
    curated public view of an adoption; the animal's own record stays internal.
    """
    try:
        adoptados = (
            Candidato.objects
            .filter(adoptado=True)
            .prefetch_related('resenas')
        )
        # El nombre de quien adoptó es dato interno del refugio: la galería
        # pública muestra al animal y la historia que mandó la familia.
        muestra_adoptante = es_admin(request)

        historial = [
            {
                'id': c.id,
                'nombre': c.nombre,
                'especie': c.especie,
                'genero': c.genero,
                'etapa': c.etapa,
                'imagen': c.imagen,
                'adoptante': c.adoptante if muestra_adoptante else '',
                'fecha_adopcion': fecha_de_adopcion(c).isoformat(),
                # Contado sobre el prefetch, para no consultar una vez por fila
                'resenas': sum(1 for r in c.resenas.all() if r.publicada),
            }
            for c in adoptados
        ]
        historial.sort(key=lambda fila: fila['fecha_adopcion'], reverse=True)

        return Response(historial, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching adoption history: {str(e)}")
        return Response(
            {'error': 'Error al cargar el historial'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
