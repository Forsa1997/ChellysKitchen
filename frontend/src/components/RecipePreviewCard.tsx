import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  ImageOutlined as ImageOutlinedIcon,
  RestaurantOutlined as RestaurantOutlinedIcon,
} from '@mui/icons-material';
import { brand, gray } from '../themePrimitives';

export interface PreviewIngredient {
  amount: string;
  unit: string;
  name: string;
}

export interface RecipePreviewCardProps {
  title: string;
  shortDescription: string;
  category: string;
  tag: string;
  difficultyLabel: string;
  totalMinutes: number;
  servings: number;
  img?: string;
  ingredients: PreviewIngredient[];
  steps: string[];
}

const STEP_PREVIEW_MAX_CHARS = 90;

function truncate(text: string): string {
  if (text.length <= STEP_PREVIEW_MAX_CHARS) return text;
  return `${text.slice(0, STEP_PREVIEW_MAX_CHARS).trimEnd()}…`;
}

function PreviewSectionLabel({ children }: { children: string }) {
  return (
    <Typography
      component="div"
      sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'text.secondary' }}
    >
      {children}
    </Typography>
  );
}

/**
 * Sticky live preview of the recipe card, mirroring the form state as the
 * cook types. Purely presentational.
 */
export function RecipePreviewCard({
  title,
  shortDescription,
  category,
  tag,
  difficultyLabel,
  totalMinutes,
  servings,
  img,
  ingredients,
  steps,
}: RecipePreviewCardProps) {
  return (
    <Paper
      component="section"
      aria-label="Live-Vorschau"
      variant="outlined"
      sx={(theme) => ({
        overflow: 'hidden',
        p: 0,
        boxShadow: '0 12px 32px -18px rgba(0,0,0,.18)',
        ...theme.applyStyles('dark', { boxShadow: 'none' }),
      })}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: 'hsl(160, 70%, 40%)',
            '@keyframes ckPulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
            animation: 'ckPulse 1.6s ease-in-out infinite',
          }}
        />
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em' }}>
          LIVE-VORSCHAU
        </Typography>
      </Stack>

      {img ? (
        <Box
          component="img"
          src={img}
          alt="Rezeptbild"
          sx={{ display: 'block', width: '100%', height: 150, objectFit: 'cover' }}
        />
      ) : (
        <Box
          sx={(theme) => ({
            height: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: brand[700],
            background: `repeating-linear-gradient(135deg, ${brand[50]}, ${brand[50]} 14px, ${brand[100]} 14px, ${brand[100]} 28px)`,
            ...theme.applyStyles('dark', {
              color: brand[200],
              background: `repeating-linear-gradient(135deg, ${brand[900]}, ${brand[900]} 14px, ${brand[800]} 14px, ${brand[800]} 28px)`,
            }),
          })}
        >
          <ImageOutlinedIcon sx={{ mr: 0.75, fontSize: 18 }} />
          Bildvorschau
        </Box>
      )}

      <Stack spacing={1.5} sx={{ p: 2.25, '& *': { overflowWrap: 'anywhere' } }}>
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
          {category && <Chip size="small" color="primary" label={category} />}
          {tag && <Chip size="small" variant="outlined" label={tag} />}
        </Stack>

        <Typography sx={{ fontSize: 19, fontWeight: 800, lineHeight: 1.25, color: title ? 'text.primary' : 'text.secondary' }}>
          {title || 'Noch kein Titel'}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary' }}
        >
          {shortDescription || 'Die Kurzbeschreibung erscheint hier.'}
        </Typography>

        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
          {difficultyLabel && <Chip size="small" variant="outlined" label={difficultyLabel} />}
          {totalMinutes > 0 && (
            <Chip size="small" variant="outlined" icon={<AccessTimeIcon />} label={`${totalMinutes} Min.`} />
          )}
          {servings > 0 && (
            <Chip size="small" variant="outlined" icon={<RestaurantOutlinedIcon />} label={`${servings} Portionen`} />
          )}
        </Stack>

        {ingredients.length > 0 && (
          <Stack spacing={0.75}>
            <PreviewSectionLabel>ZUTATEN</PreviewSectionLabel>
            {ingredients.map((ingredient, index) => (
              <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 13,
                    height: 13,
                    mt: '3px',
                    flexShrink: 0,
                    borderRadius: 0.5,
                    border: '1.5px solid',
                    borderColor: gray[300],
                  }}
                />
                <Typography variant="body2">
                  {[ingredient.amount, ingredient.unit, ingredient.name].filter(Boolean).join(' ')}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {steps.length > 0 && (
          <Stack spacing={0.75}>
            <PreviewSectionLabel>ZUBEREITUNG</PreviewSectionLabel>
            {steps.map((step, index) => (
              <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: brand[500], flexShrink: 0, minWidth: 16 }}
                >
                  {index + 1}.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {truncate(step)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
