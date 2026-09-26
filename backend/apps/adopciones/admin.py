from django.contrib import admin
from .models import Adopcion


@admin.register(Adopcion)
class AdopcionAdmin(admin.ModelAdmin):
    list_display = ('candidato', 'fecha_adopcion', 'adoptante_nombre', 'adoptante_email')
    list_filter = ('fecha_adopcion',)
    search_fields = ('candidato__nombre', 'adoptante_nombre', 'adoptante_email')
    readonly_fields = ('fecha_adopcion',)

