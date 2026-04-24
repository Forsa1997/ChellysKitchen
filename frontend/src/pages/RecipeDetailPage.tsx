import { Alert, Card, CardContent, CardMedia, Chip, CircularProgress, List, ListItem, ListItemText, Stack, Typography, Box, Button } from '@mui/material';
import { useParams } from 'react-router';
import { useState } from 'react';
import { useRecipe } from '../hooks/useRecipes';
import { useRecipeRatings, useCreateRating, useDeleteRating } from '../hooks/useRatings';
import { RatingDisplay, InteractiveRating } from '../components/Rating';
import { useAuth } from '../auth/AuthContext';
import type { Recipe } from '../types/domain';

export function RecipeDetailPage() {
  const { id } = useParams();
  const { data: recipe, isLoading, error } = useRecipe(id || '');
  const { user } = useAuth();
  const { data: ratings } = useRecipeRatings(id || '');
  const createRating = useCreateRating();
  const deleteRating = useDeleteRating();
  const [userRating, setUserRating] = useState<number>(0);

  const handleRatingChange = async (value: number) => {
    if (!user || !id) return;

    try {
      if (userRating === value) {
        // Remove rating if clicking same value
        await deleteRating.mutateAsync(id);
        setUserRating(0);
      } else {
        // Create or update rating
        await createRating.mutateAsync({ slug: id, data: { stars: value } });
        setUserRating(value);
      }
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error instanceof Error ? error.message : 'Fehler beim Laden des Rezepts'}</Alert>;
  }

  if (!recipe) {
    return <Alert severity="warning">Rezept nicht gefunden.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Card sx={{ borderRadius: 3 }}>
        <CardMedia
          component="img"
          image={recipe.img}
          alt={recipe.title}
          sx={{ height: { xs: 220, sm: 300 } }}
        />
        <CardContent>
          <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
            {recipe.tag && <Chip label={recipe.tag} size="small" color="secondary" />}
            <Chip label={recipe.difficulty} size="small" variant="outlined" />
            <Chip label={recipe.category} size="small" variant="outlined" />
          </Stack>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }} gutterBottom>
            {recipe.title}
          </Typography>
          <Typography color="text.secondary">{recipe.shortDescription}</Typography>
          <Typography variant="caption" color="text.secondary">
            {recipe.preparationTime + recipe.cookingTime} Minuten • {recipe.servings} Portionen
          </Typography>
          <Box sx={{ mt: 2 }}>
            <RatingDisplay value={recipe.averageRating || 0} count={recipe.ratings?.length} />
            {user && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Deine Bewertung:
                </Typography>
                <InteractiveRating
                  value={userRating}
                  onChange={handleRatingChange}
                  disabled={createRating.isPending || deleteRating.isPending}
                />
              </Box>
            )}
          </Box>
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
