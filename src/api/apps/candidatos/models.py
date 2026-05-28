# Data model for animals available (or previously available) for adoption.

from django.db import models
from django.core.validators import MinValueValidator


class Candidato(models.Model):
    """
    Represents an animal at the shelter that is a candidate for adoption.

    The `adoptado` flag is toggled when the animal finds a home.
    `fecha_actualizacion` is used as a proxy for adoption date in the
    adoption history view (since no separate adoption event is stored).
    """

    nombre = models.CharField(max_length=100)
    especie = models.CharField(max_length=50)  # e.g. Perro, Gato, Conejo
    edad = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    descripcion = models.TextField()
    imagen = models.URLField(blank=True, null=True)  # External image URL
    adoptado = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_creacion']  # Newest first
        verbose_name = 'Candidato'
        verbose_name_plural = 'Candidatos'

    def __str__(self):
        return f"{self.nombre} - {self.especie}"
