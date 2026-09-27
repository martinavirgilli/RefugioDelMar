# Serializers for the candidatos app — JSON conversion and field validation.

from rest_framework import serializers

from .models import Candidato, CandidatoFoto


class CandidatoFotoSerializer(serializers.ModelSerializer):
    """
    One gallery photo.

    `src` is what the frontend renders and hides where the photo came from:
    an uploaded file becomes an absolute URL, a pasted link is passed through.
    """

    src = serializers.SerializerMethodField()

    class Meta:
        model = CandidatoFoto
        fields = ['id', 'src', 'archivo', 'url', 'alt', 'orden']
        extra_kwargs = {
            'archivo': {'write_only': True, 'required': False},
            'url': {'write_only': True, 'required': False},
        }

    def get_src(self, obj):
        if obj.archivo:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.archivo.url) if request else obj.archivo.url
        return obj.url

    def validate(self, attrs):
        """Exactly one source, mirroring CandidatoFoto.clean()."""
        if bool(attrs.get('archivo')) == bool(attrs.get('url')):
            raise serializers.ValidationError(
                'Cargá una foto o pegá una URL, pero no las dos cosas a la vez.'
            )
        return attrs


class CandidatoSerializer(serializers.ModelSerializer):
    """
    Converts Candidato instances to/from JSON for the REST API.

    Read-only fields (id, timestamps) are set automatically by the database
    and must not be sent in POST/PUT requests.
    """

    fotos = CandidatoFotoSerializer(many=True, read_only=True)

    class Meta:
        model = Candidato
        fields = [
            'id', 'nombre', 'especie', 'genero', 'edad', 'descripcion',
            'imagen', 'fotos', 'adoptado', 'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'fotos', 'fecha_creacion', 'fecha_actualizacion']

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
