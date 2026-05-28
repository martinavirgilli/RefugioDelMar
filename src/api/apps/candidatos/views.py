"""
ViewSet for the Candidato resource.

Read operations (list, retrieve) are available to any authenticated user.
Write operations (create, update, destroy) and the adoption toggle are
restricted to admin users (is_staff or is_superuser).
"""

from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import logging

from .models import Candidato
from .serializers import CandidatoSerializer

logger = logging.getLogger('apps.candidatos')


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

    def list(self, request, *args, **kwargs):
        """Return a list of all candidates matching the active filters."""
        try:
            logger.info(f"Listing candidates - User: {request.user}")
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error listing candidates: {str(e)}")
            return Response(
                {'error': 'Error retrieving candidates'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Return a single candidate by primary key."""
        try:
            logger.info(f"Retrieving candidate {kwargs.get('pk')} - User: {request.user}")
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error retrieving candidate: {str(e)}")
            return Response(
                {'error': 'Candidate not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def create(self, request, *args, **kwargs):
        """Create a new candidate. Admin only."""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only admins can create candidates'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            logger.info(f"Creating candidate - User: {request.user}")
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            logger.info(f"Candidate created: {serializer.data.get('id')}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            logger.warning(f"Validation error creating candidate: {str(e)}")
            return Response(
                {'error': 'Invalid data', 'details': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating candidate: {str(e)}")
            return Response(
                {'error': 'Error creating candidate'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        """Update an existing candidate. Admin only."""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only admins can update candidates'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            logger.info(f"Updating candidate {kwargs.get('pk')} - User: {request.user}")
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error updating candidate: {str(e)}")
            return Response(
                {'error': 'Error updating candidate'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """Delete a candidate. Admin only."""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only admins can delete candidates'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            logger.info(f"Deleting candidate {kwargs.get('pk')} - User: {request.user}")
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error deleting candidate: {str(e)}")
            return Response(
                {'error': 'Error deleting candidate'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['patch'])
    def adoptar(self, request, pk=None):
        """Toggle the adoption status of a candidate (adopted ↔ available)."""
        try:
            candidato = get_object_or_404(Candidato, pk=pk)
            candidato.adoptado = not candidato.adoptado
            candidato.save()

            logger.info(
                f"Candidate {pk} marked as {'adopted' if candidato.adoptado else 'available'} "
                f"- User: {request.user}"
            )

            serializer = self.get_serializer(candidato)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error toggling adoption status: {str(e)}")
            return Response(
                {'error': 'Error updating adoption status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
