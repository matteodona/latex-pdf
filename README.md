# Generatore documentazione tecnica (locale)

Guida breve per avviare **in sviluppo**:
- Backend in locale (hot reload, senza riavviare Docker a ogni modifica)
- Frontend con Vite

## Multi-frontend (single repo)

Il repository supporta frontend separati per progetto/backend:

- `frontend/` -> app relazione tecnico-specialistica (attuale)
- `frontend-<nome-progetto>/` -> app dedicate future

Per creare un nuovo frontend progetto:

1. duplica `frontend/` in `frontend-<nome-progetto>/`;
2. imposta `VITE_BACKEND_URL` del backend dedicato;
3. personalizza form/payload hardcoded del progetto;
4. build/deploy dell'app in modo indipendente.

## A) Sviluppo consigliato (backend fuori Docker + hot reload)

### Backend (SQLite)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export DJANGO_SETTINGS_MODULE=config.settings.development
python manage.py migrate

# opzionale
python manage.py createsuperuser

python manage.py runserver 0.0.0.0:3001
```

### Frontend (Vite)
```bash
cd frontend
npm install
export VITE_BACKEND_URL=http://localhost:3001
npm run dev
```

Apri:
- Frontend: `http://localhost:5173`
- Django admin: `http://localhost:3001/admin`

## Risoluzione automatica URL API (dev/prod)

Il frontend ora risolve `API_BASE_URL` in questo ordine:

1. usa `VITE_BACKEND_URL` se impostata;
2. se non impostata, in locale (`localhost`/`127.0.0.1`) con Vite su `5173/5174` usa `http://localhost:3001`;
3. negli altri casi usa lo stesso origin del frontend (comodo in produzione dietro reverse proxy).

In pratica:

- in **dev locale** puoi avviare senza cambiare variabili ogni volta;
- in **produzione** funziona out-of-the-box se frontend e API stanno sullo stesso origin/proxy;
- se API e frontend stanno su domini diversi, imposta esplicitamente `VITE_BACKEND_URL`.

## B) Backend + DB con Docker Compose (PostgreSQL)

In root del progetto:
```bash
cp .env.docker.example .env.docker
docker compose up --build
```

Backend:
- API health: `http://localhost:8000/api/health`
- Django admin: `http://localhost:8000/admin`

Frontend (Vite normale):
```bash
cd frontend
npm install
export VITE_BACKEND_URL=http://localhost:8000
npm run dev
```

# Generatore documentazione tecnica (locale)

Guida breve per avviare **in sviluppo**:
- Backend in locale (nessun restart Docker a ogni modifica)
- Frontend con Vite

## A) Sviluppo consigliato (backend fuori Docker + hot reload)

### Backend (SQLite)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export DJANGO_SETTINGS_MODULE=config.settings.development
python manage.py migrate

# opzionale
python manage.py createsuperuser

python manage.py runserver 0.0.0.0:3001
```

### Frontend (Vite)
```bash
cd frontend
npm install
export VITE_BACKEND_URL=http://localhost:3001
npm run dev
```

Apri:
- `http://localhost:5173`

## B) Backend + DB con Docker Compose (PostgreSQL)

In una shell dalla root del progetto:
```bash
cp .env.docker.example .env.docker
docker compose up --build
```

Backend:
- `http://localhost:8000/api/health`
- `http://localhost:8000/admin`

Frontend (Vite normale, stessa shell del dev):
```bash
cd frontend
npm install
export VITE_BACKEND_URL=http://localhost:8000
npm run dev
```

# Generatore documentazione tecnica (locale)

Guida breve per avviare **in locale** lo stack:
- `db` + `backend` con Docker Compose
- `frontend` con Vite (normale, non Docker)

## 1) Backend + PostgreSQL (Docker)

1. In root del progetto:
   ```bash
   cp .env.docker.example .env.docker
   docker compose up --build
   ```

2. Backend disponibile su:
   - `http://localhost:8000/api/health`
   - `http://localhost:8000/admin`

## 2) Frontend (Vite normale)

In una nuova terminale:
```bash
cd frontend
npm install
export VITE_BACKEND_URL=http://localhost:8000
npm run dev
```

Apri:
- `http://localhost:5173`

## Sviluppo (admin)

Se non hai ancora un superuser:
```bash
docker compose exec web python manage.py createsuperuser
```

# Generatore documentazione tecnica (locale)

Guida breve per avviare **in locale**:
- `db` + `backend` con Docker Compose
- `frontend` con Vite (normale, non Docker)

