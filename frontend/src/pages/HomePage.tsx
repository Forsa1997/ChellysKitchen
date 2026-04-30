import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
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
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { useCategories } from '../hooks/useCategories';
import { useQueryRecipes } from '../recipes/useQueryRecipes';
import { RecipeGrid } from '../recipes/RecipeGrid';
import { formatCategoryLabel } from './homePageViewModel';
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

export function HomePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const listParams = normalizeRecipeListParams(searchParams);
  const { recipes, meta, loading, error } = useQueryRecipes(listParams);
  const { data: categoryData } = useCategories();
  const [queryInput, setQueryInput] = useState(listParams.q);

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
    setQueryInput(listParams.q);
  }, [listParams.q]);

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
    setQueryInput(value);
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
    setQueryInput('');
    updateParams({ q: '', page: '1' });
  };

  const resetFilters = () => {
    setQueryInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  if (error) {
    return <Alert severity="error">Rezepte konnten nicht geladen werden.</Alert>;
  }

  if (loading) {
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
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h3" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
          Rezepte entdecken
        </Typography>
        <Typography color="text.secondary">
          Finde schnelle Alltagsgerichte, Lieblingsrezepte und neue Ideen.
        </Typography>
        {!user && (
          <Alert severity="info">
            Melde dich an, um eigene Rezepte zu erstellen. Demo-Zugang: demo@chellys-kitchen.local / demo1234
          </Alert>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
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
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ md: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} alignItems="center">
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
              Alle zurücksetzen
            </Button>
          </Stack>

          <TextField
            value={queryInput}
            label="Suche"
            placeholder="Rezept, Zutat oder Anlass suchen"
            onChange={(event) => handleQueryChange(event.target.value)}
            fullWidth
            InputProps={{
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
            }}
          />

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Kategorie
            </Typography>
            <Box sx={{ overflowX: 'auto', pb: 0.5 }}>
              <ToggleButtonGroup
                value={listParams.category}
                exclusive
                onChange={(_event, value) => handleCategoryChange(value)}
                size="small"
                sx={{
                  display: 'inline-flex',
                  flexWrap: { xs: 'nowrap', md: 'wrap' },
                  gap: 1,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: '999px !important',
                    minHeight: 40,
                    px: 2,
                    whiteSpace: 'nowrap',
                  },
                }}
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

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Schwierigkeit
              </Typography>
              <ToggleButtonGroup
                value={listParams.difficulty}
                exclusive
                onChange={handleDifficultyChange}
                size="small"
                sx={{
                  flexWrap: 'wrap',
                  gap: 1,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: '999px !important',
                    minHeight: 40,
                    px: 2,
                  },
                }}
              >
                {difficultyOptions.map((entry) => (
                  <ToggleButton key={entry} value={entry}>
                    {entry === 'all' ? 'Alle' : entry}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Zeit
              </Typography>
              <ToggleButtonGroup
                value={listParams.maxTotalMinutes ? String(listParams.maxTotalMinutes) : 'all'}
                exclusive
                onChange={handleTimePresetChange}
                size="small"
                sx={{
                  flexWrap: 'wrap',
                  gap: 1,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: '999px !important',
                    minHeight: 40,
                    px: 2,
                  },
                }}
              >
                {timePresets.map((entry) => (
                  <ToggleButton key={entry} value={entry}>
                    {timePresetLabel(entry)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', lg: 190 } }}>
              <InputLabel id="sort-label">Sortieren nach</InputLabel>
              <Select labelId="sort-label" label="Sortieren nach" value={listParams.sort} onChange={handleSortChange}>
                <MenuItem value="newest">{sortLabels.newest}</MenuItem>
                <MenuItem value="oldest">{sortLabels.oldest}</MenuItem>
                <MenuItem value="title_asc">{sortLabels.title_asc}</MenuItem>
                <MenuItem value="title_desc">{sortLabels.title_desc}</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {hasActiveFilters && (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
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
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 2 }}>
          <Stack spacing={1.5} alignItems="center">
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
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
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
