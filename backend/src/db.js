const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'users.db');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(DB_FILE);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
  `);

  // Migration: add role/status if table existed without them (SQLite 3.35+)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
  } catch {
    // column exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'`);
  } catch {
    // column exists
  }

  return db;
}

const db = ensureDb();

function getUserByUsername(username) {
  const stmt = db.prepare(
    `SELECT id, username, password_hash AS passwordHash, role, status, created_at AS createdAt
     FROM users WHERE username = ?`,
  );
  return stmt.get(username);
}

function createUser({ username, passwordHash, role = 'user', status = 'pending' }) {
  const stmt = db.prepare(
    'INSERT INTO users (username, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  const createdAt = new Date().toISOString();
  const info = stmt.run(username, passwordHash, role, status, createdAt);
  return { id: info.lastInsertRowid, username, passwordHash, role, status, createdAt };
}

function getPendingUsers() {
  const stmt = db.prepare(
    'SELECT id, username, created_at AS createdAt FROM users WHERE status = ? ORDER BY created_at ASC',
  );
  return stmt.all('pending');
}

function approveUser(id) {
  const stmt = db.prepare('UPDATE users SET status = ? WHERE id = ?');
  const info = stmt.run('approved', id);
  return info.changes > 0;
}

function rejectUser(id) {
  const stmt = db.prepare('UPDATE users SET status = ? WHERE id = ?');
  const info = stmt.run('rejected', id);
  return info.changes > 0;
}

function getAllUsers() {
  const stmt = db.prepare(
    `SELECT id,
            username,
            role,
            status,
            created_at AS createdAt
     FROM users
     WHERE status != 'pending'
     ORDER BY created_at ASC`,
  );
  return stmt.all();
}

function deleteUser(id) {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
}

module.exports = {
  getUserByUsername,
  createUser,
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllUsers,
  deleteUser,
};
