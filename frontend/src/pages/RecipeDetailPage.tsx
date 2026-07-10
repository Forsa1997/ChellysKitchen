import { Alert, Avatar, Box, Button, CardContent, CardMedia, Chip, CircularProgress, Container, Divider, Grid, IconButton, List, ListItem, ListItemText, Menu, MenuItem, Paper, Snackbar, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { useState } from 'react';
import { useRecipe, useDeleteRecipe, useDuplicateRecipe, usePublishRecipe, useArchiveRecipe, useToggleFavorite, useUpdateRecipeNotes } from '../hooks/useRecipes';
import { useAddToWeekPlan } from '../hooks/useWeekPlan';
import { useCreateRating, useDeleteRating, useRecipeRatings } from '../hooks/useRatings';
import { RatingDisplay, InteractiveRating } from '../components/Rating';
import { useAuth } from '../auth/AuthContext';
import { AccessTime, Add, AddShoppingCart, CalendarMonth, Casino, ContentCopy, CopyAll, Edit as EditIcon, Delete as DeleteIcon, Favorite, FavoriteBorder, LocalDining, Publish as PublishIcon, Archive as ArchiveIcon, LocalPrintshop, Restaurant, People, LocalFireDepartment, FitnessCenter, Grain, Remove, ShoppingCartOutlined, WaterDrop } from '@mui/icons-material';
import { apiClient, getApiBaseUrl, type ApiError, type WeekDay } from '../api/client';
import { buildBringDeeplink } from '../utils/bring';
import { WEEK_DAYS } from '../utils/weekdays';
import type { Ingredient, RecipeStep } from '../types/domain';
import { recipeRenderImage } from '../recipes/recipeImages';
import { CookingMode } from '../components/CookingMode';

const EDITOR_ROLES = ['EDITOR', 'ADMIN'];

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: 2,
  }).format(amount);

