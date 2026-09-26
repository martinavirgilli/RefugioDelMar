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
