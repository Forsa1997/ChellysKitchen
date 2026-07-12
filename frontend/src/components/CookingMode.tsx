import { AppBar, Box, Button, Container, Dialog, IconButton, List, ListItem, ListItemText, Paper, Stack, Toolbar, Typography } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import { useEffect, useState } from 'react';
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

interface CookingDuration {
  label: string;
  seconds: number;
  start: number;
  end: number;
}

interface ActiveTimer {
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
  startedAt: number;
}

const findCookingDurations = (instruction: string): CookingDuration[] => {
  const durationPattern = /\b(?:(\d+)\s*(Stunden?|Std\.?)(?:\s+(?:und\s+)?(\d+)\s*(Minuten?|Min\.?))?|(\d+)\s*(Minuten?|Min\.?)|(\d+)\s*(Sekunden?|Sek\.?))/gi;
  const durations: CookingDuration[] = [];

  for (const match of instruction.matchAll(durationPattern)) {
    const hours = Number(match[1] ?? 0);
    const minutes = Number(match[3] ?? match[5] ?? 0);
    const seconds = Number(match[7] ?? 0);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds > 0 && match.index !== undefined) {
      durations.push({
        label: match[0],
        seconds: totalSeconds,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return durations;
};

const formatCountdown = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const minuteSeconds = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${minuteSeconds}` : minuteSeconds;
};

/**
 * Fullscreen step-by-step cooking view: large type, one step per page and an
 * ingredient overview up front. The screen stays awake while it is open.
 * Page 0 is the ingredient overview, pages 1..n map to recipe.steps.
 */
export function CookingMode({ recipe, servings, open, onClose }: CookingModeProps) {
  const [page, setPage] = useState(0);
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  useWakeLock(open);

  useEffect(() => {
    if (!open || !timer?.running) return undefined;

    const interval = window.setInterval(() => {
      setTimer((current) => {
        if (!current?.running) return current;
        const remainingSeconds = Math.max(0, current.remainingSeconds - 1);
        return {
          ...current,
          remainingSeconds,
          running: remainingSeconds > 0,
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [open, timer?.running, timer?.startedAt]);

  // Reopening starts over at the ingredient overview (state adjusted during
  // render instead of an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPage(0);
    } else {
      setTimer(null);
    }
  }

  const stepCount = recipe.steps.length;
  const isLastPage = page >= stepCount;
  const scale = servings / Math.max(recipe.servings, 1);
  const step = page > 0 ? recipe.steps[page - 1] : null;

  const startTimer = (duration: CookingDuration) => {
    setTimer({
      label: duration.label,
      totalSeconds: duration.seconds,
      remainingSeconds: duration.seconds,
      running: true,
      startedAt: Date.now(),
    });
  };

  const renderInstruction = (instruction: string) => {
    const durations = findCookingDurations(instruction);
    if (durations.length === 0) return instruction;

    const content = [];
    let cursor = 0;
    for (const duration of durations) {
      if (duration.start > cursor) content.push(instruction.slice(cursor, duration.start));
      content.push(
        <Button
          key={`${duration.start}-${duration.label}`}
          size="small"
          variant="outlined"
          startIcon={<TimerOutlined />}
          aria-label={`Timer für ${duration.label} starten`}
          onClick={() => startTimer(duration)}
          sx={{ mx: 0.5, my: 0.25, minHeight: 44, verticalAlign: 'middle' }}
        >
          {duration.label}
        </Button>,
      );
      cursor = duration.end;
    }
    if (cursor < instruction.length) content.push(instruction.slice(cursor));
    return content;
  };

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
        {timer && (
          <Paper
            variant="outlined"
            sx={{
              mb: 3,
              p: 2,
              borderColor: timer.remainingSeconds === 0 ? 'success.main' : 'primary.main',
              bgcolor: timer.remainingSeconds === 0 ? 'success.soft' : 'primary.soft',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <TimerOutlined color={timer.remainingSeconds === 0 ? 'success' : 'primary'} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {timer.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    role={timer.remainingSeconds === 0 ? 'status' : undefined}
                    aria-live={timer.remainingSeconds === 0 ? 'assertive' : undefined}
                    sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {timer.remainingSeconds === 0 ? 'Zeit ist um' : formatCountdown(timer.remainingSeconds)}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                {timer.remainingSeconds > 0 && (
                  <Button
                    variant="contained"
                    startIcon={timer.running ? <Pause /> : <PlayArrow />}
                    aria-label={timer.running ? 'Timer pausieren' : 'Timer fortsetzen'}
                    onClick={() => setTimer((current) => current ? { ...current, running: !current.running } : current)}
                  >
                    {timer.running ? 'Pause' : 'Weiter'}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => setTimer((current) => current ? {
                    ...current,
                    remainingSeconds: current.totalSeconds,
                    running: false,
                  } : current)}
                >
                  Zurücksetzen
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
        {step ? (
          <Typography
            component="div"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.9rem' },
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
            }}
          >
            {renderInstruction(step.instruction)}
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
