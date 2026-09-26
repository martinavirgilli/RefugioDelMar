# Serializers for Visita and SolicitudVisita models.

from rest_framework import serializers
from django.utils import timezone
from .models import Visita, SolicitudVisita
from apps.candidatos.serializers import CandidatoSerializer


class VisitaSerializer(serializers.ModelSerializer):
    """
    Serializes Visita instances for the REST API.

    `candidato_detalle` is a read-only nested representation of the related
    Candidato, returned alongside the plain `candidato` foreign key ID so
    the frontend can display the animal's name without a second request.
    """

    # Read-only nested field — populated from the `candidato` FK on read
    candidato_detalle = CandidatoSerializer(source='candidato', read_only=True)

    class Meta:
        model = Visita
        fields = [
            'id', 'candidato', 'candidato_detalle', 'fecha_visita',
            'visitante_nombre', 'visitante_email', 'visitante_telefono',
            'estado', 'notas', 'comentario_final',
            'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

    def validate_visitante_email(self, value):
        """Validate that a well-formed email address is provided."""
        if not value or '@' not in value:
            raise serializers.ValidationError("A valid email address is required.")
        return value

    def validate_visitante_nombre(self, value):
        """Visitor name must not be blank."""
        if not value or not value.strip():
            raise serializers.ValidationError("Visitor name cannot be empty.")
        return value.strip()

    def validate_fecha_visita(self, value):
        """Visit date must be in the future to prevent scheduling past visits."""
        if value and value <= timezone.now():
            raise serializers.ValidationError("Visit date must be in the future.")
        return value


class SolicitudVisitaSerializer(serializers.ModelSerializer):
    """
    Serializes SolicitudVisita instances.

    `candidato_detalle` provides the animal's name/species without a second request.
    `usuario` is set automatically from the request in the view, never from client data.
    `estado` and `fecha_visita` are managed exclusively via the accept/reject actions.
    """

    candidato_detalle = CandidatoSerializer(source='candidato', read_only=True)

    class Meta:
        model = SolicitudVisita
        fields = [
            'id', 'candidato', 'candidato_detalle', 'usuario',
            'nombre_apellido', 'email', 'telefono', 'motivo',
            'estado', 'fecha_visita',
            'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'usuario', 'estado', 'fecha_visita', 'fecha_creacion', 'fecha_actualizacion']

    def validate_email(self, value):
        if not value or '@' not in value:
            raise serializers.ValidationError("A valid email address is required.")
        return value

    def validate_nombre_apellido(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Name cannot be empty.")
        return value.strip()

    def validate_motivo(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("A reason for the visit is required.")
        return value.strip()
