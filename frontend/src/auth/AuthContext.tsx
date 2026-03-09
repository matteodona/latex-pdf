import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

const STORAGE_KEY = 'latexPdf_basic_auth';

type StoredAuth = {
  username: string;
  authHeader: string;
  role: UserRole;
};

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed.username || !parsed.authHeader) return null;
    const role = parsed.role === 'superuser' ? 'superuser' : 'user';
    return { ...parsed, role };
  } catch {
    return null;
  }
}

function saveStoredAuth(data: StoredAuth | null) {
  try {
    if (!data) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored) {
      setState({
        status: 'authenticated',
        username: stored.username,
        authHeader: stored.authHeader,
        role: stored.role,
      });
    } else {
      setState({ status: 'unauthenticated' });
    }
  }, []);

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
      saveStoredAuth({ username: data.username, authHeader, role });
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
    saveStoredAuth(null);
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

