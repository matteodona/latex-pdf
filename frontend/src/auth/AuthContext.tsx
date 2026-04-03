import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type UserRole = 'superuser' | 'user';

type AuthState =
  | { status: 'unauthenticated' }
  | { status: 'loading' }
  | { status: 'authenticated'; username: string; authHeader: string; role: UserRole };

type LoginCredentials = {
  username: string;
  password: string;
};

type AuthContextValue = {
  state: AuthState;
  login: (creds: LoginCredentials) => Promise<void>;
  logout: () => void;
  getAuthorizationHeader: () => string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'unauthenticated' });

  const login = useCallback(
    async (creds: LoginCredentials) => {
      setState((prev) =>
        prev.status === 'loading' ? prev : { status: 'loading' },
      );
      const authHeader = `Basic ${btoa(`${creds.username}:${creds.password}`)}`;

      const resp = await fetch(`${API_BASE_URL}/api/auth/check`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
      });
      if (!resp.ok) {
        let message = 'Credenziali non valide';
        try {
          const data = (await resp.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // ignore
        }
        setState({ status: 'unauthenticated' });
        throw new Error(message);
      }
      const data = (await resp.json()) as { ok: boolean; username: string; role: UserRole };
      const role = data.role ?? 'user';
      setState({
        status: 'authenticated',
        username: data.username,
        authHeader,
        role,
      });
    },
    [],
  );

  const logout = useCallback(() => {
    setState({ status: 'unauthenticated' });
  }, []);

  const getAuthorizationHeader = useCallback(() => {
    if (state.status !== 'authenticated') return null;
    return state.authHeader;
  }, [state]);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      login,
      logout,
      getAuthorizationHeader,
    }),
    [getAuthorizationHeader, login, logout, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return ctx;
}

