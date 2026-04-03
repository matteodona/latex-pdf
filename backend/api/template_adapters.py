from __future__ import annotations

import json
import re
import secrets
from pathlib import Path

_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
_DIGITS = '0123456789'
_ALPHANUM = _LETTERS + _DIGITS


def generate_project_code() -> str:
    """10 caratteri alfanumerici (A–Z, 0–9) con almeno una lettera e una cifra."""
    for _ in range(64):
        chars = [secrets.choice(_ALPHANUM) for _ in range(10)]
        s = ''.join(chars)
        has_letter = any(c in _LETTERS for c in s)
        has_digit = any(c in _DIGITS for c in s)
        if has_letter and has_digit:
            return s
    return (
        secrets.choice(_LETTERS)
        + secrets.choice(_DIGITS)
        + ''.join(secrets.choice(_ALPHANUM) for _ in range(8))
    )


def ensure_codice_progetto(
    params: dict,
    template_manifest: dict | None = None,
    project_dir: str | Path | None = None,
) -> None:
    """Imposta codiceProgetto solo da binding parameters.json (senza campo in form)."""
    if template_manifest is None or project_dir is None:
        return
    pd = Path(project_dir)
    if not pd.is_dir():
        return
    if not _bindings_need_codice_progetto(template_manifest, pd):
        return
    params['codiceProgetto'] = generate_project_code()

def _safe_str(value: object, fallback: str = '') -> str:
    if value is None:
        return fallback
    return str(value)


def _normalize_revisioni(params: dict) -> list[dict]:
    revisioni = params.get('revisioni')
    if not isinstance(revisioni, list) or len(revisioni) == 0:
        return [
            {
                'numRevisione': '0',
                'data': _safe_str(params.get('dataGenerazioneDocumento')),
                'descrizioneRevisione': 'Emissione documento',
            },
        ]

    out: list[dict] = []
    for index, row in enumerate(revisioni):
        if not isinstance(row, dict):
            row = {}
        out.append(
            {
                'numRevisione': '0' if index == 0 else _safe_str(row.get('numRevisione')),
                'data': (
                    _safe_str(params.get('dataGenerazioneDocumento'))
                    if index == 0
                    else _safe_str(row.get('data'))
                ),
                'descrizioneRevisione': _safe_str(row.get('descrizioneRevisione')),
            },
        )
    return out


def _format_date_dd_mm_yyyy(value: object) -> str:
    s = _safe_str(value).strip()
    if not s:
        return ''
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})', s)
    if m:
        return f'{m.group(3)}-{m.group(2)}-{m.group(1)}'
    m2 = re.match(r'^(\d{1,2})[/-](\d{1,2})[/-](\d{4})', s)
    if m2:
        d, mo, y = int(m2.group(1)), int(m2.group(2)), m2.group(3)
        return f'{d:02d}-{mo:02d}-{y}'
    return s


def _get_path(params: dict, key: str):
    current = params
    for part in key.split('.'):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


_CABLE_TYPE_ORDER = (
    'FG 16 (O) M 16',
    'FG 16 (O) R 16',
    'FS 17',
    'LAN',
)
_CABLE_TYPE_TEXT = {
    'FG 16 (O) M 16': 'testo FG 16 (O) M 16',
    'FG 16 (O) R 16': 'testo FG 16 (O) R 16',
    'FS 17': 'testo FS 17',
    'LAN': 'testo lan',
}


def _format_cable_types_bullets(params: dict) -> str:
    raw = params.get('tipiDiCavo')
    if not isinstance(raw, list):
        return ''
    selected = {str(x).strip() for x in raw if isinstance(x, str)}
    lines: list[str] = []
    for key in _CABLE_TYPE_ORDER:
        if key in selected:
            txt = _CABLE_TYPE_TEXT.get(key, '')
            if txt:
                lines.append(f'    \\item {txt}')
    return '\n'.join(lines)


def _apply_transform(value, transform: str, params: dict):
    if transform == 'as_string':
        return _safe_str(value)
    if transform == 'date_dd_mm_yyyy':
        return _format_date_dd_mm_yyyy(value)
    if transform == 'append_volt':
        return f'{_safe_str(value)}\\,V'
    if transform == 'map_short_circuit':
        return '6' if _safe_str(params.get('tensioneAlimentazione')) == '230' else '10'
    if transform == 'map_wallbox_phase':
        return 'F' if _safe_str(params.get('tensioneAlimentazione')) == '230' else '3F'
    if transform == 'revision_table':
        return _normalize_revisioni(params)
    if transform == 'latest_revision_num':
        revs = _normalize_revisioni(params)
        if not revs:
            return '0'
        last = revs[-1]
        return _safe_str((last.get('numRevisione') if isinstance(last, dict) else None) or '0')
    if transform == 'cable_types_bullets':
        return _format_cable_types_bullets(params)
    return value


def _insert_target(structure: dict, target: str, placeholder: str, value):
    clean = target[:-4] if target.endswith('.tex') else target
    clean = clean.lstrip('/').rstrip('/')
    parts = [p for p in clean.split('/') if p]
    current = structure
    for part in parts:
        current = current.setdefault(part, {})
    current[placeholder] = value


def _load_parameters_spec(template_manifest: dict, project_dir: Path) -> dict:
    filename = str(template_manifest.get('parameters_file') or 'parameters.json')
    spec_path = project_dir / filename
    if not spec_path.is_file():
        return {}
    try:
        data = json.loads(spec_path.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def _bindings_need_codice_progetto(template_manifest: dict, project_dir: Path) -> bool:
    spec = _load_parameters_spec(template_manifest, project_dir)
    bindings = spec.get('bindings')
    if not isinstance(bindings, list):
        return False
    for b in bindings:
        if not isinstance(b, dict):
            continue
        if b.get('source') == 'codiceProgetto' or b.get('placeholder') == 'codiceProgetto':
            return True
    return False


def _map_by_spec(template_manifest: dict, raw_params: dict, project_dir: Path) -> dict:
    spec = _load_parameters_spec(template_manifest, project_dir)
    bindings = spec.get('bindings')
    if not isinstance(bindings, list):
        return {}

    structure: dict = {}
    for binding in bindings:
        if not isinstance(binding, dict):
            continue
        target = binding.get('target')
        placeholder = binding.get('placeholder')
        source = binding.get('source')
        transform = str(binding.get('transform') or '')
        default = binding.get('default')
        if not isinstance(target, str) or not target:
            continue
        if not isinstance(placeholder, str) or not placeholder:
            continue
        if isinstance(source, str) and source:
            raw_value = _get_path(raw_params, source)
        else:
            raw_value = None
        if raw_value is None:
            raw_value = default
        value = _apply_transform(raw_value, transform, raw_params)
        _insert_target(structure, target, placeholder, value)

    return structure


def adapt_compile_params(template_manifest: dict, raw_params: dict, project_dir: str | Path) -> dict:
    contract = template_manifest.get('compile_contract')
    input_kind = ''
    if isinstance(contract, dict):
        input_kind = str(contract.get('input') or '')

    if input_kind == 'legacy-sections':
        return raw_params

    rp = dict(raw_params) if isinstance(raw_params, dict) else {}
    ensure_codice_progetto(rp, template_manifest, Path(project_dir))
    mapped = _map_by_spec(template_manifest, rp, Path(project_dir))
    if mapped:
        return mapped

    return {}
