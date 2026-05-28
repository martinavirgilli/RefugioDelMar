from django.contrib import admin
from .models import Visita


@admin.register(Visita)
class VisitaAdmin(admin.ModelAdmin):
    list_display = ('visitante_nombre', 'candidato', 'fecha_visita', 'estado', 'fecha_creacion')
    list_filter = ('estado', 'fecha_visita', 'fecha_creacion')
    search_fields = ('visitante_nombre', 'visitante_email', 'candidato__nombre')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')

