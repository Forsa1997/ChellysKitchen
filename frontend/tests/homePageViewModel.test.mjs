import test from 'node:test';
import assert from 'node:assert/strict';
import { filterRecipes, formatCategoryLabel } from '../src/pages/homePageViewModel.js';

const recipes = [
  { title: 'Cremige Pasta', shortDescription: 'Mit Spinat und Lachs', category: 'Cooking' },
  { title: 'Saftige Karottentorte', shortDescription: 'Klassisch mit Frischkäse', category: 'Baking' },
];

test('formatCategoryLabel uses a friendly label for all', () => {
  assert.equal(formatCategoryLabel('all'), 'Alle');
  assert.equal(formatCategoryLabel('Baking'), 'Baking');
});

test('filterRecipes filters by category and query case-insensitive', () => {
  const byCategory = filterRecipes(recipes, '', 'Baking');
  assert.equal(byCategory.length, 1);
  assert.equal(byCategory[0].title, 'Saftige Karottentorte');

  const byQuery = filterRecipes(recipes, 'pasta', 'all');
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].title, 'Cremige Pasta');
});
