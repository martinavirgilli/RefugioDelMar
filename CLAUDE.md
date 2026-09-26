# Refugio del Mar — contexto del proyecto

App web full-stack para gestionar un refugio de animales (ficticio, inspirado en Pinamar, Argentina).
Nació como proyecto final de una diplomatura; ahora se está desarrollando la **v2** para mostrarla en un portafolio profesional (desarrollo full stack + datos + automatización con IA).

Autora: Martina. Prefiere guía directa y con opinión (no listas de opciones abiertas) y quiere **aprender durante el proceso**: explicá brevemente el qué y el porqué de cada cambio importante.

## Stack actual

- **Frontend:** React 19 + Vite 7 + React Router 7 + Tailwind CSS 4 (`@tailwindcss/vite`, tokens en `@theme` dentro de `src/index.css`). JS, sin TypeScript.
- **Backend:** Django 5 + Django REST Framework + JWT (`simplejwt`) + `django-cors-headers` + `whitenoise` + `gunicorn`. Configuración por `.env` con `django-environ`.
- **Base de datos:** PostgreSQL (`DATABASE_URL`). Hubo una versión MySQL (ver `backend/MIGRACION_MYSQL.md`), hoy inactiva.
- **Deploy v1:** Netlify (frontend, https://refugio-del-mar.netlify.app) + Render (backend). Hay Dockerfiles y `nginx.conf`.

## Estructura (v2, desde la Fase 0)

```
frontend/               ← app React (package.json, index.html, vite.config.js, Dockerfile, nginx.conf)
  src/
    App.jsx             ← árbol de rutas (públicas / ProtectedRoute / ProtectedAdminRoute)
    index.css           ← Tailwind + tokens de color en @theme
    components/         ← Button, Card, Badge, Input, EmptyState, Skeleton, Layout, Logo, VisitaCard, SolicitudAdminCard, SolicitudVisitaModal, rutas protegidas
    context/AuthContext.jsx   ← sesión (token y user en localStorage)
    pages/              ← Home, Login, Register, Candidatos, CandidatoDetail, NuevoCandidato, Visitas, NuevaVisita, MisSolicitudes, adopciones/*
    services/api.js     ← TODA la comunicación con el backend (apiRequest + parseErrorResponse + authService, candidatosService, adopcionesService, visitasService, solicitudesService)
backend/                ← API Django (manage.py, requirements.txt, Dockerfile, docker-compose.yml)
  apps/auth_app | candidatos | visitas | adopciones
  refugio_api/          ← settings, urls (solo API: ya no sirve el frontend)
docs/                   ← PLAN_V2.md, PROMPT_INICIAL.md
```

## Dominio

- **Candidato**: animal del refugio (nombre, especie, género, edad, descripción, imagen URL, `adoptado`).
- **SolicitudVisita**: un usuario pide conocer a un candidato. Estados: `revision → aceptada | rechazada`. Al aceptar, el admin fija `fecha_visita`.
- **Visita**: visita agendada (por admin o al aceptar una solicitud). Estados: `planificada → realizada | cancelada`. `comentario_final` la marca como realizada.
- **Adopcion**: modelo existente pero **sin uso**; hoy el historial se deriva de `Candidato.adoptado` + `fecha_actualizacion` (impreciso). Se corrige en la v2.
- Roles: usuario común (ve candidatos, crea solicitudes, ve las suyas) y admin (`is_staff`/`is_superuser`: todo lo demás).

## API (prefijo `/api/`)

`auth/login`, `auth/register`, `candidatos/` (+ `PATCH candidatos/{id}/adoptar/`), `visitas/` (+ `PATCH visitas/{id}/agregar_comentario/`), `visitas/solicitudes/` (+ `aceptar/`, `rechazar/`), `adopciones/resumen`, `adopciones/historial`, `token/`, `token/refresh/`. Filtros de candidatos por query: `search`, `especie`, `adoptado`.

## Comandos

- Frontend: `npm install`, `npm run dev`, `npm run build`, `npm run lint` (desde la carpeta del frontend).
- Backend (desde `backend/`): `python manage.py migrate`, `python manage.py runserver`, `python manage.py test`, o `make up` con Docker.
- Variables: frontend `VITE_API_URL` (default `http://localhost:8000`); backend `SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `JWT_SECRET_KEY`.

## Convenciones

- **Textos de la interfaz en español rioplatense (voseo):** "Iniciá sesión", "Conocé a…". Identificadores de dominio en español (candidato, visita, solicitud); el resto del código y los comentarios en inglés, como está hoy.
- Toda llamada HTTP pasa por `services/api.js`; no usar `fetch` suelto en componentes.
- Estilos con clases Tailwind y los tokens del `@theme`; no hardcodear colores hexadecimales en componentes.
- Componentes pequeños y reutilizables en `components/`; páginas en `pages/`.
- Accesibilidad: HTML semántico, `alt` en imágenes, foco visible, contraste AA, respetar `prefers-reduced-motion`.
- Permisos: nunca confiar en el frontend; cada acción de admin se valida en el backend.

## Paleta (se conserva en v2)

Petróleo/mar `#285360` · Arena `#F2EBE3` · Espuma `#F8F5F2` · Aqua claro `#B4D8D8` · Glacial `#5A8595` · Duna `#AB9172`. Detalle y ampliaciones en `docs/PLAN_V2.md`.

## Problemas conocidos de la v1 (a resolver en la v2)

1. `PATCH candidatos/{id}/adoptar/` **no valida que el usuario sea admin** (cualquier autenticado puede marcar adopciones).
2. `candidatosService.update` llama a `/api/candidatos/${id}` sin barra final y sin manejo de errores consistente; el manejo de errores está copiado en cada método.
3. El catálogo exige login para verse (mala experiencia para adoptantes nuevos).
4. `Adopcion` no se usa; fecha de adopción imprecisa.
5. Imagen de portada de 3.3 MB (`portada.png`); las imágenes de candidatos son URLs externas.
6. `README.md` con contenido duplicado/mezclado (inglés y español) y sin link de demo.
7. La app Django sirve además el frontend (`serve_frontend`) aunque el deploy real usa Netlify: código muerto que confunde.
8. Emojis como íconos, header oscuro genérico, sin identidad visual de Pinamar.

## Documentos de referencia

- `docs/PLAN_V2.md` — plan completo de la v2 (diseño, funcionalidades, automatización n8n, fases).
- `docs/PROMPT_INICIAL.md` — prompt de arranque para Claude Code.

## Reglas de trabajo

- Trabajar por **fases**, en una rama `v2`, con commits chicos y mensajes claros. Al terminar cada fase: build + lint + tests, resumen corto y **frenar para revisión**.
- No romper la demo v1 desplegada: la v2 se despliega aparte hasta estar lista.
- No commitear secretos ni `.env`. Credenciales de n8n y claves de API solo por variables de entorno.
- Ante una decisión de diseño con varias opciones válidas, elegir una, justificarla en una línea y seguir.
