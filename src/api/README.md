# API Django - Refugio del Mar

API REST desarrollada en Django para la gestión del refugio de animales.

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose instalados
- Python 3.11+ (si quieres correr sin Docker)

### Configuración con Docker (Recomendado)

1. **Crear archivo `.env`**:
```bash
cp .env.example .env
```

2. **Editar `.env`** con tus valores:
```env
SECRET_KEY=tu-secret-key-super-seguro-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DB_NAME=refugio_db
DB_USER=refugio_user
DB_PASSWORD=refugio_pass
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

3. **Construir y levantar contenedores**:
```bash
docker-compose up --build
```

4. **Crear migraciones y aplicar**:
```bash
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

5. **Crear superusuario** (opcional, para admin):
```bash
docker-compose exec web python manage.py createsuperuser
```

6. **La API estará disponible en**: `http://localhost:8000`

### Configuración sin Docker

1. **Instalar dependencias**:
```bash
pip install -r requirements.txt
```

2. **Configurar base de datos PostgreSQL** (asegúrate de tener PostgreSQL corriendo)

3. **Crear archivo `.env`** (ver arriba)

4. **Aplicar migraciones**:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Crear superusuario**:
```bash
python manage.py createsuperuser
```

6. **Ejecutar servidor**:
```bash
python manage.py runserver
```

## 📚 Endpoints Disponibles

### Autenticación
- `POST /api/auth/login` - Login (retorna JWT token)
- `POST /api/token/` - Obtener token JWT (DRF)
- `POST /api/token/refresh/` - Refrescar token

### Candidatos (Requieren autenticación)
- `GET /api/candidatos/` - Listar todos
- `GET /api/candidatos/:id/` - Obtener uno
- `POST /api/candidatos/` - Crear
- `PUT /api/candidatos/:id/` - Actualizar completo
- `PATCH /api/candidatos/:id/` - Actualizar parcial
- `DELETE /api/candidatos/:id/` - Eliminar
- `PATCH /api/candidatos/:id/adoptar/` - Toggle estado adopción

### Adopciones (Requieren autenticación)
- `GET /api/adopciones/resumen` - Resumen estadístico
- `GET /api/adopciones/historial` - Historial completo

### Visitas (Requieren autenticación)
- `GET /api/visitas/` - Listar todas
- `GET /api/visitas/:id/` - Obtener una
- `POST /api/visitas/` - Crear
- `PUT /api/visitas/:id/` - Actualizar
- `DELETE /api/visitas/:id/` - Eliminar

## 🔐 Autenticación

Todos los endpoints (excepto login) requieren autenticación JWT. Incluye el token en el header:

```
Authorization: Bearer <tu-token>
```

## 🗄️ Modelos

### Candidato
- `nombre` (CharField)
- `especie` (CharField)
- `edad` (PositiveIntegerField)
- `descripcion` (TextField)
- `imagen` (URLField, opcional)
- `adoptado` (BooleanField)

### Adopcion
- `candidato` (ForeignKey a Candidato)
- `fecha_adopcion` (DateTimeField)
- `adoptante_nombre` (CharField)
- `adoptante_email` (EmailField)
- `notas` (TextField)

### Visita
- `candidato` (ForeignKey a Candidato)
- `fecha_visita` (DateTimeField)
- `visitante_nombre` (CharField)
- `visitante_email` (EmailField)
- `visitante_telefono` (CharField)
- `estado` (CharField: planificada, realizada, cancelada)
- `notas` (TextField)

## 🔒 Seguridad

- Variables sensibles en `.env`
- DEBUG=False en producción
- CORS configurado
- Validaciones en serializers
- Uso del ORM (sin raw SQL)
- JWT para autenticación

## 📝 Logging

Los logs se muestran en consola con formato:
```
{levelname} {asctime} {module} {message}
```

Loggers disponibles:
- `django` - Logs de Django
- `apps.*` - Logs de las aplicaciones

## 🧪 Testing

Para ejecutar tests:
```bash
docker-compose exec web python manage.py test
```

## 📖 Documentación Admin

Accede al admin de Django en: `http://localhost:8000/admin/`

