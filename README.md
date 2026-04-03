# Generatore di documentazione tecnica (PDF da template LaTeX)

Applicazione web per generare **PDF** a partire da **progetti LaTeX** parametrizzati: un **backend Django** espone API REST, un **frontend React (Vite)** gestisce login e compilazione, **PostgreSQL** (o SQLite in sviluppo) memorizza gli utenti.

## Stack

| Componente | Tecnologia |
|------------|------------|
| Backend API | **Django 5**, **Gunicorn** |
| Database | **PostgreSQL** (produzione / Docker) o **SQLite** (sviluppo locale senza `DATABASE_URL`) |
| Autenticazione | **HTTP Basic Auth** verso le API; utenti Django custom (`accounts.User`) |
| Compilazione PDF | `pdflatex` (TeX Live nell’immagine Docker) |
| Frontend | **React**, **TypeScript**, **Vite** |

## Avvio rapido (Docker)

Prerequisiti: **Docker** e **Docker Compose**.

```bash
docker compose build
docker compose up
```

- **Frontend:** `http://localhost:8080` (porta mappata dal container; Vite in dev dentro l’immagine frontend).
- **Backend API:** `http://localhost:8000`
- **PostgreSQL:** servizio interno `postgres`; i dati persistono nel volume `postgres-data`.

Creazione del **primo superutente** (una tantum, con i container avviati):

```bash
docker exec -it latex-backend python manage.py create_superuser admin 'LaTuaPasswordSicura'
```

Verifica che Postgres sia raggiungibile e le migrazioni applicate:

```bash
./scripts/verify_postgres.sh
```

Per fermare:

```bash
docker compose down
```

## Documentazione dettagliata

| Documento | Contenuto |
|-----------|-----------|
| [docs/SETUP-E-DEPLOY.md](docs/SETUP-E-DEPLOY.md) | Variabili d’ambiente, Docker, database, migrazioni, sviluppo locale senza container |
| [docs/API-E-AUTENTICAZIONE.md](docs/API-E-AUTENTICAZIONE.md) | Elenco endpoint REST, Basic Auth, area admin |
| [docs/TEMPLATE-E-COMPILAZIONE.md](docs/TEMPLATE-E-COMPILAZIONE.md) | Struttura `backend/projects/`, `template.json`, schema form, flusso di compilazione |

Note specifiche sul codice Python del backend: [backend/README.md](backend/README.md).

## Struttura delle cartelle (sintesi)

```
├── backend/                 # Django: api, accounts, config, projects/ (template LaTeX)
├── frontend/                # React + Vite
├── docker-compose.yml         # postgres, backend, frontend
├── scripts/verify_postgres.sh
└── docs/                    # Guide operative
```

## Sicurezza in produzione

Impostare almeno:

- `DJANGO_SECRET_KEY` (stringa lunga e segreta)
- `DJANGO_ALLOWED_HOSTS` coerente con il dominio
- `POSTGRES_PASSWORD` (e utente/database) non di default
- HTTPS davanti al backend e al frontend; valutare restrizioni CORS (`FRONTEND_URL` / `CORS_ALLOWED_ORIGINS`)

---

Per approfondimenti operativi, partire da [docs/SETUP-E-DEPLOY.md](docs/SETUP-E-DEPLOY.md).
