# 🐾 Refugio del Mar

A full-stack web application for managing an animal shelter — built as a final portfolio project.

**Live demo:** _[link to your deployed app]_

---

## What is this?

Refugio del Mar is a shelter management system where staff can keep track of animals available for adoption, schedule visits from potential adopters, and monitor adoption statistics.

The application has two types of users:

- **Regular users** — can create an account, browse the available animals, view their profiles, and check adoption stats.
- **Admin users** — have full management access: they can add new animals, mark them as adopted, schedule and manage visits, and leave notes after a visit is completed.

---

## Features

- User registration and login with JWT authentication
- Animal candidate listing with search and filter by name, species, and status
- Individual animal profile pages
- Adoption summary dashboard (total, adopted, available)
- Adoption history log
- Scheduled visits management (admin)
- Responsive design — works on desktop and mobile

---

## Tech stack

| Layer          | Technology                                |
|----------------|-------------------------------------------|
| Frontend       | React 19, React Router, Tailwind CSS      |
| Backend        | Django 5, Django REST Framework           |
| Authentication | JWT (djangorestframework-simplejwt)       |
| Database       | PostgreSQL                                |
| Hosting        | Netlify (frontend) + Render (backend)     |

---

## How to use it

1. Open the app and click **Sign up** to create a free account.
2. Once logged in, go to **Candidates** to browse the animals at the shelter.
3. Click on any animal to see its full profile.
4. Head to **Adoptions** to see the summary and history of adoptions.

Admin features (visible only to staff accounts):
- **New Candidate** — register a new animal at the shelter.
- **Visits** — view all upcoming scheduled visits.
- **New Visit** — schedule a visit between a potential adopter and an animal.

---
---

# 🐾 Refugio del Mar

Una aplicación web full-stack para la gestión de un refugio de animales — desarrollada como proyecto final de portfolio.

**Demo en vivo:** _[link a tu app desplegada]_

---

## ¿De qué se trata?

Refugio del Mar es un sistema de gestión de refugio donde el personal puede llevar el registro de los animales disponibles para adopción, coordinar visitas de posibles adoptantes y hacer seguimiento de las estadísticas de adopción.

La aplicación tiene dos tipos de usuarios:

- **Usuarios regulares** — pueden crear una cuenta, explorar los animales disponibles, ver sus perfiles y consultar las estadísticas de adopción.
- **Usuarios administradores** — tienen acceso completo de gestión: pueden agregar nuevos animales, marcarlos como adoptados, programar y administrar visitas, y dejar comentarios una vez que una visita se concretó.

---

## Funcionalidades

- Registro de usuarios e inicio de sesión con autenticación JWT
- Listado de candidatos a adopción con búsqueda y filtros por nombre, especie y estado
- Perfiles individuales de cada animal
- Panel de resumen de adopciones (total, adoptados, disponibles)
- Historial de adopciones
- Gestión de visitas programadas (solo admin)
- Diseño responsive — funciona en escritorio y celular

---

## Tecnologías utilizadas

| Capa              | Tecnología                                |
|-------------------|-------------------------------------------|
| Frontend          | React 19, React Router, Tailwind CSS      |
| Backend           | Django 5, Django REST Framework           |
| Autenticación     | JWT (djangorestframework-simplejwt)       |
| Base de datos     | PostgreSQL                                |
| Hosting           | Netlify (frontend) + Render (backend)     |

---

## Cómo usarlo

1. Abrí la app y hacé clic en **Registrarse** para crear una cuenta gratuita.
2. Una vez dentro, andá a **Candidatos** para explorar los animales del refugio.
3. Hacé clic en cualquier animal para ver su perfil completo.
4. Entrá a **Adopciones** para ver el resumen e historial de adopciones.

Funciones de administrador (visibles solo para cuentas de staff):
- **Nuevo Candidato** — registrar un nuevo animal en el refugio.
- **Visitas** — ver todas las visitas próximas programadas.
- **Nueva Visita** — programar una visita entre un posible adoptante y un animal.
