## Generatore di template per documenti tecnici

Questo progetto è un **generatore di PDF** basato su **template LaTeX**, con:

- **backend Node/Express** che:
  - gestisce autenticazione (Basic Auth con utenti salvati in SQLite),
  - compila **diversi progetti LaTeX** in PDF tramite `pdflatex`,
  - espone API REST al frontend.
- **frontend React** che:
  - mostra la schermata di login/registrazione e l’area admin,
  - elenca i template disponibili,
  - per ogni template chiede i parametri e mostra il PDF generato.

---

## 1. Struttura del progetto

### 1.1. Cartelle principali

- `backend/` – server Express, compilazione LaTeX e gestione utenti.
- `frontend/` – applicazione React (Vite) che usa le API del backend.

### 1.2. Backend

Dentro `backend/` trovi:

- `package.json`  
  Dipendenze (`express`, `cors`, `better-sqlite3`, `bcryptjs`, …) e script:
  - `npm start` → avvia il server.

- `index.js`  
  Entrypoint del server Express.

  Route principali:

  - `POST /api/auth/register`
    - Input: `{ username, password }`.
    - Crea un utente **in attesa** (`status = 'pending'`).
  - `POST /api/auth/check`
    - Richiede header HTTP:
      - `Authorization: Basic base64(username:password)`.
    - Se credenziali corrette e:
      - utente è `superuser` **oppure** `status = 'approved'` → OK.
      - altrimenti 403 “account in attesa di approvazione”.
    - Risposta: `{ ok: true, username, role }`.
  - `POST /api/compile`
    - Protetta da Basic Auth.
    - Input:
      ```json
      {
        "projectPath": "nome-cartella-template",
        "params": { }
      }
      ```
    - Usa `compileToPdf` per compilare il progetto `backend/projects/<projectPath>` in PDF.

  - Endpoint **admin** (solo superuser):
    - `GET /api/admin/pending-users` → lista utenti `pending`.
    - `POST /api/admin/users/:id/approve` → approva utente.
    - `POST /api/admin/users/:id/reject` → rifiuta richiesta.
    - `GET /api/admin/users` → tutti gli utenti non `pending`.
    - `DELETE /api/admin/users/:id` → elimina utente (non superuser).

- `src/compileLatex.js`  
  Funzioni per compilare LaTeX:

  - `compileToPdf(projectDir, paramsStructure?)`:
    - verifica che esista `main.tex` in `projectDir`,
    - se `paramsStructure` non è vuota:
      - copia il progetto in una cartella temporanea,
      - sostituisce i placeholder `{chiave}` nei `.tex` usando la struttura dei parametri,
    - esegue `pdflatex` due volte,
    - copia il `main.pdf` generato nella cartella originale,
    - pulisce i file ausiliari (`.aux`, `.log`, …),
    - restituisce il percorso del PDF.

- `src/basicAuth.js`

  - `basicAuth(req, res, next)`:
    - legge `Authorization: Basic ...`,
    - decodifica `username:password`,
    - cerca l’utente in SQLite (`db.getUserByUsername`),
    - confronta la password con `bcrypt.compare`,
    - consente l’accesso solo se:
      - credenziali corrette **e**
      - utente è `superuser` **oppure** `status = 'approved'`.
    - se `status = 'pending'` → 403 con messaggio “in attesa di approvazione”.

  - `requireSuperuser(req, res, next)`:
    - permette l’accesso solo a `role === 'superuser'`.

- `src/db.js`  
  Wrapper su SQLite (`data/users.db`):

  - Crea la tabella `users` se non esiste:
    - `id`, `username`, `password_hash`, `role`, `status`, `created_at`.
  - Funzioni:
    - `getUserByUsername(username)`
    - `createUser({ username, passwordHash, role, status })`
    - `getPendingUsers()`
    - `approveUser(id)`
    - `rejectUser(id)`
    - `getAllUsers()` (solo non `pending`)
    - `deleteUser(id)`

- `scripts/createSuperUser.js`  
  Script da CLI per creare il primo superutente:
  ```bash
  cd backend
  node scripts/createSuperUser.js admin 'TuaPasswordSicura123!'
  ```

- `projects/`  
  Ogni sottocartella è un **template LaTeX** indipendente:

  - `relazione-tecnico-specialistica-domestico-tt-cpi/` – template principale della relazione tecnica.
  - `template-di-prova/` – template di prova minimale, con `main.tex` semplice e pochi placeholder.

