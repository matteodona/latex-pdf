import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await resp.json()) as { error?: string; message?: string };
      if (!resp.ok) {
        setError(data.error ?? 'Registrazione fallita');
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <h1 className="app-title">Generatore di template per documenti tecnici</h1>
        </div>
      </header>

      <main className="app-main auth-main">
        <section className="pane pane-left">
          {success ? (
            <div className="params-form">
              <p className="success-message">{'Richiesta inviata. L’account sarà attivo dopo l’approvazione. Reindirizzamento al login...'}</p>
            </div>
          ) : (
            <form className="params-form" onSubmit={handleSubmit}>
              <h2>Nuovo account</h2>

              <label className="field">
                <span>Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              <div className="actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Invio...' : 'Invia richiesta'}
                </button>
              </div>

              {error && <p className="error-message">{error}</p>}

              <p className="auth-link">
                <Link to="/login">Hai già un account? Accedi</Link>
              </p>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
