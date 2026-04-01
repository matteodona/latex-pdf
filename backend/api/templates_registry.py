import json
import re
from pathlib import Path

SLUG_RE = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')

REQUIRED_MANIFEST_KEYS = ('id', 'name', 'description', 'tag')


def is_valid_slug(slug: str) -> bool:
    return bool(slug and SLUG_RE.fullmatch(slug))


def _load_manifest(project_dir: Path, slug: str) -> dict | None:
    manifest_path = project_dir / 'template.json'
    if not manifest_path.is_file():
        return None
    try:
        data = json.loads(manifest_path.read_text(encoding='utf-8'))
    except (json.JSONDecodeError, OSError):
        return None
    if not isinstance(data, dict):
        return None
    for key in REQUIRED_MANIFEST_KEYS:
        val = data.get(key)
        if not val or not isinstance(val, str):
            return None
    if data['id'] != slug:
        return None
    return data


def list_templates(projects_base: Path) -> list[dict]:
    """Elenco template validi (cartella + main.tex + template.json coerente)."""
    if not projects_base.is_dir():
        return []
    out: list[dict] = []
    base_resolved = projects_base.resolve()
    for entry in sorted(projects_base.iterdir(), key=lambda p: p.name):
        if not entry.is_dir():
            continue
        slug = entry.name
        if not is_valid_slug(slug):
            continue
        project_dir = entry.resolve()
        try:
            project_dir.relative_to(base_resolved)
        except ValueError:
            continue
        if not (project_dir / 'main.tex').is_file():
            continue
        manifest = _load_manifest(project_dir, slug)
        if manifest is None:
            continue
        out.append(
            {
                'id': manifest['id'],
                'name': manifest['name'],
                'description': manifest['description'],
                'tag': manifest['tag'],
            },
        )
    return out


def resolve_template_project_dir(projects_base: Path, slug: str) -> tuple[Path | None, str | None]:
    """
    Restituisce (project_dir, None) se ok, altrimenti (None, messaggio_errore).
    """
    if not is_valid_slug(slug):
        return None, 'slug template non valido'
    base_resolved = projects_base.resolve()
    project_dir = (projects_base / slug).resolve()
    try:
        project_dir.relative_to(base_resolved)
    except ValueError:
        return None, 'template non trovato'
    if not project_dir.is_dir():
        return None, 'template non trovato'
    if not (project_dir / 'main.tex').is_file():
        return None, 'template non trovato'
    if _load_manifest(project_dir, slug) is None:
        return None, 'template non trovato'
    return project_dir, None
