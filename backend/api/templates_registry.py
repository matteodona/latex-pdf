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


def _safe_text(value: object, fallback: str = '') -> str:
    if isinstance(value, str):
        return value
    return fallback


def _safe_dict(value: object) -> dict:
    if isinstance(value, dict):
        return value
    return {}


def _normalize_manifest(manifest: dict, slug: str) -> dict:
    app_key = _safe_text(manifest.get('app_key'), 'legacy')
    manifest_version = _safe_text(manifest.get('manifest_version'), '1')
    compile_contract = _safe_dict(manifest.get('compile_contract'))
    form_schema = _safe_dict(manifest.get('form_schema'))

    return {
        'id': slug,
        'name': _safe_text(manifest.get('name')),
        'description': _safe_text(manifest.get('description')),
        'tag': _safe_text(manifest.get('tag')),
        'app_key': app_key or 'legacy',
        'manifest_version': manifest_version or '1',
        'compile_contract': {
            'input': _safe_text(compile_contract.get('input'), 'schema'),
            'output_filename': _safe_text(compile_contract.get('output_filename'), 'main.pdf'),
        },
        'form_schema': form_schema,
        'capabilities': _safe_dict(manifest.get('capabilities')),
    }


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
        normalized = _normalize_manifest(manifest, slug)
        out.append(
            {
                'id': normalized['id'],
                'name': normalized['name'],
                'description': normalized['description'],
                'tag': normalized['tag'],
                'app_key': normalized['app_key'],
                'manifest_version': normalized['manifest_version'],
                'compile_contract': normalized['compile_contract'],
                'form_schema': normalized['form_schema'],
                'capabilities': normalized['capabilities'],
            },
        )
    return out


def get_template_manifest(projects_base: Path, slug: str) -> tuple[dict | None, str | None]:
    project_dir, err_msg = resolve_template_project_dir(projects_base, slug)
    if project_dir is None:
        return None, err_msg
    manifest = _load_manifest(project_dir, slug)
    if manifest is None:
        return None, 'template non trovato'
    return _normalize_manifest(manifest, slug), None


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
