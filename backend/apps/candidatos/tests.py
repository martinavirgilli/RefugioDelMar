"""
Permission tests for the Candidato endpoints.

The v1 bug these tests lock down: `PATCH /api/candidatos/{id}/adoptar/` was
open to any authenticated user, so a regular visitor could mark any animal as
adopted. Every write action is now covered so the hole cannot reappear.
"""

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Candidato, Resena


class CandidatoPermissionsTests(APITestCase):
    """Checks who may read and who may write on /api/candidatos/."""

    @classmethod
    def setUpTestData(cls):
        cls.usuario = User.objects.create_user(
            username='ana@example.com', email='ana@example.com', password='secret1234',
        )
        cls.admin = User.objects.create_user(
            username='staff@example.com', email='staff@example.com', password='secret1234',
            is_staff=True,
        )

    def setUp(self):
        self.candidato = Candidato.objects.create(
            nombre='Malena',
            especie='perro',
            genero='hembra',
            etapa='joven',
            descripcion='Mestiza tranquila, rescatada en la playa.',
            adoptado=False,
        )
        self.detail_url = reverse('candidato-detail', args=[self.candidato.id])
        self.list_url = reverse('candidato-list')
        self.adoptar_url = reverse('candidato-adoptar', args=[self.candidato.id])

    # ── adoptar: the action that was unprotected in v1 ──────────────────────

    def test_adoptar_anonimo_devuelve_401(self):
        response = self.client.patch(self.adoptar_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.candidato.refresh_from_db()
        self.assertFalse(self.candidato.adoptado)

    def test_adoptar_usuario_comun_devuelve_403(self):
        self.client.force_authenticate(self.usuario)

        response = self.client.patch(self.adoptar_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.candidato.refresh_from_db()
        self.assertFalse(self.candidato.adoptado, 'A regular user must not be able to adopt')

    def test_adoptar_admin_devuelve_200_y_alterna_el_estado(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(self.adoptar_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['adoptado'])
        self.candidato.refresh_from_db()
        self.assertTrue(self.candidato.adoptado)

        # The action is a toggle: calling it again reverts the candidate
        self.client.patch(self.adoptar_url)
        self.candidato.refresh_from_db()
        self.assertFalse(self.candidato.adoptado)

    # ── the remaining write actions ─────────────────────────────────────────

    def test_usuario_comun_no_puede_crear_actualizar_ni_borrar(self):
        self.client.force_authenticate(self.usuario)
        payload = {
            'nombre': 'Intruso', 'especie': 'gato', 'genero': 'macho',
            'etapa': 'cachorro', 'descripcion': 'No debería poder crearse.',
        }

        self.assertEqual(self.client.post(self.list_url, payload).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.put(self.detail_url, payload).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(self.detail_url, {'etapa': 'adulto'}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(self.detail_url).status_code, status.HTTP_403_FORBIDDEN)

        self.assertEqual(Candidato.objects.count(), 1)
        self.candidato.refresh_from_db()
        self.assertEqual(self.candidato.etapa, 'joven')

    def test_admin_puede_crear_y_borrar(self):
        self.client.force_authenticate(self.admin)

        creado = self.client.post(self.list_url, {
            'nombre': 'Tuco', 'especie': 'gato', 'genero': 'macho',
            'etapa': 'joven', 'descripcion': 'Apareció en el médano y se quedó.',
        })
        self.assertEqual(creado.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Candidato.objects.count(), 2)

        borrado = self.client.delete(reverse('candidato-detail', args=[creado.data['id']]))
        self.assertEqual(borrado.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Candidato.objects.count(), 1)

    # ── reading stays open to any authenticated user ────────────────────────

    def test_usuario_comun_puede_leer_el_catalogo(self):
        self.client.force_authenticate(self.usuario)

        self.assertEqual(self.client.get(self.list_url).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(self.detail_url).status_code, status.HTTP_200_OK)


class CatalogoPublicoTests(APITestCase):
    """The catalogue opened up to visitors without an account (v2)."""

    @classmethod
    def setUpTestData(cls):
        cls.usuario = User.objects.create_user(
            username='ana@example.com', email='ana@example.com', password='secret1234',
        )
        cls.perro = Candidato.objects.create(
            nombre='Malena', especie='perro', genero='hembra', etapa='joven',
            descripcion='Mestiza tranquila.', adoptado=False,
        )
        cls.gato = Candidato.objects.create(
            nombre='Tuco', especie='gato', genero='macho', etapa='cachorro',
            descripcion='Naranja y conversador.', adoptado=False,
        )
        cls.adoptado = Candidato.objects.create(
            nombre='Otto', especie='perro', genero='macho', etapa='adulto',
            descripcion='Ya encontró casa.', adoptado=True,
        )

    def test_anonimo_puede_ver_el_catalogo_y_una_ficha(self):
        listado = self.client.get(reverse('candidato-list'))
        detalle = self.client.get(reverse('candidato-detail', args=[self.perro.id]))

        self.assertEqual(listado.status_code, status.HTTP_200_OK)
        self.assertEqual(listado.data['count'], 2, 'El adoptado no va en el catálogo público')
        self.assertEqual(detalle.status_code, status.HTTP_200_OK)
        self.assertEqual(detalle.data['nombre'], 'Malena')

    def test_anonimo_sigue_sin_poder_escribir(self):
        crear = self.client.post(reverse('candidato-list'), {
            'nombre': 'Intruso', 'especie': 'gato', 'genero': 'macho',
            'etapa': 'cachorro', 'descripcion': 'No debería entrar.',
        })
        adoptar = self.client.patch(reverse('candidato-adoptar', args=[self.perro.id]))

        self.assertEqual(crear.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(adoptar.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Candidato.objects.count(), 3)

    def test_filtros_del_catalogo(self):
        url = reverse('candidato-list')

        self.assertEqual(self.client.get(url, {'especie': 'gato'}).data['count'], 1)
        self.assertEqual(self.client.get(url, {'genero': 'hembra'}).data['count'], 1)
        # adoptado=true no sirve de nada sin sesión de admin: el archivo es interno
        self.assertEqual(self.client.get(url, {'adoptado': 'true'}).data['count'], 0)
        self.assertEqual(self.client.get(url, {'search': 'mal'}).data['count'], 1)

    def test_orden_por_antiguedad(self):
        url = reverse('candidato-list')

        recientes = self.client.get(url, {'orden': 'recientes'}).data['results']
        antiguos = self.client.get(url, {'orden': 'antiguos'}).data['results']

        self.assertEqual(recientes[0]['nombre'], 'Tuco')
        self.assertEqual(antiguos[0]['nombre'], 'Malena')

    def test_paginacion_con_page_size(self):
        respuesta = self.client.get(reverse('candidato-list'), {'page_size': 1})

        self.assertEqual(len(respuesta.data['results']), 1)
        self.assertIsNotNone(respuesta.data['next'])

    def test_especies_disponibles_para_el_filtro(self):
        respuesta = self.client.get(reverse('candidato-especies'))

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data, ['gato', 'perro'])

    def test_actividad_del_candidato_es_solo_de_admin(self):
        url = reverse('candidato-actividad', args=[self.perro.id])

        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.usuario)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)


class ArchivoDeAdoptadosTests(APITestCase):
    """
    La ficha de un adoptado es interna (v2).

    Sacarla del catálogo en el frontend no alcanzaría: alguien podría escribir
    la URL de la ficha a mano. La regla vive en el queryset, así que el detalle
    responde 404 a quien no sea del refugio.
    """

    @classmethod
    def setUpTestData(cls):
        cls.usuario = User.objects.create_user(
            username='ana@example.com', email='ana@example.com', password='secret1234',
        )
        cls.admin = User.objects.create_user(
            username='staff@example.com', email='staff@example.com', password='secret1234',
            is_staff=True,
        )
        cls.disponible = Candidato.objects.create(
            nombre='Malena', especie='perro', genero='hembra', etapa='joven',
            descripcion='Busca casa.', adoptado=False,
        )
        cls.adoptado = Candidato.objects.create(
            nombre='Otto', especie='perro', genero='macho', etapa='adulto',
            descripcion='Ya encontró casa.', adoptado=True,
        )

    def test_la_ficha_archivada_no_se_abre_sin_ser_del_refugio(self):
        url = reverse('candidato-detail', args=[self.adoptado.id])

        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(self.usuario)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

    def test_el_refugio_si_puede_abrir_la_ficha_archivada(self):
        self.client.force_authenticate(self.admin)

        respuesta = self.client.get(reverse('candidato-detail', args=[self.adoptado.id]))

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['nombre'], 'Otto')

    def test_el_admin_lista_el_archivo_y_el_visitante_no(self):
        url = reverse('candidato-list')

        self.assertEqual(self.client.get(url, {'adoptado': 'true'}).data['count'], 0)

        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get(url, {'adoptado': 'true'}).data['count'], 1)
        self.assertEqual(self.client.get(url).data['count'], 2)

    def test_adoptar_guarda_fecha_y_adoptante_y_revertir_los_limpia(self):
        self.client.force_authenticate(self.admin)
        url = reverse('candidato-adoptar', args=[self.disponible.id])

        self.client.patch(url, {'fecha_adopcion': '2026-03-14', 'adoptante': 'Familia Ferreyra'})
        self.disponible.refresh_from_db()
        self.assertTrue(self.disponible.adoptado)
        self.assertEqual(str(self.disponible.fecha_adopcion), '2026-03-14')
        self.assertEqual(self.disponible.adoptante, 'Familia Ferreyra')

        self.client.patch(url)
        self.disponible.refresh_from_db()
        self.assertFalse(self.disponible.adoptado)
        self.assertIsNone(self.disponible.fecha_adopcion, 'Revertir no puede dejar la fecha vieja')
        self.assertEqual(self.disponible.adoptante, '')

    def test_filtros_nuevos_de_etapa_y_salida(self):
        Candidato.objects.filter(pk=self.disponible.pk).update(apto_salida=True)
        url = reverse('candidato-list')

        self.assertEqual(self.client.get(url, {'etapa': 'joven'}).data['count'], 1)
        self.assertEqual(self.client.get(url, {'etapa': 'cachorro'}).data['count'], 0)
        self.assertEqual(self.client.get(url, {'apto_salida': 'true'}).data['count'], 1)


