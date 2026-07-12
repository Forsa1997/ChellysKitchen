import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Chip,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { useWeekPlan, useAddToWeekPlan, useRemoveFromWeekPlan, useClearWeekPlan } from '../hooks/useWeekPlan';
import { getApiBaseUrl, type WeekPlanEntry } from '../api/client';
import { buildWeekPlanBringDeeplink } from '../utils/bring';
import { WEEK_DAYS } from '../utils/weekdays';
import { recipeRenderImage } from '../recipes/recipeImages';

export function WeekPlanPage() {
  const { data, isLoading, error } = useWeekPlan();
  const addToWeekPlan = useAddToWeekPlan();
  const removeFromWeekPlan = useRemoveFromWeekPlan();
  const clearWeekPlan = useClearWeekPlan();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return <Alert severity="error">{error instanceof Error ? error.message : 'Wochenplan konnte nicht geladen werden.'}</Alert>;
  }

  const days = data.days;
  const hasEntries = WEEK_DAYS.some(({ key }) => (days[key] ?? []).length > 0);

  const run = async (action: () => Promise<unknown>, failureMessage: string) => {
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : failureMessage);
    }
  };

  const handleClear = () => {
    if (window.confirm('Den kompletten Wochenplan leeren?')) {
      run(() => clearWeekPlan.mutateAsync(), 'Wochenplan konnte nicht geleert werden.');
    }
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}
      >
        <Box>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: '.1em' }}>Gemeinsam genießen</Typography>
          <Typography variant="h1" sx={{ mt: 0.5 }}>
            Wochenplan
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 620 }}>
            Was kochen wir diese Woche? Rezepte fügst du über „Zum Wochenplan" auf der
            Rezeptseite hinzu — der Plan gilt für die ganze Familie.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
          <Button color="inherit" onClick={handleClear} disabled={!hasEntries || clearWeekPlan.isPending}>
            Woche leeren
          </Button>
          <Button
            variant="contained"
            startIcon={<AddShoppingCartIcon />}
            href={buildWeekPlanBringDeeplink({ apiBaseUrl: getApiBaseUrl() })}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!hasEntries}
          >
            Einkaufsliste an Bring! senden
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {WEEK_DAYS.map(({ key, label }) => {
          const entries = days[key] ?? [];
          return (
            <Grid key={key} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  minHeight: 150,
                  height: '100%',
                  ...(entries.length === 0 && { borderStyle: 'dashed', bgcolor: 'transparent' }),
                }}
              >
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{label}</Typography>
                  {entries.length > 0 && <Chip label={entries.length} color="primary" size="small" />}
                </Stack>
                {entries.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Noch nichts geplant.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {entries.map((entry: WeekPlanEntry) => (
                      <Stack key={entry.recipeId} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        {entry.recipe.img && (
                          <Box
                            component="img"
                            src={recipeRenderImage(entry.recipe.img) ?? entry.recipe.img}
                            alt=""
                            sx={{ width: 60, height: 46, objectFit: 'cover', borderRadius: 2.5, flexShrink: 0 }}
                          />
                        )}
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography
                            component={RouterLink}
                            to={`/recipes/${entry.recipe.slug}`}
                            sx={{
                              display: 'block',
                              fontWeight: 600,
                              color: 'text.primary',
                              textDecoration: 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              '&:hover': { color: 'primary.main' },
                            }}
                          >
                            {entry.recipe.title}
                          </Typography>
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                            <Tooltip title="Portionen verringern">
                              <span>
                                <IconButton
                                  aria-label={`${entry.recipe.title}: Portionen verringern`}
                                  size="small"
                                  disabled={entry.servings <= 1 || addToWeekPlan.isPending}
                                  onClick={() => run(
                                    () => addToWeekPlan.mutateAsync({ day: key, recipeId: entry.recipeId, servings: entry.servings - 1 }),
                                    'Portionen konnten nicht geändert werden.',
                                  )}
                                >
                                  <RemoveIcon fontSize="inherit" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Typography variant="body2" color="text.secondary">
                              {entry.servings} Portionen
                            </Typography>
                            <Tooltip title="Portionen erhöhen">
                              <IconButton
                                aria-label={`${entry.recipe.title}: Portionen erhöhen`}
                                size="small"
                                disabled={addToWeekPlan.isPending}
                                onClick={() => run(
                                  () => addToWeekPlan.mutateAsync({ day: key, recipeId: entry.recipeId, servings: entry.servings + 1 }),
                                  'Portionen konnten nicht geändert werden.',
                                )}
                              >
                                <AddIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                        <Tooltip title="Vom Plan entfernen">
                          <IconButton
                            aria-label={`${entry.recipe.title} vom Plan entfernen`}
                            size="small"
                            color="inherit"
                            disabled={removeFromWeekPlan.isPending}
                            onClick={() => run(
                              () => removeFromWeekPlan.mutateAsync({ day: key, recipeId: entry.recipeId }),
                              'Rezept konnte nicht entfernt werden.',
                            )}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Snackbar open={actionError !== null} autoHideDuration={4000} onClose={() => setActionError(null)}>
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ width: '100%' }}>
          {actionError}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
