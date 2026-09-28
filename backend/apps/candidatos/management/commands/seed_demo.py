"""
Carga la demo con datos ficticios.

    python manage.py seed_demo            # no hace nada si ya hay candidatos
    python manage.py seed_demo --force    # borra lo que haya y vuelve a cargar

Pensado para dejar la demo presentable después de crear una base nueva, y para
tener algo con qué trabajar en local sin cargar trece fichas a mano.

Sobre las cuentas: este comando **no crea ningún usuario administrador**. El
código es público, así que una contraseña de admin escrita acá sería una
contraseña de admin publicada, y cualquiera podría entrar a la demo y borrarla.
El admin se crea aparte, con `createsuperuser` y una contraseña propia.

Las dos personas que aparecen pidiendo visitas sí se crean, porque una solicitud
necesita un usuario asociado, pero con contraseña inutilizable: existen como
dato, no como cuenta con la que se pueda entrar.
"""

from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.candidatos.models import Candidato, CandidatoFoto, Resena
from apps.colaboraciones.models import Colaboracion
from apps.visitas.models import SolicitudVisita, Visita

# Las fotos viven en el frontend (frontend/public/demo/) y se referencian por
# URL, no como archivos subidos: en el plan gratuito de Render el disco del
# servicio se borra en cada deploy, así que un archivo subido desaparecería y la
# demo quedaría llena de imágenes rotas. Servidas por Netlify, sobreviven.
FOTOS_POR_DEFECTO = 'https://refugio-del-mar.netlify.app/demo'

DESCRIPCION_MALENA = (
    'Mestiza tranquila, apareció sola en la bajada 12. Camina al lado tuyo sin tirar y se '
    'lleva bien con otros perros.\n\n'
    'Le cuesta un poco la lluvia y los ruidos fuertes, pero se calma rápido si alguien se '
    'sienta al lado.'
)

# nombre, especie, genero, etapa, adoptado, apto_salida, foto, descripción
CANDIDATOS = [
    ("Malena", "perro", "hembra", "joven", False, True, "candidato5.jpg",
     DESCRIPCION_MALENA),
    ("Rocco", "perro", "macho", "adulto", False, True, "candidato1.jpg",
     "Grandote y de carácter blando. Busca una casa con patio y gente que no se asuste por "
     "su tamaño."),
    ("Nina", "perro", "hembra", "joven", False, True, "candidato2.jpg",
     "Curiosa y sociable. Le encanta la playa y saluda a todo el mundo. Ideal para una "
     "familia activa."),
    ("Tuco", "gato", "macho", "cachorro", False, False, "candidato7.jpg",
     "Naranja, peludo y conversador. Se adapta bien a departamentos y duerme donde le dé el sol."),
    ("Bruno", "perro", "macho", "adulto", False, True, "candidato3.jpg",
     "Nuestro veterano. Tranquilo, agradecido y con la mejor cara del refugio. Merece una "
     "jubilación en casa."),
    ("Lola", "perro", "hembra", "joven", False, True, "candidato4.jpg",
     "Llegó flaquita y desconfiada. Hoy es la primera en saludar cuando alguien entra al patio."),
    ("Pipa", "gato", "hembra", "cachorro", False, False, "candidato8.jpg",
     "Gatita atigrada, curiosa y sin miedo. Se lleva bien con otros gatos y ya usa la bandeja "
     "sin problemas."),
    ("Kira", "conejo", "hembra", "cachorro", False, False, "candidato9.jpg",
     "Coneja gris de orejas caídas. Tranquila y muy limpia; necesita una casa que sepa que un "
     "conejo no es un juguete."),
    ("Otto", "perro", "macho", "joven", True, False, "candidato6.jpg",
     "Se fue con su familia en agosto. Su ficha queda archivada como parte de la historia "
     "del refugio."),
    ("Frida", "gato", "hembra", "joven", True, False, "candidato7.jpg",
     "Adoptada por una pareja de Valeria del Mar. Mandan fotos todos los meses."),
    ("Cosmo", "perro", "macho", "joven", True, False, "candidato1.jpg",
     "Se fue con una familia de Cariló que ya había adoptado acá."),
    ("Uma", "perro", "hembra", "cachorro", True, False, "candidato4.jpg",
     "La adoptó una veterinaria de Pinamar que la atendió cuando llegó."),
    ("Nube", "gato", "hembra", "joven", True, False, "candidato8.jpg",
     "Vivía en el techo del refugio hasta que alguien se enamoró de ella."),
]

