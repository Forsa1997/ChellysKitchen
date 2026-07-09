import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { formatCategoryLabel } from './homePageViewModel';

export const difficultyOptions = ['all', 'Einfach', 'Mittel', 'Schwer'] as const;
export const timePresets = ['all', '15', '30', '60'] as const;

export const sortLabels: Record<string, string> = {
  newest: 'Neueste',
  oldest: 'Älteste',
  title_asc: 'Titel A-Z',
  title_desc: 'Titel Z-A',
};

export function timePresetLabel(value: string) {
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

function FilterGroupLabel({ children }: { children: string }) {
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
      {children}
    </Typography>
  );
}

export function CategoryFilter({ categories, value, onChange }: {
  categories: string[];
  value: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <Box>
      <FilterGroupLabel>Kategorie</FilterGroupLabel>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_event, next) => onChange(next)}
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
  );
}

export function DifficultyFilter({ value, onChange }: {
  value: string;
  onChange: (event: React.MouseEvent<HTMLElement>, value: string | null) => void;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <FilterGroupLabel>Schwierigkeit</FilterGroupLabel>
      <ToggleButtonGroup value={value} exclusive onChange={onChange} size="small" sx={filterToggleGroupSx}>
        {difficultyOptions.map((entry) => (
          <ToggleButton key={entry} value={entry}>
            {entry === 'all' ? 'Alle' : entry}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

export function TimeFilter({ maxTotalMinutes, onChange }: {
  maxTotalMinutes: number | null;
  onChange: (event: React.MouseEvent<HTMLElement>, value: string | null) => void;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <FilterGroupLabel>Zeit</FilterGroupLabel>
      <ToggleButtonGroup
        value={maxTotalMinutes ? String(maxTotalMinutes) : 'all'}
        exclusive
        onChange={onChange}
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
  );
}

export function SortSelect({ value, onChange, sx }: {
  value: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box sx={[{ minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <FilterGroupLabel>Sortierung</FilterGroupLabel>
      <FormControl size="small" fullWidth>
        <Select aria-label="Sortieren nach" value={value} onChange={onChange} sx={{ minHeight: 40 }}>
          <MenuItem value="newest">{sortLabels.newest}</MenuItem>
          <MenuItem value="oldest">{sortLabels.oldest}</MenuItem>
          <MenuItem value="title_asc">{sortLabels.title_asc}</MenuItem>
          <MenuItem value="title_desc">{sortLabels.title_desc}</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
