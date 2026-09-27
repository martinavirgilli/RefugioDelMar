# Data model for animals available (or previously available) for adoption.

from django.core.exceptions import ValidationError
from django.db import models


class Candidato(models.Model):
    """
    Represents an animal at the shelter that is a candidate for adoption.

    Most of these animals came off the street, so nobody knows their exact
    age: instead of a number, `etapa` records the life stage the vet
    estimated (cachorro / joven / adulto).

    The `adoptado` flag is toggled when the animal finds a home. An adopted
    candidate is archived rather than deleted: its record leaves the public
    catalogue but stays available to the shelter, with the adoption date and
    the adopter's name for the record.

    `imagen` is the cover photo; extra photos for the detail gallery live in
    the related CandidatoFoto rows.
    """

    GENERO_CHOICES = [
        ('macho', 'Macho'),
        ('hembra', 'Hembra'),
        ('desconocido', 'Desconocido'),
    ]

    # Estimated life stage. A street animal has no birth date, so this is as
    # precise as the shelter can honestly be.
    ETAPA_CHOICES = [
        ('cachorro', 'Cachorro'),
        ('joven', 'Joven'),
        ('adulto', 'Adulto'),
    ]

    nombre = models.CharField(max_length=100)
    especie = models.CharField(max_length=50)  # e.g. Perro, Gato, Conejo
    genero = models.CharField(max_length=20, choices=GENERO_CHOICES, default='desconocido')
    etapa = models.CharField(max_length=20, choices=ETAPA_CHOICES, default='adulto')
    descripcion = models.TextField()
    imagen = models.URLField(blank=True, null=True)  # External image URL (cover)

    # "Un día afuera": the shelter marks who can spend a day out with a
    # visitor. Not every animal is ready for it, so it is opt-in per animal.
    apto_salida = models.BooleanField(
        default=False,
        help_text='Puede salir por el día con una persona que lo venga a buscar.',
    )

    adoptado = models.BooleanField(default=False)
    # Set when the animal is marked as adopted. Kept as its own field because
    # fecha_actualizacion moves on every edit and made the date unreliable.
    fecha_adopcion = models.DateField(blank=True, null=True)
    adoptante = models.CharField(max_length=120, blank=True)

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
        """A gallery photo needs exactly one source: a file or a link."""
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


class Resena(models.Model):
    """
    How it went after the adoption, told by the family that adopted.

    The shelter writes these down from what the adopter sends them (a
    message, a photo), so they are created from the admin side rather than
    submitted through a public form: there is no way to verify online that
    whoever writes is really the person who adopted.

    `publicada` lets the shelter hold one back without deleting it.
    """

    candidato = models.ForeignKey(
        'Candidato',
        on_delete=models.CASCADE,
        related_name='resenas',
    )
    autor = models.CharField(
        max_length=120,
        help_text='Quién la cuenta, como quiera aparecer: "Familia Ferreyra, Ostende".',
    )
    texto = models.TextField()
    # A photo is optional here: some families send a message and no picture.
    archivo = models.ImageField(upload_to='resenas/%Y/%m/', blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    publicada = models.BooleanField(
        default=True,
        help_text='Si está apagado, la reseña queda guardada pero no se muestra.',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Reseña'
        verbose_name_plural = 'Reseñas'

    def clean(self):
        """The photo is optional, but it cannot come from both places at once."""
        if self.archivo and self.url:
            raise ValidationError(
                'Cargá una foto o pegá una URL, pero no las dos cosas a la vez.'
            )

    @property
    def src(self):
        """The photo to render, or None when the family sent only a message."""
        if self.archivo:
            return self.archivo.url
        return self.url or None

    def __str__(self):
        return f"Reseña de {self.candidato.nombre} por {self.autor}"
