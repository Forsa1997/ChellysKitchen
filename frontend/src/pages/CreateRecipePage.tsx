import { useNavigate } from 'react-router';
import { useCreateRecipe } from '../hooks/useRecipes';
import { RecipeForm } from '../components/RecipeForm';
import type { CreateRecipeRequest, Recipe } from '../api/client';

// One shared draft slot: there is only ever one "new recipe" in progress.
const DRAFT_KEY = 'chellys-kitchen:recipe-draft:new';

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
      subheading="Titel, mindestens eine Zutat und ein Zubereitungsschritt genügen — alles andere ist optional."
      submitLabel="Rezept speichern"
      importEnabled
      draftKey={DRAFT_KEY}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/')}
      submitting={createRecipe.isPending}
    />
  );
}
