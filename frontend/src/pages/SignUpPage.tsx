import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material';
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
    <Box display="flex" justifyContent="center" mt={4}>
      <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 4 }}>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            <Typography variant="h4">Konto erstellen</Typography>
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
        </CardContent>
      </Card>
    </Box>
  );
}
