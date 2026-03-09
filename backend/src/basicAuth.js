const bcrypt = require('bcryptjs');
const { getUserByUsername } = require('./db');

function basicAuth(req, res, next) {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="latexPdf"');
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const base64 = header.slice('Basic '.length);
  let decoded;
  try {
    decoded = Buffer.from(base64, 'base64').toString('utf8');
  } catch {
    return res.status(400).json({ error: 'Header Authorization non valido' });
  }

  const index = decoded.indexOf(':');
  if (index === -1) {
    return res.status(400).json({ error: 'Credenziali non valide' });
  }

  const username = decoded.slice(0, index);
  const password = decoded.slice(index + 1);

  const user = getUserByUsername(username);
  if (!user || !user.passwordHash) {
    res.setHeader('WWW-Authenticate', 'Basic realm="latexPdf"');
    return res.status(401).json({ error: 'Credenziali non valide' });
  }

  bcrypt
    .compare(password, user.passwordHash)
    .then((ok) => {
      if (!ok) {
        res.setHeader('WWW-Authenticate', 'Basic realm="latexPdf"');
        return res.status(401).json({ error: 'Credenziali non valide' });
      }
      if (user.role !== 'superuser' && user.status !== 'approved') {
        return res.status(403).json({
          error: 'Account in attesa di approvazione da parte dell’amministratore.',
        });
      }
      req.user = { id: user.id, username: user.username, role: user.role };
      return next();
    })
    .catch(() => {
      return res.status(500).json({ error: 'Errore di autenticazione' });
    });
}

function requireSuperuser(req, res, next) {
  if (req.user && req.user.role === 'superuser') {
    return next();
  }
  return res.status(403).json({ error: 'Accesso riservato al superutente' });
}

module.exports = { basicAuth, requireSuperuser };
