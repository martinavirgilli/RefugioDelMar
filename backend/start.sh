#!/bin/bash
# Arranque del backend en producción (Render).
#
# Las migraciones van ACÁ y no en el Build Command a propósito: durante el build
# Render no conecta a la red privada, así que el hostname interno de la base
# (dpg-…) no resuelve y el deploy falla con "Name or service not known".
# Al arrancar, el servicio ya está dentro de la red y la base es alcanzable.
#
# `migrate` es idempotente: si no hay nada pendiente, no hace nada.
set -e

echo "Aplicando migraciones pendientes…"
python manage.py migrate --noinput

PORT=${PORT:-8000}

echo "Levantando gunicorn en el puerto $PORT…"
exec gunicorn refugio_api.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
