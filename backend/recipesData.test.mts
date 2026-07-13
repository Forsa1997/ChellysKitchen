import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from './data/recipes.mts';
import { queryRecipes } from './src/queryRecipes.mts';

test('recipe catalog includes a broader published starter library', () => {
  assert.equal(recipes.length >= 12, true);

  const slugs = new Set(recipes.map((recipe) => recipe.slug));
  assert.equal(slugs.has('zitronen-haehnchen-vom-blech'), true);
  assert.equal(slugs.has('linsen-kokos-suppe'), true);
  assert.equal(slugs.has('schoko-himbeer-brownies'), true);
});

test('expanded recipe catalog is visible through the public recipe query seam', () => {
  const result = queryRecipes(recipes, { pageSize: '24', sort: 'newest' });

  assert.equal(result.meta.total >= 12, true);
  assert.equal(result.data.some((recipe) => recipe.title === 'Zitronen-Haehnchen vom Blech'), true);
});
