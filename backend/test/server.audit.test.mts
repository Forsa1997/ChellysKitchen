import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5800 + Math.floor(Math.random() * 100);
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_USERNAME = 'audit-admin';
const ADMIN_PASSWORD = 'audit-secret';

let child: ChildProcess;
let dataDir: string;

async function api(path: string, { token, method = 'GET', body }: {
  token?: string;
  method?: string;
  body?: unknown;
} = {}) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: response.status, body: json };
}

async function login(username: string, password: string) {
  const response = await api('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  assert.equal(response.status, 200);
  return response.body.accessToken as string;
}

async function waitForReady(timeoutMs = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error('Server did not become ready in time');
}

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'ck-audit-'));
  child = spawn('node', ['server.mts'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: dataDir,
      ADMIN_USERNAME,
      ADMIN_PASSWORD,
      ADMIN_NAME: 'Audit Admin',
    },
    stdio: 'ignore',
  });
  await waitForReady();
});

after(async () => {
  if (child?.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('audit log records successful admin actions without secrets and stays admin-only', async () => {
  const adminToken = await login(ADMIN_USERNAME, ADMIN_PASSWORD);

  const viewer = await api('/api/admin/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'Viewer', username: 'viewer', password: 'viewer-secret', role: 'MEMBER' },
  });
  assert.equal(viewer.status, 201);
  const viewerToken = await login('viewer', 'viewer-secret');

  const forbidden = await api('/api/admin/audit-log', { token: viewerToken });
  assert.equal(forbidden.status, 403);

  const created = await api('/api/admin/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'Zielperson', username: 'ziel', password: 'target-secret', role: 'MEMBER' },
  });
  assert.equal(created.status, 201);
  const targetToken = await login('ziel', 'target-secret');

  let audit = await api('/api/admin/audit-log', { token: adminToken });
  const createdEntry = audit.body.data.find((entry: any) =>
    entry.action === 'USER_CREATED' && entry.target?.id === created.body.id,
  );
  assert.deepEqual(createdEntry.actor, {
    id: expectString(createdEntry.actor.id),
    name: 'Audit Admin',
    username: ADMIN_USERNAME,
  });
  assert.deepEqual(createdEntry.target, {
    type: 'USER',
    id: created.body.id,
    label: 'Zielperson',
    username: 'ziel',
  });
  assert.deepEqual(createdEntry.details, { role: 'MEMBER' });
  assert.equal(typeof createdEntry.createdAt, 'string');
  assert.doesNotMatch(JSON.stringify(createdEntry), /target-secret|passwordHash|salt/i);

  const beforeFailedChange = audit.body.total;
  const invalidRole = await api(`/api/admin/users/${created.body.id}/role`, {
    method: 'PATCH',
    token: adminToken,
    body: { role: 'SUPERUSER' },
  });
  assert.equal(invalidRole.status, 400);
  audit = await api('/api/admin/audit-log', { token: adminToken });
  assert.equal(audit.body.total, beforeFailedChange, 'failed actions must not create audit entries');

  const forbiddenDelete = await api(`/api/admin/users/${created.body.id}`, {
    method: 'DELETE',
    token: viewerToken,
  });
  assert.equal(forbiddenDelete.status, 403);
  audit = await api('/api/admin/audit-log', { token: adminToken });
  assert.equal(audit.body.total, beforeFailedChange, 'forbidden actions must not create audit entries');

  const changed = await api(`/api/admin/users/${created.body.id}/role`, {
    method: 'PATCH',
    token: adminToken,
    body: { role: 'EDITOR' },
  });
  assert.equal(changed.status, 200);
  audit = await api('/api/admin/audit-log', { token: adminToken });
  assert.deepEqual(audit.body.data[0].details, {
    previousRole: 'MEMBER',
    newRole: 'EDITOR',
  });
  assert.equal(audit.body.data[0].action, 'USER_ROLE_CHANGED');

  const selfDelete = await api(`/api/admin/users/${audit.body.data[0].actor.id}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert.equal(selfDelete.status, 400);

  const deleted = await api(`/api/admin/users/${created.body.id}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert.equal(deleted.status, 204);
  const revokedSession = await api('/api/auth/me', { token: targetToken });
  assert.equal(revokedSession.status, 401);
  const deletedLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'ziel', password: 'target-secret' },
  });
  assert.equal(deletedLogin.status, 401);

  audit = await api('/api/admin/audit-log', { token: adminToken });
  assert.equal(audit.body.data[0].action, 'USER_DELETED');
  assert.equal(audit.body.data[0].target.username, 'ziel');
  assert.deepEqual(audit.body.data[0].details, { role: 'EDITOR' });

  const backup = await api('/api/admin/export', { token: adminToken });
  assert.equal(backup.status, 200);
  assert.equal(backup.body.auditLogStore, undefined, 'audit history must not be writable through backup import');

  const imported = await api('/api/admin/import', {
    method: 'POST',
    token: adminToken,
    body: backup.body,
  });
  assert.equal(imported.status, 200);

  audit = await api('/api/admin/audit-log', { token: adminToken });
  assert.equal(audit.body.data[0].action, 'BACKUP_IMPORTED');
  assert.deepEqual(audit.body.data[0].target, { type: 'BACKUP', label: 'Backup' });
  assert.deepEqual(audit.body.data[0].details, {
    recipes: imported.body.recipes,
    users: imported.body.users,
    categories: imported.body.categories,
    uploads: imported.body.uploads,
  });
  assert.equal(audit.body.total, beforeFailedChange + 3);
});

function expectString(value: unknown) {
  assert.equal(typeof value, 'string');
  assert.ok(value);
  return value;
}
