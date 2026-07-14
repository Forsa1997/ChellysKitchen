import { recipes } from '../data/recipes.mts';

export const DEFAULT_RECIPE_IMAGES = Object.freeze([
  ...new Set(
    recipes
      .map((recipe) => recipe.img)
      .filter((image): image is string => (
        typeof image === 'string' && /^\/recipe-images\/[a-z0-9-]+\.svg$/.test(image)
      )),
  ),
]);

export function pickDefaultRecipeImage({ random = Math.random }: { random?: () => number } = {}): string {
  const index = Math.min(
    Math.floor(random() * DEFAULT_RECIPE_IMAGES.length),
    DEFAULT_RECIPE_IMAGES.length - 1,
  );

  const image = DEFAULT_RECIPE_IMAGES[index];
  if (!image) {
    throw new Error('Keine Standard-Rezeptbilder konfiguriert.');
  }

  return image;
}
