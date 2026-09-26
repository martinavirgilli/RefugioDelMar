# Migración de PostgreSQL a MySQL

## ✅ Cambios Realizados

1. **docker-compose.yml**: Cambiado de PostgreSQL a MySQL 8.0
2. **requirements.txt**: Cambiado `psycopg2-binary` por `mysqlclient`
3. **settings.py**: Cambiado el ENGINE de `postgresql` a `mysql`
4. **Dockerfile**: Actualizado para instalar dependencias de MySQL
5. **Puerto**: Cambiado de 5432 a 3306

## 🔄 Pasos para Aplicar los Cambios

### 1. Detener los contenedores actuales

```powershell
cd src\api
docker-compose down -v
```

**⚠️ IMPORTANTE**: El flag `-v` elimina los volúmenes (incluyendo la base de datos). Si tienes datos importantes, haz un backup primero.

### 2. Actualizar el archivo .env

Asegúrate de que tu `.env` tenga el puerto correcto:

```env
DB_PORT=3306
```

Y agrega (opcional, para el root de MySQL):
```env
DB_ROOT_PASSWORD=root_password
```

### 3. Reconstruir los contenedores

```powershell
docker-compose up --build
```

### 4. Aplicar las migraciones

En una nueva terminal:

```powershell
cd src\api
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

### 5. Crear superusuario (si es necesario)

```powershell
docker-compose exec web python manage.py createsuperuser
```

## 📝 Notas

- **Puerto MySQL**: 3306 (en lugar de 5432 de PostgreSQL)
- **Volumen**: Los datos se guardan en `mysql_data` (antes `postgres_data`)
- **mysqlclient**: Requiere compilación, por eso agregamos `build-essential` y `pkg-config` al Dockerfile

## ⚠️ Si hay problemas con mysqlclient

Si `mysqlclient` no se instala correctamente, puedes usar `PyMySQL` como alternativa:

1. Cambiar en `requirements.txt`:
   ```
   PyMySQL==1.1.0
   ```

2. Agregar en `settings.py` (antes de la configuración de DATABASES):
   ```python
   import pymysql
   pymysql.install_as_MySQLdb()
   ```

Pero `mysqlclient` es más eficiente, así que intenta primero con ese.

