import { useState } from 'react';
import type { FormEvent } from 'react';
<<<<<<< HEAD
import { Link, useNavigate } from 'react-router-dom';
=======
import { Link, useLocation, useNavigate } from 'react-router-dom';
>>>>>>> abbe939 (Refactor project structure to transition from Node/Express to Django for backend, implement PostgreSQL support, and enhance template management with a new API. Update README for clarity and add environment configuration examples. Introduce new frontend features for template selection and PDF generation.)
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { state, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await login({ username, password });
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Si è verificato un errore imprevisto.');
      }
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
          <form className="params-form" onSubmit={handleSubmit}>
            <h2>Entra</h2>

            <label className="field">
              <span>Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            <div className="actions">
              <button
                type="submit"
                disabled={state.status === 'loading'}
              >
                {state.status === 'loading' ? 'Attendere...' : 'Entra'}
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <p className="auth-link">
              <Link to="/register">Non hai un account? Registrati</Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}

