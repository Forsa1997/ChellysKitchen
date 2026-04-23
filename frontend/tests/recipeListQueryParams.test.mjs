import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecipeListParams } from '../src/pages/recipeListQueryParams.js';

test('normalizeRecipeListParams provides safe defaults', () => {
  const params = normalizeRecipeListParams(new URLSearchParams());
  assert.equal(params.page, 1);
  assert.equal(params.pageSize, 6);
  assert.equal(params.sort, 'newest');
  assert.equal(params.category, 'all');
  assert.equal(params.q, '');
});

test('normalizeRecipeListParams clamps invalid values', () => {
  const params = normalizeRecipeListParams(new URLSearchParams('page=-1&pageSize=500&sort=x'));
  assert.equal(params.page, 1);
  assert.equal(params.pageSize, 24);
  assert.equal(params.sort, 'newest');
});
