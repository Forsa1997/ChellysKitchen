import { CircularProgress, Box } from '@mui/material';
import { Navigate, useLocation } from 'react-router';
import type { PropsWithChildren } from 'react';
import { useAuth } from './AuthContext';

export function RequireAuth({ children }: PropsWithChildren) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
