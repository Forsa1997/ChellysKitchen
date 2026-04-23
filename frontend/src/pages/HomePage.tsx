import {
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { ChangeEvent, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { useQueryRecipes } from '../recipes/useQueryRecipes';
import { RecipeGrid } from '../recipes/RecipeGrid';
import { formatCategoryLabel } from './homePageViewModel';
import { normalizeRecipeListParams } from './recipeListQueryParams';

export function HomePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const listParams = normalizeRecipeListParams(searchParams);
  const { recipes, meta, loading, error } = useQueryRecipes(listParams);
  const difficultyOptions = ['all', 'Einfach', 'Mittel', 'Schwer'] as const;

  const categories = useMemo(() => {
    const result = new Set<string>();
    recipes.forEach((recipe) => result.add(recipe.category));
    return ['all', ...Array.from(result)];
  }, [recipes]);

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all') {
        next.delete(key);
        return;
      }

      next.set(key, value);
    });

    setSearchParams(next, { replace: true });
  };

  const handleQueryChange = (value: string) => {
    updateParams({ q: value, page: '1' });
  };

  const handleCategoryChange = (value: string | null) => {
    if (!value) return;
    updateParams({ category: value, page: '1' });
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    updateParams({ sort: event.target.value, page: '1' });
  };

  const handleDifficultyChange = (event: SelectChangeEvent<string>) => {
    updateParams({ difficulty: event.target.value, page: '1' });
  };

  const handleMaxTotalMinutesChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateParams({ maxTotalMinutes: event.target.value, page: '1' });
  };

  const handlePageChange = (_event: ChangeEvent<unknown>, page: number) => {
    updateParams({ page: String(page) });
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h3">Rezepte entdecken</Typography>
        <Typography color="text.secondary">API-Suche, Filter und Sortierung mit teilbarer URL.</Typography>
        {!user && (
          <Alert severity="info">
            Melde dich an, um eigene Rezepte zu erstellen. Demo-Zugang: demo@chellys-kitchen.local / demo1234
          </Alert>
        )}
      </Stack>

      <TextField
        value={listParams.q}
        label="Suche"
        placeholder="z. B. Pasta"
        onChange={(event) => handleQueryChange(event.target.value)}
        fullWidth
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
        <ToggleButtonGroup
          value={listParams.category}
          exclusive
          onChange={(_event, value) => handleCategoryChange(value)}
          size="small"
          sx={{ flexWrap: 'wrap', gap: 1 }}
        >
          {categories.map((entry) => (
            <ToggleButton key={entry} value={entry} sx={{ borderRadius: 6, px: 2 }}>
              {formatCategoryLabel(entry)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="sort-label">Sortierung</InputLabel>
          <Select labelId="sort-label" label="Sortierung" value={listParams.sort} onChange={handleSortChange}>
            <MenuItem value="newest">Neueste zuerst</MenuItem>
            <MenuItem value="oldest">Älteste zuerst</MenuItem>
            <MenuItem value="title_asc">Titel A–Z</MenuItem>
            <MenuItem value="title_desc">Titel Z–A</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="difficulty-label">Schwierigkeit</InputLabel>
          <Select
            labelId="difficulty-label"
            label="Schwierigkeit"
            value={listParams.difficulty}
            onChange={handleDifficultyChange}
          >
            {difficultyOptions.map((entry) => (
              <MenuItem key={entry} value={entry}>
                {entry === 'all' ? 'Alle' : entry}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Max. Gesamtzeit (Min.)"
          type="number"
          inputProps={{ min: 1 }}
          value={listParams.maxTotalMinutes ?? ''}
          onChange={handleMaxTotalMinutesChange}
          sx={{ maxWidth: 220 }}
        />
      </Stack>

      <RecipeGrid recipes={recipes} />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
        <Typography color="text.secondary">
          {meta.total} Treffer · Seite {meta.page} von {meta.totalPages}
        </Typography>
        <Pagination count={meta.totalPages} page={meta.page} onChange={handlePageChange} color="primary" />
      </Stack>
    </Stack>
  );
}
