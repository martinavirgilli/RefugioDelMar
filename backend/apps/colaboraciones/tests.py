"""
Tests for volunteer and foster-home offers.

The rule that matters: anyone can offer help without an account, but only the
shelter can read the list of people who did.
"""

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Colaboracion


class ColaboracionTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.usuario = User.objects.create_user(
            username='ana@example.com', email='ana@example.com', password='secret1234',
        )
        cls.admin = User.objects.create_user(
            username='staff@example.com', email='staff@example.com',
            password='secret1234', is_staff=True,
        )

    def setUp(self):
        self.colaboracion = Colaboracion.objects.create(
            tipo='voluntario', nombre='Ana Duarte', email='ana@example.com',
            mensaje='Puedo dar una mano los sábados.',
        )
        self.url = reverse('colaboracion-list')

    def test_cualquiera_puede_postularse_sin_cuenta(self):
        respuesta = self.client.post(self.url, {
            'tipo': 'transito', 'nombre': 'Camila R.', 'email': 'camila@example.com',
            'telefono': '2254 40-1111', 'disponibilidad': 'Fines de semana',
            'mensaje': 'Tengo lugar para un gato chiquito.',
        })

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Colaboracion.objects.count(), 2)
        self.assertEqual(respuesta.data['estado'], 'nueva')

    def test_la_postulacion_no_puede_elegir_su_propio_estado(self):
        respuesta = self.client.post(self.url, {
            'tipo': 'voluntario', 'nombre': 'Vivo', 'email': 'v@example.com',
            'mensaje': 'Hola.', 'estado': 'aceptada',
        })

        self.assertEqual(respuesta.data['estado'], 'nueva')

    def test_faltan_datos_obligatorios(self):
        respuesta = self.client.post(self.url, {'tipo': 'voluntario', 'nombre': '   '})

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_solo_el_refugio_ve_la_lista(self):
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.usuario)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)

    def test_el_admin_mueve_el_estado_y_deja_notas(self):
        self.client.force_authenticate(self.admin)

        respuesta = self.client.patch(
            reverse('colaboracion-detail', args=[self.colaboracion.id]),
            {'estado': 'contactada', 'nota_interna': 'La llamé el martes.'},
        )

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.colaboracion.refresh_from_db()
        self.assertEqual(self.colaboracion.estado, 'contactada')
        self.assertEqual(self.colaboracion.nota_interna, 'La llamé el martes.')

    def test_se_filtra_por_tipo_y_estado(self):
        Colaboracion.objects.create(
            tipo='transito', nombre='Otra', email='o@example.com', mensaje='Hola.',
            estado='aceptada',
        )
        self.client.force_authenticate(self.admin)

        self.assertEqual(self.client.get(self.url, {'tipo': 'transito'}).data['count'], 1)
        self.assertEqual(self.client.get(self.url, {'estado': 'nueva'}).data['count'], 1)

    def test_no_se_pueden_borrar(self):
        """Una postulación que no prosperó se archiva; el contacto no se tira."""
        self.client.force_authenticate(self.admin)

        respuesta = self.client.delete(reverse('colaboracion-detail', args=[self.colaboracion.id]))

        self.assertEqual(respuesta.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
