import { Alert, Card, CardContent, CardMedia, Chip, CircularProgress, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { fetchRecipeById } from '../api/client';
import type { Recipe } from '../types/domain';

export function RecipeDetailPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Rezept-ID fehlt.');
      setLoading(false);
      return;
    }

    fetchRecipeById(id)
      .then((data) => {
        setRecipe(data);
        setError(null);
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!recipe) {
    return <Alert severity="warning">Rezept nicht gefunden.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Card sx={{ borderRadius: 3 }}>
        <CardMedia component="img" image={recipe.img} height="300" alt={recipe.title} />
        <CardContent>
          <Stack direction="row" spacing={1} mb={1}>
            <Chip label={recipe.tag} size="small" color="secondary" />
            <Chip label={recipe.difficulty} size="small" variant="outlined" />
          </Stack>
          <Typography variant="h4" gutterBottom>{recipe.title}</Typography>
          <Typography color="text.secondary">{recipe.shortDescription}</Typography>
          <Typography variant="caption" color="text.secondary">
            {recipe.preparationTime + recipe.cookingTime} Minuten • {recipe.servings} Portionen
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Zutaten</Typography>
          <List dense>
            {recipe.ingredients.map((ingredient) => (
              <ListItem key={`${ingredient.name}-${ingredient.unit}`} disableGutters>
                <ListItemText primary={`${ingredient.amount} ${ingredient.unit} ${ingredient.name}`} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Zubereitung</Typography>
          <List>
            {recipe.steps.map((step) => (
              <ListItem key={step.stepNumber} disableGutters>
                <ListItemText primary={`${step.stepNumber}. ${step.instruction}`} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
}
