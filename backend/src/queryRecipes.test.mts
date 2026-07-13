import assert from 'node:assert/strict';
import { test } from 'node:test';
import { queryRecipes } from './queryRecipes.mts';

const recipes = [
  { id: 'a', title: 'Alpha', shortDescription: 'x', difficulty: 'EINFACH', status: 'PUBLISHED', createdAt: '2026-01-02' },
  { id: 'b', title: 'Beta', shortDescription: 'x', difficulty: 'MITTEL', status: 'DRAFT', createdAt: '2026-01-03' },
  { id: 'c', title: 'Gamma', shortDescription: 'x', difficulty: 'SCHWER', status: 'ARCHIVED', createdAt: '2026-01-01' },
];

test('defaults to PUBLISHED only', () => {
  const result = queryRecipes(recipes, {});
  assert.deepEqual(result.data.map((r) => r.id), ['a']);
  assert.equal(result.meta.total, 1);
});

test('status=all includes every status', () => {
  const result = queryRecipes(recipes, { status: 'all' });
  assert.equal(result.meta.total, 3);
});

test('status filter can target a specific status', () => {
  const result = queryRecipes(recipes, { status: 'DRAFT' });
  assert.deepEqual(result.data.map((r) => r.id), ['b']);
});

test('recipes without an explicit status count as PUBLISHED', () => {
  const legacy = [{ id: 'z', title: 'Zeta', shortDescription: 'x' }];
  const result = queryRecipes(legacy, {});
  assert.equal(result.meta.total, 1);
});

test('text search also matches ingredient names', () => {
  const withIngredients = [
    {
      id: 'lachs',
      title: 'Cremige Pasta',
      shortDescription: 'x',
      status: 'PUBLISHED',
      ingredients: [{ name: 'Lachs', amount: 400, unit: 'g' }],
      createdAt: '2026-01-01',
    },
    {
      id: 'kuchen',
      title: 'Karottenkuchen',
      shortDescription: 'x',
      status: 'PUBLISHED',
      ingredients: [{ name: 'Karotten', amount: 300, unit: 'g' }],
      createdAt: '2026-01-02',
    },
  ];

  const result = queryRecipes(withIngredients, { q: 'lachs' });
  assert.deepEqual(result.data.map((r) => r.id), ['lachs']);
});

test('favorites=true keeps only recipes flagged as favorite', () => {
  const flagged = [
    { id: 'a', title: 'Alpha', shortDescription: 'x', status: 'PUBLISHED', isFavorite: true, createdAt: '2026-01-01' },
    { id: 'b', title: 'Beta', shortDescription: 'x', status: 'PUBLISHED', isFavorite: false, createdAt: '2026-01-02' },
  ];

  const result = queryRecipes(flagged, { favorites: 'true' });
  assert.deepEqual(result.data.map((r) => r.id), ['a']);

  const all = queryRecipes(flagged, {});
  assert.equal(all.meta.total, 2);
});
