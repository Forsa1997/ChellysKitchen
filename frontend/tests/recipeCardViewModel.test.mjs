import test from 'node:test';
import assert from 'node:assert/strict';
import { totalRecipeMinutes } from '../src/recipes/recipeCardViewModel.js';

test('totalRecipeMinutes sums preparation and cooking times', () => {
  assert.equal(totalRecipeMinutes(20, 40), 60);
});
