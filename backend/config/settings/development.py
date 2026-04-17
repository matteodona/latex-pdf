import os

from .base import *  # noqa: F403

DEBUG = True

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'dev-only-not-for-production-or-test-servers',
)

ALLOWED_HOSTS = ['*']

# In sviluppo consentiamo richieste dal frontend qualunque sia l'origin
# (localhost, 127.0.0.1, IP LAN, porte Vite diverse). In produzione resta
# valida la whitelist esplicita definita in settings.production.
CORS_ALLOW_ALL_ORIGINS = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'data' / 'db.sqlite3',  # noqa: F405
    }
}
