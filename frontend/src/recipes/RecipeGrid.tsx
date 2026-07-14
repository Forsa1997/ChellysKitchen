import { Box, Card, CardContent, Chip, Grid, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Link as RouterLink } from 'react-router';
import type { Recipe } from '../types/domain';
import { RatingDisplay } from '../components/Rating';
import { totalRecipeMinutes } from './recipeCardViewModel';
import { recipeRenderImage } from './recipeImages';
import { RecipeImage } from './RecipeImage';

interface RecipeGridProps {
  recipes: Recipe[];
  /** When provided (i.e. the viewer is signed in), each card shows a heart button. */
  onToggleFavorite?: (recipe: Recipe) => void;
}

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite?: (recipe: Recipe) => void;
}

function FavoriteButton({ recipe, onToggleFavorite, size = 'small' as const }: RecipeCardProps & { size?: 'small' | 'medium' }) {
  if (!onToggleFavorite) return null;

  return (
    <IconButton
      aria-label={recipe.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
      aria-pressed={!!recipe.isFavorite}
      data-floating-action="true"
      size={size}
      onClick={(event) => {
        // The whole card is a link; the heart must not navigate.
        event.preventDefault();
        event.stopPropagation();
        onToggleFavorite(recipe);
      }}
    >
      {recipe.isFavorite
        ? <FavoriteIcon fontSize={size} />
        : <FavoriteBorderIcon fontSize={size} />}
    </IconButton>
  );
}

function RecipeCard({ recipe, onToggleFavorite }: RecipeCardProps) {
  const renderImage = recipeRenderImage(recipe.img);

  return (
    <Card
      data-recipe-card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        transition: 'border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-4px)',
          boxShadow: '0 14px 32px rgba(80, 35, 50, .10)',
        },
      }}
    >
      <Box
        component={RouterLink}
        to={`/recipes/${recipe.slug}`}
        sx={{ height: '100%', color: 'inherit', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
      >
        {recipe.img ? (
          <Box data-recipe-media sx={{ position: 'relative' }}>
            <RecipeImage
              src={renderImage ?? recipe.img}
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
          <Box
            data-recipe-media
            sx={(theme) => ({
              position: 'relative',
              aspectRatio: '16 / 10',
              bgcolor: 'grey.100',
              ...theme.applyStyles('dark', { bgcolor: 'grey.800' }),
            })}
          />
        )}
        <CardContent sx={{ p: 2.25, display: 'flex', minHeight: 188, flexDirection: 'column' }}>
          <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {recipe.tag && <Chip label={recipe.tag} size="small" color="secondary" />}
            <Chip
              label={recipe.difficulty}
              size="small"
              color={recipe.difficulty.toLowerCase().includes('einfach') ? 'success' : recipe.difficulty.toLowerCase().includes('schwer') ? 'error' : 'secondary'}
            />
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
      </Box>
      <Box sx={{ position: 'absolute', zIndex: 1, top: 12, right: 12 }}>
        <FavoriteButton recipe={recipe} onToggleFavorite={onToggleFavorite} size="medium" />
      </Box>
    </Card>
  );
}

// Compact horizontal layout for mobile: a thumbnail on the left and the most
// relevant info (title, difficulty/time/rating, favorite) on the right, so
// several recipes fit on screen without scrolling past mostly-empty cards.
function RecipeListItem({ recipe, onToggleFavorite }: RecipeCardProps) {
  const renderImage = recipeRenderImage(recipe.img);
  const imageSrc = renderImage ?? recipe.img;

  return (
    <Card
      data-recipe-card
      sx={{
        textDecoration: 'none',
        overflow: 'hidden',
        borderRadius: 3,
        position: 'relative',
      }}
    >
      <Box component={RouterLink} to={`/recipes/${recipe.slug}`} sx={{ color: 'inherit', textDecoration: 'none', display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
        {imageSrc ? (
          <RecipeImage
            src={imageSrc}
            alt={recipe.title}
            sx={{ width: 92, height: 92, flexShrink: 0, objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={(theme) => ({
              width: 92,
              height: 92,
              flexShrink: 0,
              bgcolor: 'grey.100',
              ...theme.applyStyles('dark', { bgcolor: 'grey.800' }),
            })}
          />
        )}
        <CardContent sx={{ p: 1.5, pr: 6.5, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5, '&:last-child': { pb: 1.5 } }}>
          <Typography
            variant="subtitle1"
            sx={{
              flex: 1,
              minWidth: 0,
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {recipe.title}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip label={recipe.difficulty} size="small" color={recipe.difficulty.toLowerCase().includes('einfach') ? 'success' : recipe.difficulty.toLowerCase().includes('schwer') ? 'error' : 'secondary'} />
            <Typography variant="caption" color="text.secondary">
              {totalRecipeMinutes(recipe.preparationTime, recipe.cookingTime)} Min.
            </Typography>
            <RatingDisplay value={recipe.averageRating ?? 0} count={recipe.totalRatings ?? 0} size="small" showCount={false} />
          </Stack>
        </CardContent>
      </Box>
      <Box sx={{ position: 'absolute', zIndex: 1, top: 8, right: 8 }}>
        <FavoriteButton recipe={recipe} onToggleFavorite={onToggleFavorite} />
      </Box>
    </Card>
  );
}

export function RecipeGrid({ recipes, onToggleFavorite }: RecipeGridProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
      {recipes.map((recipe) => (
        <Grid key={recipe.id} size={{ xs: 12, sm: isMobile ? 12 : 6, lg: 4 }}>
          {isMobile
            ? <RecipeListItem recipe={recipe} onToggleFavorite={onToggleFavorite} />
            : <RecipeCard recipe={recipe} onToggleFavorite={onToggleFavorite} />}
        </Grid>
      ))}
    </Grid>
  );
}
