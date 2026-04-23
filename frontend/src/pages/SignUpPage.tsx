import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function SignUpPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={4}>
      <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 4 }}>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            <Typography variant="h4">Konto erstellen</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Name" required value={name} onChange={(event) => setName(event.target.value)} />
            <TextField label="E-Mail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <TextField label="Passwort" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Bitte warten...' : 'Registrieren'}</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
