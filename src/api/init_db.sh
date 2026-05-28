#!/bin/bash
# Script para inicializar la base de datos

echo "Esperando a que PostgreSQL esté listo..."
sleep 5

echo "Creando migraciones..."
python manage.py makemigrations

echo "Aplicando migraciones..."
python manage.py migrate

echo "Base de datos inicializada correctamente!"

