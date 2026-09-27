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

from .models import Candidato


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
            edad=3,
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
            'edad': 1, 'descripcion': 'No debería poder crearse.',
        }

        self.assertEqual(self.client.post(self.list_url, payload).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.put(self.detail_url, payload).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(self.detail_url, {'edad': 9}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(self.detail_url).status_code, status.HTTP_403_FORBIDDEN)

        self.assertEqual(Candidato.objects.count(), 1)
        self.candidato.refresh_from_db()
        self.assertEqual(self.candidato.edad, 3)

    def test_admin_puede_crear_y_borrar(self):
        self.client.force_authenticate(self.admin)

        creado = self.client.post(self.list_url, {
            'nombre': 'Tuco', 'especie': 'gato', 'genero': 'macho',
            'edad': 2, 'descripcion': 'Apareció en el médano y se quedó.',
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
            nombre='Malena', especie='perro', genero='hembra', edad=3,
            descripcion='Mestiza tranquila.', adoptado=False,
        )
        cls.gato = Candidato.objects.create(
            nombre='Tuco', especie='gato', genero='macho', edad=1,
            descripcion='Naranja y conversador.', adoptado=False,
        )
        cls.adoptado = Candidato.objects.create(
            nombre='Otto', especie='perro', genero='macho', edad=5,
            descripcion='Ya encontró casa.', adoptado=True,
        )

    def test_anonimo_puede_ver_el_catalogo_y_una_ficha(self):
        listado = self.client.get(reverse('candidato-list'))
        detalle = self.client.get(reverse('candidato-detail', args=[self.perro.id]))

        self.assertEqual(listado.status_code, status.HTTP_200_OK)
        self.assertEqual(listado.data['count'], 3)
        self.assertEqual(detalle.status_code, status.HTTP_200_OK)
        self.assertEqual(detalle.data['nombre'], 'Malena')

    def test_anonimo_sigue_sin_poder_escribir(self):
        crear = self.client.post(reverse('candidato-list'), {
            'nombre': 'Intruso', 'especie': 'gato', 'genero': 'macho',
            'edad': 1, 'descripcion': 'No debería entrar.',
        })
        adoptar = self.client.patch(reverse('candidato-adoptar', args=[self.perro.id]))

        self.assertEqual(crear.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(adoptar.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Candidato.objects.count(), 3)

    def test_filtros_del_catalogo(self):
        url = reverse('candidato-list')

        self.assertEqual(self.client.get(url, {'especie': 'gato'}).data['count'], 1)
        self.assertEqual(self.client.get(url, {'genero': 'hembra'}).data['count'], 1)
        self.assertEqual(self.client.get(url, {'adoptado': 'false'}).data['count'], 2)
        self.assertEqual(self.client.get(url, {'adoptado': 'true'}).data['count'], 1)
        self.assertEqual(self.client.get(url, {'search': 'mal'}).data['count'], 1)

    def test_orden_por_antiguedad(self):
        url = reverse('candidato-list')

        recientes = self.client.get(url, {'orden': 'recientes'}).data['results']
        antiguos = self.client.get(url, {'orden': 'antiguos'}).data['results']

        self.assertEqual(recientes[0]['nombre'], 'Otto')
        self.assertEqual(antiguos[0]['nombre'], 'Malena')

    def test_paginacion_con_page_size(self):
        respuesta = self.client.get(reverse('candidato-list'), {'page_size': 2})

        self.assertEqual(len(respuesta.data['results']), 2)
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
