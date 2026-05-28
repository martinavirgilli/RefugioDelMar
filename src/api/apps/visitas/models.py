# Models for shelter visits and visit requests.

from django.conf import settings
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


class SolicitudVisita(models.Model):
    """
    A visit request submitted by a regular user for a specific candidate.

    Lifecycle: revision → aceptada (admin sets a fecha_visita)
               revision → rechazada (admin rejects the request)
    """

    ESTADO_CHOICES = [
        ('revision', 'En revisión'),
        ('aceptada', 'Aceptada'),
        ('rechazada', 'Rechazada'),
    ]

    candidato = models.ForeignKey(
        Candidato,
        on_delete=models.CASCADE,
        related_name='solicitudes',
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solicitudes_visita',
    )
    nombre_apellido = models.CharField(max_length=200)
    email = models.EmailField()
    telefono = models.CharField(max_length=20, blank=True, null=True)
    motivo = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='revision')
    fecha_visita = models.DateTimeField(blank=True, null=True)  # Set by admin when accepting
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Solicitud de Visita'
        verbose_name_plural = 'Solicitudes de Visita'

    def __str__(self):
        return f"Request by {self.nombre_apellido} for {self.candidato.nombre} - {self.get_estado_display()}"
