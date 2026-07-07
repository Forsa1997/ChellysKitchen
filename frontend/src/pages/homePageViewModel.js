/**
 * @typedef {{title:string; shortDescription:string; category:string}} FilterableRecipe
 */

/**
 * @param {string} category
 */
export function formatCategoryLabel(category) {
  return category === 'all' ? 'Alle' : category;
}

/**
 * @param {FilterableRecipe[]} recipes
 * @param {string} query
 * @param {string} category
 */
export function filterRecipes(recipes, query, category) {
  const normalizedQuery = query.trim().toLowerCase();

  return recipes.filter((recipe) => {
    const matchesQuery =
      recipe.title.toLowerCase().includes(normalizedQuery) ||
      recipe.shortDescription.toLowerCase().includes(normalizedQuery);
    const matchesCategory = category === 'all' || recipe.category === category;

    return matchesQuery && matchesCategory;
  });
}

/**
 * @template {{slug:string}} RecipeWithSlug
 * @param {readonly RecipeWithSlug[]} recipes
 * @param {() => number} random
 * @returns {RecipeWithSlug | null}
 */
export function selectRandomRecipe(recipes, random = Math.random) {
  if (recipes.length === 0) {
    return null;
  }

  const index = Math.floor(random() * recipes.length);
  return recipes[Math.min(index, recipes.length - 1)];
}
