import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createRecipe } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const DEFAULT_CATEGORIES = ['Cooking', 'Baking', 'Barbeque', 'Dessert'];

export function CreateRecipePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [servings, setServings] = useState(2);
  const [preparationTime, setPreparationTime] = useState(10);
  const [cookingTime, setCookingTime] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      setError('Bitte melde dich zuerst an.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const recipe = await createRecipe({
        title,
        shortDescription,
        category,
        servings,
        preparationTime,
        cookingTime,
      }, token);
      navigate(`/recipes/${recipe.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Rezept konnte nicht erstellt werden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={2}>
      <Card sx={{ maxWidth: 680, width: '100%', borderRadius: 4 }}>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            <Typography variant="h4">Neues Rezept erstellen</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Titel" required value={title} onChange={(event) => setTitle(event.target.value)} />
            <TextField
              label="Kurzbeschreibung"
              required
              multiline
              minRows={3}
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
            />
            <TextField select label="Kategorie" value={category} onChange={(event) => setCategory(event.target.value)}>
              {DEFAULT_CATEGORIES.map((entry) => (
                <MenuItem key={entry} value={entry}>{entry}</MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Portionen"
                type="number"
                value={servings}
                inputProps={{ min: 1 }}
                onChange={(event) => setServings(Number(event.target.value))}
                fullWidth
              />
              <TextField
                label="Vorbereitungszeit (Min.)"
                type="number"
                value={preparationTime}
                inputProps={{ min: 1 }}
                onChange={(event) => setPreparationTime(Number(event.target.value))}
                fullWidth
              />
              <TextField
                label="Kochzeit (Min.)"
                type="number"
                value={cookingTime}
                inputProps={{ min: 1 }}
                onChange={(event) => setCookingTime(Number(event.target.value))}
                fullWidth
              />
            </Stack>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Speichern...' : 'Rezept speichern'}</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
