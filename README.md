# Generatore di template per documenti tecnici

Applicazione **Django + React (Vite)** per generare PDF da template LaTeX.

Questo repository e' organizzato per avere:
- **sviluppo locale** con SQLite (`config.settings.development`)
- **produzione** con PostgreSQL (`config.settings.production`)

Il deploy consigliato e' **Docker** con **due immagini**: API ([`Dockerfile`](Dockerfile) in radice) e frontend statico ([`frontend/Dockerfile`](frontend/Dockerfile) con nginx). In alternativa, su VPS puoi usare Gunicorn + nginx senza container.

---

## Requisiti

- Python 3.12+
- Node.js + npm (solo per build frontend)
- PostgreSQL (produzione)
- TeX Live / MacTeX con `pdflatex` nel PATH del processo backend

---

## Configurazioni Django

| Ambiente | Settings module | DB |
|---|---|---|
| Sviluppo | `config.settings.development` | SQLite (`backend/data/db.sqlite3`) |
| Produzione | `config.settings.production` | PostgreSQL (`DATABASE_URL` o `POSTGRES_*`) |

`manage.py` di default usa development.  
Per la produzione imposta:

```bash
export DJANGO_SETTINGS_MODULE=config.settings.production
```

`wsgi.py` defaulta a production, utile per Gunicorn.

---

## Variabili ambiente

### Produzione (backend/.env.example)

Usa `backend/.env.example` come base:

- `DJANGO_SETTINGS_MODULE=config.settings.production`
- `DJANGO_SECRET_KEY=...`
- `DJANGO_ALLOWED_HOSTS=api.tuodominio.it`
- `FRONTEND_URL=https://www.tuodominio.it`
- `CORS_ALLOWED_ORIGINS=...` (opzionale, multi-origine)
- `DATABASE_URL=postgresql://...` **oppure** `POSTGRES_DB/USER/PASSWORD/HOST/PORT`
- hardening HTTP: `DJANGO_SECURE_SSL_REDIRECT`, `DJANGO_SECURE_HSTS_*`

### Sviluppo (env/.env.development.example)

- `DJANGO_SETTINGS_MODULE=config.settings.development`
- `DJANGO_DEBUG=1`
- `DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1`
- `FRONTEND_URL=http://localhost:5173`
- `VITE_BACKEND_URL=http://localhost:3001`

---

## Avvio locale (sviluppo)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py create_superuser admin 'TuaPasswordSicura123!'
python manage.py runserver 0.0.0.0:3001
```

### Frontend

```bash
cd frontend
npm install
export VITE_BACKEND_URL=http://localhost:3001
npm run dev
```

---

## Deploy produzione (Hostinger VPS)

### 1) PostgreSQL

Crea DB + utente (esempio):

```bash
sudo -u postgres psql -c "CREATE USER cardy WITH PASSWORD 'change-me';"
sudo -u postgres psql -c "CREATE DATABASE cardy OWNER cardy;"
```

### 2) Backend Django

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# modifica .env con valori reali
export DJANGO_SETTINGS_MODULE=config.settings.production
python manage.py migrate
python manage.py collectstatic --noinput
```

Avvio con Gunicorn (esempio):

```bash
gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 3
```

### 3) Frontend statico (produzione)

```bash
cd frontend
npm ci
export VITE_BACKEND_URL=https://api.tuodominio.it
npm run build
```

Pubblica `frontend/dist` su nginx (o altro static hosting).

### 4) Reverse proxy + TLS

