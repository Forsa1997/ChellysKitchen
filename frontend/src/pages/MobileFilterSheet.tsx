import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { CategoryFilter, DifficultyFilter, SortSelect, TimeFilter } from './recipeFilterControls';
import type { RecipeListParams } from './recipeListQueryParams';

interface MobileFilterSheetProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  listParams: RecipeListParams;
  onCategoryChange: (value: string | null) => void;
  onDifficultyChange: (event: React.MouseEvent<HTMLElement>, value: string | null) => void;
  onTimePresetChange: (event: React.MouseEvent<HTMLElement>, value: string | null) => void;
  onSortChange: (event: SelectChangeEvent<string>) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
}

/**
 * Bottom sheet holding the category/difficulty/time/sort controls on mobile.
 * Filters apply immediately via URL updates (same handlers as the inline
 * desktop controls), so "Anwenden" only closes the sheet.
 */
export function MobileFilterSheet({
  open,
  onClose,
  categories,
  listParams,
  onCategoryChange,
  onDifficultyChange,
  onTimePresetChange,
  onSortChange,
  onReset,
  hasActiveFilters,
  resultCount,
}: MobileFilterSheetProps) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '85dvh',
          },
        },
      }}
    >
      <Stack sx={{ p: 2.5, pb: 1, overflow: 'auto' }} spacing={2.5}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Filter</Typography>
          <IconButton aria-label="Filter schließen" onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <CategoryFilter categories={categories} value={listParams.category} onChange={onCategoryChange} />
        <DifficultyFilter value={listParams.difficulty} onChange={onDifficultyChange} />
        <TimeFilter maxTotalMinutes={listParams.maxTotalMinutes} onChange={onTimePresetChange} />
        <SortSelect value={listParams.sort} onChange={onSortChange} />
      </Stack>

      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          p: 2,
          pt: 1.5,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={onReset}
            disabled={!hasActiveFilters}
            sx={{ flex: 1 }}
          >
            Zurücksetzen
          </Button>
          <Button variant="contained" onClick={onClose} sx={{ flex: 1 }}>
            {resultCount === 1 ? '1 Rezept anzeigen' : `${resultCount} Rezepte anzeigen`}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
