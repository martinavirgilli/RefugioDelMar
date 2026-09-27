# People offering to help the shelter without adopting.

from django.db import models


class Colaboracion(models.Model):
    """
    Someone who wants to volunteer or to foster an animal for a while.

    Both kinds share the same shape (contact details, availability, a message)
    and the same pipeline, so they live in one model with a `tipo` instead of
    two nearly identical tables.

    Lifecycle: nueva → contactada → aceptada, or archivada at any point.
    """

    TIPO_CHOICES = [
        ('voluntario', 'Voluntariado'),
        ('transito', 'Hogar de tránsito'),
    ]

    ESTADO_CHOICES = [
        ('nueva', 'Nueva'),
        ('contactada', 'Contactada'),
        ('aceptada', 'Aceptada'),
        ('archivada', 'Archivada'),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    nombre = models.CharField(max_length=200)
    email = models.EmailField()
    telefono = models.CharField(max_length=20, blank=True, null=True)
    disponibilidad = models.CharField(
        max_length=200,
        blank=True,
        help_text='Qué días o en qué horarios puede colaborar.',
    )
    mensaje = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='nueva')
    nota_interna = models.TextField(blank=True, help_text='Notas del equipo, no las ve quien se postula.')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Colaboración'
        verbose_name_plural = 'Colaboraciones'

    def __str__(self):
        return f"{self.get_tipo_display()} — {self.nombre} ({self.get_estado_display()})"
