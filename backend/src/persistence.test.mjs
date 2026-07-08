import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createDebouncedPersister,
  createStore,
  deserializeState,
  serializeState,
} from './persistence.mjs';

function sampleState() {
  const users = new Map([
    ['a@x.de', { id: 'u1', email: 'a@x.de', name: 'A', role: 'ADMIN' }],
    ['b@x.de', { id: 'u2', email: 'b@x.de', name: 'B', role: 'MEMBER' }],
  ]);
  const sessions = new Map([['tok1', 'u1']]);
  const refreshSessions = new Map([['ref1', 'u1']]);
  const recipeStore = [{ id: 'r1', slug: 'r1', title: 'R1' }];
  const ratingsStore = new Map([
    ['r1', new Map([['u2', { id: 'rt1', userId: 'u2', recipeId: 'r1', stars: 4 }]])],
  ]);
  const categoriesStore = [{ id: 'cat_1', name: 'Cooking', slug: 'cooking' }];
  const favoritesStore = new Map([['u2', new Set(['r1'])]]);
  return { users, sessions, refreshSessions, recipeStore, ratingsStore, categoriesStore, favoritesStore };
}

test('serialize/deserialize round-trips all collections', () => {
  const state = sampleState();
  const restored = deserializeState(JSON.parse(JSON.stringify(serializeState(state))));

  assert.equal(restored.users.size, 2);
  assert.equal(restored.users.get('a@x.de').role, 'ADMIN');
  assert.equal(restored.sessions.get('tok1'), 'u1');
  assert.equal(restored.refreshSessions.get('ref1'), 'u1');
  assert.equal(restored.recipeStore.length, 1);
  assert.equal(restored.ratingsStore.get('r1').get('u2').stars, 4);
  assert.equal(restored.categoriesStore[0].slug, 'cooking');
  assert.ok(restored.favoritesStore.get('u2').has('r1'));
});

test('deserialize tolerates missing fields', () => {
  const restored = deserializeState({});
  assert.equal(restored.users.size, 0);
  assert.equal(restored.recipeStore.length, 0);
  assert.equal(restored.ratingsStore.size, 0);
  assert.equal(restored.favoritesStore.size, 0);
});

test('serialize tolerates state without a favorites store (older callers)', () => {
  const state = sampleState();
  delete state.favoritesStore;
  const restored = deserializeState(JSON.parse(JSON.stringify(serializeState(state))));
  assert.equal(restored.favoritesStore.size, 0);
});

test('store persists to disk and reloads', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ck-store-'));
  try {
    const store = createStore(join(dir, 'nested', 'store.json'));
    assert.equal(store.load(), null);
    store.save(sampleState());
    const loaded = store.load();
    assert.equal(loaded.users.get('b@x.de').name, 'B');
    assert.equal(loaded.ratingsStore.get('r1').get('u2').stars, 4);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('debounced persister collapses writes and flush forces one', () => {
  let writes = 0;
  const fakeStore = { save: () => { writes += 1; } };
  const persister = createDebouncedPersister(fakeStore, () => ({}), 1000);

  persister.schedule();
  persister.schedule();
  persister.schedule();
  assert.equal(writes, 0, 'no synchronous write while debouncing');

  persister.flush();
  assert.equal(writes, 1, 'flush writes exactly once for pending changes');

  persister.flush();
  assert.equal(writes, 1, 'flush is a no-op when nothing pending');
});
