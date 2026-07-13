import { expect, test } from 'vitest';
import { normalizeRecipeListParams } from './recipeListQueryParams';

test('normalizeRecipeListParams provides safe defaults', () => {
  const params = normalizeRecipeListParams(new URLSearchParams());
  expect(params.page).toBe(1);
  expect(params.pageSize).toBe(12);
  expect(params.sort).toBe('newest');
  expect(params.category).toBe('all');
  expect(params.q).toBe('');
  expect(params.difficulty).toBe('all');
  expect(params.maxTotalMinutes).toBeNull();
});

test('normalizeRecipeListParams clamps invalid values', () => {
  const params = normalizeRecipeListParams(new URLSearchParams('page=-1&pageSize=500&sort=x&maxTotalMinutes=-10'));
  expect(params.page).toBe(1);
  expect(params.pageSize).toBe(24);
  expect(params.sort).toBe('newest');
  expect(params.maxTotalMinutes).toBeNull();
});

test('normalizeRecipeListParams accepts difficulty and maxTotalMinutes', () => {
  const params = normalizeRecipeListParams(new URLSearchParams('difficulty=Mittel&maxTotalMinutes=30'));
  expect(params.difficulty).toBe('Mittel');
  expect(params.maxTotalMinutes).toBe(30);
});
