import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('visitas', '0002_visita_comentario_final'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SolicitudVisita',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre_apellido', models.CharField(max_length=200)),
                ('email', models.EmailField(max_length=254)),
                ('telefono', models.CharField(blank=True, max_length=20, null=True)),
                ('motivo', models.TextField()),
                ('estado', models.CharField(
                    choices=[('revision', 'En revisión'), ('aceptada', 'Aceptada'), ('rechazada', 'Rechazada')],
                    default='revision',
                    max_length=20,
                )),
                ('fecha_visita', models.DateTimeField(blank=True, null=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('candidato', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='solicitudes',
                    to='candidatos.candidato',
                )),
                ('usuario', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='solicitudes_visita',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Solicitud de Visita',
                'verbose_name_plural': 'Solicitudes de Visita',
                'ordering': ['-fecha_creacion'],
            },
        ),
    ]
