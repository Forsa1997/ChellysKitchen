// Bring! shopping-list export: the Bring deeplink API fetches a public URL
// and parses schema.org/Recipe markup from it. This module builds that
// markup for a recipe so /api/recipes/:slug/bring can serve it.

import type { Ingredient, Recipe } from './types.mts';

/**
 * What the Bring! export actually needs from a recipe — the week-plan
 * shopping list passes a synthetic object with only these fields.
 */
export type BringRecipe = Pick<
  Recipe,
  'title' | 'servings' | 'preparationTime' | 'cookingTime' | 'img' | 'ingredients'
> & { shortDescription?: string };

export interface RecipeJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Recipe';
  name: string;
  recipeYield: string;
  recipeIngredient: string[];
  description?: string;
  totalTime?: string;
  image?: string;
}

export interface BringExportOptions {
  /** Requested portion count; amounts are scaled from the recipe's base servings. */
  servings?: string | number;
}

export function formatIngredientLine(ingredient: Ingredient, scale: number): string {
  const amount = Number(ingredient.amount) * scale;
  const parts: string[] = [];
  if (Number.isFinite(amount) && amount > 0) {
    // Round to 2 decimals but drop trailing zeros ("0.5", not "0.50").
    parts.push(String(Number(amount.toFixed(2))));
  }
  if (ingredient.unit) {
    parts.push(String(ingredient.unit).trim());
  }
  parts.push(String(ingredient.name).trim());
  return parts.filter(Boolean).join(' ');
}

function resolveServings(recipe: BringRecipe, servings: string | number | undefined): number {
  const requested = Number(servings);
  if (Number.isFinite(requested) && requested >= 1) {
    return Math.round(requested);
  }
  return Math.max(1, Number(recipe.servings) || 1);
}

export function buildRecipeJsonLd(recipe: BringRecipe, { servings }: BringExportOptions = {}): RecipeJsonLd {
  const targetServings = resolveServings(recipe, servings);
  const scale = targetServings / Math.max(Number(recipe.servings) || 1, 1);

  const jsonLd: RecipeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    recipeYield: String(targetServings),
    recipeIngredient: (recipe.ingredients ?? []).map((ingredient) =>
      formatIngredientLine(ingredient, scale),
    ),
  };
  if (recipe.shortDescription) {
    jsonLd.description = recipe.shortDescription;
  }
  const totalMinutes = (Number(recipe.preparationTime) || 0) + (Number(recipe.cookingTime) || 0);
  if (totalMinutes > 0) {
    jsonLd.totalTime = `PT${totalMinutes}M`;
  }
  // Only absolute URLs are useful to Bring's crawler; frontend-relative
  // asset paths would point nowhere.
  if (typeof recipe.img === 'string' && /^https?:\/\//.test(recipe.img)) {
    jsonLd.image = recipe.img;
  }
  return jsonLd;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderBringHtml(recipe: BringRecipe, { servings }: BringExportOptions = {}): string {
  const jsonLd = buildRecipeJsonLd(recipe, { servings });
  // Escaping "<" keeps user-supplied strings (titles, ingredient names) from
  // closing the script tag and injecting markup into the page.
  const json = JSON.stringify(jsonLd).replaceAll('<', '\\u003c');

  return [
    '<!doctype html>',
    '<html lang="de">',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${escapeHtml(recipe.title)}</title>`,
    `<script type="application/ld+json">${json}</script>`,
    '</head>',
    '<body>',
    `<h1>${escapeHtml(recipe.title)}</h1>`,
    `<p>Zutaten für ${escapeHtml(jsonLd.recipeYield)} Portionen:</p>`,
    '<ul>',
    ...jsonLd.recipeIngredient.map((line) => `<li>${escapeHtml(line)}</li>`),
    '</ul>',
    '</body>',
    '</html>',
  ].join('\n');
}
