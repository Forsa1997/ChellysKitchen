import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useState, type PropsWithChildren } from 'react';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function AppShell({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = () => setMobileOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  const desktopActions = user ? (
    <>
      <Button component={RouterLink} to="/recipes/new" variant="contained">
        Rezept erstellen
      </Button>
      {user.role === 'ADMIN' && (
        <Button component={RouterLink} to="/admin" variant="outlined">
          Admin Dashboard
        </Button>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
        Hallo, {user.name}
      </Typography>
      <Button variant="outlined" onClick={logout}>
        Abmelden
      </Button>
    </>
  ) : (
    <>
      <Button component={RouterLink} to="/signin">
        Anmelden
      </Button>
      <Button component={RouterLink} to="/signup" variant="contained">
        Registrieren
      </Button>
    </>
  );

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
              minHeight: { xs: 60, sm: 72 },
              gap: 2,
            }}
          >
            <Typography
              component={RouterLink}
              to="/"
              variant="h6"
              onClick={closeMenu}
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 700,
                fontSize: { xs: '1.15rem', sm: '1.25rem' },
              }}
            >
              Chellys Kitchen
            </Typography>

            {/* Desktop navigation */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', display: { xs: 'none', md: 'flex' } }}
            >
              {desktopActions}
            </Stack>

            {/* Mobile menu toggle */}
            <IconButton
              edge="end"
              aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
              onClick={() => setMobileOpen((open) => !open)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile navigation drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={closeMenu}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{ paper: { sx: { width: 'min(80vw, 320px)' } } }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Menü
            </Typography>
            <IconButton aria-label="Menü schließen" onClick={closeMenu} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.25}>
            {user ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Hallo, {user.name}
                </Typography>
                <Button component={RouterLink} to="/recipes/new" variant="contained" fullWidth onClick={closeMenu}>
                  Rezept erstellen
                </Button>
                {user.role === 'ADMIN' && (
                  <Button component={RouterLink} to="/admin" variant="outlined" fullWidth onClick={closeMenu}>
                    Admin Dashboard
                  </Button>
                )}
                <Button variant="outlined" fullWidth onClick={handleLogout}>
                  Abmelden
                </Button>
              </>
            ) : (
              <>
                <Button component={RouterLink} to="/signin" variant="outlined" fullWidth onClick={closeMenu}>
                  Anmelden
                </Button>
                <Button component={RouterLink} to="/signup" variant="contained" fullWidth onClick={closeMenu}>
                  Registrieren
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Drawer>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {children}
      </Container>
    </Box>
  );
}
