import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../apiBaseUrl';

type PendingUser = {
  id: number;
  username: string;
  createdAt: string;
};

type User = {
  id: number;
  username: string;
  role: 'user' | 'superuser';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export function AdminPage() {
  const { state, getAuthorizationHeader } = useAuth();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const authHeader = getAuthorizationHeader();
    if (!authHeader) return;
    setLoading(true);
    setError(null);
    try {
      // Pending users
      const resp = await fetch(`${API_BASE_URL}/api/admin/pending-users`, {
        headers: { Authorization: authHeader },
      });
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: string };
        setError(data.error ?? 'Errore nel caricamento');
        return;
      }
      const data = (await resp.json()) as { users: PendingUser[] };
      setUsers(data.users ?? []);

      // All users
      const respAll = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: authHeader },
      });
      if (respAll.ok) {
        const dataAll = (await respAll.json()) as { users: User[] };
        setAllUsers(dataAll.users ?? []);
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }, [getAuthorizationHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approve = async (id: number) => {
    const authHeader = getAuthorizationHeader();
    if (!authHeader) return;
    setActionLoading(id);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/admin/users/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: authHeader },
      });
      if (resp.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        // aggiorna stato dell'utente in allUsers
        setAllUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: 'approved' } : u)),
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id: number) => {
    const authHeader = getAuthorizationHeader();
    if (!authHeader) return;
    setActionLoading(id);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/admin/users/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: authHeader },
      });
      if (resp.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setAllUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: 'rejected' } : u)),
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (id: number) => {
    const authHeader = getAuthorizationHeader();
    if (!authHeader) return;
    const user = allUsers.find((u) => u.id === id);
    if (!user) return;
    if (user.role === 'superuser') {
      // non dovrebbe arrivarci, ma per sicurezza
      return;
    }
    setActionLoading(id);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      });
      if (resp.ok) {
        setAllUsers((prev) => prev.filter((u) => u.id !== id));
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } finally {
      setActionLoading(null);
      setConfirmDeleteId((current) => (current === id ? null : current));
    }
  };

  if (state.status !== 'authenticated' || state.role !== 'superuser') {
    return null;
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <Link to="/" className="back-button">
            <span className="back-icon">←</span>
            <span>Torna all’app</span>
          </Link>
          <h1 className="app-title">Area amministratore</h1>
          <p className="app-subtitle">
            Approva o rifiuta le richieste di registrazione.
          </p>
        </div>
      </header>

      <main className="app-main">
        <section className="pane pane-left admin-pane">
          <h2>Richieste in attesa</h2>
          {loading && <p>Caricamento...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && users.length === 0 && (
            <p className="preview-placeholder">Nessuna richiesta in attesa.</p>
          )}
          {!loading && users.length > 0 && (
            <ul className="admin-user-list">
              {users.map((u) => (
                <li key={u.id} className="admin-user-row">
                  <span className="admin-username">{u.username}</span>
                  <span className="admin-date">
                    {new Date(u.createdAt).toLocaleDateString('it-IT')}
                  </span>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="secondary small"
                      disabled={actionLoading === u.id}
                      onClick={() => reject(u.id)}
                    >
                      Rifiuta
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === u.id}
                      onClick={() => approve(u.id)}
                    >
                      Approva
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="pane pane-right admin-pane">
          <h2>Account esistenti</h2>
          {loading && <p>Caricamento...</p>}
          {!loading && allUsers.length === 0 && (
            <p className="preview-placeholder">Nessun utente presente.</p>
          )}
          {!loading && allUsers.length > 0 && (
            <ul className="admin-user-list">
              {allUsers.map((u) => (
                <li key={u.id} className="admin-user-row">
                  <span className="admin-username">{u.username}</span>
                  <span className="admin-date">
                    {u.role === 'superuser' ? 'Superutente' : 'Utente'} ·{' '}
                    {u.status === 'approved'
                      ? 'approvato'
                      : u.status === 'pending'
                        ? 'in attesa'
                        : 'rifiutato'}
                  </span>
                  <span className="admin-date">
                    creato il{' '}
                    {new Date(u.createdAt).toLocaleDateString('it-IT')}
                  </span>
                  <div className="admin-actions">
                    {confirmDeleteId === u.id ? (
                      <>
                        <button
                          type="button"
                          className="secondary small"
                          disabled={actionLoading === u.id}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          disabled={
                            u.role === 'superuser' || actionLoading === u.id
                          }
                          onClick={() => deleteUser(u.id)}
                        >
                          Conferma
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="secondary small"
                        disabled={
                          u.role === 'superuser' || actionLoading === u.id
                        }
                        onClick={() => setConfirmDeleteId(u.id)}
                      >
                        Elimina
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
