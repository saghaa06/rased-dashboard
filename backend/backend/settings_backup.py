"""
Django settings for backend project.
"""

from pathlib import Path
import os          # <-- MODIF RENDER
import dj_database_url  # <-- MODIF RENDER (ajoute cette ligne)

BASE_DIR = Path(__file__).resolve().parent.parent

# ------------------------------------------------------------
# MODIF RENDER : Utiliser variable d'environnement pour SECRET_KEY
# Si elle n'existe pas, on garde l'ancienne clé (pour le local)
# ------------------------------------------------------------
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-2Y6hw0Zg4m^sdR9q!k@b7u1&C3z4Lw5gNhxT8yFp2Vt8uJ6p')

# ------------------------------------------------------------
# MODIF RENDER : DEBUG = True seulement en local (si pas de variable RENDER)
# ------------------------------------------------------------
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

# ------------------------------------------------------------
# MODIF RENDER : Hôtes autorisés dynamiques
# ------------------------------------------------------------
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',') if os.environ.get('ALLOWED_HOSTS') else ['*']
# Pour Render, on ajoute automatiquement .onrender.com
if os.environ.get('RENDER'):
    ALLOWED_HOSTS.extend(['.onrender.com', 'localhost', '127.0.0.1'])

# ------------------------------------------------------------
# INSTALLED_APPS (inchangé)
# ------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'recognition',
]

# ------------------------------------------------------------
# MIDDLEWARE (whitenoise déjà présent, bien placé)
# ------------------------------------------------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

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

WSGI_APPLICATION = 'backend.wsgi.application'

# ------------------------------------------------------------
# MODIF RENDER : Base de données conditionnelle
# - Si DATABASE_URL est définie (sur Render) → PostgreSQL
# - Sinon → SQLite (local)
# ------------------------------------------------------------
if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ['DATABASE_URL'],
            conn_max_age=600,
            ssl_require=True
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ------------------------------------------------------------
# AUTH PASSWORD VALIDATORS (inchangé)
# ------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ------------------------------------------------------------
# REST_FRAMEWORK (inchangé)
# ------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------
# STATIC / MEDIA (tes réglages sont déjà adaptés pour whitenoise)
# ------------------------------------------------------------
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
FRONTEND_BUILD_DIR = (BASE_DIR / '..' / 'frontend' / 'build').resolve()
STATICFILES_DIRS = [FRONTEND_BUILD_DIR] if FRONTEND_BUILD_DIR.exists() else []
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ------------------------------------------------------------
# CORS (inchangé, gardé tel quel)
# ------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]