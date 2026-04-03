# Setup, ambiente e deploy

Questa guida descrive come configurare il progetto in locale o con Docker, come gestire **PostgreSQL** e le **variabili d’ambiente** del backend Django.

## 1. Servizi Docker (`docker-compose.yml`)

### 1.1 Servizi

| Servizio | Immagine / build | Porta host | Ruolo |
|----------|------------------|------------|--------|
| `postgres` | `postgres:16-alpine` | (solo rete interna) | Database PostgreSQL |
| `backend` | `backend/Dockerfile` | **8000** → 8000 | Django + Gunicorn + LaTeX |
| `frontend` | `frontend/Dockerfile` | **8080** → 80 | Dev server Vite sulla porta 80 nel container |

Il backend **dipende** da Postgres con `depends_on` e **healthcheck** (`pg_isready` con `POSTGRES_USER` e `POSTGRES_DB`).

### 1.2 Volumi

- **`postgres-data`**: dati del cluster PostgreSQL (persistenza tra riavvii).
- **`./backend/projects:/app/projects:ro`**: i template LaTeX sono montati in sola lettura nel container backend (modifiche su host visibili senza rebuild).

### 1.3 Variabili d’ambiente rilevanti (Compose)

Definibili in un file `.env` nella **root del repository** (Compose le legge automaticamente) oppure esportate nel shell.

| Variabile | Dove | Significato |
|-----------|------|-------------|
| `POSTGRES_USER` | `postgres` | Utente DB (default: `latex`) |
| `POSTGRES_PASSWORD` | `postgres` | Password DB (default: `latex`) |
| `POSTGRES_DB` | `postgres` | Nome database (default: `latex`) |
| `DJANGO_SECRET_KEY` | `backend` | Chiave segreta Django (obbligatoria in produzione) |
| `DJANGO_ALLOWED_HOSTS` | `backend` | Hostnames separati da virgola (default include `localhost`, `127.0.0.1`, `backend`) |

Il backend riceve anche:

- `DJANGO_SETTINGS_MODULE=config.settings.base` (impostazioni “produzione-like” nel container)
- `DATABASE_URL` costruita come  
  `postgresql://USER:PASSWORD@postgres:5432/DB`
- `FRONTEND_URL=http://localhost:8080` per **CORS** (origine del browser che carica il frontend)

Il frontend riceve:

- `VITE_BACKEND_URL=http://localhost:8000`  
  (URL usato dal **browser** per chiamare le API; deve essere raggiungibile dalla macchina dell’utente, non dal solo container.)

### 1.4 Avvio e primo superutente

```bash
docker compose build
docker compose up -d
```

Dopo l’avvio, creare un superutente nel container backend:

```bash
docker exec -it latex-backend python manage.py create_superuser NOME_UTENTE 'PASSWORD'
```

Il comando `create_superuser` è definito in `accounts/management/commands/create_superuser.py` e crea un utente con ruolo `superuser` e stato `approved`.

Le migrazioni vengono eseguite automaticamente all’avvio del container backend (vedi `CMD` nel `backend/Dockerfile`).

### 1.5 Verifica PostgreSQL + Django

Dalla root del repo:

```bash
./scripts/verify_postgres.sh
```

Lo script avvia Postgres, ricostruisce il backend se necessario ed esegue `migrate` e `check` contro il database.

---

## 2. Sviluppo locale senza Docker

### 2.1 Prerequisiti

- **Python 3.12+** (consigliato, allineato al Dockerfile)
- **PostgreSQL** in ascolto (es. porta 5432), oppure nessun Postgres se si usa solo SQLite
- **TeX Live** (o equivalente) con `pdflatex` nel `PATH` per compilare i PDF
- **Node.js** per il frontend (`npm install` in `frontend/`)

