# Serializer for the Candidato model — handles JSON conversion and field validation.

from rest_framework import serializers
from .models import Candidato


class CandidatoSerializer(serializers.ModelSerializer):
    """
    Converts Candidato instances to/from JSON for the REST API.

    Read-only fields (id, timestamps) are set automatically by the database
    and must not be sent in POST/PUT requests.
    """

    class Meta:
        model = Candidato
        fields = [
            'id', 'nombre', 'especie', 'edad', 'descripcion',
            'imagen', 'adoptado', 'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

    def validate_edad(self, value):
        """Age must be a non-negative integer and within a realistic range."""
        if value < 0:
            raise serializers.ValidationError("Age cannot be negative.")
        if value > 30:
            raise serializers.ValidationError("Age seems too high for a pet.")
        return value

    def validate_nombre(self, value):
        """Name must not be blank or whitespace-only."""
        if not value or not value.strip():
            raise serializers.ValidationError("Name cannot be empty.")
        return value.strip()

    def validate_especie(self, value):
        """Species must not be blank or whitespace-only."""
        if not value or not value.strip():
            raise serializers.ValidationError("Species cannot be empty.")
        return value.strip()
