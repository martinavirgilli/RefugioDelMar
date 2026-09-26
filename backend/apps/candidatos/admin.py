from django.contrib import admin
from .models import Candidato


@admin.register(Candidato)
class CandidatoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'especie', 'edad', 'adoptado', 'fecha_creacion')
    list_filter = ('especie', 'adoptado', 'fecha_creacion')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')

