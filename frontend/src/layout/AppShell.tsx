import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function AppShell({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Container>
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
            <Typography component={RouterLink} to="/" variant="h6" sx={{ textDecoration: 'none', color: 'primary.main' }}>
              Chellys Kitchen
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {user ? (
                <>
                  <Button component={RouterLink} to="/recipes/new" variant="contained">Rezept erstellen</Button>
                  <Typography variant="body2">Hallo, {user.name}</Typography>
                  <Button variant="outlined" onClick={logout}>Abmelden</Button>
                </>
              ) : (
                <>
                  <Button component={RouterLink} to="/signin">Anmelden</Button>
                  <Button component={RouterLink} to="/signup" variant="contained">Registrieren</Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      <Container component="main" sx={{ py: { xs: 3, md: 5 } }}>{children}</Container>
    </Box>
  );
}
