import os

from .base import *  # noqa: F403

DEBUG = True

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'dev-only-not-for-production-or-test-servers',
)

ALLOWED_HOSTS = ['*']
