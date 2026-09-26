#!/bin/bash
set -e

# Obtener el puerto de la variable de entorno PORT, o usar 8000 por defecto
PORT=${PORT:-8000}

# Ejecutar gunicorn
exec gunicorn refugio_api.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120

