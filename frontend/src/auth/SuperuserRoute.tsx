import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

type SuperuserRouteProps = {
<<<<<<< HEAD
  children: React.ReactElement;
=======
  children: ReactElement;
>>>>>>> abbe939 (Refactor project structure to transition from Node/Express to Django for backend, implement PostgreSQL support, and enhance template management with a new API. Update README for clarity and add environment configuration examples. Introduce new frontend features for template selection and PDF generation.)
};

export function SuperuserRoute({ children }: SuperuserRouteProps) {
  const { state } = useAuth();

  if (state.status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  if (state.role !== 'superuser') {
    return <Navigate to="/" replace />;
  }

  return children;
}
