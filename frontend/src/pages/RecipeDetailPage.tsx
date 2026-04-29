import { Alert, Avatar, Box, Card, CardContent, CardMedia, Chip, CircularProgress, Container, Divider, Grid, List, ListItem, ListItemText, Paper, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import { useParams } from 'react-router';
import { useState } from 'react';
import { useRecipe } from '../hooks/useRecipes';
import { useCreateRating, useDeleteRating } from '../hooks/useRatings';
import { RatingDisplay, InteractiveRating } from '../components/Rating';
import { useAuth } from '../auth/AuthContext';
import { AccessTime, Restaurant, People, LocalFireDepartment, FitnessCenter, Grain, WaterDrop } from '@mui/icons-material';

export function RecipeDetailPage() {
  const { id } = useParams();
  const { data: recipe, isLoading, error } = useRecipe(id || '');
  const { user } = useAuth();
  const createRating = useCreateRating();
  const deleteRating = useDeleteRating();
  const [userRating, setUserRating] = useState<number>(0);

  const handleRatingChange = async (value: number) => {
    if (!user || !id) return;

    try {
      if (userRating === value) {
        await deleteRating.mutateAsync(id);
        setUserRating(0);
      } else {
        await createRating.mutateAsync({ slug: id, data: { stars: value } });
        setUserRating(value);
      }
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error instanceof Error ? error.message : 'Fehler beim Laden des Rezepts'}</Alert>
      </Container>
    );
  }

  if (!recipe) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Rezept nicht gefunden.</Alert>
      </Container>
    );
  }

  const totalTime = recipe.preparationTime + recipe.cookingTime;
  const difficultyColor = {
    'EINFACH': 'success',
    'MITTEL': 'warning',
    'SCHWER': 'error'
  } as const;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header Section with Image */}
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: 3 }}>
          {recipe.img && (
            <CardMedia
              component="img"
              image={recipe.img}
              alt={recipe.title}
              sx={{ height: { xs: 250, sm: 350, md: 450 }, width: '100%', objectFit: 'cover' }}
            />
          )}
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Tags and Categories */}
            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
              {recipe.tag && (
                <Chip label={recipe.tag} size="small" color="secondary" variant="filled" />
              )}
              <Chip
                label={recipe.difficulty}
                size="small"
                color={difficultyColor[recipe.difficulty] as any}
                variant="outlined"
              />
              <Chip label={recipe.category} size="small" variant="outlined" />
            </Stack>

            {/* Title and Description */}
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 2
              }}
              gutterBottom
            >
              {recipe.title}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: '1.1rem', mb: 3 }}
            >
              {recipe.shortDescription}
            </Typography>

            {recipe.description && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, whiteSpace: 'pre-line' }}
              >
                {recipe.description}
              </Typography>
            )}

            {/* Quick Stats */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTime color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {totalTime} Min.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Restaurant color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {recipe.preparationTime} Min. Vorbereitung
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <People color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {recipe.servings} Portionen
                </Typography>
              </Stack>
            </Stack>

            {/* Rating Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <RatingDisplay value={recipe.averageRating || 0} count={recipe.totalRatings || 0} />
              {user && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
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

            {/* Author Info */}
            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {recipe.createdBy.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Erstellt von <strong>{recipe.createdBy.name}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(recipe.createdAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Paper>

        {/* Main Content Grid */}
        <Grid container spacing={4}>
          {/* Left Column - Ingredients */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ borderRadius: 3, height: 'fit-content' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Zutaten
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Für {recipe.servings} Portionen
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense sx={{ p: 0 }}>
                  {recipe.ingredients.map((ingredient: any, index: number) => (
                    <ListItem
                      key={`${ingredient.name}-${ingredient.unit}-${index}`}
                      disableGutters
                      sx={{ py: 1 }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1">
                            <strong>{ingredient.amount} {ingredient.unit}</strong> {ingredient.name}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Paper>

            {/* Nutritional Values */}
            {recipe.nutritionalValues && Object.keys(recipe.nutritionalValues).length > 0 && (
              <Paper sx={{ borderRadius: 3, mt: 3, height: 'fit-content' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Nährwerte
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    {recipe.nutritionalValues.calories !== undefined && (
                      <Grid item xs={6}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LocalFireDepartment color="error" fontSize="small" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Kalorien
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {recipe.nutritionalValues.calories} kcal
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    )}
                    {recipe.nutritionalValues.protein !== undefined && (
                      <Grid item xs={6}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <FitnessCenter color="primary" fontSize="small" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Eiweiß
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {recipe.nutritionalValues.protein} g
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    )}
                    {recipe.nutritionalValues.carbohydrates !== undefined && (
                      <Grid item xs={6}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Grain color="warning" fontSize="small" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Kohlenhydrate
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {recipe.nutritionalValues.carbohydrates} g
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    )}
                    {recipe.nutritionalValues.fat !== undefined && (
                      <Grid item xs={6}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <WaterDrop color="info" fontSize="small" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Fett
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {recipe.nutritionalValues.fat} g
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Paper>
            )}
          </Grid>

          {/* Right Column - Steps */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Zubereitung
                </Typography>
                <Stack spacing={3}>
                  {recipe.steps.map((step: any, index: number) => (
                    <Box key={step.stepNumber}>
                      <Stack direction="row" spacing={3} alignItems="flex-start">
                        <Box
                          sx={{
                            minWidth: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            flexShrink: 0
                          }}
                        >
                          {step.stepNumber}
                        </Box>
                        <Box sx={{ flexGrow: 1, pt: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{ fontSize: '1.1rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}
                          >
                            {step.instruction}
                          </Typography>
                        </Box>
                      </Stack>
                      {index < recipe.steps.length - 1 && (
                        <Divider sx={{ mt: 3, ml: 6 }} />
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Paper>
          </Grid>
        </Grid>

        {/* Footer Info */}
        <Paper sx={{ borderRadius: 3, bgcolor: 'grey.50' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Veröffentlicht am {recipe.publishedAt
                  ? new Date(recipe.publishedAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  : 'Nicht veröffentlicht'}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Zuletzt aktualisiert: {new Date(recipe.updatedAt).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Paper>
      </Stack>
    </Container>
  );
}
