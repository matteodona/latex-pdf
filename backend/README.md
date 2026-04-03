# Backend (sviluppo locale)

## Avvio rapido

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
export FRONTEND_URL=http://localhost:5173
python manage.py create_superuser <username> <password>
python manage.py runserver 0.0.0.0:3001
```

## Verifica

```bash
python manage.py check
```

## Admin Django (pannello nativo)

- URL: `http://localhost:3001/admin`
- Accesso:
  1. Avvia il backend (`python manage.py runserver 0.0.0.0:3001`).
  2. Crea un superuser (`python manage.py create_superuser ...`) se non esiste.
  3. Login su `http://localhost:3001/admin`.

## Admin frontend (app React)

- URL: `http://localhost:5173/admin`
- Accesso:
  1. Avvia anche il frontend (`npm run dev` in `frontend/`).
  2. Fai login da `http://localhost:5173/login` con utente `superuser`.
  3. Apri `http://localhost:5173/admin` o clicca **Admin** dalla home.
