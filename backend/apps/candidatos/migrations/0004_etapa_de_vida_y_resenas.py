"""
Edad numérica → etapa de vida, y reseñas de adopción.

Un animal de la calle no tiene fecha de nacimiento, así que guardar un número
de años daba una precisión falsa. La etapa (cachorro / joven / adulto) dice lo
mismo que el refugio realmente sabe.

La conversión va entre el AddField y el RemoveField a propósito: si se borrara
la columna primero, los datos existentes se perderían antes de poder leerlos.
"""

import django.db.models.deletion
from django.db import migrations, models


def edad_a_etapa(apps, schema_editor):
    """Traduce los años cargados a mano en la etapa que les corresponde."""
    Candidato = apps.get_model('candidatos', 'Candidato')

    for candidato in Candidato.objects.all():
        if candidato.edad <= 1:
            candidato.etapa = 'cachorro'
        elif candidato.edad <= 5:
            candidato.etapa = 'joven'
        else:
            candidato.etapa = 'adulto'

        # La fecha de adopción vivía implícita en fecha_actualizacion. Es lo
        # mejor que hay para las filas viejas; desde ahora se guarda aparte.
        if candidato.adoptado and candidato.fecha_adopcion is None:
            candidato.fecha_adopcion = candidato.fecha_actualizacion.date()

        candidato.save(update_fields=['etapa', 'fecha_adopcion'])


def etapa_a_edad(apps, schema_editor):
    """
    Vuelta atrás: la edad exacta ya no existe, así que se guarda una edad
    representativa de cada etapa. Es una pérdida de información conocida.
    """
    Candidato = apps.get_model('candidatos', 'Candidato')
    EDAD_TIPICA = {'cachorro': 1, 'joven': 3, 'adulto': 8}

    for candidato in Candidato.objects.all():
        candidato.edad = EDAD_TIPICA.get(candidato.etapa, 3)
        candidato.save(update_fields=['edad'])


class Migration(migrations.Migration):

    dependencies = [
        ('candidatos', '0003_candidatofoto'),
    ]

    operations = [
        migrations.AddField(
            model_name='candidato',
            name='etapa',
            field=models.CharField(
                choices=[('cachorro', 'Cachorro'), ('joven', 'Joven'), ('adulto', 'Adulto')],
                default='adulto',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='candidato',
            name='apto_salida',
            field=models.BooleanField(
                default=False,
                help_text='Puede salir por el día con una persona que lo venga a buscar.',
            ),
        ),
        migrations.AddField(
            model_name='candidato',
            name='fecha_adopcion',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='candidato',
            name='adoptante',
            field=models.CharField(blank=True, max_length=120),
        ),

        migrations.RunPython(edad_a_etapa, etapa_a_edad),

        migrations.RemoveField(
            model_name='candidato',
            name='edad',
        ),

        migrations.CreateModel(
            name='Resena',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True, primary_key=True, serialize=False, verbose_name='ID',
                )),
                ('autor', models.CharField(
                    help_text='Quién la cuenta, como quiera aparecer: "Familia Ferreyra, Ostende".',
                    max_length=120,
                )),
                ('texto', models.TextField()),
                ('archivo', models.ImageField(blank=True, null=True, upload_to='resenas/%Y/%m/')),
                ('url', models.URLField(blank=True, null=True)),
                ('publicada', models.BooleanField(
                    default=True,
                    help_text='Si está apagado, la reseña queda guardada pero no se muestra.',
                )),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('candidato', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='resenas',
                    to='candidatos.candidato',
                )),
            ],
            options={
                'verbose_name': 'Reseña',
                'verbose_name_plural': 'Reseñas',
                'ordering': ['-fecha_creacion'],
            },
        ),
    ]
