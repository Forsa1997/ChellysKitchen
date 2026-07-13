import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickRandomRecipe } from './randomRecipe.mts';

function recipe(overrides = {}) {
  return {
    id: 'r1',
    slug: 'pasta',
    title: 'Pasta',
    shortDescription: 'Schnell und lecker',
    category: 'Cooking',
    difficulty: 'EINFACH',
    status: 'PUBLISHED',
    preparationTime: 10,
    cookingTime: 20,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const sample = [
  recipe({ id: 'r1', slug: 'pasta', title: 'Pasta' }),
  recipe({ id: 'r2', slug: 'suppe', title: 'Suppe', category: 'Soups', difficulty: 'MITTEL' }),
  recipe({ id: 'r3', slug: 'kuchen', title: 'Kuchen', category: 'Baking', preparationTime: 30, cookingTime: 45 }),
  recipe({ id: 'r4', slug: 'entwurf', title: 'Entwurf', status: 'DRAFT' }),
];

test('picks a recipe from the full candidate pool, not just one page', () => {
  const many = Array.from({ length: 40 }, (_, i) =>
    recipe({ id: `r${i}`, slug: `rezept-${i}`, title: `Rezept ${i}` }));

  // random() close to 1 must be able to reach entries beyond the first
  // page size (6/12/24) of the list endpoint.
  const picked = pickRandomRecipe(many, {}, { random: () => 0.999 });
  assert.equal(picked.slug, 'rezept-39');
});

test('only picks recipes matching the status filter (default PUBLISHED)', () => {
  for (let i = 0; i < 20; i += 1) {
    const picked = pickRandomRecipe(sample, { status: 'PUBLISHED' }, { random: Math.random });
    assert.notEqual(picked.slug, 'entwurf');
  }
});

test('respects category, difficulty and maxTotalMinutes filters', () => {
  const byCategory = pickRandomRecipe(sample, { status: 'PUBLISHED', category: 'Soups' }, { random: () => 0 });
  assert.equal(byCategory.slug, 'suppe');

  const byDifficulty = pickRandomRecipe(sample, { status: 'PUBLISHED', difficulty: 'Mittel' }, { random: () => 0 });
  assert.equal(byDifficulty.slug, 'suppe');

  const byTime = pickRandomRecipe(
    [recipe({ id: 'a', slug: 'schnell', preparationTime: 5, cookingTime: 5 }), recipe({ id: 'b', slug: 'langsam', preparationTime: 60, cookingTime: 60 })],
    { status: 'PUBLISHED', maxTotalMinutes: '15' },
    { random: () => 0.9 },
  );
  assert.equal(byTime.slug, 'schnell');
});

test('respects the q text filter', () => {
  const picked = pickRandomRecipe(sample, { status: 'PUBLISHED', q: 'kuchen' }, { random: () => 0.5 });
  assert.equal(picked.slug, 'kuchen');
});

test('excludes the given slug when other candidates exist', () => {
  const two = [recipe({ id: 'r1', slug: 'pasta' }), recipe({ id: 'r2', slug: 'suppe' })];
  for (let i = 0; i < 20; i += 1) {
    const picked = pickRandomRecipe(two, { status: 'PUBLISHED' }, { excludeSlug: 'pasta' });
    assert.equal(picked.slug, 'suppe');
  }
});

test('falls back to the excluded slug when it is the only candidate', () => {
  const only = [recipe({ id: 'r1', slug: 'pasta' })];
  const picked = pickRandomRecipe(only, { status: 'PUBLISHED' }, { excludeSlug: 'pasta' });
  assert.equal(picked.slug, 'pasta');
});

test('returns null when nothing matches', () => {
  assert.equal(pickRandomRecipe(sample, { status: 'PUBLISHED', q: 'gibt-es-nicht' }), null);
  assert.equal(pickRandomRecipe([], {}), null);
});
