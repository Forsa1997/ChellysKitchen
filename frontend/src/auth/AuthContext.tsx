import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { apiClient } from '../api/client';
import type { User } from '../types/domain';
import { useLogin, useLogout, useMe } from '../hooks/useAuth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => apiClient.getAccessToken());
  const [error, setError] = useState<Error | null>(null);

  // React Query hooks
  const loginMutation = useLogin();
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

  // Update token state when apiClient tokens change (login/logout/refresh)
  useEffect(() => {
    const unsubscribe = apiClient.onTokenChange(() => {
      setToken(apiClient.getAccessToken());
    });
    return unsubscribe;
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
      logout() {
        logoutMutation.mutate();
        setToken(null);
        setError(null);
      },
    }),
    [user, token, loading, error, loginMutation, logoutMutation, meQuery],
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
