"""
Views for the adopciones app.

These endpoints are read-only and available to any authenticated user.
They derive adoption data from the Candidato model's `adoptado` flag
rather than from separate Adopcion records, keeping the data model simple.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

from apps.candidatos.models import Candidato

logger = logging.getLogger('apps.adopciones')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resumen_adopciones(request):
    """
    Return aggregated adoption statistics.

    Counts all candidates and splits them into adopted vs. available.
    """
    try:
        logger.info(f"Fetching adoption summary - User: {request.user}")

        total = Candidato.objects.count()
        adoptados = Candidato.objects.filter(adoptado=True).count()
        disponibles = total - adoptados

        return Response({
            'total': total,
            'adoptados': adoptados,
            'disponibles': disponibles,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching adoption summary: {str(e)}")
        return Response(
            {'error': 'Error retrieving summary'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_adopciones(request):
    """
    Return a list of all adopted candidates ordered by most recently updated.

    Uses `fecha_actualizacion` as the adoption date because no separate
    adoption event timestamp is stored on the Candidato model.
    """
    try:
        logger.info(f"Fetching adoption history - User: {request.user}")

        candidatos_adoptados = Candidato.objects.filter(
            adoptado=True
        ).order_by('-fecha_actualizacion')

        historial = [
            {
                'id': c.id,
                'nombre': c.nombre,
                'especie': c.especie,
                'edad': c.edad,
                'fecha_adopcion': c.fecha_actualizacion.isoformat(),
            }
            for c in candidatos_adoptados
        ]

        return Response(historial, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching adoption history: {str(e)}")
        return Response(
            {'error': 'Error retrieving history'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
