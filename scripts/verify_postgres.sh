#!/usr/bin/env bash
# Verifica che Postgres (Docker) sia su e che Django esegua migrate contro il DB.
# Richiede: Docker avviato, dalla root del repo.
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose up -d postgres
docker compose build backend
docker compose run --rm backend python manage.py migrate --noinput
docker compose run --rm backend python manage.py check --database default
echo "OK: PostgreSQL raggiungibile e migrazioni applicate."