# Fotos extra de la galería, para que el carrusel tenga qué pasar
GALERIA = {
    "Malena": ["candidato2.jpg", "candidato4.jpg"],
    "Nina": ["candidato5.jpg", "candidato1.jpg"],
    "Rocco": ["candidato3.jpg"],
    "Tuco": ["candidato8.jpg"],
    "Lola": ["candidato6.jpg"],
}

# candidato, meses atrás en que se fue, quién adoptó
ADOPCIONES = [
    ("Otto", 1, "Familia Ferreyra, Ostende"),
    ("Frida", 2, "Lucía y Pablo, Valeria del Mar"),
    ("Cosmo", 4, "Familia Quiroga, Cariló"),
    ("Uma", 7, "Vet. Soledad Ibarra, Pinamar"),
    ("Nube", 9, "Camila Ríos, Pinamar centro"),
]

# candidato, autor, texto
RESENAS = [
    ("Otto", "Familia Ferreyra, Ostende",
     "Lo fuimos a conocer “solo para ver” y volvimos con él el sábado siguiente. Duerme al "
     "lado de la puerta esperando que alguien proponga ir a la playa."),
    ("Frida", "Lucía y Pablo, Valeria del Mar",
     "Vivimos en un departamento chico y teníamos miedo de que no le alcanzara el espacio. "
     "Se adueñó del sillón, de la ventana y de nosotros en dos días."),
    ("Cosmo", "Familia Quiroga, Cariló",
     "Es el tercero que adoptamos en el refugio y el más compañero de todos. Nos acompaña a "
     "caminar por el médano todas las mañanas."),
    ("Uma", "Vet. Soledad Ibarra, Pinamar",
     "La atendí el día que llegó al refugio y no me la pude sacar de la cabeza. Todavía "
     "guarda la costumbre de dormir abajo del escritorio."),
]

COLABORACIONES = [
    ("voluntario", "Sofía Marchetti", "sofia@ejemplo.test", "2254 40-1122", "Sábados a la mañana",
     "Vivo a diez cuadras del refugio y puedo ayudar con paseos y baños. Tengo dos perros propios.",
     "nueva"),
    ("transito", "Martín Aguirre", "martin@ejemplo.test", "2254 40-3344", "Todo el verano",
     "Tengo una casa con patio cerrado en Ostende y podría recibir a un perro chico o mediano "
     "mientras se recupera.", "nueva"),
    ("voluntario", "Lucía Benítez", "lucia@ejemplo.test", "", "Miércoles y viernes",
     "Soy fotógrafa y me ofrezco a sacar las fotos de las fichas, así se ven mejor en la web.",
     "contactada"),
    ("transito", "Familia Ferreyra", "ferreyra@ejemplo.test", "2254 40-5566", "Fines de semana largos",
     "Ya adoptamos a Otto y nos gustaría hacer tránsito de gatitos.", "aceptada"),
]


