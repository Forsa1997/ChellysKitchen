import { Alert, Button, CircularProgress, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCreateRecipe } from '../hooks/useRecipes';
import { RecipeForm, type RecipeFormInitialValues } from '../components/RecipeForm';
import { apiClient, type CreateRecipeRequest, type Recipe } from '../api/client';

export function CreateRecipePage() {
  const navigate = useNavigate();
  const createRecipe = useCreateRecipe();

  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [photoImporting, setPhotoImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [imported, setImported] = useState<{ values: RecipeFormInitialValues; version: number } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      const { recipe } = await apiClient.importRecipe(importUrl.trim());
      // Remount the form (via key) so the imported values become its state.
      setImported((prev) => ({ values: recipe, version: (prev?.version ?? 0) + 1 }));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import fehlgeschlagen.');
    } finally {
      setImporting(false);
    }
  };

  const handlePhotoImport = async (file: File | undefined) => {
    if (!file) return;
    setPhotoImporting(true);
    setImportError(null);
    try {
      const { recipe } = await apiClient.importRecipeFromPhoto(file);
      setImported((prev) => ({ values: recipe, version: (prev?.version ?? 0) + 1 }));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Foto-Import fehlgeschlagen.');
    } finally {
      setPhotoImporting(false);
      // Allow re-selecting the same file after an error.
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (data: CreateRecipeRequest) => {
    const recipe = (await createRecipe.mutateAsync(data)) as Recipe;
    navigate(`/recipes/${recipe.slug}`);
  };

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Rezept importieren
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Füge den Link einer Rezeptseite ein (z.B. Chefkoch) — Titel, Zutaten und
          Zubereitung werden automatisch ins Formular übernommen.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, alignItems: { sm: 'center' } }}>
          <TextField
            label="Rezept-URL"
            fullWidth
            value={importUrl}
            onChange={(event) => setImportUrl(event.target.value)}
            placeholder="https://www.chefkoch.de/rezepte/..."
            disabled={importing || photoImporting}
          />
          <Button
            variant="outlined"
            onClick={handleImport}
            disabled={importing || photoImporting || !importUrl.trim()}
            startIcon={importing ? <CircularProgress size={18} /> : undefined}
            sx={{ flexShrink: 0 }}
          >
            {importing ? 'Wird geladen…' : 'Importieren'}
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }}>oder</Divider>

        <Typography variant="body2" color="text.secondary">
          Fotografiere ein Rezept — Kochbuchseite oder handgeschriebener Zettel —
          und lass es automatisch erfassen.
        </Typography>
        <Button
          component="label"
          variant="outlined"
          disabled={importing || photoImporting}
          startIcon={photoImporting ? <CircularProgress size={18} /> : undefined}
          sx={{ mt: 1.5 }}
        >
          {photoImporting ? 'Foto wird gelesen…' : 'Foto importieren'}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => handlePhotoImport(event.target.files?.[0])}
          />
        </Button>

        {importError && <Alert severity="warning" sx={{ mt: 2 }}>{importError}</Alert>}
        {imported && !importError && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Rezept übernommen — bitte unten prüfen, Kategorie wählen und speichern.
          </Alert>
        )}
      </Paper>

      <RecipeForm
        key={imported?.version ?? 0}
        heading="Neues Rezept erstellen"
        subheading="Titel, mindestens eine Zutat und ein Zubereitungsschritt genügen — alles andere ist optional."
        submitLabel="Rezept speichern"
        initialValues={imported?.values}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
        submitting={createRecipe.isPending}
      />
    </Stack>
  );
}
