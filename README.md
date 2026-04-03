## Generatore di template per documenti tecnici

Guida minima per avviare il progetto in sviluppo locale.

### Requisiti

- Python 3.12+
- Node.js + npm
- TeX Live / MacTeX con `pdflatex` nel PATH

### 1) Avvio backend (Django)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
export FRONTEND_URL=http://localhost:5173
python manage.py create_superuser admin 'TuaPasswordSicura123!'
python manage.py runserver 0.0.0.0:3001
```

### 2) Avvio frontend (Vite)

```bash
cd frontend
npm install
export VITE_BACKEND_URL=http://localhost:3001
npm run dev
```

### 3) Uso

- Apri `http://localhost:5173`
- Accedi con l'utente creato al passo backend

### Admin frontend (app React)

- URL: `http://localhost:5173/admin`
- Come accedere:
  1. Avvia backend e frontend.
  2. Apri `http://localhost:5173/login`.
  3. Fai login con utente `superuser`.
  4. Vai su `http://localhost:5173/admin` oppure usa il pulsante **Admin** nella home.

### Admin Django (pannello nativo)

- URL: `http://localhost:3001/admin`
- Come accedere:
  1. Avvia il backend Django su porta `3001`.
  2. Crea (una sola volta) un superuser con `python manage.py create_superuser ...`.
  3. Apri `http://localhost:3001/admin` e fai login con quel superuser.

### Note utili

- `manage.py` usa già `config.settings.development` di default.
- Se usi `127.0.0.1` nel browser, imposta anche `FRONTEND_URL=http://127.0.0.1:5173`.
