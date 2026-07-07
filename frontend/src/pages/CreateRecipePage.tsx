import { useNavigate } from 'react-router';
import { useCreateRecipe } from '../hooks/useRecipes';
import { RecipeForm } from '../components/RecipeForm';
import type { CreateRecipeRequest, Recipe } from '../api/client';

export function CreateRecipePage() {
  const navigate = useNavigate();
  const createRecipe = useCreateRecipe();

  const handleSubmit = async (data: CreateRecipeRequest) => {
    const recipe = (await createRecipe.mutateAsync(data)) as Recipe;
    navigate(`/recipes/${recipe.slug}`);
  };

  return (
    <RecipeForm
      heading="Neues Rezept erstellen"
      subheading="Erfasse die wichtigsten Informationen Schritt für Schritt."
      submitLabel="Rezept speichern"
      onSubmit={handleSubmit}
      submitting={createRecipe.isPending}
    />
  );
}
