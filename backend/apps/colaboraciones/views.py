"""
Endpoints for volunteer and foster-home offers.

Posting an offer is public — asking someone to create an account before they
can offer to help is a good way to lose the help. Reading and managing the
list is admin-only.
"""

from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
import logging

from apps.auth_app.permissions import IsAdmin
from .models import Colaboracion
from .serializers import ColaboracionAdminSerializer, ColaboracionSerializer

logger = logging.getLogger('apps.colaboraciones')


class ColaboracionViewSet(mixins.CreateModelMixin,
                          mixins.ListModelMixin,
                          mixins.RetrieveModelMixin,
                          mixins.UpdateModelMixin,
                          viewsets.GenericViewSet):
    """
    POST is public; everything else needs an admin account.

    There is no delete on purpose: an offer that did not work out is archived,
    not erased, so the shelter keeps the contact.
    """

    queryset = Colaboracion.objects.all()
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]

    def get_serializer_class(self):
        return ColaboracionSerializer if self.action == 'create' else ColaboracionAdminSerializer

    def get_queryset(self):
        queryset = Colaboracion.objects.all()
        tipo = self.request.query_params.get('tipo')
        estado = self.request.query_params.get('estado')

        if tipo:
            queryset = queryset.filter(tipo=tipo)
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset

    def perform_create(self, serializer):
        colaboracion = serializer.save()
        logger.info(f"New {colaboracion.tipo} offer from {colaboracion.email}")
