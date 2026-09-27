"""
Tests for the visit flow.

The important one: accepting a request has to produce a real Visita. Until v2
it only flipped a flag on the request, so accepted requests never reached the
visits list and the shelter had to re-enter them by hand.
"""

from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APITestCase

from apps.candidatos.models import Candidato
from .models import SolicitudVisita, Visita


class SolicitudVisitaFlowTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.usuario = User.objects.create_user(
            username='ana@example.com', email='ana@example.com',
            password='secret1234', first_name='Ana Duarte',
        )
        cls.otro = User.objects.create_user(
            username='juan@example.com', email='juan@example.com', password='secret1234',
        )
        cls.admin = User.objects.create_user(
            username='staff@example.com', email='staff@example.com',
            password='secret1234', is_staff=True,
        )
        cls.candidato = Candidato.objects.create(
            nombre='Malena', especie='perro', genero='hembra', edad=3,
            descripcion='Mestiza tranquila.',
        )

    def setUp(self):
        self.solicitud = SolicitudVisita.objects.create(
            candidato=self.candidato, usuario=self.usuario,
            nombre_apellido='Ana Duarte', email='ana@example.com',
            telefono='2254 40-0000', motivo='Quiero conocerla.',
        )
        self.fecha = (timezone.now() + timedelta(days=3)).isoformat()

    # ── crear ───────────────────────────────────────────────────────────────

    def test_solicitar_visita_requiere_cuenta(self):
        respuesta = self.client.post(reverse('solicitud-list'), {
            'candidato': self.candidato.id, 'nombre_apellido': 'Anónimo',
            'email': 'anon@example.com', 'motivo': 'Quiero conocerla.',
        })

        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_la_solicitud_se_asocia_a_quien_la_manda(self):
        self.client.force_authenticate(self.usuario)

        respuesta = self.client.post(reverse('solicitud-list'), {
            'candidato': self.candidato.id, 'nombre_apellido': 'Ana Duarte',
            'email': 'ana@example.com', 'motivo': 'Me encantó su carita.',
        })

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SolicitudVisita.objects.get(pk=respuesta.data['id']).usuario, self.usuario)

    def test_cada_uno_ve_solo_sus_solicitudes(self):
        self.client.force_authenticate(self.otro)
        self.assertEqual(self.client.get(reverse('solicitud-list')).data['count'], 0)

        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get(reverse('solicitud-list')).data['count'], 1)

    # ── aceptar y rechazar ──────────────────────────────────────────────────

    def test_aceptar_crea_la_visita_y_la_deja_vinculada(self):
        self.client.force_authenticate(self.admin)

        respuesta = self.client.patch(
            reverse('solicitud-aceptar', args=[self.solicitud.id]),
            {'fecha_visita': self.fecha},
        )

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.solicitud.refresh_from_db()
        self.assertEqual(self.solicitud.estado, 'aceptada')

        self.assertEqual(Visita.objects.count(), 1)
        visita = Visita.objects.get()
        self.assertEqual(self.solicitud.visita, visita)
        self.assertEqual(visita.candidato, self.candidato)
        self.assertEqual(visita.usuario, self.usuario, 'La visita queda a nombre de quien la pidió')
        self.assertEqual(visita.visitante_nombre, 'Ana Duarte')

    def test_aceptar_dos_veces_mueve_la_fecha_en_vez_de_duplicar(self):
        self.client.force_authenticate(self.admin)
        url = reverse('solicitud-aceptar', args=[self.solicitud.id])
        nueva_fecha = (timezone.now() + timedelta(days=9)).isoformat()

        self.client.patch(url, {'fecha_visita': self.fecha})
        self.client.patch(url, {'fecha_visita': nueva_fecha})

        self.assertEqual(Visita.objects.count(), 1)

    def test_aceptar_sin_fecha_falla(self):
        self.client.force_authenticate(self.admin)

        respuesta = self.client.patch(reverse('solicitud-aceptar', args=[self.solicitud.id]), {})

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Visita.objects.count(), 0)

    def test_rechazar_cancela_la_visita_ya_agendada(self):
        self.client.force_authenticate(self.admin)
        self.client.patch(
            reverse('solicitud-aceptar', args=[self.solicitud.id]),
            {'fecha_visita': self.fecha},
        )

        self.client.patch(reverse('solicitud-rechazar', args=[self.solicitud.id]))

        self.solicitud.refresh_from_db()
        self.assertEqual(self.solicitud.estado, 'rechazada')
        self.assertEqual(self.solicitud.visita.estado, 'cancelada')

    def test_un_usuario_comun_no_puede_aceptar_ni_rechazar(self):
        self.client.force_authenticate(self.usuario)

        aceptar = self.client.patch(
            reverse('solicitud-aceptar', args=[self.solicitud.id]), {'fecha_visita': self.fecha},
        )
        rechazar = self.client.patch(reverse('solicitud-rechazar', args=[self.solicitud.id]))

        self.assertEqual(aceptar.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(rechazar.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Visita.objects.count(), 0)


class VisitaManualTests(APITestCase):
    """Visits the shelter books by hand, for people who may have no account."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username='staff@example.com', email='staff@example.com',
            password='secret1234', is_staff=True,
        )
        cls.usuario = User.objects.create_user(
            username='ana@example.com', email='ana@example.com',
            password='secret1234', first_name='Ana Duarte',
        )
        cls.candidato = Candidato.objects.create(
            nombre='Malena', especie='perro', genero='hembra', edad=3,
            descripcion='Mestiza tranquila.',
        )

    def test_se_puede_agendar_sin_usuario_asociado(self):
        self.client.force_authenticate(self.admin)

        respuesta = self.client.post(reverse('visita-list'), {
            'candidato': self.candidato.id,
            'fecha_visita': (timezone.now() + timedelta(days=2)).isoformat(),
            'visitante_nombre': 'Vecina del barrio',
            'visitante_email': 'vecina@example.com',
        })

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(Visita.objects.get().usuario)

    def test_un_usuario_comun_no_ve_ni_crea_visitas(self):
        self.client.force_authenticate(self.usuario)

        self.assertEqual(self.client.get(reverse('visita-list')).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            self.client.post(reverse('visita-list'), {}).status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_buscar_y_crear_usuarios_es_solo_de_admin(self):
        self.client.force_authenticate(self.usuario)

        self.assertEqual(
            self.client.get(reverse('buscar-usuarios'), {'q': 'ana'}).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post(reverse('crear-usuario'), {'email': 'x@y.com'}).status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_el_admin_busca_por_nombre_o_email(self):
        self.client.force_authenticate(self.admin)

        por_nombre = self.client.get(reverse('buscar-usuarios'), {'q': 'Duarte'})
        por_email = self.client.get(reverse('buscar-usuarios'), {'q': 'ana@'})
        muy_corto = self.client.get(reverse('buscar-usuarios'), {'q': 'a'})

        self.assertEqual(len(por_nombre.data), 1)
        self.assertEqual(len(por_email.data), 1)
        self.assertEqual(muy_corto.data, [], 'Una sola letra no dispara la búsqueda')

    def test_crear_cuenta_devuelve_la_contrasena_una_vez(self):
        self.client.force_authenticate(self.admin)

        respuesta = self.client.post(reverse('crear-usuario'), {
            'email': 'nueva@example.com', 'nombre': 'Persona Nueva',
        })

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        password = respuesta.data['password_temporal']
        self.assertTrue(password)

        creado = User.objects.get(email='nueva@example.com')
        self.assertFalse(creado.is_staff)
        self.assertTrue(creado.check_password(password), 'La contraseña devuelta tiene que servir')

    def test_no_se_duplica_una_cuenta_existente(self):
        self.client.force_authenticate(self.admin)

        respuesta = self.client.post(reverse('crear-usuario'), {'email': 'ana@example.com'})

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.filter(email='ana@example.com').count(), 1)
