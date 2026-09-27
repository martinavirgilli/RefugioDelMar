from django.contrib import admin

from .models import Candidato, CandidatoFoto, Resena


class CandidatoFotoInline(admin.TabularInline):
    model = CandidatoFoto
    extra = 1


class ResenaInline(admin.TabularInline):
    model = Resena
    extra = 0


@admin.register(Candidato)
class CandidatoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'especie', 'etapa', 'adoptado', 'apto_salida', 'fecha_creacion')
    list_filter = ('especie', 'etapa', 'adoptado', 'apto_salida', 'fecha_creacion')
    search_fields = ('nombre', 'descripcion', 'adoptante')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')
    inlines = [CandidatoFotoInline, ResenaInline]


@admin.register(Resena)
class ResenaAdmin(admin.ModelAdmin):
    list_display = ('candidato', 'autor', 'publicada', 'fecha_creacion')
    list_filter = ('publicada',)
    search_fields = ('autor', 'texto')
