import shutil
import subprocess
import tempfile
from pathlib import Path
import re


PARAM_KEY_RE = re.compile(r'^[A-Za-z0-9_-]+$')


def _read_text_file(path: Path) -> str:
    """Legge .tex: prova UTF-8 (anche con BOM), poi Windows-1252, infine Latin-1 (ogni byte → carattere)."""
    data = path.read_bytes()
    if data.startswith(b'\xef\xbb\xbf'):
        data = data[3:]
    try:
        return data.decode('utf-8')
    except UnicodeDecodeError:
        pass
    try:
        return data.decode('cp1252')
    except UnicodeDecodeError:
        pass
    return data.decode('latin-1')


def _write_text_file(path: Path, content: str) -> None:
    path.write_text(content, encoding='utf-8', newline='\n')


def _log_tail_for_error(work_dir: Path, max_lines: int = 35) -> str:
    log_path = work_dir / 'main.log'
    if not log_path.is_file():
        return ''
    try:
        lines = log_path.read_text(encoding='utf-8', errors='replace').splitlines()
        tail = '\n'.join(lines[-max_lines:])
        return f'\n\n--- main.log (ultime {max_lines} righe) ---\n{tail}'
    except OSError:
        return ''


def _is_file_node(obj):
    if obj is None or not isinstance(obj, dict):
        return False
    return all(
        v is None or not isinstance(v, dict) or isinstance(v, list)
        for v in obj.values()
    )


def _format_tabella_revisioni(rows):
    if not isinstance(rows, list) or len(rows) == 0:
        return ''
    lines = []
    for r in rows:
        if not isinstance(r, dict):
            r = {}
        num = str(r.get('numRevisione', '') or '')
        data = str(r.get('data', '') or '')
        desc = str(r.get('descrizioneRevisione', '') or '')
        lines.append(f'{num} & {data} & {desc} \\\\')
    return '\n\\hline\n'.join(lines)


def _safe_param_key(key):
    return isinstance(key, str) and bool(PARAM_KEY_RE.fullmatch(key))


def _flatten_params_structure(obj, path_prefix=''):
    result = []
    if obj is None or not isinstance(obj, dict):
        return result
    for key, val in obj.items():
        if not _safe_param_key(key):
            continue
        if val is not None and isinstance(val, dict) and not isinstance(val, list) and not _is_file_node(val):
            result.extend(_flatten_params_structure(val, path_prefix + key + '/'))
        elif _is_file_node(val):
            result.append({'filePath': path_prefix + key + '.tex', 'params': val})
    return result


def _has_params_in_structure(obj):
    if obj is None:
        return False
    if not isinstance(obj, dict) and not isinstance(obj, list):
        return str(obj).strip() != ''
    if isinstance(obj, list):
        return any(_has_params_in_structure(v) for v in obj)
    return any(_has_params_in_structure(v) for v in obj.values())


def _apply_params_to_file(dir_path: Path, file_path: str, params: dict):
    full_path = (dir_path / file_path).resolve()
    try:
        full_path.relative_to(dir_path.resolve())
    except ValueError:
        return
    if not full_path.is_file():
        return
    content = _read_text_file(full_path)
    for key, value in params.items():
        if not _safe_param_key(key):
            continue
        placeholder = '\\{' + key + '\\}'
        replacement = ''
        if isinstance(value, list):
            if key == 'tabellaRevisioni':
                replacement = _format_tabella_revisioni(value)
            else:
                replacement = ', '.join(str(x) for x in value)
        elif value is not None and str(value).strip() != '':
            replacement = str(value)
        content = replacement.join(content.split(placeholder))
    _write_text_file(full_path, content)


def _apply_params(dir_path: Path, params_structure: dict):
    for item in _flatten_params_structure(params_structure):
        _apply_params_to_file(dir_path, item['filePath'], item['params'])


def compile_to_pdf(project_dir: str | Path, params_structure=None) -> Path:
    if params_structure is None:
        params_structure = {}
    if not shutil.which('pdflatex'):
        raise RuntimeError(
            'pdflatex non è nel PATH. In locale installa TeX Live / MacTeX; in Docker usa l’immagine backend del progetto.',
        )
    dir_path = Path(project_dir).resolve()
    main_path = dir_path / 'main.tex'
    if not main_path.is_file():
        raise FileNotFoundError(f'main.tex non trovato in: {dir_path}')

    work_dir = dir_path
    temp_dir = None
    if _has_params_in_structure(params_structure):
        temp_dir = Path(tempfile.mkdtemp(prefix='latex-'))
        shutil.copytree(dir_path, temp_dir, dirs_exist_ok=True)
        work_dir = temp_dir
        stale_pdf = work_dir / 'main.pdf'
        if stale_pdf.is_file():
            stale_pdf.unlink()
        _apply_params(work_dir, params_structure)

    run_results = []
    try:
        for _ in range(2):
            run_results.append(
                subprocess.run(
                    ['pdflatex', '-interaction=nonstopmode', 'main.tex'],
                    cwd=work_dir,
                    capture_output=True,
                    check=False,
                )
            )
    except OSError:
        pass

    pdf_path = work_dir / 'main.pdf'
    # pdflatex puo` restituire returncode != 0 anche quando il PDF viene
    # comunque generato (warning/non-fatal issues). Consideriamo fallimento
    # solo se il file finale non esiste.
    if not pdf_path.is_file():
        hint = _log_tail_for_error(work_dir)
        if temp_dir is not None:
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise RuntimeError('PDF non generato.' + hint)

    if temp_dir is not None:
        shutil.copy2(pdf_path, dir_path / 'main.pdf')
        shutil.rmtree(temp_dir, ignore_errors=True)

    for f in ('main.aux', 'main.log', 'main.out', 'main.toc', 'main.lof', 'main.lot'):
        p = dir_path / f
        try:
            if p.is_file():
                p.unlink()
        except OSError:
            pass

    return dir_path / 'main.pdf'
