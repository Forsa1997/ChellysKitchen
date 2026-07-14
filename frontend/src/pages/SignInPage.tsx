import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function SignInPage() {
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const targetPath = (location.state as { from?: string } | null)?.from ?? '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login(username, password);
      navigate(targetPath);
    } catch (requestError) {
      const errorMessage = requestError instanceof Error ? requestError.message : 'Anmeldung fehlgeschlagen';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = authLoading || isSubmitting;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 2, md: 4 } }}>
      <Paper variant="outlined" sx={{ maxWidth: 440, width: '100%', p: { xs: 3, md: 4 } }}>
        <Stack component="form" spacing={2.25} onSubmit={onSubmit}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={(theme) => ({ width: 58, height: 58, mx: 'auto', mb: 2, display: 'grid', placeItems: 'center', borderRadius: '16px', bgcolor: 'hsl(342, 75%, 95%)', ...theme.applyStyles('dark', { bgcolor: 'hsl(342, 32%, 19%)' }) })}>
              <Box component="img" src="/brand/chellys-kitchen-icon.svg" alt="Chellys Kitchen" sx={{ width: 40, height: 40 }} />
            </Box>
            <Typography variant="h3" sx={{ fontSize: '1.875rem', fontWeight: 700 }}>Willkommen zurück</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Melde dich an, um eigene Rezepte zu verwalten.
            </Typography>
          </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Benutzername"
              type="text"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={isLoading}
              autoComplete="username"
            />
            <TextField
              label="Passwort"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'} onClick={() => setShowPassword((visible) => !visible)} edge="end" size="small">
                        {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
              sx={{ minHeight: 46 }}
            >
              {isLoading ? 'Bitte warten...' : 'Einloggen'}
            </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
