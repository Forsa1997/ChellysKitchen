import { Alert, Box, Button, CircularProgress, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import { Add as AddIcon, Delete as DeleteIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { apiClient, type CreateRecipeRequest } from '../api/client';
import { useCategories } from '../hooks/useCategories';

const FALLBACK_CATEGORIES = ['Cooking', 'Baking', 'Barbeque', 'Salads', 'Soups', 'Desserts'];
const DIFFICULTY_LEVELS = ['EINFACH', 'MITTEL', 'SCHWER'] as const;
const STEPS = ['Grundinformationen', 'Details', 'Zutaten', 'Zubereitung', 'Nährwerte'];

type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

interface Ingredient {
  name: string;
  amount: number;
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
  submitting?: boolean;
}

export function RecipeForm({ heading, subheading, submitLabel, initialValues, onSubmit, submitting }: RecipeFormProps) {
  const { data: categories } = useCategories();
  const categoryNames = categories && categories.length > 0
    ? categories.map((cat) => cat.name)
    : FALLBACK_CATEGORIES;

  const [activeStep, setActiveStep] = useState(0);

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

  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialValues?.ingredients && initialValues.ingredients.length > 0
      ? initialValues.ingredients
      : [{ name: '', amount: 0, unit: '' }],
  );
  const [steps, setSteps] = useState<RecipeStep[]>(
    initialValues?.steps && initialValues.steps.length > 0
      ? initialValues.steps
      : [{ stepNumber: 1, instruction: '' }],
  );
  const [nutritionalValues, setNutritionalValues] = useState<NutritionalValues>(initialValues?.nutritionalValues ?? {});

  const [error, setError] = useState<string | null>(null);

  // Default the category to the first available option once loaded.
  const effectiveCategory = category || categoryNames[0] || '';

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const addIngredient = () => setIngredients([...ingredients, { name: '', amount: 0, unit: '' }]);

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!title && !!shortDescription && !!effectiveCategory;
      case 1:
        return servings > 0 && preparationTime >= 0 && cookingTime >= 0;
      case 2:
        return ingredients.some((ing) => ing.name && ing.amount > 0 && ing.unit);
      case 3:
        return steps.some((step) => step.instruction);
      default:
        return true;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const hasIncompleteIngredient = ingredients.some((ingredient) => {
      const hasAnyValue = ingredient.name.trim() !== '' || ingredient.unit.trim() !== '' || ingredient.amount > 0;
      const isComplete = ingredient.name.trim() !== '' && ingredient.unit.trim() !== '' && ingredient.amount > 0;
      return hasAnyValue && !isComplete;
    });
    if (hasIncompleteIngredient) {
      setError('Bitte vervollständige alle Zutaten (Menge, Einheit und Name), bevor du speicherst.');
      return;
    }

    const hasEmptyStep = steps.some((step) => step.instruction.trim() === '');
    if (hasEmptyStep) {
      setError('Bitte fülle alle Zubereitungsschritte aus oder entferne leere Schritte vor dem Speichern.');
      return;
    }

    const preparedIngredients = ingredients.map((ingredient) => ({
      ...ingredient,
      name: ingredient.name.trim(),
      unit: ingredient.unit.trim(),
    }));
    const preparedSteps = steps.map((step) => ({ ...step, instruction: step.instruction.trim() }));
    const hasNutrition = Object.values(nutritionalValues).some((value) => value !== undefined);

    try {
      await onSubmit({
        title,
        shortDescription,
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

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Grundinformationen</Typography>
            <TextField label="Titel" required fullWidth value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Himbeer-Mascarpone-Torte" />
            <TextField label="Kurzbeschreibung" required fullWidth multiline minRows={3} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Eine kurze Zusammenfassung des Rezepts" />
            <TextField label="Ausführliche Beschreibung" fullWidth multiline minRows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detaillierte Beschreibung des Rezepts (optional)" />
            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select value={effectiveCategory} label="Kategorie" onChange={(e) => setCategory(e.target.value)}>
                {categoryNames.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Tags" fullWidth value={tag} onChange={(e) => setTag(e.target.value)} placeholder="z.B. vegetarisch, glutenfrei (optional)" />
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Details</Typography>
            <FormControl fullWidth>
              <InputLabel>Schwierigkeit</InputLabel>
              <Select value={difficulty} label="Schwierigkeit" onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
                {DIFFICULTY_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Portionen" type="number" fullWidth value={servings} slotProps={{ htmlInput: { min: 1 } }} onChange={(e) => setServings(Number(e.target.value))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Vorbereitungszeit (Min.)" type="number" fullWidth value={preparationTime} slotProps={{ htmlInput: { min: 0 } }} onChange={(e) => setPreparationTime(Number(e.target.value))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
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
                >
                  {uploading ? 'Wird hochgeladen…' : 'Bild hochladen'}
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageFile} />
                </Button>
                <TextField label="oder Bild-URL" fullWidth value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://example.com/bild.jpg (optional)" />
              </Stack>
            </Box>
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Zutaten</Typography>
            {ingredients.map((ingredient, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField label="Menge" type="number" fullWidth value={ingredient.amount || ''} slotProps={{ htmlInput: { min: 0, step: 0.1 } }} onChange={(e) => updateIngredient(index, 'amount', Number(e.target.value))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField label="Einheit" fullWidth value={ingredient.unit} onChange={(e) => updateIngredient(index, 'unit', e.target.value)} placeholder="z.B. g, ml, EL" />
                  </Grid>
                  <Grid size={{ xs: 10, sm: 6 }}>
                    <TextField label="Zutat" fullWidth value={ingredient.name} onChange={(e) => updateIngredient(index, 'name', e.target.value)} placeholder="z.B. Mehl" />
                  </Grid>
                  <Grid size={{ xs: 2, sm: 1 }}>
                    <IconButton onClick={() => removeIngredient(index)} disabled={ingredients.length === 1} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button startIcon={<AddIcon />} onClick={addIngredient} variant="outlined">Zutat hinzufügen</Button>
          </Stack>
        );

      case 3:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Zubereitungsschritte</Typography>
            {steps.map((step, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ minWidth: 40, pt: 1 }}>
                    <Typography variant="h6" color="primary">{step.stepNumber}</Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <TextField label="Anweisung" fullWidth multiline minRows={2} value={step.instruction} onChange={(e) => updateStep(index, e.target.value)} placeholder="Beschreibe diesen Schritt..." />
                  </Box>
                  <IconButton onClick={() => removeStep(index)} disabled={steps.length === 1} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
            <Button startIcon={<AddIcon />} onClick={addStep} variant="outlined">Schritt hinzufügen</Button>
          </Stack>
        );

      case 4:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Nährwerte (optional)</Typography>
            <Typography variant="body2" color="text.secondary">
              Alle Nährwerte sind optional. Lasse Felder leer, wenn du sie nicht angeben möchtest.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Kalorien (kcal)" type="number" fullWidth value={nutritionalValues.calories ?? ''} slotProps={{ htmlInput: { min: 0 } }} onChange={(e) => updateNutritionalValue('calories', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Eiweiß (g)" type="number" fullWidth value={nutritionalValues.protein ?? ''} slotProps={{ htmlInput: { min: 0 } }} onChange={(e) => updateNutritionalValue('protein', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Kohlenhydrate (g)" type="number" fullWidth value={nutritionalValues.carbohydrates ?? ''} slotProps={{ htmlInput: { min: 0 } }} onChange={(e) => updateNutritionalValue('carbohydrates', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Fett (g)" type="number" fullWidth value={nutritionalValues.fat ?? ''} slotProps={{ htmlInput: { min: 0 } }} onChange={(e) => updateNutritionalValue('fat', e.target.value)} />
              </Grid>
            </Grid>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{heading}</Typography>
        {subheading && (
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 620 }}>{subheading}</Typography>
        )}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <Box sx={{ overflowX: 'auto', pb: 0.5 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ minWidth: { xs: 680, md: 'auto' } }}>
              {STEPS.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>
          </Box>

          <Divider />

          <Box sx={{ minHeight: 360 }}>{getStepContent(activeStep)}</Box>

          <Divider />

          <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
            <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">Zurück</Button>

            {activeStep === STEPS.length - 1 ? (
              <Button onClick={handleSubmit} variant="contained" disabled={submitting || uploading}>
                {submitting ? 'Speichern...' : submitLabel}
              </Button>
            ) : (
              <Button onClick={handleNext} variant="contained" disabled={!validateStep(activeStep)}>Weiter</Button>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
