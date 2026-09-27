"""
Read-only endpoints with the shelter's adoption numbers.

They are public: the counters and the "finales felices" gallery are part of
the public home page, so they cannot require an account.

The data is still derived from `Candidato.adoptado` + `fecha_actualizacion`,
which is imprecise. Recording real Adopcion rows is Fase 3 of the plan.
"""

from collections import Counter
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import logging

from apps.candidatos.models import Candidato

logger = logging.getLogger('apps.adopciones')

MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
         'jul', 'ago', 'sep', 'oct', 'nov', 'dic']


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
            fecha = timezone.localtime(c.fecha_actualizacion)
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
    Animals that already found a home, most recent first.

    Uses `fecha_actualizacion` as the adoption date because no separate
    adoption event is stored yet.
    """
    try:
        adoptados = Candidato.objects.filter(adoptado=True).order_by('-fecha_actualizacion')

        historial = [
            {
                'id': c.id,
                'nombre': c.nombre,
                'especie': c.especie,
                'genero': c.genero,
                'edad': c.edad,
                'imagen': c.imagen,
                'fecha_adopcion': c.fecha_actualizacion.isoformat(),
            }
            for c in adoptados
        ]

        return Response(historial, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching adoption history: {str(e)}")
        return Response(
            {'error': 'Error al cargar el historial'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
