# Sviluppo locale

Questo repository e' configurato per sviluppo locale (senza container).

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
export FRONTEND_URL=http://localhost:5173
python manage.py runserver 0.0.0.0:3001
```

## Frontend

```bash
cd frontend
npm install
export VITE_BACKEND_URL=http://localhost:3001
npm run dev
```

## Admin frontend (app React)

- URL: `http://localhost:5173/admin`
- Accesso dopo login da `http://localhost:5173/login` con utente `superuser`.

## Admin Django (pannello nativo)

- URL: `http://localhost:3001/admin`
- Accesso con utente `superuser` creato via backend (`python manage.py create_superuser ...`).