### 1.3. Frontend

Dentro `frontend/` trovi:

- `package.json`  
  Dipendenze React/Vite e script:
  - `npm run dev` → dev server,
  - `npm run build` → build di produzione,
  - `npm run preview` → serve la build generata.

- `src/main.tsx`  
  Entrypoint React:
  - monta `AuthProvider` (contesto di autenticazione),
  - configura le route:
    - `/login` – login,
    - `/register` – registrazione,
    - `/admin` – area amministratore (protetta),
    - `/` e `/:templateId` – app principale (protetta).

- `src/types.ts`
  - `RelazioneTecnicaParams` – struttura dei parametri per la relazione tecnica.
  - `CompileState` – stato (`idle | loading | success | error`).
  - `TemplateId` – identificatori dei template disponibili.
  - `TemplateDefinition` – id, nome, descrizione, tag, `projectPath`.

- `src/auth/*`  
  Tutta la logica di autenticazione:
  - `AuthContext` – login/logout Basic Auth, salvataggio in `localStorage`.
  - `LoginPage` – schermata di accesso.
  - `RegisterPage` – schermata di registrazione.
  - `ProtectedRoute` – protegge le route per gli utenti loggati.
  - `SuperuserRoute` – protegge le route riservate al superuser.
  - `AdminPage` – approvazione richieste e gestione utenti.

- `src/App.tsx`  
  Componente principale (dopo il login):
  - definisce `TEMPLATES` (lista dei template LaTeX disponibili),
  - mostra la lista dei template o il form/anteprima del template selezionato,
  - chiama il backend per generare il PDF.

- `src/components/*`  
  - `TemplateList` – lista dei template disponibili.
  - `RelazioneTecnicaForm` – form per inserire i parametri (attuale template).
  - `PdfPreview` – anteprima del PDF generato.

---

## 2. Requisiti

Per usare il progetto in locale servono:

- **Node.js** (≥ 16) e **npm**,
- una distribuzione **LaTeX** con il comando `pdflatex` disponibile nel PATH (es. TeX Live o MacTeX).

---

## 3. Avvio del progetto

### 3.1. Installazione dipendenze

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### 3.2. Creare il superuser

Esegui una sola volta:

```bash
cd backend
node scripts/createSuperUser.js admin 'TuaPasswordSicura123!'
```

### 3.3. Avviare backend e frontend

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm run dev
```

Apri il browser su `http://localhost:5173`.

---

## 4. Uso dell’applicazione

### 4.1. Login / Registrazione

- Vai su `http://localhost:5173`.
- Se non sei loggato vieni portato alla pagina di **login** (`/login`).
- Puoi:
  - accedere come superuser (username/password creati con `createSuperUser.js`),
  - registrare un nuovo utente da `/register`.

Gli utenti nuovi sono creati in stato `pending` e non possono generare PDF finché non vengono approvati dall’admin.

### 4.2. Area Admin

1. Accedi come superuser.
2. Clicca su **Admin** in alto a destra.
3. Nella pagina admin puoi:
   - vedere e approvare/rifiutare le richieste in attesa,
   - vedere tutti gli utenti approvati/rifiutati,
   - eliminare utenti non superuser.

### 4.3. Generare un PDF da un template

1. Dopo il login, la home mostra:
   - il titolo principale,
   - il saluto “Ciao Nome”,
   - la lista dei template disponibili.
2. Clicca su un template:
   - compila i campi del form,
   - clicca **“Genera PDF”**.
3. Il PDF:
   - viene generato dal backend usando il progetto LaTeX collegato a quel template,
   - viene mostrato in anteprima e può essere scaricato.

---

## 5. Aggiungere nuovi template LaTeX

Per aggiungere un nuovo tipo di documento:

1. **Backend**
   - crea una cartella in `backend/projects/` con il tuo nuovo `main.tex`,
   - se vuoi usare parametri dinamici, inserisci placeholder `{chiave}` nel LaTeX.

2. **Frontend**
   - aggiungi l’ID del template in `src/types.ts` (`TemplateId`),
   - aggiungi una voce a `TEMPLATES` in `App.tsx`:
     - `id`, `name`, `description`, `tag`, `projectPath` (nome della cartella),
   - opzionale ma consigliato: se i parametri sono diversi, crea un form dedicato e mappa i suoi campi sui placeholder del LaTeX.

Non serve cambiare il backend: la funzione di compilazione è già generica e funziona con qualunque cartella LaTeX dotata di `main.tex`.
