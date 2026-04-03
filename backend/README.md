# Backend Django

Server API per autenticazione (Basic Auth), amministrazione utenti custom e **compilazione PDF** da progetti LaTeX in `projects/`.

## Requisiti

- Python **3.12+** consigliato
- Dipendenze: `pip install -r requirements.txt`
- **PostgreSQL** se usi `DATABASE_URL`, altrimenti SQLite in `data/db.sqlite3`
- **pdflatex** nel `PATH` per generazione PDF (in Docker è incluso nell’immagine)

## Configurazione

Copiare `.env.example` in `.env` e impostare almeno:

- `DATABASE_URL` (opzionale: senza di essa si usa SQLite)
- In produzione con `config.settings.base`: `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`

Impostazioni:

- **`config.settings.development`**: debug, `SECRET_KEY` di default per sviluppo (vedi `manage.py`)
- **`config.settings.base`**: produzione (`DEBUG=False`), usata dal Dockerfile

## Comandi utili

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
python manage.py create_superuser USERNAME 'PASSWORD'
```

## Struttura (principale)

```
backend/
├── manage.py
├── requirements.txt
├── config/                 # settings, urls, wsgi
├── accounts/               # modello User custom, migrazioni
├── api/                    # viste REST, compile_latex, registry template
└── projects/               # Un sottoprogetto LaTeX per cartella (template)
```

## Documentazione estesa

- Setup Docker, Postgres, variabili: [../docs/SETUP-E-DEPLOY.md](../docs/SETUP-E-DEPLOY.md)
- API e autenticazione: [../docs/API-E-AUTENTICAZIONE.md](../docs/API-E-AUTENTICAZIONE.md)
- Template LaTeX: [../docs/TEMPLATE-E-COMPILAZIONE.md](../docs/TEMPLATE-E-COMPILAZIONE.md)
