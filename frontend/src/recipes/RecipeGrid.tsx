import { Card, CardContent, CardMedia, Chip, Grid2, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import type { Recipe } from '../types/domain';
import { getTotalDurationText } from '../utils/recipeFilters';

interface RecipeGridProps {
  recipes: Recipe[];
}

export function RecipeGrid({ recipes }: RecipeGridProps) {
  return (
    <Grid2 container spacing={2}>
      {recipes.map((recipe) => (
        <Grid2 key={recipe.id} size={{ xs: 12, md: 6, lg: 4 }}>
          <Card
            component={RouterLink}
            to={`/recipes/${recipe.id}`}
            sx={{ height: '100%', borderRadius: 3, textDecoration: 'none' }}
          >
            <CardMedia image={recipe.img} component="img" height="180" alt={recipe.title} />
            <CardContent>
              <Stack direction="row" spacing={1} mb={1}>
                <Chip label={recipe.tag} size="small" color="secondary" />
                <Chip label={recipe.difficulty} size="small" variant="outlined" />
              </Stack>
              <Typography variant="h6" gutterBottom>{recipe.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {recipe.shortDescription}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getTotalDurationText(recipe)}
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
      ))}
    </Grid2>
  );
}
