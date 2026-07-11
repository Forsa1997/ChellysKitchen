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
import ColorModeIconDropdown from '../ColorModeIconDropdown';

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
      <Button component={RouterLink} to="/rezeptwelt" variant="text">
        Rezeptwelt
      </Button>
      <Button component={RouterLink} to="/recipes/new" variant="contained">
        Rezept erstellen
      </Button>
      <Button component={RouterLink} to="/wochenplan" variant="outlined">
        Wochenplan
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
      <Button component={RouterLink} to="/rezeptwelt" variant="text">
        Rezeptwelt
      </Button>
      <Button component={RouterLink} to="/signin" variant="contained">
        Anmelden
      </Button>
    </>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
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
            <Stack
              component={RouterLink}
              to="/"
              direction="row"
              spacing={1.25}
              onClick={closeMenu}
              sx={{ alignItems: 'center', textDecoration: 'none' }}
            >
              <Box
                component="img"
                src="/brand/chellys-kitchen-icon.svg"
                alt="Chellys Kitchen Logo"
                sx={{ width: { xs: 36, sm: 42 }, height: { xs: 36, sm: 42 } }}
              />
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 800,
                    lineHeight: 1.15,
                    fontSize: { xs: '1.1rem', sm: '1.2rem' },
                  }}
                >
                  Chellys Kitchen
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    display: { xs: 'none', sm: 'block' },
                    lineHeight: 1.2,
                  }}
                >
                  Rezepte mit Liebe
                </Typography>
              </Box>
            </Stack>

            {/* Desktop navigation */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', display: { xs: 'none', md: 'flex' } }}
            >
              {desktopActions}
              <ColorModeIconDropdown aria-label="Farbschema ändern" />
            </Stack>

            <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
              <ColorModeIconDropdown aria-label="Farbschema ändern" />
              {/* Mobile menu toggle */}
              <IconButton
                edge="end"
                aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
                onClick={() => setMobileOpen((open) => !open)}
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            </Stack>
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
            <ColorModeIconDropdown aria-label="Farbschema ändern" />
            {user ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Hallo, {user.name}
                </Typography>
                <Button component={RouterLink} to="/recipes/new" variant="contained" fullWidth onClick={closeMenu}>
                  Rezept erstellen
                </Button>
                <Button component={RouterLink} to="/rezeptwelt" variant="outlined" fullWidth onClick={closeMenu}>
                  Rezeptwelt
                </Button>
                <Button component={RouterLink} to="/wochenplan" variant="outlined" fullWidth onClick={closeMenu}>
                  Wochenplan
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
                <Button component={RouterLink} to="/rezeptwelt" variant="outlined" fullWidth onClick={closeMenu}>
                  Rezeptwelt
                </Button>
                <Button component={RouterLink} to="/signin" variant="contained" fullWidth onClick={closeMenu}>
                  Anmelden
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Drawer>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, flexGrow: 1 }}>
        {children}
      </Container>

      <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 2 }}
            sx={{ py: 2.5, alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Chellys Kitchen · Rezepte mit Liebe
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button component={RouterLink} to="/impressum" size="small" color="inherit" onClick={closeMenu}>
                Impressum
              </Button>
              <Button component={RouterLink} to="/datenschutz" size="small" color="inherit" onClick={closeMenu}>
                Datenschutz
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
