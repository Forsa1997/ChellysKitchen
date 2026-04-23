import test from 'node:test';
import assert from 'node:assert/strict';
import { queryRecipes } from './src/queryRecipes.mjs';

const recipes = [
  { id: '1', title: 'Pasta', shortDescription: 'Mit Lachs', category: 'Cooking', creationDate: '2026-04-20T00:00:00.000Z' },
  { id: '2', title: 'Kuchen', shortDescription: 'Karotte', category: 'Baking', creationDate: '2026-04-18T00:00:00.000Z' },
  { id: '3', title: 'Pasta al Pomodoro', shortDescription: 'Tomate', category: 'Cooking', creationDate: '2026-04-22T00:00:00.000Z' },
];

test('queryRecipes filters by text and category and paginates', () => {
  const result = queryRecipes(recipes, {
    q: 'pasta',
    category: 'Cooking',
    page: '1',
    pageSize: '1',
    sort: 'newest',
  });

  assert.equal(result.meta.total, 2);
  assert.equal(result.meta.totalPages, 2);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].id, '3');
});

test('queryRecipes sorts by title ascending', () => {
  const result = queryRecipes(recipes, { sort: 'title_asc' });
  assert.deepEqual(result.data.map((entry) => entry.title), ['Kuchen', 'Pasta', 'Pasta al Pomodoro']);
});
