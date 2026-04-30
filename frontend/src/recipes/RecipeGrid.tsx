import { Card, CardContent, CardMedia, Chip, Grid2, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import type { Recipe } from '../types/domain';
import { totalRecipeMinutes } from './recipeCardViewModel';

interface RecipeGridProps {
  recipes: Recipe[];
}

export function RecipeGrid({ recipes }: RecipeGridProps) {
  const dateFormatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Grid2 container spacing={2}>
      {recipes.map((recipe) => (
        <Grid2 key={recipe.id} size={{ xs: 12, md: 6, lg: 4 }}>
          <Card
            component={RouterLink}
            to={`/recipes/${recipe.slug}`}
            sx={{ height: '100%', borderRadius: 3, textDecoration: 'none', overflow: 'hidden' }}
          >
            <CardMedia image={recipe.img} component="img" height="180" alt={recipe.title} />
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} mb={1}>
                {recipe.tag && <Chip label={recipe.tag} size="small" color="secondary" />}
                <Chip label={recipe.difficulty} size="small" variant="outlined" />
              </Stack>
              <Typography variant="h6" gutterBottom>{recipe.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {recipe.shortDescription}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalRecipeMinutes(recipe.preparationTime, recipe.cookingTime)} Minuten • {recipe.servings} Portionen
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.75 }}>
                Von {recipe.createdBy?.name ?? 'Unbekannt'} • {dateFormatter.format(new Date(recipe.createdAt))}
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
      ))}
    </Grid2>
  );
}
