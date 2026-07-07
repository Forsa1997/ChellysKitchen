import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function AppShell({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              justifyContent: 'space-between',
              minHeight: { xs: 64, sm: 72 },
              py: { xs: 1.25, sm: 0 },
              gap: 2,
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Typography
              component={RouterLink}
              to="/"
              variant="h6"
              sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 700 }}
            >
              Chellys Kitchen
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' }, width: { xs: '100%', sm: 'auto' } }}
            >
              {user ? (
                <>
                  <Button component={RouterLink} to="/recipes/new" variant="contained" fullWidth>
                    Rezept erstellen
                  </Button>
                  {user.role === 'ADMIN' && (
                    <Button component={RouterLink} to="/admin" variant="outlined" fullWidth>
                      Admin Dashboard
                    </Button>
                  )}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ px: { sm: 0.5 }, textAlign: { xs: 'center', sm: 'left' } }}
                  >
                    Hallo, {user.name}
                  </Typography>
                  <Button variant="outlined" onClick={logout} fullWidth>
                    Abmelden
                  </Button>
                </>
              ) : (
                <>
                  <Button component={RouterLink} to="/signin" fullWidth>
                    Anmelden
                  </Button>
                  <Button component={RouterLink} to="/signup" variant="contained" fullWidth>
                    Registrieren
                  </Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>{children}</Container>
    </Box>
  );
}
