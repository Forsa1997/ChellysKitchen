import { Alert, Box, Button, CircularProgress, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useRef, useState, type PropsWithChildren } from 'react';
import { Add as AddIcon, Delete as DeleteIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { apiClient, type CreateRecipeRequest } from '../api/client';
import { useCategories } from '../hooks/useCategories';

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

interface RecipeFormProps {
  heading: string;
  subheading?: string;
  submitLabel: string;
  initialValues?: RecipeFormInitialValues;
  onSubmit: (data: CreateRecipeRequest) => Promise<unknown>;
  onCancel?: () => void;
  submitting?: boolean;
}

function parseAmount(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

function Section({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
      )}
      <Box sx={{ mt: 2.5 }}>{children}</Box>
    </Paper>
  );
}

export function RecipeForm({ heading, subheading, submitLabel, initialValues, onSubmit, onCancel, submitting }: RecipeFormProps) {
  const { data: categories } = useCategories();
  const categoryNames = categories && categories.length > 0
    ? categories.map((cat) => cat.name)
    : FALLBACK_CATEGORIES;

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [shortDescription, setShortDescription] = useState(initialValues?.shortDescription ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [category, setCategory] = useState(initialValues?.category ?? '');
  const [tag, setTag] = useState(initialValues?.tag ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialValues?.difficulty ?? 'MITTEL');
  const [servings, setServings] = useState(initialValues?.servings ?? 2);
  const [preparationTime, setPreparationTime] = useState(initialValues?.preparationTime ?? 10);
  const [cookingTime, setCookingTime] = useState(initialValues?.cookingTime ?? 20);
  const [img, setImg] = useState(initialValues?.img ?? '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    initialValues?.ingredients && initialValues.ingredients.length > 0
      ? initialValues.ingredients.map((ingredient) => ({
          ...ingredient,
          // Amount 0 means "no amount" (e.g. Salz) — show an empty field.
          amount: ingredient.amount > 0 ? String(ingredient.amount).replace('.', ',') : '',
        }))
      : [{ name: '', amount: '', unit: '' }],
  );
  const [steps, setSteps] = useState<RecipeStep[]>(
    initialValues?.steps && initialValues.steps.length > 0
      ? initialValues.steps
      : [{ stepNumber: 1, instruction: '' }],
  );
  const [nutritionalValues, setNutritionalValues] = useState<NutritionalValues>(initialValues?.nutritionalValues ?? {});

  const [problems, setProblems] = useState<string[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default the category to the first available option once loaded.
  const effectiveCategory = category || categoryNames[0] || '';

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

  const handleImageFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
        img: img || undefined,
        difficulty,
        servings,
        preparationTime,
        cookingTime,
        ingredients: preparedIngredients,
        steps: preparedSteps,
        nutritionalValues: hasNutrition ? nutritionalValues : undefined,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Rezept konnte nicht gespeichert werden.');
    }
  };

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit} noValidate>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{heading}</Typography>
        {subheading && (
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 620 }}>{subheading}</Typography>
        )}
      </Box>

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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={uploading ? <CircularProgress size={18} /> : <CloudUploadIcon />}
                disabled={uploading}
                sx={{ flexShrink: 0 }}
              >
                {uploading ? 'Wird hochgeladen…' : 'Bild hochladen'}
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageFile} />
              </Button>
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

      <Section title="Zutaten" subtitle="Leere Zeilen werden beim Speichern ignoriert. Mengen darfst du mit Komma schreiben (z.B. 1,5); Menge und Einheit sind optional (z.B. „Salz“).">
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

      <Section title="Zubereitung">
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

      <Section title="Nährwerte (optional)" subtitle="Pro Portion. Lasse Felder leer, wenn du sie nicht angeben möchtest.">
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

      {/* Sticky action bar: the form is long, save must stay reachable. */}
      <Box sx={{ position: 'sticky', bottom: 0, zIndex: 2, pb: 1.5 }}>
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
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              {onCancel && (
                <Button onClick={onCancel} color="inherit">Abbrechen</Button>
              )}
              <Button type="submit" variant="contained" disabled={submitting || uploading}>
                {submitting ? 'Speichern...' : submitLabel}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );
}
