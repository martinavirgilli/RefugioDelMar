from rest_framework import serializers

from .models import Colaboracion


class ColaboracionSerializer(serializers.ModelSerializer):
    """
    Serializes a collaboration offer.

    `estado` and `nota_interna` belong to the shelter, so they are read-only
    here and only change through the admin-only PATCH endpoint.
    """

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Colaboracion
        fields = [
            'id', 'tipo', 'tipo_display', 'nombre', 'email', 'telefono',
            'disponibilidad', 'mensaje', 'estado', 'estado_display',
            'nota_interna', 'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'estado', 'nota_interna', 'fecha_creacion', 'fecha_actualizacion']

    def validate_nombre(self, value):
        if not value.strip():
            raise serializers.ValidationError('Necesitamos tu nombre para contactarte.')
        return value.strip()

    def validate_mensaje(self, value):
        if not value.strip():
            raise serializers.ValidationError('Contanos un poco sobre vos.')
        return value.strip()


class ColaboracionAdminSerializer(ColaboracionSerializer):
    """Same fields, but the shelter may move the state and leave notes."""

    class Meta(ColaboracionSerializer.Meta):
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']
