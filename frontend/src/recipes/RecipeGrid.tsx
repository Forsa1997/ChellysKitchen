import { Box, Card, CardContent, CardMedia, Chip, Grid, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import type { Recipe } from '../types/domain';
import { totalRecipeMinutes } from './recipeCardViewModel';
import { recipeRenderImage } from './recipeImages';

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
    <Grid container spacing={{ xs: 2, md: 2.5 }}>
      {recipes.map((recipe) => {
        const renderImage = recipeRenderImage(recipe.img);
        return (
        <Grid key={recipe.id} size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card
            component={RouterLink}
            to={`/recipes/${recipe.slug}`}
            sx={{
              height: '100%',
              textDecoration: 'none',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'border-color 120ms ease, transform 120ms ease',
              '&:hover': {
                borderColor: 'primary.light',
                transform: 'translateY(-2px)',
              },
            }}
          >
            {recipe.img ? (
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  image={renderImage ?? recipe.img}
                  component="img"
                  alt={recipe.title}
                  sx={{ aspectRatio: '16 / 10', height: 'auto', objectFit: 'cover' }}
                />
                {renderImage && (
                  <Box
                    component="img"
                    src={recipe.img}
                    alt={`Illustration: ${recipe.title}`}
                    sx={{
                      position: 'absolute',
                      right: 10,
                      bottom: 10,
                      width: 76,
                      aspectRatio: '16 / 10',
                      objectFit: 'cover',
                      borderRadius: 1.5,
                      border: '2px solid',
                      borderColor: 'background.paper',
                      boxShadow: 2,
                    }}
                  />
                )}
              </Box>
            ) : (
              <Box sx={{ aspectRatio: '16 / 10', bgcolor: 'grey.100' }} />
            )}
            <CardContent sx={{ p: 2.25, display: 'flex', minHeight: 188, flexDirection: 'column' }}>
              <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 1, flexWrap: 'wrap' }}>
                {recipe.tag && <Chip label={recipe.tag} size="small" color="secondary" />}
                <Chip label={recipe.difficulty} size="small" variant="outlined" />
              </Stack>
              <Typography variant="h6" sx={{ mb: 0.75 }}>
                {recipe.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                {recipe.shortDescription}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {totalRecipeMinutes(recipe.preparationTime, recipe.cookingTime)} Minuten · {recipe.servings} Portionen
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                Von {recipe.createdBy?.name ?? 'Unbekannt'} · {dateFormatter.format(new Date(recipe.createdAt))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        );
      })}
    </Grid>
  );
}
