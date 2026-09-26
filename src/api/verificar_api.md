# Verificación de la API

## Pasos para Diagnosticar el Problema

### 1. Verificar que las migraciones estén aplicadas

```bash
cd src/api
docker-compose exec web python manage.py showmigrations
```

Deberías ver todas las migraciones con `[X]` (aplicadas).

Si no están aplicadas:
```bash
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

### 2. Verificar los logs de Django

```bash
docker-compose logs web
```

Busca errores relacionados con:
- `candidatos`
- `No such table`
- `ModuleNotFoundError`
- `ImportError`

### 3. Probar el endpoint directamente

Abre tu navegador y visita (con el token en el header):
- `http://localhost:8000/api/candidatos/`

O usa curl/Postman con el token:
```bash
# Primero obtén tu token del login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu_password"}'

# Luego usa el token para obtener candidatos
curl -X GET http://localhost:8000/api/candidatos/ \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 4. Verificar que el modelo esté registrado

```bash
docker-compose exec web python manage.py shell
```

En el shell:
```python
from apps.candidatos.models import Candidato
Candidato.objects.all()
# Debería devolver <QuerySet []> (vacío pero sin error)
```

### 5. Verificar las URLs

```bash
docker-compose exec web python manage.py show_urls | grep candidatos
```

Deberías ver las rutas de candidatos listadas.


