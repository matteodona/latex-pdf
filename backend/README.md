# Backend Django

Documentazione completa deploy e ambienti: vedi `../README.md`.

## Comandi utili rapidi

### Sviluppo locale (SQLite)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:3001
```

### Produzione (PostgreSQL)

```bash
export DJANGO_SETTINGS_MODULE=config.settings.production
python manage.py migrate
gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 3
```

### Migrazione utenti da SQLite a PostgreSQL

```bash
python manage.py migrate_sqlite_users --sqlite-path backend/data/db.sqlite3 --dry-run
python manage.py migrate_sqlite_users --sqlite-path backend/data/db.sqlite3
```
