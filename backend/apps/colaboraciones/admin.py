from django.contrib import admin

from .models import Colaboracion


@admin.register(Colaboracion)
class ColaboracionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'estado', 'email', 'fecha_creacion')
    list_filter = ('tipo', 'estado')
    search_fields = ('nombre', 'email', 'mensaje')
