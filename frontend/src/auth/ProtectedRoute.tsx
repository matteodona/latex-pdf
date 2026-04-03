import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

type ProtectedRouteProps = {
  children: React.ReactElement;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useAuth();

  if (state.status === 'loading') {
    return (
      <div className="app-root">
        <p>Verifica autenticazione...</p>
      </div>
    );
  }

  if (state.status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

