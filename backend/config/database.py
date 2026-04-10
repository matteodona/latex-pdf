from __future__ import annotations

import os
from urllib.parse import parse_qs, unquote, urlparse


def build_postgres_database() -> dict:
    """
    Restituisce la configurazione DATABASES['default'] per PostgreSQL.
    Priorita':
      1) DATABASE_URL
      2) POSTGRES_* env vars
    """
    url = os.environ.get('DATABASE_URL', '').strip()
    if url:
        return _from_database_url(url)
    return _from_env()


def _from_env() -> dict:
    name = os.environ.get('POSTGRES_DB', '').strip()
    user = os.environ.get('POSTGRES_USER', '').strip()
    password = os.environ.get('POSTGRES_PASSWORD', '')
    host = os.environ.get('POSTGRES_HOST', '').strip()
    port = os.environ.get('POSTGRES_PORT', '5432').strip() or '5432'
    sslmode = os.environ.get('POSTGRES_SSLMODE', 'require').strip() or 'require'
    conn_max_age = int(os.environ.get('POSTGRES_CONN_MAX_AGE', '60'))

    missing = []
    if not name:
        missing.append('POSTGRES_DB')
    if not user:
        missing.append('POSTGRES_USER')
    if not host:
        missing.append('POSTGRES_HOST')
    if missing:
        raise RuntimeError(
            'Configurazione PostgreSQL incompleta. Mancano: ' + ', '.join(missing)
        )

    cfg: dict = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': name,
        'USER': user,
        'PASSWORD': password,
        'HOST': host,
        'PORT': port,
        'CONN_MAX_AGE': conn_max_age,
    }
    if sslmode and sslmode != 'disable':
        cfg['OPTIONS'] = {'sslmode': sslmode}
    return cfg


def _from_database_url(url: str) -> dict:
    parsed = urlparse(url)
    if parsed.scheme not in ('postgres', 'postgresql'):
        raise RuntimeError('DATABASE_URL deve iniziare con postgres:// o postgresql://')

    db_name = (parsed.path or '').lstrip('/')
    if not db_name:
        raise RuntimeError('DATABASE_URL senza nome database')

    user = unquote(parsed.username or '')
    if not user:
        raise RuntimeError('DATABASE_URL senza username')

    password = unquote(parsed.password or '') if parsed.password else ''
    host = parsed.hostname or ''
    if not host:
        raise RuntimeError('DATABASE_URL senza host')

    port = str(parsed.port or 5432)
    conn_max_age = int(os.environ.get('POSTGRES_CONN_MAX_AGE', '60'))
    query = parse_qs(parsed.query)
    sslmode = query.get('sslmode', [os.environ.get('POSTGRES_SSLMODE', 'require')])[0]

    cfg: dict = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': db_name,
        'USER': user,
        'PASSWORD': password,
        'HOST': host,
        'PORT': port,
        'CONN_MAX_AGE': conn_max_age,
    }
    if sslmode and sslmode != 'disable':
        cfg['OPTIONS'] = {'sslmode': sslmode}
    return cfg
