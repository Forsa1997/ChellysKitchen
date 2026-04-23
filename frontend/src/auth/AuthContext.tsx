import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { login as loginRequest, me, register as registerRequest } from '../api/client';
import type { User } from '../types/domain';

const TOKEN_KEY = 'chellysKitchenToken';

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
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
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
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
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
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem(TOKEN_KEY, result.token);
      },
      async register(name: string, email: string, password: string) {
        const result = await registerRequest({ name, email, password });
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem(TOKEN_KEY, result.token);
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
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
