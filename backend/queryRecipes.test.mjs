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

test('queryRecipes filters by difficulty', () => {
  const withDifficulty = recipes.map((recipe, index) => ({
    ...recipe,
    difficulty: index === 1 ? 'Schwer' : 'Einfach',
    preparationTime: 10,
    cookingTime: 10,
  }));

  const result = queryRecipes(withDifficulty, { difficulty: 'Schwer' });
  assert.equal(result.meta.total, 1);
  assert.equal(result.data[0].id, '2');
  assert.equal(result.meta.difficulty, 'Schwer');
});

test('queryRecipes filters by max total minutes', () => {
  const withTimes = recipes.map((recipe, index) => ({
    ...recipe,
    difficulty: 'Einfach',
    preparationTime: index === 2 ? 20 : 10,
    cookingTime: index === 2 ? 20 : 10,
  }));

  const result = queryRecipes(withTimes, { maxTotalMinutes: '25' });
  assert.equal(result.meta.total, 2);
  assert.equal(result.data.every((entry) => entry.preparationTime + entry.cookingTime <= 25), true);
  assert.equal(result.meta.maxTotalMinutes, 25);
});
