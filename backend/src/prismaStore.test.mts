import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rowsToState, stateToRows } from './prismaStore.mts';
import type { Recipe, ServerState, User } from './types.mts';

function sampleState(): ServerState {
  const users = new Map<string, User>([
    ['chef@test.local', {
      id: 'user_1',
      name: 'Christoph',
      email: 'chef@test.local',
      role: 'ADMIN',
      passwordHash: 'hash',
      salt: 'salz',
      algo: 'scrypt',
      createdAt: '2026-07-01T10:00:00.000Z',
      updatedAt: '2026-07-02T10:00:00.000Z',
    }],
  ]);
  const sessions = new Map([['token-a', { userId: 'user_1', expiresAt: 1780000000000 }]]);
  const refreshSessions = new Map([['token-r', { userId: 'user_1', expiresAt: 1790000000000 }]]);
  // Deliberately a partial recipe document, as old store rows can be.
  const recipeStore = [{
    id: 'r1',
    slug: 'pasta',
    title: 'Pasta',
    status: 'PUBLISHED',
    ingredients: [{ name: 'Nudeln', amount: 500, unit: 'g' }],
    steps: [{ stepNumber: 1, instruction: 'Kochen.' }],
    notes: 'lecker',
  } as Recipe];
  const ratingsStore = new Map([
    ['r1', new Map([['user_1', {
      id: 'rating_1', userId: 'user_1', recipeId: 'r1', stars: 5,
      createdAt: '2026-07-03T10:00:00.000Z', updatedAt: '2026-07-03T10:00:00.000Z',
    }]])],
  ]);
  const categoriesStore = [{ id: 'cat_1', name: 'Cooking', slug: 'cooking', icon: '🍳' }];
  const favoritesStore = new Map([['user_1', new Set(['r1'])]]);
  const weekPlanStore = {
    monday: [{ recipeId: 'r1', servings: 4 }],
    tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [],
    sunday: [{ recipeId: 'r1', servings: null }],
  };

  return { users, sessions, refreshSessions, recipeStore, ratingsStore, categoriesStore, favoritesStore, weekPlanStore };
}

test('stateToRows produces flat table rows', () => {
  const rows = stateToRows(sampleState());

  assert.equal(rows.users.length, 1);
  assert.equal(rows.users[0].email, 'chef@test.local');
  assert.equal(rows.users[0].passwordHash, 'hash');

  assert.equal(rows.recipes.length, 1);
  assert.equal(rows.recipes[0].id, 'r1');
  assert.equal(rows.recipes[0].title, 'Pasta');
  assert.equal(rows.recipes[0].data.notes, 'lecker');

  assert.deepEqual(rows.ratings[0], {
    recipeId: 'r1',
    userId: 'user_1',
    stars: 5,
    data: sampleState().ratingsStore.get('r1')!.get('user_1'),
  });

  assert.deepEqual(rows.favorites, [{ userId: 'user_1', recipeId: 'r1' }]);

  const kinds = rows.sessions.map((session) => session.kind).sort();
  assert.deepEqual(kinds, ['ACCESS', 'REFRESH']);
  assert.equal(typeof rows.sessions[0].expiresAt, 'bigint');

  assert.deepEqual(rows.weekPlanEntries, [
    { day: 'monday', recipeId: 'r1', servings: 4 },
    { day: 'sunday', recipeId: 'r1', servings: null },
  ]);
});

test('state survives a full rows roundtrip', () => {
  const original = sampleState();
  const restored = rowsToState(stateToRows(original));

  assert.deepEqual(restored.users.get('chef@test.local'), original.users.get('chef@test.local'));
  assert.deepEqual(restored.sessions.get('token-a'), original.sessions.get('token-a'));
  assert.deepEqual(restored.refreshSessions.get('token-r'), original.refreshSessions.get('token-r'));
  assert.deepEqual(restored.recipeStore, original.recipeStore);
  assert.deepEqual(
    restored.ratingsStore.get('r1')!.get('user_1'),
    original.ratingsStore.get('r1')!.get('user_1'),
  );
  assert.deepEqual(restored.categoriesStore, original.categoriesStore);
  assert.deepEqual([...restored.favoritesStore.get('user_1')!], ['r1']);
  assert.deepEqual(restored.weekPlanStore.monday, [{ recipeId: 'r1', servings: 4 }]);
  assert.deepEqual(restored.weekPlanStore.sunday, [{ recipeId: 'r1', servings: null }]);
  assert.deepEqual(restored.weekPlanStore.friday, []);
});

test('rowsToState copes with missing optional user fields', () => {
  const rows = stateToRows(sampleState());
  rows.users[0] = { ...rows.users[0], salt: null, algo: null };

  const restored = rowsToState(rows);
  const user = restored.users.get('chef@test.local');
  assert.equal(user!.salt, undefined);
  assert.equal(user!.algo, undefined);
});

test('session expiry returns as a plain number', () => {
  const restored = rowsToState(stateToRows(sampleState()));
  assert.equal(restored.sessions.get('token-a')!.expiresAt, 1780000000000);
  assert.equal(typeof restored.sessions.get('token-a')!.expiresAt, 'number');
});
