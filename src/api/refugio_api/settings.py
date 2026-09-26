"""
Django settings for the Refugio del Mar API.

Environment variables are loaded from a .env file using django-environ.
See .env.example for the full list of required variables.
"""

import os
from pathlib import Path
from datetime import timedelta
import environ

# Base directory of the project (two levels up from this file)
BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize environ and cast specific variables to their correct types
env = environ.Env(
    DEBUG=(bool, False),
    SECURE_SSL_REDIRECT=(bool, False),
    SECURE_HSTS_SECONDS=(int, 0),
)

# Load .env file if it exists (not present in production — env vars are set directly)
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default='django-insecure-change-this-in-production')

# SECURITY WARNING: never run with DEBUG=True in production!
DEBUG = env('DEBUG', default=False)

# Hosts allowed to serve this application.
# ".onrender.com" covers all Render subdomains for the deployed backend.
ALLOWED_HOSTS = [
    ".onrender.com",
    "127.0.0.1",
    "localhost",
]

# Installed applications: Django built-ins, third-party packages, and local apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # Local apps
    'apps.auth_app',
    'apps.candidatos',
    'apps.adopciones',
    'apps.visitas',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise must come right after SecurityMiddleware to serve static files in production
    'whitenoise.middleware.WhiteNoiseMiddleware',
    # CorsMiddleware must be placed before any middleware that generates responses (e.g. CommonMiddleware)
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'refugio_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'refugio_api.wsgi.application'


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
# Active configuration: PostgreSQL (used on Render)
# To switch back to MySQL, comment out the PostgreSQL block and uncomment MySQL.
# ---------------------------------------------------------------------------

DATABASES = {
    # DATABASE_URL takes priority (Render sets this automatically when you link a Postgres DB).
    # Falls back to individual vars for local development.
    'default': env.db('DATABASE_URL', default='postgresql://refugio_user:refugio_pass@localhost:5432/refugio_db')
}

# ---------------------------------------------------------------------------
# MySQL configuration (inactive)
# Uncomment the block below and comment out PostgreSQL to use MySQL instead.
# Also swap psycopg2-binary for mysqlclient in requirements.txt.
# ---------------------------------------------------------------------------
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.mysql',
#         'NAME': env('DB_NAME', default='refugio_db'),
#         'USER': env('DB_USER', default='refugio_user'),
#         'PASSWORD': env('DB_PASSWORD', default='refugio_pass'),
#         'HOST': env('DB_HOST', default='localhost'),
#         'PORT': env('DB_PORT', default='3306'),
#         'OPTIONS': {
#             'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
#             'charset': 'utf8mb4',
#         },
#     }
# }


# Password validation rules applied when creating or changing passwords
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'es-ar'
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Directory where the built React frontend is placed after running `npm run build`
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

# WhiteNoise compresses and fingerprints static files for efficient long-term caching
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key type for all models
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    # All endpoints require a valid JWT token by default
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Only JSON responses — no browsable API in production
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}


# ---------------------------------------------------------------------------
# JWT Settings (djangorestframework-simplejwt)
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    # Issue a new refresh token on every refresh request
    'ROTATE_REFRESH_TOKENS': True,
    # Invalidate the old refresh token after rotation to prevent reuse
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': env('JWT_SECRET_KEY', default=SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}


# ---------------------------------------------------------------------------
# CORS Settings
# ---------------------------------------------------------------------------
# In production, set CORS_ALLOWED_ORIGINS in the environment to the exact
# Netlify URL of the frontend (e.g. https://refugio-del-mar.netlify.app).
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',  # e.g. https://refugio-del-mar.netlify.app
    default=['http://localhost:5173', 'http://localhost:3000']
)

# Allow all origins in local development only
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False

# Required so the browser sends the Authorization header cross-origin
CORS_ALLOW_CREDENTIALS = True


# ---------------------------------------------------------------------------
# Security settings (applied in production only)
# ---------------------------------------------------------------------------
if not DEBUG:
    SECURE_SSL_REDIRECT = env('SECURE_SSL_REDIRECT', default=False)
    SECURE_HSTS_SECONDS = env('SECURE_HSTS_SECONDS', default=0)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': env('DJANGO_LOG_LEVEL', default='INFO'),
            'propagate': False,
        },
        # Logger for all local apps under apps/
        'apps': {
            'handlers': ['console'],
            'level': env('APP_LOG_LEVEL', default='DEBUG'),
            'propagate': False,
        },
    },
}
