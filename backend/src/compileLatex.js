const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Un oggetto è un "nodo file" (parametri per un singolo .tex) se è un plain object
 * e ogni valore è primitivo o array (es. tabellaRevisioni).
 */
function isFileNode(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return Object.values(obj).every(
    (v) => v == null || typeof v !== 'object' || Array.isArray(v)
  );
}

/**
 * Formatta l'array di revisioni come righe LaTeX per la tabella (numRevisione & data & descrizioneRevisione).
 */
function formatTabellaRevisioni(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  return rows
    .map((r) => {
      const num = (r && r.numRevisione != null) ? String(r.numRevisione) : '';
      const data = (r && r.data != null) ? String(r.data) : '';
      const desc = (r && r.descrizioneRevisione != null) ? String(r.descrizioneRevisione) : '';
      return `${num} & ${data} & ${desc} \\\\`;
    })
    .join('\n\\hline\n');
}

/**
 * Appiattisce la struttura nidificata in una lista { filePath, params }.
 * La struttura segue le cartelle: sections.fontespizio -> sections/fontespizio.tex
 */
function flattenParamsStructure(obj, pathPrefix = '') {
  const result = [];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return result;

  for (const [key, val] of Object.entries(obj)) {
    if (val != null && typeof val === 'object' && !Array.isArray(val) && !isFileNode(val)) {
      result.push(...flattenParamsStructure(val, pathPrefix + key + '/'));
    } else if (isFileNode(val)) {
      result.push({ filePath: pathPrefix + key + '.tex', params: val });
    }
  }
  return result;
}

/**
 * True se la struttura (ricorsiva) ha almeno un valore valorizzato.
 */
function hasParamsInStructure(obj) {
  if (obj == null) return false;
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return String(obj).trim() !== '';
  }
  return Object.values(obj).some((v) => hasParamsInStructure(v));
}

/**
 * Sostituisce in un file i placeholder \{key\} con params[key].
 * Se il valore è un array (tabellaRevisioni), viene formattato come righe LaTeX.
 */
function applyParamsToFile(dir, filePath, params) {
  const fullPath = path.join(dir, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const [key, value] of Object.entries(params)) {
    const placeholder = '\\{' + key + '\\}';
    let replacement = '';
    if (Array.isArray(value)) {
      if (key === 'tabellaRevisioni') replacement = formatTabellaRevisioni(value);
      else replacement = value.map(String).join(', ');
    } else if (value != null && String(value).trim() !== '') {
      replacement = String(value);
    }
    if (replacement !== undefined) content = content.split(placeholder).join(replacement);
  }
  fs.writeFileSync(fullPath, content);
}

/**
 * Applica la struttura parametri (albero che ricalca il progetto) alla copia del progetto in dir.
 */
function applyParams(dir, paramsStructure) {
  const files = flattenParamsStructure(paramsStructure);
  for (const { filePath, params } of files) {
    applyParamsToFile(dir, filePath, params);
  }
}

/**
 * Compila il progetto LaTeX in PDF.
 * @param {string} projectDir - Cartella del progetto (contiene main.tex)
 * @param {object} [paramsStructure] - Struttura parametri che ricalca cartelle/file (es. sections.fontespizio, sections.chapters['01-premessa'])
 * @returns {string} Percorso del PDF generato (main.pdf)
 */
function compileToPdf(projectDir, paramsStructure = {}) {
  const dir = path.resolve(projectDir);
  const mainPath = path.join(dir, 'main.tex');

  if (!fs.existsSync(mainPath)) {
    throw new Error(`main.tex non trovato in: ${dir}`);
  }

  let workDir = dir;
  let tempDir = null;

  if (hasParamsInStructure(paramsStructure)) {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'latex-'));
    fs.cpSync(dir, tempDir, { recursive: true });
    workDir = tempDir;
    applyParams(workDir, paramsStructure);
  }

  try {
    execSync('pdflatex -interaction=nonstopmode main.tex', {
      cwd: workDir,
      stdio: 'ignore',
      shell: true,
    });
  } catch (_) {
    // LaTeX può uscire con codice 1 per warning (es. "Rerun"); conta solo se il PDF esiste
  }

  const pdfPath = path.join(workDir, 'main.pdf');
  if (!fs.existsSync(pdfPath)) {
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error('PDF non generato.');
  }

  if (tempDir) {
    fs.copyFileSync(pdfPath, path.join(dir, 'main.pdf'));
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  const auxFiles = ['main.aux', 'main.log', 'main.out', 'main.toc', 'main.lof', 'main.lot'];
  for (const f of auxFiles) {
    const p = path.join(dir, f);
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (_) {}
  }

  return path.join(dir, 'main.pdf');
}

module.exports = {
  compileToPdf,
  applyParams,
  flattenParamsStructure,
  hasParamsInStructure,
};
