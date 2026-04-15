import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

type SuperuserRouteProps = {
  children: ReactElement;
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
