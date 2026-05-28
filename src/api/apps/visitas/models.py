# Model for scheduled shelter visits.

from django.db import models
from apps.candidatos.models import Candidato


class Visita(models.Model):
    """
    Represents a planned visit by a potential adopter to meet a candidate.

    Lifecycle: planificada → realizada (after admin adds a final comment)
               planificada → cancelada (if the visit does not happen)

    The `comentario_final` field captures the admin's notes after the visit
    is completed and also triggers the status change to 'realizada'.
    """

    ESTADO_CHOICES = [
        ('planificada', 'Planificada'),
        ('realizada', 'Realizada'),
        ('cancelada', 'Cancelada'),
    ]

    candidato = models.ForeignKey(
        Candidato,
        on_delete=models.CASCADE,
        related_name='visitas',
    )
    fecha_visita = models.DateTimeField()
    visitante_nombre = models.CharField(max_length=100)
    visitante_email = models.EmailField()
    visitante_telefono = models.CharField(max_length=20, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='planificada')
    notas = models.TextField(blank=True, null=True)  # Pre-visit notes
    comentario_final = models.TextField(blank=True, null=True, verbose_name='Comentario Final')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['fecha_visita']  # Upcoming visits first
        verbose_name = 'Visita'
        verbose_name_plural = 'Visitas'

    def __str__(self):
        return f"Visit by {self.visitante_nombre} - {self.fecha_visita.strftime('%Y-%m-%d %H:%M')}"
