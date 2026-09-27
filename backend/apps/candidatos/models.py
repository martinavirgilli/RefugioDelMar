# Data model for animals available (or previously available) for adoption.

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models


class Candidato(models.Model):
    """
    Represents an animal at the shelter that is a candidate for adoption.

    The `adoptado` flag is toggled when the animal finds a home. An adopted
    candidate is archived rather than deleted: it stays in the catalogue under
    "Ya encontraron casa" so its record can still be looked up.

    `imagen` is the cover photo; extra photos for the detail gallery live in
    the related CandidatoFoto rows.
    """

    GENERO_CHOICES = [
        ('macho', 'Macho'),
        ('hembra', 'Hembra'),
        ('desconocido', 'Desconocido'),
    ]

    nombre = models.CharField(max_length=100)
    especie = models.CharField(max_length=50)  # e.g. Perro, Gato, Conejo
    genero = models.CharField(max_length=20, choices=GENERO_CHOICES, default='desconocido')
    edad = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    descripcion = models.TextField()
    imagen = models.URLField(blank=True, null=True)  # External image URL (cover)
    adoptado = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_creacion']  # Newest first
        verbose_name = 'Candidato'
        verbose_name_plural = 'Candidatos'

    def __str__(self):
        return f"{self.nombre} - {self.especie}"


class CandidatoFoto(models.Model):
    """
    One photo of the gallery shown on a candidate's detail page.

    A photo comes from exactly one of two places: a file the shelter uploaded
    (`archivo`) or a link they pasted (`url`). Both are supported because the
    shelter often already has the photos hosted somewhere.

    Note for deployment: uploaded files live on the server's disk, which is
    wiped on every deploy on Render's free tier. Pasted URLs survive.
    """

    candidato = models.ForeignKey(
        'Candidato',
        on_delete=models.CASCADE,
        related_name='fotos',
    )
    archivo = models.ImageField(upload_to='candidatos/%Y/%m/', blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    alt = models.CharField(
        max_length=200,
        blank=True,
        help_text='Qué se ve en la foto, para quien usa lector de pantalla.',
    )
    orden = models.PositiveIntegerField(default=0)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['orden', 'id']
        verbose_name = 'Foto de candidato'
        verbose_name_plural = 'Fotos de candidatos'

    def clean(self):
        """A photo needs exactly one source: a file or a link, never both."""
        if bool(self.archivo) == bool(self.url):
            raise ValidationError(
                'Cargá una foto o pegá una URL, pero no las dos cosas a la vez.'
            )

    @property
    def src(self):
        """The path to render, whichever source this photo uses."""
        return self.archivo.url if self.archivo else self.url

    def __str__(self):
        return f"Foto {self.orden} de {self.candidato.nombre}"
