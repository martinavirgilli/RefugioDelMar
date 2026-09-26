# Model for recording formal adoption events.
# Each Adopcion links one Candidato to an adopter and stores optional contact info.

from django.db import models
from apps.candidatos.models import Candidato


class Adopcion(models.Model):
    """
    Records a completed adoption.

    Linked to Candidato via a ForeignKey so a candidate's full adoption
    history is accessible through candidato.adopciones.all().
    """

    candidato = models.ForeignKey(
        Candidato,
        on_delete=models.CASCADE,
        related_name='adopciones',
    )
    fecha_adopcion = models.DateTimeField(auto_now_add=True)
    adoptante_nombre = models.CharField(max_length=100, blank=True, null=True)
    adoptante_email = models.EmailField(blank=True, null=True)
    notas = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-fecha_adopcion']  # Most recent first
        verbose_name = 'Adopción'
        verbose_name_plural = 'Adopciones'

    def __str__(self):
        return f"Adoption of {self.candidato.nombre} - {self.fecha_adopcion.strftime('%Y-%m-%d')}"
