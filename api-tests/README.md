# API Tests (Backend)

Questa cartella contiene script Python per verificare rapidamente le API del backend
in ambiente locale o in produzione (es. Dokploy).

## Requisiti

- Python 3.10+
- Endpoint backend raggiungibile

Lo script usa solo librerie standard Python (nessuna dipendenza da installare).

## Esecuzione rapida

```bash
python3 api-tests/run_api_tests.py \
  --base-url "https://api.generatoredocumentazionetecnica.it/api" \
  --admin-user "<admin_username>" \
  --admin-pass "<admin_password>"
```

## Variabili supportate (alternative ai flag)

- `API_BASE_URL`
- `API_ADMIN_USER`
- `API_ADMIN_PASS`

Esempio:

```bash
export API_BASE_URL="https://api.generatoredocumentazionetecnica.it/api"
export API_ADMIN_USER="admin"
export API_ADMIN_PASS="password"
python3 api-tests/run_api_tests.py
```

## Cosa testa

1. `GET /health`
2. `GET /templates`
3. `POST /auth/register` (crea utente test)
4. `GET /admin/pending-users` (verifica presenza utente)
5. `POST /admin/users/<id>/approve`
6. `POST /auth/check` con utente approvato
7. `GET /admin/users`
8. `DELETE /admin/users/<id>` (cleanup)

Se non passi credenziali admin, viene eseguita solo la parte pubblica (`health` e `templates`).