- nginx davanti a Gunicorn
- HTTPS (Let's Encrypt)
- inoltro header `X-Forwarded-Proto https` verso backend

---

## Deploy con Docker

Due immagini separate: **solo API** (Python + TeX + Gunicorn) e **solo frontend** (Vite build + nginx per SPA).

### Build immagine API

```bash
docker build -t cardy-api .
```

Contesto build: radice repo (il [`.dockerignore`](.dockerignore) esclude `frontend/` per alleggerire il contesto).

### Build immagine frontend

L’URL dell’API viene compilato nel bundle (`VITE_BACKEND_URL`):

```bash
docker build -t cardy-web \
  --build-arg VITE_BACKEND_URL=https://api.tuodominio.it \
  -f frontend/Dockerfile \
  frontend
```

### Compose (PostgreSQL + API)

1. Copia `cp .env.docker.example .env.docker` e compila `DJANGO_SECRET_KEY`, credenziali Postgres e `DATABASE_URL` (host `db` se usi il compose incluso).
2. Solo API + DB:

```bash
docker compose up --build
```

L’API e' su `http://localhost:8000` (porta host: `HOST_PORT` nel file `.env` in radice per l’interpolazione Compose, oppure `HOST_PORT=8080 docker compose up`).

3. Opzionale — anche il container **frontend** (nginx su porta host 8080):

```bash
docker compose --profile fullstack up --build
```

Serve `VITE_BACKEND_URL` coerente (es. `http://localhost:8000` verso l’API locale). Variabile opzionale: `FRONTEND_HOST_PORT` per la porta host del frontend.

Variabili runtime API: come `backend/.env.example`. Per Postgres interno a Compose usa `sslmode=disable` in `DATABASE_URL`.

### Dokploy (due applicazioni)

| App | Build type | Docker context | Docker file | Build args |
|-----|------------|----------------|-------------|------------|
| API | Dockerfile | `.` | `Dockerfile` | — |
| Frontend | Dockerfile | `frontend` | `Dockerfile` | `VITE_BACKEND_URL=https://api.tuo-dominio.it` |

Env runtime solo sull’app **API** (vedi [`env/dokploy.environment.example`](env/dokploy.environment.example)). L’app frontend di solito non richiede env runtime; TLS/domini si configurano in Dokploy.

### Altre piattaforme (Railway, ecc.)

Stessa suddivisione: immagine da [`Dockerfile`](Dockerfile) per il backend; immagine da [`frontend/Dockerfile`](frontend/Dockerfile) con build arg `VITE_BACKEND_URL`.

---

## Migrazione dati utenti: SQLite -> PostgreSQL

Se hai dati utenti in SQLite (sviluppo) e vuoi portarli in produzione:

1. Esegui backup del file SQLite:

```bash
cp backend/data/db.sqlite3 backend/data/db.sqlite3.bak
```

2. Punta il backend al DB PostgreSQL (`DJANGO_SETTINGS_MODULE=...production` e variabili DB impostate).
3. Esegui migrazioni schema:

```bash
python manage.py migrate
```

4. Dry-run migrazione utenti:

```bash
python manage.py migrate_sqlite_users --sqlite-path backend/data/db.sqlite3 --dry-run
```

5. Migrazione effettiva:

```bash
python manage.py migrate_sqlite_users --sqlite-path backend/data/db.sqlite3
```

6. Se vuoi sovrascrivere utenti gia' presenti nel target:

```bash
python manage.py migrate_sqlite_users --sqlite-path backend/data/db.sqlite3 --update-existing
```

Il comando verifica e riporta: utenti sorgente, creati, aggiornati, skippati, totale target.

---

## Checklist pre/post deploy

### Pre-deploy

- [ ] `docker build` immagine API + `docker build -f frontend/Dockerfile frontend` (con `VITE_BACKEND_URL`) **oppure** `pip install` / `npm run build` senza Docker
- [ ] variabili `.env` / `.env.docker` produzione complete (`DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, DB, CORS)
- [ ] `pdflatex` disponibile nell’immagine o sul server backend (`Dockerfile` installa i pacchetti TeX via apt)

### Post-deploy

- [ ] `python manage.py migrate` eseguito su produzione
- [ ] endpoint health: `GET /api/health` = 200
- [ ] login utente approvato ok
- [ ] area admin superuser ok
- [ ] compilazione PDF end-to-end ok
- [ ] CORS corretto da dominio frontend reale

---

## URL utili (sviluppo)

| Cosa | URL |
|---|---|
| App React | http://localhost:5173 |
| Login | http://localhost:5173/login |
| Admin frontend | http://localhost:5173/admin |
| API health | http://localhost:3001/api/health |
| Admin Django | http://localhost:3001/admin |
