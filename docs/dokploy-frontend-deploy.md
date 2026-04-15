# Dokploy Frontend Deploy (Checklist)

Questa guida evita i mismatch piu' comuni tra `Dockerfile`, `Build Path` e `Docker Context Path`.

## Prerequisiti

- File frontend presenti in `frontend/`:
  - `Dockerfile`
  - `nginx.conf`
  - `package.json`
  - `package-lock.json`
- Build arg API disponibile:
  - `VITE_BACKEND_URL=https://api.generatoredocumentazionetecnica.it`

## Configurazione Dokploy corretta (frontend)

- Build Type: `Dockerfile`
- Build Path: `frontend`
- Docker File: `Dockerfile`
- Docker Context Path: `.`
- Build-time Arguments:
  - `VITE_BACKEND_URL=https://api.generatoredocumentazionetecnica.it`

## Domain (frontend)

- Host: `generatoredocumentazionetecnica.it` (o `www`)
- Path: `/`
- Internal Path: `/`
- Container Port: `80`
- HTTPS: `ON` (Let's Encrypt)

## Verifica locale pre-deploy (consigliata)

```bash
docker build --no-cache -t cardy-web-localtest \
  --build-arg VITE_BACKEND_URL="https://api.generatoredocumentazionetecnica.it" \
  -f frontend/Dockerfile \
  frontend

docker run --rm -p 18080:80 cardy-web-localtest
```

In un secondo terminale:

```bash
curl -I http://localhost:18080
curl -I http://localhost:18080/login
```

Entrambe devono rispondere `HTTP/1.1 200`.

## Errori comuni e diagnosi rapida

### Errore

`COPY nginx.conf ... not found`

### Causa probabile

Il builder non sta usando context `frontend`.

### Fix

Verifica:

- Build Path = `frontend`
- Docker File = `Dockerfile`
- Docker Context Path = `.`

Salva entrambe le sezioni (Provider + Build Type) e fai redeploy con Clear Cache.

---

### Errore

`open Dockerfile.frontend: no such file or directory`

### Causa probabile

Campo Docker File rimasto su valore vecchio.

### Fix

Imposta Docker File = `Dockerfile` (con Build Path `frontend`).

---

### Errore

Frontend raggiungibile ma API non funzionanti

### Causa probabile

`VITE_BACKEND_URL` errato al build time.

### Fix

Rebuild/redeploy con build arg corretto e verifica in browser (Network) che le chiamate vadano a `https://api.generatoredocumentazionetecnica.it`.