class Command(BaseCommand):
    help = 'Carga la base con los datos ficticios de la demo.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Borra los candidatos y colaboraciones que ya existan antes de cargar.',
        )
        parser.add_argument(
            '--fotos-base',
            default=FOTOS_POR_DEFECTO,
            help='De dónde salen las fotos de la demo. Por defecto, el sitio en Netlify.',
        )

    @transaction.atomic
    def handle(self, *args, **opciones):
        if Candidato.objects.exists() and not opciones['force']:
            self.stdout.write(self.style.WARNING(
                f'Ya hay {Candidato.objects.count()} candidatos cargados. '
                'Usá --force si querés borrarlos y volver a empezar.'
            ))
            return

        if opciones['force']:
            # Las fotos, reseñas, visitas y solicitudes se van en cascada
            Candidato.objects.all().delete()
            Colaboracion.objects.all().delete()
            self.stdout.write('Datos anteriores borrados.')

        base = opciones['fotos_base'].rstrip('/')

        creados = {}
        for nombre, especie, genero, etapa, adoptado, salida, foto, descripcion in CANDIDATOS:
            creados[nombre] = Candidato.objects.create(
                nombre=nombre, especie=especie, genero=genero, etapa=etapa,
                descripcion=descripcion, imagen=f'{base}/{foto}',
                adoptado=adoptado, apto_salida=salida,
            )

        for nombre, fotos in GALERIA.items():
            for orden, foto in enumerate(fotos):
                CandidatoFoto.objects.create(
                    candidato=creados[nombre], url=f'{base}/{foto}', orden=orden,
                    alt=f'{nombre} en el patio del refugio',
                )

        hoy = date.today()
        for nombre, meses_atras, adoptante in ADOPCIONES:
            Candidato.objects.filter(pk=creados[nombre].pk).update(
                fecha_adopcion=hoy - timedelta(days=meses_atras * 30),
                adoptante=adoptante,
            )

        for nombre, autor, texto in RESENAS:
            Resena.objects.create(candidato=creados[nombre], autor=autor, texto=texto)

        for tipo, nombre, email, telefono, disponibilidad, mensaje, estado in COLABORACIONES:
            Colaboracion.objects.create(
                tipo=tipo, nombre=nombre, email=email, telefono=telefono or None,
                disponibilidad=disponibilidad, mensaje=mensaje, estado=estado,
            )

        # Personas que pidieron una visita. Sin contraseña utilizable: son parte
        # de los datos de ejemplo, no cuentas con las que se pueda entrar.
        ana = self._persona_de_ejemplo('ana@ejemplo.test', 'Ana Duarte')
        camila = self._persona_de_ejemplo('camila@ejemplo.test', 'Camila Ríos')

        SolicitudVisita.objects.create(
            candidato=creados['Bruno'], usuario=ana,
            nombre_apellido='Ana Duarte', email=ana.email, telefono='2254 40-7788',
            motivo='Vi su foto y no me lo puedo sacar de la cabeza. Tengo patio y tiempo.',
        )
        SolicitudVisita.objects.create(
            candidato=creados['Malena'], usuario=camila,
            nombre_apellido='Camila Ríos', email=camila.email,
            motivo='Busco una perra tranquila para un departamento.',
        )
        Visita.objects.create(
            candidato=creados['Lola'], usuario=None,
            fecha_visita=timezone.now() + timedelta(days=2),
            visitante_nombre='Vecino de la vuelta', visitante_email='vecino@ejemplo.test',
            visitante_telefono='2254 40-9900',
            notas='Llamó por teléfono. No tiene cuenta en la web.',
        )

        self.stdout.write(self.style.SUCCESS(
            f'Listo: {Candidato.objects.count()} candidatos '
            f'({Candidato.objects.filter(adoptado=True).count()} archivados), '
            f'{CandidatoFoto.objects.count()} fotos de galería, '
            f'{Resena.objects.count()} reseñas, '
            f'{SolicitudVisita.objects.count()} solicitudes, '
            f'{Visita.objects.count()} visita agendada, '
            f'{Colaboracion.objects.count()} colaboraciones.'
        ))
        self.stdout.write(
            'Falta el usuario administrador: crealo con "python manage.py createsuperuser".'
        )

    def _persona_de_ejemplo(self, email, nombre):
        """Un usuario que existe como dato pero con el que no se puede entrar."""
        usuario, creado = User.objects.get_or_create(
            username=email,
            defaults={'email': email, 'first_name': nombre},
        )
        if creado:
            usuario.set_unusable_password()
            usuario.save(update_fields=['password'])
        return usuario
