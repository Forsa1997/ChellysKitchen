import { Alert, CircularProgress, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useQueryRecipes } from '../recipes/useQueryRecipes';
import { RecipeGrid } from '../recipes/RecipeGrid';

export function HomePage() {
  const { user } = useAuth();
  const { recipes, loading, error } = useQueryRecipes();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => {
    const result = new Set<string>();
    recipes.forEach((recipe) => result.add(recipe.category));
    return ['all', ...Array.from(result)];
  }, [recipes]);

  const filtered = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesQuery =
        recipe.title.toLowerCase().includes(query.toLowerCase()) ||
        recipe.shortDescription.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === 'all' || recipe.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [recipes, query, category]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h3">Rezepte entdecken</Typography>
        <Typography color="text.secondary">Modernisierte Rezeptübersicht mit API-Daten, Suche und Kategorien.</Typography>
        {!user && (
          <Alert severity="info">
            Melde dich an, um eigene Rezepte zu erstellen. Demo-Zugang: demo@chellys-kitchen.local / demo1234
          </Alert>
        )}
      </Stack>

      <TextField
        value={query}
        label="Suche"
        placeholder="z. B. Pasta"
        onChange={(event) => setQuery(event.target.value)}
        fullWidth
      />

      <ToggleButtonGroup
        value={category}
        exclusive
        onChange={(_event, value) => value && setCategory(value)}
        size="small"
        sx={{ flexWrap: 'wrap', gap: 1 }}
      >
        {categories.map((entry) => (
          <ToggleButton key={entry} value={entry} sx={{ borderRadius: 6, px: 2 }}>
            {entry}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <RecipeGrid recipes={filtered} />
    </Stack>
  );
}
