import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4100 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = 'admin@test.local';
const ADMIN_PASSWORD = 'admintest';

let child;
let dataDir;

async function api(path, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json, res };
}

// Public registration no longer exists — the admin provisions every account.
async function createMember(name) {
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.equal(adminLogin.status, 200);

  const email = `${name.toLowerCase()}_${Date.now()}@test.local`;
  const created = await api('/api/admin/users', {
    method: 'POST',
    token: adminLogin.body.accessToken,
    body: { name, email, password: 'secret123' },
  });
  assert.equal(created.status, 201);

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'secret123' },
  });
  assert.equal(login.status, 200);
  return { token: login.body.accessToken, user: created.body, email };
}

async function waitForReady(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('Server did not become ready in time');
}

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'ck-smoke-'));
  child = spawn('node', ['server.mjs'], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir, ADMIN_EMAIL, ADMIN_PASSWORD },
    stdio: 'ignore',
  });
  await waitForReady();
});

after(() => {
  if (child) child.kill('SIGTERM');
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('admin-created user can log in (me returns the user)', async () => {
  const { token, email } = await createMember('Tester');

  const me = await api('/api/auth/me', { token });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, email);
});

test('recipe create -> update -> publish flow and admin role update', async () => {
  // Member creates a recipe
  const member = await createMember('Cook');
  const token = member.token;

  const created = await api('/api/recipes', {
    method: 'POST',
    token,
    body: {
      title: 'Smoke Test Rezept',
      shortDescription: 'lecker',
      category: 'Cooking',
      difficulty: 'EINFACH',
      servings: 2,
      preparationTime: 5,
      cookingTime: 10,
      ingredients: [{ name: 'Salz', amount: 1, unit: 'g' }],
      steps: [{ stepNumber: 1, instruction: 'kochen' }],
    },
  });
  assert.equal(created.status, 201);
  const recipeId = created.body.id;

  // Owner updates it
  const updated = await api(`/api/recipes/${recipeId}`, {
    method: 'PATCH',
    token,
    body: { title: 'Smoke Test Rezept (bearbeitet)' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.title, 'Smoke Test Rezept (bearbeitet)');

  // Admin logs in and lists users
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.body.accessToken;

  const usersList = await api('/api/admin/users', { token: adminToken });
  assert.equal(usersList.status, 200);
  assert.ok(Array.isArray(usersList.body.data));
  assert.equal(typeof usersList.body.total, 'number');

  // Promote the member to EDITOR
  const memberId = member.user.id;
  const roleUpdate = await api(`/api/admin/users/${memberId}/role`, {
    method: 'PATCH',
    token: adminToken,
    body: { role: 'EDITOR' },
  });
  assert.equal(roleUpdate.status, 200);
  assert.equal(roleUpdate.body.role, 'EDITOR');

  // Non-admin cannot list users
  const forbidden = await api('/api/admin/users', { token });
  assert.equal(forbidden.status, 403);

  // Admin archives the recipe -> disappears from public list
  const archived = await api(`/api/recipes/${recipeId}/archive`, { method: 'PATCH', token: adminToken });
  assert.equal(archived.status, 200);
  assert.equal(archived.body.status, 'ARCHIVED');

  const publicList = await api('/api/recipes?pageSize=24');
  assert.equal(publicList.status, 200);
  assert.ok(!publicList.body.data.some((r) => r.id === recipeId), 'archived recipe hidden from public list');
});

test('image upload stores a file that is served back', async () => {
  const { token } = await createMember('Up');

  const pngDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  const upload = await api('/api/uploads', {
    method: 'POST',
    token,
    body: { filename: 'pic.png', data: pngDataUrl },
  });
  assert.equal(upload.status, 201);
  assert.match(upload.body.url, /\/uploads\/[a-f0-9]+\.png$/);

  const path = new URL(upload.body.url).pathname;
  const fetched = await fetch(`${BASE}${path}`);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.headers.get('content-type'), 'image/png');
});

test('favorites can be set, filtered and removed', async () => {
  const { token } = await createMember('Fan');

  const list = await api('/api/recipes?pageSize=2');
  const target = list.body.data[0];

  // Mark as favorite
  const marked = await api(`/api/recipes/${target.slug}/favorite`, { method: 'PUT', token });
  assert.equal(marked.status, 200);
  assert.equal(marked.body.isFavorite, true);

  // The favorites filter returns exactly the marked recipe.
  const favorites = await api('/api/recipes?favorites=true', { token });
  assert.equal(favorites.status, 200);
  assert.deepEqual(favorites.body.data.map((r) => r.id), [target.id]);

  // The random endpoint honors the favorites pool.
  const random = await api('/api/recipes/random?favorites=true', { token });
  assert.equal(random.status, 200);
  assert.equal(random.body.id, target.id);

  // Unmark again
  const unmarked = await api(`/api/recipes/${target.slug}/favorite`, { method: 'DELETE', token });
  assert.equal(unmarked.status, 200);
  assert.equal(unmarked.body.isFavorite, false);

  const empty = await api('/api/recipes?favorites=true', { token });
  assert.equal(empty.body.data.length, 0);

  // Unauthenticated favorite calls are rejected.
  const anonymous = await api(`/api/recipes/${target.slug}/favorite`, { method: 'PUT' });
  assert.equal(anonymous.status, 401);
});

test('any member can update the shared notes of a recipe', async () => {
  const { token } = await createMember('Notiz');

  const list = await api('/api/recipes?pageSize=1');
  const target = list.body.data[0];

  const updated = await api(`/api/recipes/${target.slug}/notes`, {
    method: 'PATCH',
    token,
    body: { notes: 'Nächstes Mal weniger Salz.' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.notes, 'Nächstes Mal weniger Salz.');

  const detail = await api(`/api/recipes/${target.slug}`);
  assert.equal(detail.body.notes, 'Nächstes Mal weniger Salz.');

  const anonymous = await api(`/api/recipes/${target.slug}/notes`, {
    method: 'PATCH',
    body: { notes: 'x' },
  });
  assert.equal(anonymous.status, 401);
});

test('bring export serves schema.org recipe markup with scaled ingredients', async () => {
  const list = await api('/api/recipes?pageSize=1');
  const target = list.body.data[0];
  const doubled = target.servings * 2;

  const res = await fetch(`${BASE}/api/recipes/${target.slug}/bring?servings=${doubled}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);

  const html = await res.text();
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  assert.ok(jsonLdMatch, 'page embeds JSON-LD');
  const jsonLd = JSON.parse(jsonLdMatch[1]);
  assert.equal(jsonLd['@type'], 'Recipe');
  assert.equal(jsonLd.name, target.title);
  assert.equal(jsonLd.recipeYield, String(doubled));
  assert.ok(jsonLd.recipeIngredient.length > 0, 'ingredients exported');

  const missing = await fetch(`${BASE}/api/recipes/gibt-es-nicht/bring`);
  assert.equal(missing.status, 404);
});

test('random recipe endpoint picks published recipes and respects filters', async () => {
  const random = await api('/api/recipes/random');
  assert.equal(random.status, 200);
  assert.equal(random.body.status, 'PUBLISHED');
  assert.ok(random.body.slug, 'random recipe has a slug');

  // Category filter narrows the pool.
  const baking = await api('/api/recipes/random?category=Baking');
  assert.equal(baking.status, 200);
  assert.equal(baking.body.category, 'Baking');

  // No match -> 404 instead of an arbitrary recipe.
  const none = await api(`/api/recipes/random?q=gibt-es-sicher-nicht-${Date.now()}`);
  assert.equal(none.status, 404);

  // exclude keeps "roll again" from returning the same recipe.
  const excluded = await api(`/api/recipes/random?category=Baking&exclude=${baking.body.slug}`);
  if (excluded.status === 200) {
    assert.notEqual(excluded.body.slug, baking.body.slug);
  }
});

test('admin can export a backup and restore it after data changes', async () => {
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const adminToken = adminLogin.body.accessToken;

  // Export the current state.
  const exported = await api('/api/admin/export', { token: adminToken });
  assert.equal(exported.status, 200);
  assert.equal(exported.body.type, 'chellys-kitchen-backup');
  assert.ok(Array.isArray(exported.body.recipeStore));
  const recipeCountAtExport = exported.body.recipeStore.length;

  // Mutate state after the export: add a recipe the backup does not contain.
  const created = await api('/api/recipes', {
    method: 'POST',
    token: adminToken,
    body: {
      title: `Nach dem Backup ${Date.now()}`,
      shortDescription: 'sollte nach dem Import verschwinden',
      category: 'Cooking',
    },
  });
  assert.equal(created.status, 201);

  // Restore the backup -> the extra recipe is gone again.
  const imported = await api('/api/admin/import', {
    method: 'POST',
    token: adminToken,
    body: exported.body,
  });
  assert.equal(imported.status, 200);
  assert.equal(imported.body.recipes, recipeCountAtExport);

  // The importing admin must still be authenticated afterwards.
  const me = await api('/api/auth/me', { token: adminToken });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.role, 'ADMIN');

  const detail = await api(`/api/recipes/${created.body.slug}`);
  assert.equal(detail.status, 404);
});

test('export and import are admin-only', async () => {
  const { token } = await createMember('NoAdmin');

  const exported = await api('/api/admin/export', { token });
  assert.equal(exported.status, 403);

  const imported = await api('/api/admin/import', {
    method: 'POST',
    token,
    body: { type: 'chellys-kitchen-backup', version: 1, users: [], recipeStore: [] },
  });
  assert.equal(imported.status, 403);
});

test('import rejects files that are not a backup', async () => {
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });

  const imported = await api('/api/admin/import', {
    method: 'POST',
    token: adminLogin.body.accessToken,
    body: { irgendwas: true },
  });
  assert.equal(imported.status, 400);
});

test('unauthenticated upload is rejected', async () => {
  const upload = await api('/api/uploads', {
    method: 'POST',
    body: { filename: 'pic.png', data: 'data:image/png;base64,AAAA' },
  });
  assert.equal(upload.status, 401);
});
