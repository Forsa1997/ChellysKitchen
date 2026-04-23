import { CircularProgress } from '@mui/material';
import { Navigate, useLocation } from 'react-router';
import type { PropsWithChildren } from 'react';
import { useAuth } from './AuthContext';

export function RequireAuth({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <CircularProgress />;
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
