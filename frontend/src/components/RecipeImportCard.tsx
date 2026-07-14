import {
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import {
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutlined as ErrorOutlineIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';
import type { RecipeFormInitialValues } from './RecipeForm';
import { brand, green } from '../themePrimitives';

type ImportPhase = 'idle' | 'analyzing' | 'done' | 'error';
type ImportAction = { kind: 'photo'; file: File } | { kind: 'url'; url: string };

interface ImportSummary {
  title: string;
  ingredientCount: number;
  stepCount: number;
  translated: boolean;
}

interface RecipeImportCardProps {
  /** Fills the form with the imported values (the form snapshots itself for undo). */
  onApply: (values: RecipeFormInitialValues) => void;
  /** Restores the form state from before the last import. */
  onUndo: () => void;
}

function stepLabels(action: ImportAction): [string, string, string] {
  if (action.kind === 'photo') {
    return [
      `Foto „${action.file.name}“ hochgeladen`,
      'Gemini analysiert das Foto…',
      'Felder werden ausgefüllt…',
    ];
  }
  let host = action.url;
  try {
    host = new URL(action.url).hostname;
  } catch {
    // keep the raw input as label
  }
  return [`Seite ${host} abgerufen`, 'Rezept wird ausgelesen…', 'Felder werden ausgefüllt…'];
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Hero card at the top of the create form: import a recipe from a photo
 * (cookbook page, handwritten note) or from a URL. Shows an honest
 * multi-step progress while the server-side extraction runs.
 */
export function RecipeImportCard({ onApply, onUndo }: RecipeImportCardProps) {
  const [phase, setPhase] = useState<ImportPhase>('idle');
  // Index of the currently active progress row (rows before it are done).
  const [activeStep, setActiveStep] = useState(0);
  const [labels, setLabels] = useState<[string, string, string] | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [url, setUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const lastActionRef = useRef<ImportAction | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
  }, []);

  const runImport = async (action: ImportAction) => {
    lastActionRef.current = action;
    setLabels(stepLabels(action));
    setErrorMessage('');
    setPhase('analyzing');
    // Step 1 (upload/fetch started) completes visually after a moment; the
    // request itself is a single round trip, so the middle "analysiert" row
    // carries the real waiting time.
    setActiveStep(action.kind === 'photo' ? 1 : 0);
    stepTimerRef.current = setTimeout(() => setActiveStep(1), 900);

    try {
      const { recipe, translated } =
        action.kind === 'photo'
          ? await apiClient.importRecipeFromPhoto(action.file)
          : await apiClient.importRecipe(action.url);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      setActiveStep(2);

      const values: RecipeFormInitialValues = { ...recipe };
      if (action.kind === 'photo' && !values.img) {
        // The photographed page doubles as the recipe image; a failed upload
        // must not break the import itself.
        try {
          const { url: uploadedUrl } = await apiClient.uploadImage(action.file);
          values.img = uploadedUrl;
        } catch {
          // ignore — the cook can still add an image manually
        }
      }

      onApply(values);
      setSummary({
        title: values.title ?? '',
        ingredientCount: values.ingredients?.length ?? 0,
        stepCount: values.steps?.length ?? 0,
        translated: translated === true,
      });
      setPhase('done');
    } catch (importError) {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      setErrorMessage(
        importError instanceof Error
          ? importError.message
          : 'Der Import ist fehlgeschlagen. Bitte versuche es erneut oder gib das Rezept manuell ein.',
      );
      setPhase('error');
    }
  };

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    void runImport({ kind: 'photo', file });
    // Allow re-selecting the same file after an error.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlImport = () => {
    if (!url.trim()) return;
    void runImport({ kind: 'url', url: url.trim() });
  };

  const handleUndo = () => {
    onUndo();
    setSummary(null);
    setPhase('idle');
  };

  const handleRetry = () => {
    if (lastActionRef.current) void runImport(lastActionRef.current);
  };

  return (
    <Box
      sx={(theme) => ({
        borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
        border: `1.5px solid ${brand[100]}`,
        background: `linear-gradient(135deg, ${brand[50]}, hsl(342, 75%, 94%))`,
        p: 3,
        ...theme.applyStyles('dark', {
          border: `1.5px solid ${brand[800]}`,
          background: `linear-gradient(135deg, hsl(342, 45%, 12%), hsl(342, 45%, 16%))`,
        }),
      })}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <AutoAwesomeIcon sx={(theme) => ({ fontSize: 20, color: brand[700], ...theme.applyStyles('dark', { color: brand[200] }) })} />
        <Typography
          sx={(theme) => ({ fontSize: 17, fontWeight: 800, color: brand[700], ...theme.applyStyles('dark', { color: brand[100] }) })}
        >
          Rezept importieren
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary' }}>
        Fotografiere ein Rezept — auch handschriftlich — oder füge einen Link ein. Die KI liest
        Titel, Zutaten und Zubereitung automatisch aus.
      </Typography>

      {phase === 'analyzing' && labels && (
        <Box
          sx={(theme) => ({
            mt: 2,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            p: 2,
            ...theme.applyStyles('dark', { bgcolor: 'transparent' }),
          })}
        >
          <Stack spacing={1.25}>
            {labels.map((label, index) => {
              const state = index < activeStep ? 'done' : index === activeStep ? 'active' : 'pending';
              return (
                <Stack key={label} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  {state === 'done' && <CheckCircleIcon sx={{ fontSize: 20, color: 'hsl(160, 60%, 38%)' }} />}
                  {state === 'active' && <CircularProgress size={16} thickness={5} />}
                  {state === 'pending' && (
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: 'action.disabledBackground',
                        color: 'text.secondary',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {index + 1}
                    </Box>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: state === 'pending' ? 400 : 600,
                      color:
                        state === 'done'
                          ? 'success.main'
                          : state === 'active'
                            ? 'text.primary'
                            : 'text.secondary',
                    }}
                  >
                    {label}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
          <LinearProgress
            variant="determinate"
            value={[30, 65, 92][activeStep] ?? 30}
            sx={{ mt: 1.75, height: 5, borderRadius: 999 }}
          />
        </Box>
      )}

      {phase === 'done' && summary && (
        <Stack
          direction="row"
          spacing={1.25}
          sx={(theme) => ({
            mt: 2,
            alignItems: 'center',
            borderRadius: 3,
            bgcolor: green[100],
            border: `1px solid ${green[200]}`,
            p: 1.75,
            flexWrap: 'wrap',
            rowGap: 1,
            ...theme.applyStyles('dark', {
              bgcolor: green[900],
              borderColor: green[700],
            }),
          })}
        >
          <CheckCircleIcon sx={{ color: 'success.main' }} />
          <Typography
            variant="body2"
            sx={(theme) => ({
              flex: 1,
              minWidth: 200,
              color: green[600],
              ...theme.applyStyles('dark', { color: green[300] }),
            })}
          >
            Rezept erkannt: <b>{summary.title || 'Ohne Titel'}</b> —{' '}
            {pluralize(summary.ingredientCount, 'Zutat', 'Zutaten')},{' '}
            {pluralize(summary.stepCount, 'Schritt', 'Schritte')} übernommen.
            {summary.translated && ' Das Rezept wurde automatisch ins Deutsche übersetzt.'}
            {' '}Bitte prüfe die markierten Felder.
          </Typography>
          <Button size="small" color="success" onClick={handleUndo} sx={{ fontWeight: 700, flexShrink: 0 }}>
            Rückgängig
          </Button>
        </Stack>
      )}

      {phase === 'error' && (
        <Stack
          direction="row"
          spacing={1.25}
          sx={(theme) => ({
            mt: 2,
            alignItems: 'center',
            borderRadius: 3,
            bgcolor: 'hsl(0, 80%, 96%)',
            border: '1px solid hsl(0, 60%, 84%)',
            p: 1.75,
            flexWrap: 'wrap',
            rowGap: 1,
            ...theme.applyStyles('dark', {
              bgcolor: 'hsl(0, 40%, 14%)',
              border: '1px solid hsl(0, 40%, 30%)',
            }),
          })}
        >
          <ErrorOutlineIcon color="error" />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{errorMessage}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Du kannst es erneut versuchen oder das Rezept unten manuell eingeben — deine
              Eingaben bleiben erhalten.
            </Typography>
          </Box>
          <Button size="small" color="error" onClick={handleRetry} sx={{ fontWeight: 700, flexShrink: 0 }}>
            Erneut versuchen
          </Button>
        </Stack>
      )}

      {(phase === 'idle' || phase === 'error') && (
        <>
          <ButtonBase
            component="label"
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              handleFile(event.dataTransfer.files?.[0]);
            }}
            sx={(theme) => ({
              mt: 2,
              width: '100%',
              borderRadius: 3,
              border: `2px dashed ${dragOver ? brand[400] : brand[200]}`,
              backgroundColor: dragOver ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.55)',
              p: 2.5,
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-start',
              textAlign: 'left',
              ...theme.applyStyles('dark', {
                backgroundColor: dragOver ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.2)',
              }),
            })}
          >
            <Box
              sx={(theme) => ({
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 3,
                bgcolor: 'background.paper',
                boxShadow: theme.shadows[1],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <PhotoCameraIcon sx={(theme) => ({ color: brand[500], ...theme.applyStyles('dark', { color: brand[300] }) })} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Foto aufnehmen oder hierher ziehen
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Kochbuch-Seite, Notizzettel, handschriftliches Rezept — JPG, PNG oder WebP
              </Typography>
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              aria-label="Foto importieren"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </ButtonBase>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="…oder Rezept-URL einfügen (z.B. chefkoch.de)"
              slotProps={{ htmlInput: { 'aria-label': 'Rezept-URL' } }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleUrlImport();
                }
              }}
            />
            <Button
              variant="tonal"
              onClick={handleUrlImport}
              disabled={!url.trim()}
              sx={{ flexShrink: 0 }}
            >
              Importieren
            </Button>
          </Stack>
        </>
      )}

      {phase === 'done' && (
        <Button size="small" variant="text" onClick={() => setPhase('idle')} sx={{ mt: 1.5 }}>
          Weiteres Rezept importieren
        </Button>
      )}
    </Box>
  );
}
