from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('candidatos', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='candidato',
            name='genero',
            field=models.CharField(
                choices=[('macho', 'Macho'), ('hembra', 'Hembra'), ('desconocido', 'Desconocido')],
                default='desconocido',
                max_length=20,
            ),
        ),
    ]
