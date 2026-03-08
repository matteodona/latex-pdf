const path = require('path');
const express = require('express');
const cors = require('cors');
const { compileToPdf } = require('./src');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Cartella che contiene i progetti LaTeX (una sottocartella per tipo documento)
const PROJECTS_BASE = path.join(__dirname, 'projects');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * GET /api/health
 * Health check per il frontend.
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /api/compile
 * Body: { projectPath: string, params?: object }
 * - projectPath: nome progetto, sottocartella di projects/ (es. "relazione-tecnica")
 * - params: struttura parametri che ricalca il progetto (come in examples/compile.js)
 * Risposta: PDF in binary (Content-Disposition: attachment) o 4xx/5xx con { error: string }
 */
app.post('/api/compile', (req, res) => {
  const { projectPath, params = {} } = req.body;

  if (!projectPath || typeof projectPath !== 'string') {
    return res.status(400).json({ error: 'projectPath obbligatorio (string)' });
  }

  // Evita path traversal: solo path relativi senza ..
  const normalized = path.normalize(projectPath);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    return res.status(400).json({ error: 'projectPath non valido' });
  }

  const projectDir = path.resolve(PROJECTS_BASE, normalized);
  if (!projectDir.startsWith(path.resolve(PROJECTS_BASE))) {
    return res.status(400).json({ error: 'projectPath non valido' });
  }

  try {
    const pdfPath = compileToPdf(projectDir, params);

    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({ error: 'PDF non generato' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="main.pdf"');
    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);
  } catch (err) {
    console.error('Compilazione fallita:', err.message);
    res.status(500).json({ error: err.message || 'Compilazione fallita' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend in ascolto su http://localhost:${PORT}`);
});
