import { AppBar, Box, Button, Container, Dialog, IconButton, List, ListItem, ListItemText, Stack, Toolbar, Typography } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import { useState } from 'react';
import type { Ingredient, Recipe } from '../types/domain';
import { useWakeLock } from '../hooks/useWakeLock';

interface CookingModeProps {
  recipe: Recipe;
  /** Selected servings from the detail page — ingredient amounts are scaled to this. */
  servings: number;
  open: boolean;
  onClose: () => void;
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: 2,
  }).format(amount);

/**
 * Fullscreen step-by-step cooking view: large type, one step per page and an
 * ingredient overview up front. The screen stays awake while it is open.
 * Page 0 is the ingredient overview, pages 1..n map to recipe.steps.
 */
export function CookingMode({ recipe, servings, open, onClose }: CookingModeProps) {
  const [page, setPage] = useState(0);
  useWakeLock(open);

  // Reopening starts over at the ingredient overview (state adjusted during
  // render instead of an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPage(0);
  }

  const stepCount = recipe.steps.length;
  const isLastPage = page >= stepCount;
  const scale = servings / Math.max(recipe.servings, 1);
  const step = page > 0 ? recipe.steps[page - 1] : null;

  return (
    <Dialog fullScreen open={open} onClose={onClose} aria-label={`Kochmodus: ${recipe.title}`}>
      <AppBar position="relative" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
              {recipe.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step ? `Schritt ${step.stepNumber} von ${stepCount}` : 'Zutaten'}
            </Typography>
          </Box>
          <IconButton edge="end" onClick={onClose} aria-label="Kochmodus schließen">
            <Close />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flexGrow: 1, overflowY: 'auto', py: { xs: 3, sm: 5 } }}>
        {step ? (
          <Typography
            component="p"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.9rem' },
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
            }}
          >
            {step.instruction}
          </Typography>
        ) : (
          <>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Zutaten für {servings} Portionen
            </Typography>
            <List>
              {recipe.ingredients.map((ingredient: Ingredient, index: number) => (
                <ListItem key={`${ingredient.name}-${ingredient.unit}-${index}`} disableGutters divider={index < recipe.ingredients.length - 1}>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        {ingredient.amount > 0 && (
                          <strong>{formatAmount(ingredient.amount * scale)} {ingredient.unit} </strong>
                        )}
                        {ingredient.name}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Container>

      <Stack
        direction="row"
        spacing={2}
        sx={{ p: 2, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between' }}
      >
        <Button
          size="large"
          startIcon={<ArrowBack />}
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
        >
          Zurück
        </Button>
        {isLastPage ? (
          <Button size="large" variant="contained" endIcon={<Check />} onClick={onClose}>
            Fertig
          </Button>
        ) : (
          <Button size="large" variant="contained" endIcon={<ArrowForward />} onClick={() => setPage(page + 1)}>
            Weiter
          </Button>
        )}
      </Stack>
    </Dialog>
  );
}
