# Serializers for the candidatos app — JSON conversion and field validation.

from rest_framework import serializers

from .models import Candidato, CandidatoFoto, Resena


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


class ResenaSerializer(serializers.ModelSerializer):
    """
    A post-adoption review. The photo is optional, so unlike a gallery photo
    it may have no source at all.

    The candidate's name and cover photo come along read-only: the public list
    of reviews shows who the story is about without a second request.
    """

    src = serializers.SerializerMethodField()
    candidato_nombre = serializers.CharField(source='candidato.nombre', read_only=True)
    candidato_imagen = serializers.CharField(source='candidato.imagen', read_only=True)

    class Meta:
        model = Resena
        fields = [
            'id', 'candidato', 'candidato_nombre', 'candidato_imagen',
            'autor', 'texto', 'src', 'archivo', 'url', 'publicada', 'fecha_creacion',
        ]
        read_only_fields = ['id', 'candidato', 'fecha_creacion']
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
        """A photo is optional here, but it cannot come from both places."""
        if attrs.get('archivo') and attrs.get('url'):
            raise serializers.ValidationError(
                'Cargá una foto o pegá una URL, pero no las dos cosas a la vez.'
            )
        return attrs

    def validate_autor(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Poné quién cuenta la reseña.')
        return value.strip()

    def validate_texto(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('La reseña no puede estar vacía.')
        return value.strip()


class CandidatoSerializer(serializers.ModelSerializer):
    """
    Converts Candidato instances to/from JSON for the REST API.

    Read-only fields (id, timestamps) are set automatically by the database
    and must not be sent in POST/PUT requests.
    """

    fotos = CandidatoFotoSerializer(many=True, read_only=True)
    resenas = ResenaSerializer(many=True, read_only=True)
    solicitudes_pendientes = serializers.SerializerMethodField()

    class Meta:
        model = Candidato
        fields = [
            'id', 'nombre', 'especie', 'genero', 'etapa', 'descripcion',
            'imagen', 'fotos', 'resenas', 'apto_salida',
            'adoptado', 'fecha_adopcion', 'adoptante',
            'solicitudes_pendientes', 'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = [
            'id', 'fotos', 'resenas', 'solicitudes_pendientes',
            'fecha_creacion', 'fecha_actualizacion',
        ]

    def get_solicitudes_pendientes(self, obj):
        """
        How many people are waiting for an answer about this animal.

        Only the admin list annotates it (see CandidatoViewSet.get_queryset),
        so it is null everywhere else instead of firing one query per row.
        """
        return getattr(obj, 'pendientes', None)

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
