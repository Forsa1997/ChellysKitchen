import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Pagination,
  Paper,
  Select,
  SelectChangeEvent,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CasinoIcon from '@mui/icons-material/Casino';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { useCategories } from '../hooks/useCategories';
import { useQueryRecipes } from '../recipes/useQueryRecipes';
import { RecipeGrid } from '../recipes/RecipeGrid';
import { formatCategoryLabel, selectRandomRecipe } from './homePageViewModel';
import { normalizeRecipeListParams } from './recipeListQueryParams';

const difficultyOptions = ['all', 'Einfach', 'Mittel', 'Schwer'] as const;
const timePresets = ['all', '15', '30', '60'] as const;

const sortLabels: Record<string, string> = {
  newest: 'Neueste',
  oldest: 'Älteste',
  title_asc: 'Titel A-Z',
  title_desc: 'Titel Z-A',
};

function timePresetLabel(value: string) {
  return value === 'all' ? 'Alle' : `bis ${value} Min.`;
}

// Shared styling so every filter group (category, difficulty, time) looks and
// behaves identically: standalone rounded buttons that wrap onto new lines,
// without the theme's default group container box (visible in dark mode).
const filterToggleGroupSx: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1,
  // Override the theme's grouped-toggle container (a bordered/filled box that
  // is applied with high specificity in dark mode) so the buttons read as
  // standalone chips, consistent across light and dark.
  backgroundColor: 'transparent !important',
  border: 'none !important',
  borderRadius: 0,
  p: 0,
  '& .MuiToggleButtonGroup-grouped': {
    m: 0,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '8px !important',
    minHeight: 40,
    px: 2,
    whiteSpace: 'nowrap',
  },
};

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const listParams = normalizeRecipeListParams(searchParams);
  const { recipes, meta, loading, fetching = false, error } = useQueryRecipes(listParams);
  const { data: categoryData } = useCategories();
  const [queryDraft, setQueryDraft] = useState({ value: listParams.q, source: listParams.q });
  let queryInput = queryDraft.value;

  if (queryDraft.source !== listParams.q) {
    queryInput = listParams.q;
    setQueryDraft({ value: listParams.q, source: listParams.q });
  }

  const categories = useMemo(() => {
    if (categoryData?.length) {
      return ['all', ...categoryData.map((category) => category.name)];
    }

    const result = new Set<string>();
    recipes.forEach((recipe) => result.add(recipe.category));
    return ['all', ...Array.from(result)];
  }, [categoryData, recipes]);

  const activeFilterCount = [
    listParams.q,
    listParams.category !== 'all' ? listParams.category : '',
    listParams.difficulty !== 'all' ? listParams.difficulty : '',
    listParams.maxTotalMinutes ? String(listParams.maxTotalMinutes) : '',
    listParams.sort !== 'newest' ? listParams.sort : '',
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  const updateParams = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all') {
        next.delete(key);
        return;
      }

      next.set(key, value);
    });

    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (queryInput.trim() === listParams.q) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateParams({ q: queryInput, page: '1' });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [queryInput, listParams.q, updateParams]);

  const handleQueryChange = (value: string) => {
    setQueryDraft({ value, source: listParams.q });
  };

  const handleCategoryChange = (value: string | null) => {
    if (!value) return;
    updateParams({ category: value, page: '1' });
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    updateParams({ sort: event.target.value, page: '1' });
  };

  const handleDifficultyChange = (_event: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (!value) return;
    updateParams({ difficulty: value, page: '1' });
  };

  const handleTimePresetChange = (_event: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (!value) return;
    updateParams({ maxTotalMinutes: value, page: '1' });
  };

  const handlePageChange = (_event: ChangeEvent<unknown>, page: number) => {
    updateParams({ page: String(page) });
  };

  const clearQuery = () => {
    setQueryDraft({ value: '', source: listParams.q });
    updateParams({ q: '', page: '1' });
  };

  const resetFilters = () => {
    setQueryDraft({ value: '', source: '' });
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const openRandomRecipe = () => {
    const recipe = selectRandomRecipe(recipes);
    if (!recipe) return;

    navigate(`/recipes/${recipe.slug}`);
  };

  if (error) {
    return <Alert severity="error">Rezepte konnten nicht geladen werden.</Alert>;
  }

  if (loading && recipes.length === 0) {
    return (
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Skeleton variant="text" width="45%" height={56} />
          <Skeleton variant="text" width="70%" />
        </Stack>
        <Skeleton variant="rounded" height={220} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {[0, 1, 2].map((entry) => (
            <Skeleton key={entry} variant="rounded" height={320} sx={{ flex: 1 }} />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={3.5}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
          alignItems: 'end',
        }}
      >
        <Stack spacing={1}>
          <Typography
            variant="overline"
            color="primary"
            sx={{ fontWeight: 700, display: { xs: 'none', md: 'block' } }}
          >
            Chellys Kitchen
          </Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: '2rem', md: '2.625rem' }, fontWeight: 700 }}>
            Rezepte entdecken
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 620 }}>
            Finde schnelle Alltagsgerichte, Lieblingsrezepte und neue Ideen.
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: { md: 'flex-end' } }}>
          {/* Auth/navigation actions live in the burger menu on mobile, so only
              show them here from md up to avoid duplication. */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {user ? (
              <Button component={RouterLink} to="/recipes/new" variant="contained">
                Rezept erstellen
              </Button>
            ) : (
              <>
                <Button component={RouterLink} to="/signin" variant="outlined">
                  Anmelden
                </Button>
                <Button component={RouterLink} to="/signup" variant="contained">
                  Registrieren
                </Button>
              </>
            )}
          </Stack>
          <Button
            variant="outlined"
            startIcon={<CasinoIcon />}
            onClick={openRandomRecipe}
            disabled={recipes.length === 0}
          >
            Zufälliges Rezept
          </Button>
        </Stack>
      </Box>

      <Stack spacing={1.5}>
        {!user && (
          <Alert severity="info">
            Melde dich an, um eigene Rezepte zu erstellen. Demo-Zugang: demo@chellys-kitchen.local / demo1234
          </Alert>
        )}
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          bgcolor: 'background.paper',
        }}
      >
        {fetching && (
          <Box sx={{ mx: { xs: -2, md: -2.5 }, mt: { xs: -2, md: -2.5 }, mb: 2 }}>
            <LinearProgress aria-label="Rezepte werden aktualisiert" />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: { xs: 2, md: 2.5 }, pt: 1 }}>
              Rezepte werden aktualisiert
            </Typography>
          </Box>
        )}
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TuneIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="subtitle1">
                  {meta.total} {meta.total === 1 ? 'Rezept' : 'Rezepte'} gefunden
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {hasActiveFilters ? `${activeFilterCount} Filter aktiv` : 'Alle veröffentlichten Rezepte'}
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="text"
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
            >
              Zurücksetzen
            </Button>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(360px, 1.15fr) minmax(360px, 1fr)' },
              alignItems: 'start',
            }}
          >
          <TextField
            value={queryInput}
            label="Suche"
            placeholder="Rezept, Zutat oder Anlass suchen"
            onChange={(event) => handleQueryChange(event.target.value)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: queryInput ? (
                  <InputAdornment position="end">
                    <IconButton aria-label="Suche löschen" edge="end" onClick={clearQuery} size="small">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Kategorie
            </Typography>
            <ToggleButtonGroup
              value={listParams.category}
              exclusive
              onChange={(_event, value) => handleCategoryChange(value)}
              size="small"
              sx={filterToggleGroupSx}
            >
              {categories.map((entry) => (
                <ToggleButton key={entry} value={entry}>
                  {formatCategoryLabel(entry)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          </Box>

          <Divider />

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr minmax(200px, 240px)' },
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Schwierigkeit
              </Typography>
              <ToggleButtonGroup
                value={listParams.difficulty}
                exclusive
                onChange={handleDifficultyChange}
                size="small"
                sx={filterToggleGroupSx}
              >
                {difficultyOptions.map((entry) => (
                  <ToggleButton key={entry} value={entry}>
                    {entry === 'all' ? 'Alle' : entry}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Zeit
              </Typography>
              <ToggleButtonGroup
                value={listParams.maxTotalMinutes ? String(listParams.maxTotalMinutes) : 'all'}
                exclusive
                onChange={handleTimePresetChange}
                size="small"
                sx={filterToggleGroupSx}
              >
                {timePresets.map((entry) => (
                  <ToggleButton key={entry} value={entry}>
                    {timePresetLabel(entry)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ gridColumn: { sm: '1 / -1', lg: 'auto' }, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Sortierung
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  aria-label="Sortieren nach"
                  value={listParams.sort}
                  onChange={handleSortChange}
                  sx={{ minHeight: 40 }}
                >
                  <MenuItem value="newest">{sortLabels.newest}</MenuItem>
                  <MenuItem value="oldest">{sortLabels.oldest}</MenuItem>
                  <MenuItem value="title_asc">{sortLabels.title_asc}</MenuItem>
                  <MenuItem value="title_desc">{sortLabels.title_desc}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {hasActiveFilters && (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {listParams.q && <Chip label={`Suche: ${listParams.q}`} onDelete={clearQuery} size="small" />}
              {listParams.category !== 'all' && (
                <Chip
                  label={`Kategorie: ${formatCategoryLabel(listParams.category)}`}
                  onDelete={() => handleCategoryChange('all')}
                  size="small"
                />
              )}
              {listParams.difficulty !== 'all' && (
                <Chip
                  label={`Schwierigkeit: ${listParams.difficulty}`}
                  onDelete={() => updateParams({ difficulty: 'all', page: '1' })}
                  size="small"
                />
              )}
              {listParams.maxTotalMinutes && (
                <Chip
                  label={`Bis ${listParams.maxTotalMinutes} Min.`}
                  onDelete={() => updateParams({ maxTotalMinutes: '', page: '1' })}
                  size="small"
                />
              )}
              {listParams.sort !== 'newest' && (
                <Chip
                  label={`Sortierung: ${sortLabels[listParams.sort]}`}
                  onDelete={() => updateParams({ sort: 'newest', page: '1' })}
                  size="small"
                />
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      {recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="h5">
              {listParams.q ? `Keine Rezepte für "${listParams.q}" gefunden` : 'Keine passenden Rezepte gefunden'}
            </Typography>
            <Typography color="text.secondary">Passe die Suche oder Filter an.</Typography>
            <Button variant="contained" startIcon={<RestartAltIcon />} onClick={resetFilters} disabled={!hasActiveFilters}>
              Filter zurücksetzen
            </Button>
          </Stack>
        </Paper>
      )}

      {meta.totalPages > 1 && (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Typography color="text.secondary">
            Seite {meta.page} von {meta.totalPages}
          </Typography>
          <Pagination
            count={meta.totalPages}
            page={meta.page}
            onChange={handlePageChange}
            color="primary"
            size="small"
            siblingCount={0}
            boundaryCount={1}
          />
        </Stack>
      )}
    </Stack>
  );
}
