import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4900 + Math.floor(Math.random() * 100);
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = 'admin@test.local';
const ADMIN_PASSWORD = 'admintest';
const SEED_USERS = JSON.stringify([
  { name: 'Chelly', email: 'chelly@test.local', password: 'chef12345', role: 'EDITOR' },
  { name: 'Gast', email: 'gast@test.local', password: 'gast12345' },
]);

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
  return { status: res.status, body: json };
}

async function loginAsAdmin() {
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.equal(login.status, 200);
  return login.body.accessToken;
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
  dataDir = mkdtempSync(join(tmpdir(), 'ck-users-'));
  child = spawn('node', ['server.mjs'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: dataDir,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      ADMIN_NAME: 'Christoph',
      SEED_USERS,
    },
    stdio: 'ignore',
  });
  await waitForReady();
});

after(() => {
  if (child) child.kill('SIGTERM');
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('public registration endpoint no longer exists', async () => {
  const reg = await api('/api/auth/register', {
    method: 'POST',
    body: { name: 'Fremd', email: 'fremd@test.local', password: 'secret123' },
  });
  assert.equal(reg.status, 404);
});

test('the admin account carries the configured ADMIN_NAME', async () => {
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.name, 'Christoph');
});

test('users from SEED_USERS are created with their configured role', async () => {
  const editor = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'chelly@test.local', password: 'chef12345' },
  });
  assert.equal(editor.status, 200);
  assert.equal(editor.body.user.role, 'EDITOR');

  // Entries without a role default to MEMBER.
  const member = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'gast@test.local', password: 'gast12345' },
  });
  assert.equal(member.status, 200);
  assert.equal(member.body.user.role, 'MEMBER');
});

test('admin can create a user who can then log in', async () => {
  const adminToken = await loginAsAdmin();

  const created = await api('/api/admin/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'Neu', email: 'neu@test.local', password: 'secret123', role: 'MEMBER' },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.email, 'neu@test.local');
  assert.equal(created.body.role, 'MEMBER');
  assert.equal(created.body.passwordHash, undefined, 'response must not leak the password hash');
  assert.equal(created.body.salt, undefined, 'response must not leak the salt');

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'neu@test.local', password: 'secret123' },
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.id, created.body.id);
});

test('user creation defaults to MEMBER when no role is given', async () => {
  const adminToken = await loginAsAdmin();

  const created = await api('/api/admin/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'Ohne Rolle', email: 'ohne-rolle@test.local', password: 'secret123' },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.role, 'MEMBER');
});

test('user creation validates input', async () => {
  const adminToken = await loginAsAdmin();

  const missing = await api('/api/admin/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'Ohne Passwort', email: 'ohne-passwort@test.local' },
  });
  assert.equal(missing.status, 400);

  const badRole = await api('/api/admin/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'Falsche Rolle', email: 'rolle@test.local', password: 'secret123', role: 'SUPERUSER' },
  });
  assert.equal(badRole.status, 400);

  const duplicate = await api('/api/admin/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'Doppelt', email: ADMIN_EMAIL, password: 'secret123' },
  });
  assert.equal(duplicate.status, 409);
});

test('user creation is admin-only', async () => {
  const editorLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'chelly@test.local', password: 'chef12345' },
  });

  const asEditor = await api('/api/admin/users', {
    method: 'POST',
    token: editorLogin.body.accessToken,
    body: { name: 'Eindringling', email: 'eindringling@test.local', password: 'secret123' },
  });
  assert.equal(asEditor.status, 403);

  const anonymous = await api('/api/admin/users', {
    method: 'POST',
    body: { name: 'Anonym', email: 'anonym@test.local', password: 'secret123' },
  });
  assert.equal(anonymous.status, 403);
});
