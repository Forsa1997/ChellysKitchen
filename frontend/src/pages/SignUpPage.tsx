import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function SignUpPage() {
  const { register, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (requestError) {
      const errorMessage = requestError instanceof Error ? requestError.message : 'Registrierung fehlgeschlagen';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = authLoading || isSubmitting;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 2, md: 4 } }}>
      <Paper variant="outlined" sx={{ maxWidth: 480, width: '100%', p: { xs: 2.5, md: 3 } }}>
        <Stack component="form" spacing={2} onSubmit={onSubmit}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Konto erstellen</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Registriere dich, um Rezepte zu speichern und zu teilen.
            </Typography>
          </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isLoading}
              autoComplete="name"
            />
            <TextField
              label="E-Mail"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
            <TextField
              label="Passwort"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
            >
              {isLoading ? 'Bitte warten...' : 'Registrieren'}
            </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