export function RecipeDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: recipe, isLoading, error } = useRecipe(slug || '');
  const { user } = useAuth();
  const createRating = useCreateRating();
  const deleteRating = useDeleteRating();
  const { data: existingRating } = useRecipeRatings(user && slug ? slug : '');
  const deleteRecipe = useDeleteRecipe();
  const duplicateRecipe = useDuplicateRecipe();
  const publishRecipe = usePublishRecipe();
  const archiveRecipe = useArchiveRecipe();
  const toggleFavorite = useToggleFavorite();
  const updateNotes = useUpdateRecipeNotes();
  // The user's own rating comes from the server; a local override reflects
  // clicks immediately without an effect syncing state.
  const [ratingOverride, setRatingOverride] = useState<number | null>(null);
  const userRating = ratingOverride ?? existingRating?.stars ?? 0;
  const [servingSelection, setServingSelection] = useState<{ recipeId: string; servings: number } | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ingredientsCopyStatus, setIngredientsCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [notesDraft, setNotesDraft] = useState<{ recipeId: string; value: string } | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const addToWeekPlan = useAddToWeekPlan();
  const [weekPlanAnchor, setWeekPlanAnchor] = useState<HTMLElement | null>(null);
  const [weekPlanSuccess, setWeekPlanSuccess] = useState<string | null>(null);
  const [cookingModeOpen, setCookingModeOpen] = useState(false);
  const apiError = error as ApiError | null;
  const isNotFound = apiError?.statusCode === 404;

  const handleRatingChange = async (value: number) => {
    if (!user || !slug) return;

    try {
      if (userRating === value) {
        await deleteRating.mutateAsync(slug);
        setRatingOverride(0);
      } else {
        await createRating.mutateAsync({ slug, data: { stars: value } });
        setRatingOverride(value);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bewertung konnte nicht gespeichert werden.';
      setRatingError(message);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!recipe) return;
    if (!window.confirm('Dieses Rezept wirklich löschen?')) return;
    try {
      await deleteRecipe.mutateAsync(recipe.id);
      navigate('/');
    } catch {
      setRatingError('Rezept konnte nicht gelöscht werden.');
    }
  };

  const handlePublish = async () => {
    if (!recipe) return;
    try {
      await publishRecipe.mutateAsync(recipe.id);
    } catch {
      setRatingError('Rezept konnte nicht veröffentlicht werden.');
    }
  };

  const handleArchive = async () => {
    if (!recipe) return;
    try {
      await archiveRecipe.mutateAsync(recipe.id);
    } catch {
      setRatingError('Rezept konnte nicht archiviert werden.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleToggleFavorite = async () => {
    if (!recipe) return;
    try {
      await toggleFavorite.mutateAsync({ slug: recipe.slug, isFavorite: !!recipe.isFavorite });
    } catch {
      setRatingError('Favorit konnte nicht gespeichert werden.');
    }
  };

  const handleSaveNotes = async () => {
    if (!recipe) return;
    const value = notesDraft?.recipeId === recipe.id ? notesDraft.value : (recipe.notes ?? '');
    try {
      await updateNotes.mutateAsync({ slug: recipe.slug, notes: value });
    } catch {
      setRatingError('Notiz konnte nicht gespeichert werden.');
    }
  };

  // Shopping helper: put the scaled ingredient list on the phone's share
  // sheet (if available) or the clipboard.
  const handleCopyIngredients = async () => {
    if (!recipe) return;

    const currentServings = servingSelection?.recipeId === recipe.id
      ? servingSelection.servings
      : recipe.servings;
    const scale = currentServings / Math.max(recipe.servings, 1);
    const lines = [
      `${recipe.title} – Zutaten für ${currentServings} Portionen`,
      ...recipe.ingredients.map((ingredient: Ingredient) =>
        `- ${formatAmount(ingredient.amount * scale)} ${ingredient.unit} ${ingredient.name}`),
    ];
    const text = lines.join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setIngredientsCopyStatus('success');
    } catch {
      setIngredientsCopyStatus('error');
    }
  };

  // "Keine Lust auf dieses Rezept" – roll again, without landing on the same one.
  const handleRollAgain = async () => {
    if (!recipe) return;
    try {
      const next = await apiClient.getRandomRecipe({ exclude: recipe.slug });
      navigate(`/recipes/${next.slug}`);
    } catch {
      setRatingError('Kein weiteres Rezept gefunden.');
    }
  };

  const handleDuplicate = async () => {
    if (!recipe) return;
    try {
      const copy = await duplicateRecipe.mutateAsync(recipe.id);
      navigate(`/recipes/${copy.slug}/edit`);
    } catch {
      setRatingError('Rezept konnte nicht dupliziert werden.');
    }
  };

  const handlePlanDay = async (day: WeekDay, label: string) => {
    setWeekPlanAnchor(null);
    if (!recipe) return;
    const servings = servingSelection?.recipeId === recipe.id ? servingSelection.servings : recipe.servings;
    try {
      await addToWeekPlan.mutateAsync({ day, recipeId: recipe.id, servings });
      setWeekPlanSuccess(`Für ${label} eingeplant (${servings} Portionen).`);
    } catch {
      setRatingError('Rezept konnte nicht eingeplant werden.');
    }
  };

  const handleCopyLink = async () => {
    if (!recipe) return;

    const currentUrl = window.location.href;
    const recipePath = `/recipes/${recipe.slug}`;
    const recipeUrl = currentUrl.includes(recipePath)
      ? currentUrl
      : new URL(recipePath, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(recipeUrl);
      setCopyStatus('success');
    } catch (error) {
      console.error('Failed to copy recipe link:', error);
      setCopyStatus('error');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Stack spacing={2}>
          <Alert severity={isNotFound ? 'warning' : 'error'}>
            {isNotFound ? 'Rezept nicht gefunden.' : apiError?.message || 'Fehler beim Laden des Rezepts'}
          </Alert>
          <Box>
            <Button component={RouterLink} to="/" variant="outlined">Zurück zur Übersicht</Button>
          </Box>
        </Stack>
      </Container>
    );
  }

  if (!recipe) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Stack spacing={2}>
          <Alert severity="warning">Rezept nicht gefunden.</Alert>
          <Box>
            <Button component={RouterLink} to="/" variant="outlined">Zurück zur Übersicht</Button>
          </Box>
        </Stack>
      </Container>
    );
  }

  const renderImage = recipeRenderImage(recipe.img);
  const selectedServings = servingSelection?.recipeId === recipe.id
    ? servingSelection.servings
    : recipe.servings;
  const totalTime = recipe.preparationTime + recipe.cookingTime;
  const servingScale = selectedServings / Math.max(recipe.servings, 1);
  const difficultyColor = {
    'EINFACH': 'success',
    'MITTEL': 'warning',
    'SCHWER': 'error'
  } as const satisfies Record<typeof recipe.difficulty, 'success' | 'warning' | 'error'>;

  return (
    <>
      <Stack spacing={3.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Button component={RouterLink} to="/" variant="text">Zurück zur Übersicht</Button>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {user && (
              <Button
                startIcon={recipe.isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
                variant="outlined"
                onClick={handleToggleFavorite}
                disabled={toggleFavorite.isPending}
                aria-label={recipe.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
              >
                {recipe.isFavorite ? 'Favorit' : 'Merken'}
              </Button>
            )}
            {user && (
              <>
                <Button
                  startIcon={<CalendarMonth />}
                  variant="outlined"
                  onClick={(event) => setWeekPlanAnchor(event.currentTarget)}
                  disabled={addToWeekPlan.isPending}
                >
                  Zum Wochenplan
                </Button>
                <Menu
                  anchorEl={weekPlanAnchor}
                  open={weekPlanAnchor !== null}
                  onClose={() => setWeekPlanAnchor(null)}
                >
                  {WEEK_DAYS.map(({ key, label }) => (
                    <MenuItem key={key} onClick={() => handlePlanDay(key, label)}>
                      {label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
            {user && (
              <Button
                startIcon={<CopyAll />}
                variant="outlined"
                onClick={handleDuplicate}
                disabled={duplicateRecipe.isPending}
              >
                Variante anlegen
              </Button>
            )}
            <Button startIcon={<LocalDining />} variant="outlined" onClick={() => setCookingModeOpen(true)}>
              Kochmodus
            </Button>
            <Button startIcon={<Casino />} variant="outlined" onClick={handleRollAgain}>
              Nochmal würfeln
            </Button>
            <Button startIcon={<ContentCopy />} variant="outlined" onClick={handleCopyLink}>
              Link kopieren
            </Button>
            <Button startIcon={<LocalPrintshop />} variant="outlined" onClick={handlePrint}>
              Drucken
            </Button>
            {(() => {
              const isOwner = user?.id === recipe.createdBy?.id;
              const isEditor = user ? EDITOR_ROLES.includes(user.role) : false;
              const canEdit = isOwner || isEditor;
              const canDelete = isOwner || user?.role === 'ADMIN';
              return (
                <>
                  {canEdit && (
                    <Button component={RouterLink} to={`/recipes/${recipe.slug}/edit`} startIcon={<EditIcon />} variant="outlined">
                      Bearbeiten
                    </Button>
                  )}
                  {isEditor && recipe.status !== 'PUBLISHED' && (
                    <Button onClick={handlePublish} startIcon={<PublishIcon />} variant="outlined" color="success" disabled={publishRecipe.isPending}>
                      Veröffentlichen
                    </Button>
                  )}
                  {isEditor && recipe.status !== 'ARCHIVED' && (
                    <Button onClick={handleArchive} startIcon={<ArchiveIcon />} variant="outlined" color="warning" disabled={archiveRecipe.isPending}>
                      Archivieren
                    </Button>
                  )}
                  {canDelete && (
                    <Button onClick={handleDeleteRecipe} startIcon={<DeleteIcon />} variant="outlined" color="error" disabled={deleteRecipe.isPending}>
                      Löschen
                    </Button>
                  )}
                </>
              );
            })()}
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          {recipe.img && (
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                image={renderImage ?? recipe.img}
                alt={recipe.title}
                sx={{ height: { xs: 250, sm: 350, md: 450 }, width: '100%', objectFit: 'cover' }}
              />
              {renderImage && (
                <Box
                  component="img"
                  src={recipe.img}
                  alt={`Illustration: ${recipe.title}`}
                  sx={{
                    position: 'absolute',
                    right: { xs: 12, md: 20 },
                    bottom: { xs: 12, md: 20 },
                    width: { xs: 104, sm: 140, md: 180 },
                    aspectRatio: '16 / 10',
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '3px solid',
                    borderColor: 'background.paper',
                    boxShadow: 4,
                  }}
                />
              )}
            </Box>
          )}
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 2, flexWrap: 'wrap' }}>
              {recipe.tag && (
                <Chip label={recipe.tag} size="small" color="secondary" variant="filled" />
              )}
              <Chip
                label={recipe.difficulty}
                size="small"
                color={difficultyColor[recipe.difficulty]}
                variant="outlined"
              />
              <Chip label={recipe.category} size="small" variant="outlined" />
            </Stack>

            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 1.5
              }}
            >
              {recipe.title}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: '1.05rem', mb: 3, maxWidth: 760 }}
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

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              useFlexGap
              sx={{ mb: 3, flexWrap: 'wrap' }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <AccessTime color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {totalTime} Min.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Restaurant color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {recipe.preparationTime} Min. Vorbereitung
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <People color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {selectedServings} Portionen
                </Typography>
              </Stack>
            </Stack>

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

            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
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

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ height: 'fit-content' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Zutaten
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Für {selectedServings} Portionen
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mb: 2 }}>
                  <Tooltip title="Portionen verringern">
                    <span>
                      <IconButton
                        aria-label="Portionen verringern"
                        size="small"
                        onClick={() => setServingSelection({
                          recipeId: recipe.id,
                          servings: Math.max(1, selectedServings - 1),
                        })}
                        disabled={selectedServings <= 1}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Typography
                    variant="body2"
                    sx={{ minWidth: 28, textAlign: 'center', fontWeight: 600 }}
                  >
                    {selectedServings}
                  </Typography>
                  <Tooltip title="Portionen erhöhen">
                    <IconButton
                      aria-label="Portionen erhöhen"
                      size="small"
                      onClick={() => setServingSelection({
                        recipeId: recipe.id,
                        servings: selectedServings + 1,
                      })}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Button
                    startIcon={<ShoppingCartOutlined />}
                    variant="outlined"
                    size="small"
                    onClick={handleCopyIngredients}
                    fullWidth
                  >
                    Zutaten kopieren
                  </Button>
                  <Button
                    startIcon={<AddShoppingCart />}
                    variant="outlined"
                    size="small"
                    fullWidth
                    href={buildBringDeeplink({
                      apiBaseUrl: getApiBaseUrl(),
                      slug: recipe.slug,
                      servings: selectedServings,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    An Bring! senden
                  </Button>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <List dense sx={{ p: 0 }}>
                  {recipe.ingredients.map((ingredient: Ingredient, index: number) => (
                    <ListItem
                      key={`${ingredient.name}-${ingredient.unit}-${index}`}
                      disableGutters
                      sx={{ py: 1 }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1">
                            {ingredient.amount > 0 && (
                              <strong>{formatAmount(ingredient.amount * servingScale)} {ingredient.unit} </strong>
                            )}
                            {ingredient.name}
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
              <Paper variant="outlined" sx={{ mt: 3, height: 'fit-content' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Nährwerte
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    {recipe.nutritionalValues.calories !== undefined && (
                      <Grid size={{ xs: 6 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <LocalFireDepartment color="error" fontSize="small" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Kalorien
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {recipe.nutritionalValues.calories} kcal
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    )}
                    {recipe.nutritionalValues.protein !== undefined && (
                      <Grid size={{ xs: 6 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <FitnessCenter color="primary" fontSize="small" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Eiweiß
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {recipe.nutritionalValues.protein} g
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    )}
                    {recipe.nutritionalValues.carbohydrates !== undefined && (
                      <Grid size={{ xs: 6 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Grain color="warning" fontSize="small" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Kohlenhydrate
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {recipe.nutritionalValues.carbohydrates} g
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    )}
                    {recipe.nutritionalValues.fat !== undefined && (
                      <Grid size={{ xs: 6 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <WaterDrop color="info" fontSize="small" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Fett
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
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

          <Grid size={{ xs: 12, md: 8 }}>
            <Paper variant="outlined">
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Zubereitung
                </Typography>
                <Stack spacing={3}>
                  {recipe.steps.map((step: RecipeStep, index: number) => (
                    <Box key={step.stepNumber}>
                      <Stack direction="row" spacing={3} sx={{ alignItems: 'flex-start' }}>
                        <Box
                          sx={{
                            minWidth: 36,
                            height: 36,
                            borderRadius: 1,
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1rem',
                            flexShrink: 0
                          }}
                        >
                          {step.stepNumber}
                        </Box>
                        <Box sx={{ flexGrow: 1, pt: 0.5 }}>
                          <Typography
                            variant="body1"
                            sx={{ lineHeight: 1.65, whiteSpace: 'pre-line' }}
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

        {(user || recipe.notes) && (
          <Paper variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Notizen
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Gemeinsame Merkzettel für die Familie – z.&nbsp;B. „nächstes Mal weniger Salz".
              </Typography>
              {user ? (
                <Stack spacing={1.5}>
                  <TextField
                    label="Notizen"
                    multiline
                    minRows={2}
                    fullWidth
                    value={notesDraft?.recipeId === recipe.id ? notesDraft.value : (recipe.notes ?? '')}
                    onChange={(event) => setNotesDraft({ recipeId: recipe.id, value: event.target.value })}
                  />
                  <Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSaveNotes}
                      disabled={updateNotes.isPending}
                    >
                      Notiz speichern
                    </Button>
                  </Box>
                </Stack>
              ) : (
                <Typography sx={{ whiteSpace: 'pre-line' }}>{recipe.notes}</Typography>
              )}
            </CardContent>
          </Paper>
        )}

        <Paper variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
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
      <CookingMode
        recipe={recipe}
        servings={selectedServings}
        open={cookingModeOpen}
        onClose={() => setCookingModeOpen(false)}
      />
      <Snackbar
        open={copyStatus !== 'idle'}
        autoHideDuration={3000}
        onClose={() => setCopyStatus('idle')}
        message={copyStatus === 'success' ? 'Link kopiert' : 'Link konnte nicht kopiert werden'}
      />
      <Snackbar
        open={ingredientsCopyStatus !== 'idle'}
        autoHideDuration={3000}
        onClose={() => setIngredientsCopyStatus('idle')}
        message={ingredientsCopyStatus === 'success' ? 'Zutaten kopiert' : 'Zutaten konnten nicht kopiert werden'}
      />
      <Snackbar
        open={weekPlanSuccess !== null}
        autoHideDuration={3000}
        onClose={() => setWeekPlanSuccess(null)}
        message={weekPlanSuccess}
      />
      <Snackbar
        open={ratingError !== null}
        autoHideDuration={4000}
        onClose={() => setRatingError(null)}
      >
        <Alert severity="error" onClose={() => setRatingError(null)} sx={{ width: '100%' }}>
          {ratingError}
        </Alert>
      </Snackbar>
    </>
  );
}
