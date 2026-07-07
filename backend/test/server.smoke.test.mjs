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

test('register logs the user in immediately (me returns the user)', async () => {
  const email = `user_${Date.now()}@test.local`;
  const reg = await api('/api/auth/register', {
    method: 'POST',
    body: { name: 'Tester', email, password: 'secret123' },
  });
  assert.equal(reg.status, 201);
  assert.ok(reg.body.accessToken, 'accessToken returned');
  assert.ok(reg.body.refreshToken, 'refreshToken returned');

  const me = await api('/api/auth/me', { token: reg.body.accessToken });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, email);
});

test('recipe create -> update -> publish flow and admin role update', async () => {
  // Member creates a recipe
  const member = await api('/api/auth/register', {
    method: 'POST',
    body: { name: 'Cook', email: `cook_${Date.now()}@test.local`, password: 'secret123' },
  });
  const token = member.body.accessToken;

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
  const memberId = member.body.user.id;
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
  const uploader = await api('/api/auth/register', {
    method: 'POST',
    body: { name: 'Up', email: `up_${Date.now()}@test.local`, password: 'secret123' },
  });
  const token = uploader.body.accessToken;

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

test('unauthenticated upload is rejected', async () => {
  const upload = await api('/api/uploads', {
    method: 'POST',
    body: { filename: 'pic.png', data: 'data:image/png;base64,AAAA' },
  });
  assert.equal(upload.status, 401);
});
