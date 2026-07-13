import { expect, test } from 'vitest';
import { totalRecipeMinutes } from './recipeCardViewModel';

test('totalRecipeMinutes sums preparation and cooking times', () => {
  expect(totalRecipeMinutes(20, 40)).toBe(60);
});
