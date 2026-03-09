const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { compileToPdf } = require('./src');
const fs = require('fs');
const db = require('./src/db');
const { basicAuth, requireSuperuser } = require('./src/basicAuth');

const app = express();
const PORT = process.env.PORT || 3001;

// Cartella che contiene i progetti LaTeX (una sottocartella per tipo documento)
const PROJECTS_BASE = path.join(__dirname, 'projects');

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: false,
  }),
);
app.use(express.json({ limit: '10mb' }));

/**
 * GET /api/health
 * Health check per il frontend (non autenticato).
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Registrazione: crea utente in attesa di approvazione (nessuna auth)
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (
    !username ||
    typeof username !== 'string' ||
    !password ||
    typeof password !== 'string'
  ) {
    return res
      .status(400)
      .json({ error: 'username e password sono obbligatori' });
  }
  const existing = db.getUserByUsername(username);
  if (existing) {
    return res.status(409).json({ error: 'Username già in uso' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    db.createUser({ username, passwordHash, role: 'user', status: 'pending' });
    return res.status(201).json({
      message: 'Richiesta inviata. L’account sarà attivo dopo l’approvazione dell’amministratore.',
    });
  } catch (err) {
    console.error('Errore registrazione:', err);
    return res.status(500).json({ error: 'Errore durante la registrazione' });
  }
});

// Verifica credenziali Basic Auth; ritorna anche il ruolo (superuser / user)
app.post('/api/auth/check', basicAuth, (req, res) => {
  res.json({
    ok: true,
    username: req.user.username,
    role: req.user.role,
  });
});

/**
 * POST /api/compile
 * Body: { projectPath: string, params?: object }
 * - projectPath: nome progetto, sottocartella di projects/
 *   (es. "relazione-tecnico-specialistica-domestico-tt-cpi")
 * - params: struttura parametri che ricalca il progetto (come in examples/compile.js)
 * Risposta: PDF in binary (Content-Disposition: attachment) o 4xx/5xx con { error: string }
 * Protetto da Basic Auth.
 */
app.post('/api/compile', basicAuth, (req, res) => {
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

// ——— Area admin (solo superuser) ———
app.get(
  '/api/admin/pending-users',
  basicAuth,
  requireSuperuser,
  (req, res) => {
    const list = db.getPendingUsers();
    res.json({ users: list });
  },
);

app.post(
  '/api/admin/users/:id/approve',
  basicAuth,
  requireSuperuser,
  (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID non valido' });
    }
    const ok = db.approveUser(id);
    if (!ok) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json({ message: 'Utente approvato' });
  },
);

app.post(
  '/api/admin/users/:id/reject',
  basicAuth,
  requireSuperuser,
  (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID non valido' });
    }
    const ok = db.rejectUser(id);
    if (!ok) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json({ message: 'Richiesta rifiutata' });
  },
);

// Elenco completo utenti (solo superuser)
app.get(
  '/api/admin/users',
  basicAuth,
  requireSuperuser,
  (req, res) => {
    const users = db.getAllUsers();
    res.json({ users });
  },
);

// Eliminazione utente (solo superuser, non puoi eliminare i superuser)
app.delete(
  '/api/admin/users/:id',
  basicAuth,
  requireSuperuser,
  (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID non valido' });
    }

    const users = db.getAllUsers();
    const user = users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    if (user.role === 'superuser') {
      return res
        .status(400)
        .json({ error: 'Non è possibile eliminare un superutente' });
    }

    const ok = db.deleteUser(id);
    if (!ok) {
      return res.status(500).json({ error: 'Impossibile eliminare utente' });
    }
    return res.json({ message: 'Utente eliminato' });
  },
);

app.listen(PORT, () => {
  console.log(`Backend in ascolto su http://localhost:${PORT}`);
});