### 2.2 Backend Django

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Modificare .env: DATABASE_URL, DJANGO_SECRET_KEY se usi config.settings.base
```

Impostazioni di sviluppo (predefinite in `manage.py`):

```bash
export DJANGO_SETTINGS_MODULE=config.settings.development
```

Oppure usare il default di `manage.py` che punta già a `config.settings.development`.

Con **`DATABASE_URL`** impostato nel `.env` o nell’ambiente, Django usa **PostgreSQL** (`dj-database-url` + `psycopg`). Senza `DATABASE_URL`, il database predefinito è **SQLite** in `backend/data/db.sqlite3`.

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Superutente in locale:

```bash
python manage.py create_superuser admin 'PasswordSicura'
```

### 2.3 Frontend

```bash
cd frontend
npm install
```

Impostare l’URL del backend (deve coincidere con dove gira Gunicorn o `runserver`):

```bash
export VITE_BACKEND_URL=http://localhost:8000
npm run dev
```

Vite espone solitamente `http://localhost:5173`. Aggiornare `FRONTEND_URL` / CORS nel backend se l’origine non è quella attesa (vedi `config/settings/base.py`: `FRONTEND_URL` e `CORS_ALLOWED_ORIGINS`).

---

## 3. Riferimento variabili backend (`backend/.env`)

| Variabile | Obbligatorietà | Descrizione |
|-----------|----------------|-------------|
| `DATABASE_URL` | Opzionale | Se presente, connessione PostgreSQL. Formato: `postgresql://USER:PASSWORD@HOST:PORT/NAME` |
| `DJANGO_SECRET_KEY` | Obbligatoria in produzione con `config.settings.base` | Chiave per firmare sessioni e token interni |
| `DJANGO_ALLOWED_HOSTS` | Produzione | Lista separata da virgole di host permessi |
| `FRONTEND_URL` | Consigliata | Origine del frontend per CORS se non si usa `CORS_ALLOWED_ORIGINS` |
| `CORS_ALLOWED_ORIGINS` | Opzionale | Se valorizzata, sostituisce il calcolo da `FRONTEND_URL` |

---

## 4. Admin Django (`/admin/`)

È abilitato l’admin standard Django su `http://localhost:8000/admin/` (o host/porta del deploy). Richiede utente con `is_staff` (il superutente creato con `create_superuser` ha `is_staff` e `is_superuser`).

Le API JSON documentate in [API-E-AUTENTICAZIONE.md](API-E-AUTENTICAZIONE.md) sono separate e usano Basic Auth sull’app custom.

### Stili dell’admin (CSS) con `DEBUG = False`

Con le impostazioni di produzione (`config.settings.base`, `DEBUG = False`) Django **non** serve da solo i file statici dell’admin. Nel progetto è configurato **WhiteNoise** e all’avvio del container viene eseguito `collectstatic`, così CSS e icone dell’admin sono serviti correttamente. Dopo un aggiornamento del backend, ricostruisci e riavvia l’immagine Docker se l’admin appare “senza stile”.

In sviluppo locale con `config.settings.development` (`DEBUG = True`), `runserver` serve i static dell’admin automaticamente.

---

## 5. Problemi frequenti

- **Backend non raggiunge Postgres:** verificare `DATABASE_URL`, firewall, e che il servizio `postgres` sia `healthy` prima del backend in Docker.
- **CORS nel browser:** l’origine della pagina (es. `http://localhost:5173`) deve essere consentita; allineare `FRONTEND_URL` o `CORS_ALLOWED_ORIGINS`.
- **PDF non generato:** controllare log Gunicorn/Django e che `pdflatex` sia installato sul sistema che esegue il backend.
- **Admin Django senza CSS (pagina bianca “grezza”):** tipico con `DEBUG = False` senza static raccolti; usare l’immagine aggiornata (WhiteNoise + `collectstatic`) oppure in locale eseguire `python manage.py collectstatic` con `STATIC_ROOT` configurato, oppure sviluppare con `config.settings.development`.
