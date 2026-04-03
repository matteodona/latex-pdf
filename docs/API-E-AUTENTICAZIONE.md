# API REST e autenticazione

Il backend espone le API sotto il prefisso **`/api/`** (vedi `backend/config/urls.py` e `backend/api/urls.py`).  
Tutte le risposte rilevanti sono **JSON**, salvo dove indicato esplicitamente (download PDF).

**Base URL di esempio:** `http://localhost:8000`

## Convenzioni generali

- **Content-Type** per body JSON: `application/json; charset=utf-8`
- **CSRF:** le viste API usano `@csrf_exempt` per consentire chiamate dal frontend senza token CSRF (tipico per API JSON + Basic Auth). In produzione valutare hardening aggiuntivo (HTTPS, rate limiting).
- **Autenticazione Basic:** dove richiesta, inviare l’header  
  `Authorization: Basic base64(username:password)`

---

## Modello utente (sintesi)

`accounts.User` (estende `AbstractBaseUser`):

- **`username`**: univoco
- **`role`**: `user` | `superuser`
- **`status`**: `pending` | `approved` | `rejected`
- Campi Django standard: `is_active`, `is_staff`, `is_superuser`, `created_at`

Regole di accesso alle API protette (implementate in `api/auth_basic.py`):

- Credenziali valide **e** (`superuser` **oppure** `status = approved`) → accesso consentito
- `pending` → **403** con messaggio che indica attesa approvazione

---

## Endpoint pubblici (senza Basic Auth)

### `GET /api/health`

Health check.

**Risposta 200:**

```json
{
  "status": "ok",
  "timestamp": "2026-04-03T12:00:00+02:00"
}
```

---

### `POST /api/auth/register`

Registrazione nuovo utente: crea account in stato **`pending`**.

**Body:**

```json
{
  "username": "nuovo_utente",
  "password": "..."
}
```

**Risposte:**

- **201**: registrazione accettata (messaggio informativo)
- **400**: JSON non valido o campi mancanti
- **409**: username già in uso

---

### `GET /api/templates`

Elenco template disponibili (cartelle in `backend/projects/` con `main.tex` e `template.json` validi).

**Risposta 200:**

```json
{
  "templates": [
    {
      "id": "slug-cartella",
      "name": "...",
      "description": "...",
      "tag": "..."
    }
  ]
}
```

---

### `GET /api/templates/<slug>`

Dettaglio manifest di un template (include metadati e, se presenti, `form_schema` per validazione).

**Errori:**

- **404**: template non trovato o manifest non valido

---

## Endpoint con Basic Auth

### `POST /api/auth/check`

Verifica credenziali e restituisce ruolo. Usato dal frontend dopo il login.

**Header:** `Authorization: Basic ...`

**Risposta 200:**

```json
{
  "ok": true,
  "username": "mario",
  "role": "user"
}
```

`role` può essere `user` o `superuser`.

**Errori:** **401** / **403** secondo logica in `auth_basic`.

---

### `POST /api/templates/<slug>/compile`

Compila il progetto LaTeX associato allo **slug** e restituisce il **file PDF**.

**Header:**

- `Authorization: Basic ...` (obbligatorio)
- `Content-Type: application/json`

**Body (schema tipico):**

```json
{
  "params": {}
}
```

Il contenuto di `params` dipende dal **`form_schema`** definito in `template.json` del progetto. Se presente uno schema con `fields`, i parametri vengono validati (`api/schema_validation.py`) prima della compilazione. I parametri possono essere adattati per il motore LaTeX tramite `api/template_adapters.py` (`adapt_compile_params`).

**Risposta 200:** stream **PDF** (`Content-Type: application/pdf`, allegato `main.pdf` o nome da contratto).

**Errori:** **400** (payload non valido, dettaglio `fields`), **404** (template assente), **500** (compilazione LaTeX fallita).

---

## Endpoint amministratore (Basic Auth + superuser)

Tutti richiedono utente con **`role = superuser`** (oltre a regole Basic già descritte).

### `GET /api/admin/pending-users`

Utenti in attesa di approvazione.

**Risposta 200:**

```json
{
  "users": [
    {
      "id": 1,
      "username": "...",
      "createdAt": "2026-04-03T10:00:00+02:00"
    }
  ]
}
```

---

### `GET /api/admin/users`

Utenti non in stato `pending` (approvati, rifiutati, superuser, ecc. secondo query nel codice).

**Risposta 200:**

```json
{
  "users": [
    {
      "id": 2,
      "username": "...",
      "role": "user",
      "status": "approved",
      "createdAt": "..."
    }
  ]
}
```

---

### `POST /api/admin/users/<id>/approve`

Approva l’utente `id` (imposta `status = approved`).

**Risposta 200:** messaggio di conferma  
**404:** utente non trovato

---

### `POST /api/admin/users/<id>/reject`

Rifiuta la richiesta (`status = rejected`).

---

### `DELETE /api/admin/users/<id>`

Elimina un utente. **Non** è possibile eliminare un superutente.

---

## Nota sull’allineamento frontend / backend

Il backend Django espone la compilazione come:

`POST /api/templates/<slug>/compile`

con corpo `{"params": { ... }}`.  
Se un client invoca ancora un path legacy del tipo `POST /api/compile`, quella route **non** è registrata in Django: va aggiornato il client per usare lo **slug** del template nell’URL e il payload atteso.
