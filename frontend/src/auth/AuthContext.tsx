import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { login as loginRequest, me, register as registerRequest } from '../api/client';
import type { User } from '../types/domain';
import { applyAuthSuccess, clearAuthState, getStoredToken } from '../utils/authSession';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken(localStorage));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    me(token)
      .then(({ user: currentUser }) => {
        setUser(currentUser);
      })
      .catch(() => {
        const cleared = clearAuthState(localStorage);
        setToken(cleared.token);
        setUser(cleared.user);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      async login(email: string, password: string) {
        const result = await loginRequest({ email, password });
        const nextState = applyAuthSuccess(localStorage, result.user, result.token);
        setUser(nextState.user);
        setToken(nextState.token);
      },
      async register(name: string, email: string, password: string) {
        const result = await registerRequest({ name, email, password });
        const nextState = applyAuthSuccess(localStorage, result.user, result.token);
        setUser(nextState.user);
        setToken(nextState.token);
      },
      logout() {
        const cleared = clearAuthState(localStorage);
        setToken(cleared.token);
        setUser(cleared.user);
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
