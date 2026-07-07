import { Alert, Box, Button, CircularProgress, Container, Stack } from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { useRecipe, useUpdateRecipe } from '../hooks/useRecipes';
import { useAuth } from '../auth/AuthContext';
import { RecipeForm } from '../components/RecipeForm';
import type { ApiError, CreateRecipeRequest, Recipe } from '../api/client';

const EDIT_ROLES = ['EDITOR', 'ADMIN'];

export function EditRecipePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: recipe, isLoading, error } = useRecipe(slug || '');
  const updateRecipe = useUpdateRecipe();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !recipe) {
    const apiError = error as ApiError | null;
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Stack spacing={2}>
          <Alert severity="warning">{apiError?.message || 'Rezept nicht gefunden.'}</Alert>
          <Box><Button component={RouterLink} to="/" variant="outlined">Zurück zur Übersicht</Button></Box>
        </Stack>
      </Container>
    );
  }

  const isOwner = !!user && user.id === recipe.createdBy?.id;
  const canEdit = isOwner || (!!user && EDIT_ROLES.includes(user.role));

  if (!canEdit) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Stack spacing={2}>
          <Alert severity="error">Du hast keine Berechtigung, dieses Rezept zu bearbeiten.</Alert>
          <Box><Button component={RouterLink} to={`/recipes/${recipe.slug}`} variant="outlined">Zurück zum Rezept</Button></Box>
        </Stack>
      </Container>
    );
  }

  const handleSubmit = async (data: CreateRecipeRequest) => {
    const updated = (await updateRecipe.mutateAsync({ id: recipe.id, data })) as Recipe;
    navigate(`/recipes/${updated.slug}`);
  };

  return (
    <RecipeForm
      heading="Rezept bearbeiten"
      subheading="Aktualisiere die Informationen deines Rezepts."
      submitLabel="Änderungen speichern"
      submitting={updateRecipe.isPending}
      onSubmit={handleSubmit}
      initialValues={{
        title: recipe.title,
        shortDescription: recipe.shortDescription,
        description: recipe.description,
        category: recipe.category,
        tag: recipe.tag,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        preparationTime: recipe.preparationTime,
        cookingTime: recipe.cookingTime,
        img: recipe.img,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        nutritionalValues: recipe.nutritionalValues,
      }}
    />
  );
}
