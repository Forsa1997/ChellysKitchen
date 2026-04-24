import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { apiClient } from '../api/client';
import type { User } from '../types/domain';
import { useLogin, useRegister, useLogout, useMe } from '../hooks/useAuth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => apiClient.getAccessToken());
  const [error, setError] = useState<Error | null>(null);

  // React Query hooks
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const meQuery = useMe();

  // Auto-login on app start
  useEffect(() => {
    if (!token) {
      return;
    }

    // Trigger me query if we have a token
    meQuery.refetch();
  }, [token]);

  // Update token state when apiClient tokens change
  useEffect(() => {
    const checkToken = () => {
      const currentToken = apiClient.getAccessToken();
      setToken(currentToken);
    };

    // Check token periodically for changes
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, []);

  const user = meQuery.data?.user ?? null;
  const loading = meQuery.isLoading || (token !== null && meQuery.isFetching);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      error,
      isAuthenticated: !!user,
      async login(email: string, password: string) {
        try {
          setError(null);
          const result = await loginMutation.mutateAsync({ email, password });
          setToken(result.accessToken);
          // Invalidate and refetch me query
          meQuery.refetch();
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Anmeldung fehlgeschlagen'));
          throw err;
        }
      },
      async register(name: string, email: string, password: string) {
        try {
          setError(null);
          const result = await registerMutation.mutateAsync({ name, email, password });
          setToken(result.accessToken);
          // Invalidate and refetch me query
          meQuery.refetch();
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Registrierung fehlgeschlagen'));
          throw err;
        }
      },
      logout() {
        logoutMutation.mutate();
        setToken(null);
        setError(null);
      },
    }),
    [user, token, loading, error, loginMutation, registerMutation, logoutMutation, meQuery],
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
