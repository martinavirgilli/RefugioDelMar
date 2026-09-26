# Refugio del Mar

Aplicación web full-stack para gestionar un refugio de animales ficticio, inspirado en Pinamar (Argentina).
Los adoptantes conocen a los animales y piden una visita; el equipo del refugio gestiona candidatos,
solicitudes y visitas.

**Demo (v1):** https://refugio-del-mar.netlify.app

> Este repositorio está en desarrollo de la **v2**: rediseño completo, catálogo público, panel de métricas
> y automatización con n8n + IA. El plan está en [`docs/PLAN_V2.md`](docs/PLAN_V2.md).

---

## Estructura

```
frontend/   App React (Vite + Tailwind). Se despliega en Netlify.
backend/    API REST en Django + DRF. Se despliega en Render.
docs/       Plan de la v2 y notas de trabajo.
```

El frontend y el backend son dos aplicaciones independientes que se comunican solo por HTTP:
Django no sirve el frontend.

---

## Stack

| Capa            | Tecnología                                          |
|-----------------|-----------------------------------------------------|
| Frontend        | React 19, Vite 7, React Router 7, Tailwind CSS 4     |
| Backend         | Django 5.2 LTS, Django REST Framework 3.16           |
| Autenticación   | JWT (djangorestframework-simplejwt)                  |
| Base de datos   | PostgreSQL                                           |
| Deploy          | Netlify (frontend) + Render (backend)                |

---

## Cómo levantarlo en local

Hacen falta Node 20+, Python 3.12+ y PostgreSQL (o Docker).

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # completá SECRET_KEY y DATABASE_URL
python manage.py migrate
python manage.py createsuperuser   # para poder entrar como admin
python manage.py runserver         # http://localhost:8000
```

Con Docker, desde `backend/`: `make up` (levanta PostgreSQL + Django).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local         # VITE_API_URL=http://localhost:8000
npm run dev                        # http://localhost:5173
```

---

## Comandos

| Carpeta    | Comando                    | Qué hace                         |
|------------|----------------------------|----------------------------------|
| `frontend` | `npm run dev`              | Servidor de desarrollo           |
| `frontend` | `npm run build`            | Build de producción en `dist/`   |
| `frontend` | `npm run lint`             | ESLint                           |
| `backend`  | `python manage.py check`   | Chequeo de configuración         |
| `backend`  | `python manage.py test`    | Tests                            |
| `backend`  | `make up` / `make down`    | Docker Compose                   |

Para correr los tests del backend sin levantar PostgreSQL:

```bash
DATABASE_URL=sqlite:///dev.sqlite3 python manage.py test
```

---

## API

Todos los endpoints cuelgan de `/api/`.

| Método | Endpoint                                  | Acceso          |
|--------|-------------------------------------------|-----------------|
| POST   | `auth/login`, `auth/register`             | Público         |
| GET    | `candidatos/`, `candidatos/{id}/`         | Autenticado     |
| POST/PUT/DELETE | `candidatos/`, `candidatos/{id}/`| Admin           |
| PATCH  | `candidatos/{id}/adoptar/`                | Admin           |
| GET    | `adopciones/resumen`, `adopciones/historial` | Autenticado  |
| GET/POST/DELETE | `visitas/`                       | Admin           |
| PATCH  | `visitas/{id}/agregar_comentario/`        | Admin           |
| GET/POST | `visitas/solicitudes/`                  | Autenticado (ve solo las suyas) |
| PATCH  | `visitas/solicitudes/{id}/aceptar/` · `/rechazar/` | Admin  |
| POST   | `token/`, `token/refresh/`                | Público         |

Filtros de `candidatos/` por query string: `search`, `especie`, `adoptado`.

---

## Roles

- **Usuario común:** navega el catálogo, ve el detalle de cada animal y pide visitas.
- **Admin** (`is_staff` o `is_superuser`): además carga y edita candidatos, marca adopciones,
  agenda visitas y acepta o rechaza solicitudes.

Los permisos se validan siempre en el backend: el frontend solo esconde botones.

---

## Variables de entorno

Cada carpeta tiene su `.env.example` documentado. El `.env` real nunca se commitea.

- `frontend/.env.example` → `VITE_API_URL`
- `backend/.env.example` → `SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `JWT_SECRET_KEY`

---

Los datos del proyecto (animales, personas, testimonios) son **ficticios**.