class ResenasTests(APITestCase):
    """
    Reseñas de adopción: las escribe el refugio, las lee cualquiera.

    Son la contracara del punto anterior: la ficha del adoptado se archiva,
    pero la historia que mandó la familia sí se muestra en público.
    """

    @classmethod
    def setUpTestData(cls):
        cls.usuario = User.objects.create_user(
            username='ana@example.com', email='ana@example.com', password='secret1234',
        )
        cls.admin = User.objects.create_user(
            username='staff@example.com', email='staff@example.com', password='secret1234',
            is_staff=True,
        )
        cls.adoptado = Candidato.objects.create(
            nombre='Otto', especie='perro', genero='macho', etapa='adulto',
            descripcion='Se fue con su familia.', adoptado=True,
        )
        cls.disponible = Candidato.objects.create(
            nombre='Malena', especie='perro', genero='hembra', etapa='joven',
            descripcion='Busca casa.', adoptado=False,
        )
        Resena.objects.create(
            candidato=cls.adoptado, autor='Familia Ferreyra',
            texto='Duerme al lado de la puerta esperando ir a la playa.',
        )
        Resena.objects.create(
            candidato=cls.adoptado, autor='Vecino', texto='Guardada, todavía no la mostramos.',
            publicada=False,
        )

    def test_las_publicadas_se_ven_sin_cuenta_y_las_guardadas_no(self):
        respuesta = self.client.get(reverse('candidato-resenas-publicas'))

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(respuesta.data), 1)
        self.assertEqual(respuesta.data[0]['autor'], 'Familia Ferreyra')
        self.assertEqual(respuesta.data[0]['candidato_nombre'], 'Otto')

    def test_solo_el_refugio_puede_escribir_una_resena(self):
        url = reverse('candidato-resenas', args=[self.adoptado.id])
        payload = {'autor': 'Alguien', 'texto': 'Intento de reseña.'}

        self.assertEqual(self.client.post(url, payload).status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.usuario)
        self.assertEqual(self.client.post(url, payload).status_code, status.HTTP_403_FORBIDDEN)

        self.assertEqual(Resena.objects.count(), 2)

    def test_el_admin_escribe_una_resena(self):
        self.client.force_authenticate(self.admin)

        respuesta = self.client.post(reverse('candidato-resenas', args=[self.adoptado.id]), {
            'autor': 'Jorge y Susana, Valeria del Mar',
            'texto': 'Nos acompaña a caminar por el médano todas las mañanas.',
        })

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.adoptado.resenas.count(), 3)

    def test_no_se_puede_reseñar_a_quien_todavia_busca_casa(self):
        self.client.force_authenticate(self.admin)

        respuesta = self.client.post(reverse('candidato-resenas', args=[self.disponible.id]), {
            'autor': 'Nadie', 'texto': 'Todavía no se fue con nadie.',
        })

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Resena.objects.count(), 2)

    def test_el_admin_despublica_y_borra(self):
        self.client.force_authenticate(self.admin)
        publicada = self.adoptado.resenas.get(autor='Familia Ferreyra')

        editar = self.client.patch(
            reverse('candidato-editar-resena', args=[self.adoptado.id, publicada.id]),
            {'publicada': False},
        )
        self.assertEqual(editar.status_code, status.HTTP_200_OK)
        publicada.refresh_from_db()
        self.assertFalse(publicada.publicada)

        # Despublicada, ya no sale en el listado público
        self.client.force_authenticate(None)
        self.assertEqual(len(self.client.get(reverse('candidato-resenas-publicas')).data), 0)

        self.client.force_authenticate(self.admin)
        borrar = self.client.delete(
            reverse('candidato-borrar-resena', args=[self.adoptado.id, publicada.id]),
        )
        self.assertEqual(borrar.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Resena.objects.count(), 1)
