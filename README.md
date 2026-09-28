# Refugio del Mar

**Una web que busca casa para animales de la calle, y el sistema con el que un refugio la sostiene.**

Aplicación full-stack de un refugio de animales ficticio, inspirado en Pinamar (Argentina).
React + Django REST, con dos caras: la pública, pensada para que alguien se enamore de un animal
y pida conocerlo, y la interna, donde el equipo del refugio gestiona fichas, visitas, adopciones
y quienes se ofrecen a ayudar.

**Demo (v1):** https://refugio-del-mar.netlify.app · La **v2** vive en la rama `v2`.

🇦🇷 Español (acá abajo) · 🇬🇧 [English version](#english)

---

## Por qué existe

Un animal en situación de calle no compite por atención: compite por visibilidad. La mayoría de
los refugios chicos trabajan con lo que tienen — un cuaderno, un grupo de WhatsApp, una cuenta de
Instagram que alcanza siempre a la misma gente — y un animal puede pasar meses esperando sin que
nadie fuera del barrio sepa que existe.

Este proyecto parte de una idea simple: **la tecnología puede ser la puerta de entrada**. Una ficha
bien hecha, con fotos, con su historia contada en serio y accesible desde cualquier teléfono, llega
a mucha más gente que un cartel en la puerta. Y si además el refugio puede organizar ahí mismo las
visitas, las adopciones y a los voluntarios, deja de perder tiempo en planillas y lo gasta donde
importa.

Por eso la app no es solo un catálogo lindo ni solo un panel de gestión: son las dos cosas, porque
un refugio necesita las dos para funcionar.

---

## Qué se puede hacer

### Si estás buscando adoptar

- **Ver el catálogo completo sin registrarte.** La cuenta se pide recién cuando querés pedir una
  visita, no para mirar.
- **Filtrar** por nombre, tipo de animal y sexo, y ordenar por quién lleva más tiempo esperando.
  Los filtros viven en la URL: un catálogo filtrado se puede compartir o volver a él con el botón Atrás.
- **Entrar a la ficha** de cada animal: carrusel de fotos navegable con flechas, puntos o teclado,
  su historia completa y el botón para pedir la visita ahí mismo.
- **Pedir una visita** contando por qué querés conocerlo. La respuesta siempre es la misma promesa:
  *"En breve un voluntario se pondrá en contacto"*. Nunca se le habla a nadie de rechazo.
- **Seguir tus pedidos** desde *Mis solicitudes*.
- **Un día afuera:** una iniciativa para llevarte un animal a pasear por el día sin adoptar. Venís al
  refugio, dejás tus datos, elegís con quién pasar el día y lo traés antes de que cierre.
- **Ver las adopciones:** cuántos encontraron casa, el desglose por especie, el ritmo de los últimos
  doce meses y lo que cuentan las familias que ya adoptaron.
- **Ayudar de otra forma:** anotarte como voluntario, ofrecer tu casa como hogar de tránsito o donar
  (link de Mercado Pago de demostración y la dirección para acercar cosas).

### Si sos del refugio

- **Panel de candidatos:** una lista densa con contadores, filtros por estado, etapa, tipo, sexo y
  "puede salir por el día", y en cada fila quién está esperando respuesta y cuántas fotos tiene la ficha.
- **Editar la ficha completa** desde la ficha misma: datos, galería (subiendo un archivo o pegando una
  URL), estado de adopción y reseñas. Se guarda por bloque, no todo junto.
- **Ficha interna de actividad:** quién pidió conocer al animal, qué visitas hay agendadas y cuáles ya
  pasaron, con los datos de contacto a mano. Coordinás la visita sin cambiar de pantalla.
- **Agendar visitas a mano** sin salir de la pantalla de Visitas, incluso para alguien que no tiene
  cuenta. El formulario autocompleta usuarios existentes y permite crear la cuenta en el momento, con
  una contraseña temporal que se muestra una sola vez.
- **Archivo de adoptados:** al marcar la adopción, la ficha sale del catálogo público y queda archivada,
  consultable solo por el refugio, con la fecha y quién adoptó.
- **Reseñas de adopción:** cargar lo que cuenta la familia meses después, con foto, y publicarlas u
  ocultarlas. Son las que se ven en la home y en /adopciones.
- **Gestionar colaboraciones:** las postulaciones de voluntariado y hogar de tránsito, con estados y
  notas internas.

---

## Decisiones que vale la pena mirar

Algunas cosas de este proyecto están hechas de una manera concreta por una razón concreta:

- **La ficha de un animal adoptado es interna.** Sale del catálogo y el detalle responde `404` a
  cualquiera que no sea del refugio. La regla vive en el *queryset* del backend, no en el frontend:
  esconder el botón no sirve si alguien escribe la URL a mano.
- **No hay edad en años, hay etapa de vida** (cachorro / joven / adulto). Un animal rescatado de la
  calle no tiene fecha de nacimiento; un número exacto sería una precisión inventada.
- **Las reseñas las carga el refugio**, no hay formulario público: no hay forma de verificar por
  internet que quien escribe es realmente quien adoptó.
- **La fecha de adopción es un campo propio.** Antes se deducía de `fecha_actualizacion`, así que
  cualquier edición de la ficha la corría sin querer.
- **Los permisos se validan siempre en el backend.** El frontend esconde botones por comodidad, nunca
  por seguridad. Hay tests que lo fijan: un usuario común recibe `403` en cada acción de administración.
- **Accesibilidad de verdad:** HTML semántico, foco visible, `alt` en las imágenes, contraste AA
  verificado con la fórmula de luminancia de WCAG (los ratios están documentados en `index.css`),
  carrusel y modales navegables por teclado y `prefers-reduced-motion` respetado.

---

## Stack

| Capa           | Tecnología                                                  |
|----------------|-------------------------------------------------------------|
| Frontend       | React 19, Vite 7, React Router 7, Tailwind CSS 4, lucide-react |
| Backend        | Django 5.2 LTS, Django REST Framework 3.16                   |
| Autenticación  | JWT (`djangorestframework-simplejwt`)                        |
| Base de datos  | PostgreSQL (SQLite para tests locales)                       |
| Imágenes       | Pillow (`ImageField`) + URLs externas                        |
| Deploy         | Netlify (frontend) + Render (backend)                        |

Sin TypeScript y sin librería de gráficos: el gráfico de adopciones por mes está hecho a mano, porque
doce barras no justifican sumar una dependencia.

---

## Estructura

```
frontend/   App React (Vite + Tailwind). Se despliega en Netlify.
  src/
    components/   Sistema de diseño (Button, Card, Badge, Input, Skeleton…) y piezas del dominio
    pages/        Una por pantalla; adopciones/ tiene sus propias subrutas
    context/      AuthContext: la sesión
    services/     api.js — TODA la comunicación con el backend pasa por acá
backend/    API REST en Django + DRF. Se despliega en Render.
  apps/       auth_app · candidatos · visitas · adopciones · colaboraciones
  refugio_api/  settings y urls (solo API: Django no sirve el frontend)
docs/       Plan de la v2 y notas de trabajo.
```

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
| `backend`  | `python manage.py test`    | Tests (44)                       |
| `backend`  | `make up` / `make down`    | Docker Compose                   |

Para correr los tests del backend sin levantar PostgreSQL:

```bash
DATABASE_URL=sqlite:///dev.sqlite3 python manage.py test
```

---

## API

Todos los endpoints cuelgan de `/api/`.

| Método | Endpoint                                              | Acceso   |
|--------|-------------------------------------------------------|----------|
| POST   | `auth/login`, `auth/register`                         | Público  |
| GET    | `candidatos/`, `candidatos/{id}/`, `candidatos/especies/` | Público |
| GET    | `candidatos/resenas/`                                 | Público  |
| POST/PUT/PATCH/DELETE | `candidatos/`, `candidatos/{id}/`      | Admin    |
| PATCH  | `candidatos/{id}/adoptar/`                            | Admin    |
| POST/DELETE | `candidatos/{id}/fotos/`                         | Admin    |
| GET/POST/PATCH/DELETE | `candidatos/{id}/resenas/`             | Admin    |
| GET    | `candidatos/{id}/actividad/`                          | Admin    |
| GET    | `auth/usuarios/buscar` · POST `auth/usuarios/crear`   | Admin    |
| GET    | `adopciones/resumen`, `adopciones/historial`          | Público  |
| GET/POST/DELETE | `visitas/`                                   | Admin    |
| PATCH  | `visitas/{id}/agregar_comentario/`                    | Admin    |
| GET/POST | `visitas/solicitudes/`                              | Autenticado (ve solo las suyas) |
| PATCH  | `visitas/solicitudes/{id}/aceptar/` · `/rechazar/`    | Admin    |
| POST   | `colaboraciones/`                                     | Público  |
| GET/PATCH | `colaboraciones/`                                  | Admin    |
| POST   | `token/`, `token/refresh/`                            | Público  |

Filtros de `candidatos/` por query string: `search`, `especie`, `genero`, `etapa`, `apto_salida`,
`orden` (`recientes` | `antiguos` | `nombre`), `page` y `page_size`.
`adoptado=true` es solo para el refugio: sin sesión de admin devuelve vacío.

---

## Roles

- **Visitante sin cuenta:** navega el catálogo, abre fichas, ve las adopciones y se postula como
  voluntario o tránsito.
- **Usuario registrado:** además pide visitas y sigue el estado de sus solicitudes.
- **Admin** (`is_staff` o `is_superuser`): todo lo demás — fichas, fotos, adopciones, reseñas, visitas,
  solicitudes y colaboraciones.

---

## Variables de entorno

Cada carpeta tiene su `.env.example` documentado. El `.env` real nunca se commitea.

- `frontend/.env.example` → `VITE_API_URL`
- `backend/.env.example` → `SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `JWT_SECRET_KEY`

---

## Sobre cómo se construyó

El proyecto nació como trabajo final de una diplomatura y la **v2** la desarrollé usando
**Claude Code como par de programación**, de forma deliberada: quería aprender a dirigir una IA en un
proyecto grande de verdad, no en ejercicios sueltos.

Eso significó trabajar como se trabaja en equipo: definir el alcance por fases, revisar cada cambio en
el navegador, discutir las decisiones de diseño y de datos antes de escribirlas, y pedir que cada regla
importante quedara cubierta por un test. La parte difícil no fue escribir el código: fue pensar cuántas
funcionalidades necesita una web que, además de mostrar animales, tiene que funcionar como el sistema de
gestión diario de un refugio, y sostener la coherencia entre las dos caras mientras crecía.

Todos los datos del proyecto — animales, personas, testimonios, direcciones, links de donación — son
**ficticios**.

---
---

# English

**A website that finds homes for street animals, and the system a shelter runs on.**

Full-stack application for a fictional animal shelter inspired by Pinamar, Argentina. React +
Django REST, with two faces: the public one, built so that someone falls for an animal and asks to
meet them, and the internal one, where the shelter manages records, visits, adoptions and the people
offering to help.

**Demo (v1):** https://refugio-del-mar.netlify.app · **v2** lives on the `v2` branch.

## Why it exists

An animal living on the street isn't competing for attention — it's competing for visibility. Most
small shelters work with what they have: a notebook, a WhatsApp group, an Instagram account that
always reaches the same people. An animal can wait for months without anyone outside the
neighbourhood knowing they exist.

This project starts from a simple idea: **technology can be the way in**. A well-made profile, with
photos and a story told properly, reachable from any phone, gets much further than a sign on the
shelter door. And if the shelter can also run its visits, adoptions and volunteers from the same
place, it stops losing time to spreadsheets and spends it where it matters.

That's why the app isn't just a pretty catalogue or just an admin panel: it's both, because a shelter
needs both to work.

## What you can do

**Looking to adopt:** browse the whole catalogue without an account (an account is only asked for
when you request a visit); filter by name, species and sex and sort by who has been waiting longest,
with the filters living in the URL so a filtered catalogue can be shared; open each animal's profile
with a keyboard-navigable photo carousel and request the visit right there; follow your requests;
read the adoption numbers and what adopting families wrote months later; take an animal out for the
day without adopting ("Un día afuera"); sign up as a volunteer or foster home, or donate.

**Working at the shelter:** a dense management panel with counters and filters, showing at a glance
who has people waiting for an answer; full inline editing of a profile, its photo gallery (upload a
file or paste a URL), its adoption status and its reviews; an internal activity card with every
request and visit for that animal and the contact details at hand; manual visit booking — including
for people with no account, creating one on the spot with a one-time temporary password; an archive
of adopted animals, visible only to the shelter; and a queue of volunteer and foster applications.

## Decisions worth a look

- **An adopted animal's profile is internal.** It leaves the catalogue and the detail endpoint answers
  `404` to anyone outside the shelter. The rule lives in the backend queryset, not the frontend:
  hiding a button is useless if someone types the URL.
- **No age in years — a life stage** (puppy / young / adult). A rescued street animal has no birth
  date, and a number would be invented precision.
- **Reviews are written by the shelter**, with no public form: there is no way to verify online that
  whoever writes really is the person who adopted.
- **The adoption date is its own field.** It used to be inferred from `fecha_actualizacion`, so any
  edit to the profile silently moved it.
- **Permissions are always enforced in the backend.** The frontend hides buttons for convenience,
  never for security, and tests lock it down: a regular user gets `403` on every admin action.
- **Real accessibility:** semantic HTML, visible focus, image `alt` text, AA contrast verified with the
  WCAG luminance formula (ratios documented in `index.css`), keyboard-navigable carousel and modals,
  and `prefers-reduced-motion` respected.

## Stack

React 19 · Vite 7 · React Router 7 · Tailwind CSS 4 · lucide-react — Django 5.2 LTS · Django REST
Framework 3.16 · JWT · PostgreSQL · Pillow · Netlify + Render. No TypeScript, and no charting
library: the twelve-month adoption chart is hand-rolled, because twelve bars don't justify a
dependency.

## Running it locally

Node 20+, Python 3.12+ and PostgreSQL (or Docker). See the Spanish section above for the exact
commands — they are the same: `pip install -r requirements.txt`, `manage.py migrate`,
`manage.py runserver` for the backend, and `npm install`, `npm run dev` for the frontend. Backend
tests run without PostgreSQL with `DATABASE_URL=sqlite:///dev.sqlite3 python manage.py test` (44 tests).

## How it was built

The project started as a final project for a postgraduate course, and I built **v2 using Claude Code
as a pair programmer**, on purpose: I wanted to learn how to direct an AI on a genuinely large
project rather than on isolated exercises.

That meant working the way a team works — scoping in phases, reviewing every change in the browser,
arguing through design and data decisions before writing them, and asking for a test behind every
rule that mattered. The hard part wasn't writing code: it was working out how many features a site
needs when, on top of showing animals, it has to serve as a shelter's day-to-day management system,
and keeping both faces coherent as it grew.

All data in the project — animals, people, testimonials, addresses, donation links — is **fictional**.
