import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Pagination,
  Paper,
  SelectChangeEvent,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CasinoIcon from '@mui/icons-material/Casino';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { apiClient, type ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useCategories } from '../hooks/useCategories';
import { useToggleFavorite } from '../hooks/useRecipes';
import { useQueryRecipes } from '../recipes/useQueryRecipes';
import { useInfiniteQueryRecipes } from '../recipes/useInfiniteQueryRecipes';
import { RecipeGrid } from '../recipes/RecipeGrid';
import { formatCategoryLabel } from './homePageViewModel';
import { normalizeRecipeListParams } from './recipeListQueryParams';
import { MobileFilterSheet } from './MobileFilterSheet';
import { CategoryFilter, DifficultyFilter, SortSelect, TimeFilter, sortLabels } from './recipeFilterControls';

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const listParams = normalizeRecipeListParams(searchParams);
  const theme = useTheme();
  // Mobile swaps the page-based Pagination for infinite scroll. Both hooks are
  // called unconditionally (Rules of Hooks); `enabled` makes only one fetch.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  const pagedResult = useQueryRecipes(listParams, { enabled: !isMobile });
  const infiniteResult = useInfiniteQueryRecipes(listParams, { enabled: isMobile });
  const { recipes, meta, loading, fetching = false, error } = isMobile ? infiniteResult : pagedResult;
  const { hasNextPage, fetchNextPage, fetchingNextPage } = infiniteResult;
  const { data: categoryData } = useCategories();
  const [queryDraft, setQueryDraft] = useState({ value: listParams.q, source: listParams.q });
  const [randomPending, setRandomPending] = useState(false);
  const [randomError, setRandomError] = useState<string | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const toggleFavorite = useToggleFavorite();
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
    listParams.favorites ? 'favorites' : '',
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

  // The server picks from ALL matching recipes (the list here is paginated),
  // honoring the active filters: filter down to "bis 30 Min." and roll.
  const openRandomRecipe = async () => {
    setRandomPending(true);
    try {
      const recipe = await apiClient.getRandomRecipe({
        q: listParams.q || undefined,
        category: listParams.category,
        difficulty: listParams.difficulty,
        maxTotalMinutes: listParams.maxTotalMinutes,
        favorites: listParams.favorites || undefined,
      });
      navigate(`/recipes/${recipe.slug}`);
    } catch (err) {
      const apiError = err as ApiError;
      setRandomError(apiError.statusCode === 404
        ? 'Kein passendes Rezept gefunden.'
        : 'Zufälliges Rezept konnte nicht geladen werden.');
    } finally {
      setRandomPending(false);
    }
  };

  // Infinite scroll: load the next page once the sentinel below the grid
  // scrolls near the viewport. Re-armed after each fetch completes, so every
  // intersection triggers exactly one request.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!isMobile || !hasNextPage || fetchingNextPage || !node) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        fetchNextPage();
      }
    }, { rootMargin: '400px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [isMobile, hasNextPage, fetchingNextPage, fetchNextPage, recipes.length]);

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
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', display: { xs: 'none', md: 'flex' } }}
          >
            <Box
              component="img"
              src="/brand/chellys-kitchen-icon.svg"
              alt=""
              aria-hidden="true"
              sx={{ width: 22, height: 22 }}
            />
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
              Chellys Kitchen · Rezepte mit Liebe
            </Typography>
          </Stack>
          <Typography variant="h3" sx={{ fontSize: { xs: '2rem', md: '2.625rem' }, fontWeight: 700 }}>
            Rezepte entdecken
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 620 }}>
            Finde schnelle Alltagsgerichte, Lieblingsrezepte und neue Ideen.
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: { md: 'flex-end' } }}>
          <Button
            variant="tonal"
            startIcon={<CasinoIcon />}
            onClick={openRandomRecipe}
            disabled={meta.total === 0 || randomPending}
          >
            Zufälliges Rezept
          </Button>
        </Stack>
      </Box>

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
              <Box sx={(theme) => ({ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 2.5, bgcolor: 'hsl(342, 75%, 95%)', ...theme.applyStyles('dark', { bgcolor: 'hsl(342, 32%, 19%)' }) })}>
                <TuneIcon color="primary" fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1">
                  {meta.total} {meta.total === 1 ? 'Rezept' : 'Rezepte'} gefunden
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {hasActiveFilters ? `${activeFilterCount} Filter aktiv` : 'Alle veröffentlichten Rezepte'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
              {user && (
                <Button
                  variant={listParams.favorites ? 'contained' : 'tonal'}
                  size="small"
                  startIcon={listParams.favorites ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  onClick={() => updateParams({ favorites: listParams.favorites ? '' : 'true', page: '1' })}
                >
                  Nur Favoriten
                </Button>
              )}
              <Button
                variant="text"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                Zurücksetzen
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: '1fr', lg: 'minmax(360px, 1.15fr) minmax(360px, 1fr)' },
              alignItems: { xs: 'center', md: 'start' },
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

          {/* On mobile the category/difficulty/time/sort controls live in a
              bottom sheet behind this button; the badge mirrors how many
              filters are active so nothing feels hidden. */}
          <Badge badgeContent={activeFilterCount} color="primary" sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
            <Button
              variant="tonal"
              startIcon={<TuneIcon />}
              onClick={() => setFilterSheetOpen(true)}
              sx={{ minHeight: 44, whiteSpace: 'nowrap' }}
            >
              Filter
            </Button>
          </Badge>

          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <CategoryFilter categories={categories} value={listParams.category} onChange={handleCategoryChange} />
          </Box>
          </Box>

          <Divider sx={{ display: { xs: 'none', md: 'block' } }} />

          <Box
            sx={{
              display: { xs: 'none', md: 'grid' },
              gap: 2,
              gridTemplateColumns: { md: '1fr 1fr', lg: '1fr 1fr minmax(200px, 240px)' },
              alignItems: 'start',
            }}
          >
            <DifficultyFilter value={listParams.difficulty} onChange={handleDifficultyChange} />
            <TimeFilter maxTotalMinutes={listParams.maxTotalMinutes} onChange={handleTimePresetChange} />
            <SortSelect
              value={listParams.sort}
              onChange={handleSortChange}
              sx={{ gridColumn: { md: '1 / -1', lg: 'auto' } }}
            />
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
              {listParams.favorites && (
                <Chip
                  label="Nur Favoriten"
                  onDelete={() => updateParams({ favorites: '', page: '1' })}
                  size="small"
                />
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      <MobileFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        categories={categories}
        listParams={listParams}
        onCategoryChange={handleCategoryChange}
        onDifficultyChange={handleDifficultyChange}
        onTimePresetChange={handleTimePresetChange}
        onSortChange={handleSortChange}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        resultCount={meta.total}
      />

      {recipes.length > 0 ? (
        <RecipeGrid
          recipes={recipes}
          onToggleFavorite={user
            ? (recipe) => toggleFavorite.mutate({ slug: recipe.slug, isFavorite: !!recipe.isFavorite })
            : undefined}
        />
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

      <Snackbar
        open={randomError !== null}
        autoHideDuration={4000}
        onClose={() => setRandomError(null)}
      >
        <Alert severity="info" onClose={() => setRandomError(null)} sx={{ width: '100%' }}>
          {randomError}
        </Alert>
      </Snackbar>

      {isMobile && recipes.length > 0 && (
        <Box ref={sentinelRef} sx={{ display: 'flex', justifyContent: 'center', py: 1, minHeight: 40 }}>
          {fetchingNextPage && (
            <CircularProgress size={28} aria-label="Weitere Rezepte werden geladen" />
          )}
          {!hasNextPage && !fetchingNextPage && (
            <Typography variant="caption" color="text.secondary">
              Alle {meta.total} {meta.total === 1 ? 'Rezept' : 'Rezepte'} geladen
            </Typography>
          )}
        </Box>
      )}

      {!isMobile && meta.totalPages > 1 && (
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
