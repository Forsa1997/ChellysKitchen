import type { Recipe } from '../types/domain';

export function getRecipeCategories(recipes: Recipe[]): string[] {
  const result = new Set<string>();
  recipes.forEach((recipe) => result.add(recipe.category));
  return ['all', ...Array.from(result)];
}

export function filterRecipes(recipes: Recipe[], query: string, category: string): Recipe[] {
  return recipes.filter((recipe) => {
    const normalizedQuery = query.toLowerCase();
    const matchesQuery =
      recipe.title.toLowerCase().includes(normalizedQuery) ||
      recipe.shortDescription.toLowerCase().includes(normalizedQuery);
    const matchesCategory = category === 'all' || recipe.category === category;
    return matchesQuery && matchesCategory;
  });
}

export function getTotalDurationText(recipe: Recipe): string {
  return `${recipe.preparationTime + recipe.cookingTime} Minuten • ${recipe.servings} Portionen`;
}

export function getIngredientText(amount: number, unit: string, name: string): string {
  return `${amount} ${unit} ${name}`;
}

export function getStepText(stepNumber: number, instruction: string): string {
  return `${stepNumber}. ${instruction}`;
}
