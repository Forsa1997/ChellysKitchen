import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { apiClient, type CreateRecipeRequest } from '../api/client';
import { useCategories } from '../hooks/useCategories';
import { RecipePreviewCard } from './RecipePreviewCard';
import { RecipeImportCard } from './RecipeImportCard';

const FALLBACK_CATEGORIES = ['Cooking', 'Baking', 'Barbeque', 'Salads', 'Soups', 'Desserts'];
const DIFFICULTY_LEVELS = ['EINFACH', 'MITTEL', 'SCHWER'] as const;
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EINFACH: 'Einfach',
  MITTEL: 'Mittel',
  SCHWER: 'Schwer',
};

type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

// Amounts are edited as text so German decimal commas ("1,5") work; they are
// parsed to numbers on submit.
interface IngredientDraft {
  name: string;
  amount: string;
  unit: string;
}

interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

interface NutritionalValues {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
}

export interface RecipeFormInitialValues {
  title?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  tag?: string;
  difficulty?: Difficulty;
  servings?: number;
  preparationTime?: number;
  cookingTime?: number;
  img?: string;
  ingredients?: Ingredient[];
  steps?: RecipeStep[];
  nutritionalValues?: NutritionalValues;
}

// The complete editable state, used for the undo snapshot before an import
// and for the localStorage draft.
interface FormSnapshot {
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  tag: string;
  difficulty: Difficulty;
  servings: number;
  preparationTime: number;
  cookingTime: number;
  img: string;
  ingredients: IngredientDraft[];
  steps: RecipeStep[];
  nutritionalValues: NutritionalValues;
}

interface RecipeFormProps {
  heading: string;
  subheading?: string;
  submitLabel: string;
  initialValues?: RecipeFormInitialValues;
  onSubmit: (data: CreateRecipeRequest) => Promise<unknown>;
  onCancel?: () => void;
  submitting?: boolean;
  /** Show the AI import card (photo/URL) above the form. */
  importEnabled?: boolean;
  /** localStorage key for the automatic draft; omit to disable autosave. */
  draftKey?: string;
}

const DRAFT_DEBOUNCE_MS = 600;

function parseAmount(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

function formatAmount(amount: number | undefined): string {
  return amount && amount > 0 ? String(amount).replace('.', ',') : '';
}

function toIngredientDrafts(ingredients: Ingredient[] | undefined): IngredientDraft[] | null {
  if (!ingredients || ingredients.length === 0) return null;
  return ingredients.map((ingredient) => ({
    name: ingredient.name ?? '',
    unit: ingredient.unit ?? '',
    // Amount 0 means "no amount" (e.g. Salz) — show an empty field.
    amount: formatAmount(ingredient.amount),
  }));
}

function loadDraft(draftKey: string): Partial<FormSnapshot> | null {
  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Partial<FormSnapshot>;
  } catch {
    return null;
  }
}

function Section({
  title,
  subtitle,
  badge,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string; badge?: string | number }>) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.75 } }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
        {badge !== undefined && <Chip size="small" variant="outlined" label={badge} />}
      </Stack>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
      )}
      <Box sx={{ mt: 2.5 }}>{children}</Box>
    </Paper>
  );
}

