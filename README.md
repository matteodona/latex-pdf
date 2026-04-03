# Generatore di template per documenti tecnici

Applicazione **Django + React (Vite)** per generare PDF da template LaTeX.

**Su questo branch** il progetto è pensato per essere **avviato in locale** (nessun Docker Compose nel repository). Servono due processi: backend sulla porta **3001** e frontend sulla porta **5173**.

---

## Requisiti

- **Python 3.12+**
- **Node.js** e **npm**
- **TeX Live** (o MacTeX) con `pdflatex` nel `PATH` (necessario per la generazione PDF)

---

## Avvio in locale

Usa **due terminali** (o due schede nel terminale).

### 1. Backend (Django)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
```

Imposta l’origine del frontend per **CORS** (deve coincidere con dove apri il browser, di solito `http://localhost:5173`):

```bash
export FRONTEND_URL=http://localhost:5173
```

**Solo la prima volta** (o se vuoi un nuovo amministratore), crea un superuser:

```bash
python manage.py create_superuser admin 'TuaPasswordSicura123!'
```

Avvia il server:

```bash
python manage.py runserver 0.0.0.0:3001
```

Lascia questo terminale aperto. Il backend sarà su **http://localhost:3001**.

### 2. Frontend (Vite)

```bash
cd frontend
npm install
export VITE_BACKEND_URL=http://localhost:3001
npm run dev
```

Apri **http://localhost:5173** nel browser e accedi con l’utente creato (o registrati, se previsto dal flusso).

---

## URL utili

| Cosa | URL |
|------|-----|
| App React | http://localhost:5173 |
| Login | http://localhost:5173/login |
| Area Admin (app React) | http://localhost:5173/admin (dopo login come superuser) |
| API (es. health) | http://localhost:3001/api/health |
| Admin Django (pannello nativo) | http://localhost:3001/admin |

Per l’admin Django usa le credenziali del **superuser** creato con `create_superuser`.

---

## Database in sviluppo

Con `config.settings.development` (default di `manage.py`) il database è **SQLite** in `backend/data/db.sqlite3`. Non è necessario installare PostgreSQL per lavorare in locale su questo branch.

---

## Note

- `manage.py` usa già **`config.settings.development`**.
- Se nel browser usi **http://127.0.0.1:5173** invece di `localhost`, imposta  
  `export FRONTEND_URL=http://127.0.0.1:5173` prima di `runserver`, altrimenti il browser può bloccare le chiamate API per CORS.
- Puoi creare un file **`frontend/.env`** con `VITE_BACKEND_URL=http://localhost:3001` per non dover esportare la variabile ogni volta (Vite legge i file `.env` all’avvio).
