"""
One-time script to create the initial admin (superuser) account.

Run this after the first deployment and database migration:
  docker-compose exec web python create_admin.py
  -- or --
  python create_admin.py  (if running Django directly)

Change USERNAME, EMAIL, and PASSWORD before running in production.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'refugio_api.settings')
django.setup()

from django.contrib.auth.models import User

# ---- Admin credentials — change these before deploying ----
USERNAME = 'admin'
EMAIL = 'admin@refugio.com'
PASSWORD = 'admin123'
# -----------------------------------------------------------

if User.objects.filter(username=USERNAME).exists():
    # If the user already exists, ensure they have admin privileges
    print(f"User '{USERNAME}' already exists.")
    user = User.objects.get(username=USERNAME)
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f"User '{USERNAME}' updated with admin privileges.")
else:
    # Create a brand new superuser
    user = User.objects.create_superuser(
        username=USERNAME,
        email=EMAIL,
        password=PASSWORD,
    )
    print(f"Admin user '{USERNAME}' created successfully.")
    print(f"  Email:    {EMAIL}")
    print(f"  Password: {PASSWORD}")
