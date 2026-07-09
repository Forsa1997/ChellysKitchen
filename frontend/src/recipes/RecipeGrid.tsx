import { Box, Card, CardContent, CardMedia, Chip, Grid, IconButton, Stack, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Link as RouterLink } from 'react-router';
import type { Recipe } from '../types/domain';
import { RatingDisplay } from '../components/Rating';
import { totalRecipeMinutes } from './recipeCardViewModel';
import { recipeRenderImage } from './recipeImages';

interface RecipeGridProps {
  recipes: Recipe[];
  /** When provided (i.e. the viewer is signed in), each card shows a heart button. */
  onToggleFavorite?: (recipe: Recipe) => void;
}

export function RecipeGrid({ recipes, onToggleFavorite }: RecipeGridProps) {
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
              <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {recipe.tag && <Chip label={recipe.tag} size="small" color="secondary" />}
                <Chip label={recipe.difficulty} size="small" variant="outlined" />
                {onToggleFavorite && (
                  <IconButton
                    aria-label={recipe.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
                    size="small"
                    sx={{ ml: 'auto', border: 'none' }}
                    onClick={(event) => {
                      // The whole card is a link; the heart must not navigate.
                      event.preventDefault();
                      event.stopPropagation();
                      onToggleFavorite(recipe);
                    }}
                  >
                    {recipe.isFavorite
                      ? <FavoriteIcon fontSize="small" color="error" />
                      : <FavoriteBorderIcon fontSize="small" />}
                  </IconButton>
                )}
              </Stack>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {recipe.title}
              </Typography>
              <Box sx={{ mb: 0.75 }}>
                <RatingDisplay value={recipe.averageRating ?? 0} count={recipe.totalRatings ?? 0} size="small" />
              </Box>
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
