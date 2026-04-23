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
  assert.equal(params.difficulty, 'all');
  assert.equal(params.maxTotalMinutes, null);
});

test('normalizeRecipeListParams clamps invalid values', () => {
  const params = normalizeRecipeListParams(new URLSearchParams('page=-1&pageSize=500&sort=x&maxTotalMinutes=-10'));
  assert.equal(params.page, 1);
  assert.equal(params.pageSize, 24);
  assert.equal(params.sort, 'newest');
  assert.equal(params.maxTotalMinutes, null);
});

test('normalizeRecipeListParams accepts difficulty and maxTotalMinutes', () => {
  const params = normalizeRecipeListParams(new URLSearchParams('difficulty=Mittel&maxTotalMinutes=30'));
  assert.equal(params.difficulty, 'Mittel');
  assert.equal(params.maxTotalMinutes, 30);
});
