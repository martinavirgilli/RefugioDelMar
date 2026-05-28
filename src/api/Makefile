.PHONY: up down build migrate superuser shell test

# Levantar contenedores
up:
	docker-compose up

# Levantar en background
up-d:
	docker-compose up -d

# Detener contenedores
down:
	docker-compose down

# Construir imágenes
build:
	docker-compose build

# Crear migraciones
migrate:
	docker-compose exec web python manage.py makemigrations
	docker-compose exec web python manage.py migrate

# Crear superusuario
superuser:
	docker-compose exec web python manage.py createsuperuser

# Abrir shell de Django
shell:
	docker-compose exec web python manage.py shell

# Ejecutar tests
test:
	docker-compose exec web python manage.py test

# Ver logs
logs:
	docker-compose logs -f web

