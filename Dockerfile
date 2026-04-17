# Solo backend API (Django + Gunicorn). Il frontend ha un Dockerfile dedicato in frontend/.
FROM python:3.12-slim-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        texlive-latex-base \
        texlive-latex-recommended \
        texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh \
    && adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app

USER appuser
WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Host header: urllib non invia Host: api...; 127.0.0.1 deve essere in DJANGO_ALLOWED_HOSTS in produzione.
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; r=urllib.request.Request('http://127.0.0.1:8000/api/health', headers={'Host':'127.0.0.1'}); urllib.request.urlopen(r, timeout=5)"

ENTRYPOINT ["/docker-entrypoint.sh"]
