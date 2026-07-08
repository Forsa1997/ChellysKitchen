import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createExportPayload, parseImportPayload } from './backup.mjs';

function sampleState() {
  const users = new Map([
    ['chef@test.local', {
      id: 'user_1', name: 'Chef', email: 'chef@test.local', role: 'ADMIN',
      passwordHash: 'hash', salt: 'salt', createdAt: 'x', updatedAt: 'x',
    }],
  ]);
  const ratingsStore = new Map([
    ['r1', new Map([['user_1', { id: 'rating_1', userId: 'user_1', recipeId: 'r1', stars: 5 }]])],
  ]);
  return {
    users,
    sessions: new Map([['secret-token', 'user_1']]),
    refreshSessions: new Map([['secret-refresh', 'user_1']]),
    recipeStore: [{ id: 'r1', slug: 'pasta', title: 'Pasta' }],
    ratingsStore,
    categoriesStore: [{ id: 'cat_1', name: 'Cooking', slug: 'cooking' }],
    favoritesStore: new Map([['user_1', new Set(['r1'])]]),
  };
}

test('export -> import round-trips users, recipes, ratings and categories', () => {
  const payload = createExportPayload(sampleState(), [
    { fileName: 'abc123.png', data: Buffer.from('fake-image').toString('base64') },
  ]);

  // Simulate the JSON round-trip of download + upload.
  const parsed = parseImportPayload(JSON.parse(JSON.stringify(payload)));

  assert.equal(parsed.users.get('chef@test.local').id, 'user_1');
  assert.equal(parsed.recipeStore.length, 1);
  assert.equal(parsed.recipeStore[0].slug, 'pasta');
  assert.equal(parsed.ratingsStore.get('r1').get('user_1').stars, 5);
  assert.equal(parsed.categoriesStore[0].slug, 'cooking');
  assert.ok(parsed.favoritesStore.get('user_1').has('r1'));
  assert.equal(parsed.uploads.length, 1);
  assert.equal(parsed.uploads[0].fileName, 'abc123.png');
  assert.equal(parsed.uploads[0].buffer.toString(), 'fake-image');
});

test('export payload never contains session tokens', () => {
  const json = JSON.stringify(createExportPayload(sampleState()));
  assert.ok(!json.includes('secret-token'));
  assert.ok(!json.includes('secret-refresh'));
});

test('import rejects payloads that are not a backup file', () => {
  assert.throws(() => parseImportPayload(null));
  assert.throws(() => parseImportPayload({ foo: 'bar' }));
  assert.throws(() => parseImportPayload({ type: 'chellys-kitchen-backup', version: 999, users: [], recipeStore: [] }));
  assert.throws(() => parseImportPayload({ type: 'chellys-kitchen-backup', version: 1, users: 'nope', recipeStore: [] }));
});

test('import drops uploads with unsafe file names or invalid data', () => {
  const payload = createExportPayload(sampleState(), []);
  payload.uploads = [
    { fileName: '../../etc/passwd', data: Buffer.from('x').toString('base64') },
    { fileName: 'ok.png', data: Buffer.from('img').toString('base64') },
    { fileName: 'empty.png', data: '' },
  ];

  const parsed = parseImportPayload(JSON.parse(JSON.stringify(payload)));
  assert.deepEqual(parsed.uploads.map((u) => u.fileName), ['ok.png']);
});
