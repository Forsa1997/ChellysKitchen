// Rating Components
import { Box, Rating, Typography, Stack } from '@mui/material';
import { Star } from '@mui/icons-material';

interface RatingDisplayProps {
  value: number;
  count?: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export function RatingDisplay({ value, count, size = 'medium', showCount = true }: RatingDisplayProps) {
  const formattedValue = Math.round(value * 10) / 10;

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Rating
        value={formattedValue}
        precision={0.5}
        readOnly
        size={size}
        emptyIcon={<Star style={{ opacity: 0.3 }} fontSize="inherit" />}
      />
      {showCount && count !== undefined && (
        <Typography variant="body2" color="text.secondary">
          ({count})
        </Typography>
      )}
    </Stack>
  );
}

interface InteractiveRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function InteractiveRating({ value, onChange, disabled = false, size = 'medium' }: InteractiveRatingProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Rating
        value={value}
        precision={1}
        onChange={(_event, newValue) => {
          if (newValue !== null) {
            onChange(newValue);
          }
        }}
        disabled={disabled}
        size={size}
      />
    </Box>
  );
}