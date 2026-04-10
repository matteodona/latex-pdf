import os

from config.database import build_postgres_database

from .base import *  # noqa: F403

DEBUG = False

if not SECRET_KEY:  # noqa: F405
    raise RuntimeError('DJANGO_SECRET_KEY non impostata.')
if not ALLOWED_HOSTS:  # noqa: F405
    raise RuntimeError('DJANGO_ALLOWED_HOSTS non impostata.')

DATABASES = {'default': build_postgres_database()}

if not CORS_ALLOWED_ORIGINS:  # noqa: F405
    raise RuntimeError(
        'Configura FRONTEND_URL o CORS_ALLOWED_ORIGINS per consentire il frontend.'
    )

# Sicurezza HTTP produzione (dietro reverse proxy)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.environ.get('DJANGO_SECURE_SSL_REDIRECT', 'true').lower() in (
    '1',
    'true',
    'yes',
)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_SECURE_HSTS_SECONDS', '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = (
    os.environ.get('DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS', 'true').lower()
    in ('1', 'true', 'yes')
)
SECURE_HSTS_PRELOAD = os.environ.get('DJANGO_SECURE_HSTS_PRELOAD', 'true').lower() in (
    '1',
    'true',
    'yes',
)
