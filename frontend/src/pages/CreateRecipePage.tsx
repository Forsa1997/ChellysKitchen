import { Alert, Box, Button, Card, CardContent, Container, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCreateRecipe } from '../hooks/useRecipes';
import { useAuth } from '../auth/AuthContext';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const DEFAULT_CATEGORIES = ['Cooking', 'Baking', 'Barbeque', 'Dessert'];
const DIFFICULTY_LEVELS = ['EINFACH', 'MITTEL', 'SCHWER'] as const;

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

const STEPS = ['Grundinformationen', 'Details', 'Zutaten', 'Zubereitung', 'Nährwerte'];

export function CreateRecipePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const createRecipe = useCreateRecipe();

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [tag, setTag] = useState('');
  const [difficulty, setDifficulty] = useState<'EINFACH' | 'MITTEL' | 'SCHWER'>('MITTEL');
  const [servings, setServings] = useState(2);
  const [preparationTime, setPreparationTime] = useState(10);
  const [cookingTime, setCookingTime] = useState(20);
  const [img, setImg] = useState('');

  // Ingredients state
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: 0, unit: '' }
  ]);

  // Steps state
  const [steps, setSteps] = useState<RecipeStep[]>([
    { stepNumber: 1, instruction: '' }
  ]);

  // Nutritional values state
  const [nutritionalValues, setNutritionalValues] = useState<NutritionalValues>({});

  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: 0, unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setIngredients(updatedIngredients);
  };

  const addStep = () => {
    const newStepNumber = steps.length + 1;
    setSteps([...steps, { stepNumber: newStepNumber, instruction: '' }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const updatedSteps = steps.filter((_, i) => i !== index);
      // Renumber steps
      const renumberedSteps = updatedSteps.map((step, i) => ({
        ...step,
        stepNumber: i + 1
      }));
      setSteps(renumberedSteps);
    }
  };

  const updateStep = (index: number, instruction: string) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], instruction };
    setSteps(updatedSteps);
  };

  const updateNutritionalValue = (field: keyof NutritionalValues, value: string) => {
    const numValue = value ? Number(value) : undefined;
    setNutritionalValues({ ...nutritionalValues, [field]: numValue });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!title && !!shortDescription && !!category;
      case 1:
        return servings > 0 && preparationTime >= 0 && cookingTime >= 0;
      case 2:
        return ingredients.some(ing => ing.name && ing.amount > 0 && ing.unit);
      case 3:
        return steps.some(step => step.instruction);
      case 4:
        return true; // Nutritional values are optional
      default:
        return false;
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      setError('Bitte melde dich zuerst an.');
      return;
    }

    setError(null);

    try {
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
      const preparedSteps = steps.map((step) => ({
        ...step,
        instruction: step.instruction.trim(),
      }));

      const recipe = await createRecipe.mutateAsync({
        title,
        shortDescription,
        description: description || undefined,
        category,
        tag: tag || undefined,
        img: img || undefined,
        difficulty,
        servings,
        preparationTime,
        cookingTime,
        ingredients: preparedIngredients,
        steps: preparedSteps,
        nutritionalValues: Object.keys(nutritionalValues).length > 0 ? nutritionalValues : undefined,
      });
      navigate(`/recipes/${recipe.slug}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Rezept konnte nicht erstellt werden.');
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Grundinformationen</Typography>
            <TextField
              label="Titel"
              required
              fullWidth
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="z.B. Himbeer-Mascarpone-Torte"
            />
            <TextField
              label="Kurzbeschreibung"
              required
              fullWidth
              multiline
              minRows={3}
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
              placeholder="Eine kurze Zusammenfassung des Rezepts"
            />
            <TextField
              label="Ausführliche Beschreibung"
              fullWidth
              multiline
              minRows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detaillierte Beschreibung des Rezepts (optional)"
            />
            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                value={category}
                label="Kategorie"
                onChange={(event) => setCategory(event.target.value)}
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Tags"
              fullWidth
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="z.B. vegetarisch, glutenfrei (optional)"
            />
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Details</Typography>
            <FormControl fullWidth>
              <InputLabel>Schwierigkeit</InputLabel>
              <Select
                value={difficulty}
                label="Schwierigkeit"
                onChange={(event) => setDifficulty(event.target.value as 'EINFACH' | 'MITTEL' | 'SCHWER')}
              >
                {DIFFICULTY_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Portionen"
                  type="number"
                  fullWidth
                  value={servings}
                  inputProps={{ min: 1 }}
                  onChange={(event) => setServings(Number(event.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Vorbereitungszeit (Min.)"
                  type="number"
                  fullWidth
                  value={preparationTime}
                  inputProps={{ min: 0 }}
                  onChange={(event) => setPreparationTime(Number(event.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Kochzeit (Min.)"
                  type="number"
                  fullWidth
                  value={cookingTime}
                  inputProps={{ min: 0 }}
                  onChange={(event) => setCookingTime(Number(event.target.value))}
                />
              </Grid>
            </Grid>
            <TextField
              label="Bild-URL"
              fullWidth
              value={img}
              onChange={(event) => setImg(event.target.value)}
              placeholder="https://example.com/bild.jpg (optional)"
            />
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Zutaten</Typography>
            {ingredients.map((ingredient, index) => (
              <Paper key={index} sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Menge"
                      type="number"
                      fullWidth
                      value={ingredient.amount || ''}
                      inputProps={{ min: 0, step: 0.1 }}
                      onChange={(e) => updateIngredient(index, 'amount', Number(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="Einheit"
                      fullWidth
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      placeholder="z.B. g, ml, EL"
                    />
                  </Grid>
                  <Grid item xs={10} sm={6}>
                    <TextField
                      label="Zutat"
                      fullWidth
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      placeholder="z.B. Mehl"
                    />
                  </Grid>
                  <Grid item xs={2} sm={1}>
                    <IconButton
                      onClick={() => removeIngredient(index)}
                      disabled={ingredients.length === 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={addIngredient}
              variant="outlined"
            >
              Zutat hinzufügen
            </Button>
          </Stack>
        );

      case 3:
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Zubereitungsschritte</Typography>
            {steps.map((step, index) => (
              <Paper key={index} sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{ minWidth: 40, pt: 1 }}>
                    <Typography variant="h6" color="primary">
                      {step.stepNumber}
                    </Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <TextField
                      label="Anweisung"
                      fullWidth
                      multiline
                      minRows={2}
                      value={step.instruction}
                      onChange={(e) => updateStep(index, e.target.value)}
                      placeholder="Beschreibe diesen Schritt..."
                    />
                  </Box>
                  <IconButton
                    onClick={() => removeStep(index)}
                    disabled={steps.length === 1}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={addStep}
              variant="outlined"
            >
              Schritt hinzufügen
            </Button>
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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kalorien (kcal)"
                  type="number"
                  fullWidth
                  value={nutritionalValues.calories || ''}
                  inputProps={{ min: 0 }}
                  onChange={(e) => updateNutritionalValue('calories', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Eiweiß (g)"
                  type="number"
                  fullWidth
                  value={nutritionalValues.protein || ''}
                  inputProps={{ min: 0 }}
                  onChange={(e) => updateNutritionalValue('protein', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kohlenhydrate (g)"
                  type="number"
                  fullWidth
                  value={nutritionalValues.carbohydrates || ''}
                  inputProps={{ min: 0 }}
                  onChange={(e) => updateNutritionalValue('carbohydrates', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fett (g)"
                  type="number"
                  fullWidth
                  value={nutritionalValues.fat || ''}
                  inputProps={{ min: 0 }}
                  onChange={(e) => updateNutritionalValue('fat', e.target.value)}
                />
              </Grid>
            </Grid>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Typography variant="h4" align="center">Neues Rezept erstellen</Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <Stepper activeStep={activeStep} alternativeLabel>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Divider />

            <Box sx={{ minHeight: 400 }}>
              {getStepContent(activeStep)}
            </Box>

            <Divider />

            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Zurück
              </Button>

              {activeStep === STEPS.length - 1 ? (
                <Button
                  onClick={onSubmit}
                  variant="contained"
                  disabled={createRecipe.isPending}
                  size="large"
                >
                  {createRecipe.isPending ? 'Speichern...' : 'Rezept speichern'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  disabled={!validateStep(activeStep)}
                >
                  Weiter
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
