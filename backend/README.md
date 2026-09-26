# Backend — API Django de Refugio del Mar

API REST en Django 5.2 LTS + Django REST Framework. Es **solo API**: el frontend React vive en
[`../frontend`](../frontend) y se despliega aparte. Django no sirve HTML.

## Puesta en marcha

### Con Docker (levanta PostgreSQL y Django juntos)

```bash
cp .env.example .env     # completá SECRET_KEY
make up                  # o: docker compose up --build
make migrate
make superuser
```

### Sin Docker

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # completá SECRET_KEY y DATABASE_URL
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver         # http://localhost:8000
```

Hay dos scripts que generan el `.env` con una `SECRET_KEY` aleatoria:
`./setup_env.sh` (Linux/Mac) y `.\setup_env.ps1` (Windows).

## Tests

```bash
python manage.py test
```

Si no querés levantar PostgreSQL solo para correr los tests, apuntá a SQLite:

```bash
DATABASE_URL=sqlite:///dev.sqlite3 python manage.py test
```

`apps/candidatos/tests.py` cubre los permisos del catálogo: quién puede leer, quién puede escribir y,
sobre todo, que `PATCH /api/candidatos/{id}/adoptar/` sea exclusivo de admins.

## Estructura

```
apps/
  auth_app/      login y registro (JWT) + la clase de permiso IsAdmin
  candidatos/    animales del refugio (el catálogo)
  visitas/       visitas agendadas y solicitudes de visita
  adopciones/    endpoints de resumen e historial
refugio_api/     settings y urls
```

## Permisos

- `IsAuthenticated` es el permiso por defecto de toda la API (ver `REST_FRAMEWORK` en `settings.py`).
- `apps/auth_app/permissions.py` define `IsAdmin` (`is_staff` o `is_superuser`), que se aplica a cada
  acción de escritura. La regla se declara en `get_permissions()` del ViewSet, nunca dentro del método.

## Endpoints

| Método | Endpoint | Acceso |
|--------|----------|--------|
| POST | `/api/auth/login` · `/api/auth/register` | Público |
| POST | `/api/token/` · `/api/token/refresh/` | Público |
| GET | `/api/candidatos/` · `/api/candidatos/{id}/` | Autenticado |
| POST · PUT · PATCH · DELETE | `/api/candidatos/` · `/api/candidatos/{id}/` | Admin |
| PATCH | `/api/candidatos/{id}/adoptar/` | Admin |
| GET | `/api/adopciones/resumen` · `/api/adopciones/historial` | Autenticado |
| GET · POST · DELETE | `/api/visitas/` | Admin |
| PATCH | `/api/visitas/{id}/agregar_comentario/` | Admin |
| GET · POST | `/api/visitas/solicitudes/` | Autenticado (cada uno ve las suyas) |
| PATCH | `/api/visitas/solicitudes/{id}/aceptar/` · `/rechazar/` | Admin |

Filtros de `candidatos/` por query string: `search`, `especie`, `adoptado`.

Autenticación por header: `Authorization: Bearer <token>`.

## Modelos

- **Candidato** — `nombre`, `especie`, `genero`, `edad`, `descripcion`, `imagen` (URL), `adoptado`, timestamps.
- **Visita** — `candidato`, `fecha_visita`, datos del visitante, `estado` (planificada / realizada / cancelada),
  `notas`, `comentario_final`.
- **SolicitudVisita** — `candidato`, `usuario`, datos de contacto, `motivo`,
  `estado` (revisión / aceptada / rechazada), `fecha_visita`.
- **Adopcion** — existe pero todavía no se usa; hoy el historial se deriva de `Candidato.adoptado`.
  Se corrige en la Fase 3 del plan.

## Otros

- Admin de Django: http://localhost:8000/admin/
- Logs por consola, con los loggers `django` y `apps.*` (niveles configurables por `.env`).
- Hubo una versión sobre MySQL, hoy inactiva: ver [`MIGRACION_MYSQL.md`](MIGRACION_MYSQL.md).
- Notas de diagnóstico de la API: [`verificar_api.md`](verificar_api.md).
