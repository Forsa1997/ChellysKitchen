import { filterRecipes } from './queryRecipes.mjs';

/**
 * Pick one random recipe from ALL recipes matching the given filters
 * (q, category, difficulty, maxTotalMinutes, status) — unlike the paginated
 * list endpoint, the pool is never capped at a page size.
 *
 * `excludeSlug` removes the given recipe (e.g. the one currently shown) from
 * the pool as long as at least one other candidate remains, so "roll again"
 * never returns the same recipe unless it is the only match.
 */
export function pickRandomRecipe(recipes, queryParams = {}, { random = Math.random, excludeSlug } = {}) {
  let candidates = filterRecipes(recipes, queryParams);

  if (excludeSlug) {
    const withoutExcluded = candidates.filter((recipe) => recipe.slug !== excludeSlug);
    if (withoutExcluded.length > 0) {
      candidates = withoutExcluded;
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
  return candidates[index];
}
