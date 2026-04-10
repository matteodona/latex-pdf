<<<<<<< HEAD
=======
"""
Configurazione database: PostgreSQL da variabili d'ambiente o da DATABASE_URL.
"""
>>>>>>> abbe939 (Refactor project structure to transition from Node/Express to Django for backend, implement PostgreSQL support, and enhance template management with a new API. Update README for clarity and add environment configuration examples. Introduce new frontend features for template selection and PDF generation.)
from __future__ import annotations

import os
from urllib.parse import parse_qs, unquote, urlparse


<<<<<<< HEAD
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
=======
def build_databases() -> dict:
    """
    Priorità:
    1) DATABASE_URL (es. postgresql://user:pass@host:5432/dbname?sslmode=require)
    2) Variabili POSTGRES_* (vedi .env.example)
    """
    url = os.environ.get('DATABASE_URL', '').strip()
    if url:
        return {'default': _from_database_url(url)}
    return {'default': _from_postgres_env()}


def _from_postgres_env() -> dict:
    name = os.environ.get('POSTGRES_DB', '').strip()
    user = os.environ.get('POSTGRES_USER', '').strip()
    password = os.environ.get('POSTGRES_PASSWORD', '')
    host = os.environ.get('POSTGRES_HOST', 'localhost').strip() or 'localhost'
    port = os.environ.get('POSTGRES_PORT', '5432').strip() or '5432'
    sslmode = os.environ.get('POSTGRES_SSLMODE', 'prefer').strip() or 'prefer'
    conn_max_age = int(os.environ.get('POSTGRES_CONN_MAX_AGE', '60'))

    if not name or not user:
        raise RuntimeError(
            'PostgreSQL: imposta DATABASE_URL oppure POSTGRES_DB e POSTGRES_USER '
            '(e di solito POSTGRES_PASSWORD, POSTGRES_HOST).',
>>>>>>> abbe939 (Refactor project structure to transition from Node/Express to Django for backend, implement PostgreSQL support, and enhance template management with a new API. Update README for clarity and add environment configuration examples. Introduce new frontend features for template selection and PDF generation.)
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
<<<<<<< HEAD
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
=======
        raise RuntimeError(
            f'DATABASE_URL deve usare schema postgresql:// o postgres://, non {parsed.scheme!r}.',
        )
    path = (parsed.path or '').lstrip('/')
    if not path:
        raise RuntimeError('DATABASE_URL: nome database mancante nel path.')
    name = path.split('?', 1)[0]
    user = unquote(parsed.username or '')
    password = unquote(parsed.password or '') if parsed.password else ''
    host = parsed.hostname or 'localhost'
    port = str(parsed.port or 5432)
    query = parse_qs(parsed.query)
    ssl_list = query.get('sslmode')
    sslmode = ssl_list[0] if ssl_list else os.environ.get('POSTGRES_SSLMODE', 'prefer')
    conn_max_age = int(os.environ.get('POSTGRES_CONN_MAX_AGE', '60'))

    if not user:
        raise RuntimeError('DATABASE_URL: utente (username) mancante.')

    cfg: dict = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': name,
>>>>>>> abbe939 (Refactor project structure to transition from Node/Express to Django for backend, implement PostgreSQL support, and enhance template management with a new API. Update README for clarity and add environment configuration examples. Introduce new frontend features for template selection and PDF generation.)
        'USER': user,
        'PASSWORD': password,
        'HOST': host,
        'PORT': port,
        'CONN_MAX_AGE': conn_max_age,
    }
    if sslmode and sslmode != 'disable':
        cfg['OPTIONS'] = {'sslmode': sslmode}
    return cfg
