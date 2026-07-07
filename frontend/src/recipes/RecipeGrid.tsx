import { Card, CardContent, CardMedia, Chip, Grid, Stack, Typography } from '@mui/material';
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
    <Grid container spacing={{ xs: 2, lg: 2.5 }}>
      {recipes.map((recipe) => (
        <Grid key={recipe.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
          <Card
            component={RouterLink}
            to={`/recipes/${recipe.slug}`}
            sx={{ height: '100%', borderRadius: 2, textDecoration: 'none', overflow: 'hidden' }}
          >
            <CardMedia
              image={recipe.img}
              component="img"
              alt={recipe.title}
              sx={{ aspectRatio: '16 / 10', height: 'auto', objectFit: 'cover' }}
            />
            <CardContent sx={{ p: 2, display: 'flex', minHeight: 190, flexDirection: 'column' }}>
              <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 1, flexWrap: 'wrap' }}>
                {recipe.tag && <Chip label={recipe.tag} size="small" color="secondary" />}
                <Chip label={recipe.difficulty} size="small" variant="outlined" />
              </Stack>
              <Typography variant="h6" gutterBottom>{recipe.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                {recipe.shortDescription}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalRecipeMinutes(recipe.preparationTime, recipe.cookingTime)} Minuten • {recipe.servings} Portionen
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                Von {recipe.createdBy?.name ?? 'Unbekannt'} • {dateFormatter.format(new Date(recipe.createdAt))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
