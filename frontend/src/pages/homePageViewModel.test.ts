import { expect, test } from 'vitest';
import { formatCategoryLabel } from './homePageViewModel';

test('formatCategoryLabel uses a friendly label for all', () => {
  expect(formatCategoryLabel('all')).toBe('Alle');
  expect(formatCategoryLabel('Baking')).toBe('Baking');
});