## Prerequisiti

- Docker Desktop (docker + docker compose)
- Node.js + npm

## Backend + DB (Docker)

1. In root progetto:

```bash
cp .env.docker.example .env.docker
docker compose up --build
```

Backend:
- `http://localhost:8000/api/health`
- `http://localhost:8000/admin`

## Frontend (Vite normale)

In una nuova terminale:

```bash
cd frontend
npm install
export VITE_BACKEND_URL=http://localhost:8000
npm run dev
```

Apri:
- `http://localhost:5173`

<details><summary>Altro (documentazione storica)</summary>

# Generatore documentazione tecnica (locale)

Questa guida serve solo per avviare **in locale**: `db` + `backend` con Docker Compose e `frontend` con Vite (normale).

## Prerequisiti

- Docker Desktop (docker + docker compose)
- Node.js + npm

## 1) Backend + PostgreSQL (Docker)

In root del progetto:

```bash
cp .env.docker.example .env.docker
docker compose up --build
```

Backend disponibile su:
- `http://localhost:8000/api/health`
- `http://localhost:8000/admin`

## 2) Frontend (Vite normale)

In una nuova terminale:

```bash
cd frontend
npm install
export VITE_BACKEND_URL=http://localhost:8000
npm run dev
```

Apri:
- `http://localhost:5173`

Nota: il backend in locale e' gia' configurato per CORS verso `http://localhost:5173`.

# Generatore di template per documenti tecnici

Applicazione **Django + React (Vite)** per generare PDF da template LaTeX.

Questo repository e' organizzato per avere:
- **sviluppo locale** con SQLite (`config.settings.development`)
- **produzione** con PostgreSQL (`config.settings.production`)

Il deploy consigliato e': **backend Docker** (immagine da [`Dockerfile`](Dockerfile) in radice) + **frontend Nixpacks** (build Vite/Node in Dokploy). In alternativa, su VPS puoi usare Gunicorn + nginx senza container.

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

## Deploy con Docker (backend)

Il Dockerfile in radice e' dedicato all'API (Python + TeX + Gunicorn).

### Build immagine API

```bash
docker build -t cardy-api .
```

Contesto build: radice repo (`.`).

### Compose (PostgreSQL + API)

1. Copia `cp .env.docker.example .env.docker` e compila `DJANGO_SECRET_KEY`, credenziali Postgres e `DATABASE_URL` (host `db` se usi il compose incluso).
2. Solo API + DB:

```bash
docker compose up --build
```

L’API e' su `http://localhost:8000` (porta host: `HOST_PORT` nel file `.env` in radice per l’interpolazione Compose, oppure `HOST_PORT=8080 docker compose up`).

Variabili runtime API: come `backend/.env.example`. Per Postgres interno a Compose usa `sslmode=disable` in `DATABASE_URL`.

### Dokploy (due applicazioni)

| App | Build type | Docker context | Docker file | Build args |
|-----|------------|----------------|-------------|------------|
| API | Dockerfile | `.` | `Dockerfile` | — |
| Frontend | Nixpacks | `frontend` | — | `VITE_BACKEND_URL=https://api.tuo-dominio.it` + `NIXPACKS_*` |

Env runtime solo sull’app **API** (vedi [`env/dokploy.environment.example`](env/dokploy.environment.example)).
Per l'app frontend Nixpacks imposta almeno `VITE_BACKEND_URL` e i comandi `NIXPACKS_INSTALL_CMD`, `NIXPACKS_BUILD_CMD`, `NIXPACKS_START_CMD` (porta `3000`). TLS/domini si configurano in Dokploy.

### Altre piattaforme (Railway, ecc.)

Stessa suddivisione: immagine Docker da [`Dockerfile`](Dockerfile) per il backend; frontend deployato con build Node (Nixpacks) e variabile `VITE_BACKEND_URL`.

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

- [ ] `docker build` immagine API e verifica env Dokploy frontend Nixpacks (`VITE_BACKEND_URL`, `NIXPACKS_*`, porta 3000) **oppure** `pip install` / `npm run build` senza Docker
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

---

## Test API automatici

Per una smoke test rapida delle API backend (incluse operazioni utenti su DB), usa:

```bash
python3 api-tests/run_api_tests.py \
  --base-url "https://api.generatoredocumentazionetecnica.it/api" \
  --admin-user "<admin_username>" \
  --admin-pass "<admin_password>"
```

La documentazione completa dei test è in [`api-tests/README.md`](api-tests/README.md).

</details>
