import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from './data/recipes.mjs';
import { queryRecipes } from './src/queryRecipes.mjs';

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


test('starter recipe catalog uses recipe-specific realistic photo URLs instead of SVG illustrations', () => {
  for (const recipe of recipes) {
    assert.match(recipe.img, /^https:\/\/source\.unsplash\.com\/1200x800\//);
    assert.equal(recipe.img.endsWith('.svg'), false, `${recipe.title} should not use an SVG image`);
  }

  const imageKeywords = new Map(recipes.map((recipe) => [recipe.slug ?? recipe.id, recipe.img]));
  assert.match(imageKeywords.get('zitronen-haehnchen-vom-blech'), /chicken/);
  assert.match(imageKeywords.get('schoko-himbeer-brownies'), /brownies/);
  assert.match(imageKeywords.get('rauchige-bbq-burger'), /burger/);
});
