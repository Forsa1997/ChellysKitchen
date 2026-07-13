// Admin-only batch photo import: upload many recipe photos at once, Gemini
// digitizes them server-side and every recognized recipe is created as an
// unpublished draft (tag "KI-Import") for review in the admin dashboard.
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import {
  AddPhotoAlternate as AddPhotoAlternateIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  ErrorOutlined as ErrorOutlineIcon,
  HelpOutlined as HelpOutlineIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { useBatchImportJobs, useStartBatchImport } from '../hooks/useBatchImport';
import {
  MAX_BATCH_IMPORT_PHOTOS,
  type BatchImportItem,
  type BatchImportJob,
} from '../api/client';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const ITEM_STATUS_LABELS: Record<BatchImportItem['status'], string> = {
  PENDING: 'Wartet',
  PROCESSING: 'Wird analysiert…',
  CREATED: 'Entwurf erstellt',
  NO_RECIPE: 'Kein Rezept erkannt',
  FAILED: 'Fehlgeschlagen',
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function itemIcon(status: BatchImportItem['status']) {
  switch (status) {
    case 'CREATED':
      return <CheckCircleIcon color="success" fontSize="small" />;
    case 'NO_RECIPE':
      return <HelpOutlineIcon color="warning" fontSize="small" />;
    case 'FAILED':
      return <ErrorOutlineIcon color="error" fontSize="small" />;
    case 'PROCESSING':
      return <CircularProgress size={16} />;
    default:
      return <HourglassEmptyIcon color="disabled" fontSize="small" />;
  }
}

function JobCard({ job }: { job: BatchImportJob }) {
  const progress = job.total > 0 ? (job.processed / job.total) * 100 : 0;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
          <Typography sx={{ fontWeight: 600 }}>
            Batch vom {new Date(job.createdAt).toLocaleString('de-DE')}
          </Typography>
          <Chip
            size="small"
            label={job.status === 'RUNNING' ? 'Läuft…' : 'Abgeschlossen'}
            color={job.status === 'RUNNING' ? 'info' : 'success'}
          />
          <Typography variant="body2" color="text.secondary">
            {job.processed}/{job.total} Fotos verarbeitet · {job.created} Entwürfe
            {job.noRecipe > 0 ? ` · ${job.noRecipe} ohne Rezept` : ''}
            {job.failed > 0 ? ` · ${job.failed} fehlgeschlagen` : ''}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          aria-label="Fortschritt des Batch-Imports"
        />
        <List dense disablePadding>
          {job.items.map((item) => (
            <ListItem key={item.index} disableGutters>
              <ListItemIcon sx={{ minWidth: 32 }}>{itemIcon(item.status)}</ListItemIcon>
              <ListItemText
                primary={item.fileName}
                secondary={
                  item.status === 'CREATED' && item.recipe ? (
                    <>
                      {ITEM_STATUS_LABELS[item.status]}
                      {': '}
                      <Link component={RouterLink} to={`/recipes/${item.recipe.slug}`}>
                        {item.recipe.title}
                      </Link>
                    </>
                  ) : item.status === 'FAILED' && item.error ? (
                    `${ITEM_STATUS_LABELS[item.status]}: ${item.error}`
                  ) : (
                    ITEM_STATUS_LABELS[item.status]
                  )
                }
              />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
}

export function BatchImportPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  const { data: jobsData, isLoading } = useBatchImportJobs(isAdmin);
  const startBatchImport = useStartBatchImport();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const jobs = jobsData?.data ?? [];
  const hasRunningJob = jobs.some((job) => job.status === 'RUNNING');

  // When the running batch finishes, the new drafts should show up in the
  // recipe lists without a manual reload.
  const wasRunningRef = useRef(false);
  useEffect(() => {
    if (wasRunningRef.current && !hasRunningJob) {
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    }
    wasRunningRef.current = hasRunningJob;
  }, [hasRunningJob, queryClient]);

  if (!isAdmin) {
    return (
      <Alert severity="error">
        Der Batch-Import ist nur für Admins verfügbar.
      </Alert>
    );
  }

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    setSelectedFiles((previous) => {
      const merged = [...previous];
      for (const file of incoming) {
        if (merged.some((existing) => existing.name === file.name && existing.size === file.size)) {
          continue;
        }
        if (file.size > MAX_PHOTO_BYTES) {
          setActionError(`„${file.name}“ ist zu groß (max. 5 MB pro Foto).`);
          continue;
        }
        merged.push(file);
      }
      if (merged.length > MAX_BATCH_IMPORT_PHOTOS) {
        setActionError(`Maximal ${MAX_BATCH_IMPORT_PHOTOS} Fotos pro Batch.`);
        return merged.slice(0, MAX_BATCH_IMPORT_PHOTOS);
      }
      return merged;
    });
    // Allow re-selecting the same file after removing it from the list.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStart = async () => {
    if (selectedFiles.length === 0) return;
    try {
      await startBatchImport.mutateAsync(selectedFiles);
      setSelectedFiles([]);
    } catch (err) {
      const message = (err as { message?: string })?.message;
      setActionError(message || 'Der Batch-Import konnte nicht gestartet werden.');
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Rezepte im Batch importieren
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Lade mehrere Rezeptfotos auf einmal hoch — Kochbuchseiten, handgeschriebene
          Zettel oder Bildschirmfotos. Gemini digitalisiert jedes Foto automatisch.
        </Typography>
      </Box>

      <Alert severity="info">
        Erkannte Rezepte werden als unveröffentlichte Entwürfe mit dem Tag „KI-Import“
        angelegt. Prüfe sie nach dem Durchlauf und veröffentliche sie im{' '}
        <Link component={RouterLink} to="/admin">Admin-Dashboard</Link>.
      </Alert>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<AddPhotoAlternateIcon />}
              disabled={startBatchImport.isPending || hasRunningJob}
            >
              Fotos auswählen
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                aria-label="Rezeptfotos auswählen"
                onChange={(event) => handleFilesSelected(event.target.files)}
              />
            </Button>
            <Button
              variant="contained"
              onClick={handleStart}
              disabled={selectedFiles.length === 0 || startBatchImport.isPending || hasRunningJob}
            >
              {selectedFiles.length > 0
                ? `${selectedFiles.length} ${selectedFiles.length === 1 ? 'Foto' : 'Fotos'} verarbeiten`
                : 'Batch starten'}
            </Button>
          </Stack>

          {selectedFiles.length > 0 && (
            <List dense disablePadding>
              {selectedFiles.map((file) => (
                <ListItem
                  key={`${file.name}-${file.size}`}
                  disableGutters
                  secondaryAction={(
                    <IconButton
                      edge="end"
                      size="small"
                      aria-label={`${file.name} entfernen`}
                      onClick={() => setSelectedFiles((previous) => previous.filter((entry) => entry !== file))}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                >
                  <ListItemText primary={file.name} secondary={formatBytes(file.size)} />
                </ListItem>
              ))}
            </List>
          )}

          <Typography variant="body2" color="text.secondary">
            Bis zu {MAX_BATCH_IMPORT_PHOTOS} Fotos pro Batch, je max. 5 MB (JPG, PNG, WebP oder GIF).
            Es kann immer nur ein Batch gleichzeitig laufen.
          </Typography>
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Fortschritt
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Laufende und abgeschlossene Batch-Importe.
        </Typography>
      </Box>

      {isLoading ? (
        <CircularProgress />
      ) : jobs.length === 0 ? (
        <Typography color="text.secondary">Noch kein Batch-Import gestartet.</Typography>
      ) : (
        <Stack spacing={2}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </Stack>
      )}

      <Snackbar
        open={actionError !== null}
        autoHideDuration={5000}
        onClose={() => setActionError(null)}
      >
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ width: '100%' }}>
          {actionError}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