export function RecipeForm({
  heading,
  subheading,
  submitLabel,
  initialValues,
  onSubmit,
  onCancel,
  submitting,
  importEnabled,
  draftKey,
}: RecipeFormProps) {
  const { data: categories } = useCategories();
  const categoryNames = categories && categories.length > 0
    ? categories.map((cat) => cat.name)
    : FALLBACK_CATEGORIES;

  // A saved draft (interrupted session) wins over the passed initial values.
  const [draft] = useState(() => (draftKey ? loadDraft(draftKey) : null));

  const [title, setTitle] = useState(draft?.title ?? initialValues?.title ?? '');
  const [shortDescription, setShortDescription] = useState(draft?.shortDescription ?? initialValues?.shortDescription ?? '');
  const [description, setDescription] = useState(draft?.description ?? initialValues?.description ?? '');
  const [category, setCategory] = useState(draft?.category ?? initialValues?.category ?? '');
  const [tag, setTag] = useState(draft?.tag ?? initialValues?.tag ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>(draft?.difficulty ?? initialValues?.difficulty ?? 'MITTEL');
  const [servings, setServings] = useState(draft?.servings ?? initialValues?.servings ?? 2);
  const [preparationTime, setPreparationTime] = useState(draft?.preparationTime ?? initialValues?.preparationTime ?? 10);
  const [cookingTime, setCookingTime] = useState(draft?.cookingTime ?? initialValues?.cookingTime ?? 20);
  const [img, setImg] = useState(draft?.img ?? initialValues?.img ?? '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    draft?.ingredients && draft.ingredients.length > 0
      ? draft.ingredients
      : toIngredientDrafts(initialValues?.ingredients) ?? [{ name: '', amount: '', unit: '' }],
  );
  const [steps, setSteps] = useState<RecipeStep[]>(
    draft?.steps && draft.steps.length > 0
      ? draft.steps
      : initialValues?.steps && initialValues.steps.length > 0
        ? initialValues.steps
        : [{ stepNumber: 1, instruction: '' }],
  );
  const [nutritionalValues, setNutritionalValues] = useState<NutritionalValues>(
    draft?.nutritionalValues ?? initialValues?.nutritionalValues ?? {},
  );

  const [problems, setProblems] = useState<string[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Import: snapshot for "Rückgängig" + yellow flash on the filled fields.
  const importSnapshotRef = useRef<FormSnapshot | null>(null);
  const [flashImported, setFlashImported] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Draft autosave.
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftDisabledRef = useRef(false);

  // Default the category to the first available option once loaded.
  const effectiveCategory = category || categoryNames[0] || '';

  const captureSnapshot = (): FormSnapshot => ({
    title,
    shortDescription,
    description,
    category,
    tag,
    difficulty,
    servings,
    preparationTime,
    cookingTime,
    img,
    ingredients: ingredients.map((ingredient) => ({ ...ingredient })),
    steps: steps.map((step) => ({ ...step })),
    nutritionalValues: { ...nutritionalValues },
  });

  const restoreSnapshot = (snapshot: FormSnapshot) => {
    setTitle(snapshot.title);
    setShortDescription(snapshot.shortDescription);
    setDescription(snapshot.description);
    setCategory(snapshot.category);
    setTag(snapshot.tag);
    setDifficulty(snapshot.difficulty);
    setServings(snapshot.servings);
    setPreparationTime(snapshot.preparationTime);
    setCookingTime(snapshot.cookingTime);
    setImg(snapshot.img);
    setIngredients(snapshot.ingredients);
    setSteps(snapshot.steps);
    setNutritionalValues(snapshot.nutritionalValues);
  };

  const applyImportedValues = (values: RecipeFormInitialValues) => {
    importSnapshotRef.current = captureSnapshot();
    if (values.title !== undefined) setTitle(values.title);
    if (values.shortDescription !== undefined) setShortDescription(values.shortDescription);
    if (values.description !== undefined) setDescription(values.description);
    if (values.category && categoryNames.includes(values.category)) setCategory(values.category);
    if (values.tag !== undefined) setTag(values.tag);
    if (values.difficulty && DIFFICULTY_LEVELS.includes(values.difficulty)) setDifficulty(values.difficulty);
    if (values.servings !== undefined) setServings(values.servings);
    if (values.preparationTime !== undefined) setPreparationTime(values.preparationTime);
    if (values.cookingTime !== undefined) setCookingTime(values.cookingTime);
    if (values.img) setImg(values.img);
    const importedIngredients = toIngredientDrafts(values.ingredients);
    if (importedIngredients) setIngredients(importedIngredients);
    if (values.steps && values.steps.length > 0) {
      setSteps(values.steps.map((step, index) => ({ stepNumber: index + 1, instruction: step.instruction })));
    }
    if (values.nutritionalValues) setNutritionalValues(values.nutritionalValues);

    setFlashImported(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashImported(false), 1800);
  };

  const undoImport = () => {
    if (importSnapshotRef.current) {
      restoreSnapshot(importSnapshotRef.current);
      importSnapshotRef.current = null;
    }
  };

  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
  }, []);

  // Debounced draft autosave: forms on a phone get interrupted all the time.
  useEffect(() => {
    if (!draftKey || draftDisabledRef.current) return undefined;
    draftTimerRef.current = setTimeout(() => {
      if (draftDisabledRef.current) return;
      const hasContent =
        title.trim() !== '' ||
        shortDescription.trim() !== '' ||
        ingredients.some((ingredient) => ingredient.name.trim() !== '') ||
        steps.some((step) => step.instruction.trim() !== '');
      if (hasContent) {
        window.localStorage.setItem(draftKey, JSON.stringify(captureSnapshot()));
        setDraftSavedAt(new Date());
      } else {
        window.localStorage.removeItem(draftKey);
      }
    }, DRAFT_DEBOUNCE_MS);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draftKey,
    title,
    shortDescription,
    description,
    category,
    tag,
    difficulty,
    servings,
    preparationTime,
    cookingTime,
    img,
    ingredients,
    steps,
    nutritionalValues,
  ]);

  const clearDraft = () => {
    if (!draftKey) return;
    draftDisabledRef.current = true;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    window.localStorage.removeItem(draftKey);
    setDraftSavedAt(null);
  };

  const addIngredient = () => setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof IngredientDraft, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addStep = () => setSteps([...steps, { stepNumber: steps.length + 1, instruction: '' }]);

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const updated = steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, stepNumber: i + 1 }));
      setSteps(updated);
    }
  };

  const updateStep = (index: number, instruction: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], instruction };
    setSteps(updated);
  };

  const updateNutritionalValue = (field: keyof NutritionalValues, value: string) => {
    setNutritionalValues((prev) => {
      const next = { ...prev };
      if (value === '') {
        delete next[field];
      } else {
        next[field] = Number(value);
      }
      return next;
    });
  };

  const handleImageFile = async (file: File | undefined | null) => {
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const { url } = await apiClient.uploadImage(file);
      setImg(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Bild konnte nicht hochgeladen werden.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    clearDraft();
    onCancel?.();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setError(null);

    // Rows the cook never touched are dropped silently. Only the name is
    // required — "Salz" has neither amount nor unit. A row with an amount or
    // unit but no name is probably a mistake and blocks the submit.
    const preparedIngredients: Ingredient[] = [];
    let hasIncompleteIngredient = false;
    for (const ingredient of ingredients) {
      const name = ingredient.name.trim();
      const unit = ingredient.unit.trim();
      const amountText = ingredient.amount.trim();
      if (!name && !unit && !amountText) continue;

      const amount = amountText === '' ? 0 : parseAmount(amountText);
      if (name && Number.isFinite(amount) && amount >= 0) {
        preparedIngredients.push({ name, amount, unit });
      } else {
        hasIncompleteIngredient = true;
      }
    }

    const preparedSteps = steps
      .map((step) => step.instruction.trim())
      .filter(Boolean)
      .map((instruction, index) => ({ stepNumber: index + 1, instruction }));

    const missing: string[] = [];
    if (!title.trim()) missing.push('Titel fehlt.');
    if (!shortDescription.trim()) missing.push('Kurzbeschreibung fehlt.');
    if (!(servings >= 1)) missing.push('Portionen müssen mindestens 1 sein.');
    if (hasIncompleteIngredient) missing.push('Bitte vervollständige alle angefangenen Zutaten (mindestens der Name fehlt oder die Menge ist ungültig).');
    if (preparedIngredients.length === 0 && !hasIncompleteIngredient) missing.push('Mindestens eine Zutat wird benötigt.');
    if (preparedSteps.length === 0) missing.push('Mindestens ein Zubereitungsschritt wird benötigt.');

    setProblems(missing);
    if (missing.length > 0) {
      return;
    }

    const hasNutrition = Object.values(nutritionalValues).some((value) => value !== undefined);

    try {
      await onSubmit({
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        description: description || undefined,
        category: effectiveCategory,
        tag: tag || undefined,
        // PATCH only updates fields that are present. Send an explicit empty
        // value when an existing image was removed so the backend can clear it.
        img: img || (initialValues?.img ? '' : undefined),
        difficulty,
        servings,
        preparationTime,
        cookingTime,
        ingredients: preparedIngredients,
        steps: preparedSteps,
        nutritionalValues: hasNutrition ? nutritionalValues : undefined,
      });
      clearDraft();
    } catch (requestError) {
      draftDisabledRef.current = false;
      setError(requestError instanceof Error ? requestError.message : 'Rezept konnte nicht gespeichert werden.');
    }
  };

  const namedIngredientCount = ingredients.filter((ingredient) => ingredient.name.trim() !== '').length;
  const filledStepCount = steps.filter((step) => step.instruction.trim() !== '').length;
  const previewIngredients = useMemo(
    () =>
      ingredients
        .filter((ingredient) => ingredient.name.trim() !== '')
        .map((ingredient) => ({
          amount: ingredient.amount.trim(),
          unit: ingredient.unit.trim(),
          name: ingredient.name.trim(),
        })),
    [ingredients],
  );
  const previewSteps = useMemo(
    () => steps.map((step) => step.instruction.trim()).filter(Boolean),
    [steps],
  );

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{heading}</Typography>
        {subheading && (
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 620 }}>{subheading}</Typography>
        )}
      </Box>

      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 340px' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Stack
          spacing={2}
          sx={{
            minWidth: 0,
            ...(flashImported && {
              '@keyframes ckImportFlash': {
                from: { backgroundColor: 'hsl(48, 95%, 88%)' },
                to: { backgroundColor: 'transparent' },
              },
              '& .MuiInputBase-root': { animation: 'ckImportFlash 1.6s ease-out' },
            }),
          }}
        >
          {importEnabled && (
            <RecipeImportCard onApply={applyImportedValues} onUndo={undoImport} />
          )}

          <Section title="Grundinformationen">
            <Stack spacing={2.5}>
              <TextField
                label="Titel"
                required
                fullWidth
                value={title}
                error={submitAttempted && !title.trim()}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Himbeer-Mascarpone-Torte"
              />
              <TextField
                label="Kurzbeschreibung"
                required
                fullWidth
                multiline
                minRows={2}
                value={shortDescription}
                error={submitAttempted && !shortDescription.trim()}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Eine kurze Zusammenfassung des Rezepts"
              />
              <TextField
                label="Ausführliche Beschreibung"
                fullWidth
                multiline
                minRows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detaillierte Beschreibung des Rezepts (optional)"
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Kategorie</InputLabel>
                    <Select value={effectiveCategory} label="Kategorie" onChange={(e) => setCategory(e.target.value)}>
                      {categoryNames.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Tag"
                    fullWidth
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="z.B. vegetarisch (optional)"
                  />
                </Grid>
              </Grid>
            </Stack>
          </Section>

          <Section title="Details">
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel id="difficulty-label">Schwierigkeit</InputLabel>
                    <Select
                      labelId="difficulty-label"
                      value={difficulty}
                      label="Schwierigkeit"
                      onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    >
                      {DIFFICULTY_LEVELS.map((level) => (
                        <MenuItem key={level} value={level}>{DIFFICULTY_LABELS[level]}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField label="Portionen" type="number" fullWidth value={servings} slotProps={{ htmlInput: { min: 1 } }} onChange={(e) => setServings(Number(e.target.value))} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField label="Vorbereitungszeit (Min.)" type="number" fullWidth value={preparationTime} slotProps={{ htmlInput: { min: 0 } }} onChange={(e) => setPreparationTime(Number(e.target.value))} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField label="Kochzeit (Min.)" type="number" fullWidth value={cookingTime} slotProps={{ htmlInput: { min: 0 } }} onChange={(e) => setCookingTime(Number(e.target.value))} />
                </Grid>
              </Grid>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Bild</Typography>
                {img && (
                  <Box
                    component="img"
                    src={img}
                    alt="Vorschau"
                    sx={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 1, mb: 1.5 }}
                  />
                )}
                <Box
                  component="label"
                  onDragOver={(event: React.DragEvent) => event.preventDefault()}
                  onDrop={(event: React.DragEvent) => {
                    event.preventDefault();
                    void handleImageFile(event.dataTransfer.files?.[0]);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderRadius: 3,
                    border: '2px dashed',
                    borderColor: 'divider',
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'text.secondary' },
                  }}
                >
                  {uploading ? <CircularProgress size={22} /> : <CloudUploadIcon color="action" />}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {uploading ? 'Wird hochgeladen…' : 'Bild hochladen oder hierher ziehen'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Beim Foto-Import wird das Foto automatisch als Rezeptbild übernommen.
                    </Typography>
                  </Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    aria-label="Bild hochladen"
                    disabled={uploading}
                    onChange={(e) => void handleImageFile(e.target.files?.[0])}
                  />
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5, alignItems: { sm: 'center' } }}>
                  <TextField label="oder Bild-URL" fullWidth value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://example.com/bild.jpg (optional)" />
                  {img && (
                    <Button variant="text" color="inherit" onClick={() => setImg('')} sx={{ flexShrink: 0 }}>
                      Bild entfernen
                    </Button>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Section>

          <Section
            title="Zutaten"
            badge={namedIngredientCount}
            subtitle="Leere Zeilen werden beim Speichern ignoriert. Mengen darfst du mit Komma schreiben (z.B. 1,5); Menge und Einheit sind optional (z.B. „Salz“)."
          >
            <Stack spacing={1.5}>
              {ingredients.map((ingredient, index) => (
                <Grid key={index} container spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      label="Menge"
                      fullWidth
                      value={ingredient.amount}
                      slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                      onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                      placeholder="z.B. 1,5"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField label="Einheit" fullWidth value={ingredient.unit} onChange={(e) => updateIngredient(index, 'unit', e.target.value)} placeholder="z.B. g, ml, EL" />
                  </Grid>
                  <Grid size={{ xs: 10, sm: 7 }}>
                    <TextField label="Zutat" fullWidth value={ingredient.name} onChange={(e) => updateIngredient(index, 'name', e.target.value)} placeholder="z.B. Mehl" />
                  </Grid>
                  <Grid size={{ xs: 2, sm: 1 }}>
                    <Tooltip title="Zutat entfernen">
                      <span>
                        <IconButton aria-label="Zutat entfernen" onClick={() => removeIngredient(index)} disabled={ingredients.length === 1} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Grid>
                </Grid>
              ))}
              <Box>
                <Button startIcon={<AddIcon />} onClick={addIngredient} variant="outlined" size="small">Zutat hinzufügen</Button>
              </Box>
            </Stack>
          </Section>

          <Section title="Zubereitung" badge={filledStepCount}>
            <Stack spacing={1.5}>
              {steps.map((step, index) => (
                <Stack key={index} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      minWidth: 36,
                      height: 36,
                      mt: 1,
                      borderRadius: 1,
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {step.stepNumber}
                  </Box>
                  <TextField label="Anweisung" fullWidth multiline minRows={2} value={step.instruction} onChange={(e) => updateStep(index, e.target.value)} placeholder="Beschreibe diesen Schritt..." />
                  <Tooltip title="Schritt entfernen">
                    <span>
                      <IconButton aria-label="Schritt entfernen" onClick={() => removeStep(index)} disabled={steps.length === 1} color="error" sx={{ mt: 1 }}>
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              ))}
              <Box>
                <Button startIcon={<AddIcon />} onClick={addStep} variant="outlined" size="small">Schritt hinzufügen</Button>
              </Box>
            </Stack>
          </Section>

          <Section title="Nährwerte" badge="optional" subtitle="Pro Portion. Lasse Felder leer, wenn du sie nicht angeben möchtest.">
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Kalorien (kcal)" type="number" fullWidth value={nutritionalValues.calories ?? ''} slotProps={{ htmlInput: { min: 0 } }} onChange={(e) => updateNutritionalValue('calories', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Eiweiß (g)" type="number" fullWidth value={nutritionalValues.protein ?? ''} slotProps={{ htmlInput: { min: 0 } }} onChange={(e) => updateNutritionalValue('protein', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Kohlenhydrate (g)" type="number" fullWidth value={nutritionalValues.carbohydrates ?? ''} slotProps={{ htmlInput: { min: 0 } }} onChange={(e) => updateNutritionalValue('carbohydrates', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Fett (g)" type="number" fullWidth value={nutritionalValues.fat ?? ''} slotProps={{ htmlInput: { min: 0 } }} onChange={(e) => updateNutritionalValue('fat', e.target.value)} />
              </Grid>
            </Grid>
          </Section>
        </Stack>

        {/* Live preview: sticky on desktop, below the form on mobile. */}
        <Box sx={{ minWidth: 0, position: { md: 'sticky' }, top: { md: 24 } }}>
          <RecipePreviewCard
            title={title.trim()}
            shortDescription={shortDescription.trim()}
            category={effectiveCategory}
            tag={tag.trim()}
            difficultyLabel={DIFFICULTY_LABELS[difficulty]}
            totalMinutes={(preparationTime || 0) + (cookingTime || 0)}
            servings={servings}
            img={img || undefined}
            ingredients={previewIngredients}
            steps={previewSteps}
          />
        </Box>
      </Box>

      {/* Sticky action bar: the form is long, save must stay reachable. */}
      <Box sx={{ position: 'sticky', bottom: 0, zIndex: 2, pb: 1.5, mt: 3 }}>
        <Paper elevation={4} sx={{ p: { xs: 1.5, md: 2 } }}>
          <Stack spacing={1.5}>
            {problems.length > 0 && (
              <Alert severity="warning">
                {problems.map((problem) => (
                  <Box key={problem} component="span" sx={{ display: 'block' }}>{problem}</Box>
                ))}
              </Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                {draftKey
                  ? draftSavedAt
                    ? `Entwurf automatisch gespeichert · ${draftSavedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
                    : 'Entwurf wird automatisch gespeichert'
                  : ''}
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {onCancel && (
                  <Button onClick={handleCancel} color="inherit">Abbrechen</Button>
                )}
                <Button type="submit" variant="contained" disabled={submitting || uploading}>
                  {submitting ? 'Speichern...' : submitLabel}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
